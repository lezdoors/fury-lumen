import { getModels } from "@/lib/catalog";
import { getProvider } from "@/lib/providers";
import { createJob, listJobs, updateJob } from "@/lib/store";
import type { BrandId, GenerationInput, GenerationJob } from "@/lib/types";

const brandIds: BrandId[] = ["maison-tanneurs", "maison-izem"];
const aspectRatios = ["1:1", "4:5", "3:4", "16:9", "9:16"];

export async function GET() {
  return Response.json({ jobs: await listJobs() });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<GenerationInput>;
  const prompt = body.prompt?.trim();
  const model = getModels().find(
    (entry) => entry.id === body.modelId && entry.providerId === body.providerId,
  );

  if (!prompt || prompt.length < 3) {
    return Response.json({ error: "Prompt must contain at least three characters." }, { status: 400 });
  }
  if (!body.brandId || !brandIds.includes(body.brandId)) {
    return Response.json({ error: "Choose a valid brand." }, { status: 400 });
  }
  if (!body.aspectRatio || !aspectRatios.includes(body.aspectRatio)) {
    return Response.json({ error: "Choose a valid aspect ratio." }, { status: 400 });
  }
  if (!model || !model.available) {
    return Response.json({ error: model?.availabilityReason ?? "Model is unavailable." }, { status: 400 });
  }

  const provider = getProvider(model.providerId);
  if (!provider) {
    return Response.json({ error: "Provider adapter is unavailable." }, { status: 400 });
  }

  const input: GenerationInput = {
    brandId: body.brandId,
    prompt,
    providerId: model.providerId,
    modelId: model.id,
    mediaKind: model.mediaKind,
    aspectRatio: body.aspectRatio as GenerationInput["aspectRatio"],
    referenceUrls: body.referenceUrls ?? [],
  };
  const job: GenerationJob = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: "running",
    reviewStatus: "unreviewed",
    estimatedCostUsd: model.estimatedCostUsd,
  };
  await createJob(job);

  try {
    const result = await provider.generate(input, model);
    const completed = await updateJob(job.id, {
      status: "completed",
      completedAt: new Date().toISOString(),
      assetUrl: result.assetUrl,
      mimeType: result.mimeType,
      actualCostUsd: result.actualCostUsd,
    });
    return Response.json({ job: completed }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed.";
    const failed = await updateJob(job.id, {
      status: "failed",
      completedAt: new Date().toISOString(),
      error: message,
    });
    return Response.json({ error: message, job: failed }, { status: 502 });
  }
}
