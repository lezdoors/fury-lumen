import { brands } from "../catalog";
import { saveGeneratedAsset } from "../files";
import type { GenerationInput, GenerationResult } from "../types";
import type { GenerationProvider } from "./provider";

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (character) => {
    const entities: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      "'": "&apos;",
      '\"': "&quot;",
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

export class MockProvider implements GenerationProvider {
  id = "mock";

  async generate(input: GenerationInput): Promise<GenerationResult> {
    const [width, height] = dimensions(input.aspectRatio);
    const brand = brands[input.brandId];
    const prompt = escapeXml(input.prompt.slice(0, 150));
    const accent = input.brandId === "maison-tanneurs" ? "#8b5d3b" : "#6f745e";
    const id = crypto.randomUUID();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="#f1efe9"/>
      <rect x="${width * 0.08}" y="${height * 0.08}" width="${width * 0.84}" height="${height * 0.84}" fill="#fcfbf8" stroke="#d8d3c8"/>
      <line x1="${width * 0.08}" y1="${height * 0.2}" x2="${width * 0.92}" y2="${height * 0.2}" stroke="${accent}" stroke-width="4"/>
      <text x="${width * 0.12}" y="${height * 0.15}" fill="#171714" font-family="Helvetica, Arial" font-size="${Math.max(24, width * 0.025)}" letter-spacing="6">${escapeXml(brand.code)} · ATELIER PROOF</text>
      <text x="${width * 0.12}" y="${height * 0.47}" fill="#171714" font-family="Georgia, serif" font-size="${Math.max(40, width * 0.055)}">${escapeXml(brand.name)}</text>
      <foreignObject x="${width * 0.12}" y="${height * 0.53}" width="${width * 0.7}" height="${height * 0.22}">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font: ${Math.max(20, width * 0.022)}px/1.5 Helvetica,Arial;color:#55534d">${prompt}</div>
      </foreignObject>
      <text x="${width * 0.12}" y="${height * 0.86}" fill="#77736b" font-family="Helvetica, Arial" font-size="${Math.max(18, width * 0.018)}">No provider charge · workflow verification asset</text>
    </svg>`;
    const assetUrl = await saveGeneratedAsset(id, "svg", svg);
    return { assetUrl, mimeType: "image/svg+xml", actualCostUsd: 0 };
  }
}
