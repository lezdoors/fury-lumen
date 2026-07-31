import { mkdir, readFile, writeFile } from "node:fs/promises";
import * as path from "node:path";

const GENERATED_DIR = path.join(process.cwd(), "data", "assets");

export async function saveGeneratedAsset(
  id: string,
  extension: string,
  contents: Buffer | string,
): Promise<string> {
  await mkdir(GENERATED_DIR, { recursive: true });
  const safeExtension = extension.replace(/[^a-z0-9]/gi, "").toLowerCase() || "bin";
  const filename = `${id}.${safeExtension}`;
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
