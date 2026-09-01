"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { EASE, Reveal } from "./motion";
import type { PriceRow } from "@/lib/catalog";

const PROMPT =
  "A lone figure on a black salt flat at dawn, an enormous incandescent sun cresting the horizon behind them, heat haze bending the light, 35mm";

/** The five the demo offers. Every one is a row out of the catalogue. */
const SHOWN = [
  "fal-ai/veo3.1/lite",
  "fal-ai/minimax/hailuo-02/standard/text-to-video",
  "fal-ai/kling-video/v3/standard/text-to-video",
  "bytedance/seedance-2.5/text-to-video",
  "fal-ai/nano-banana-2",
];

function money(value: number) {
  return value >= 1 ? `$${value.toFixed(2)}` : `$${value.toFixed(value < 0.1 ? 3 : 2)}`;
}

export function Box({ rows }: { rows: PriceRow[] }) {
  const reduced = useReducedMotion();
  const models = useMemo(
    () =>
      SHOWN.map((endpoint) => rows.find((row) => row.endpoint === endpoint)).filter(
        (row): row is PriceRow => Boolean(row),
      ),
    [rows],
  );

  const [index, setIndex] = useState(0);
  const model = models[index];
  // The chosen length is held loosely: it only applies while the current model
  // accepts it, so switching models cannot leave a duration behind that the
  // endpoint would refuse.
  const [chosen, setChosen] = useState<number | null>(null);
  // Once the operator touches it, the demo stops driving itself. A control that
  // keeps moving under the cursor is not a control.
  const [touched, setTouched] = useState(false);
  const [typed, setTyped] = useState(reduced ? PROMPT : "");

  useEffect(() => {
    if (reduced) return;
    let position = 0;
    const timer = window.setInterval(() => {
      position += 1;
      setTyped(PROMPT.slice(0, position));
      if (position >= PROMPT.length) window.clearInterval(timer);
    }, 18);
    return () => window.clearInterval(timer);
  }, [reduced]);

  useEffect(() => {
    if (touched || reduced) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % models.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [touched, reduced, models.length]);

  if (!model) return null;

  const isVideo = model.mediaKind === "video";
  const durations = durationsFor(model);
  const seconds =
    chosen !== null && durations.includes(chosen) ? chosen : (model.shortestSeconds ?? 0);
  const price = isVideo ? model.unitCostUsd * seconds : model.unitCostUsd;

  const pick = (next: number) => {
    setTouched(true);
    setIndex(next);
  };

  return (
    <section className="section box" id="box">
      <div className="section__head">
        <Reveal>
          <p className="kicker">The box</p>
        </Reveal>
        <Reveal delay={0.06}>
          <h2 className="display">
            One field, one list, one lit button — and the button already knows what it
            costs.
          </h2>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="lede">
            Change the model. Change the length. The figure moves before anything is
            spent. This is the real control, wired to the real price list — press it in
            the studio and the same number is what leaves the account.
          </p>
        </Reveal>
      </div>

      <Reveal delay={0.1} className="box__frame">
        <div className="console-mock">
          <div className="console-mock__prompt">
            <span className="console-mock__label">Prompt</span>
            <p className="console-mock__text">
              {typed}
              {typed.length < PROMPT.length && <span className="caret" />}
            </p>
          </div>

          <div className="console-mock__rail">
            <span className="console-mock__label">Model · {models.length} of 21 shown</span>
            <ul className="rate-list">
              {models.map((row, rowIndex) => (
                <li key={row.endpoint}>
                  <button
                    type="button"
                    className={`rate${rowIndex === index ? " rate--on" : ""}`}
                    onClick={() => pick(rowIndex)}
                    onMouseEnter={() => pick(rowIndex)}
                  >
                    <span className="rate__name">{row.label.split(" · ")[0]}</span>
                    <span className="rate__meta">
                      <span className="figure">
                        {money(row.unitCostUsd)}
                        {row.mediaKind === "video" ? "/sec" : ""}
                      </span>
                      <span className="rate__basis">{row.basis}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="console-mock__foot">
            {isVideo ? (
              <div className="durations">
                <span className="console-mock__label">Length</span>
                <div className="durations__row">
                  {durations.map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`duration${value === seconds ? " duration--on" : ""}`}
                      onClick={() => {
                        setTouched(true);
                        setChosen(value);
                      }}
                    >
                      {value}s
                    </button>
                  ))}
                </div>
                <p className="durations__why">
                  Only the lengths this model accepts. Veo refuses five seconds; Hailuo
                  02 Pro is six and nothing else.
                </p>
              </div>
            ) : (
              <div className="durations">
                <span className="console-mock__label">Length</span>
                <p className="durations__why">
                  A still has no duration — the price is flat, per image.
                </p>
              </div>
            )}

            <button type="button" className="button button--lit button--generate" disabled>
              <span className="button__sphere" />
              Generate
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={`${model.endpoint}-${seconds}`}
                  className="button__price figure"
                  initial={reduced ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.28, ease: EASE }}
                >
                  {money(Number(price.toFixed(4)))}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>

        <p className="box__note">
          {model.label} · <span className="figure">{money(model.unitCostUsd)}</span>
          {isVideo ? " per second" : " per image"} · {model.basis}
          {model.note ? ` · ${model.note}` : ""}
        </p>
      </Reveal>

      <Reveal delay={0.16} className="box__cta">
        <Link className="button button--quiet" href="/studio">
          Open the real one
        </Link>
      </Reveal>
    </section>
  );
}

/** At most four lengths, always including the shortest and the longest offered. */
function durationsFor(row: PriceRow) {
  const all = row.durations ?? (row.shortestSeconds ? [row.shortestSeconds] : []);
  if (all.length <= 4) return all;
  return [all[0], all[1], all[all.length - 2], all[all.length - 1]];
}
