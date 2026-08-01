import type { ProviderModel } from "./types";

/**
 * Verified against fal's own model API (`https://fal.ai/api/models`) on
 * 2026-07-31 — ids and per-second prices are quoted from its
 * `pricingInfoOverride` strings, not estimated.
 *
 * Two things learned the hard way, worth keeping written down:
 *
 * 1. Endpoint paths go stale fast. This catalogue previously carried
 *    `fal-ai/kling-video/v1/...`, which no longer exists — Kling is on v3, plus
 *    v2.6, v2.5-turbo and o3. A request to a dead path is still *accepted* by
 *    the queue, because the app exists even when the version path does not, and
 *    only fails later with "Path ... not found". It does not 404 at submit time,
 *    so a stale id looks fine until a generation quietly dies.
 *
 * 2. Price spans an order of magnitude here. Seedance 2.0 at 1080p is roughly
 *    fifteen times Hailuo 02 per second. Putting the real number on the button
 *    before the click is the whole point of Lumen, so re-check these whenever a
 *    model is added.
 */
const FAL_VIDEO: Array<{
  endpoint: string;
  label: string;
  costPerSecondUsd: number;
  durations: number[];
  note?: string;
}> = [
  {
    endpoint: "fal-ai/minimax/hailuo-02/standard/text-to-video",
    label: "Hailuo 02 · text to video",
    costPerSecondUsd: 0.045,
    durations: [6, 10],
  },
  {
    endpoint: "fal-ai/minimax/hailuo-02/standard/image-to-video",
    label: "Hailuo 02 · image to video",
    costPerSecondUsd: 0.045,
    durations: [6, 10],
    note: "768p. 512p costs roughly a third.",
  },
  {
    endpoint: "fal-ai/kling-video/v2.5-turbo/pro/text-to-video",
    label: "Kling 2.5 Turbo Pro · text to video",
    costPerSecondUsd: 0.07,
    durations: [5, 10],
  },
  {
    endpoint: "fal-ai/kling-video/v2.5-turbo/pro/image-to-video",
    label: "Kling 2.5 Turbo Pro · image to video",
    costPerSecondUsd: 0.07,
    durations: [5, 10],
  },
  {
    endpoint: "fal-ai/kling-video/v3/standard/text-to-video",
    label: "Kling 3 Standard · text to video",
    costPerSecondUsd: 0.084,
    durations: [5, 10],
    note: "Audio on raises this to $0.126/s.",
  },
  {
    endpoint: "bytedance/seedance-2.0/text-to-video",
    label: "Seedance 2.0 · text to video",
    costPerSecondUsd: 0.3034,
    durations: [5, 10],
    note: "720p. 1080p is $0.682/s — more than double.",
  },
  {
    endpoint: "bytedance/seedance-2.0/image-to-video",
    label: "Seedance 2.0 · image to video",
    costPerSecondUsd: 0.3034,
    durations: [5, 10],
    note: "720p. 1080p is $0.682/s — more than double.",
  },
];

export function getModels(): ProviderModel[] {
  const openAIReady = Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_IMAGE_MODEL);
  const openAICost = Number(process.env.OPENAI_IMAGE_COST_USD ?? "0");
  const falReady = Boolean(process.env.FAL_KEY);

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
      availabilityReason: falReady ? model.note : "Add FAL_KEY to .env.local",
      estimatedCostUsd: 0,
      costPerSecondUsd: model.costPerSecondUsd,
      durations: model.durations,
      asynchronous: true,
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
