# Lumen — register: KILN

Locked 2026-07-31. Replaces **PANEL** (pale instrument chassis, 1px bevels,
radius 0), which Ryan rejected in one word: *Windows 98*. He was right — a light
grey ground with a light-top/dark-bottom 1px edge is literally the Win95 button
treatment, and zero radius plus grey segmented strips finished the job.

Before PANEL there was **AgentFlow** (charcoal grid → orange bloom → frosted
glass ask-box → light library). Both are retired.

## The argument

Lumen's thesis is one sentence: **the price of a click is on the button before
you click it.** Higgsfield hides cost behind credits and covers the hiding with
gloss.

So the console runs in a black room over a field of real incandescence — compute
costs money because it costs heat — and **the price of the next click is the
largest object on the screen.** Everything else is either glass or nothing.

## Materials

| | |
|---|---|
| **Void** | `oklch(5% 0.003 40)`. The room. |
| **Field** | A full-bleed photograph, or — once there is paid work — the operator's own last completed clip, playing muted on a loop, drifting slowly. Held under a scrim. Proof renders are never promoted to the field: they are diagnostics, not wallpaper. |
| **Glass** | The only material for things you touch. A `::before` draws a light-catching edge, bright at top and bottom and gone through the middle, the way a real pane picks up a room. |
| **Blend** | Display type in `mix-blend-mode: exclusion`. This is what lets the ground be arbitrary: the wordmark, the quote and the telemetry invert against whatever frame lands behind them. Give any of them a solid colour and the interface breaks the first time a bright frame plays. |
| **Ember** | `oklch(64% 0.215 42)`. The one accent, and it is mostly *in the photograph*. In the interface it means live or go and nothing else. **Money is white** — over that field white is the brightest thing there is, and the money should be the brightest thing there is. |

Failure is the ember gone out (`--dead`), not a second hue.

## Type — 2 + 1

- **Display** · Instrument Serif, roman — the wordmark and the Ledger head.
  Never italic; an italicised display word is among the most reliable AI tells.
- **UI** · Inter Tight — every translated string, prompts, model names.
- **Figures** · Martian Mono — the quote, every rate, serials, telemetry.
  Tabular, always: a price that reflows as it changes is not a readout.

Radii are generous (10–24px) and there is not one bevel in the build.

## Structure

One screen, one band. The field takes the top; the whole console sits along the
bottom edge, so nothing that costs money is ever below the fold.

```
┌────────────────────────────────────────────────────┐
│ Lumen                    [spent runs live] [EN..]  │
│                                                    │
│                (the field, drifting)               │
│                                                    │
│  ┌──────────────┐   QUOTE                          │
│  │ RATE CARD    │   $1.52                          │
│  │ 7 rows, bars │   0.3034/s × 5s · 16:9           │
│  ├──────────────┤   ├──────────────────────────┐   │
│  │ ASPECT · DUR │   │ prompt · +ref · RUN $1.52│   │
│  └──────────────┘   └──────────────────────────┘   │
└────────────────────────────────────────────────────┘
        ↓ scroll — the room goes solid
   LEDGER · scatter grid, tiles at their own aspect
```

Four named moves:

1. **The quote.** `clamp(3rem, 6.2vw, 6.25rem)`, exclusion blend, tabular, with
   the rate × duration line under it and a scale showing where this model sits
   in the catalogue's fifteen-fold spread. It restrikes when the price changes.
2. **The rate card, printed on the panel.** Seven models $0.045/s → $0.3034/s,
   cheapest first, proportional bars, a `REF` chip on the ones that take a
   reference frame. A sheet you have to open hides exactly the comparison the
   product exists to make.
3. **The lens.** The cursor burns a clear circle through the scrim so a frame
   can be read at full strength without leaving the console. A CSS mask driven
   by two custom properties and eased in a RAF loop — no state, no render per
   frame, and no canvas re-encoded to a data URL. Off for coarse pointers and
   for reduced motion.
4. **The RUN key.** Above `$1.00` it arms rather than fires, lights ember, and
   pulses. Arming is stored as a signature of the recipe, so any edit disarms
   it; it expires after six seconds.

Serials (`LMN-0043`) are assigned in creation order and never move.

## Ledger row

| Site | Type stack | Ground | Layout grammar | Signature interaction | Imagery |
|---|---|---|---|---|---|
| **lumen** (product) | Instrument Serif (display, roman) + Inter Tight + Martian Mono (every figure, tabular) | true black `oklch(5% .003 40)` under a full-bleed incandescent field; one ember `oklch(64% .215 42)` for live/go only, money in white | **one bottom band over a full-bleed field** — rates left, quote + composer right, all glass with generous radii, zero bevels, display type in `mix-blend-mode: exclusion` so it survives any frame behind it | **the quote is the hero** — a 6vw live figure that restrikes on change, plus a cursor lens that burns through the scrim to read the field at full strength | the operator's own last paid generation, playing; a shipped incandescent field before there is one |

Checked against `~/PORTFOLIO-REGISTERS.md`; differs from every row on four of
five axes.

## Not permitted

- Bevels, 3D edges, raised/inset 1px pairs. That is what read as Windows 98.
- A second accent. Green for success, red for error — no.
- Italic headings.
- Credits, tokens, or any abstraction over the dollar price.
- Fabricated progress: no percentage and no ETA, because no provider in the
  catalogue publishes a duration estimate. Elapsed time, provider queue position
  and a scan that does not pretend to know how far along the work is.
- Proof renders as the field.

## Rules that were bugs first

- **Nothing between the chrome and the stage may create a stacking context.**
  A `z-index` on `.console` traps `mix-blend-mode: exclusion` against a
  transparent backdrop and the display type silently stops inverting.
- **The scrim has to reach near-black before the quote starts.** Exclusion blend
  against a mid-grey ridge inverts to a muddy grey, which made the largest
  number on the screen the least legible thing on it.
- **The tile entrance fails open.** The hidden state is scoped to a class the
  script adds only once it has an observer running. Failing open costs a frame;
  failing closed loses the whole library.
- **`/api/assets` must serve byte ranges.** Safari opens media with
  `Range: bytes=0-1` and needs a `206`; a `200` with the whole file makes it give
  up with `MEDIA_ERR_SRC_NOT_SUPPORTED` and never request another byte. Chrome
  plays it regardless, which is how this survived a full verification pass.
- **The grid uses `<img>` with `?poster=1`, never `<video>`.** Safari will not
  paint a frame from `<video preload="metadata">` however you seek it.
- **Every layout rule uses logical properties.** Arabic mirrors from a single
  `dir="rtl"` with no second stylesheet.
- **Model names use `unicode-bidi: plaintext`, not `isolate`.** Left to inherit
  RTL they truncate from the wrong end: `…g 2.5 Turbo Pro`.
- **Prompts use `unicode-bidi: plaintext`; Latin metadata is isolated `ltr`.**
- **Tile shape comes from the job's own aspect ratio.** A fixed crop turns a
  9:16 vertical into a sliver — exactly the information an archive must keep.
- **A tile's action row is a sibling of the media button, not a child** — a
  button cannot legally contain buttons.
