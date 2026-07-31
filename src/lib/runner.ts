import { getProvider } from "./providers";
import { updateJob } from "./store";
import type { GenerationJob } from "./types";

/**
 * Moves a queued job one step forward by asking its provider for status.
 *
 * Polling is pull-based and driven by whoever is looking at the job. There is no
 * background sweeper: a single-user local console does not need one, and a timer
 * that keeps charging a provider while nobody is watching is exactly the kind of
 * silent spend Lumen exists to avoid.
 */
export async function advanceJob(job: GenerationJob): Promise<GenerationJob> {
  if (job.status !== "running" && job.status !== "queued") return job;
  if (!job.providerJobId) return job;

  const provider = getProvider(job.providerId);
  if (!provider?.poll) {
    return (
      (await updateJob(job.id, {
        status: "failed",
        error: `Provider ${job.providerId} cannot report on queued work.`,
        completedAt: new Date().toISOString(),
      })) ?? job
    );
  }

  try {
    const outcome = await provider.poll(job);

    if (outcome.kind === "pending") {
      return (
        (await updateJob(job.id, {
          status: "running",
          queuePosition: outcome.queuePosition,
          lastPolledAt: new Date().toISOString(),
        })) ?? job
      );
    }

    if (outcome.kind === "failed") {
      return (
        (await updateJob(job.id, {
          status: "failed",
          error: outcome.error,
          completedAt: new Date().toISOString(),
          lastPolledAt: new Date().toISOString(),
        })) ?? job
      );
    }

    return (
      (await updateJob(job.id, {
        status: "completed",
        completedAt: new Date().toISOString(),
        lastPolledAt: new Date().toISOString(),
        assetUrl: outcome.result.assetUrl,
        mimeType: outcome.result.mimeType,
        actualCostUsd: outcome.result.actualCostUsd,
        queuePosition: undefined,
      })) ?? job
    );
  } catch (error) {
    // A transport failure is not a failed generation — the provider may still be
    // working. Record the attempt and leave the job running so it can be retried.
    const message = error instanceof Error ? error.message : "Polling failed.";
    return (
      (await updateJob(job.id, { lastPolledAt: new Date().toISOString(), error: message })) ?? job
    );
  }
}
