"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ask as copy } from "@/content";
import { PKCE_STORAGE_KEY, authUrl, challengeFor, exchangeCode, randomToken, readStash } from "@/lib/openrouter";

export type ConnectState = "idle" | "connecting" | "connected" | "failed" | "expired";

/**
 * The OpenRouter connection for this tab. The key lives in this hook's memory and nowhere else.
 * sessionStorage only ever holds the PKCE verifier and state, and only during the redirect.
 */
export function useOpenRouter() {
  const [key, setKey] = useState<string | null>(null);
  const [state, setState] = useState<ConnectState>("idle");
  const handled = useRef(false);

  // Coming back from OpenRouter: trade the one-time code for a key, then scrub the URL.
  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) return;
    const returnedState = params.get("state");
    window.history.replaceState(null, "", window.location.pathname);

    let raw: string | null = null;
    try {
      raw = window.sessionStorage.getItem(PKCE_STORAGE_KEY);
      window.sessionStorage.removeItem(PKCE_STORAGE_KEY);
    } catch {
      raw = null;
    }
    const stash = readStash(raw, Date.now());
    // PKCE already ties the code to this tab's verifier; state is checked too whenever OpenRouter echoes it.
    const valid = stash !== null && (returnedState === null || returnedState === stash.state) && code.length <= 512;

    const finish = async () => {
      await Promise.resolve(); // update state after the effect, not during it
      if (!valid) return setState("expired");
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

  const connect = useCallback(async () => {
    setState("connecting");
    try {
      const verifier = randomToken(48);
      const st = randomToken(16);
      const challenge = await challengeFor(verifier);
      window.sessionStorage.setItem(PKCE_STORAGE_KEY, JSON.stringify({ verifier, state: st, at: Date.now() }));
      window.location.assign(authUrl(`${window.location.origin}${window.location.pathname}`, challenge, st, copy.keyName));
    } catch {
      setState("failed");
    }
  }, []);

  const disconnect = useCallback(() => {
    setKey(null);
    setState("idle");
  }, []);

  return { key, state, connect, disconnect };
}
