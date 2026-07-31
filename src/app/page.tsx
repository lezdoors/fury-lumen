import { Room } from "@/components/room";
import { getModels } from "@/lib/catalog";
import { listJobs } from "@/lib/store";
import "./room.css";

export const dynamic = "force-dynamic";

export default async function Home() {
  return <Room initialModels={getModels()} initialJobs={await listJobs()} />;
}
