"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import GlowHorizon from "@/components/ui/glow-horizon";
import { EASE, WordsIn } from "./motion";
import type { PriceRow } from "@/lib/catalog";

/** Formats a price at the precision it was quoted, never rounded up. */
function money(value: number) {
  return value >= 1 ? `$${value.toFixed(2)}` : `$${value.toFixed(value < 0.1 ? 3 : 2)}`;
}

/** A chip quotes one model at one length. Both halves come from the catalogue. */
function chipFor(rows: PriceRow[], endpoint: string, seconds?: number) {
  const row = rows.find((entry) => entry.endpoint === endpoint);
  if (!row) return null;
  const price = seconds ? row.unitCostUsd * seconds : row.unitCostUsd;
  return {
    model: row.label.split(" · ")[0],
    unit: seconds ? `${seconds}s clip` : "1 image",
    price: money(Number(price.toFixed(4))),
  };
}

export function Hero({
  modelCount,
  rows,
  cheapestClip,
  cheapestStill,
}: {
  modelCount: number;
  rows: PriceRow[];
  cheapestClip: PriceRow;
  cheapestStill: PriceRow;
}) {
  const reduced = useReducedMotion();

  const chips = [
    chipFor(rows, "fal-ai/veo3.1/lite", 4),
    chipFor(rows, "fal-ai/nano-banana"),
    chipFor(rows, "fal-ai/kling-video/v3/standard/text-to-video", 5),
    chipFor(rows, "bytedance/seedance-2.5/text-to-video", 5),
  ].filter((chip): chip is NonNullable<typeof chip> => chip !== null);

  const ticket = [
    chipFor(rows, "fal-ai/veo3.1/lite", 4),
    chipFor(rows, "bytedance/seedance-2.5/text-to-video", 5),
  ].filter((row): row is NonNullable<typeof row> => row !== null);

  const enter = (delay: number) => ({
    initial: reduced ? false : ({ opacity: 0, y: 16 } as const),
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.9, ease: EASE, delay },
  });

  return (
    <header className="hero">
      {/* The light source for the whole room: four ellipses cresting the bottom
          edge, so the page begins on a horizon rather than on a gradient. */}
      <div className="hero__glow">
        <GlowHorizon variant="bottom" />
      </div>

      <div className="hero__grid">
        <div className="hero__body">
          <motion.p className="eyebrow" {...enter(0.05)}>
            <span className="eyebrow__dot" />
            {modelCount} models · one box · dollars, not credits
          </motion.p>

          <h1 className="hero__headline">
            <WordsIn text="See the price." delay={0.12} />
            <span className="hero__headline-accent">
              <WordsIn text="Then make the frame." delay={0.34} />
            </span>
          </h1>

          <motion.p className="hero__sub" {...enter(0.62)}>
            Veo 3.1, Seedance, Kling 3, Hailuo, Wan, Nano Banana and Gemini — image and
            video, in one prompt box. The exact cost sits on the button before you press
            it: {money(cheapestClip.cheapestRunUsd)} for a {cheapestClip.shortestSeconds}
            -second clip, {money(cheapestStill.cheapestRunUsd)} for a still. No credits,
            no subscription, nothing that expires.
          </motion.p>

          <motion.div className="hero__actions" {...enter(0.72)}>
            <Link className="button button--lit" href="/studio">
              <span className="button__sphere" />
              Open the studio
            </Link>
            <a className="button button--quiet" href="#prices">
              All {modelCount} prices
            </a>
          </motion.div>

        </div>

        {/* Output, at the size output deserves. A stranger has to see what comes
            out of this thing before reading a word about what it costs. */}
        <motion.div
          className="hero__stage"
          initial={reduced ? false : { opacity: 0, y: 28, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.1, ease: EASE, delay: 0.3 }}
        >
          <figure className="stage">
            <video
              src="/showcase/c-horizon.mp4"
              poster="/showcase/s1-horizon.webp"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
            <figcaption>
              <span className="stage__model">
                Cinema Studio 3.0 · 5s · generated 1 Sep 2026
              </span>
              <span className="stage__prompt">
                &ldquo;a lone figure on a black salt flat at dawn, heat haze bending the
                light&rdquo;
              </span>
            </figcaption>
          </figure>

          <div className="stage__ticket">
            <span className="stage__ticket-label">What a clip like that costs here</span>
            {ticket.map((row, index) => (
              <span
                key={row.model}
                className={`stage__ticket-row${index ? " stage__ticket-row--muted" : ""}`}
              >
                <span>
                  {row.model} · {row.unit}
                </span>
                <span className="figure">{row.price}</span>
              </span>
            ))}
          </div>
        </motion.div>

        {/* The price strip runs the full width under both columns, so the
            bottom of the first screen carries figures rather than black. */}
        <motion.ul className="hero__chips" {...enter(0.82)}>
          {chips.map((chip) => (
            <li key={chip.model} className="chip">
              <span className="chip__model">{chip.model}</span>
              <span className="chip__unit">{chip.unit}</span>
              <span className="chip__price figure">{chip.price}</span>
            </li>
          ))}
        </motion.ul>
      </div>

      <motion.div
        className="hero__foot"
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: EASE, delay: 0.95 }}
      >
        <span>The interface is one scroll down</span>
        <span className="hero__rule" />
      </motion.div>
    </header>
  );
}
