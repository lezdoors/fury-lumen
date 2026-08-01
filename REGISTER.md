# Lumen — register: PANEL

Locked 2026-07-31. Replaces **AgentFlow** (charcoal grid → orange bloom → light
library, frosted glass ask-box), which is retired and must not be reintroduced.

## The argument

Lumen's whole product thesis is one sentence: **the price of a click is on the
button before you click it.** Higgsfield hides cost behind credits and covers
the hiding with gloss — purple bloom, glass, cinematic reel, hype.

A register that decorates is therefore working against the product. So Lumen is
not styled as a website with a prompt box. It is built as **the front panel of a
machine that turns dollars into footage.** The largest object on screen is not a
headline or a hero video. It is the quote.

## Two materials, one signal

| | |
|---|---|
| **Chassis** | `oklch(91.5% 0.004 240)` — a pale cool instrument panel. Labels are silkscreened onto it; rules are engraved into it. Nothing floats above it and nothing blurs. |
| **Well** | `oklch(19% 0.007 250)` → `oklch(12% 0.006 250)` — a dark recess cut through the chassis. Anywhere the machine *shows* you something — media, the prompt, the price — the panel is cut away and you look into it. |
| **Signal** | `oklch(56% 0.212 29)` — one lacquered vermilion, rationed. It means **money, live, or go**, and nothing else. Never a link, never a border, never emphasis. |

Failure is not a second accent. It is the signal drained of chroma and dropped
in lightness (`--dead`), so a dead run reads as unlit rather than as alarm.

**Depth is drawn with two 1px lines, never with a shadow.** Light on the upper
edge and dark on the lower reads as raised; the inverse reads as cut. A single
light source above is what makes a drawn panel read as a real one. There are no
blurs, no glows and no glass anywhere in the build.

## Type — 2 + 1

- **Panel** · Martian Mono — wordmark, the quote figure, rates, serials. Wide
  and engineered; it is the silkscreen voice. **Latin and numerals only** — it
  is never used for translated copy, because it is wide and has no Arabic.
- **UI** · Geist — every translated string, prompts, model names.
- **Data** · Geist Mono — telemetry, ids, timestamps, elapsed clocks.

Radius is `0` everywhere except media tiles, which carry the `2px` a real cut
leaves behind. A milled panel has no rounded corners.

## Structure

```
┌── rail ──────────────┬── plate ─────────────────────────┐
│ LUMEN                │  prompt well  ·  + ref  ·  RUN $ │
│ QUOTE   $1.52        ├──────────────────────────────────┤
│   rate × dur · scale │  IN PROGRESS  LMN-0043  00:12    │
│ SPENT · RUNS · LIVE  ├──────────────────────────────────┤
├──────────────────────┤  LEDGER  find · filters          │
│ RATE CARD            │  ┌────┐ ┌────┐ ┌────┐            │
│   7 models, sorted,  │  │    │ │    │ │    │            │
│   with cost bars     │  └────┘ └────┘ └────┘            │
│ ASPECT · DURATION    │  LMN-0043 $1.52                  │
│ LANG · colophon      │                                  │
└──────────────────────┴──────────────────────────────────┘
```

Three named moves carry the register:

1. **The gauge.** The live quote, set at display size in Martian Mono, with the
   rate × duration breakdown beneath it and a **price-position scale** showing
   where the chosen model sits in the catalogue's fifteen-fold spread. It is
   sticky: it stays on screen while the ledger scrolls.
2. **The rate card, printed on the panel.** Not a sheet you open. Seven models
   from $0.045/s to $0.3034/s, sorted cheapest first, each with a proportional
   cost bar and an availability note. A sheet you have to open hides exactly the
   comparison the product exists to make.
3. **The RUN key.** A physical key that sits 2px proud and travels that 2px when
   pressed — the only element in the interface that moves. Above `$1.00` it
   **arms** instead of firing, and the label changes to CONFIRM. Arming is
   stored as a signature of the recipe, so editing anything disarms it, and it
   expires after six seconds.

Serials (`LMN-0043`) are assigned in creation order and never move — a stable
handle for a result, which a UUID is not and a position in a grid is not either.

## Ledger row

| Site | Type stack | Ground | Layout grammar | Signature interaction | Imagery |
|---|---|---|---|---|---|
| **lumen** | Martian Mono (panel/figures, tabular) + Geist + Geist Mono | cool instrument chassis `oklch(91.5% .004 240)` with true-dark wells cut into it; one lacquered vermilion `oklch(56% .212 29)` for money/live/go only | **two-material panel** — sticky instrument rail (gauge + printed rate card) beside a work plate; radius 0, depth is a 1px light/dark edge pair, no shadow or blur anywhere, silkscreen caps labels always stacked above what they label | **the quote is the hero** — a display-size live figure with a price-position scale across the catalogue's spread, and a RUN key that arms above $1 | none — the operator's own generations are the only imagery in the interface |

Checked against `~/PORTFOLIO-REGISTERS.md`. Closest row is **akal-creator-v2**,
which shares Martian Mono and a light-first radius-0 hairline vocabulary. It
differs on ground (grey chassis + cut dark wells vs paper/night chapters +
magenta beam), layout grammar (fixed application panel vs chaptered scroll
dossier), signature interaction (live quote meter vs the filament) and imagery
(none vs Machined Optics) — four of five axes clear.

## Not permitted

- Gradient grounds, bloom, aurora, glow, glass, backdrop blur.
- A second accent colour. Green for success, red for error — no. The signal is
  the only chroma, and grey carries failure.
- Rounded controls, pill buttons, soft cards, drop shadows.
- Italic in any heading or label.
- Credits, tokens, or any abstraction over the dollar price.
- Fabricated progress: no percentage bar and no ETA, because no provider in the
  catalogue publishes a duration estimate. The running state shows elapsed time,
  provider queue position when there is one, and a scanning indicator that does
  not pretend to know how far along the work is.

## Rules that were bugs first

- **Every layout rule uses logical properties** (`inset-inline-start`,
  `padding-inline`, `border-block-end`). That is why Arabic mirrors from a single
  `dir="rtl"` with no second stylesheet. Write `left`/`right` and Arabic breaks
  invisibly.
- **Prompts use `unicode-bidi: plaintext`** so each takes direction from its own
  content.
- **Latin metadata is isolated `direction: ltr`** — ids, prices and rates
  reorder around their punctuation in RTL otherwise.
- **Model names use `unicode-bidi: plaintext`, not `isolate`.** Left to inherit
  RTL they truncate from the wrong end: `…g 2.5 Turbo Pro` instead of
  `Kling 2.5 Turbo…`.
- **The rail splits into `.rail__head` / `.plate` / `.rail__body` as three
  explicit grid rows.** On a narrow viewport they reorder so the composer and
  its RUN key stay above the fold. Left as one block, the rate card pushes the
  only action off a phone screen.
- **The grid uses `<img>` with `?poster=1`, never `<video>`.** Safari will not
  paint a frame from `<video preload="metadata">` however you seek it.
- **`color-scheme` is `light`.** The chassis is pale; left on `dark`, native
  scrollbars and search-field affordances render as dark chrome cut into it.
- **A tile's action row is a sibling of the media button, not a child** — a
  button cannot legally contain buttons.
