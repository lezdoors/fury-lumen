# Lumen — state

Updated 2026-07-31, end of the overnight session.

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

**AgentFlow**, chosen 2026-07-31. Warm three-lobe bloom low in the frame,
architectural grid with hatched cells, warm frosted glass composer, solid warm
disc action, segmented workspace switcher, pill status chips.

Deliberately not adopted: AgentFlow's white lower half.

**The one rule that is not a preference:** the stage stays neutral. Grain, grid
and bloom all sit at `z-index: -1/-2` behind an opaque stage. A coloured or
textured immediate surround measurably shifts how a take reads, and this is a
tool for deciding whether a take is right. Decorate the chrome, never the stage.
`.empty-stage` may glow — no media is present.

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
