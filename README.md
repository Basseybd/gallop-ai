# Gallop

Ask four AIs the same question and they don't agree. Gallop puts OpenAI, Claude, Gemini and Perplexity side by side on the same questions, lines up each one's top five, and shows where they overlap and where they split. On big names like cloud providers they nearly match. On local spots, like burgers in San Francisco, they barely overlap.

You can also ask your own question at `/ask`. Connect your OpenRouter account in one click, or paste your own provider keys, pick any two to six models, and compare their top 3, 5 or 10.

Live at [gallop-ai-eight.vercel.app](https://gallop-ai-eight.vercel.app).

![Gallop home page](docs/screenshot.png)

## About the data

The snapshots in `data/` come from the first prototype of this project. They were committed in one batch in August 2025, with a top five per model, per question, labeled by month from Jul 2024 to Jul 2025. The prompts, model versions and how each month was produced weren't recorded, so treat it as a sample, not a study, and the month labels as labels, not capture dates. Most lists barely move from one label to the next, which is why the site leads with how the models differ from each other. Nobody checked whether any answer is right.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, zod. Fonts are self-hosted with `next/font/local` (Shippori Mincho, Zen Kaku Gothic New, Fragment Mono). Deployed on Vercel. No database, no backend API, and no keys of Gallop's own. Every page is static except `/ask`, which renders per request only so it can carry a fresh CSP nonce.

## How it works

- **Snapshots are the source of truth.** Each model's answers live in `data/<model>.json`, one top five per question per month. At build time `lib/snapshots.ts` validates every file with zod, checks the four models cover the same questions and months, and fails the build if they don't.
- **Agreement is measured, not eyeballed.** For each question, Gallop takes the latest top five from each model and averages the overlap (Jaccard) across all six model pairs. Same five in any order is 1, nothing shared is 0. The home page sorts questions from least to most agreement.
- **Spelling variants are merged first.** Models write "Blue Bottle" and "Blue Bottle Coffee" for the same place. A small alias table in `content.ts` maps variants to one name so overlap isn't understated. It's explicit and reviewable rather than fuzzy matching.
- **Shifts are computed between saved months.** A month counts as a change when the normalized top five differs from the one before, and the change list says what came in and what dropped. That drives the tick strips and the "Show each change" lists.
- **All the analysis is pure functions** in `lib/analysis.ts`. The sentence wording comes from `content.ts` as an argument, so every word on the site lives in one file. They're tested with Node's built-in test runner against hand-counted cases.
- **The saved questions are prerendered.** Question pages come from `generateStaticParams` with `dynamicParams = false`, so unknown ids 404 instead of rendering on demand. Only `/ask` renders per request, and only for its CSP nonce.
- **Ask your own runs entirely in the browser.** `/ask` sends each request straight from the visitor's browser to OpenRouter or to the provider (OpenAI, Anthropic, Google, Perplexity). Gallop has no API route, so its server never sees a key or a question. Keys live in React state only, never in storage, cookies or the URL, and they're gone on reload. Request building, parsing and error mapping are pure functions in `lib/ask.ts`, tested to prove each key goes to its own host in exactly one header.
- **Connect OpenRouter is OAuth with PKCE, no secret.** `lib/openrouter.ts` creates a verifier, sends its SHA-256 challenge to OpenRouter, and trades the returned code for a key made for that visitor. Only the verifier, state, question and list length sit in sessionStorage, for the length of the redirect, and they're deleted on return (or on the next visit if the connect was abandoned). The callback URL is scrubbed as soon as the page loads. The one-time code does reach Gallop's request log on the way in, but it only works with the verifier, which never leaves the tab. `/ask` also sends `Cross-Origin-Opener-Policy: same-origin`, so no other window can steer the tab mid-connect.
- **Any model, any length.** The model picker searches OpenRouter's public model list. The comparison math in `lib/analysis.ts` works on any set of labels, so two Claude models side by side is fine, and lists can be 3, 5 or 10 long.
- **Every call is bounded.** Output is capped at 400 tokens (700 for a top 10), plus 600 for Gemini models, which can spend tokens thinking. OpenRouter lanes ask for low, hidden reasoning. Each call times out at 45 seconds, never follows a redirect, and one run happens at a time. On the default models a run costs about a cent; bigger models cost more, and the picker shows each one's price. Answers are parsed into short plain strings and rendered as text, never HTML. Key fields are uncontrolled inputs, so a key never lands in the page's HTML.
- **`/ask` has its own CSP.** `proxy.ts` gives it a per-request nonce with `'strict-dynamic'`, so no inline script runs without the nonce, and `connect-src` allows only Gallop, OpenRouter and the four provider hosts. It also sends `Referrer-Policy: no-referrer` and `Cache-Control: no-store`.
- **Security headers** (CSP, HSTS, frame denial, nosniff, referrer and permissions policies) are set in `next.config.ts`. Production source maps are off.

## Environment variables

None. The site builds and runs from the committed snapshots, and `/ask` runs on the visitor's own OpenRouter account or keys.

## Run locally

Requires Node 24.

```bash
npm ci
npm run dev        # http://localhost:3000
npm test           # analysis and ask tests
npm run lint
npm run typecheck
npm run build
```

## Project layout

```
app/              pages, layout, fonts, Open Graph image, icon
components/       agreement meter, rank table, ask form and model picker
proxy.ts          nonce CSP for /ask
content.ts        all site copy, links and name aliases
data/             model snapshots, one file per model
lib/analysis.ts   overlap, rank grid, change detection (pure, tested)
lib/snapshots.ts  loads and validates data at build time
lib/ask.ts        browser-side requests, parsing, error mapping (pure, tested)
lib/openrouter.ts Connect OpenRouter (PKCE) and the model catalog
```

## License

MIT
