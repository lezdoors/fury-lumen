export type BrandId = "maison-tanneurs" | "maison-izem";
export type JobStatus = "queued" | "running" | "completed" | "failed";
export type ReviewStatus = "unreviewed" | "approved" | "rejected";
export type MediaKind = "image" | "video";

export interface GenerationInput {
  brandId: BrandId;
  prompt: string;
  providerId: string;
  modelId: string;
  mediaKind: MediaKind;
  aspectRatio: "1:1" | "4:5" | "3:4" | "16:9" | "9:16";
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
}

export interface ProviderModel {
  id: string;
  providerId: string;
  providerLabel: string;
  label: string;
  mediaKind: MediaKind;
  available: boolean;
  availabilityReason?: string;
  estimatedCostUsd: number;
}
