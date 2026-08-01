# Lumen — UI brief

Updated 2026-07-31, after the PANEL rebuild.

## What you're working on

`~/lumen` — a pay-per-generation interface for AI image and video. One box:
describe it, pick a model, generate. Results land in a ledger below. **The price
of a click is on the button before you click it.** That is the entire product
thesis: Higgsfield hides cost behind credits, Lumen shows dollars.

Next 16 (Turbopack), React 19, Postgres on Neon, deployed to Vercel. Run with
`PORT=3210 pnpm dev`.

## Start here

1. Read `REGISTER.md` — the locked visual register, PANEL, and the rules in it
   that were bugs first.
2. Read `UI-RESEARCH.md` — analysis of Krea, Runway, Frame.io, Midjourney,
   Figma Weave. Its conclusions still hold; its "visual direction" section is
   superseded by `REGISTER.md`.
3. Run the app and use it. Pick `Proof mode · video` in the rate card and press
   Run. It costs nothing and exercises the full loop.

## Two environment traps that will each waste an hour

- **Reload once after starting the dev server.** Turbopack compiles CSS lazily;
  a page loaded seconds after a cold start can reference a chunk still building.
  Safari caches that miss and renders the document unstyled *for its lifetime*.
  The chunk 200s immediately after, which makes the server look innocent.
- **`allowedDevOrigins` in `next.config.ts` must stay.** Without it the app
  server-renders perfectly at `127.0.0.1` and is completely dead to every click,
  with no error in the browser console. The warning is in the dev-server log.

## The register is locked — read REGISTER.md, don't re-open it

**PANEL.** A pale cool instrument chassis with true-dark wells cut into it, one
lacquered vermilion for money / live / go, Martian Mono as the silkscreen voice.
The quote is the largest object on screen. The rate card is printed on the panel
rather than hidden behind a button. The RUN key arms above $1.

The previous register (**AgentFlow** — charcoal grid, orange bloom, frosted
glass ask-box, light library below) is retired. Do not reintroduce its gradient
sky, its glass, or its amber.

## Do not reintroduce

Deliberately removed, not oversights:

- Brand or workspace switchers — Lumen is a general tool
- A/B/C/D take letters — unreadable past three
- Chat-first framing — `UI-RESEARCH.md` ruled it out explicitly
- Credits, tokens, or any abstraction over the dollar price
- Glassmorphism, gradients, glow, blur — there is none left in the build
- A model sheet behind a button — the rate card is the panel

## What landed in the PANEL pass

Against the old ranked gap list:

1. **Reference upload is wired.** `POST /api/uploads` stores the frame; the
   composer takes a click, a drop or a paste. Attaching one auto-switches to the
   family's image-to-video model, and `RUN` is blocked with a reason if the
   selected model cannot take a reference. Fal gets the bytes as a **data URI**
   (`src/lib/assets.ts` `inlineLocalAsset`) because a `localhost` asset path is
   unreachable from their side — handing fal a URL was never going to work here.
2. **Retry and reuse.** Every tile carries `AGAIN` (re-run the recorded recipe
   exactly) and `REUSE` (load prompt, model, ratio, duration and references back
   into the composer). `REUSE` is in the viewer too.
3. **The model sheet is gone.** Seven models, sorted cheapest first, printed on
   the rail with proportional cost bars, a `REF` chip on the ones that take a
   reference frame, and the availability reason under any that are off.
4. **Spend guard.** Above `$1.00` the RUN key arms instead of firing. Arming is
   stored as a signature of the recipe, so any edit disarms it; it expires after
   six seconds.
5. **The running state** carries the serial, elapsed clock, provider queue
   position and a scanning indicator. **It shows no percentage and no ETA** —
   nothing in the catalogue publishes a duration estimate, and a fabricated
   number is worse than none.
6. **The ledger scales** — free-text search across prompt, model and serial,
   plus filters for video / image / kept / failed.
7. **Mobile is verified**, not assumed. See below.
8. **Keyboard**: `⌘↵` run, `/` focus the prompt, `Esc` close or disarm,
   `←` / `→` step through the ledger inside the viewer.

## Still open

- **The ledger has no date filter or grouping.** Search covers prompt, model and
  serial; there is no "last 7 days".
- **No A/B compare.** `UI-RESEARCH.md` § Frame.io still describes what this
  should be; nothing has been built.
- **Provider error strings and availability reasons are English only** — they
  come from the server and are not routed through the dictionary.
- **No cancel path for a running job.** There is no provider-side cancel and no
  UI for one, so a mistaken expensive run cannot be stopped.
- **Safari has not been re-checked since the rebuild.** Chrome has been, at four
  widths and four locales. Chrome and Safari have disagreed repeatedly on this
  codebase and Chrome was the optimistic one every time.

## Verification — screenshots are not enough

Drive real interactions with a puppeteer-core rig against `localhost:3210` and
assert on computed values, not on how a screenshot looks:

- Confirm React hydrated (`Object.keys(el).some(k => k.startsWith("__react"))`).
  A page can render perfectly and be entirely dead.
- Check `scrollWidth > clientWidth` at **1920, 1512, 1024 and 430px**.
- Verify in **all four locales**, including `dir="rtl"`.
- Assert the RUN key is in view, not below the fold.

## Ground rules

- Typecheck, lint and production build stay clean.
- `src/lib/catalog.ts` prices and model ids were verified against fal's live API.
  Don't edit the numbers or the endpoints.
- **Never fire a paid generation to test UI.** Proof mode renders real assets for
  free through the identical code path.
- Commit in coherent pieces, messages explaining *why*.
