import type { ProviderModel } from "./types";

/**
 * Every number here was read off fal's own APIs on **2026-09-01**:
 *
 *   prices    `https://fal.ai/api/models` → `pricingInfoOverride`
 *   durations `https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=…`
 *             → the `duration` enum the endpoint actually accepts
 *
 * Nothing in this file is estimated, rounded up, or remembered. The landing
 * page prints these figures verbatim, so a guess here becomes a false claim on
 * a public site.
 *
 * Three things learned the hard way, worth keeping written down:
 *
 * 1. Endpoint paths go stale fast. A request to a dead path is still *accepted*
 *    by the queue — the app exists even when the version path does not — and
 *    only fails later with "Path … not found". A stale id looks fine right up
 *    until a generation quietly dies.
 *
 * 2. Durations are not interchangeable between families. Veo 3.1 takes 4/6/8
 *    and rejects 5. Hailuo 02 Pro takes no duration at all — it is always six
 *    seconds. Offering a duration a model refuses turns a priced button into a
 *    failed generation the operator still waited for.
 *
 * 3. Price spans 16× inside video alone: Veo 3.1 Lite at $0.03/sec against
 *    Seedance 2.5 at $0.473/sec (1080p). Putting the real number on the button
 *    before the click is the whole point of Lumen. Re-check on every addition.
 */

interface FalVideo {
  endpoint: string;
  label: string;
  family: string;
  costPerSecondUsd: number;
  durations: number[];
  /** Exactly what the price covers. Shown next to the figure, never omitted. */
  basis: string;
  note?: string;
}

/** Video, cheapest per second first. */
const FAL_VIDEO: FalVideo[] = [
  {
    endpoint: "fal-ai/veo3.1/lite",
    label: "Veo 3.1 Lite · text to video",
    family: "Veo",
    costPerSecondUsd: 0.03,
    durations: [4, 6, 8],
    basis: "720p, audio off",
    note: "Audio on is $0.05/sec. 1080p is $0.08/sec with audio.",
  },
  {
    endpoint: "fal-ai/veo3.1/lite/image-to-video",
    label: "Veo 3.1 Lite · image to video",
    family: "Veo",
    costPerSecondUsd: 0.03,
    durations: [4, 6, 8],
    basis: "720p, audio off",
    note: "Audio on is $0.05/sec.",
  },
  {
    endpoint: "fal-ai/minimax/hailuo-02/standard/text-to-video",
    label: "Hailuo 02 Standard · text to video",
    family: "Hailuo",
    costPerSecondUsd: 0.045,
    durations: [6, 10],
    basis: "768p",
    note: "512p is roughly $0.017/sec.",
  },
  {
    endpoint: "fal-ai/minimax/hailuo-02/standard/image-to-video",
    label: "Hailuo 02 Standard · image to video",
    family: "Hailuo",
    costPerSecondUsd: 0.045,
    durations: [6, 10],
    basis: "768p",
  },
  {
    endpoint: "alibaba/wan-3.0/text-to-video",
    label: "Wan 3.0 · text to video",
    family: "Wan",
    costPerSecondUsd: 0.05,
    durations: [4, 5, 6, 8, 10],
    basis: "480p",
    note: "720p is $0.10/sec. Accepts any length from 2 to 30 seconds.",
  },
  {
    endpoint: "fal-ai/kling-video/v2.5-turbo/pro/text-to-video",
    label: "Kling 2.5 Turbo Pro · text to video",
    family: "Kling",
    costPerSecondUsd: 0.07,
    durations: [5, 10],
    basis: "per second",
  },
  {
    endpoint: "bytedance/seedance-2.0/mini/text-to-video",
    label: "Seedance 2.0 Mini · text to video",
    family: "Seedance",
    costPerSecondUsd: 0.0721,
    durations: [4, 5, 6, 8, 10],
    basis: "480p",
  },
  {
    endpoint: "fal-ai/minimax/hailuo-02/pro/text-to-video",
    label: "Hailuo 02 Pro · text to video",
    family: "Hailuo",
    costPerSecondUsd: 0.08,
    durations: [6],
    basis: "per second",
    note: "Fixed at six seconds — $0.48 a clip.",
  },
  {
    endpoint: "fal-ai/kling-video/v3/standard/text-to-video",
    label: "Kling 3 Standard · text to video",
    family: "Kling",
    costPerSecondUsd: 0.084,
    durations: [3, 5, 10],
    basis: "audio off",
    note: "Audio on is $0.126/sec.",
  },
  {
    endpoint: "fal-ai/veo3.1/fast",
    label: "Veo 3.1 Fast · text to video",
    family: "Veo",
    costPerSecondUsd: 0.1,
    durations: [4, 6, 8],
    basis: "720p / 1080p, audio off",
    note: "Audio on is $0.15/sec.",
  },
  {
    endpoint: "fal-ai/kling-video/v3/pro/text-to-video",
    label: "Kling 3 Pro · text to video",
    family: "Kling",
    costPerSecondUsd: 0.112,
    durations: [3, 5, 10],
    basis: "audio off",
    note: "Audio on is $0.168/sec.",
  },
  {
    endpoint: "fal-ai/veo3.1",
    label: "Veo 3.1 · text to video",
    family: "Veo",
    costPerSecondUsd: 0.2,
    durations: [4, 6, 8],
    basis: "720p / 1080p, audio off",
    note: "Audio on is $0.40/sec — the audio doubles it.",
  },
  {
    endpoint: "bytedance/seedance-2.5/text-to-video",
    label: "Seedance 2.5 · text to video",
    family: "Seedance",
    costPerSecondUsd: 0.2205,
    durations: [4, 5, 6, 8, 10],
    basis: "480p",
    note: "1080p is $0.473/sec — the dearest second on the list.",
  },
  {
    endpoint: "bytedance/seedance-2.0/text-to-video",
    label: "Seedance 2.0 · text to video",
    family: "Seedance",
    costPerSecondUsd: 0.3034,
    durations: [4, 5, 6, 8, 10],
    basis: "720p",
  },
];

interface FalImage {
  endpoint: string;
  label: string;
  family: string;
  costUsd: number;
  basis: string;
  note?: string;
}

/** Stills, cheapest first. Flat per image — no duration to multiply by. */
const FAL_IMAGE: FalImage[] = [
  {
    endpoint: "fal-ai/kling-image/o3/text-to-image",
    label: "Kling Image o3",
    family: "Kling",
    costUsd: 0.028,
    basis: "per image, 1K / 2K",
    note: "4K is double. Does not accept 4:5 — use 1:1 or 3:4.",
  },
  {
    endpoint: "fal-ai/flux-2-pro",
    label: "FLUX.2 Pro",
    family: "FLUX",
    costUsd: 0.03,
    basis: "first megapixel",
    note: "Each extra megapixel is $0.015.",
  },
  {
    endpoint: "fal-ai/nano-banana",
    label: "Nano Banana",
    family: "Nano Banana",
    costUsd: 0.039,
    basis: "per image",
  },
  {
    endpoint: "fal-ai/nano-banana-2",
    label: "Nano Banana 2",
    family: "Nano Banana",
    costUsd: 0.08,
    basis: "per image, 1K",
    note: "2K is 1.5×, 4K is 2×.",
  },
  {
    endpoint: "fal-ai/gemini-3.1-flash-image-preview",
    label: "Gemini 3.1 Flash Image",
    family: "Gemini",
    costUsd: 0.08,
    basis: "per image",
  },
  {
    endpoint: "fal-ai/nano-banana-pro",
    label: "Nano Banana Pro",
    family: "Nano Banana",
    costUsd: 0.15,
    basis: "per image",
    note: "4K is double.",
  },
  {
    endpoint: "fal-ai/gemini-3-pro-image-preview",
    label: "Gemini 3 Pro Image",
    family: "Gemini",
    costUsd: 0.15,
    basis: "per image",
    note: "4K is double.",
  },
];

/** The date every price and duration above was read from fal. */
export const CATALOG_VERIFIED_ON = "2026-09-01";

/** What the landing page counts. Proof mode is not a model and is not counted. */
export const CATALOG_SIZE = FAL_VIDEO.length + FAL_IMAGE.length;

export interface PriceRow {
  endpoint: string;
  label: string;
  family: string;
  mediaKind: "image" | "video";
  /** Per second for video, per image for stills. */
  unitCostUsd: number;
  basis: string;
  note?: string;
  /** Cheapest complete generation this model will actually accept. */
  shortestSeconds?: number;
  /** Every length the endpoint accepts. Empty for stills. */
  durations?: number[];
  cheapestRunUsd: number;
}

/**
 * The price list, in the form the marketing page needs it: one row per model,
 * with the cost of the shortest run the model accepts already worked out. A
 * page that says "from $0.12" must be able to point at the row it came from.
 */
export function getPriceList(): PriceRow[] {
  const video: PriceRow[] = FAL_VIDEO.map((model) => {
    const shortest = Math.min(...model.durations);
    return {
      endpoint: model.endpoint,
      label: model.label,
      family: model.family,
      mediaKind: "video" as const,
      unitCostUsd: model.costPerSecondUsd,
      basis: model.basis,
      note: model.note,
      shortestSeconds: shortest,
      durations: model.durations,
      cheapestRunUsd: Number((model.costPerSecondUsd * shortest).toFixed(4)),
    };
  });

  const image: PriceRow[] = FAL_IMAGE.map((model) => ({
    endpoint: model.endpoint,
    label: model.label,
    family: model.family,
    mediaKind: "image" as const,
    unitCostUsd: model.costUsd,
    basis: model.basis,
    note: model.note,
    cheapestRunUsd: model.costUsd,
  }));

  return [...video, ...image];
}

export function getModels(): ProviderModel[] {
  const openAIReady = Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_IMAGE_MODEL);
  const openAICost = Number(process.env.OPENAI_IMAGE_COST_USD ?? "0");
  const falReady = Boolean(process.env.FAL_KEY);
  const falWhy = falReady ? undefined : "Add FAL_KEY to .env.local";

  return [
    {
      id: "lumen-proof",
      providerId: "mock",
      providerLabel: "Lumen",
      label: "Proof mode · image",
      mediaKind: "image",
      available: true,
      estimatedCostUsd: 0,
    },
    {
      id: "lumen-proof-video",
      providerId: "mock",
      providerLabel: "Lumen",
      label: "Proof mode · video",
      mediaKind: "video",
      available: true,
      estimatedCostUsd: 0,
      costPerSecondUsd: 0,
      durations: [5, 10],
      asynchronous: true,
    },
    ...FAL_VIDEO.map((model) => ({
      id: model.endpoint,
      endpoint: model.endpoint,
      providerId: "fal",
      providerLabel: "Fal",
      label: model.label,
      mediaKind: "video" as const,
      available: falReady,
      availabilityReason: falReady ? model.note : falWhy,
      estimatedCostUsd: 0,
      costPerSecondUsd: model.costPerSecondUsd,
      durations: model.durations,
      asynchronous: true,
    })),
    ...FAL_IMAGE.map((model) => ({
      id: model.endpoint,
      endpoint: model.endpoint,
      providerId: "fal",
      providerLabel: "Fal",
      label: model.label,
      mediaKind: "image" as const,
      available: falReady,
      availabilityReason: falReady ? model.note : falWhy,
      estimatedCostUsd: model.costUsd,
    })),
    {
      id: process.env.OPENAI_IMAGE_MODEL || "openai-image",
      providerId: "openai",
      providerLabel: "OpenAI",
      label: process.env.OPENAI_IMAGE_MODEL || "OpenAI image · not configured",
      mediaKind: "image",
      available: openAIReady,
      availabilityReason: openAIReady ? undefined : "Add OPENAI_API_KEY and OPENAI_IMAGE_MODEL",
      estimatedCostUsd: Number.isFinite(openAICost) ? openAICost : 0,
    },
  ];
}
