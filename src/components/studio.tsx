"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { brands } from "@/lib/catalog";
import type { BrandId, GenerationJob, ProviderModel, ReviewStatus } from "@/lib/types";

const ratios = ["1:1", "4:5", "3:4", "16:9", "9:16"] as const;

function money(value: number | undefined) {
  return `$${(value ?? 0).toFixed(3)}`;
}

export function Studio({
  initialModels,
  initialJobs,
}: {
  initialModels: ProviderModel[];
  initialJobs: GenerationJob[];
}) {
  const [brandId, setBrandId] = useState<BrandId>("maison-tanneurs");
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState<(typeof ratios)[number]>("4:5");
  const [models, setModels] = useState<ProviderModel[]>(initialModels);
  const [modelKey, setModelKey] = useState(
    `${initialModels[0]?.providerId}:${initialModels[0]?.id}`,
  );
  const [jobs, setJobs] = useState<GenerationJob[]>(initialJobs);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [modelsResponse, jobsResponse] = await Promise.all([
      fetch("/api/models", { cache: "no-store" }),
      fetch("/api/jobs", { cache: "no-store" }),
    ]);
    const modelData = (await modelsResponse.json()) as { models: ProviderModel[] };
    const jobData = (await jobsResponse.json()) as { jobs: GenerationJob[] };
    setModels(modelData.models);
    setJobs(jobData.jobs);
    setModelKey((current) => current || `${modelData.models[0]?.providerId}:${modelData.models[0]?.id}`);
  }, []);


  const selectedModel = models.find(
    (model) => `${model.providerId}:${model.id}` === modelKey,
  );
  const brandJobs = useMemo(
    () => jobs.filter((job) => job.brandId === brandId),
    [brandId, jobs],
  );
  const approved = brandJobs.filter((job) => job.reviewStatus === "approved").length;
  const totalCost = brandJobs.reduce(
    (sum, job) => sum + (job.actualCostUsd ?? job.estimatedCostUsd),
    0,
  );

  async function generate(event: FormEvent) {
    event.preventDefault();
    if (!selectedModel) return;
    setIsGenerating(true);
    setError("");
    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId,
          prompt,
          aspectRatio: ratio,
          providerId: selectedModel.providerId,
          modelId: selectedModel.id,
          mediaKind: selectedModel.mediaKind,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Generation failed.");
      setPrompt("");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function review(id: string, reviewStatus: ReviewStatus) {
    const response = await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewStatus }),
    });
    if (response.ok) await load();
  }

  return (
    <div className="studio-shell">
      <aside className="sidebar">
        <div>
          <div className="wordmark">ATELIER</div>
          <p className="sidebar-caption">Direct creative production</p>
        </div>

        <nav className="brand-nav" aria-label="Brands">
          <div className="nav-label">Workspaces</div>
          {(Object.keys(brands) as BrandId[]).map((id) => (
            <button
              className={`brand-button ${brandId === id ? "active" : ""}`}
              key={id}
              onClick={() => setBrandId(id)}
            >
              <span className="brand-code">{brands[id].code}</span>
              <span>
                <strong>{brands[id].name}</strong>
                <small>{brands[id].note}</small>
              </span>
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">
          <span className="status-dot" />
          Local workspace
          <small>Provider keys stay server-side</small>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{brands[brandId].code} / CREATIVE STUDIO</p>
            <h1>{brands[brandId].name}</h1>
          </div>
          <div className="summary-row">
            <div><span>GENERATIONS</span><strong>{brandJobs.length}</strong></div>
            <div><span>APPROVED</span><strong>{approved}</strong></div>
            <div><span>SPEND</span><strong>{money(totalCost)}</strong></div>
          </div>
        </header>

        <section className="composer-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">NEW GENERATION</p>
              <h2>Make the next frame.</h2>
            </div>
            <p>Every output keeps its brand, model, prompt, cost and review state.</p>
          </div>

          <form className="composer" onSubmit={generate}>
            <label className="prompt-field">
              <span>Creative direction</span>
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Describe the image, composition, material, light and intended use…"
                rows={5}
                minLength={3}
                required
              />
            </label>

            <div className="controls-grid">
              <label>
                <span>Model</span>
                <select value={modelKey} onChange={(event) => setModelKey(event.target.value)}>
                  {models.map((model) => (
                    <option
                      key={`${model.providerId}:${model.id}`}
                      value={`${model.providerId}:${model.id}`}
                      disabled={!model.available}
                    >
                      {model.providerLabel} · {model.label}{!model.available ? " — unavailable" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <fieldset>
                <legend>Ratio</legend>
                <div className="ratio-row">
                  {ratios.map((value) => (
                    <button
                      type="button"
                      key={value}
                      className={ratio === value ? "selected" : ""}
                      onClick={() => setRatio(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="cost-box">
                <span>Estimated provider cost</span>
                <strong>{money(selectedModel?.estimatedCostUsd)}</strong>
              </div>
              <button className="generate-button" disabled={isGenerating || !selectedModel?.available}>
                {isGenerating ? "GENERATING…" : "GENERATE"}
                <span>→</span>
              </button>
            </div>
            {selectedModel?.availabilityReason && (
              <p className="availability-note">{selectedModel.availabilityReason}</p>
            )}
            {error && <p className="error-message">{error}</p>}
          </form>
        </section>

        <section className="library-section">
          <div className="library-heading">
            <div>
              <p className="eyebrow">OUTPUT LIBRARY</p>
              <h2>Recent work</h2>
            </div>
            <span>{brandJobs.length} assets</span>
          </div>

          {brandJobs.length === 0 ? (
            <div className="empty-state">
              <p>No generations in this workspace.</p>
              <span>Use Proof mode to exercise the workflow without a provider charge.</span>
            </div>
          ) : (
            <div className="asset-grid">
              {brandJobs.map((job) => (
                <article className="asset-card" key={job.id}>
                  <div className={`asset-frame ratio-${job.aspectRatio.replace(":", "-")}`}>
                    {job.assetUrl ? (
                      // Generated assets can be local or returned by an approved provider.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={job.assetUrl} alt={job.prompt} />
                    ) : (
                      <div className="asset-placeholder">{job.status}</div>
                    )}
                    <span className={`review-badge ${job.reviewStatus}`}>{job.reviewStatus}</span>
                  </div>
                  <div className="asset-copy">
                    <p>{job.prompt}</p>
                    <div className="asset-meta">
                      <span>{job.providerId} / {job.modelId}</span>
                      <span>{job.aspectRatio}</span>
                      <span>{money(job.actualCostUsd ?? job.estimatedCostUsd)}</span>
                    </div>
                    {job.error && <small className="error-message">{job.error}</small>}
                    <div className="review-actions">
                      <button
                        onClick={() => review(job.id, "approved")}
                        className={job.reviewStatus === "approved" ? "active" : ""}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => review(job.id, "rejected")}
                        className={job.reviewStatus === "rejected" ? "active" : ""}
                      >
                        Reject
                      </button>
                      {job.assetUrl && <a href={job.assetUrl} download>Export ↗</a>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
