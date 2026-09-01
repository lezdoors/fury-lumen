"use client";

import { useMemo, useState } from "react";
import { Reveal } from "./motion";
import type { PriceRow } from "@/lib/catalog";

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

/**
 * The comparison a subscription cannot make: what a month actually costs when
 * every generation is priced. The plan figure is typed in rather than asserted —
 * quoting a competitor's price on a public page means owning that number, and
 * the operator already knows theirs.
 */
export function Arithmetic({ rows }: { rows: PriceRow[] }) {
  const video = useMemo(
    () => rows.filter((row) => row.mediaKind === "video").sort((a, b) => a.unitCostUsd - b.unitCostUsd),
    [rows],
  );
  const stills = useMemo(
    () => rows.filter((row) => row.mediaKind === "image").sort((a, b) => a.unitCostUsd - b.unitCostUsd),
    [rows],
  );

  const [endpoint, setEndpoint] = useState(video[0]?.endpoint ?? "");
  const [clips, setClips] = useState(40);
  const [seconds, setSeconds] = useState(video[0]?.shortestSeconds ?? 4);
  const [images, setImages] = useState(60);
  const [plan, setPlan] = useState(49);

  const model = video.find((row) => row.endpoint === endpoint) ?? video[0];
  const still = stills[0];
  if (!model || !still) return null;

  const lengths = model.durations ?? [seconds];
  const useSeconds = lengths.includes(seconds) ? seconds : lengths[0];

  const clipCost = model.unitCostUsd * useSeconds;
  const monthly = clipCost * clips + still.unitCostUsd * images;
  const breakeven = clipCost > 0 ? Math.floor((plan - still.unitCostUsd * images) / clipCost) : 0;

  return (
    <section className="section arithmetic" id="arithmetic">
      <div className="section__head">
        <Reveal>
          <p className="kicker">Arithmetic</p>
        </Reveal>
        <Reveal delay={0.06}>
          <h2 className="display">
            What a month costs, before the month happens.
          </h2>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="lede">
            Set your real volume. The figure on the right is the sum of the same prices
            listed above — no rounding, no bundle, no unused allowance.
          </p>
        </Reveal>
      </div>

      <Reveal delay={0.08}>
        <div className="calc">
          <div className="calc__controls">
            <label className="field">
              <span className="field__label">Video model</span>
              <select
                value={model.endpoint}
                onChange={(event) => {
                  const next = video.find((row) => row.endpoint === event.target.value);
                  setEndpoint(event.target.value);
                  if (next?.shortestSeconds) setSeconds(next.shortestSeconds);
                }}
              >
                {video.map((row) => (
                  <option key={row.endpoint} value={row.endpoint}>
                    {row.label} — ${row.unitCostUsd.toFixed(4).replace(/0+$/, "")}/sec
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field__label">
                Clips a month <b className="figure">{clips}</b>
              </span>
              <input
                type="range"
                min={0}
                max={400}
                step={5}
                value={clips}
                onChange={(event) => setClips(Number(event.target.value))}
              />
            </label>

            <div className="field">
              <span className="field__label">Seconds a clip</span>
              <div className="durations__row">
                {lengths.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`duration${value === useSeconds ? " duration--on" : ""}`}
                    onClick={() => setSeconds(value)}
                  >
                    {value}s
                  </button>
                ))}
              </div>
            </div>

            <label className="field">
              <span className="field__label">
                Stills a month <b className="figure">{images}</b> · {still.label} at{" "}
                <span className="figure">${still.unitCostUsd}</span>
              </span>
              <input
                type="range"
                min={0}
                max={1000}
                step={10}
                value={images}
                onChange={(event) => setImages(Number(event.target.value))}
              />
            </label>

            <label className="field">
              <span className="field__label">
                Your current monthly plan, if you have one
              </span>
              <input
                type="number"
                min={0}
                step={1}
                value={plan}
                onChange={(event) => setPlan(Number(event.target.value))}
              />
            </label>
          </div>

          <div className="calc__readout">
            <p className="calc__label">Per clip</p>
            <p className="calc__clip figure">{money(clipCost)}</p>
            <p className="calc__label">This month</p>
            <p className="calc__total figure">{money(monthly)}</p>
            <p className="calc__delta">
              {plan > 0 ? (
                monthly < plan ? (
                  <>
                    <span className="calc__good figure">{money(plan - monthly)}</span> less
                    than the plan. It stays less until you pass{" "}
                    <b className="figure">{Math.max(breakeven, 0)}</b> clips a month.
                  </>
                ) : (
                  <>
                    <span className="calc__bad figure">{money(monthly - plan)}</span> more
                    than the plan. Above{" "}
                    <b className="figure">{Math.max(breakeven, 0)}</b> clips a month at this
                    model and length, a flat plan is the cheaper instrument — and this page
                    is not going to pretend otherwise.
                  </>
                )
              ) : (
                <>Nothing to compare against. Set a plan figure to see the crossover.</>
              )}
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
