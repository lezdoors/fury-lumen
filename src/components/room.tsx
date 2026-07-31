"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { brands } from "@/lib/catalog";
import { estimateCost } from "@/lib/types";
import type {
  AspectRatio,
  BrandId,
  GenerationJob,
  ProviderModel,
  ReviewStatus,
} from "@/lib/types";

const RATIOS: AspectRatio[] = ["16:9", "9:16", "1:1", "4:5", "3:4"];
const POLL_INTERVAL_MS = 2500;
const TAKE_WINDOW = 8;
const LETTERS = "ABCDEFGH";

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

function clock(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(whole / 60)).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
}

function isVideo(job: GenerationJob) {
  return job.mediaKind === "video" || Boolean(job.mimeType?.startsWith("video/"));
}

function modelKeyOf(model: Pick<ProviderModel, "providerId" | "id">) {
  return `${model.providerId}:${model.id}`;
}

export function Room({
  initialModels,
  initialJobs,
}: {
  initialModels: ProviderModel[];
  initialJobs: GenerationJob[];
}) {
  const [brandId, setBrandId] = useState<BrandId>("maison-tanneurs");
  const [models, setModels] = useState(initialModels);
  const [jobs, setJobs] = useState(initialJobs);
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState<AspectRatio>("16:9");
  const [duration, setDuration] = useState(5);
  const [modelKey, setModelKey] = useState(() => {
    const first = initialModels.find((model) => model.available) ?? initialModels[0];
    return first ? modelKeyOf(first) : "";
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const formRef = useRef<HTMLFormElement>(null);

  const selectedModel = models.find((model) => modelKeyOf(model) === modelKey);
  const allowedDurations = selectedModel?.durations;
  const effectiveDuration =
    allowedDurations?.length && !allowedDurations.includes(duration)
      ? allowedDurations[0]
      : duration;
  const cost = selectedModel ? estimateCost(selectedModel, effectiveDuration) : 0;

  const brandJobs = useMemo(
    () => jobs.filter((job) => job.brandId === brandId),
    [brandId, jobs],
  );
  const running = useMemo(
    () => jobs.filter((job) => job.status === "running" || job.status === "queued"),
    [jobs],
  );
  const brandRunning = running.filter((job) => job.brandId === brandId);
  const sessionSpend = jobs.reduce(
    (total, job) => total + (job.actualCostUsd ?? job.estimatedCostUsd),
    0,
  );

  // Newest first everywhere else; the take strip reads left-to-right oldest-first
  // so a letter never changes meaning once assigned within the visible window.
  const takes = useMemo(() => brandJobs.slice(0, TAKE_WINDOW).reverse(), [brandJobs]);
  const selected = selectedId ? brandJobs.find((job) => job.id === selectedId) : undefined;
  const activeRun = brandRunning[0];

  const roomState: "compose" | "running" | "review" = selected?.assetUrl
    ? "review"
    : activeRun
      ? "running"
      : "compose";

  const lastSettled = useRef<string | null>(null);
  const newestReady = brandJobs.find((job) => job.status === "completed" && job.assetUrl);

  // Auto-reveal a freshly finished take once per job, so a completed generation
  // never lands silently. Re-selecting is still the user's to override.
  useEffect(() => {
    if (!newestReady || lastSettled.current === newestReady.id) return;
    lastSettled.current = newestReady.id;
    setSelectedId((current) => current ?? newestReady.id);
  }, [newestReady]);

  const refresh = useCallback(async () => {
    const [modelsResponse, jobsResponse] = await Promise.all([
      fetch("/api/models", { cache: "no-store" }),
      fetch("/api/jobs", { cache: "no-store" }),
    ]);
    setModels(((await modelsResponse.json()) as { models: ProviderModel[] }).models);
    setJobs(((await jobsResponse.json()) as { jobs: GenerationJob[] }).jobs);
  }, []);

  // Reading a running job is what advances it — the provider is polled server-side
  // on GET. The interval stops as soon as nothing is queued, so an idle Lumen makes
  // no provider calls at all.
  useEffect(() => {
    if (running.length === 0) return;
    const timer = setInterval(async () => {
      const results = await Promise.all(
        running.map(async (job) => {
          const response = await fetch(`/api/jobs/${job.id}`, { cache: "no-store" });
          if (!response.ok) return undefined;
          return ((await response.json()) as { job: GenerationJob }).job;
        }),
      );
      const updates = results.filter(Boolean) as GenerationJob[];
      if (updates.length > 0) {
        setJobs((current) =>
          current.map((job) => updates.find((update) => update.id === job.id) ?? job),
        );
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [running]);

  // Drives the elapsed readout while work is in flight.
  useEffect(() => {
    if (running.length === 0) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [running.length]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSettingsOpen(false);
        setQueueOpen(false);
        setHistoryOpen(false);
      }
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key.toLowerCase() === "h") {
        event.preventDefault();
        setHistoryOpen(true);
      }
      if (meta && event.key === "Enter") {
        event.preventDefault();
        formRef.current?.requestSubmit();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function generate(event: FormEvent) {
    event.preventDefault();
    if (!selectedModel?.available || !prompt.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId,
          prompt: prompt.trim(),
          aspectRatio: ratio,
          providerId: selectedModel.providerId,
          modelId: selectedModel.id,
          mediaKind: selectedModel.mediaKind,
          durationSeconds: selectedModel.mediaKind === "video" ? effectiveDuration : undefined,
        }),
      });
      const data = (await response.json()) as { error?: string; job?: GenerationJob };
      if (!response.ok) throw new Error(data.error ?? "Generation failed.");
      setPrompt("");
      setSelectedId(null);
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Generation failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function review(id: string, reviewStatus: ReviewStatus) {
    const response = await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewStatus }),
    });
    if (response.ok) await refresh();
  }

  function takeState(job: GenerationJob) {
    if (job.status === "failed") return "failed";
    if (job.id === selectedId) return "current";
    if (job.reviewStatus === "approved") return "approved";
    if (job.status !== "completed") return "queued";
    return "";
  }

  const elapsedOf = (job: GenerationJob) => clock((now - new Date(job.createdAt).getTime()) / 1000);

  return (
    <main className="room" data-room-state={roomState}>
      <header className="room__bar">
        <button className="wordmark" onClick={() => setSelectedId(null)}>Lumen</button>

        <div className="project-name">
          {(Object.keys(brands) as BrandId[]).map((id) => (
            <button
              key={id}
              className="text-action"
              aria-pressed={brandId === id}
              onClick={() => {
                setBrandId(id);
                setSelectedId(null);
              }}
              style={{ color: brandId === id ? "var(--color-ink)" : undefined }}
            >
              {brands[id].name}
            </button>
          ))}
        </div>

        <div className="room__status">
          <button className="text-action" onClick={() => setHistoryOpen(true)}>
            History <kbd>⌘H</kbd>
          </button>
          <span className="spend">Session {money(sessionSpend)}</span>
          <button className="queue-trigger" onClick={() => setQueueOpen(true)}>
            {running.length > 0 && <i aria-hidden="true" />}
            {running.length > 0 ? `${running.length} running` : "Idle"}
          </button>
        </div>
      </header>

      <section className="room__canvas" aria-live="polite">
        {roomState === "compose" && (
          <div className="compose-state">
            <div className="empty-stage">
              <span className="frame-index">NEW SHOT</span>
              <div className="frame-mark frame-mark--a" />
              <div className="frame-mark frame-mark--b" />
              <p>
                {brandJobs.length === 0
                  ? "Nothing in this workspace yet. Describe a shot below."
                  : "Pick a take below, or describe the next shot."}
              </p>
            </div>
          </div>
        )}

        {roomState === "running" && activeRun && (
          <div className="running-state">
            <div className="render-stage" aria-label="Generation in progress">
              <div className="render-exposure" />
              <div className="render-copy">
                <span>
                  {activeRun.queuePosition ? `QUEUED · POSITION ${activeRun.queuePosition}` : "GENERATING"}
                </span>
                <strong>
                  {activeRun.modelId.split("/").pop()} · {elapsedOf(activeRun)} ·{" "}
                  {money(activeRun.estimatedCostUsd)} committed
                </strong>
                <p>{activeRun.prompt}</p>
              </div>
              <div className="progress-track"><span /></div>
            </div>
            <div className="job-stack">
              {brandRunning.map((job) => (
                <div className="job-row job-row--active" key={job.id}>
                  <b>{job.modelId.split("/").pop()}</b>
                  <span>{job.queuePosition ? `Queued · ${job.queuePosition}` : "Generating"}</span>
                  <time>{elapsedOf(job)}</time>
                </div>
              ))}
            </div>
          </div>
        )}

        {roomState === "review" && selected && (
          <div className="review-state">
            <div className="review-stage">
              <div className="scene">
                {isVideo(selected) ? (
                  <video
                    src={selected.assetUrl}
                    controls
                    loop
                    playsInline
                    preload="metadata"
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selected.assetUrl}
                    alt={selected.prompt}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                )}
              </div>
            </div>

            <div className="review-toolbar">
              <div>
                <strong>{selected.prompt}</strong>
                <span>
                  {selected.modelId.split("/").pop()} · {selected.aspectRatio}
                  {selected.durationSeconds ? ` · ${selected.durationSeconds}s` : ""} ·{" "}
                  {money(selected.actualCostUsd ?? selected.estimatedCostUsd)}
                </span>
              </div>
              <button
                className="secondary-action"
                onClick={() => review(selected.id, "rejected")}
                aria-pressed={selected.reviewStatus === "rejected"}
              >
                {selected.reviewStatus === "rejected" ? "Rejected" : "Reject"}
              </button>
              <button
                className="primary-action"
                onClick={() => review(selected.id, "approved")}
                aria-pressed={selected.reviewStatus === "approved"}
              >
                {selected.reviewStatus === "approved" ? "Approved" : "Approve take"}
              </button>
            </div>
          </div>
        )}
      </section>

      {takes.length > 0 && (
        <div className="take-strip" aria-label="Takes">
          {takes.map((job, index) => (
            <button
              className={`take take--${takeState(job)}`}
              key={job.id}
              onClick={() => setSelectedId(job.id)}
              aria-pressed={job.id === selectedId}
            >
              <span className="take__image">{LETTERS[index] ?? "·"}</span>
              <span>
                <strong>{job.prompt.slice(0, 40)}</strong>
                <small>
                  {job.status === "completed"
                    ? `${job.reviewStatus} · ${money(job.actualCostUsd ?? job.estimatedCostUsd)}`
                    : job.status === "failed"
                      ? "Failed — see queue"
                      : "Generating"}
                </small>
              </span>
            </button>
          ))}
        </div>
      )}

      <form className="composer" onSubmit={generate} ref={formRef}>
        <label htmlFor="shot-prompt">Describe the shot</label>
        <textarea
          id="shot-prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Subject, action, camera, light…"
          rows={3}
        />
        <div className="composer__footer">
          <button type="button" className="config-line" onClick={() => setSettingsOpen(true)}>
            {selectedModel ? selectedModel.label : "No model"}
            {selectedModel?.mediaKind === "video" ? ` · ${effectiveDuration}s` : ""} · {ratio}
            <span>Configure</span>
          </button>
          <span />
          {error && <span style={{ color: "var(--color-error)", fontSize: "var(--text-xs)" }}>{error}</span>}
          <button
            className="generate-action"
            disabled={!selectedModel?.available || !prompt.trim() || isSubmitting}
          >
            {isSubmitting ? "Submitting…" : `Generate · ${money(cost)}`} <span>⌘↵</span>
          </button>
        </div>
      </form>

      {settingsOpen && (
        <div className="overlay" role="presentation" onMouseDown={() => setSettingsOpen(false)}>
          <section
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span>SHOT SETTINGS</span>
                <h2 id="settings-title">Render configuration</h2>
              </div>
              <button onClick={() => setSettingsOpen(false)} aria-label="Close settings">×</button>
            </header>

            <div className="setting-grid">
              <label>
                Model
                <select value={modelKey} onChange={(event) => setModelKey(event.target.value)}>
                  {models.map((model) => (
                    <option key={modelKeyOf(model)} value={modelKeyOf(model)} disabled={!model.available}>
                      {model.providerLabel} · {model.label}
                      {model.available ? "" : " — unavailable"}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Aspect ratio
                <select
                  value={ratio}
                  onChange={(event) => setRatio(event.target.value as AspectRatio)}
                >
                  {RATIOS.map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </label>
              {selectedModel?.mediaKind === "video" && (
                <label>
                  Duration
                  <select
                    value={effectiveDuration}
                    onChange={(event) => setDuration(Number(event.target.value))}
                  >
                    {(allowedDurations ?? [5]).map((value) => (
                      <option key={value} value={value}>{value} seconds</option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            {selectedModel?.availabilityReason && (
              <div className="setting-row">
                <div>
                  <strong>Unavailable</strong>
                  <span>{selectedModel.availabilityReason}</span>
                </div>
              </div>
            )}

            <div className="setting-row">
              <div>
                <strong>Estimated provider cost</strong>
                <span>
                  {selectedModel?.costPerSecondUsd
                    ? `${money(selectedModel.costPerSecondUsd)} per second × ${effectiveDuration}s. Final billing is the provider's.`
                    : "Final billing is the provider's."}
                </span>
              </div>
              <b>{money(cost)}</b>
            </div>
          </section>
        </div>
      )}

      {queueOpen && (
        <div className="overlay" role="presentation" onMouseDown={() => setQueueOpen(false)}>
          <section
            className="sheet sheet--queue"
            role="dialog"
            aria-modal="true"
            aria-labelledby="queue-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span>RENDER QUEUE</span>
                <h2 id="queue-title">Work continues in place.</h2>
              </div>
              <button onClick={() => setQueueOpen(false)} aria-label="Close queue">×</button>
            </header>
            <div className="queue-list">
              {running.length === 0 && (
                <div><i className="queue-state" /><b>Nothing running</b><span /><time /></div>
              )}
              {running.map((job) => (
                <div key={job.id}>
                  <i className="queue-state queue-state--running" />
                  <b>{job.prompt.slice(0, 60)}</b>
                  <span>{brands[job.brandId].code}</span>
                  <time>{elapsedOf(job)}</time>
                </div>
              ))}
              {jobs
                .filter((job) => job.status === "failed")
                .slice(0, 5)
                .map((job) => (
                  <div key={job.id}>
                    <i className="queue-state" />
                    <b>{job.prompt.slice(0, 60)}</b>
                    <span style={{ color: "var(--color-error)" }}>
                      {(job.error ?? "Failed").slice(0, 60)}
                    </span>
                    <time>failed</time>
                  </div>
                ))}
            </div>
          </section>
        </div>
      )}

      {historyOpen && (
        <div className="history-layer" role="dialog" aria-modal="true" aria-labelledby="history-title">
          <header>
            <div>
              <span>HISTORY</span>
              <h2 id="history-title">Every take, with its origin.</h2>
            </div>
            <button onClick={() => setHistoryOpen(false)} aria-label="Close history">×</button>
          </header>
          <div className="history-grid">
            {brandJobs.map((job) => (
              <article key={job.id}>
                <div className="history-frame">
                  {job.assetUrl && isVideo(job) && (
                    <video
                      src={job.assetUrl}
                      muted
                      playsInline
                      preload="metadata"
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  )}
                  {job.assetUrl && !isVideo(job) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={job.assetUrl}
                      alt={job.prompt}
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  )}
                </div>
                <strong>{job.prompt.slice(0, 60)}</strong>
                <span>
                  {new Date(job.createdAt).toISOString().slice(0, 10)} · {job.status} ·{" "}
                  {money(job.actualCostUsd ?? job.estimatedCostUsd)}
                </span>
              </article>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
