"use client";

import {
  FormEvent,
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { estimateCost } from "@/lib/types";
import type { AspectRatio, GenerationJob, ProviderModel, ReviewStatus } from "@/lib/types";

const RATIOS: AspectRatio[] = ["16:9", "9:16", "1:1", "4:5", "3:4"];
const POLL_INTERVAL_MS = 2500;

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

/**
 * Chrome paints a poster from a `#t=` media fragment; Safari holds black until
 * the element is actually seeked. Nudging currentTime once metadata lands makes
 * result thumbnails render in every browser.
 */
function paintFirstFrame(event: SyntheticEvent<HTMLVideoElement>) {
  const video = event.currentTarget;
  if (video.currentTime < 0.05 && Number.isFinite(video.duration)) {
    try {
      video.currentTime = Math.min(0.1, video.duration / 2);
    } catch {
      // A provider URL that refuses range requests keeps its black frame.
    }
  }
}

export function Room({
  initialModels,
  initialJobs,
}: {
  initialModels: ProviderModel[];
  initialJobs: GenerationJob[];
}) {
  const [models, setModels] = useState(initialModels);
  const [jobs, setJobs] = useState(initialJobs);
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState<AspectRatio>("16:9");
  const [duration, setDuration] = useState(5);
  const [modelKey, setModelKey] = useState(() => {
    const first = initialModels.find((model) => model.available) ?? initialModels[0];
    return first ? modelKeyOf(first) : "";
  });
  const [openId, setOpenId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
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

  const running = useMemo(
    () => jobs.filter((job) => job.status === "running" || job.status === "queued"),
    [jobs],
  );
  const spend = jobs.reduce(
    (total, job) => total + (job.actualCostUsd ?? job.estimatedCostUsd),
    0,
  );
  const opened = openId ? jobs.find((job) => job.id === openId) : undefined;

  const refresh = useCallback(async () => {
    const [modelsResponse, jobsResponse] = await Promise.all([
      fetch("/api/models", { cache: "no-store" }),
      fetch("/api/jobs", { cache: "no-store" }),
    ]);
    setModels(((await modelsResponse.json()) as { models: ProviderModel[] }).models);
    setJobs(((await jobsResponse.json()) as { jobs: GenerationJob[] }).jobs);
  }, []);

  // Reading a running job is what advances it — the provider is polled server
  // side on GET. The interval stops the moment nothing is queued, so an idle
  // Lumen makes no provider calls at all.
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

  useEffect(() => {
    if (running.length === 0) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [running.length]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSettingsOpen(false);
        setOpenId(null);
      }
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
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
          prompt: prompt.trim(),
          aspectRatio: ratio,
          providerId: selectedModel.providerId,
          modelId: selectedModel.id,
          mediaKind: selectedModel.mediaKind,
          durationSeconds: selectedModel.mediaKind === "video" ? effectiveDuration : undefined,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Generation failed.");
      setPrompt("");
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

  const elapsedOf = (job: GenerationJob) =>
    clock((now - new Date(job.createdAt).getTime()) / 1000);

  return (
    <main className="page">
      <div className="page__sky" aria-hidden="true" />
      <div className="page__grid" aria-hidden="true"><i /><i /><i /><i /></div>

      <header className="topbar">
        <span className="wordmark">Lumen</span>
        <nav className="topnav" aria-label="Sections">
          <a href="#results">Results</a>
          <button type="button" onClick={() => setSettingsOpen(true)}>Models</button>
        </nav>
        <div className="topbar__right">
          <span className="spend">Spent {money(spend)}</span>
          <span className={`chip ${running.length ? "chip--live" : ""}`}>
            {running.length ? `${running.length} generating` : "Idle"}
          </span>
        </div>
      </header>

      <section className="hero">
        <span className="badge">Pay per generation — no subscription</span>

        <h1>
          Make anything.<br />
          Pay only for <em>what you make</em>
        </h1>

        <form className="ask" onSubmit={generate} ref={formRef}>
          <label className="sr-only" htmlFor="prompt">Describe what to generate</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Describe what you want to create…"
            rows={2}
          />
          <div className="ask__row">
            <div className="ask__left">
              <button
                type="button"
                className="circle"
                title="Reference image — not wired yet"
                aria-label="Add a reference image"
                disabled
              >
                +
              </button>
              <button type="button" className="model-chip" onClick={() => setSettingsOpen(true)}>
                {selectedModel ? selectedModel.label : "No model"}
                {selectedModel?.mediaKind === "video" ? ` · ${effectiveDuration}s` : ""} · {ratio}
                <span aria-hidden="true">⌄</span>
              </button>
            </div>
            <div className="ask__right">
              {error && <span className="ask__error">{error}</span>}
              <span className="ask__cost">{isSubmitting ? "Sending…" : money(cost)}</span>
              <button
                className="go"
                aria-label={`Generate for ${money(cost)}`}
                disabled={!selectedModel?.available || !prompt.trim() || isSubmitting}
              >
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </form>

        {running.length > 0 && (
          <ul className="live" aria-label="In progress">
            {running.map((job) => (
              <li key={job.id}>
                <i aria-hidden="true" />
                <b>{job.prompt.slice(0, 46)}</b>
                <span>{job.queuePosition ? `queued ${job.queuePosition}` : "generating"}</span>
                <time>{elapsedOf(job)}</time>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="results" id="results">
        <div className="results__head">
          <h2>Your generations</h2>
          <span>{jobs.length} total · {money(spend)} spent</span>
        </div>

        {jobs.length === 0 ? (
          <p className="results__empty">
            Nothing yet. Describe something above and press <kbd>⌘</kbd><kbd>↵</kbd>.
          </p>
        ) : (
          <div className="grid">
            {jobs.map((job) => (
              <button
                key={job.id}
                className={`card card--${job.status}`}
                onClick={() => job.assetUrl && setOpenId(job.id)}
                aria-label={job.prompt}
              >
                <span className="card__media">
                  {job.assetUrl && isVideo(job) && (
                    <video
                      src={`${job.assetUrl}#t=0.1`}
                      muted
                      playsInline
                      preload="metadata"
                      onLoadedMetadata={paintFirstFrame}
                    />
                  )}
                  {job.assetUrl && !isVideo(job) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={job.assetUrl} alt="" />
                  )}
                  {!job.assetUrl && (
                    <span className="card__status">
                      {job.status === "failed" ? "Failed" : "Generating…"}
                    </span>
                  )}
                  {isVideo(job) && job.assetUrl && <span className="card__kind">VIDEO</span>}
                </span>
                <span className="card__foot">
                  <strong>{job.prompt}</strong>
                  <small>
                    {job.modelId.split("/").pop()} ·{" "}
                    {money(job.actualCostUsd ?? job.estimatedCostUsd)}
                  </small>
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {opened?.assetUrl && (
        <div className="lightbox" role="dialog" aria-modal="true" onMouseDown={() => setOpenId(null)}>
          <div className="lightbox__inner" onMouseDown={(event) => event.stopPropagation()}>
            <div className="lightbox__stage">
              {isVideo(opened) ? (
                <video src={opened.assetUrl} controls autoPlay loop playsInline />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={opened.assetUrl} alt={opened.prompt} />
              )}
            </div>
            <div className="lightbox__bar">
              <div>
                <strong>{opened.prompt}</strong>
                <span>
                  {opened.modelId.split("/").pop()} · {opened.aspectRatio}
                  {opened.durationSeconds ? ` · ${opened.durationSeconds}s` : ""} ·{" "}
                  {money(opened.actualCostUsd ?? opened.estimatedCostUsd)}
                </span>
              </div>
              <a className="btn" href={opened.assetUrl} download>Download</a>
              <button
                className="btn"
                onClick={() =>
                  review(opened.id, opened.reviewStatus === "approved" ? "unreviewed" : "approved")
                }
              >
                {opened.reviewStatus === "approved" ? "★ Kept" : "☆ Keep"}
              </button>
              <button className="btn" onClick={() => setOpenId(null)} aria-label="Close">✕</button>
            </div>
          </div>
        </div>
      )}

      {settingsOpen && (
        <div className="overlay" role="presentation" onMouseDown={() => setSettingsOpen(false)}>
          <section
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="model-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span>MODEL</span>
                <h2 id="model-title">What should make it</h2>
              </div>
              <button onClick={() => setSettingsOpen(false)} aria-label="Close">✕</button>
            </header>

            <div className="model-list">
              {models.map((model) => (
                <button
                  key={modelKeyOf(model)}
                  className={`model-row ${modelKey === modelKeyOf(model) ? "is-active" : ""}`}
                  disabled={!model.available}
                  onClick={() => {
                    setModelKey(modelKeyOf(model));
                    setSettingsOpen(false);
                  }}
                >
                  <span>
                    <strong>{model.label}</strong>
                    <small>
                      {model.providerLabel} · {model.mediaKind}
                      {model.availabilityReason ? ` · ${model.availabilityReason}` : ""}
                    </small>
                  </span>
                  <b>
                    {model.costPerSecondUsd
                      ? `${money(model.costPerSecondUsd)}/s`
                      : money(model.estimatedCostUsd)}
                  </b>
                </button>
              ))}
            </div>

            <div className="field-grid">
              <label>
                Aspect ratio
                <select value={ratio} onChange={(event) => setRatio(event.target.value as AspectRatio)}>
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

            <p className="sheet__note">
              Estimated cost is <strong>{money(cost)}</strong> per generation. Final billing is
              the provider&rsquo;s.
            </p>
          </section>
        </div>
      )}
    </main>
  );
}
