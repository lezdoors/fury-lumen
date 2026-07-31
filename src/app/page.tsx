import { Studio } from "@/components/studio";
import { getModels } from "@/lib/catalog";
import { listJobs } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const initialJobs = await listJobs();
  return <Studio initialModels={getModels()} initialJobs={initialJobs} />;
}
