/** Legacy. Early builds scoped work to two brand workspaces; Lumen is a
 *  general tool, so nothing writes this any more and nothing reads it to
 *  decide behaviour. Kept only so existing records in data/jobs.json parse. */
export type BrandId = string;
export type JobStatus = "queued" | "running" | "completed" | "failed";
export type ReviewStatus = "unreviewed" | "approved" | "rejected";
export type MediaKind = "image" | "video";
export type AspectRatio = "1:1" | "4:5" | "3:4" | "16:9" | "9:16";

export interface GenerationInput {
  brandId?: BrandId;
  prompt: string;
  providerId: string;
  modelId: string;
  mediaKind: MediaKind;
  aspectRatio: AspectRatio;
  /** Video only. Ignored by image models. */
  durationSeconds?: number;
  referenceUrls?: string[];
}

export interface GenerationResult {
  assetUrl: string;
  mimeType: string;
  providerJobId?: string;
  actualCostUsd?: number;
}

export interface GenerationJob extends GenerationInput {
  id: string;
  createdAt: string;
  completedAt?: string;
  status: JobStatus;
  reviewStatus: ReviewStatus;
  estimatedCostUsd: number;
  actualCostUsd?: number;
  assetUrl?: string;
  mimeType?: string;
  error?: string;
  /** Set when the provider queued the work and the result must be polled. */
  providerJobId?: string;
  /** The endpoint the job was submitted to — polling paths derive from it. */
  providerEndpoint?: string;
  /** Provider-reported queue position, surfaced while the job is running. */
  queuePosition?: number;
  lastPolledAt?: string;
}

export interface ProviderModel {
  id: string;
  providerId: string;
  providerLabel: string;
  label: string;
  mediaKind: MediaKind;
  available: boolean;
  availabilityReason?: string;
  /**
   * Flat per-generation cost. For video models this is left at 0 and the real
   * estimate comes from costPerSecondUsd × duration — video is billed by output
   * length, so a flat number would be a lie the moment duration changes.
   */
  estimatedCostUsd: number;
  costPerSecondUsd?: number;
  /** Provider-side endpoint, when it differs from the display id. */
  endpoint?: string;
  /** Durations the provider actually accepts. */
  durations?: number[];
  /** True when the provider queues the job and the result must be polled. */
  asynchronous?: boolean;
}

export function estimateCost(model: ProviderModel, durationSeconds?: number): number {
  if (model.costPerSecondUsd && model.mediaKind === "video") {
    return Number((model.costPerSecondUsd * (durationSeconds ?? 5)).toFixed(4));
  }
  return model.estimatedCostUsd;
}
