import { readGeneratedAsset } from "@/lib/files";

const contentTypes: Record<string, string> = {
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  mp4: "video/mp4",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ filename: string }> },
) {
  const { filename } = await context.params;
  const asset = await readGeneratedAsset(filename);
  if (!asset) return new Response("Not found", { status: 404 });
  const extension = filename.split(".").pop()?.toLowerCase() ?? "bin";
  return new Response(asset, {
    headers: {
      "Content-Type": contentTypes[extension] ?? "application/octet-stream",
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}