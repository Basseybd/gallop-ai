"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ask as copy } from "@/content";
import { cleanModel } from "@/lib/ask";
import { fetchCatalog, searchCatalog, type CatalogModel } from "@/lib/openrouter";

const SHOWN = 12;

/** Inline search over OpenRouter's public model list. Loads once, on first open. */
export function ModelPicker({ onPick, onClose, taken }: { onPick: (m: { id: string; name: string }) => void; onClose: () => void; taken: Set<string> }) {
  const id = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  const [catalog, setCatalog] = useState<CatalogModel[] | null | "loading">("loading");
  const [query, setQuery] = useState("");

  useEffect(() => {
    searchRef.current?.focus();
    const controller = new AbortController();
    fetchCatalog(controller.signal).then((c) => {
      if (!controller.signal.aborted) setCatalog(c);
    });
    return () => controller.abort();
  }, []);

  const matches = Array.isArray(catalog) ? searchCatalog(catalog, query, Infinity) : [];
  const results = matches.slice(0, SHOWN);
  const typedId = cleanModel(query);
  const offerTyped =
    typedId !== null && typedId.includes("/") && !taken.has(typedId) && !(Array.isArray(catalog) && catalog.some((m) => m.id === typedId));

  // Keep the visitor in the search box after a pick, so adding several is quick.
  const pick = (m: { id: string; name: string }) => {
    onPick(m);
    searchRef.current?.focus();
  };

  return (
    <div className="mt-2 max-w-2xl">
      <label htmlFor={`${id}-search`} className="text-sm">
        {copy.pickerLabel}
      </label>
      <input
        id={`${id}-search`}
        ref={searchRef}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
        spellCheck={false}
        autoCapitalize="off"
        aria-describedby={`${id}-hint`}
        aria-controls={`${id}-list`}
        className="mt-2 block min-h-12 w-full border border-edge bg-raised px-3 text-base"
      />
      <p id={`${id}-hint`} className="mt-2 text-sm text-secondary">
        {copy.pickerHint}
      </p>

      <div aria-live="polite" className="mt-3 text-sm text-secondary">
        {catalog === "loading" && <p>{copy.pickerLoading}</p>}
        {catalog === null && <p>{copy.pickerFailed}</p>}
        {Array.isArray(catalog) && matches.length === 0 && !offerTyped && <p>{copy.pickerEmpty}</p>}
      </div>

      <ul id={`${id}-list`} className="mt-1">
        {offerTyped && (
          <li>
            <button
              type="button"
              onClick={() => pick({ id: typedId, name: typedId.split("/").pop() ?? typedId })}
              className="flex min-h-11 w-full items-center border-b border-hairline py-2 text-left text-sm underline underline-offset-[0.25em]"
            >
              {copy.pickerUseId(typedId)}
            </button>
          </li>
        )}
        {results.map((m) => {
          const added = taken.has(m.id);
          return (
            <li key={m.id}>
              <button
                type="button"
                disabled={added}
                onClick={() => pick({ id: m.id, name: m.name })}
                className="grid min-h-11 w-full grid-cols-[1fr_auto] items-baseline gap-x-4 border-b border-hairline py-2 text-left transition-colors duration-300 hover:bg-raised disabled:cursor-default disabled:hover:bg-transparent"
              >
                <span className={added ? "text-secondary" : undefined}>
                  <span className="block">{m.name}</span>
                  <span className="block font-mono text-xs break-all text-secondary">{m.id}</span>
                </span>
                <span className={added ? "text-sm text-ink" : "font-mono text-xs text-secondary"}>
                  {added ? copy.pickerAdded : copy.pickerPrice(m.outPerMillion)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {matches.length > SHOWN && <p className="mt-2 text-sm text-secondary">{copy.pickerMore(SHOWN, matches.length)}</p>}
      <button type="button" onClick={onClose} className="-ml-1 mt-3 inline-flex min-h-11 items-center px-1 text-sm underline underline-offset-[0.25em]">
        {copy.pickerClose}
      </button>
    </div>
  );
}
