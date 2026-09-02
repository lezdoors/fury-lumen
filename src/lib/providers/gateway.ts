import {
  generateImage,
  experimental_getVideoStatus as getVideoStatus,
  experimental_startVideo as startVideo,
} from "ai";
import { gateway } from "@ai-sdk/gateway";
import { canPersist, saveGeneratedAsset } from "../files";
import type { AspectRatio, GenerationInput, GenerationJob, ProviderModel } from "../types";
import type { GenerationProvider, PollOutcome, SubmitOutcome } from "./provider";

/**
 * Vercel's AI Gateway reaches thirty-six video and thirty-one image models
 * behind the key already on the team's invoice, so a second provider here is
 * not a second bill or a second account. It earns its place where it is cheaper
 * than fal for the same model — the catalogue records both prices and the
 * console quotes whichever wins.
 */

function requireKey() {
  const key = process.env.AI_GATEWAY_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "AI_GATEWAY_API_KEY is not configured. Add it to .env.local and restart.",
    );
  }
  return key;
}

const MIME: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
};

function extensionOf(mediaType: string | undefined, fallback: string) {
  const subtype = mediaType?.split("/")[1]?.split(";")[0]?.toLowerCase();
  if (!subtype) return fallback;
  return subtype === "jpeg" ? "jpg" : subtype;
}

function describe(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/401|authentication/i.test(message)) return "AI_GATEWAY_API_KEY is invalid or revoked.";
  if (/402|payment|budget|credit/i.test(message)) {
    return "The gateway refused the request — the key's spend budget is exhausted.";
  }
  return message;
}

/** The SDK types an aspect ratio as `n:n`, which our own union already satisfies. */
function ratio(value: AspectRatio) {
  return value as `${number}:${number}`;
}

/**
 * The catalogue quotes every gateway video at 720p with audio off, and the
 * gateway prices those two dimensions separately — Veo 3.1 is $0.20/sec muted
 * and $0.40/sec with sound. Leaving either to a provider default would put a
 * number on the button that the invoice then contradicts, so both are pinned
 * here and the catalogue comment points back at this function.
 *
 * 720p means the short side, so a vertical frame is 720x1280 rather than a
 * letterboxed 1280x720.
 */
const RESOLUTION_720: Record<AspectRatio, `${number}x${number}`> = {
  "16:9": "1280x720",
  "9:16": "720x1280",
  "1:1": "720x720",
  "4:5": "720x900",
  "3:4": "720x960",
};

export class GatewayProvider implements GenerationProvider {
  id = "gateway";

  async submit(input: GenerationInput, model: ProviderModel): Promise<SubmitOutcome> {
    requireKey();
    const modelId = model.endpoint ?? model.id;

    if (model.mediaKind === "image") {
      // Stills come back inline within one request, so there is nothing to poll.
      try {
        const { image } = await generateImage({
          model: gateway.imageModel(modelId),
          prompt: input.prompt,
          aspectRatio: ratio(input.aspectRatio),
        });
        const extension = extensionOf(image.mediaType, "png");
        const assetUrl = (await canPersist())
          ? await saveGeneratedAsset(
              crypto.randomUUID(),
              extension,
              Buffer.from(image.uint8Array),
            )
          : `data:${image.mediaType ?? "image/png"};base64,${image.base64}`;

        return {
          kind: "complete",
          result: {
            assetUrl,
            mimeType: image.mediaType ?? MIME[extension] ?? "image/png",
            actualCostUsd: model.estimatedCostUsd,
          },
        };
      } catch (error) {
        throw new Error(describe(error));
      }
    }

    try {
      const started = await startVideo({
        model: gateway.videoModel(modelId),
        prompt: input.prompt,
        aspectRatio: ratio(input.aspectRatio),
        resolution: RESOLUTION_720[input.aspectRatio],
        generateAudio: false,
        duration: input.durationSeconds,
        ...(input.referenceUrls?.[0]
          ? {
              frameImages: [
                { image: input.referenceUrls[0], frameType: "first_frame" as const },
              ],
            }
          : {}),
      });
      // The handle is an opaque object and the job record has one text column
      // for it, so it is serialised in rather than forcing a schema change.
      return {
        kind: "pending",
        providerJobId: JSON.stringify(started.operation),
        providerEndpoint: modelId,
      };
    } catch (error) {
      throw new Error(describe(error));
    }
  }

  async poll(job: GenerationJob): Promise<PollOutcome> {
    requireKey();
    if (!job.providerJobId || !job.providerEndpoint) {
      return { kind: "failed", error: "Job is missing its gateway operation handle." };
    }

    let operation: unknown;
    try {
      operation = JSON.parse(job.providerJobId);
    } catch {
      return { kind: "failed", error: "The gateway operation handle is unreadable." };
    }

    let status;
    try {
      status = await getVideoStatus(gateway.videoModel(job.providerEndpoint), {
        operation: operation as Parameters<typeof getVideoStatus>[1]["operation"],
      });
    } catch (error) {
      return { kind: "failed", error: describe(error) };
    }

    if (status.status === "error") return { kind: "failed", error: status.error };
    if (status.status !== "completed") return { kind: "pending" };

    const video = status.videos[0];
    if (!video) {
      return { kind: "failed", error: "The gateway completed but returned no video." };
    }

    const extension = extensionOf(video.mediaType, "mp4");

    // A gateway URL expires in exactly the way fal's does, so the durable copy
    // is the one written here. Where nothing can be written, the provider's own
    // URL still beats failing a generation that has already been paid for.
    let assetUrl = video.type === "url" ? video.url : undefined;
    if (await canPersist()) {
      let bytes: Buffer | undefined;
      if (video.type === "binary") bytes = Buffer.from(video.data);
      else if (video.type === "base64") bytes = Buffer.from(video.data, "base64");
      else {
        const download = await fetch(video.url);
        if (!download.ok) {
          return {
            kind: "failed",
            error: `Could not download the finished video (${download.status}).`,
          };
        }
        bytes = Buffer.from(await download.arrayBuffer());
      }
      assetUrl = await saveGeneratedAsset(crypto.randomUUID(), extension, bytes);
    } else if (video.type !== "url") {
      assetUrl = `data:${video.mediaType};base64,${
        video.type === "base64" ? video.data : Buffer.from(video.data).toString("base64")
      }`;
    }

    if (!assetUrl) {
      return { kind: "failed", error: "The gateway returned a video with no readable body." };
    }

    return {
      kind: "complete",
      result: {
        assetUrl,
        mimeType: video.mediaType ?? MIME[extension] ?? "video/mp4",
        actualCostUsd: job.estimatedCostUsd,
      },
    };
  }
}
