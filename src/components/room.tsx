"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  DICTIONARIES,
  LOCALES,
  LOCALE_LABELS,
  LOCALE_NAMES,
  dirOf,
  formatMoney,
  isLocale,
  resolveLocale,
} from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { estimateCost } from "@/lib/types";
import type { AspectRatio, GenerationJob, ProviderModel, ReviewStatus } from "@/lib/types";

const RATIOS: AspectRatio[] = ["16:9", "9:16", "1:1", "4:5", "3:4"];
const POLL_INTERVAL_MS = 2500;

const LOCALE_STORAGE_KEY = "lumen.locale";
const LOCALE_EVENT = "lumen:locale";

/**
 * The locale is external state: it lives in localStorage and must differ between
 * the server render (always English, so markup matches) and the client. Reading
 * it through a store is what keeps hydration clean without setting state from an
 * effect.
 */
function subscribeLocale(onChange: () => void) {
  window.addEventListener(LOCALE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(LOCALE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readLocale(): Locale {
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (isLocale(stored)) return stored;
  return resolveLocale(navigator.languages ?? [navigator.language]);
}

function writeLocale(next: Locale) {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
  window.dispatchEvent(new Event(LOCALE_EVENT));
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
  const locale = useSyncExternalStore(subscribeLocale, readLocale, () => "en" as Locale);
  const t = DICTIONARIES[locale];
  const money = useCallback((value: number) => formatMoney(value, locale), [locale]);
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

  // Arabic mirrors the interface. Every rule uses logical properties, so setting
  // dir on the document is the entire flip.
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dirOf(locale);
  }, [locale]);

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
        <nav className="topnav" aria-label={t.navResults}>
          <a href="#results">{t.navResults}</a>
          <button type="button" onClick={() => setSettingsOpen(true)}>{t.navModels}</button>
        </nav>
        <div className="topbar__right">
          <div className="langs" role="group" aria-label={t.language}>
            {LOCALES.map((code) => (
              <button
                key={code}
                type="button"
                className="lang"
                lang={code}
                title={LOCALE_NAMES[code]}
                aria-label={LOCALE_NAMES[code]}
                aria-pressed={locale === code}
                onClick={() => writeLocale(code)}
              >
                {LOCALE_LABELS[code]}
              </button>
            ))}
          </div>
          <span className="spend">{t.spent} {money(spend)}</span>
          <span className={`chip ${running.length ? "chip--live" : ""}`}>
            {running.length ? t.generatingCount(running.length) : t.idle}
          </span>
        </div>
      </header>

      <section className="hero">
        <span className="badge">{t.badge}</span>

        <h1>
          {t.headlineTop}<br />
          {t.headlineLead} <em>{t.headlineAccent}</em>
        </h1>

        <form className="ask" onSubmit={generate} ref={formRef}>
          <label className="sr-only" htmlFor="prompt">{t.promptLabel}</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={t.promptPlaceholder}
            rows={2}
          />
          <div className="ask__row">
            <div className="ask__left">
              <button
                type="button"
                className="circle"
                title={t.referenceTitle}
                aria-label={t.referenceAria}
                disabled
              >
                +
              </button>
              <button type="button" className="model-chip" onClick={() => setSettingsOpen(true)}>
                {selectedModel ? selectedModel.label : t.noModel}
                {selectedModel?.mediaKind === "video" ? ` · ${effectiveDuration}s` : ""} · {ratio}
                <span aria-hidden="true">⌄</span>
              </button>
            </div>
            <div className="ask__right">
              {error && <span className="ask__error">{error}</span>}
              <span className="ask__cost">{isSubmitting ? t.sending : money(cost)}</span>
              <button
                className="go"
                aria-label={t.generateAria(money(cost))}
                disabled={!selectedModel?.available || !prompt.trim() || isSubmitting}
              >
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </form>

        {running.length > 0 && (
          <ul className="live" aria-label={t.inProgress}>
            {running.map((job) => (
              <li key={job.id}>
                <i aria-hidden="true" />
                <b>{job.prompt.slice(0, 46)}</b>
                <span>{job.queuePosition ? t.queuedAt(job.queuePosition) : t.generating}</span>
                <time>{elapsedOf(job)}</time>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="results" id="results">
        <div className="results__head">
          <h2>{t.resultsTitle}</h2>
          <span>{t.resultsMeta(jobs.length, money(spend))}</span>
        </div>

        {jobs.length === 0 ? (
          <p className="results__empty">
            {t.resultsEmpty} <kbd>⌘</kbd><kbd>↵</kbd>.
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
                  {job.assetUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={isVideo(job) ? `${job.assetUrl}?poster=1` : job.assetUrl}
                      alt=""
                      loading="lazy"
                    />
                  )}
                  {!job.assetUrl && (
                    <span className="card__status">
                      {job.status === "failed" ? t.cardFailed : t.cardGenerating}
                    </span>
                  )}
                  {isVideo(job) && job.assetUrl && <span className="card__kind">{t.videoTag}</span>}
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
              <a className="btn" href={opened.assetUrl} download>{t.download}</a>
              <button
                className="btn"
                onClick={() =>
                  review(opened.id, opened.reviewStatus === "approved" ? "unreviewed" : "approved")
                }
              >
                {opened.reviewStatus === "approved" ? t.kept : t.keep}
              </button>
              <button className="btn" onClick={() => setOpenId(null)} aria-label={t.close}>✕</button>
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
                <span>{t.modelEyebrow}</span>
                <h2 id="model-title">{t.modelTitle}</h2>
              </div>
              <button onClick={() => setSettingsOpen(false)} aria-label={t.close}>✕</button>
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
                {t.aspectRatio}
                <select value={ratio} onChange={(event) => setRatio(event.target.value as AspectRatio)}>
                  {RATIOS.map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </label>
              {selectedModel?.mediaKind === "video" && (
                <label>
                  {t.duration}
                  <select
                    value={effectiveDuration}
                    onChange={(event) => setDuration(Number(event.target.value))}
                  >
                    {(allowedDurations ?? [5]).map((value) => (
                      <option key={value} value={value}>{t.seconds(value)}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            <p className="sheet__note">{t.costNote(money(cost))}</p>
          </section>
        </div>
      )}
    </main>
  );
}
