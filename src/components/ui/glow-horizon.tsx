"use client";

import { motion } from "framer-motion";

/**
 * Four stacked ellipses, painted back to front: a white core, two coloured
 * spreads, and a black one last that occludes the middle and leaves a crescent
 * of light. A sun cresting a horizon, drawn with border-radius.
 *
 * The palette is Lumen's, not the reference's — ember, because the accent means
 * heat and heat is what compute costs.
 */

const EASE = [0.16, 1, 0.3, 1] as const;
const DURATION = 2;

export type GlowHorizonVariant = "top" | "bottom" | "left" | "right";

const VARIANTS: Record<
  GlowHorizonVariant,
  { axis: "x" | "y"; scaleAxis: "scaleX" | "scaleY"; enterPct: string; restPct: string }
> = {
  top: { axis: "y", scaleAxis: "scaleY", enterPct: "-100%", restPct: "-50%" },
  bottom: { axis: "y", scaleAxis: "scaleY", enterPct: "100%", restPct: "50%" },
  left: { axis: "x", scaleAxis: "scaleX", enterPct: "100%", restPct: "50%" },
  right: { axis: "x", scaleAxis: "scaleX", enterPct: "-100%", restPct: "-50%" },
};

export interface GlowHorizonProps {
  className?: string;
  variant?: GlowHorizonVariant;
  /** ember is Lumen's. violet is the reference palette, kept for comparison. */
  palette?: "ember" | "violet";
}

const PALETTES = {
  ember: { hot: "#FF8A3D", deep: "#B02A05" },
  violet: { hot: "#A558FB", deep: "#4922E5" },
} as const;

export default function GlowHorizon({
  className,
  variant = "top",
  palette = "ember",
}: GlowHorizonProps) {
  const { axis, scaleAxis, enterPct, restPct } = VARIANTS[variant];
  const { hot, deep } = PALETTES[palette];

  return (
    <motion.div
      aria-hidden
      className={"glow-horizon " + (className ?? "")}
      style={{ isolation: "isolate" }}
      initial={{ [axis]: enterPct, [scaleAxis]: 1.5, opacity: 0, filter: "blur(15px)" }}
      animate={{ [axis]: restPct, [scaleAxis]: 1, opacity: 1, filter: "blur(0px)" }}
      transition={{ duration: DURATION, ease: EASE }}
    >
      <Arc
        variant={variant}
        color="#FFFFFF"
        size="132%"
        boxShadow="0px -4px 23px 0px #ffffffb5"
        delay={1.2}
      />
      <Arc variant={variant} color={hot} size="120%" initialOffset="10%" blur={31} delay={0.6} />
      <Arc variant={variant} color={deep} size="124%" initialOffset="10%" blur={21} delay={0} />
      <Arc variant={variant} color="#000" size="120%" initialOffset="10%" blur={51} delay={0} />
    </motion.div>
  );
}

function Arc({
  variant,
  color,
  size,
  initialOffset,
  blur,
  boxShadow,
  delay,
}: {
  variant: GlowHorizonVariant;
  color: string;
  size: string;
  initialOffset?: string;
  blur?: number;
  boxShadow?: string;
  delay: number;
}) {
  const scale = parseFloat(size) / 100;
  const { axis, enterPct } = VARIANTS[variant];
  const sign = enterPct.startsWith("-") ? -1 : 1;
  const startPct = initialOffset
    ? `${sign * Math.abs(parseFloat(initialOffset) - 50)}%`
    : undefined;

  return (
    <motion.div
      aria-hidden
      className="glow-horizon__arc"
      style={{
        scale,
        background: color,
        ...(blur !== undefined && { filter: `blur(${blur}px)` }),
        ...(boxShadow && { boxShadow }),
      }}
      initial={startPct ? { [axis]: startPct } : false}
      animate={startPct ? { [axis]: 0 } : undefined}
      transition={{ duration: DURATION, ease: EASE, delay }}
    />
  );
}
