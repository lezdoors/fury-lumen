"use client";

import {
  DragEvent,
  FormEvent,
  ClipboardEvent,
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
  formatRate,
  isLocale,
  resolveLocale,
} from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { estimateCost } from "@/lib/types";
import type { AspectRatio, GenerationJob, ProviderModel, ReviewStatus } from "@/lib/types";

const POLL_INTERVAL_MS = 2500;

/**
 * Above this, the run key arms rather than fires. Seedance 2.0 at ten seconds
 * is a few dollars a press, and nothing else in the interface spends money, so
 * one deliberate second press is the whole spend guard.
 */
const CONFIRM_ABOVE_USD = 1;
const ARM_TIMEOUT_MS = 6000;

/** The room before there is any work to put in it. */
const FIELD_STILL = "/stage/field.webp";

/** Drawn to proportion in the format control — the shape is the label. */
const RATIOS: { value: AspectRatio; w: number; h: number }[] = [
  { value: "16:9", w: 15, h: 8 },
  { value: "9:16", w: 8, h: 15 },
  { value: "1:1", w: 11, h: 11 },
  { value: "4:5", w: 10, h: 12 },
  { value: "3:4", w: 10, h: 13 },
];

type Filter = "all" | "video" | "image" | "kept" | "failed";
interface Reference {
  url: string;
  name: string;
}

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

/** Day and time an entry was made — an archive without dates is a pile. */
function stamp(iso: string, locale: Locale) {
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-MA" : locale, {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      numberingSystem: "latn",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
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

function endpointOf(model: ProviderModel) {
  return model.endpoint ?? model.id;
}

/** Only an image-to-video endpoint can be handed a reference frame. */
function acceptsReference(model: ProviderModel) {
  return endpointOf(model).includes("image-to-video");
}

/** The same family's image-to-video path, when the catalogue carries one. */
function referenceSiblingOf(model: ProviderModel) {
  return endpointOf(model).replace("text-to-video", "image-to-video");
}

/** The provider org and the mode suffix are noise on a caption; drop both. */
function shortModelId(modelId: string) {
  const parts = modelId.split("/").filter(Boolean);
  const mode = parts.at(-1) ?? "";
  const core = /-to-(video|image)$/.test(mode) ? parts.slice(1, -1) : parts.slice(1);
  return (core.length ? core.join("/") : modelId).toUpperCase();
}

/** Rate for the bar and the sort — a flat-priced image model has no per-second. */
function rateOf(model: ProviderModel) {
  return model.costPerSecondUsd ?? model.estimatedCostUsd;
}

export function Console({
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
  const [references, setReferences] = useState<Reference[]>([]);
  const [modelKey, setModelKey] = useState(() => {
    const first = initialModels.find((model) => model.available) ?? initialModels[0];
    return first ? modelKeyOf(first) : "";
  });
  const [openId, setOpenId] = useState<string | null>(null);
  /**
   * Arming is stored as the signature of what was armed, not as a boolean.
   * Change the model, the duration or the prompt and the signature no longer
   * matches, so the key disarms itself — a boolean would have needed an effect
   * to chase every input, and would have stayed armed through an edit.
   */
  const [armedFor, setArmedFor] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDropTarget, setIsDropTarget] = useState(false);
  const [fault, setFault] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [now, setNow] = useState(() => Date.now());

  const locale = useSyncExternalStore(subscribeLocale, readLocale, () => "en" as Locale);
  const t = DICTIONARIES[locale];
  const money = useCallback((value: number) => formatMoney(value, locale), [locale]);
  const rate = useCallback((value: number) => formatRate(value, locale), [locale]);

  const formRef = useRef<HTMLFormElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const selectedModel = models.find((model) => modelKeyOf(model) === modelKey);
  const allowedDurations = selectedModel?.durations;
  const effectiveDuration =
    allowedDurations?.length && !allowedDurations.includes(duration)
      ? allowedDurations[0]
      : duration;
  const cost = selectedModel ? estimateCost(selectedModel, effectiveDuration) : 0;
  const needsConfirm = cost > CONFIRM_ABOVE_USD;
  const armSignature = `${modelKey}|${effectiveDuration}|${ratio}|${prompt.trim()}`;
  const armed = armedFor === armSignature;
  const setArmed = useCallback(
    (next: boolean) => setArmedFor(next ? armSignature : null),
    [armSignature],
  );

  /** Sorted cheapest first — the rate card is a price list, so it reads as one. */
  const rateCard = useMemo(
    () => [...models].sort((a, b) => rateOf(a) - rateOf(b)),
    [models],
  );
  const topRate = useMemo(
    () => Math.max(...models.map(rateOf), 0.0001),
    [models],
  );

  /**
   * Serials are assigned in creation order and never move, so LMN-0042 means the
   * forty-second run this console ever made — a stable handle for a result, which
   * a UUID is not and a position in a grid is not either.
   */
  const serials = useMemo(() => {
    const ordered = [...jobs].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return new Map(ordered.map((job, index) => [job.id, `LMN-${String(index + 1).padStart(4, "0")}`]));
  }, [jobs]);

  /**
   * The room behind the console. Once there is finished work it is the most
   * recent clip, because an interface that wears what you made it is worth more
   * than one that wears a stock gradient. Before that, a shipped field.
   */
  const field = useMemo(() => {
    // Proof renders are diagnostics — a test pattern on black. They exercise the
    // loop honestly and they are the wrong thing to hang on the wall, so only
    // real generations are ever promoted to the field.
    const latest = jobs.find(
      (job) =>
        job.status === "completed" &&
        job.assetUrl &&
        isVideo(job) &&
        job.providerId !== "mock",
    );
    return { video: latest?.assetUrl, still: FIELD_STILL };
  }, [jobs]);

  const running = useMemo(
    () => jobs.filter((job) => job.status === "running" || job.status === "queued"),
    [jobs],
  );
  const spend = jobs.reduce(
    (total, job) => total + (job.actualCostUsd ?? job.estimatedCostUsd),
    0,
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return jobs.filter((job) => {
      if (filter === "video" && !isVideo(job)) return false;
      if (filter === "image" && isVideo(job)) return false;
      if (filter === "kept" && job.reviewStatus !== "approved") return false;
      if (filter === "failed" && job.status !== "failed") return false;
      if (!needle) return true;
      return (
        job.prompt.toLowerCase().includes(needle) ||
        job.modelId.toLowerCase().includes(needle) ||
        (serials.get(job.id) ?? "").toLowerCase().includes(needle)
      );
    });
  }, [jobs, filter, query, serials]);

  const viewable = useMemo(() => visible.filter((job) => job.assetUrl), [visible]);
  const openIndex = viewable.findIndex((job) => job.id === openId);
  const opened = openIndex >= 0 ? viewable[openIndex] : undefined;

  const refreshedModelFor = useCallback(
    (job: GenerationJob) =>
      models.find((model) => model.providerId === job.providerId && model.id === job.modelId),
    [models],
  );

  const refresh = useCallback(async () => {
    const [modelsResponse, jobsResponse] = await Promise.all([
      fetch("/api/models", { cache: "no-store" }),
      fetch("/api/jobs", { cache: "no-store" }),
    ]);
    setModels(((await modelsResponse.json()) as { models: ProviderModel[] }).models);
    const fetched = ((await jobsResponse.json()) as { jobs: GenerationJob[] }).jobs;
    // Union rather than replace: the server is authoritative for anything it
    // knows about, but a host without shared storage may not know about a job
    // this session just created, and dropping it would look like a failure.
    setJobs((current) => {
      const known = new Set(fetched.map((job) => job.id));
      const localOnly = current.filter((job) => !known.has(job.id));
      return [...fetched, ...localOnly].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    });
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

  // Arming expires on its own. A key left armed across a coffee break would fire
  // a charge the next time someone leaned on the keyboard.
  useEffect(() => {
    if (!armedFor) return;
    const timer = setTimeout(() => setArmedFor(null), ARM_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [armedFor]);

  // Arabic mirrors the interface. Every rule uses logical properties, so setting
  // dir on the document is the entire flip.
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dirOf(locale);
  }, [locale]);

  /**
   * The lens. The cursor burns a clear circle through the scrim so a frame can
   * be read at full strength without leaving the console.
   *
   * Position is written straight to two custom properties on the stage — no
   * state, so no render per frame — and eased, because an un-eased mask that
   * snaps to the pointer reads as a bug rather than as an optic. Pointer-driven
   * by definition, so it is off entirely for coarse pointers and for anyone who
   * asked for reduced motion.
   */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const target = { x: 0, y: 0 };
    const eased = { x: 0, y: 0 };
    let primed = false;
    let frame = 0;

    function onMove(event: MouseEvent) {
      target.x = event.clientX;
      target.y = event.clientY;
      if (!primed) {
        // Snap on the first sighting, or the lens sweeps in from the origin.
        eased.x = target.x;
        eased.y = target.y;
        primed = true;
      }
      stage!.classList.add("is-lit");
    }
    function onLeave() {
      stage!.classList.remove("is-lit");
    }
    function tick() {
      eased.x += (target.x - eased.x) * 0.14;
      eased.y += (target.y - eased.y) * 0.14;
      stage!.style.setProperty("--mx", `${eased.x}px`);
      stage!.style.setProperty("--my", `${eased.y}px`);
      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  // One orchestrated entrance as a tile arrives, then it is simply there — not
  // a fade that replays every time the ledger scrolls past.
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Only hide the tiles once there is an observer that can bring them back.
    sheet.classList.add("sheet--staged");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.04 },
    );
    for (const tile of sheet.querySelectorAll(".tile")) observer.observe(tile);
    return () => observer.disconnect();
  }, [visible]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "INPUT" ||
        target?.isContentEditable;

      if (event.key === "Escape") {
        setOpenId(null);
        setArmedFor(null);
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        formRef.current?.requestSubmit();
        return;
      }
      if (!typing && event.key === "/") {
        event.preventDefault();
        promptRef.current?.focus();
        return;
      }
      if (openId && (event.key === "ArrowRight" || event.key === "ArrowLeft")) {
        event.preventDefault();
        const step = event.key === "ArrowRight" ? 1 : -1;
        setOpenId((current) => {
          const index = viewable.findIndex((job) => job.id === current);
          if (index < 0) return current;
          const next = viewable[(index + step + viewable.length) % viewable.length];
          return next?.id ?? current;
        });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openId, viewable]);

  async function attach(files: FileList | File[] | null) {
    const file = files?.[0];
    if (!file) return;
    setIsUploading(true);
    setFault("");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/uploads", { method: "POST", body });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) throw new Error(data.error ?? "Upload failed.");
      setReferences([{ url: data.url, name: file.name }]);

      // A reference frame is only meaningful to an image-to-video endpoint, so
      // the console moves to the sibling model rather than letting the run fail
      // at the provider with a payload error.
      if (selectedModel && !acceptsReference(selectedModel)) {
        const wanted = referenceSiblingOf(selectedModel);
        const sibling = models.find(
          (model) => endpointOf(model) === wanted && acceptsReference(model),
        );
        const fallback = models.find((model) => model.available && acceptsReference(model));
        const next = sibling?.available ? sibling : fallback;
        if (next) {
          setModelKey(modelKeyOf(next));
          setNotice(t.switchedForReference(next.label));
        } else {
          setNotice(t.noReferenceModel);
        }
      }
    } catch (caught) {
      setFault(caught instanceof Error ? caught.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDropTarget(false);
    void attach(event.dataTransfer.files);
  }

  function onPaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const files = Array.from(event.clipboardData.files);
    if (files.length === 0) return;
    event.preventDefault();
    void attach(files);
  }

  const referenceBlocked = references.length > 0 && Boolean(selectedModel) && !acceptsReference(selectedModel!);
  const canRun =
    Boolean(selectedModel?.available) && prompt.trim().length > 0 && !isSubmitting && !referenceBlocked;

  async function submit(
    payload: {
      prompt: string;
      aspectRatio: AspectRatio;
      model: ProviderModel;
      durationSeconds?: number;
      referenceUrls: string[];
    },
  ) {
    setIsSubmitting(true);
    setFault("");
    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: payload.prompt,
          aspectRatio: payload.aspectRatio,
          providerId: payload.model.providerId,
          modelId: payload.model.id,
          mediaKind: payload.model.mediaKind,
          durationSeconds:
            payload.model.mediaKind === "video" ? payload.durationSeconds : undefined,
          referenceUrls: payload.referenceUrls,
        }),
      });
      const data = (await response.json()) as { error?: string; job?: GenerationJob };
      if (!response.ok) throw new Error(data.error ?? "Generation failed.");
      // Merge the job the server just returned. On a host without shared
      // storage a re-fetch can hit an instance that never saw it.
      if (data.job) {
        const created = data.job;
        setJobs((current) =>
          current.some((job) => job.id === created.id) ? current : [created, ...current],
        );
      }
      await refresh().catch(() => undefined);
      return true;
    } catch (caught) {
      setFault(caught instanceof Error ? caught.message : "Generation failed.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function run(event: FormEvent) {
    event.preventDefault();
    if (!canRun || !selectedModel) return;
    if (needsConfirm && !armed) {
      setArmed(true);
      return;
    }
    setArmed(false);
    const sent = await submit({
      prompt: prompt.trim(),
      aspectRatio: ratio,
      model: selectedModel,
      durationSeconds: effectiveDuration,
      referenceUrls: references.map((reference) => reference.url),
    });
    if (sent) {
      setPrompt("");
      setReferences([]);
      setNotice("");
    }
  }

  /** Re-run a past job exactly as it was recorded. */
  async function again(job: GenerationJob) {
    const model = refreshedModelFor(job);
    if (!model?.available) {
      setFault(model?.availabilityReason ?? "That model is no longer available.");
      return;
    }
    await submit({
      prompt: job.prompt,
      aspectRatio: job.aspectRatio,
      model,
      durationSeconds: job.durationSeconds,
      referenceUrls: job.referenceUrls ?? [],
    });
  }

  /** Load a past job's whole recipe back into the composer for editing. */
  function reuse(job: GenerationJob) {
    setPrompt(job.prompt);
    setRatio(job.aspectRatio);
    if (job.durationSeconds) setDuration(job.durationSeconds);
    const model = refreshedModelFor(job);
    if (model) setModelKey(modelKeyOf(model));
    setReferences(
      (job.referenceUrls ?? []).map((url) => ({ url, name: url.split("/").pop() ?? "reference" })),
    );
    setOpenId(null);
    promptRef.current?.focus();
    promptRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  async function review(id: string, reviewStatus: ReviewStatus) {
    setJobs((current) =>
      current.map((job) => (job.id === id ? { ...job, reviewStatus } : job)),
    );
    const response = await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewStatus }),
    });
    if (response.ok) await refresh();
  }

  const elapsedOf = (job: GenerationJob) =>
    clock((now - new Date(job.createdAt).getTime()) / 1000);

  const posterFor = (job: GenerationJob) =>
    job.assetUrl === "/proof-sample.mp4"
      ? "/proof-sample.jpg"
      : isVideo(job)
        ? `${job.assetUrl}?poster=1`
        : (job.assetUrl as string);

  const runLabel = armed ? t.confirm : t.run;

  return (
    <>
      {/* ------------------------------------------------------------ stage */}
      {/* The room. A shipped field until there is work, then the operator's own
          last completed clip. The lens layer is the same picture undimmed; the
          scrim between them is what the cursor burns through. */}
      <div className="stage" ref={stageRef} aria-hidden="true">
        {field.video ? (
          <video
            className="stage__frame"
            src={field.video}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="stage__frame" src={field.still} alt="" fetchPriority="high" />
        )}
        <div className="stage__scrim" />
        {field.video ? (
          <video className="stage__lens" src={field.video} autoPlay muted loop playsInline preload="metadata" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="stage__lens" src={field.still} alt="" />
        )}
      </div>

      <main className="console">
        {/* ---------------------------------------------------------- mast */}
        <header className="mast">
          <div className="wordmark blend">
            Lumen
            <small>{t.consoleSub}</small>
          </div>
          <div className="mast__right">
            <div className="readout glass">
              <span>
                {t.spent}
                <b>{money(spend)}</b>
              </span>
              <span>
                {t.runs}
                <b>{jobs.length}</b>
              </span>
              <span className={running.length ? "is-live" : undefined}>
                {t.live}
                <b>{running.length}</b>
              </span>
            </div>
            <div className="langs glass" role="group" aria-label={t.language}>
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
          </div>
        </header>

        {/* --------------------------------------------------------- plate */}
        <div className="plate">
        {/* ---------------------------------------------------------- deck */}
          {/* The price of the next click, and nothing else. */}
          <section className="deck" aria-labelledby="quote-label">
            <div className="quote">
              <span className="silk" id="quote-label">{t.quote}</span>
              <output
                key={cost}
                className="quote__figure blend"
                aria-live="polite"
              >
                {money(cost)}
              </output>
              <p className="quote__line">
                {selectedModel?.costPerSecondUsd ? (
                  <span>
                    {rate(selectedModel.costPerSecondUsd)}
                    {t.perSecond} × {effectiveDuration}s
                  </span>
                ) : (
                  <span>{cost === 0 ? t.free : t.flat}</span>
                )}
                <span>{ratio}</span>
              </p>
              <p className="quote__model">{selectedModel?.label ?? t.noModel}</p>
            </div>

            <div className="scale">
              <div className="scale__track">
                <i
                  aria-hidden="true"
                  style={{
                    ["--at" as string]: `${((selectedModel ? rateOf(selectedModel) : 0) / topRate) * 100}%`,
                  }}
                />
              </div>
              <div className="scale__ends">
                <span>{rate(0)}</span>
                <span>
                  {rate(topRate)}
                  {t.perSecond}
                </span>
              </div>
            </div>
          </section>

          <section className="composer">
            <form ref={formRef} onSubmit={run}>
              <div
                className={`composer__well glass ${isDropTarget ? "is-target" : ""}`}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDropTarget(true);
                }}
                onDragLeave={() => setIsDropTarget(false)}
                onDrop={onDrop}
              >
                <label className="sr-only" htmlFor="prompt">{t.promptLabel}</label>
                <textarea
                  id="prompt"
                  ref={promptRef}
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  onPaste={onPaste}
                  placeholder={isDropTarget ? t.dropHere : t.promptPlaceholder}
                  rows={2}
                />

                {references.length > 0 && (
                  <div className="refs">
                    {references.map((reference) => (
                      <button
                        key={reference.url}
                        type="button"
                        className="ref"
                        title={reference.name}
                        aria-label={`${t.removeRef} — ${reference.name}`}
                        onClick={() => setReferences([])}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={reference.url} alt="" />
                        <span aria-hidden="true">✕</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="composer__foot">
                  <div className="composer__left">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="sr-only"
                      onChange={(event) => {
                        void attach(event.target.files);
                        event.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      className="attach"
                      aria-label={t.attachAria}
                      onClick={() => fileRef.current?.click()}
                      disabled={isUploading}
                    >
                      <span aria-hidden="true">+</span> {isUploading ? t.uploading : t.attach}
                    </button>
                    <span className="hint">{t.shortcut}</span>
                  </div>
                  {/* The recipe, written out. The quote says what it costs; this
                      says what "it" is, so nothing about the charge is implicit. */}
                  <p className="recipe">
                    {selectedModel ? shortModelId(selectedModel.id) : t.noModel}
                    {selectedModel?.mediaKind === "video" ? ` · ${effectiveDuration}s` : ""} ·{" "}
                    {ratio}
                    {references.length > 0 ? ` · ${t.takesReference}` : ""}
                  </p>
                  <div className="composer__right">
                    <button
                      type="submit"
                      className={`runkey ${armed ? "runkey--armed" : ""}`}
                      disabled={!canRun}
                      aria-label={t.runAria(money(cost))}
                    >
                      {runLabel} <b>{isSubmitting ? t.sending : money(cost)}</b>
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {armed && <p className="fault" role="status">{t.armed(money(cost))}</p>}
            {referenceBlocked && <p className="fault" role="status">{t.noReferenceModel}</p>}
            {notice && !armed && <p className="note" role="status">{notice}</p>}
            {fault && <p className="fault" role="alert">{fault}</p>}
          </section>

          {running.length > 0 && (
            <section className="live" aria-label={t.inProgress}>
              <span className="silk">{t.inProgress}</span>
              <ul>
                {running.map((job) => (
                  <li key={job.id} className="glass">
                    <span className="live__serial">{serials.get(job.id)}</span>
                    <p>{job.prompt}</p>
                    <span className="live__state">
                      {job.queuePosition ? t.queuedAt(job.queuePosition) : t.generating}
                    </span>
                    <time>{elapsedOf(job)}</time>
                    <span className="live__scan" aria-hidden="true"><i /></span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* ---------------------------------------------------------- rail */}
        <div className="rail">
          <section className="rates glass" aria-labelledby="rates-label">
            <div className="rates__head">
              <span className="silk" id="rates-label">{t.rateCard}</span>
              <span className="rates__unit">{t.rateUnit}</span>
            </div>
            <div className="rates__list">
              {rateCard.map((model) => {
                const perSecond = model.costPerSecondUsd;
                const width = Math.max(2, (rateOf(model) / topRate) * 100);
                return (
                  <button
                    key={modelKeyOf(model)}
                    type="button"
                    className={`rate ${modelKey === modelKeyOf(model) ? "is-active" : ""}`}
                    disabled={!model.available}
                    aria-pressed={modelKey === modelKeyOf(model)}
                    onClick={() => {
                      setModelKey(modelKeyOf(model));
                      setNotice("");
                    }}
                  >
                    {/* The REF marker leads the row: trailing it puts it inside
                        the ellipsis, so the one thing that changes what a model
                        can do is the first thing truncated away. */}
                    <span className="rate__name">
                      {acceptsReference(model) && (
                        <span className="rate__ref">{t.takesReference}</span>
                      )}
                      {model.label}
                    </span>
                    <span className="rate__price">
                      {perSecond ? rate(perSecond) : rateOf(model) === 0 ? "—" : money(rateOf(model))}
                    </span>
                    <span className="rate__bar" aria-hidden="true">
                      <i style={{ ["--w" as string]: `${width}%` }} />
                    </span>
                    {model.availabilityReason && (
                      <span className="rate__why">{model.availabilityReason}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="controls glass" aria-labelledby="format-label">
            <div className="control">
              <span className="silk" id="format-label">{t.aspect}</span>
              <div className="segments segments--grid" role="group" aria-labelledby="format-label">
                {RATIOS.map((entry) => (
                  <button
                    key={entry.value}
                    type="button"
                    className="segment"
                    aria-pressed={ratio === entry.value}
                    onClick={() => setRatio(entry.value)}
                  >
                    <i
                      aria-hidden="true"
                      style={{
                        ["--gw" as string]: `${entry.w}px`,
                        ["--gh" as string]: `${entry.h}px`,
                      }}
                    />
                    {entry.value}
                  </button>
                ))}
              </div>
            </div>

            {selectedModel?.mediaKind === "video" && (
              <div className="control">
                <span className="silk" id="duration-label">{t.duration}</span>
                <div className="segments" role="group" aria-labelledby="duration-label">
                  {(allowedDurations ?? [5]).map((value) => (
                    <button
                      key={value}
                      type="button"
                      className="segment"
                      aria-pressed={effectiveDuration === value}
                      onClick={() => setDuration(value)}
                    >
                      {t.seconds(value)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* -------------------------------------------------------- ledger */}
      <section className="ledger" id="ledger" aria-labelledby="ledger-label">
        <div className="ledger__head">
          <div className="ledger__title">
            <h2 id="ledger-label">{t.ledger}</h2>
            <span className="ledger__count">{t.ledgerCount(jobs.length, money(spend))}</span>
          </div>
          <div className="ledger__tools">
            <label className="sr-only" htmlFor="find">{t.find}</label>
            <input
              id="find"
              className="find"
              type="search"
              value={query}
              placeholder={t.find}
              onChange={(event) => setQuery(event.target.value)}
            />
            <div className="segments" role="group" aria-label={t.ledger}>
              {(
                [
                  ["all", t.filterAll],
                  ["video", t.filterVideo],
                  ["image", t.filterImage],
                  ["kept", t.filterKept],
                  ["failed", t.filterFailed],
                ] as [Filter, string][]
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className="segment"
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {jobs.length === 0 ? (
          <p className="empty">{t.empty}</p>
        ) : visible.length === 0 ? (
          <p className="empty">
            {t.emptyFiltered}{" "}
            <button
              type="button"
              className="segment"
              onClick={() => {
                setFilter("all");
                setQuery("");
              }}
            >
              {t.clearFilters}
            </button>
          </p>
        ) : (
          <div className="sheet" ref={sheetRef}>
            {visible.map((job) => {
              const model = refreshedModelFor(job);
              return (
                <article key={job.id} className={`tile tile--${job.status}`}>
                  <div
                    className="tile__frame"
                    style={{ ["--ar" as string]: job.aspectRatio.replace(":", " / ") }}
                  >
                    <button
                      type="button"
                      className="tile__stage"
                      disabled={!job.assetUrl}
                      aria-label={job.prompt}
                      onClick={() => job.assetUrl && setOpenId(job.id)}
                    >
                      {job.assetUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={posterFor(job)}
                          alt=""
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.src = "/proof-sample.jpg";
                          }}
                        />
                      ) : (
                        <span className="tile__wait">
                          {job.status === "failed" ? t.failedTag : t.waiting}
                        </span>
                      )}
                    </button>
                    {job.assetUrl && (
                      <span className="tile__kind">{isVideo(job) ? t.videoTag : t.imageTag}</span>
                    )}
                    {job.reviewStatus === "approved" && (
                      <span className="tile__kept" aria-label={t.kept} />
                    )}
                    <div className="tile__acts">
                      <button
                        type="button"
                        className="act"
                        disabled={!model?.available || isSubmitting}
                        onClick={() => void again(job)}
                      >
                        {t.again}
                      </button>
                      <button type="button" className="act" onClick={() => reuse(job)}>
                        {t.reuse}
                      </button>
                      <button
                        type="button"
                        className="act"
                        onClick={() =>
                          void review(
                            job.id,
                            job.reviewStatus === "approved" ? "unreviewed" : "approved",
                          )
                        }
                      >
                        {job.reviewStatus === "approved" ? t.kept : t.keep}
                      </button>
                    </div>
                  </div>

                  <div className="tile__caption">
                    <span className="tile__line">
                      <b>{serials.get(job.id)}</b>
                      {money(job.actualCostUsd ?? job.estimatedCostUsd)}
                    </span>
                    <span className="tile__meta">
                      <span>
                        {shortModelId(job.modelId)}
                        {job.durationSeconds ? ` · ${job.durationSeconds}s` : ""} · {job.aspectRatio}
                      </span>
                      <time dateTime={job.createdAt}>{stamp(job.createdAt, locale)}</time>
                    </span>
                    <p className="tile__prompt">{job.prompt}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <footer className="footing">
        <p className="colophon">{t.colophon}</p>
      </footer>

      {/* -------------------------------------------------------- viewer */}
      {opened?.assetUrl && (
        <div className="viewer" role="dialog" aria-modal="true" aria-label={opened.prompt}>
          <div className="viewer__stage" onMouseDown={() => setOpenId(null)}>
            {isVideo(opened) ? (
              <video
                src={opened.assetUrl}
                controls
                autoPlay
                loop
                muted
                playsInline
                onMouseDown={(event) => event.stopPropagation()}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={opened.assetUrl}
                alt={opened.prompt}
                onMouseDown={(event) => event.stopPropagation()}
              />
            )}
          </div>
          <div className="viewer__bar">
            <div className="viewer__id">
              <p>{opened.prompt}</p>
              <span className="viewer__telemetry">
                {serials.get(opened.id)} · {shortModelId(opened.modelId)}
                {opened.durationSeconds ? ` · ${opened.durationSeconds}s` : ""} ·{" "}
                {opened.aspectRatio} · {money(opened.actualCostUsd ?? opened.estimatedCostUsd)} ·
                REF {opened.id.slice(0, 8)}
              </span>
            </div>
            <button
              type="button"
              className="key"
              aria-label={t.previous}
              disabled={viewable.length < 2}
              onClick={() =>
                setOpenId(viewable[(openIndex - 1 + viewable.length) % viewable.length].id)
              }
            >
              <span className="arrow" aria-hidden="true">←</span>
            </button>
            <button
              type="button"
              className="key"
              aria-label={t.next}
              disabled={viewable.length < 2}
              onClick={() => setOpenId(viewable[(openIndex + 1) % viewable.length].id)}
            >
              <span className="arrow" aria-hidden="true">→</span>
            </button>
            <button type="button" className="key" onClick={() => reuse(opened)}>{t.reuse}</button>
            <a className="key" href={opened.assetUrl} download>{t.download}</a>
            <button
              type="button"
              className={`key ${opened.reviewStatus === "approved" ? "key--on" : ""}`}
              onClick={() =>
                void review(
                  opened.id,
                  opened.reviewStatus === "approved" ? "unreviewed" : "approved",
                )
              }
            >
              {opened.reviewStatus === "approved" ? t.kept : t.keep}
            </button>
            <button type="button" className="key" onClick={() => setOpenId(null)} aria-label={t.close}>
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
