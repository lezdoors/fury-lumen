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
        {/* The room: media, on black, where a generated frame is the brightest
            thing on the screen. */}
        <Box rows={rows} />
        <Wall />

        {/* The document: prices and arithmetic, on paper. A twenty-one row
            price list is something you read, not something you look at. */}
        <div className="paper">
          <Prices rows={rows} verifiedOn={verifiedOn} />
          <Arithmetic rows={rows} />
          <Steps />
          <Faq />
        </div>
      </main>
      <Close modelCount={modelCount} verifiedOn={verifiedOn} />
    </div>
  );
}
