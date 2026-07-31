# Lumen

A small, provider-neutral creative production console. It keeps Maison Tanneurs and Maison Izem in separate workspaces, records generation provenance and cost, and provides a review/export loop without an aggregator UI.

## What works now

- Persistent generation history in `data/jobs.json`
- Strict brand workspaces
- Provider/model catalogue with server-side availability
- Zero-cost Proof mode that writes real SVG assets to `data/assets/`
- Direct OpenAI image adapter using the Images API
- Aspect ratio controls, cost estimates, approval/rejection and export
- Responsive production UI

Proof mode is deliberate: it exercises the full request → provider → asset → history → review workflow without making a paid API call.

## Run

```bash
pnpm install --ignore-scripts
pnpm dev
```

Open http://localhost:3000.

## Configure a direct model

```bash
cp .env.example .env.local
```

Set `OPENAI_API_KEY`, `OPENAI_IMAGE_MODEL`, and the known per-generation cost in `OPENAI_IMAGE_COST_USD`. The direct model appears disabled until both the key and model are present. Secrets never enter the browser.

## Commands

```bash
pnpm dev       # local development
pnpm lint      # lint
pnpm typecheck # TypeScript
pnpm build     # production build
```

## Design boundary

Lumen is not a Higgsfield clone. New providers belong in `src/lib/providers/`, behind the shared `GenerationProvider` contract. Add models only when they serve a repeated workflow. Product-source images must remain traceable to their approved source; generated editorial outputs must never silently replace commerce heroes.

## Next integrations

The next adapter should be chosen from actual usage and direct API access—not model-marketplace ambition. Likely candidates are one direct video provider and a reference-image editing provider. Before adding either, confirm API availability, authentication, asynchronous job semantics and actual pricing.
