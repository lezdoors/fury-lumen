"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

/** One easing curve for the whole page. The hero's arcs use it too. */
export const EASE = [0.16, 1, 0.3, 1] as const;

export const riseIn: Variants = {
  hidden: { opacity: 0, y: 26, filter: "blur(6px)" },
  shown: { opacity: 1, y: 0, filter: "blur(0px)" },
};

/**
 * Everything that enters on scroll enters the same way: once, upward, out of
 * blur. `once` matters — a section that re-animates every time it passes the
 * viewport turns a scroll back into a flicker.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "p" | "h2";
}) {
  const Component = motion[as];
  return (
    <Component
      className={className}
      variants={riseIn}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration: 0.85, ease: EASE, delay }}
    >
      {children}
    </Component>
  );
}

/** A headline that arrives a word at a time. Used exactly twice on the page. */
export function WordsIn({
  text,
  className,
  delay = 0,
  stagger = 0.055,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
}) {
  const reduced = useReducedMotion();
  const words = text.split(" ");
  return (
    <span className={className} aria-label={text}>
      {words.map((word, index) => (
        <span key={`${word}-${index}`} className="wordsin__mask" aria-hidden>
          <motion.span
            className="wordsin__word"
            initial={reduced ? false : { y: "110%", opacity: 0 }}
            animate={reduced ? undefined : { y: "0%", opacity: 1 }}
            transition={{ duration: 1, ease: EASE, delay: delay + index * stagger }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
