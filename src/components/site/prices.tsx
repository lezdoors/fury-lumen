"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { EASE, Reveal } from "./motion";
import type { PriceRow } from "@/lib/catalog";

type Filter = "all" | "video" | "image";

function money(value: number) {
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value < 0.1) return `$${value.toFixed(value < 0.01 ? 4 : 3)}`;
  return `$${value.toFixed(2)}`;
}

export function Prices({ rows, verifiedOn }: { rows: PriceRow[]; verifiedOn: string }) {
  const [filter, setFilter] = useState<Filter>("all");

  const shown = useMemo(
    () =>
      rows
        .filter((row) => filter === "all" || row.mediaKind === filter)
        .sort((a, b) => a.unitCostUsd - b.unitCostUsd),
    [rows, filter],
  );

  const video = rows.filter((row) => row.mediaKind === "video");
  const cheapestSecond = Math.min(...video.map((row) => row.unitCostUsd));
  const dearestSecond = Math.max(...video.map((row) => row.unitCostUsd));
  const spread = dearestSecond / cheapestSecond;

  return (
    <section className="section prices" id="prices">
      <div className="section__head">
        <Reveal>
          <p className="kicker">Prices</p>
        </Reveal>
        <Reveal delay={0.06}>
          <h2 className="display">
            {spread.toFixed(0)}× between the cheapest second and the dearest.
            <span className="display__accent"> That is the whole argument.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="lede">
            A credit is a unit invented so a click cannot be converted back into money.
            Below is every model Lumen can run, priced in dollars, read off fal&rsquo;s own
            API on {verifiedOn}. Video is quoted per second because that is how it is
            billed; stills are flat, per image.
          </p>
        </Reveal>
      </div>

      <Reveal delay={0.08}>
        <div className="prices__filters" role="tablist" aria-label="Filter models">
          {(["all", "video", "image"] as Filter[]).map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={filter === option}
              className={`pill${filter === option ? " pill--on" : ""}`}
              onClick={() => setFilter(option)}
            >
              {option === "all" ? `All ${rows.length}` : option === "video" ? "Video" : "Stills"}
            </button>
          ))}
        </div>
      </Reveal>

      <div className="ledger">
        <div className="ledger__head" aria-hidden>
          <span>Model</span>
          <span>Runs at</span>
          <span className="ledger__num">Unit</span>
          <span className="ledger__num">Shortest run</span>
        </div>
        {shown.map((row, index) => (
          <motion.div
            key={row.endpoint}
            className="ledger__row"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-6% 0px" }}
            transition={{ duration: 0.5, ease: EASE, delay: Math.min(index * 0.025, 0.4) }}
          >
            <span className="ledger__model">
              {row.label}
              <span className="ledger__endpoint">{row.endpoint}</span>
            </span>
            <span className="ledger__basis">
              {row.basis}
              {row.note && <span className="ledger__note">{row.note}</span>}
            </span>
            <span className="ledger__num figure">
              {money(row.unitCostUsd)}
              <span className="ledger__per">{row.mediaKind === "video" ? "/sec" : "/image"}</span>
            </span>
            <span className="ledger__num ledger__run figure">
              {money(row.cheapestRunUsd)}
              <span className="ledger__per">
                {row.shortestSeconds ? `${row.shortestSeconds}s` : "1 image"}
              </span>
            </span>
          </motion.div>
        ))}
      </div>

      <Reveal delay={0.06}>
        <div className="honest">
          <h3>What this does not claim</h3>
          <ul>
            <li>
              Higgsfield is not a rip-off. It resells close to fal&rsquo;s own rate, and its
              unlimited image tier is genuinely free where per-generation billing is not.
            </li>
            <li>
              The win here is choice and legibility, not a discount: Veo 3.1 Lite is{" "}
              {(0.2205 / 0.03).toFixed(0)}× cheaper per second than Seedance 2.5 at 480p
              — {(0.473 / 0.03).toFixed(0)}× at 1080p — for a clip of the same length,
              and Veo is not on the aggregators&rsquo; lists at all.
            </li>
            <li>
              Every figure above is the quoted rate at the stated resolution and audio
              setting. Change either and the rate changes; the note in the row says by how
              much. Fal can reprice at any time, which is why this page carries the date it
              was read.
            </li>
          </ul>
        </div>
      </Reveal>
    </section>
  );
}
