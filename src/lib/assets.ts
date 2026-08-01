import { readGeneratedAsset } from "./files";

const MIME_BY_EXTENSION: Record<string, string> = {
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
};

export const UPLOADABLE_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

export function extensionFor(mimeType: string) {
  const found = Object.entries(MIME_BY_EXTENSION).find(([, mime]) => mime === mimeType);
  return found?.[0] ?? "bin";
}

export function mimeFor(filename: string) {
  const extension = filename.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXTENSION[extension] ?? "application/octet-stream";
}

const LOCAL_ASSET = /^\/api\/assets\/([a-zA-Z0-9-]+\.[a-zA-Z0-9]+)$/;

/**
 * A reference frame lives on this machine, and a provider out on the internet
 * cannot fetch `http://localhost:3210/api/assets/…`. Fal takes a data URI
 * anywhere it takes an image URL, so the file travels inside the request rather
 * than being fetched back — which is also what makes image-to-video work from a
 * laptop that has no public hostname at all.
 *
 * Returns undefined for anything already remote, so callers can hand over
 * whatever they hold and let this decide.
 */
export async function inlineLocalAsset(url: string): Promise<string | undefined> {
  const match = url.match(LOCAL_ASSET);
  if (!match) return undefined;
  const bytes = await readGeneratedAsset(match[1]);
  if (!bytes) return undefined;
  return `data:${mimeFor(match[1])};base64,${bytes.toString("base64")}`;
}
