import { getModels } from "@/lib/catalog";

export async function GET() {
  return Response.json({ models: getModels() });
}
