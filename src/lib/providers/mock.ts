import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, unlink } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { promisify } from "node:util";
import { saveGeneratedAsset } from "../files";
import type { GenerationInput, GenerationJob, ProviderModel } from "../types";
import type { GenerationProvider, PollOutcome, SubmitOutcome } from "./provider";

const run = promisify(execFile);

/**
 * Proof mode renders a real asset without calling a paid provider, so the whole
 * request → queue → poll → asset → review loop can be exercised at zero cost.
 * Video proof deliberately takes time and reports a queue position: a provider
 * that answers instantly would never surface the async bugs that matter.
 */
const PROOF_QUEUE_SECONDS = 3;
const PROOF_RENDER_SECONDS = 5;

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (character) => {
    const entities: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      "'": "&apos;",
      '"': "&quot;",
    };
    return entities[character];
  });
}

function dimensions(aspectRatio: GenerationInput["aspectRatio"]) {
  const sizes = {
    "1:1": [1200, 1200],
    "4:5": [1080, 1350],
    "3:4": [1200, 1600],
    "16:9": [1600, 900],
    "9:16": [900, 1600],
  } as const;
  return sizes[aspectRatio];
}

function videoDimensions(aspectRatio: GenerationInput["aspectRatio"]) {
  // Even dimensions only — yuv420p rejects an odd width or height.
  const sizes = {
    "1:1": [720, 720],
    "4:5": [720, 900],
    "3:4": [720, 960],
    "16:9": [1280, 720],
    "9:16": [720, 1280],
  } as const;
  return sizes[aspectRatio];
}

function renderProofSvg(input: GenerationInput) {
  const [width, height] = dimensions(input.aspectRatio);
  const prompt = escapeXml(input.prompt.slice(0, 150));
  const accent = "#b4762f";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="#f1efe9"/>
      <rect x="${width * 0.08}" y="${height * 0.08}" width="${width * 0.84}" height="${height * 0.84}" fill="#fcfbf8" stroke="#d8d3c8"/>
      <line x1="${width * 0.08}" y1="${height * 0.2}" x2="${width * 0.92}" y2="${height * 0.2}" stroke="${accent}" stroke-width="4"/>
      <text x="${width * 0.12}" y="${height * 0.15}" fill="#171714" font-family="Helvetica, Arial" font-size="${Math.max(24, width * 0.025)}" letter-spacing="6">LUMEN PROOF</text>
      <text x="${width * 0.12}" y="${height * 0.47}" fill="#171714" font-family="Georgia, serif" font-size="${Math.max(40, width * 0.055)}">Proof render</text>
      <foreignObject x="${width * 0.12}" y="${height * 0.53}" width="${width * 0.7}" height="${height * 0.22}">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font: ${Math.max(20, width * 0.022)}px/1.5 Helvetica,Arial;color:#55534d">${prompt}</div>
      </foreignObject>
      <text x="${width * 0.12}" y="${height * 0.86}" fill="#77736b" font-family="Helvetica, Arial" font-size="${Math.max(18, width * 0.018)}">No provider charge · workflow verification asset</text>
    </svg>`;
}

const PROOF_FONTS = [
  "/System/Library/Fonts/Supplemental/Arial.ttf",
  "/System/Library/Fonts/Helvetica.ttc",
];

/**
 * drawtext needs libfreetype, which Homebrew's default ffmpeg build omits.
 * Probe once rather than assume — the label is a nicety, the motion is the point.
 */
let drawtextSupport: Promise<boolean> | undefined;
function hasDrawtext() {
  drawtextSupport ??= run("ffmpeg", ["-hide_banner", "-filters"])
    .then(({ stdout }) => / drawtext /.test(stdout))
    .catch(() => false);
  return drawtextSupport;
}

async function renderProofVideo(job: GenerationJob): Promise<Buffer> {
  const [width, height] = videoDimensions(job.aspectRatio);
  const seconds = job.durationSeconds ?? PROOF_RENDER_SECONDS;
  const accent = "0xB4762F";
  const output = path.join(os.tmpdir(), `lumen-proof-${job.id}.mp4`);

  const blockWidth = Math.round(width * 0.26);
  const blockHeight = Math.round(height * 0.32);

  // The travelling block is an overlay, not a drawbox. In drawbox, `t` is the
  // *thickness* parameter, not time — a `t`-driven position expression there
  // evaluates to nothing and the box silently never renders.
  const stages = [
    `[0][1]overlay=x='W*0.18+W*0.30*(t/${seconds})':y='H*0.34'[moved]`,
    `[moved]drawbox=x=0:y='ih*0.66':w=iw:h=2:color=white@0.14:t=fill[ruled]`,
  ];

  const font = PROOF_FONTS.find((candidate) => existsSync(candidate));
  if (font && (await hasDrawtext())) {
    stages.push(
      `[ruled]drawtext=fontfile=${font}:text='LUMEN PROOF - no provider charge':x=w*0.06:y=h*0.86:fontsize=${Math.round(height * 0.032)}:fontcolor=white@0.55[out]`,
    );
  } else {
    // Without text, a broken corner rule still marks the asset as synthetic.
    stages.push(
      `[ruled]drawbox=x='iw*0.06':y='ih*0.88':w='iw*0.10':h=3:color=white@0.5:t=fill,drawbox=x='iw*0.18':y='ih*0.88':w='iw*0.04':h=3:color=white@0.5:t=fill[out]`,
    );
  }

  try {
    await run("ffmpeg", [
      "-y",
      "-f", "lavfi",
      "-i", `color=c=0x12100E:s=${width}x${height}:d=${seconds}:r=24`,
      "-f", "lavfi",
      "-i", `color=c=${accent}:s=${blockWidth}x${blockHeight}:d=${seconds}:r=24`,
      "-filter_complex", stages.join(";"),
      "-map", "[out]",
      "-c:v", "libx264",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      output,
    ]);
    return await readFile(output);
  } finally {
    await unlink(output).catch(() => undefined);
  }
}

export class MockProvider implements GenerationProvider {
  id = "mock";

  async submit(input: GenerationInput, model: ProviderModel): Promise<SubmitOutcome> {
    if (model.mediaKind === "video") {
      return {
        kind: "pending",
        providerJobId: `proof-${crypto.randomUUID()}`,
        providerEndpoint: "lumen/proof-video",
      };
    }
    const assetUrl = await saveGeneratedAsset(
      crypto.randomUUID(),
      "svg",
      renderProofSvg(input),
    );
    return {
      kind: "complete",
      result: { assetUrl, mimeType: "image/svg+xml", actualCostUsd: 0 },
    };
  }

  async poll(job: GenerationJob): Promise<PollOutcome> {
    const elapsed = (Date.now() - new Date(job.createdAt).getTime()) / 1000;
    if (elapsed < PROOF_QUEUE_SECONDS) {
      return {
        kind: "pending",
        queuePosition: Math.max(1, Math.ceil(PROOF_QUEUE_SECONDS - elapsed)),
      };
    }
    try {
      let assetUrl: string;
      try {
        const bytes = await renderProofVideo(job);
        assetUrl = await saveGeneratedAsset(crypto.randomUUID(), "mp4", bytes);
      } catch {
        // No ffmpeg or no writable disk — a hosted copy still gets a real clip
        // so the whole loop stays demonstrable.
        assetUrl = "/proof-sample.mp4";
      }
      return {
        kind: "complete",
        result: {
          assetUrl,
          mimeType: "video/mp4",
          providerJobId: job.providerJobId,
          actualCostUsd: 0,
        },
      };
    } catch (error) {
      // Surface ffmpeg's own last words rather than guessing at the cause.
      const raw = error instanceof Error ? error.message : String(error);
      const reason =
        raw
          .split("\n")
          .filter((line) => /No such filter|Error|Unknown|Invalid|not found|ENOENT/i.test(line))
          .slice(-2)
          .join(" ") || raw.slice(0, 200);
      return { kind: "failed", error: `Proof render failed: ${reason}` };
    }
  }
}
