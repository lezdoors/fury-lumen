"use client";

import { FormEvent, useEffect, useState } from "react";
import "./prototype.css";

type RoomState = "compose" | "running" | "review";

const takes = [
  { id: "A", state: "approved", note: "Warm, restrained" },
  { id: "B", state: "current", note: "More camera drift" },
  { id: "C", state: "queued", note: "Lower movement" },
  { id: "D", state: "failed", note: "Retry available" },
];

export default function SingleRoomPrototype() {
  const [roomState, setRoomState] = useState<RoomState>("compose");
  const [prompt, setPrompt] = useState(
    "A structured leather weekender rests on a travertine bench. The camera makes a slow, precise arc as late afternoon light reveals the grain.",
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSettingsOpen(false);
        setQueueOpen(false);
        setHistoryOpen(false);
        setCompareOpen(false);
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "h") {
        event.preventDefault();
        setHistoryOpen(true);
      }
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        setRoomState("running");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    setRoomState("running");
  }

  return (
    <main className="room" data-room-state={roomState}>
      <header className="room__bar">
        <button className="wordmark" onClick={() => setRoomState("compose")}>Lumen</button>
        <div className="project-name">
          <span>Maison Tanneurs</span>
          <strong>Campaign studies</strong>
        </div>
        <div className="room__status">
          <button className="text-action" onClick={() => setHistoryOpen(true)}>History <kbd>⌘H</kbd></button>
          <span className="spend">Session $1.28</span>
          <button className="queue-trigger" onClick={() => setQueueOpen(true)}>
            <i aria-hidden="true" /> 2 running · 1 waiting
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
              <p>Drop a first frame, or begin with words.</p>
            </div>
          </div>
        )}

        {roomState === "running" && (
          <div className="running-state">
            <div className="render-stage" aria-label="Generation in progress">
              <div className="render-exposure" />
              <div className="render-copy">
                <span>GENERATING · TAKE A</span>
                <strong>Exposing motion</strong>
                <p>Fal queue accepted the request. The composer remains available.</p>
              </div>
              <div className="progress-track"><span /></div>
            </div>
            <div className="job-stack">
              <div className="job-row job-row--active"><b>Take A</b><span>Generating</span><time>01:42</time></div>
              <div className="job-row"><b>Take B</b><span>Waiting upstream</span><time>—</time></div>
              <div className="job-row"><b>Take C</b><span>Waiting locally</span><time>—</time></div>
            </div>
          </div>
        )}

        {roomState === "review" && (
          <div className="review-state">
            <div className={`review-stage ${compareOpen ? "is-comparing" : ""}`}>
              <div className="scene scene--a">
                <div className="scene__window" />
                <div className="scene__bench" />
                <div className="scene__object" />
                <span>TAKE A · 00:04.8</span>
              </div>
              {compareOpen && (
                <div className="scene scene--b">
                  <div className="scene__window" />
                  <div className="scene__bench" />
                  <div className="scene__object" />
                  <span>TAKE B · 00:04.8</span>
                </div>
              )}
              <button className="play-control" aria-label="Play selected take">▶</button>
              <div className="transport">
                <span>00:00.0</span><i /><span>00:04.8</span>
              </div>
            </div>

            <div className="review-toolbar">
              <div><strong>{compareOpen ? "Comparing A / B" : "Take A selected"}</strong><span>Kling · 5 sec · 16:9 · $0.42</span></div>
              <button className="secondary-action" onClick={() => setCompareOpen(!compareOpen)}>{compareOpen ? "Close compare" : "Compare"}</button>
              <button className="primary-action">Approve take</button>
            </div>

            <div className="take-strip" aria-label="Generated takes">
              {takes.map((take) => (
                <button className={`take take--${take.state}`} key={take.id}>
                  <span className="take__image">{take.id}</span>
                  <span><strong>Take {take.id}</strong><small>{take.note}</small></span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <form className="composer" onSubmit={submit}>
        <label htmlFor="shot-prompt">Describe the shot</label>
        <textarea
          id="shot-prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Subject, action, camera, light…"
          rows={3}
        />
        <div className="composer__footer">
          <button type="button" className="source-action">＋ First frame</button>
          <button type="button" className="config-line" onClick={() => setSettingsOpen(true)}>
            Kling · 5 sec · 16:9 · 1080p <span>Configure</span>
          </button>
          <button type="button" className="refine-action">Refine</button>
          <button className="generate-action" disabled={!prompt.trim()}>
            Generate · $0.42 <span>⌘↵</span>
          </button>
        </div>
      </form>

      <nav className="prototype-switcher" aria-label="Prototype state">
        {(["compose", "running", "review"] as RoomState[]).map((state) => (
          <button
            key={state}
            className={roomState === state ? "is-active" : ""}
            onClick={() => setRoomState(state)}
          >
            {state}
          </button>
        ))}
        <span>Prototype states</span>
      </nav>

      {settingsOpen && (
        <div className="overlay" role="presentation" onMouseDown={() => setSettingsOpen(false)}>
          <section className="sheet" role="dialog" aria-modal="true" aria-labelledby="settings-title" onMouseDown={(event) => event.stopPropagation()}>
            <header><div><span>SHOT SETTINGS</span><h2 id="settings-title">Render configuration</h2></div><button onClick={() => setSettingsOpen(false)} aria-label="Close settings">×</button></header>
            <div className="setting-row"><div><strong>Recommended model</strong><span>Kling · controlled camera movement</span></div><button>Change</button></div>
            <div className="setting-grid"><label>Duration<select defaultValue="5"><option>5 seconds</option><option>10 seconds</option></select></label><label>Aspect ratio<select defaultValue="16:9"><option>16:9</option><option>9:16</option><option>1:1</option></select></label></div>
            <div className="setting-row"><div><strong>Estimated provider cost</strong><span>Final cost may vary with provider billing</span></div><b>$0.42</b></div>
            <button className="advanced-action">Advanced model controls ↓</button>
          </section>
        </div>
      )}

      {queueOpen && (
        <div className="overlay" role="presentation" onMouseDown={() => setQueueOpen(false)}>
          <section className="sheet sheet--queue" role="dialog" aria-modal="true" aria-labelledby="queue-title" onMouseDown={(event) => event.stopPropagation()}>
            <header><div><span>RENDER QUEUE</span><h2 id="queue-title">Work continues in place.</h2></div><button onClick={() => setQueueOpen(false)} aria-label="Close queue">×</button></header>
            <div className="queue-list"><div><i className="queue-state queue-state--running"/><b>Leather weekender arc</b><span>Generating</span><time>01:42</time></div><div><i className="queue-state"/><b>Hardware detail</b><span>Waiting upstream</span><time>—</time></div><div><i className="queue-state"/><b>Handle silhouette</b><span>Waiting locally</span><time>—</time></div></div>
          </section>
        </div>
      )}

      {historyOpen && (
        <div className="history-layer" role="dialog" aria-modal="true" aria-labelledby="history-title">
          <header><div><span>HISTORY</span><h2 id="history-title">Every take, with its origin.</h2></div><button onClick={() => setHistoryOpen(false)} aria-label="Close history">×</button></header>
          <div className="history-grid"><article><div className="history-frame history-frame--one"/><strong>Leather weekender arc</strong><span>4 takes · one approved</span></article><article><div className="history-frame history-frame--two"/><strong>Hardware detail</strong><span>3 takes · July 30</span></article><article><div className="history-frame history-frame--three"/><strong>Handle silhouette</strong><span>2 takes · July 29</span></article></div>
        </div>
      )}
    </main>
  );
}
