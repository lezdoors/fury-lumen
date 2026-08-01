import { Panel } from "@/components/panel";
import { getModels } from "@/lib/catalog";
import { listJobs } from "@/lib/store";
import "./panel.css";

export const dynamic = "force-dynamic";

export default async function Home() {
  return <Panel initialModels={getModels()} initialJobs={await listJobs()} />;
}
