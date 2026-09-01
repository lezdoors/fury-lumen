"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import GlowHorizon from "@/components/ui/glow-horizon";
import { EASE, Reveal } from "./motion";

const STEPS = [
  {
    n: "01",
    title: "Write the thing",
    body: "One field. No parameter panel to learn, no seed to guess at, no negative prompt to invent. The interface assumes you know what you want and not what a model is.",
  },
  {
    n: "02",
    title: "Read the button",
    body: "Pick a model and a length and the button re-prices itself. Only the lengths that model actually accepts are offered, so a priced button can never turn into a failed generation you still waited for.",
  },
  {
    n: "03",
    title: "Press it once",
    body: "Video queues for minutes, so the job is polled by whoever is looking at it — there is no background timer calling a paid provider while nobody is watching. Every run lands in the ledger with its model, its prompt and what it cost.",
  },
];

const FAQ = [
  {
    q: "Is this cheaper than a subscription?",
    a: "Below your crossover, yes; above it, no. The arithmetic block computes the crossover from your own volume rather than asserting an answer. What is always true is that you can see what a click cost, which a credit balance is designed to prevent.",
  },
  {
    q: "Where do the prices come from?",
    a: "Fal's own model API, read on the date printed in the footer, quoted at the resolution and audio setting named in each row. Nothing is estimated. If fal reprices, this page is wrong until it is read again — which is why the date is on it.",
  },
  {
    q: "Do credits expire?",
    a: "There are no credits. A generation is billed when it runs and nothing is bought in advance, so there is nothing to expire.",
  },
  {
    q: "Why are the accepted lengths different for every model?",
    a: "Because they are. Veo 3.1 takes four, six or eight seconds and rejects five. Hailuo 02 Pro takes no length at all — it is always six. The picker offers only what the endpoint will accept.",
  },
  {
    q: "What happens to a job if I close the tab?",
    a: "It stays queued at the provider and the record survives in Postgres, so the generation is still there when you come back. Polling is pull-based, so nothing keeps spending while nobody is looking.",
  },
  {
    q: "What languages does it run in?",
    a: "English, French, Spanish and Arabic. Arabic mirrors the whole interface from a single dir=\"rtl\", because every rule is authored with logical properties.",
  },
];

export function Steps() {
  return (
    <section className="section steps">
      <div className="section__head">
        <Reveal>
          <p className="kicker">How it runs</p>
        </Reveal>
        <Reveal delay={0.06}>
          <h2 className="display">Three moves, and one of them is reading.</h2>
        </Reveal>
      </div>
      <ol className="steps__list">
        {STEPS.map((step, index) => (
          <Reveal as="li" key={step.n} delay={0.06 * index} className="step">
            <span className="step__n figure">{step.n}</span>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="section faq">
      <div className="section__head">
        <Reveal>
          <p className="kicker">Questions</p>
        </Reveal>
        <Reveal delay={0.06}>
          <h2 className="display">Answered without the marketing voice.</h2>
        </Reveal>
      </div>
      <ul className="faq__list">
        {FAQ.map((item, index) => {
          const isOpen = open === index;
          return (
            <li key={item.q} className={`faq__item${isOpen ? " faq__item--open" : ""}`}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : index)}
                aria-expanded={isOpen}
              >
                <span>{item.q}</span>
                <span className="faq__sign" aria-hidden>
                  {isOpen ? "−" : "+"}
                </span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.42, ease: EASE }}
                    className="faq__body"
                  >
                    <p>{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function Close({
  modelCount,
  verifiedOn,
}: {
  modelCount: number;
  verifiedOn: string;
}) {
  return (
    <footer className="close">
      <div className="close__glow">
        <GlowHorizon variant="bottom" />
      </div>
      <div className="close__body">
        <Reveal>
          <h2 className="display display--xl">
            The price is on the button.
            <span className="display__accent"> Go and press it.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <Link className="button button--lit button--big" href="/studio">
            <span className="button__sphere" />
            Open the studio
          </Link>
        </Reveal>
        <Reveal delay={0.14}>
          <p className="close__meta">
            {modelCount} models · prices read from fal on {verifiedOn} · Lumen
          </p>
        </Reveal>
      </div>
    </footer>
  );
}
