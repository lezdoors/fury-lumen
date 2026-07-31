import type { BrandId, ProviderModel } from "./types";

export const brands: Record<BrandId, { name: string; code: string; note: string }> = {
  "maison-tanneurs": {
    name: "Maison Tanneurs",
    code: "MT",
    note: "Leather house · editorial assets only",
  },
  "maison-izem": {
    name: "Maison Izem",
    code: "MI",
    note: "Home collection · separate asset lineage",
  },
};

export function getModels(): ProviderModel[] {
  const openAIReady = Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_IMAGE_MODEL);
  const openAICost = Number(process.env.OPENAI_IMAGE_COST_USD ?? "0");

  return [
    {
      id: "atelier-proof",
      providerId: "mock",
      providerLabel: "Atelier",
      label: "Proof mode",
      mediaKind: "image",
      available: true,
      estimatedCostUsd: 0,
    },
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
