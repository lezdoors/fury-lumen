import { Console } from "@/components/console";
import { getModels } from "@/lib/catalog";
import { listJobs } from "@/lib/store";
import "./console.css";

export const dynamic = "force-dynamic";

export default async function Home() {
  return <Console initialModels={getModels()} initialJobs={await listJobs()} />;
}
