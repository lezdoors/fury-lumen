import { MAX_UPLOAD_BYTES, UPLOADABLE_IMAGE_TYPES, extensionFor } from "@/lib/assets";
import { canPersist, saveGeneratedAsset } from "@/lib/files";

/**
 * Reference frames for image-to-video.
 *
 * The file is stored beside generated assets and handed back as an
 * `/api/assets/…` URL, which the composer shows as a thumbnail and the job
 * carries in `referenceUrls`. Providers never fetch that URL — the fal adapter
 * inlines the bytes as a data URI at submit time, because a localhost path is
 * unreachable from their side.
 */
export async function POST(request: Request) {
  if (!(await canPersist())) {
    return Response.json(
      { error: "This host has no writable disk, so a reference frame cannot be stored." },
      { status: 503 },
    );
  }

  const form = await request.formData().catch(() => undefined);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No file was attached." }, { status: 400 });
  }
  if (!UPLOADABLE_IMAGE_TYPES.includes(file.type)) {
    return Response.json(
      { error: `${file.type || "That file"} is not a supported image. Use PNG, JPEG, WebP or GIF.` },
      { status: 415 },
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return Response.json(
      { error: `That image is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 12 MB.` },
      { status: 413 },
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const url = await saveGeneratedAsset(crypto.randomUUID(), extensionFor(file.type), bytes);
  return Response.json({ url }, { status: 201 });
}
