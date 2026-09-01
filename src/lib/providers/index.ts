import type { GenerationProvider } from "./provider";
import { FalProvider } from "./fal";
import { MockProvider } from "./mock";
import { OpenAIImageProvider } from "./openai";

const providers: Record<string, GenerationProvider> = {
  mock: new MockProvider(),
  fal: new FalProvider(),
  openai: new OpenAIImageProvider(),
};

export function getProvider(id: string) {
  return providers[id];
}
