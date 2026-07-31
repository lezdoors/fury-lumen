import type { GenerationProvider } from "./provider";
import { FalVideoProvider } from "./fal";
import { MockProvider } from "./mock";
import { OpenAIImageProvider } from "./openai";

const providers: Record<string, GenerationProvider> = {
  mock: new MockProvider(),
  fal: new FalVideoProvider(),
  openai: new OpenAIImageProvider(),
};

export function getProvider(id: string) {
  return providers[id];
}
