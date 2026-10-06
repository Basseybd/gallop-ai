"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ask as copy } from "@/content";
import {
  DEFAULT_OPENROUTER_MODELS,
  DEFAULT_PROVIDER_MODELS,
  LIST_LENGTHS,
  MAX_LANES,
  MIN_LANES,
  PROVIDERS,
  QUESTION_MAX,
  askLane,
  cleanKey,
  cleanModel,
  cleanQuestion,
  uniqueLabels,
  type Lane,
  type ListLength,
  type Provider,
} from "@/lib/ask";
import { ModelPicker } from "./model-picker";
import { Results, type LaneStatus } from "./results";
import { useOpenRouter } from "./use-openrouter";

const emptyKeys = (): Record<Provider, string> => ({ OpenAI: "", Claude: "", Gemini: "", Perplexity: "" });

// Keeps browsers and password managers from saving, suggesting or syncing a key.
const secretInputProps = {
  type: "password",
  autoComplete: "off",
  autoCorrect: "off",
  autoCapitalize: "off",
  spellCheck: false,
  "data-1p-ignore": true,
  "data-lpignore": "true",
  "data-bwignore": true,
  "data-form-type": "other",
} as const;

const input = "mt-2 block min-h-12 w-full border border-hairline bg-raised px-3 text-base text-ink";
const link = "inline-flex min-h-11 items-center px-1 text-sm underline underline-offset-[0.25em]";
const h = "font-display text-xl";

export function AskForm() {
  const id = useId();
  const openrouter = useOpenRouter();
  const [mode, setMode] = useState<"openrouter" | "keys">("openrouter");
  const [question, setQuestion] = useState("");
  const [length, setLength] = useState<ListLength>(5);
  const [lanes, setLanes] = useState<Lane[]>(() =>
    DEFAULT_OPENROUTER_MODELS.map((model) => ({ label: copy.defaultLanes[model] ?? model, transport: "openrouter", model })),
  );
  const [picking, setPicking] = useState(false);
  // Provider keys exist only in this component's memory. No storage, no URL, no server.
  const [keys, setKeys] = useState<Record<Provider, string>>(emptyKeys);
  const [providerModels, setProviderModels] = useState<Record<Provider, string>>({ ...DEFAULT_PROVIDER_MODELS });
  const [run, setRun] = useState<{ question: string; lanes: Lane[] } | null>(null);
  const [status, setStatus] = useState<Record<string, LaneStatus | undefined>>({});
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const running = useRef<AbortController | null>(null);
  const resultsRef = useRef<HTMLElement>(null);

  useEffect(() => () => running.current?.abort(), []);

  const busy = run?.lanes.some((l) => status[l.label]?.state === "waiting") ?? false;
  const fail = (text: string) => setMessage({ text, error: true });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const q = cleanQuestion(question);
    if (!q) return fail(copy.badQuestion(QUESTION_MAX));

    let toRun: { lane: Lane; key: string }[];
    if (mode === "openrouter") {
      if (!openrouter.key) return fail(copy.needConnection);
      if (lanes.length < MIN_LANES) return fail(copy.needTwo(MIN_LANES));
      for (const l of lanes) if (!cleanModel(l.model)) return fail(copy.badModel(l.label));
      toRun = uniqueLabels(lanes.slice(0, MAX_LANES), copy.duplicateLabel).map((lane) => ({ lane, key: openrouter.key! }));
    } else {
      const chosen = PROVIDERS.filter((p) => keys[p].trim() !== "");
      for (const p of chosen) {
        if (!cleanKey(keys[p])) return fail(copy.badKey(p));
        if (!cleanModel(providerModels[p])) return fail(copy.badModel(p));
      }
      if (chosen.length < MIN_LANES) return fail(copy.needTwoKeys);
      toRun = chosen.map((p) => ({ lane: { label: p, transport: p, model: cleanModel(providerModels[p])! }, key: cleanKey(keys[p])! }));
    }

    running.current?.abort();
    const controller = new AbortController();
    running.current = controller;
    setRun({ question: q, lanes: toRun.map((t) => t.lane) });
    setStatus(Object.fromEntries(toRun.map((t) => [t.lane.label, { state: "waiting" }])));
    requestAnimationFrame(() => resultsRef.current?.focus());

    await Promise.all(
      toRun.map(async ({ lane, key }) => {
        const r = await askLane(lane, key, q, length, controller.signal);
        if (controller.signal.aborted) return;
        setStatus((prev) => ({ ...prev, [lane.label]: r.ok ? { state: "done", list: r.list } : { state: "error", error: r.error } }));
      }),
    );
  }

  function clearKeys() {
    running.current?.abort();
    setRun(null);
    setStatus({});
    setKeys(emptyKeys());
    setMessage({ text: copy.cleared, error: false });
  }

  function disconnect() {
    running.current?.abort();
    setRun(null);
    setStatus({});
    openrouter.disconnect();
    setMessage({ text: copy.disconnected, error: false });
  }

  const connectStatus =
    openrouter.state === "connected"
      ? copy.connected
      : openrouter.state === "failed"
        ? copy.connectFailed
        : openrouter.state === "expired"
          ? copy.connectExpired
          : null;

  return (
    <>
      <form onSubmit={onSubmit} autoComplete="off" noValidate className="mt-10 sm:mt-14">
        <div className="max-w-2xl">
          <label htmlFor={`${id}-q`} className={h}>
            {copy.questionLabel}
          </label>
          <input
            id={`${id}-q`}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={QUESTION_MAX}
            autoComplete="off"
            aria-describedby={`${id}-q-hint`}
            className={`${input} font-display text-lg`}
          />
          <p id={`${id}-q-hint`} className="mt-2 text-sm text-secondary">
            {copy.questionHint(QUESTION_MAX)}
          </p>
        </div>

        <fieldset className="mt-8">
          <legend className="text-sm">{copy.lengthLegend}</legend>
          <div className="mt-2 inline-flex border border-hairline">
            {LIST_LENGTHS.map((n) => (
              <label
                key={n}
                className="relative inline-flex min-h-11 min-w-20 cursor-pointer items-center justify-center border-l border-hairline px-4 text-sm first:border-l-0 has-checked:bg-graphite has-checked:text-raised has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-graphite"
              >
                <input type="radio" name={`${id}-len`} value={n} checked={length === n} onChange={() => setLength(n)} className="sr-only" />
                {copy.lengthOption(n)}
              </label>
            ))}
          </div>
        </fieldset>

        {mode === "openrouter" ? (
          <>
            <section aria-labelledby={`${id}-connect`} className="mt-12">
              <h2 id={`${id}-connect`} className={h}>
                {copy.connectHeading}
              </h2>
              <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-secondary">
                {copy.connectBody}
              </p>
              <a href={copy.privacyHref} rel="noreferrer" className={`${link} -ml-1`}>
                {copy.privacyLink}
              </a>
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                {openrouter.state === "connected" ? (
                  <>
                    <p className="inline-flex min-h-11 items-center gap-2">
                      <span className="chrome-dot" aria-hidden="true" />
                      {copy.connected}
                    </p>
                    <button type="button" onClick={disconnect} className={link}>
                      {copy.disconnect}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={openrouter.connect}
                    disabled={openrouter.state === "connecting"}
                    className="inline-flex min-h-12 items-center border border-graphite px-6 text-base transition-colors duration-300 hover:bg-graphite hover:text-raised disabled:cursor-wait disabled:opacity-70"
                  >
                    {openrouter.state === "connecting" ? copy.connecting : copy.connectButton}
                  </button>
                )}
                <button type="button" onClick={() => setMode("keys")} className={link}>
                  {copy.modeKeys}
                </button>
              </div>
              <p aria-live="polite" className="mt-2 text-sm">
                {connectStatus && openrouter.state !== "connected" ? connectStatus : ""}
              </p>
              <p className="mt-1 max-w-[62ch] text-sm text-secondary">{copy.connectNote}</p>
            </section>

            <section aria-labelledby={`${id}-lanes`} className="mt-12">
              <h2 id={`${id}-lanes`} className={h}>
                {copy.lanesHeading}
              </h2>
              <p className="mt-2 text-sm text-secondary">{copy.lanesHint(MIN_LANES, MAX_LANES)}</p>
              <ul className="mt-4 max-w-2xl border-t border-hairline">
                {lanes.map((l, i) => (
                  <li key={`${l.model}-${i}`} className="flex items-center justify-between gap-4 border-b border-hairline py-2">
                    <span className="min-w-0">
                      <span className="block">{l.label}</span>
                      <span className="block font-mono text-xs break-all text-secondary">{l.model}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setLanes((ls) => ls.filter((_, j) => j !== i))}
                      aria-label={copy.removeLane(l.label)}
                      title={copy.removeLane(l.label)}
                      className="inline-flex size-11 shrink-0 items-center justify-center text-secondary transition-colors duration-300 hover:text-ink"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                        <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
              {lanes.length < MAX_LANES ? (
                !picking && (
                  <button type="button" onClick={() => setPicking(true)} className={`${link} mt-2`}>
                    {copy.addModel}
                  </button>
                )
              ) : (
                <p className="mt-3 text-sm text-secondary">{copy.lanesFull(MAX_LANES)}</p>
              )}
              {picking && lanes.length < MAX_LANES && (
                <ModelPicker
                  taken={new Set(lanes.map((l) => l.model))}
                  onPick={(m) => {
                    setLanes((ls) => (ls.length < MAX_LANES ? [...ls, { label: m.name, transport: "openrouter", model: m.id }] : ls));
                    if (lanes.length + 1 >= MAX_LANES) setPicking(false);
                  }}
                  onClose={() => setPicking(false)}
                />
              )}
            </section>
          </>
        ) : (
          <section aria-labelledby={`${id}-keys`} className="mt-12">
            <h2 id={`${id}-keys`} className={h}>
              {copy.keysHeading}
            </h2>
            <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-secondary">
              {copy.keysBody}
            </p>
            <a href={copy.privacyHref} rel="noreferrer" className={`${link} -ml-1`}>
              {copy.privacyLink}
            </a>
            <div className="mt-4 grid max-w-3xl gap-x-8 gap-y-5 sm:grid-cols-2">
              {PROVIDERS.map((p) => (
                <div key={p}>
                  <label htmlFor={`${id}-k-${p}`} className="text-sm">
                    {copy.keyLabel(p)}
                  </label>
                  <input
                    id={`${id}-k-${p}`}
                    {...secretInputProps}
                    value={keys[p]}
                    onChange={(e) => setKeys((k) => ({ ...k, [p]: e.target.value }))}
                    aria-describedby={`${id}-k-hint`}
                    className={`${input} font-mono text-sm`}
                  />
                </div>
              ))}
            </div>
            <p id={`${id}-k-hint`} className="mt-3 text-sm text-secondary">
              {copy.keyHint}
            </p>
            <details className="group mt-4">
              <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm underline underline-offset-[0.25em] [&::-webkit-details-marker]:hidden">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="transition-transform duration-300 group-open:rotate-90">
                  <path d="M4.5 2.5 8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                </svg>
                {copy.providerModelsSummary}
              </summary>
              <p id={`${id}-pm-hint`} className="mt-1 text-sm text-secondary">
                {copy.providerModelHint}
              </p>
              <div className="mt-3 grid max-w-3xl gap-x-8 gap-y-4 sm:grid-cols-2">
                {PROVIDERS.map((p) => (
                  <div key={p}>
                    <label htmlFor={`${id}-pm-${p}`} className="text-sm">
                      {copy.providerModelLabel(p)}
                    </label>
                    <input
                      id={`${id}-pm-${p}`}
                      value={providerModels[p]}
                      onChange={(e) => setProviderModels((v) => ({ ...v, [p]: e.target.value }))}
                      autoComplete="off"
                      spellCheck={false}
                      autoCapitalize="off"
                      aria-describedby={`${id}-pm-hint`}
                      className={`${input} font-mono text-sm`}
                    />
                  </div>
                ))}
              </div>
            </details>
            <div className="mt-2 flex flex-wrap gap-x-6">
              <button type="button" onClick={clearKeys} className={link}>
                {copy.clearKeys}
              </button>
              <button type="button" onClick={() => setMode("openrouter")} className={link}>
                {copy.modeOpenRouter}
              </button>
            </div>
          </section>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex min-h-12 items-center bg-graphite px-8 text-base text-raised transition-colors duration-300 hover:bg-ink disabled:cursor-wait disabled:opacity-70"
          >
            {busy ? copy.asking : copy.submit}
          </button>
        </div>
        <div aria-live="polite" className="mt-3 min-h-6 text-sm">
          {message && <p className={message.error ? "text-ink" : "text-secondary"}>{message.text}</p>}
        </div>
      </form>

      {run && <Results ref={resultsRef} question={run.question} lanes={run.lanes} status={status} />}
    </>
  );
}
