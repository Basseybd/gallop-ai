# Handoff: gallop-ai "Ask your own" (branch `ask`)

Last updated Oct 6, 2026. Read this first, then `.claude/plan.md`, `.claude/claude-security-guidance.md` and `.claude/lessons.md`.

## Where it stands
- Branch `ask` is pushed. PR #11 is open against `main` with the full council report: https://github.com/Basseybd/gallop-ai/pull/11
- Live site: https://gallop-ai-eight.vercel.app. `main` has the static site (PR #3) and the URL fix (PR #10).
- Lint, typecheck, 31 unit tests and the build pass on a clean checkout. `.claude/checks/ask-e2e.py` passes 41 of 41 against a local production build.
- Two council rounds are done: a full council of 8 lanes, then a verifier with the red team's browser scenarios. Everything from both is fixed or recorded as accepted in `.claude/claude-security-guidance.md` and `.claude/lessons.md`.

## What /ask is (decided with Bassey, Oct 5)
- Visitors compare any 2 to 6 models on one question, top 3, 5 or 10.
- **Main path:** Connect OpenRouter (OAuth PKCE in the browser, `lib/openrouter.ts`, `components/ask/use-openrouter.ts`). The key lives in React state only. Reload means reconnect. Bassey chose memory only over keeping it for the tab.
- **Fallback:** paste provider keys (OpenAI, Anthropic, Gemini, Perplexity).
- **No Gallop API route.** Every request goes browser to provider (`lib/ask.ts`). Bassey's own bill can't grow.
- **CSP:** `proxy.ts` gives `/ask` a per-request nonce CSP. `connect-src` is limited to `ASK_HOSTS`. `next.config.ts` sets the static CSP on every path, and the proxy replaces it on the exact `/ask`.
- **Not used:** "Sign in with ChatGPT" is a partner trial. Anthropic, Google and Perplexity have no third-party OAuth for API billing.

## Review history
- **Round 1 (full council, 8 lanes):** CSP gaps on prefetch and `/ASK`, a stuck form, parser misses, reasoning models eating the cap, keys mirrored into the DOM, overclaiming privacy copy, the six-column table on phones, focus management, and copy and metadata regressions. All fixed in 8f09fd2 and 2172d79.
- **Round 2 (verifier plus red team in a real browser):** keys only ever went to their own host, CSP and COOP held, one request per lane, nothing stored. It found one crash: answers or labels named like `constructor` or `__proto__`. Fixed with `Object.hasOwn`, and a browser check was added. A cancelled OpenRouter connect now says so.
- **Open, low:** `TRACE /ask` returns 500 locally; recheck on the Vercel preview. CI actions are still pinned to tags, not SHAs.

## Needs Bassey
- Test Connect OpenRouter for real on the Vercel preview. The sandbox can't reach openrouter.ai.
- Check whether Perplexity's API allows browser calls (paste a key in keys mode on the preview).
- Once merged, the About box and pin are still open from before.

## Working notes
- Commits as Bassey Duke <bassey.bd@gmail.com>, with no Claude attribution anywhere (his stored preference).
- The workspace's network filter blocks openrouter.ai, openai, google and perplexity from the shell. A 403 with a 71-byte body is the filter, not the provider.
- GitHub is REST only (`gh api`). GraphQL and repo settings are blocked.
- The Vercel MCP returns 403 on his `basseybds-projects` team. He does Vercel himself.
