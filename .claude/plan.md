# gallop-ai: ask your own (bring your own keys)

Size: large (AI feature handling user keys). Bassey approved the plan on Oct 5 and chose browser-to-provider keys.

## The ask
Let a visitor type a question, paste their own API keys, and see each model's top five side by side, scored with the same agreement math as the saved examples. Make it obvious and verifiable that keys are never saved or sent to Gallop.

## Pages
- `/ask`: question (140 chars max), four masked key fields (any can be blank), a collapsed "Models" control with editable model ids, one privacy line, and the Ask button. Results: four #1 picks, summary sentences, agreement meter, rank grid, and a per-model error line where a call failed.
- `/`: an "Ask your own question" link under the lead question. The header gets "Ask".

## How keys are handled
Superseded by the Oct 5 change below and `.claude/claude-security-guidance.md`, which is the source of truth: keys in memory only, sessionStorage holds only the PKCE stash during the OpenRouter redirect, caps are 400 or 700 tokens (plus 600 for Gemini), and the timeout is 45s.

Perplexity's browser support is unverified. If the browser can't reach it, the error says so plainly.

## Work packages
1. Analysis works with 2 to 4 models, and summary copy is count-aware (me, first).
2. `lib/ask.ts`: provider calls, the parser, error mapping (pure where possible, tested).
3. `/ask` page and the client form, a shared `RankTable` component, home and header links, content.
4. CSP, README, DESIGN.md, CLAUDE.md, security guidance.

## Change on Oct 5, mid-build
Bassey asked for integrations instead of keys, and for every model to be available and customizable. Connect OpenRouter (OAuth PKCE in the browser, key in memory only) is now the main path, with provider keys kept as a fallback. Visitors pick any 2 to 6 OpenRouter models and a top 3, 5 or 10.

## Done means
1. A clean checkout passes lint, typecheck, test and build. Check: fresh copy, CI order.
2. Keys never leave the browser except to their own host. Check: Playwright with stubbed routes records every request. Each provider key and the OpenRouter key appear only in requests to their own host, and nothing carrying a key goes to the Gallop origin.
3. Nothing is stored. Check: after a run, localStorage, sessionStorage, cookies and the URL hold no key; after the OpenRouter return the PKCE stash is gone and the URL has no code; after a reload the fields are empty.
4. Results are right for 2 to 6 lanes, any labels, and lengths 3, 5 and 10. Check: unit tests and Playwright.
5. Failures are per lane and say how to recover (401, 404, 402/429, network, timeout, unparseable). A forged or stale callback is rejected. Check: stubbed errors and a forged `?code=` visit.
6. Model output can't inject markup. Check: a stub returns an `<img onerror>` payload; it renders as text and never runs.
7. CSP: `/ask` uses a per-request nonce with `connect-src` limited to self, openrouter.ai and the four provider hosts. Other pages keep their static policy. Check: curl the headers and look for no CSP violations in the console.
8. Every call carries a token cap and a timeout. Check: inspect the stubbed request bodies and the code.
9. No horizontal scroll at 390, 44 px targets, labelled inputs, visible focus, reduced motion. Check: screenshots and a sweep.
10. Standing: pre-ship checklist, full council plus red team with nothing critical or high open, lessons updated, screenshots sent.
