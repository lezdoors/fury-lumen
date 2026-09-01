"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Reveal } from "./motion";

interface Piece {
  src: string;
  kind: "still" | "clip";
  model: string;
  caption: string;
  /** Grid span, so the wall reads as a wall and not as a row of postage stamps. */
  cell: "wide" | "tall" | "square" | "landscape";
  poster?: string;
}

/**
 * Everything here was generated on 1 September 2026 for this page. The model
 * named on a tile is the model that made it — see the note under the wall for
 * why those names are not the fal endpoints in the price list.
 */
const PIECES: Piece[] = [
  {
    src: "/showcase/c-horizon.mp4",
    poster: "/showcase/s1-horizon.webp",
    kind: "clip",
    model: "Cinema Studio 3.0",
    caption: "5s · heat haze on a salt flat, locked-off camera",
    cell: "wide",
  },
  {
    src: "/showcase/s3-portrait.webp",
    kind: "still",
    model: "Nano Banana Flash",
    caption: "Editorial portrait, one furnace off frame left",
    cell: "tall",
  },
  {
    src: "/showcase/c-dancer.mp4",
    poster: "/showcase/s6-dancer.webp",
    kind: "clip",
    model: "Cinema Studio 3.0",
    caption: "5s · dust in a single orange strobe, slow motion",
    cell: "tall",
  },
  {
    src: "/showcase/s2-cube.webp",
    kind: "still",
    model: "Nano Banana Flash",
    caption: "Machined titanium, one hard key light",
    cell: "square",
  },
  {
    src: "/showcase/c-fissure.mp4",
    poster: "/showcase/s4-fissure.webp",
    kind: "clip",
    model: "Cinema Studio 3.0",
    caption: "5s · lava creeping through basalt, aerial drift",
    cell: "landscape",
  },
  {
    src: "/showcase/s5-whisky.webp",
    kind: "still",
    model: "Nano Banana Flash",
    caption: "Caustics thrown by a bare filament bulb",
    cell: "landscape",
  },
];

export function Wall() {
  return (
    <section className="section wall" id="work">
      <div className="section__head">
        <Reveal>
          <p className="kicker">Output</p>
        </Reveal>
        <Reveal delay={0.06}>
          <h2 className="display">
            Stills and motion, out of the same box, in the same afternoon.
          </h2>
        </Reveal>
      </div>

      <div className="wall__grid">
        {PIECES.map((piece, index) => (
          <Reveal
            key={piece.src}
            delay={0.04 * index}
            className={`tile tile--${piece.cell}`}
          >
            <figure>
              {piece.kind === "clip" ? (
                <LazyClip src={piece.src} poster={piece.poster} />
              ) : (
                <Image
                  src={piece.src}
                  alt={piece.caption}
                  fill
                  sizes="(max-width: 40rem) 100vw, (max-width: 60rem) 50vw, 33vw"
                />
              )}
              <figcaption>
                <span className="tile__model">{piece.model}</span>
                <span className="tile__caption">{piece.caption}</span>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.1}>
        <p className="wall__provenance">
          Generated 1 September 2026 for this page, on Higgsfield — Lumen&rsquo;s own fal
          key is not live yet, so nothing here came out of the console. The console runs
          the same model families through fal, at the prices below. Nothing on this page
          is stock, and no output is credited to a model that did not make it.
        </p>
      </Reveal>
    </section>
  );
}

/**
 * Six autoplaying videos is six decoders running behind the fold. Each one only
 * plays while it is actually on screen.
 */
function LazyClip({ src, poster }: { src: string; poster?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setReady(true);
          void node.play().catch(() => {});
        } else {
          node.pause();
        }
      },
      { rootMargin: "20% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      poster={poster}
      muted
      loop
      playsInline
      preload={ready ? "auto" : "none"}
      src={ready ? src : undefined}
    />
  );
}
