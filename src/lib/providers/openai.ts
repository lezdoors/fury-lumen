import { saveGeneratedAsset } from "../files";
import type { GenerationInput, ProviderModel } from "../types";
import type { GenerationProvider, SubmitOutcome } from "./provider";

function openAISize(aspectRatio: GenerationInput["aspectRatio"]) {
  if (aspectRatio === "1:1") return "1024x1024";
  return ["4:5", "3:4", "9:16"].includes(aspectRatio) ? "1024x1536" : "1536x1024";
}

export class OpenAIImageProvider implements GenerationProvider {
  id = "openai";

  async submit(input: GenerationInput, model: ProviderModel): Promise<SubmitOutcome> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || !process.env.OPENAI_IMAGE_MODEL) {
      throw new Error("OpenAI direct is not configured.");
    }

    // response_format is deliberately omitted: gpt-image-* rejects it and always
    // returns b64, while dall-e-* defaults to a URL. Both shapes are handled below.
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
      return {
        kind: "complete",
        result: { assetUrl, mimeType: "image/png", actualCostUsd: model.estimatedCostUsd },
      };
    }
    if (result?.url) {
      return {
        kind: "complete",
        result: { assetUrl: result.url, mimeType: "image/png", actualCostUsd: model.estimatedCostUsd },
      };
    }
    throw new Error("OpenAI returned no image asset.");
  }
}
