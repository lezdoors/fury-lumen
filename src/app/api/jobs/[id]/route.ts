import { advanceJob } from "@/lib/runner";
import { getJob, reviewJob } from "@/lib/store";
import type { ReviewStatus } from "@/lib/types";

const statuses: ReviewStatus[] = ["unreviewed", "approved", "rejected"];

/** Reading a running job polls its provider — this is how queued work advances. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const job = await getJob(id);
  if (!job) return Response.json({ error: "Job not found." }, { status: 404 });
  return Response.json({ job: await advanceJob(job) });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = (await request.json()) as { reviewStatus?: ReviewStatus };
  if (!body.reviewStatus || !statuses.includes(body.reviewStatus)) {
    return Response.json({ error: "Invalid review status." }, { status: 400 });
  }
  const job = await reviewJob(id, body.reviewStatus);
  if (!job) return Response.json({ error: "Job not found." }, { status: 404 });
  return Response.json({ job });
}
