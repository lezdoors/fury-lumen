import { neon } from "@neondatabase/serverless";
import type { GenerationJob, JobStatus, MediaKind, ReviewStatus } from "./types";

/**
 * Postgres is optional. Without DATABASE_URL the app falls back to the local
 * file store, which is what a single developer on a laptop actually wants — no
 * database to run, history in a readable JSON file.
 *
 * It becomes required the moment the app is deployed, because serverless
 * instances share nothing: a job submitted by one instance is invisible to the
 * instance that polls for it, and generations disappear mid-flight.
 */
export function databaseUrl() {
  return process.env.DATABASE_URL?.trim() || undefined;
}

export function hasDatabase() {
  return Boolean(databaseUrl());
}

function client() {
  const url = databaseUrl();
  if (!url) throw new Error("DATABASE_URL is not set.");
  return neon(url);
}

let ready: Promise<void> | undefined;

/** Created on first use so there is no migration step to forget. */
export function ensureSchema() {
  ready ??= (async () => {
    const sql = client();
    await sql`
      CREATE TABLE IF NOT EXISTS jobs (
        id                  uuid PRIMARY KEY,
        created_at          timestamptz NOT NULL DEFAULT now(),
        completed_at        timestamptz,
        last_polled_at      timestamptz,
        status              text NOT NULL,
        review_status       text NOT NULL DEFAULT 'unreviewed',
        prompt              text NOT NULL,
        provider_id         text NOT NULL,
        model_id            text NOT NULL,
        media_kind          text NOT NULL,
        aspect_ratio        text NOT NULL,
        duration_seconds    integer,
        reference_urls      jsonb NOT NULL DEFAULT '[]'::jsonb,
        estimated_cost_usd  numeric(10,4) NOT NULL DEFAULT 0,
        actual_cost_usd     numeric(10,4),
        asset_url           text,
        mime_type           text,
        error               text,
        provider_job_id     text,
        provider_endpoint   text,
        queue_position      integer
      )`;
    // The library reads newest-first and every poll looks a job up by id.
    await sql`CREATE INDEX IF NOT EXISTS jobs_created_at_idx ON jobs (created_at DESC)`;
  })();
  return ready;
}

type Row = Record<string, unknown>;

function toJob(row: Row): GenerationJob {
  const num = (v: unknown) => (v === null || v === undefined ? undefined : Number(v));
  return {
    id: String(row.id),
    createdAt: new Date(row.created_at as string).toISOString(),
    completedAt: row.completed_at ? new Date(row.completed_at as string).toISOString() : undefined,
    lastPolledAt: row.last_polled_at
      ? new Date(row.last_polled_at as string).toISOString()
      : undefined,
    status: row.status as JobStatus,
    reviewStatus: row.review_status as ReviewStatus,
    prompt: String(row.prompt),
    providerId: String(row.provider_id),
    modelId: String(row.model_id),
    mediaKind: row.media_kind as MediaKind,
    aspectRatio: row.aspect_ratio as GenerationJob["aspectRatio"],
    durationSeconds: num(row.duration_seconds),
    referenceUrls: (row.reference_urls as string[]) ?? [],
    estimatedCostUsd: num(row.estimated_cost_usd) ?? 0,
    actualCostUsd: num(row.actual_cost_usd),
    assetUrl: (row.asset_url as string) ?? undefined,
    mimeType: (row.mime_type as string) ?? undefined,
    error: (row.error as string) ?? undefined,
    providerJobId: (row.provider_job_id as string) ?? undefined,
    providerEndpoint: (row.provider_endpoint as string) ?? undefined,
    queuePosition: num(row.queue_position),
  };
}

export async function dbListJobs(limit = 200): Promise<GenerationJob[]> {
  await ensureSchema();
  const sql = client();
  const rows = await sql`SELECT * FROM jobs ORDER BY created_at DESC LIMIT ${limit}`;
  return (rows as Row[]).map(toJob);
}

export async function dbGetJob(id: string): Promise<GenerationJob | undefined> {
  await ensureSchema();
  const sql = client();
  const rows = (await sql`SELECT * FROM jobs WHERE id = ${id}`) as Row[];
  return rows[0] ? toJob(rows[0]) : undefined;
}

export async function dbCreateJob(job: GenerationJob): Promise<GenerationJob> {
  await ensureSchema();
  const sql = client();
  await sql`
    INSERT INTO jobs (
      id, created_at, status, review_status, prompt, provider_id, model_id,
      media_kind, aspect_ratio, duration_seconds, reference_urls, estimated_cost_usd
    ) VALUES (
      ${job.id}, ${job.createdAt}, ${job.status}, ${job.reviewStatus}, ${job.prompt},
      ${job.providerId}, ${job.modelId}, ${job.mediaKind}, ${job.aspectRatio},
      ${job.durationSeconds ?? null}, ${JSON.stringify(job.referenceUrls ?? [])},
      ${job.estimatedCostUsd}
    )`;
  return job;
}

const COLUMNS: Record<string, string> = {
  status: "status",
  reviewStatus: "review_status",
  completedAt: "completed_at",
  lastPolledAt: "last_polled_at",
  assetUrl: "asset_url",
  mimeType: "mime_type",
  error: "error",
  actualCostUsd: "actual_cost_usd",
  providerJobId: "provider_job_id",
  providerEndpoint: "provider_endpoint",
  queuePosition: "queue_position",
};

export async function dbUpdateJob(
  id: string,
  updates: Partial<GenerationJob>,
): Promise<GenerationJob | undefined> {
  await ensureSchema();
  const sql = client();
  const entries = Object.entries(updates).filter(([key]) => key in COLUMNS);
  if (entries.length === 0) return dbGetJob(id);

  // The driver's tagged template does not take a dynamic SET list, so the
  // assignments are positional and the values stay parameterised.
  const assignments = entries.map(([key], i) => `${COLUMNS[key]} = $${i + 2}`).join(", ");
  const values = entries.map(([, value]) => (value === undefined ? null : value));
  const rows = (await sql.query(
    `UPDATE jobs SET ${assignments} WHERE id = $1 RETURNING *`,
    [id, ...values],
  )) as Row[];
  return rows[0] ? toJob(rows[0]) : undefined;
}
