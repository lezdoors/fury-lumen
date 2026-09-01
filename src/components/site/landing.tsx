"use client";

import { Nav } from "./nav";
import { Hero } from "./hero";
import { Box } from "./box";
import { Wall } from "./wall";
import { Prices } from "./prices";
import { Arithmetic } from "./arithmetic";
import { Close, Faq, Steps } from "./closing";
import type { PriceRow } from "@/lib/catalog";

export function Landing({
  rows,
  modelCount,
  verifiedOn,
}: {
  rows: PriceRow[];
  modelCount: number;
  verifiedOn: string;
}) {
  const video = rows.filter((row) => row.mediaKind === "video");
  const stills = rows.filter((row) => row.mediaKind === "image");
  const cheapestClip = video.reduce((low, row) =>
    row.cheapestRunUsd < low.cheapestRunUsd ? row : low,
  );
  const cheapestStill = stills.reduce((low, row) =>
    row.cheapestRunUsd < low.cheapestRunUsd ? row : low,
  );

  return (
    <div className="page">
      <Nav />
      <Hero
        modelCount={modelCount}
        rows={rows}
        cheapestClip={cheapestClip}
        cheapestStill={cheapestStill}
      />
      <main>
        <Box rows={rows} />
        <Wall />
        <Prices rows={rows} verifiedOn={verifiedOn} />
        <Arithmetic rows={rows} />
        <Steps />
        <Faq />
      </main>
      <Close modelCount={modelCount} verifiedOn={verifiedOn} />
    </div>
  );
}
