// "Connect OpenRouter": OAuth with PKCE, entirely in the browser. No app secret exists, and Gallop's
// server is never involved. OpenRouter returns a key made for this visitor, which the page keeps in
// memory only. See https://openrouter.ai/docs/guides/overview/auth/oauth

import { OPENROUTER_HOST, cleanKey, cleanModel } from "./ask.ts";

/** Holds the PKCE verifier and state across the redirect to OpenRouter and back. Never a key. */
export const PKCE_STORAGE_KEY = "gallop.openrouter.pkce";
const PKCE_MAX_AGE_MS = 10 * 60 * 1000; // OpenRouter codes expire after 10 minutes

const base64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export function randomToken(bytes = 32): string {
  return base64url(crypto.getRandomValues(new Uint8Array(bytes)));
}

export async function challengeFor(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64url(new Uint8Array(digest));
}

export function authUrl(callbackUrl: string, challenge: string, state: string): string {
  const params = new URLSearchParams({
    callback_url: callbackUrl,
    code_challenge: challenge,
    code_challenge_method: "S256",
    state,
    key_label: "Gallop",
  });
  return `${OPENROUTER_HOST}/auth?${params}`;
}

export type PkceStash = { verifier: string; state: string; at: number };

export function readStash(raw: string | null, now: number): PkceStash | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<PkceStash>;
    if (typeof v.verifier !== "string" || typeof v.state !== "string" || typeof v.at !== "number") return null;
    if (now - v.at > PKCE_MAX_AGE_MS || v.at > now) return null;
    return { verifier: v.verifier, state: v.state, at: v.at };
  } catch {
    return null;
  }
}

/** Trade the one-time code for the visitor's key. Returns null on any failure. */
export async function exchangeCode(code: string, verifier: string): Promise<string | null> {
  try {
    const res = await fetch(`${OPENROUTER_HOST}/api/v1/auth/keys`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code, code_verifier: verifier, code_challenge_method: "S256" }),
      credentials: "omit",
      referrerPolicy: "no-referrer",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = (await res.json().catch(() => null)) as { key?: unknown } | null;
    return typeof body?.key === "string" ? cleanKey(body.key) : null;
  } catch {
    return null;
  }
}

export type CatalogModel = { id: string; name: string; outPerMillion: number | null; inPerMillion: number | null };

/** OpenRouter's public model list (no key needed), trimmed to text models with sane ids. */
export function parseCatalog(body: unknown): CatalogModel[] {
  const data = (body as { data?: unknown })?.data;
  if (!Array.isArray(data)) return [];
  const out: CatalogModel[] = [];
  for (const m of data) {
    const id = typeof m?.id === "string" ? cleanModel(m.id) : null;
    if (!id || !id.includes("/")) continue;
    const outputs = m?.architecture?.output_modalities;
    if (Array.isArray(outputs) && !outputs.includes("text")) continue;
    const perM = (v: unknown) => {
      const x = typeof v === "string" || typeof v === "number" ? Number(v) : NaN;
      return Number.isFinite(x) && x >= 0 ? Math.round(x * 1_000_000 * 100) / 100 : null;
    };
    const rawName = typeof m?.name === "string" ? m.name : id;
    // "Anthropic: Claude Haiku 4.5" reads better as just the model name.
    const name = rawName.replace(/^[^:]{1,40}:\s*/, "").slice(0, 60).trim() || id;
    out.push({ id, name, inPerMillion: perM(m?.pricing?.prompt), outPerMillion: perM(m?.pricing?.completion) });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchCatalog(signal?: AbortSignal): Promise<CatalogModel[] | null> {
  try {
    const res = await fetch(`${OPENROUTER_HOST}/api/v1/models`, { signal, credentials: "omit", referrerPolicy: "no-referrer" });
    if (!res.ok) return null;
    return parseCatalog(await res.json());
  } catch {
    return null;
  }
}

/** Case-insensitive match on name or id, every word must hit. */
export function searchCatalog(models: CatalogModel[], query: string, limit = 40): CatalogModel[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const hits = words.length ? models.filter((m) => words.every((w) => `${m.name} ${m.id}`.toLowerCase().includes(w))) : models;
  return hits.slice(0, limit);
}
