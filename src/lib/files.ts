import { execFile } from "node:child_process";
import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import * as path from "node:path";
import { promisify } from "node:util";
import { put } from "@vercel/blob";

const GENERATED_DIR = path.join(process.cwd(), "data", "assets");

const CONTENT_TYPES: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

/**
 * Blob is the only durable store once this is deployed. Provider CDN links
 * expire within days, so a generation that keeps its fal or OpenAI URL is a
 * clip you paid for and will lose — which for a channel archive is the whole
 * point of the library.
 */
export function hasBlobStore() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

/**
 * Serverless hosts ship a read-only bundle. Probing once tells the rest of the
 * app whether it can rely on anything surviving a request, which is the
 * difference between a queue that works and one that loses jobs between
 * instances.
 */
let writable: Promise<boolean> | undefined;
export function canPersist() {
  if (hasBlobStore()) return Promise.resolve(true);
  writable ??= (async () => {
    try {
      await mkdir(GENERATED_DIR, { recursive: true });
      const probe = path.join(GENERATED_DIR, ".probe");
      await writeFile(probe, "1");
      await unlink(probe).catch(() => undefined);
      return true;
    } catch {
      return false;
    }
  })();
  return writable;
}

export async function saveGeneratedAsset(
  id: string,
  extension: string,
  contents: Buffer | string,
): Promise<string> {
  const safeExtension = extension.replace(/[^a-z0-9]/gi, "").toLowerCase() || "bin";
  const filename = `${id}.${safeExtension}`;

  // Blob returns an absolute URL, so the library, the download links and any
  // image-to-video reference all point at the same durable copy.
  if (hasBlobStore()) {
    const blob = await put(`generated/${filename}`, contents, {
      access: "public",
      contentType: CONTENT_TYPES[safeExtension] ?? "application/octet-stream",
      addRandomSuffix: false,
    });
    return blob.url;
  }

  await mkdir(GENERATED_DIR, { recursive: true });
  await writeFile(path.join(GENERATED_DIR, filename), contents);
  return `/api/assets/${filename}`;
}

export async function readGeneratedAsset(filename: string) {
  if (!/^[a-zA-Z0-9-]+\.[a-zA-Z0-9]+$/.test(filename)) return undefined;
  try {
    return await readFile(path.join(GENERATED_DIR, filename));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

const run = promisify(execFile);

/**
 * First frame of a video as a JPEG, rendered once and cached beside the source.
 *
 * Safari will not paint a poster from `<video preload="metadata">`, so a library
 * built from video elements shows blank tiles there. Images also mean the grid
 * costs N decodes of a small JPEG rather than N video pipelines.
 */
export async function readOrMakePoster(filename: string) {
  if (!/^[a-zA-Z0-9-]+\.[a-zA-Z0-9]+$/.test(filename)) return undefined;
  const source = path.join(GENERATED_DIR, filename);
  const poster = path.join(GENERATED_DIR, `${filename}.poster.jpg`);

  try {
    return await readFile(poster);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  try {
    await stat(source);
  } catch {
    return undefined;
  }

  try {
    await run("ffmpeg", [
      "-y", "-v", "error",
      "-ss", "0.1",
      "-i", source,
      "-frames:v", "1",
      "-vf", "scale=640:-2",
      "-q:v", "4",
      poster,
    ]);
    return await readFile(poster);
  } catch {
    // No ffmpeg, or a container it cannot open — the card falls back to its tile.
    return undefined;
  }
}
