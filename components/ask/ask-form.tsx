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

// Key fields are uncontrolled: React never mirrors a key into the DOM `value` attribute,
// and the value is read once, on submit. These props keep browsers and password managers away.
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

const input = "mt-2 block min-h-12 w-full border border-edge bg-raised px-3 text-base text-ink";
const link = "-ml-1 inline-flex min-h-11 items-center px-1 text-sm underline underline-offset-[0.25em]";
const h = "font-display text-xl outline-none";
const isLength = (n: unknown): n is ListLength => LIST_LENGTHS.includes(n as ListLength);

export function AskForm() {
  const id = useId();
  const openrouter = useOpenRouter();
  const [mode, setMode] = useState<"openrouter" | "keys">("openrouter");
  const [question, setQuestion] = useState("");
  const [questionError, setQuestionError] = useState(false);
  const [length, setLength] = useState<ListLength>(5);
  const [lanes, setLanes] = useState<Lane[]>(() =>
    DEFAULT_OPENROUTER_MODELS.map((model) => ({ label: copy.defaultLanes[model] ?? model, transport: "openrouter", model })),
  );
  const [picking, setPicking] = useState(false);
  const [providerModels, setProviderModels] = useState<Record<Provider, string>>({ ...DEFAULT_PROVIDER_MODELS });
  const [run, setRun] = useState<{ question: string; lanes: Lane[] } | null>(null);
  const [status, setStatus] = useState<Record<string, LaneStatus | undefined>>({});
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  const keyRefs = useRef<Partial<Record<Provider, HTMLInputElement | null>>>({});
  const running = useRef<AbortController | null>(null);
  const inFlight = useRef(false);
  const resultsRef = useRef<HTMLElement>(null);
  const questionRef = useRef<HTMLInputElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const fullRef = useRef<HTMLParagraphElement>(null);
  const keysHeadingRef = useRef<HTMLHeadingElement>(null);
  const connectHeadingRef = useRef<HTMLHeadingElement>(null);
  const removeRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const focusAfter = useRef<(() => void) | null>(null);

  useEffect(() => () => running.current?.abort(), []);

  // Run any focus move queued by the last action, after React has rendered it.
  useEffect(() => {
    const f = focusAfter.current;
    focusAfter.current = null;
    f?.();
  });

  // Back from OpenRouter: put back what the visitor had typed, then hand them the question.
  const { carried } = openrouter;
  useEffect(() => {
    if (!carried) return;
    const restore = async () => {
      await Promise.resolve();
      if (carried.question) setQuestion(carried.question);
      if (isLength(carried.length)) setLength(carried.length);
      questionRef.current?.focus();
    };
    void restore();
  }, [carried]);

  const busy = run?.lanes.some((l) => status[l.label]?.state === "waiting") ?? false;
  const fail = (text: string) => setMessage({ text, error: true });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (inFlight.current) return; // a second click or Enter before React re-renders
    setMessage(null);
    const q = cleanQuestion(question);
    if (!q) {
      setQuestionError(true);
      questionRef.current?.focus();
      return fail(copy.badQuestion(QUESTION_MAX));
    }
    setQuestionError(false);

    let toRun: { lane: Lane; key: string }[];
    if (mode === "openrouter") {
      if (!openrouter.key) return fail(copy.needConnection);
      if (lanes.length < MIN_LANES) return fail(copy.needTwo(MIN_LANES));
      for (const l of lanes) if (!cleanModel(l.model)) return fail(copy.badModel(l.label));
      toRun = uniqueLabels(lanes.slice(0, MAX_LANES), copy.duplicateLabel).map((lane) => ({ lane, key: openrouter.key! }));
    } else {
      const raw = Object.fromEntries(PROVIDERS.map((p) => [p, keyRefs.current[p]?.value ?? ""])) as Record<Provider, string>;
      const chosen = PROVIDERS.filter((p) => raw[p].trim() !== "");
      for (const p of chosen) {
        if (!cleanKey(raw[p])) return fail(copy.badKey(p));
        if (!cleanModel(providerModels[p])) return fail(copy.badModel(p));
      }
      if (chosen.length < MIN_LANES) return fail(copy.needTwoKeys);
      toRun = chosen.map((p) => ({ lane: { label: p, transport: p, model: cleanModel(providerModels[p])! }, key: cleanKey(raw[p])! }));
    }

    inFlight.current = true;
    running.current?.abort();
    const controller = new AbortController();
    running.current = controller;
    setRun({ question: q, lanes: toRun.map((t) => t.lane) });
    setStatus(Object.fromEntries(toRun.map((t) => [t.lane.label, { state: "waiting" }])));
    focusAfter.current = () => resultsRef.current?.focus();

    try {
      await Promise.all(
        toRun.map(async ({ lane, key }) => {
          const r = await askLane(lane, key, q, length, controller.signal);
          if (controller.signal.aborted) return;
          setStatus((prev) => ({ ...prev, [lane.label]: r.ok ? { state: "done", list: r.list } : { state: "error", error: r.error } }));
        }),
      );
    } finally {
      if (running.current === controller) inFlight.current = false;
    }
  }

  function stopRun() {
    running.current?.abort();
    inFlight.current = false;
    setRun(null);
    setStatus({});
  }

  function clearKeys() {
    stopRun();
    for (const p of PROVIDERS) if (keyRefs.current[p]) keyRefs.current[p]!.value = "";
    setMessage({ text: copy.cleared, error: false });
  }

  function disconnect() {
    stopRun();
    openrouter.disconnect();
    setMessage({ text: copy.disconnected, error: false });
    focusAfter.current = () => connectHeadingRef.current?.focus();
  }

  function switchMode(next: "openrouter" | "keys") {
    setMode(next);
    setPicking(false);
    focusAfter.current = () => (next === "keys" ? keysHeadingRef : connectHeadingRef).current?.focus();
  }

  function removeLane(i: number) {
    setLanes((ls) => ls.filter((_, j) => j !== i));
    // Focus the next remove button (which slides into this slot), the previous one, or Add a model.
    focusAfter.current = () => (removeRefs.current[i] ?? removeRefs.current[i - 1] ?? addRef.current)?.focus();
  }

  function closePicker() {
    setPicking(false);
    focusAfter.current = () => (addRef.current ?? fullRef.current)?.focus();
  }

  const connectStatus =
    openrouter.state === "connected"
      ? copy.connected
      : openrouter.state === "failed"
        ? copy.connectFailed
        : openrouter.state === "expired"
          ? copy.connectExpired
          : "";

  return (
    <>
      <form onSubmit={onSubmit} autoComplete="off" noValidate className="mt-10 sm:mt-14">
        <div className="max-w-2xl">
          <label htmlFor={`${id}-q`} className="text-sm">
            {copy.questionLabel}
          </label>
          <input
            id={`${id}-q`}
            ref={questionRef}
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              if (questionError) setQuestionError(false);
            }}
            maxLength={QUESTION_MAX}
            autoComplete="off"
            aria-invalid={questionError || undefined}
            aria-describedby={questionError ? `${id}-q-hint ${id}-msg` : `${id}-q-hint`}
            className={`${input} font-display text-lg`}
          />
          <p id={`${id}-q-hint`} className="mt-2 text-sm text-secondary">
            {copy.questionHint(QUESTION_MAX)}
          </p>
        </div>

        <fieldset className="mt-8">
          <legend className="text-sm">{copy.lengthLegend}</legend>
          <div className="mt-2 inline-flex border border-edge">
            {LIST_LENGTHS.map((n) => (
              <label
                key={n}
                className="relative inline-flex min-h-11 min-w-20 cursor-pointer items-center justify-center border-l border-edge px-4 text-sm first:border-l-0 has-checked:bg-graphite has-checked:text-raised has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-graphite"
              >
                <input type="radio" name={`${id}-len`} value={n} checked={length === n} onChange={() => setLength(n)} className="sr-only" />
                {copy.lengthOption(n)}
              </label>
            ))}
          </div>
        </fieldset>

        {mode === "openrouter" ? (
          <>
            <section aria-labelledby={`${id}-connect`} className="mt-12 max-w-2xl">
              <h2 id={`${id}-connect`} ref={connectHeadingRef} tabIndex={-1} className={h}>
                {copy.connectHeading}
              </h2>
              <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-secondary">{copy.connectBody}</p>
              <a href={copy.privacyHref} rel="noreferrer" className={link}>
                {copy.privacyLink}
              </a>
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                {openrouter.state === "connected" ? (
                  <button type="button" onClick={disconnect} className={link}>
                    {copy.disconnect}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => openrouter.connect({ question, length })}
                    disabled={openrouter.state === "connecting"}
                    className="inline-flex min-h-12 items-center border border-graphite px-6 text-base transition-colors duration-300 hover:bg-graphite hover:text-raised disabled:cursor-wait disabled:opacity-70"
                  >
                    {openrouter.state === "connecting" ? copy.connecting : copy.connectButton}
                  </button>
                )}
                <button type="button" onClick={() => switchMode("keys")} className={link}>
                  {copy.modeKeys}
                </button>
              </div>
              <p aria-live="polite" className="mt-2 min-h-6 text-sm">
                {connectStatus}
              </p>
            </section>

            <section aria-labelledby={`${id}-lanes`} className="mt-10">
              <h2 id={`${id}-lanes`} className={h}>
                {copy.lanesHeading}
              </h2>
              <p className="mt-2 max-w-[62ch] text-sm text-secondary">{copy.lanesHint(MIN_LANES, MAX_LANES)}</p>
              <ul className="mt-4 max-w-2xl border-t border-hairline">
                {lanes.map((l, i) => (
                  <li key={`${l.model}-${i}`} className="flex items-center justify-between gap-4 border-b border-hairline py-2">
                    <span className="min-w-0">
                      <span className="block">{l.label}</span>
                      <span className="block font-mono text-xs break-all text-secondary">{l.model}</span>
                    </span>
                    <button
                      type="button"
                      ref={(el) => {
                        removeRefs.current[i] = el;
                      }}
                      onClick={() => removeLane(i)}
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
                  <button type="button" ref={addRef} onClick={() => setPicking(true)} className={`${link} mt-2`}>
                    {copy.addModel}
                  </button>
                )
              ) : (
                <p ref={fullRef} tabIndex={-1} className="mt-3 text-sm text-secondary outline-none">
                  {copy.lanesFull(MAX_LANES)}
                </p>
              )}
              {picking && lanes.length < MAX_LANES && (
                <ModelPicker
                  taken={new Set(lanes.map((l) => l.model))}
                  onPick={(m) => {
                    setLanes((ls) => (ls.length < MAX_LANES ? [...ls, { label: m.name, transport: "openrouter", model: m.id }] : ls));
                    if (lanes.length + 1 >= MAX_LANES) closePicker();
                  }}
                  onClose={closePicker}
                />
              )}
            </section>
          </>
        ) : (
          <section aria-labelledby={`${id}-keys`} className="mt-12 max-w-2xl">
            <h2 id={`${id}-keys`} ref={keysHeadingRef} tabIndex={-1} className={h}>
              {copy.keysHeading}
            </h2>
            <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-secondary">{copy.keysBody}</p>
            <a href={copy.privacyHref} rel="noreferrer" className={link}>
              {copy.privacyLink}
            </a>
            <div className="mt-4 border-t border-hairline">
              {PROVIDERS.map((p) => (
                <div key={p} className="border-b border-hairline py-4">
                  <label htmlFor={`${id}-k-${p}`} className="text-sm">
                    {copy.keyLabel(p)}
                  </label>
                  <input
                    id={`${id}-k-${p}`}
                    ref={(el) => {
                      keyRefs.current[p] = el;
                    }}
                    {...secretInputProps}
                    defaultValue=""
                    aria-describedby={p === "Perplexity" ? `${id}-k-hint ${id}-k-pplx` : `${id}-k-hint`}
                    className={`${input} font-mono text-sm`}
                  />
                  {p === "Perplexity" && (
                    <p id={`${id}-k-pplx`} className="mt-2 text-sm text-secondary">
                      {copy.perplexityHint}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <p id={`${id}-k-hint`} className="mt-3 text-sm text-secondary">
              {copy.keyHint}
            </p>
            <details className="group mt-4">
              <summary className="-ml-1 inline-flex min-h-11 cursor-pointer list-none items-center gap-2 px-1 text-sm underline underline-offset-[0.25em] [&::-webkit-details-marker]:hidden">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="transition-transform duration-300 group-open:rotate-90">
                  <path d="M4.5 2.5 8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                </svg>
                {copy.providerModelsSummary}
              </summary>
              <p id={`${id}-pm-hint`} className="mt-1 text-sm text-secondary">
                {copy.providerModelHint}
              </p>
              <div className="mt-3 space-y-4">
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
              <button type="button" onClick={() => switchMode("openrouter")} className={link}>
                {copy.modeOpenRouter}
              </button>
            </div>
          </section>
        )}

        <p className="mt-10 max-w-[62ch] text-sm leading-relaxed text-secondary">{copy.whereItGoes}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex min-h-12 items-center bg-graphite px-8 text-base text-raised transition-colors duration-300 hover:bg-ink disabled:cursor-wait disabled:opacity-70"
          >
            {busy ? copy.asking : copy.submit}
          </button>
        </div>
        <div id={`${id}-msg`} aria-live="polite" className="mt-3 min-h-6 text-sm">
          {message && <p className={message.error ? "text-ink" : "text-secondary"}>{message.text}</p>}
        </div>
      </form>

      {run && <Results ref={resultsRef} question={run.question} lanes={run.lanes} status={status} />}
    </>
  );
}
