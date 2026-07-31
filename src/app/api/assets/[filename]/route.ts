import { readGeneratedAsset, readOrMakePoster } from "@/lib/files";

const contentTypes: Record<string, string> = {
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  mp4: "video/mp4",
};

export async function GET(
  request: Request,
  context: { params: Promise<{ filename: string }> },
) {
  const { filename } = await context.params;

  /**
   * `?poster=1` returns a still frame for a video.
   *
   * Safari will not paint a frame from `<video preload="metadata">` however it
   * is seeked, so a grid of video elements shows as blank tiles there. Serving a
   * real image also means the library is N <img> tags instead of N video
   * decoders, which is what every comparable gallery does.
   */
  if (new URL(request.url).searchParams.has("poster")) {
    const poster = await readOrMakePoster(filename);
    if (!poster) return new Response("Not found", { status: 404 });
    return new Response(new Uint8Array(poster), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "private, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  const asset = await readGeneratedAsset(filename);
  if (!asset) return new Response("Not found", { status: 404 });
  const extension = filename.split(".").pop()?.toLowerCase() ?? "bin";
  return new Response(new Uint8Array(asset), {
    headers: {
      "Content-Type": contentTypes[extension] ?? "application/octet-stream",
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
