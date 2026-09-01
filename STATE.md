# Lumen — state

Updated 2026-07-31, end of the overnight session.

## Where it runs

- **Local** (full function): `PORT=3210 pnpm dev` → http://localhost:3210
- **Hosted** (preview): https://www.raccordement-connect.com — Vercel project
  `lumen` under team `haddaoui`, deployed from `main`. The apex 301s to www.
  `lumen-omega-roan.vercel.app` remains as the deployment alias.

raccordement-connect.com was repurposed for Lumen on 2026-07-31. Its DNS already
pointed at Vercel, so attaching the domains to the project was the whole job —
no registrar change was needed. Vercel's "DNS Change Recommended" badge is a
nudge toward newer IPs and can be ignored while the current records resolve.

The hosted copy is a preview, not the tool. Vercel gives no writable disk and no
ffmpeg, so:
- generation history does not persist and is not shared between instances;
- Proof mode returns a shipped sample clip inline instead of rendering one.

That second point is not cosmetic. A queued job needs its record to survive
between requests; on a stateless host the poll lands on an instance that never
saw it and the generation 404s mid-flight. `canPersist()` probes the disk once
and decides. Real work stays local until jobs live in a database and assets in
blob storage.

## Run it

```bash
cd ~/lumen && PORT=3210 pnpm dev
```

Open **http://127.0.0.1:3210** (or `localhost` — both work; `allowedDevOrigins`
in `next.config.ts` is what makes 127.0.0.1 hydrate, do not remove it).

Try it with **Proof mode · video** in Configure. It renders a real mp4 through
ffmpeg with a simulated queue, so the whole loop works and costs nothing.

## What works

Submit → queue → poll → download → reveal → approve/reject → history. Two brand
workspaces. Every generation records model, prompt, cost and provenance in
`data/jobs.json`. `⌘↵` generates, `⌘H` history, `Esc` closes layers.

## Design register — locked

**AgentFlow**, applied whole including the white lower half.

Charcoal top carrying an architectural grid with hatched cells, an orange bloom
through the middle, a light frosted ask-box floating in it, and the library on
the light ground below. Accent phrase in orange italic serif with a rule under
it. Action is a lit sphere. Cost sits beside it in real dollars.

Two structural rules learned the hard way:
- The dark-to-light run is a fixed-height block (`.page__sky`), not a percentage
  ramp over the document. Page percentages put the light section thousands of
  pixels below where it is needed once the grid is long, and the library ends up
  on orange with unreadable dark type.
- `.results` owns its own light background so it can never inherit the bloom.

## What Lumen is

A general generation tool — our own Higgsfield. One box: describe it, pick a
model, generate; results land in a grid; you pay per generation in real dollars
and always see the price before you click.

It is NOT brand-scoped. Early builds inherited Maison Tanneurs / Maison Izem
workspaces and A/B/C/D take letters from the first scaffold. Both were removed
on 2026-07-31 — Higgsfield has neither, and neither belongs here.

## Languages

EN, FR, ES, AR with a switcher in the top bar. Preference persists in
localStorage and falls back to the browser's languages.

Arabic mirrors the whole interface via `dir="rtl"` on the document — no
duplicate layout, because every rule was already written with logical
properties. Two rules earn their keep there: Latin metadata (ids, prices) is
isolated `direction: ltr` so it does not reorder around its punctuation, and
prompts use `unicode-bidi: plaintext` so each one takes direction from its own
first strong character rather than the page's.

The locale is read through `useSyncExternalStore` rather than an effect, so the
server can render English and the client can differ without a hydration
mismatch.

Still English: provider error strings and model availability reasons, which come
from the server.

## Not done

- **Nothing has ever called fal. No key, $0 spent.**
- Model ids and per-second prices in `src/lib/catalog.ts` are **unverified
  guesses** (`fal-ai/kling-video/...` at $0.09/sec). Fal's own credit tiers imply
  ~$3.00/video for Seedance 2 — roughly 7× higher. Fal's public pages returned
  429 twice when I tried to check. **Verify before trusting any number the UI
  shows, and before firing anything.**
- Fal's live catalogue is org-prefixed (`bytedance/`, `minimax/`, `alibaba/`),
  so the `fal-ai/kling-video/...` ids may not exist at all.
- Reference-frame upload (the `+` button) is present but disabled — image-to-video
  is not wired.
- Provider choice is open. `src/lib/providers/` is a two-method contract
  (`submit`/`poll`), so going direct to a vendor instead of through fal is one
  new file and no changes elsewhere.

---

## Landing page — added 2026-09-01 (Fury)

`/` is now the landing page and the console moved to `/studio`. Nothing in the
console changed except its route and its model list.

The page is built out of `src/lib/catalog.ts` — every price, every accepted
duration and the model count are read from it at render time. Nothing is typed
into markup, because a number typed into markup outlives the repricing that
makes it wrong. `getPriceList()` exists for exactly this: one row per model with
the shortest run it will actually accept already worked out, so "from $0.12" can
point at the row it came from.

Prices and durations were read off fal's own APIs on **2026-09-01**. The date is
printed on the page.

### Catalogue

21 models: 14 video, 7 stills. Veo 3.1 (three tiers), Kling 3 / 2.5 Turbo,
Hailuo 02, Wan 3.0, Seedance 2.0 / 2.5, plus Kling Image o3, FLUX.2 Pro, the
Nano Banana family and two Gemini image models. Cheapest complete run is $0.12
(Veo 3.1 Lite, 4s at $0.03/sec); dearest listed second is Seedance 2.0 at
$0.3034. Video prices span 10× as listed, and 16× once Seedance 2.5 runs at
1080p ($0.473/sec).

`FalVideoProvider` is now `FalProvider` and handles stills as well: no `duration`
field for an image model, `image_size` instead of `aspect_ratio` for FLUX.2, and
the result walker accepts image URLs. Fal rejects an unknown field outright, so
the payload shape has to be right at submit time.

### Two bands

The page runs in two registers, and the seam between them is hard on both
edges. Media — hero, the box, the wall — stays in the black room, where a
generated frame is the brightest thing on the screen. The argument — prices,
arithmetic, steps, questions — sits on warm paper, because twenty-one rows of
prices is a document and a document on black is a poster nobody reads.

Paper tokens live in `tokens.css` but nothing outside `.paper` uses them; the
console never enters that band. The one exception inside it is the calculator's
readout, which keeps the room's darkness so the monthly total reads as lit
rather than printed.

A graded top edge was tried and reverted: it put the provenance note — the one
paragraph on the page that has to be read — halfway up a ramp from black to
paper, legible at neither end.

The dark half was also lifted off pure black (cards to oklch(12%), edges to
0.2 alpha, the two dimmest inks up two steps), scoped to `.page` so the console
keeps the register it was tuned in.

### Assets

`public/showcase/` — three 5s clips and six stills, generated on Higgsfield on
2026-09-01 specifically for this page, because Lumen has no fal key yet and
`~/brand-assets` does not exist on this machine. The page says so, in the note
under the wall. Each tile is credited to the model that actually made it.

### Not done

- Nothing has still ever called fal. No key, $0 spent.
- Not deployed. Push to `main` is what deploys, so this landed on a branch.
- The console's rate card was laid out for nine models and now carries 21; the
  rail scrolls, but it wants a second look.

## Studio, 2026-09-01 — made usable at 21 models (Fury)

Three things were wrong the moment the catalogue went from nine models to
twenty-one, and all three only show up at that size:

- **The rail grew through the mast.** `.rail` is anchored to the bottom edge, so
  an unbounded rate list grows *upward* and sits on top of the wordmark. The
  list now scrolls inside itself, capped at `min(46vh, 26rem)`, with the top and
  bottom edges masked so a cut-off row reads as "more above" and not as a bug.
- **One filter, because twenty-one rows is past scanning.** All / Video / Stills,
  in all four languages.
- **The same sentence, twenty-one times.** Every unconfigured model repeated
  "Add FAL_KEY to .env.local". Per-row reasons are now shown only for models
  that actually work — a note about audio pricing is worth a line — and each
  distinct blocker is stated once, under the card.

### Shot lists

The composer takes one prompt per line and fires one job per line, sequentially.
An episode is a shot list, not a clip, and typing twelve prompts into the same
box twelve times was the job this tool exists to remove. Sequential rather than
parallel because serials are assigned in creation order, and a shot list that
lands out of order is one you re-sort by hand. The button carries the count and
the total (`Run ×3 $0.36`); a single-line prompt is a batch of one, so the
ordinary path is unchanged. If a job in the middle fails, the unsent remainder
stays in the box rather than being silently dropped.

Verified end to end through CDP against proof mode: three lines in, three jobs
out, serials LMN-0004 to LMN-0006, no faults.

### Downloads

Per tile, and one control for the whole filtered set. Sequential with a 350ms
gap — a browser silently drops a burst of simultaneous same-origin downloads.
Filenames are the serial, so LMN-0006.mp4 lands on the disk already named.

### The blocker

**There is still no `FAL_KEY`.** Not in `.env.local` here, and the Vercel project
carries only `DATABASE_URL`. Every fal model is therefore listed and priced but
not runnable, in production and locally. Proof mode is the only path that
executes.
