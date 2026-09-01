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
