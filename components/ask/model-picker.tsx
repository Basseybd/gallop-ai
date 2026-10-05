"use client";

import { useEffect, useId, useState } from "react";
import { ask as copy } from "@/content";
import { cleanModel } from "@/lib/ask";
import { fetchCatalog, searchCatalog, type CatalogModel } from "@/lib/openrouter";

/** Inline search over OpenRouter's public model list. Loads once, on first open. */
export function ModelPicker({ onPick, onClose, taken }: { onPick: (m: { id: string; name: string }) => void; onClose: () => void; taken: Set<string> }) {
  const id = useId();
  const [catalog, setCatalog] = useState<CatalogModel[] | null | "loading">("loading");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetchCatalog(controller.signal).then((c) => {
      if (!controller.signal.aborted) setCatalog(c);
    });
    return () => controller.abort();
  }, []);

  const results = Array.isArray(catalog) ? searchCatalog(catalog, query) : [];
  const typedId = cleanModel(query);
  const offerTyped = typedId && typedId.includes("/") && !(Array.isArray(catalog) && catalog.some((m) => m.id === typedId));

  return (
    <div className="mt-4 border-t border-hairline pt-4">
      <label htmlFor={`${id}-search`} className="text-sm">
        {copy.pickerLabel}
      </label>
      <input
        id={`${id}-search`}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
        spellCheck={false}
        autoCapitalize="off"
        aria-describedby={`${id}-hint`}
        aria-controls={`${id}-list`}
        autoFocus
        className="mt-2 block min-h-12 w-full max-w-xl border border-hairline bg-raised px-3 text-base"
      />
      <p id={`${id}-hint`} className="mt-2 text-sm text-secondary">
        {copy.pickerHint}
      </p>

      <div aria-live="polite" className="mt-3 text-sm text-secondary">
        {catalog === "loading" && <p>{copy.pickerLoading}</p>}
        {catalog === null && <p>{copy.pickerFailed}</p>}
        {Array.isArray(catalog) && results.length === 0 && !offerTyped && <p>{copy.pickerEmpty}</p>}
      </div>

      <ul id={`${id}-list`} className="mt-1 max-h-80 overflow-y-auto overscroll-contain">
        {offerTyped && (
          <li>
            <button
              type="button"
              onClick={() => onPick({ id: typedId, name: typedId.split("/").pop() ?? typedId })}
              className="flex min-h-11 w-full items-center border-b border-hairline py-2 text-left text-sm underline underline-offset-[0.25em]"
            >
              {copy.pickerUseId(typedId)}
            </button>
          </li>
        )}
        {results.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              disabled={taken.has(m.id)}
              onClick={() => onPick({ id: m.id, name: m.name })}
              className="grid min-h-11 w-full grid-cols-[1fr_auto] items-baseline gap-x-4 border-b border-hairline py-2 text-left transition-colors duration-300 hover:bg-raised disabled:opacity-50"
            >
              <span>
                <span className="block">{m.name}</span>
                <span className="block font-mono text-xs break-all text-secondary">{m.id}</span>
              </span>
              <span className="font-mono text-xs text-secondary">{copy.pickerPrice(m.outPerMillion)}</span>
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={onClose} className="mt-3 inline-flex min-h-11 items-center px-1 text-sm underline underline-offset-[0.25em]">
        {copy.pickerClose}
      </button>
    </div>
  );
}
