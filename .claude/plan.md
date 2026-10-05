# gallop-ai: slim modernize

Size: medium (static site, no keys). Bassey chose the slim pass on Oct 5 over the full rebuild with live queries.

## The ask
Make gallop-ai honest, safe and deployable: Next 16 static site from the committed snapshots, framed around how the models disagree, in Bassey's design system, with a real README.

## Pages
- `/`: headline, the most divided question with four #1 picks, all questions sorted by agreement, how it works.
- `/q/[id]`: summary sentences, agreement meter, rank grid, monthly change strips with each change listed.

## Done means
1. `npm ci`, lint, typecheck, test and build pass on Node 24 with no ignored errors. Check: CI.
2. No API routes, no env vars, no model SDKs in the dependency tree. Check: `ls app`, package.json.
3. Agreement and summaries match hand counts. Check: `npm test`.
4. No horizontal scroll at 390 px; touch targets 44 px; visible focus. Check: screenshots and a computed-size sweep.
5. Reduced motion shows the chrome rule still. Check: emulated screenshot.
6. No secrets in history or `.next/static`. Check: gitleaks and bundle grep.
7. README: what it is, live link, screenshot, stack, how it works, env table, run locally. No emoji, em dashes, "production-ready" or placeholders. Check: read and grep.
8. Standing: pre-ship checklist, light council with no confirmed critical or high, lessons updated, screenshots sent.
