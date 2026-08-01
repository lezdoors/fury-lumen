# Lumen — UI/UX improvement brief

Paste this whole file as the opening message of a fresh session.

---

## What you're working on

`~/lumen` — a pay-per-generation interface for AI image and video. One box:
describe it, pick a model, generate. Results land in a grid below. **The price
of a click is on the button before you click it.** That last point is the entire
product thesis: Higgsfield hides cost behind credits, Lumen shows dollars.

Next 16 (Turbopack), React 19, Postgres on Neon, deployed to Vercel at
`lmiere.com`. Run with `PORT=3210 pnpm dev`.

Your job is to make the interface and the experience materially better. Not to
re-architect it, rename it, or restyle it from scratch.

## Start here, before you write anything

1. Read `STATE.md` — what is verified, what is assumed, what has never run.
2. Read `UI-RESEARCH.md` — competitive analysis of Krea, Runway, Frame.io,
   Midjourney, Figma Weave. Its conclusions still hold.
3. Run the app and use it. Configure `Proof mode · video` in the model sheet and
   generate something. It costs nothing and exercises the full loop.

## Two environment traps that will waste an hour each

- **Reload once after starting the dev server.** Turbopack compiles CSS lazily;
  a page loaded seconds after a cold start can reference a chunk still being
  built. Safari caches that miss and renders the document unstyled *for its
  lifetime*. The chunk 200s immediately afterwards, which makes the server look
  innocent.
- **`allowedDevOrigins` in `next.config.ts` must stay.** Without it the app
  server-renders perfectly at `127.0.0.1` and is completely dead to every click,
  with no error in the browser console. The warning is in the dev-server log.

## The register is locked — do not re-open it

**AgentFlow.** Charcoal top carrying an architectural grid with hatched cells →
orange bloom through the middle → light frosted ask-box floating in it → the
library on light ground below. Accent phrase in orange italic serif with a rule
under it. Action is a lit sphere. Saturated orange, not amber.

This was chosen from four references after several rejected passes. Ryan's
feedback that killed the earlier attempts: *"too generic and predictable"* and
*"you are not using any of these ideas."* Do not drift back toward tasteful
neutral. Do not introduce a second accent colour.

Two structural rules that are not preferences — both were bugs first:

- **`.page__sky` is a fixed-height block, not a percentage ramp.** Page
  percentages put the light section thousands of pixels below where it's needed
  once the grid is long, and the library ends up on orange with unreadable dark
  type.
- **`.results` owns its own light background** so it can never inherit the bloom.

## Things that will silently break if you're not careful

- **Every layout rule uses logical properties** (`inset-inline-start`,
  `padding-inline`, `border-inline-start`). This is why Arabic RTL works from a
  single `dir="rtl"` with no second stylesheet. Write `left`/`right` and you
  break Arabic without noticing.
- **Prompts use `unicode-bidi: plaintext`** so each takes direction from its own
  content. Remove it and English prompts clip from the wrong edge in Arabic.
- **Latin metadata is isolated `direction: ltr`** or model ids and prices reorder
  around their own punctuation in RTL.
- **The grid uses `<img>` with `?poster=1`, never `<video>`.** Safari will not
  paint a frame from `<video preload="metadata">` however you seek it, so a grid
  of video elements is blank tiles there. The poster endpoint renders a JPEG with
  ffmpeg and caches it.
- **`currentColor` does not work through `<img>`.** An SVG loaded that way is an
  isolated document and falls back to black. Inline SVG, or ship explicit
  light/dark files.
- **Locale is read via `useSyncExternalStore`**, not set from an effect. Keeps
  hydration clean while the server renders English and the client differs.

## Do not reintroduce

These were deliberately removed and are not oversights:

- Brand or workspace switchers (Maison Tanneurs / Izem) — Lumen is a general tool
- A/B/C/D take letters — unreadable past three, and no comparable product does it
- Chat-first framing — `UI-RESEARCH.md` ruled it out explicitly
- Credits, tokens, or any abstraction over the dollar price
- Glassmorphism as decoration — glass is used once, on the ask-box, deliberately

## Where the actual UX gaps are

Ranked by how much they cost the user:

1. **Reference image upload is disabled.** The `+` button is inert. Image-to-video
   is the real workflow — a product still in, a video out. The models are already
   in the catalogue (`.../image-to-video`) and the API accepts `referenceUrls`.
   This is the single biggest missing capability.
2. **No retry or vary.** A failed generation is a dead end; a good one can't be
   re-rolled or nudged. Both are one-click operations in every comparable tool.
3. **The model sheet doesn't help anyone choose.** It lists seven models with
   prices from $0.045/s to $0.682/s — a 15× spread — and offers no basis for
   picking. This is the most under-exploited surface in the app: making cost and
   trade-off legible *is* the product's differentiator.
4. **No spend guard.** Seedance at 1080p is ~$3.41 per 5s clip. Nothing warns,
   confirms, or caps. A misclick is real money.
5. **The running state says little.** Elapsed and queue position exist; there's
   no sense of progress or expected duration.
6. **The library doesn't scale.** No search, no filter by model or date, no way
   to find the good one among hundreds.
7. **Mobile is untested beyond "does not overflow."**
8. **Keyboard is thin** — only `⌘↵` and `Esc`.

## How to verify — screenshots are not enough

There's a puppeteer-core rig pattern used throughout this project. Launch
headless Chrome against `localhost:3210`, drive real interactions, and assert on
computed values — not on how a screenshot looks. Specifically:

- Confirm React actually hydrated (`Object.keys(el).some(k => k.startsWith("__react"))`).
  A page can render perfectly and be entirely dead.
- Check `document.documentElement.scrollWidth > clientWidth` for horizontal
  overflow at **1920, 1512, 1024 and 430px**. Every pass so far has held this.
- Verify in **all four locales**, including `dir="rtl"`.
- Assert the primary action is in view and not below the fold.

Chrome and Safari have disagreed repeatedly in this project, and Chrome was the
optimistic one every time. If a change touches media or CSS delivery, check
Safari too.

## Ground rules

- Typecheck, lint and production build must stay clean.
- Don't touch `src/lib/providers/`, `catalog.ts`, or pricing — the catalogue was
  verified against fal's live API and the numbers are real.
- **Never fire a paid generation to test UI.** Proof mode renders real assets for
  free and exercises the identical code path.
- Commit in coherent pieces with messages that explain *why*, not what.
