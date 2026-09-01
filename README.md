# Lumen

A pay-per-generation interface for AI image and video. One box: describe it,
pick a model, generate. Results land in a grid. The price of a click is on the
button before you click it.

`/` is the landing page. `/studio` is the console.

Built to replace a flat monthly aggregator subscription with per-generation
billing, and to be usable by someone who does not want to learn what a model is.

## Run

```bash
pnpm install --ignore-scripts
PORT=3210 pnpm dev
```

Open http://localhost:3210. If the page renders unstyled on the very first load
after starting the server, reload once — Turbopack compiles CSS lazily and a
request that arrives mid-compile caches the miss.

**Proof mode needs no keys and costs nothing.** It renders a real MP4 through
ffmpeg behind a simulated queue, so the whole submit → poll → asset → review
loop can be exercised before any provider is configured.

## Configure a provider

```bash
cp .env.example .env.local
```

Models appear as unavailable, with the reason, until their key is present.
Secrets stay server-side and never reach the browser.

## How it works

Generation is split into `submit()` and `poll()` (`src/lib/providers/`). Image
models answer inline; video queues for minutes, far past any HTTP route budget,
so async providers return a handle and `POST /api/jobs` answers `202`
immediately. Polling is pull-based, driven by whoever is looking at a job —
there is deliberately no background sweeper, because a timer that keeps calling
a paid provider while nobody is watching is the exact failure this tool exists
to avoid.

Video is billed per second of output, so cost is declared per second and
estimated from the chosen duration rather than pinned to one invented number.

Adding a provider is one file implementing the two-method contract. Nothing
else changes.

## Languages

English, French, Spanish and Arabic. Arabic mirrors the entire interface from a
single `dir="rtl"`, because every rule is authored with logical properties.

## Commands

```bash
pnpm dev        # local development
pnpm lint       # lint
pnpm typecheck  # TypeScript
pnpm build      # production build
```

## Status

See `STATE.md` for what is verified, what is assumed, and what has never run.

Model ids, prices and accepted durations in `src/lib/catalog.ts` were read off
fal's own APIs on **2026-09-01** — prices from `https://fal.ai/api/models`
(`pricingInfoOverride`), durations from each endpoint's OpenAPI `duration` enum.
The landing page prints those figures verbatim, so re-read them before changing
anything there: a guess in that file becomes a false claim on a public site.
