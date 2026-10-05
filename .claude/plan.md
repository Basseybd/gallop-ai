# gallop-ai: ask your own (bring your own keys)

Size: large (AI feature handling user keys). Bassey approved the plan on Oct 5 and chose browser-to-provider keys.

## The ask
Let a visitor type a question, paste their own API keys, and see each model's top five side by side, scored with the same agreement math as the saved examples. Make it obvious and verifiable that keys are never saved or sent to Gallop.

## Pages
- `/ask`: question (140 chars max), four masked key fields (any can be blank), a collapsed "Models" control with editable model ids, one privacy line, and the Ask button. Results: four #1 picks, summary sentences, agreement meter, rank grid, and a per-model error line where a call failed.
- `/`: an "Ask your own question" link under the lead question. The header gets "Ask".

## How keys are handled
- Keys live only in React state in the `/ask` tab. Never localStorage, sessionStorage, cookies, URLs or logs. They're gone on refresh, and a "Clear keys" button wipes them.
- Each call goes straight from the browser to the provider host. There's no Gallop API route.
- The CSP `connect-src` allows only `'self'` plus the four provider hosts. No third-party scripts.
- Each call is capped by output tokens and a 30s timeout. One run at a time.
- Model output is parsed into at most five short strings, then rendered as text only.

## Providers
| Model | Host | Default model | Cap |
| --- | --- | --- | --- |
| OpenAI | api.openai.com | gpt-4.1-mini | max_completion_tokens 300 |
| Claude | api.anthropic.com (direct-browser header) | claude-haiku-4-5-20251001 | max_tokens 300 |
| Gemini | generativelanguage.googleapis.com | gemini-3.5-flash-lite | maxOutputTokens 1024 (room for thinking) |
| Perplexity | api.perplexity.ai | sonar | max_tokens 300 |
Perplexity's browser support is unverified. If the browser can't reach it, the error says so plainly.

## Work packages
1. Analysis works with 2 to 4 models, and summary copy is count-aware (me, first).
2. `lib/ask.ts`: provider calls, the parser, error mapping (pure where possible, tested).
3. `/ask` page and the client form, a shared `RankTable` component, home and header links, content.
4. CSP, README, DESIGN.md, CLAUDE.md, security guidance.

## Done means
1. A clean checkout passes lint, typecheck, test and build. Check: fresh copy, CI order.
2. Keys never leave the browser except to their own provider. Check: Playwright with stubbed provider routes records every request on `/ask`. Each key appears only in the request to its own host, and nothing goes to the Gallop origin after load.
3. Keys aren't stored. Check: after a run, localStorage, sessionStorage, cookies and the URL hold no key, and after a reload the fields are empty.
4. With stubbed answers, the results show the right #1 picks, agreement and grid for 2, 3 and 4 models. Check: Playwright plus unit tests.
5. Failures are per model and say how to recover (401, 404 model, 429, network, unparseable). Check: stubbed error responses.
6. Model output can't inject markup. Check: a stub returns `<img src=x onerror=alert(1)>` and the page shows it as text.
7. CSP on every page allows only self plus the four provider hosts in `connect-src`. Check: curl the headers.
8. Every call carries a token cap and a timeout. Check: inspect the stubbed request bodies.
9. No horizontal scroll at 390, 44 px targets, labelled inputs, visible focus, reduced motion. Check: screenshots and sweep.
10. Standing: pre-ship checklist, full council plus red team with nothing critical or high open, lessons updated, screenshots sent.
