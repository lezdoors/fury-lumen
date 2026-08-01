# Lumen — asset prompt brief: **HEAT IS THE PRICE**

Written 2026-07-31. **Ryan fires these in the Higgsfield UI. No agent generates.**

Adapted from the One-Prompt Website Pack (Fable5 · Higgsfield) and the ChatGPT
Website Creator pack, using their two load-bearing techniques:

1. **One anchor still first, referenced by every clip.** The anchor locks the
   world. Without it Seedance invents a slightly different planet per clip and
   the set never cuts together.
2. **Start frame = end frame** on the field clip. Seedance 2.0 accepts both, and
   handing it the same image for each is what makes a loop that does not jump.
   This is the single most important instruction in the brief — the field runs
   behind the console for minutes at a time and a visible seam every ten seconds
   is worse than a still.

---

## The idea

Lumen's whole argument is that you see the dollar before you spend it, and its
enemy is the credit — a token that exists to make the dollar invisible. The
register the app already runs in (`REGISTER.md`, KILN) says the same thing in
material: **compute costs money the way it costs heat.**

So the film is one world — a black void with incandescence in it — shot three
ways. No product, no person, no text, no place. Just heat behaving.

Three clips, three aspect ratios, one anchor. That is deliberate: the field
needs 16:9, and the ledger grid has never once been tested on a portrait or a
square, so the set doubles as the archive's first honest content.

The same three clips become the hero film for a Lumen landing page later. Same
world, no second shoot.

---

## Step 1 — the anchor still

Generate **one 16:9 still** first. Best current image model in the catalogue
(GPT Image 2 or Nano Banana Pro). Download it. It is the image reference on
**every** clip below.

```
A vast black volcanic plain photographed from high above at night. A dark
basalt crust fractured into ridges and plates, and running beneath the cracks a
network of molten seams glowing white at the core and falling through ember
orange to deep red at the edges. Heat haze rising off the hottest fissures.
Pure black sky, no horizon, no stars. Photorealistic aerial photography, long
lens, shallow atmospheric depth, fine volcanic grain. Extremely dark overall —
the glow occupies less than a fifth of the frame and the rest is true black.
No people, no structures, no text, no watermark.
```

**Why it is composed this way:** the still sits behind a live interface at
roughly a third of its brightness with white type over it. Anything busier than
a fifth of the frame lit will fight the quote. If the first take comes back
bright, ask for "darker, less glow, more black" and take it again — that one
note decides whether the whole thing works.

---

## Step 2 — the three clips

Seedance 2.0 · std mode · 1080p · **no audio** · 10s · **the anchor still as
image reference on all three.**

### CLIP A — THE FIELD · 16:9 · *the app background*

**Set start frame AND end frame to the anchor still.** That is what closes the
loop.

```
Slow continuous aerial drift across the molten plain, camera moving steadily
right to left at constant speed and returning to where it began. The molten
seams pulse and breathe with strong visible intensity, brightening and dimming
like something under pressure. Heat haze distorts the air above the hottest
fissures. Fine embers lift and drift. The crust itself does not move. No cuts,
no zoom, no rotation, no camera shake. One unbroken shot, hypnotic, glacial.
```

Motion note: "pulse and breathe with strong visible intensity" is deliberate.
Asking Seedance for subtle motion returns a still with noise on it.

### CLIP B — THE POUR · 9:16 · *ledger, portrait*

```
A single ribbon of white-hot molten metal falling vertically through pure
black, coiling and folding on itself as it descends, surface tension pulling it
into slow rolling waves. White at the core, ember orange at the edges. Bright
sparks separate from the stream and drift upward. Macro, dramatic, constant
speed, continuous — the pour never stops and nothing else is in frame. Void
black background, no vessel, no floor, no people, no text.
```

### CLIP C — THE COOL · 1:1 · *ledger, square*

```
Extreme macro on the surface of a cooling slab of cast iron. The metal begins
white hot and cools across the shot: white retreating to ember orange, orange
to deep red, red to dark grey iron, until only the last thin seam is still lit.
Crust forms and crazes across the surface in visible fracture lines as it goes.
Slow steady push-in, no cuts. Void black surround, no people, no text.
```

---

## Step 3 — hand them over

Drop the mp4s into `~/lumen/public/stage/`. Naming does not matter; tell me
which is which.

I will:

- wire **CLIP A** as the field, replacing the shipped still;
- verify the loop has no seam, and if it does, ping-pong it in ffmpeg
  (forward then reversed, concatenated) so it is seamless regardless;
- put **B** and **C** through the ledger as real archive entries and finally
  test the grid on a portrait and a square, which it has never seen;
- report what actually breaks.

---

## Spend

One still plus three 10-second Seedance clips is roughly the packs' own quoted
figure — about 100 credits, call it five dollars. **Take one clip at a time and
look at it before firing the next.** If the anchor comes back too bright,
nothing downstream is worth generating.

---

## Rules this brief keeps

- No text of any kind in any prompt — generated lettering is always wrong.
- No brand names.
- Motion is never described as subtle.
- The reference carries the world; the prompt describes the environment.
- Nothing here is fired by an agent. These are for the Higgsfield UI.
