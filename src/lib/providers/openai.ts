import { saveGeneratedAsset } from "../files";
import type { GenerationInput, GenerationResult, ProviderModel } from "../types";
import type { GenerationProvider } from "./provider";

function openAISize(aspectRatio: GenerationInput["aspectRatio"]) {
  if (aspectRatio === "1:1") return "1024x1024";
  return ["4:5", "3:4", "9:16"].includes(aspectRatio) ? "1024x1536" : "1536x1024";
}

export class OpenAIImageProvider implements GenerationProvider {
  id = "openai";

  async generate(input: GenerationInput, model: ProviderModel): Promise<GenerationResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || !process.env.OPENAI_IMAGE_MODEL) {
      throw new Error("OpenAI direct is not configured.");
    }

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model.id,
        prompt: input.prompt,
        size: openAISize(input.aspectRatio),
        response_format: "b64_json",
      }),
    });

    const payload = (await response.json()) as {
      data?: Array<{ b64_json?: string; url?: string }>;
      error?: { message?: string };
    };
    if (!response.ok) {
      throw new Error(payload.error?.message ?? `OpenAI returned ${response.status}`);
    }

    const result = payload.data?.[0];
    if (result?.b64_json) {
      const assetUrl = await saveGeneratedAsset(
        crypto.randomUUID(),
        "png",
        Buffer.from(result.b64_json, "base64"),
      );
      return { assetUrl, mimeType: "image/png", actualCostUsd: model.estimatedCostUsd };
    }
    if (result?.url) {
      return { assetUrl: result.url, mimeType: "image/png", actualCostUsd: model.estimatedCostUsd };
    }
    throw new Error("OpenAI returned no image asset.");
  }
}
