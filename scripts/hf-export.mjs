#!/usr/bin/env node
/**
 * Export a Higgsfield library to local disk with its provenance intact.
 *
 * The files are the obvious thing to save, but they are not the irreplaceable
 * thing. Each generation carries the model and the params that produced it —
 * a render can be regenerated, the prompt that made it cannot. So the manifest
 * is the point and the media is the payload.
 *
 * Input is whatever pages of `show_generations` have been captured to the
 * tool-results directory; the MCP is only callable from the agent, so crawling
 * happens there and this script consumes the result.
 *
 *   node scripts/hf-export.mjs --plan      # size it, download nothing
 *   node scripts/hf-export.mjs             # download what is missing
 */
import { createWriteStream } from "node:fs";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import * as path from "node:path";
import * as os from "node:os";

const PAGES_DIR = path.join(
  os.homedir(),
  ".claude/projects/-Users-ryanz/27dc233b-65dd-4bb5-8469-b30463234c94/tool-results",
);
/**
 * Straight into Google Drive rather than a local staging copy — Drive Desktop
 * syncs it, and 4 GB does not need to exist twice. Override with --out.
 */
const OUT_FLAG = process.argv.indexOf("--out");
const OUT = OUT_FLAG > -1
  ? process.argv[OUT_FLAG + 1]
  : path.join(
      os.homedir(),
      "Library/CloudStorage/GoogleDrive-ryanaoufal@gmail.com/My Drive/Higgsfield Export",
    );
const PLAN_ONLY = process.argv.includes("--plan");
const CONCURRENCY = 6;

function extOf(url) {
  const m = url.split("?")[0].match(/\.([a-z0-9]{2,4})$/i);
  return (m ? m[1] : "bin").toLowerCase();
}

/** Flattens a page of generations into one record per downloadable asset. */
function harvest(page, records) {
  for (const item of page.items ?? []) {
    const results = Array.isArray(item.results) ? item.results : [item.results];
    for (const [index, result] of results.entries()) {
      const url = result?.rawUrl;
      if (typeof url !== "string" || !url.startsWith("http")) continue;
      const iso = new Date((item.createdAt ?? 0) * 1000).toISOString();
      records.set(url, {
        url,
        generationId: item.id,
        index,
        model: item.model ?? null,
        type: item.type ?? null,
        status: item.status ?? null,
        createdAt: iso,
        // params holds the prompt and every setting — the part worth keeping.
        params: item.params ?? null,
        thumbnailUrl: result?.thumbnailUrl ?? null,
        file: `${iso.slice(0, 10)}/${item.id}${results.length > 1 ? `-${index}` : ""}.${extOf(url)}`,
      });
    }
  }
}

async function loadPages() {
  const names = (await readdir(PAGES_DIR)).filter(
    (n) => n.includes("show_generations") && n.endsWith(".txt"),
  );
  const records = new Map();
  for (const name of names) {
    try {
      harvest(JSON.parse(await readFile(path.join(PAGES_DIR, name), "utf8")), records);
    } catch {
      console.warn(`  skipped unreadable page: ${name}`);
    }
  }
  return [...records.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

async function sizeOf(url) {
  try {
    const r = await fetch(url, { method: "HEAD" });
    return r.ok ? Number(r.headers.get("content-length") ?? 0) : 0;
  } catch {
    return 0;
  }
}

async function mapPool(items, limit, worker) {
  const out = new Array(items.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (true) {
        const i = cursor++;
        if (i >= items.length) return;
        out[i] = await worker(items[i], i);
      }
    }),
  );
  return out;
}

const human = (bytes) =>
  bytes > 1e9 ? `${(bytes / 1e9).toFixed(2)} GB` : `${(bytes / 1e6).toFixed(1)} MB`;

async function main() {
  const records = await loadPages();
  if (records.length === 0) {
    console.error("No captured pages found. Crawl show_generations first.");
    process.exit(1);
  }

  const byExt = {};
  for (const r of records) byExt[extOf(r.url)] = (byExt[extOf(r.url)] ?? 0) + 1;
  console.log(`\n  ${records.length} assets across ${new Set(records.map((r) => r.generationId)).size} generations`);
  console.log(`  ${Object.entries(byExt).map(([k, v]) => `${v} ${k}`).join(", ")}`);
  console.log(`  ${records[0].createdAt.slice(0, 10)} → ${records.at(-1).createdAt.slice(0, 10)}`);

  if (PLAN_ONLY) {
    console.log("\n  measuring (HEAD requests, nothing downloaded)…");
    const sizes = await mapPool(records, CONCURRENCY, (r) => sizeOf(r.url));
    const total = sizes.reduce((a, b) => a + b, 0);
    const missing = sizes.filter((s) => s === 0).length;
    console.log(`  total: ${human(total)}${missing ? `  (${missing} unreadable)` : ""}`);
    console.log(`  destination: ${OUT}\n`);
    return;
  }

  await mkdir(OUT, { recursive: true });
  let done = 0;
  let skipped = 0;
  let failed = 0;

  await mapPool(records, CONCURRENCY, async (r) => {
    const dest = path.join(OUT, r.file);
    try {
      const existing = await stat(dest).catch(() => null);
      if (existing && existing.size > 0) {
        skipped++;
        return;
      }
      await mkdir(path.dirname(dest), { recursive: true });
      const response = await fetch(r.url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await pipeline(response.body, createWriteStream(dest));
      done++;
      if ((done + skipped) % 25 === 0) {
        process.stdout.write(`  ${done + skipped}/${records.length}\r`);
      }
    } catch (error) {
      failed++;
      r.error = String(error.message ?? error);
    }
  });

  await writeFile(path.join(OUT, "manifest.json"), JSON.stringify(records, null, 2));
  console.log(`\n  downloaded ${done}, already present ${skipped}, failed ${failed}`);
  console.log(`  manifest: ${path.join(OUT, "manifest.json")}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
