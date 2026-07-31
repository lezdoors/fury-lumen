import type { GenerationProvider } from "./provider";
import { MockProvider } from "./mock";
import { OpenAIImageProvider } from "./openai";

const providers: Record<string, GenerationProvider> = {
  mock: new MockProvider(),
  openai: new OpenAIImageProvider(),
};

export function getProvider(id: string) {
  return providers[id];
}
