# Lumen UI research

Status: research brief for the implementation pass
Updated: 2026-07-30

## Decision

Lumen should be a **single-room creative workbench**, not a dashboard and not an infinite node canvas.

The common loop is narrow:

1. choose a brand workspace and project
2. attach the right references
3. describe the shot
4. choose a compatible model and settings
5. see the real cost before generation
6. keep composing while jobs run
7. compare takes
8. approve, reject, retry, or export

The interface should make that loop feel continuous. The media is the main object; controls are supporting equipment.

The existing `/prototype` is the correct structural starting point. The existing root dashboard is useful as proof that the workflow functions, but its large headings, summary strip, oversized form, and separate asset-card grid make it feel like a branded admin page rather than a production tool.

## What the current prototype gets right

- One persistent room instead of separate Create, Queue, History, and Review pages.
- The composer remains available while a generation runs.
- Cost appears on the Generate action rather than being hidden in billing.
- Queue status is visible without taking over the workspace.
- Review puts the selected output above its takes.
- Brand/project context is always visible.
- History and settings are secondary layers rather than permanent clutter.
- Keyboard routes already exist for generate, history, and escape.

## What is still concept-level

- The canvas is too empty in Compose and too theatrical in Running. “Exposing motion” is presentation copy, not operational information.
- The prototype uses too much vertical space. On a laptop, the composer and take strip will compete with the media stage.
- The large serif treatment makes the Running state look like a campaign page. Serif should be limited to the Lumen wordmark or an occasional project title; operational UI should use Geist.
- The state switcher is prototype chrome and must disappear.
- Settings are shown as a modal sheet, but frequent model controls should live in a collapsible/resizable inspector.
- The take strip lacks real thumbnails, hover preview, status details, retry reason, selection mechanics, and multiselect.
- Review lacks zoom, fit/fill, frame stepping, linked A/B playback, overlay comparison for stills, and a clear “needs work” path.
- Queue rows need cancel, retry, duplicate, priority, elapsed/estimated time, provider state, and failure detail.
- History needs project/session grouping, filters, search, and provenance—not a generic gallery.
- Reference inputs need named roles. “First frame” alone is too narrow.

## Benchmark findings

### Krea: strongest reference for product simplification

Krea’s March 2026 redesign is the clearest benchmark for Lumen’s overall interaction philosophy:

- one global sidebar
- sessions that persist across tools
- live running indicators
- model selection that exposes cost, speed, and strength
- pinning and defaults
- drag outputs directly into the next tool
- advanced controls hidden until needed
- a first-class mobile design rather than compressed desktop

Source: https://www.krea.ai/blog/redesign

The useful lesson is not Krea’s visual styling. It is the rule they used: **is this helping the user make something, or is it in the way?**

Krea 2 also separates “what” from “how” through reference roles and strength controls. It supports up to four style references with per-reference strength, plus broader moodboards with taste profile, keywords, and avoids.

Source: https://www.krea.ai/blog/krea-2-deep-dive-walkthrough

For Lumen, this suggests visible reference roles:

- Product / subject lock
- First frame
- Last frame
- Style reference
- Composition reference
- Motion reference
- Brand moodboard

Each reference needs a thumbnail, role label, provenance/source, remove/replace, and only the controls the selected model supports. Strength belongs on style/composition references, not on first/last frames.

### Runway: strongest reference for generation planning and continuity

Runway Agent exposes a useful control before credits are spent:

- ask before generating, with plan, model, prompt, and estimated cost
- or automatically generate
- optimize model selection for speed, cost, or quality

It collects all outputs from a session in a Generations grid, then puts assembled work in a Final Cut timeline. It also keeps uploaded and generated assets connected to sessions.

Source: https://help.runwayml.com/hc/en-us/articles/51601639579667-Creating-with-Runway-Agent

Lumen should not become chat-first. The useful borrowing is:

- a three-way **Optimize for: Quality / Balanced / Economy** preference
- optional confirmation for expensive jobs or batches
- plan preview only when a workflow spans multiple paid generations
- generation session as the organizing unit
- cheap exploration first, final-quality generation second

Runway’s Apps model is useful as a future pattern: specialized jobs such as relight, upscale, multi-shot, references, scene builder, and stitching are explicit tools rather than dozens of controls forced into one form.

Source: https://help.runwayml.com/hc/en-us/articles/45570040112531-Creating-with-Apps

### Adobe Firefly: strongest reference for model-specific settings and timeline handoff

Firefly’s video workflow keeps model configuration in an inspector and conditionally exposes only supported settings. For Kling, that includes resolution, ratio, duration, audio, first/last frame, crop correction, and seed. Finished generations appear in Generation History and can be dragged into the project timeline.

Source: https://helpx.adobe.com/firefly/web/firefly-video-editor/generate-videos/generate-videos-using-kling.html

The main Lumen lesson:

- never show a universal settings form that pretends every model supports the same controls
- derive controls from a model capability schema
- show disabled capabilities with a short reason
- keep advanced reproducibility data such as seed available but secondary
- allow generated media to move directly into a lightweight sequence/timeline later

### Frame.io: strongest reference for review and comparison

Frame.io’s comparison viewer supports:

- side-by-side comparison
- linked zoom and repositioning
- linked playback for video
- unlinking controls when independent inspection is needed
- overlay/wipe comparison for same-size stills
- pixel-difference view
- comments attached to the correct version

Source: https://help.frame.io/en/articles/9952618-comparison-viewer

Lumen v1 should implement:

- synchronized A/B video playback
- linked zoom/pan for images
- side-by-side comparison for all media
- wipe/overlay for same-dimension stills

Pixel difference and comments can wait until collaboration becomes real.

### Midjourney: strongest reference for low-friction creation plus separate organization

Midjourney keeps creation and organization distinct. The Create page shows work as it appears; the Organize page handles download, sort, filter, and folders.

Sources:

- https://docs.midjourney.com/hc/en-us/articles/33329261836941-Getting-Started-Guide
- https://docs.midjourney.com/hc/en-us/articles/33329462451469

Lumen should preserve the current “single room” for active work and use a dedicated full-screen History/Library surface for retrieval. Do not turn the main workbench into an asset-management dashboard.

### FLORA and Figma Weave: valuable later, wrong as the default room

FLORA and Figma Weave show why node canvases are useful for high-volume, branching, repeatable workflows:

- branch from one reference into multiple models
- chain describe, generate, relight, crop, animate, upscale, and export
- preserve the lineage visually
- turn a workflow into a simplified reusable tool

Sources:

- https://flora.ai/
- https://weave.figma.com/
- https://www.uxtools.co/blog/generative-media-workflows-in-ui-design

This is strategically important, but it should be a later **Flows** mode, not Lumen’s default interface. Ryan’s common task is making and reviewing a shot, not authoring a pipeline. A node graph would add learning cost and visual clutter before repeated workflows justify it.

When a workflow repeats often enough, expose it first as a named recipe with a simple form. Only expose its node graph in an advanced editor.

## Recommended information architecture

The desktop shell should behave as a **selection-centric three-zone workspace**:

- a compact/collapsible left rail for projects, references, and views
- the central stage/contact sheet/compare surface
- a contextual right inspector

The bottom composer remains persistent. Both side zones should collapse so the media can take the full width. Save panel sizes per user and restore them on return.

This borrows the durable layout logic of Figma, Lightroom, Capture One, and DaVinci Resolve without copying their visual density. Selection is the routing mechanism: selecting a reference, take, queue item, or project changes the inspector instead of navigating to a new page.

### Top bar: persistent, compact

Left:

- Lumen wordmark
- workspace switcher: Maison Tanneurs / Maison Izem
- project or session title

Right:

- History
- session spend / budget
- queue status
- command menu

Do not keep marketing-style KPIs such as total generations and approved count in the top bar. They matter in History, not while composing.

### Main stage: media first

The stage should consume the largest continuous area.

Compose:

- real drag target
- compact instruction
- recent/pinned references available without leaving the room
- no decorative empty-state illustration

Running:

- keep last selected result or input visible
- show progress as an overlay/status rail, not a replacement hero
- permit another generation immediately
- compact queue strip beneath or beside the stage

Review:

- fit/fill/100% zoom
- image pan/zoom or video transport
- frame step for video
- A/B compare
- approve / needs work / reject
- selected take metadata

### Bottom dock: persistent composer

The composer should be the stable anchor of the room and remain roughly 140–190 px high on desktop.

Attachment row:

- thumbnail chips grouped by role
- upload/generation state
- source/provenance marker
- replace/remove

Prompt:

- plain textarea
- optional prompt recipe insertion
- prompt version/restore
- `Cmd/Ctrl + Enter` generate

Configuration line:

- selected model
- duration / ratio / resolution
- audio state where applicable
- estimated cost
- Configure opens inspector

Actions:

- Refine should explain what it will change or disappear
- Generate button must always show exact estimated cost
- batch count, if more than one, should multiply the displayed total

### Right inspector: contextual and resizable

Collapsed by default. Open for Configure or when an asset/reference is selected.

Sections:

- model picker
- standard controls
- reference mapping
- model-specific controls
- cost calculation
- provenance/metadata for selected output

Use accessible resizable panels. `react-resizable-panels` is the underlying library used by shadcn’s Resizable component.

Source: https://ui.shadcn.com/docs/components/base/resizable

### Take strip / contact sheet

After the first result exists, put takes directly below the stage.

Each take shows:

- true thumbnail with hover preview for video
- A/B/C index
- state: queued, running, failed, ready, approved, rejected
- cost
- duration/ratio
- selected and compare-selection states

Interactions:

- click: select
- shift-click: range/multiselect
- `C`: compare with current
- `A`: approve
- `R`: retry failed or regenerate selected recipe
- context menu: duplicate settings, copy prompt, reveal provenance, export, delete from local library

## Model picker

Do not use a plain HTML select once more than three models exist.

Use a popover or sheet with:

- Pinned / Recommended / All
- media-type and capability filters
- model name and provider
- one-line “best for” description
- quality indicator
- speed estimate
- exact cost for the current settings
- capability badges: first frame, last frame, references, audio, seed, max duration
- disabled reason
- set as project default

Krea’s model selector demonstrates the right information hierarchy: visual sample, model name, one-line purpose, relative quality/speed, and cost.

Avoid a marketplace-style wall of models. Lumen should show only models we have deliberately enabled.

## Review decisions

Use three states with distinct meaning:

- **Approve**: safe to use/export in the intended project
- **Needs work**: promising, create a revision from this take
- **Reject**: do not use

“Needs work” should open a revision path with the selected take attached and its settings copied. Reject should not destroy the asset.

For Maison Tanneurs, approval does not make a generated image valid product photography. Outputs must retain their editorial/generated classification and source lineage.

## Visual direction

Tone: **cinematic utilitarian**, not “AI atmospheric.”

Keep:

- dark neutral stage for accurate media viewing
- near-black/charcoal surfaces
- warm amber as the single action/active accent
- thin structural rules
- square or very small radii
- clear monospaced metadata
- restrained motion

Change:

- Use Geist for nearly all interface text.
- Restrict Instrument Serif to the Lumen wordmark and rare project naming.
- Remove giant serif status messages.
- Increase useful density by reducing outer canvas margins and oversized empty regions.
- Let generated media provide color; the application chrome should stay neutral.
- Use green only for approved/success, red only for failed/rejected, amber for active/running/generate.
- Avoid gradients, glow, glass, floating pills, giant rounded cards, and generic AI sparkles.

The current dark prototype is closer than the light dashboard, but it needs to become more tool-like and less staged.

## Three interface directions considered

### 1. Single Room Workbench — recommended now

One stage, one persistent composer, one contextual inspector, one take strip. Queue and history are layers.

Best for: daily image/video generation and review.

Why it wins: shortest path through the common loop; low cognitive load; works before Lumen has dozens of tools.

### 2. Director Board

A contact-sheet-first surface where prompts and references create groups of 4–12 takes. Strong for broad concept exploration and campaign art direction.

Best for: high-volume image ideation and comparing many directions.

Why it is secondary: weaker for focused image-to-video work and detailed shot review. It can become a future Board mode.

### 3. Flow Canvas

Node-based pipeline builder inspired by FLORA/Figma Weave.

Best for: repeated multi-step production recipes and batch operations.

Why it is later: too much machinery for the current common case. Build it only when at least three repeated recipes need branching or reusable automation.

## Component choices

Good foundations:

- Radix primitives or shadcn wrappers for Dialog, Sheet, Popover, Select, Tooltip, Context Menu, Tabs, Slider, Progress, and Command. Both are MIT-licensed.
- `cmdk` through shadcn Command for a keyboard command surface. MIT.
- `react-resizable-panels` / shadcn Resizable for stage + inspector. MIT.
- AI Elements Prompt Input as a stronger implementation reference for separating attachments, prompt body, tools, submission, and status. Apache-2.0.
  - https://elements.ai-sdk.dev/components/prompt-input
- Uppy Core/headless for uploads only if Lumen needs resumable/multi-source queues; otherwise keep the first implementation small and native. MIT.
  - https://uppy.io/
- React Aria `GridList` for the contact sheet’s selection, range selection, keyboard navigation, drag/drop, async loading, and accessible focus model. Apache-2.0.
  - https://react-spectrum.adobe.com/react-aria/GridList.html
- TanStack Virtual only when real asset volume proves virtualization is necessary. MIT.
  - https://tanstack.com/virtual/latest
- The 21st.dev Motiq Prompt Composer as interaction reference—not visual source—for attachment states, model selection, templates, and keyboard submission.
  - https://21st.dev/@rmahammad/components/prompt-composer
- The 21st.dev Motiq Compare Reveal as interaction reference for keyboard-controlled wipe comparison.
  - https://21st.dev/@rmahammad/components/compare-reveal
- `react-compare-slider` for comparing arbitrary React media, subject to a quick React 19 compatibility check before installing. MIT.
  - https://github.com/nerdyman/react-compare-slider
- Native `<video>` first; add a timeline dependency only when actual multi-clip editing lands.

Do not install React Flow now. It is MIT and suitable if Flows is eventually built, but a node editor is not needed for the current workbench.

Source: https://reactflow.dev/

Do not add a full video-editor SDK for v1. It increases bundle size and product scope before the core generation/review loop is complete.

## Delivery sequence for Claude

### Phase 1: make `/prototype` the real shell

- Replace prototype-only state switcher with state derived from actual jobs and selection.
- Integrate existing API/jobs/provider data into the Single Room structure.
- Add real drag/drop references and role assignment.
- Add compact contextual inspector.
- Add real take thumbnails and selection.
- Preserve active composer during generation.
- Add queue drawer and full-screen History.

### Phase 2: professional review

- Image zoom/pan/fit.
- Video playback, scrub, frame step, mute/loop.
- Side-by-side A/B with linked playback.
- Still-image wipe comparison.
- Approve / Needs work / Reject.
- Revision from selected take.

### Phase 3: speed and organization

- Model picker with compatibility, cost, speed, and defaults.
- Keyboard command menu.
- History search/filter/grouping.
- Session and project budgets.
- Batch generation.
- Drag output into another operation such as Edit, Upscale, or Video.

### Later, only after evidence

- Contact-sheet Board mode.
- Reusable named recipes.
- Lightweight timeline for assembling selected clips.
- Advanced Flow/node editor.
- Collaboration comments and assignment.

## Acceptance criteria

The final UI is successful when:

- a new user can generate from text or a first frame without opening settings
- an experienced user can generate entirely from the keyboard
- cost is visible before every paid call
- unsupported model controls never appear as if they work
- generating one take never blocks composing the next
- queue failures are understandable and recoverable
- two takes can be compared without leaving the room
- an approved take can be exported with prompt, model, settings, cost, brand, project, and source provenance intact
- Maison Tanneurs and Maison Izem assets never cross workspaces silently
- the stage gives more area to media than to controls
- the interface remains calm with 1 job or 30 jobs

## Sources

- Krea redesign: https://www.krea.ai/blog/redesign
- Krea references and moodboards: https://www.krea.ai/blog/krea-2-deep-dive-walkthrough
- Runway Agent: https://help.runwayml.com/hc/en-us/articles/51601639579667-Creating-with-Runway-Agent
- Runway Apps: https://help.runwayml.com/hc/en-us/articles/45570040112531-Creating-with-Apps
- Adobe Firefly Kling workflow: https://helpx.adobe.com/firefly/web/firefly-video-editor/generate-videos/generate-videos-using-kling.html
- Frame.io Comparison Viewer: https://help.frame.io/en/articles/9952618-comparison-viewer
- Frame.io July 2026 update: https://blog.frame.io/2026/07/29/new-in-frameio-full-screen-search-comparison-viewer/
- Midjourney getting started and organization: https://docs.midjourney.com/hc/en-us/articles/33329261836941-Getting-Started-Guide
- FLORA: https://flora.ai/
- Figma Weave: https://weave.figma.com/
- Generative workflow UI analysis: https://www.uxtools.co/blog/generative-media-workflows-in-ui-design
- shadcn Resizable: https://ui.shadcn.com/docs/components/base/resizable
- Radix Dialog: https://www.radix-ui.com/primitives/docs/components/dialog
- React Flow: https://reactflow.dev/
- 21st.dev Prompt Composer: https://21st.dev/@rmahammad/components/prompt-composer
- 21st.dev Compare Reveal: https://21st.dev/@rmahammad/components/compare-reveal
