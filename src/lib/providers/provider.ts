import type { GenerationInput, GenerationResult, ProviderModel } from "../types";

export interface GenerationProvider {
  id: string;
  generate(input: GenerationInput, model: ProviderModel): Promise<GenerationResult>;
}
