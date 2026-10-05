@AGENTS.md

# gallop-ai

A static Next.js 16 site comparing how OpenAI, Claude, Gemini and Perplexity rank the same questions. See README.md for how it works and DESIGN.md for the visual system.

## Rules
- Read `node_modules/next/dist/docs/` before writing Next code. Next 16 has breaking changes (async `params`, `PageProps`, `proxy` instead of `middleware`).
- All copy, links and name aliases live in `content.ts`. Snapshot data lives in `data/`. Never hard-code either in components.
- Analysis stays in `lib/analysis.ts` as pure functions with tests. Run `npm test` after changing it.
- `lib/snapshots.ts` is `server-only`. Every page is static except `/ask`, which is dynamic only for its CSP nonce (`proxy.ts`).
- `/ask` runs in the browser on the visitor's own OpenRouter account or keys. Never add a Gallop API route that sees a key. Keys stay in React state only: no storage, cookies, URLs or logs. Every call keeps its token cap and timeout. Model output renders as text only.
- New provider hosts go in `ASK_HOSTS` in `lib/ask.ts`, which feeds the `/ask` CSP. Read `.claude/claude-security-guidance.md` before touching `/ask`.
- No em dashes anywhere, no emoji, sentence case.
- Before a PR: `npm run lint && npm run typecheck && npm test && npm run build`.
