@AGENTS.md

# gallop-ai

A static Next.js 16 site comparing how OpenAI, Claude, Gemini and Perplexity rank the same questions. See README.md for how it works and DESIGN.md for the visual system.

## Rules
- Read `node_modules/next/dist/docs/` before writing Next code. Next 16 has breaking changes (async `params`, `PageProps`, `proxy` instead of `middleware`).
- All copy, links and name aliases live in `content.ts`. Snapshot data lives in `data/`. Never hard-code either in components.
- Analysis stays in `lib/analysis.ts` as pure functions with tests. Run `npm test` after changing it.
- `lib/snapshots.ts` is `server-only`. Pages stay static: no API routes, no client data fetching.
- If a live model feature is ever added, it must run server side with rate limits, `maxOutputTokens`, a timeout, a kill switch, and a provider spend cap. Keys never use `NEXT_PUBLIC_`.
- No em dashes anywhere, no emoji, sentence case.
- Before a PR: `npm run lint && npm run typecheck && npm test && npm run build`.
