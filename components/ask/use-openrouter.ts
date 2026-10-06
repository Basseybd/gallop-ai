"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ask as copy } from "@/content";
import { PKCE_STORAGE_KEY, authUrl, challengeFor, exchangeCode, randomToken, readStash } from "@/lib/openrouter";

export type ConnectState = "idle" | "connecting" | "connected" | "failed" | "expired";
/** What the form had before the redirect, so the visitor doesn't retype it. Never a key. */
export type Carried = { question?: string; length?: number };

const takeStash = (): string | null => {
  try {
    const raw = window.sessionStorage.getItem(PKCE_STORAGE_KEY);
    window.sessionStorage.removeItem(PKCE_STORAGE_KEY);
    return raw;
  } catch {
    return null;
  }
};

/**
 * The OpenRouter connection for this tab. The key lives in this hook's memory and nowhere else.
 * sessionStorage only ever holds the PKCE verifier, state, question and list length, and only
 * during the redirect.
 */
export function useOpenRouter() {
  const [key, setKey] = useState<string | null>(null);
  const [state, setState] = useState<ConnectState>("idle");
  const [carried, setCarried] = useState<Carried | null>(null);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const returnedState = params.get("state");
    if (params.has("code") || params.has("state") || params.has("error")) {
      window.history.replaceState(null, "", window.location.pathname);
    }

    if (params.has("error") && !code) {
      // The visitor cancelled on OpenRouter, or it refused. Say so and drop the stash.
      const stash = readStash(takeStash(), Date.now());
      const fail = async () => {
        await Promise.resolve();
        if (stash) setCarried({ question: stash.question, length: stash.length });
        setState("failed");
      };
      void fail();
      return;
    }

    if (!code) {
      // An abandoned connect (back button, or OpenRouter sent an error) leaves a stash behind. Drop it.
      const stale = takeStash();
      if (stale === null) return;
      const stash = readStash(stale, Date.now());
      const restore = async () => {
        await Promise.resolve();
        if (stash) setCarried({ question: stash.question, length: stash.length });
      };
      void restore();
      return;
    }

    const stash = readStash(takeStash(), Date.now());
    // PKCE ties the code to this tab's verifier. State is checked whenever OpenRouter echoes it.
    // The page also sends Cross-Origin-Opener-Policy, so another window can't drive this tab mid-flow.
    const valid = stash !== null && (returnedState === null || returnedState === stash.state) && code.length <= 512;

    const finish = async () => {
      await Promise.resolve(); // update state after the effect, not during it
      if (!valid) return setState("expired");
      setCarried({ question: stash.question, length: stash.length });
      setState("connecting");
      const k = await exchangeCode(code, stash.verifier);
      if (k) {
        setKey(k);
        setState("connected");
      } else {
        setState("failed");
      }
    };
    void finish();
  }, []);

  // Coming back with the back button restores the page from cache mid-"connecting". Reset it.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) setState((s) => (s === "connecting" ? "idle" : s));
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  const connect = useCallback(async (keep: Carried) => {
    setState("connecting");
    try {
      const verifier = randomToken(48);
      const st = randomToken(16);
      const challenge = await challengeFor(verifier);
      const stash = { verifier, state: st, at: Date.now(), question: keep.question?.slice(0, 200), length: keep.length };
      window.sessionStorage.setItem(PKCE_STORAGE_KEY, JSON.stringify(stash));
      window.location.assign(authUrl(`${window.location.origin}${window.location.pathname}`, challenge, st, copy.keyName));
    } catch {
      setState("failed");
    }
  }, []);

  const disconnect = useCallback(() => {
    setKey(null);
    setState("idle");
  }, []);

  return { key, state, carried, connect, disconnect };
}
