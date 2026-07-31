import type {
  GenerationInput,
  GenerationJob,
  GenerationResult,
  ProviderModel,
} from "../types";

/**
 * Submitting is deliberately separate from collecting the result.
 *
 * Image models return in seconds and can answer inline. Video models queue the
 * work and take one to four minutes — far past any HTTP route budget. Holding a
 * request open for that long loses the job when the tab closes and blocks the
 * composer, so async providers hand back a handle and Lumen polls for it.
 */
export type SubmitOutcome =
  | { kind: "complete"; result: GenerationResult }
  | { kind: "pending"; providerJobId: string; providerEndpoint: string };

export type PollOutcome =
  | { kind: "pending"; queuePosition?: number }
  | { kind: "complete"; result: GenerationResult }
  | { kind: "failed"; error: string };

export interface GenerationProvider {
  id: string;
  submit(input: GenerationInput, model: ProviderModel): Promise<SubmitOutcome>;
  /** Required for any provider that returns `pending` from submit(). */
  poll?(job: GenerationJob): Promise<PollOutcome>;
}
