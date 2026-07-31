import { saveGeneratedAsset } from "../files";
import { estimateCost } from "../types";
import type { GenerationInput, GenerationJob, ProviderModel } from "../types";
import type { GenerationProvider, PollOutcome, SubmitOutcome } from "./provider";

const QUEUE_BASE = "https://queue.fal.run";

/**
 * Fal submits to the full endpoint but reports status against the *app id* —
 * the first two path segments only. `fal-ai/kling-video/v1/standard/text-to-video`
 * polls at `fal-ai/kling-video/requests/{id}/status`. Polling the full path 404s.
 */
export function appId(endpoint: string) {
  const parts = endpoint.split("/").filter(Boolean);
  return parts.length >= 2 ? parts.slice(0, 2).join("/") : endpoint;
}

function authHeaders(key: string) {
  return { Authorization: `Key ${key}`, "Content-Type": "application/json" };
}

function requireKey() {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error("FAL_KEY is not configured. Add it to .env.local and restart.");
  return key;
}

function describeFailure(status: number, body: unknown) {
  const detail =
    typeof body === "object" && body !== null
      ? ((body as Record<string, unknown>).detail ??
        (body as Record<string, unknown>).error ??
        (body as Record<string, unknown>).message)
      : undefined;
  const text = typeof detail === "string" ? detail : detail ? JSON.stringify(detail) : "";
  const hints: Record<number, string> = {
    401: "FAL_KEY is invalid or revoked.",
    403: "Fal refused the request — usually an exhausted balance.",
    404: "No such fal endpoint. Check the model id.",
    422: "Fal rejected a payload field for this model.",
    429: "Fal rate limited the request.",
  };
  return [hints[status] ?? `Fal returned ${status}.`, text].filter(Boolean).join(" ");
}

/** Result payloads vary by model (`video.url`, `videos[].url`, ...). */
function findVideoUrl(node: unknown): string | undefined {
  if (typeof node === "string") {
    return /^https?:\/\/.*\.(mp4|webm|mov)(\?|$)/i.test(node) ? node : undefined;
  }
  if (Array.isArray(node)) {
    for (const entry of node) {
      const found = findVideoUrl(entry);
      if (found) return found;
    }
    return undefined;
  }
  if (typeof node === "object" && node !== null) {
    for (const value of Object.values(node)) {
      const found = findVideoUrl(value);
      if (found) return found;
    }
  }
  return undefined;
}

export class FalVideoProvider implements GenerationProvider {
  id = "fal";

  async submit(input: GenerationInput, model: ProviderModel): Promise<SubmitOutcome> {
    const key = requireKey();
    const endpoint = model.endpoint ?? model.id;

    const payload: Record<string, unknown> = {
      prompt: input.prompt,
      aspect_ratio: input.aspectRatio,
    };
    if (input.durationSeconds) payload.duration = String(input.durationSeconds);
    // A reference image switches the model into image-to-video. The caller is
    // responsible for choosing an image-to-video endpoint when it passes one.
    if (input.referenceUrls?.length) payload.image_url = input.referenceUrls[0];

    const response = await fetch(`${QUEUE_BASE}/${endpoint}`, {
      method: "POST",
      headers: authHeaders(key),
      body: JSON.stringify(payload),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(describeFailure(response.status, body));

    const requestId = (body as { request_id?: string }).request_id;
    if (!requestId) throw new Error("Fal accepted the request but returned no request_id.");

    return { kind: "pending", providerJobId: requestId, providerEndpoint: endpoint };
  }

  async poll(job: GenerationJob): Promise<PollOutcome> {
    const key = requireKey();
    if (!job.providerJobId || !job.providerEndpoint) {
      return { kind: "failed", error: "Job is missing its fal request handle." };
    }
    const base = `${QUEUE_BASE}/${appId(job.providerEndpoint)}/requests/${job.providerJobId}`;

    const statusResponse = await fetch(`${base}/status`, {
      headers: authHeaders(key),
      cache: "no-store",
    });
    const statusBody = await statusResponse.json().catch(() => ({}));
    if (!statusResponse.ok) {
      return { kind: "failed", error: describeFailure(statusResponse.status, statusBody) };
    }

    const state = (statusBody as { status?: string }).status;
    const queuePosition = (statusBody as { queue_position?: number }).queue_position;

    if (state === "IN_QUEUE" || state === "IN_PROGRESS") {
      return { kind: "pending", queuePosition };
    }
    if (state !== "COMPLETED") {
      return { kind: "failed", error: `Fal reported ${state ?? "an unknown state"}.` };
    }

    const resultResponse = await fetch(base, { headers: authHeaders(key), cache: "no-store" });
    const resultBody = await resultResponse.json().catch(() => ({}));
    if (!resultResponse.ok) {
      return { kind: "failed", error: describeFailure(resultResponse.status, resultBody) };
    }

    const remoteUrl = findVideoUrl(resultBody);
    if (!remoteUrl) return { kind: "failed", error: "Fal completed but returned no video asset." };

    // Fal's CDN URLs expire. The local copy is the artifact.
    const download = await fetch(remoteUrl);
    if (!download.ok) {
      return { kind: "failed", error: `Could not download the finished video (${download.status}).` };
    }
    const bytes = Buffer.from(await download.arrayBuffer());
    const assetUrl = await saveGeneratedAsset(crypto.randomUUID(), "mp4", bytes);

    return {
      kind: "complete",
      result: {
        assetUrl,
        mimeType: "video/mp4",
        providerJobId: job.providerJobId,
        actualCostUsd: job.estimatedCostUsd,
      },
    };
  }
}

export { estimateCost };
