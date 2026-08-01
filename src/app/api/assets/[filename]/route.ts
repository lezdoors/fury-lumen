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
  const headers: Record<string, string> = {
    "Content-Type": contentTypes[extension] ?? "application/octet-stream",
    "Cache-Control": "private, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    // Safari will not play a video from a source that cannot serve ranges. It
    // opens with `Range: bytes=0-1` and expects a 206; a 200 carrying the whole
    // file makes it give up with MEDIA_ERR_SRC_NOT_SUPPORTED and never request
    // another byte. Chrome plays it regardless, which is why this survived.
    "Accept-Ranges": "bytes",
  };

  const range = request.headers.get("range");
  const match = range?.match(/^bytes=(\d*)-(\d*)$/);
  if (match) {
    const size = asset.length;
    // An open-ended suffix range (`bytes=-500`) counts back from the end.
    const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2] || 0));
    const end = match[1] ? (match[2] ? Number(match[2]) : size - 1) : size - 1;

    if (!Number.isFinite(start) || start >= size || start > end) {
      return new Response(null, {
        status: 416,
        headers: { ...headers, "Content-Range": `bytes */${size}` },
      });
    }

    const last = Math.min(end, size - 1);
    return new Response(new Uint8Array(asset.subarray(start, last + 1)), {
      status: 206,
      headers: {
        ...headers,
        "Content-Range": `bytes ${start}-${last}/${size}`,
        "Content-Length": String(last - start + 1),
      },
    });
  }

  return new Response(new Uint8Array(asset), { headers });
}
