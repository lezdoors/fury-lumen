import type { ProviderModel } from "./types";

/**
 * Fal bills video per second of output, so cost is declared per second and the
 * estimate is computed from the chosen duration. Rates are unverified against
 * fal's live catalogue — treat them as a spend sanity check, not a quote, and
 * confirm at https://fal.ai/models before relying on a number.
 */
const falVideoModels: Array<{
  endpoint: string;
  label: string;
  costPerSecondUsd: number;
  durations: number[];
}> = [
  {
    endpoint: "fal-ai/kling-video/v1/standard/text-to-video",
    label: "Kling standard · text to video",
    costPerSecondUsd: 0.09,
    durations: [5, 10],
  },
  {
    endpoint: "fal-ai/kling-video/v1/standard/image-to-video",
    label: "Kling standard · image to video",
    costPerSecondUsd: 0.09,
    durations: [5, 10],
  },
  {
    endpoint: "fal-ai/kling-video/v1/pro/text-to-video",
    label: "Kling pro · text to video",
    costPerSecondUsd: 0.19,
    durations: [5, 10],
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
    ...falVideoModels.map((model) => ({
      id: model.endpoint,
      endpoint: model.endpoint,
      providerId: "fal",
      providerLabel: "Fal direct",
      label: model.label,
      mediaKind: "video" as const,
      available: falReady,
      availabilityReason: falReady ? undefined : "Add FAL_KEY to .env.local",
      estimatedCostUsd: 0,
      costPerSecondUsd: model.costPerSecondUsd,
      durations: model.durations,
      asynchronous: true,
    })),
    {
      id: process.env.OPENAI_IMAGE_MODEL ?? "openai-image",
      providerId: "openai",
      providerLabel: "OpenAI direct",
      label: process.env.OPENAI_IMAGE_MODEL ?? "Configure OPENAI_IMAGE_MODEL",
      mediaKind: "image",
      available: openAIReady,
      availabilityReason: openAIReady
        ? undefined
        : "Add OPENAI_API_KEY and OPENAI_IMAGE_MODEL",
      estimatedCostUsd: Number.isFinite(openAICost) ? openAICost : 0,
    },
  ];
}
