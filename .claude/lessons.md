# Lessons

Each lesson is a rule for the next round. Format: rule, why, lane, where caught, count. Lessons caught twice sit at the top and are proposed for the skills.

## Caught twice (proposed for the skills)
- **Sentence templates and labels are copy too.** Generated sentences, default names, duplicate-label formats and any string a visitor sees take their words from content.ts as an argument, so pure functions stay testable. Why: strings in lib/ escape the one-content-file rule. Lane: copy. Caught: gallop-ai council Oct 5 (summary sentences), again Oct 5 /ask council (default lane names, key label). Count: 2.
- **Every page that sets `openGraph` or `twitter` repeats the image, url and site name, and every new page sets its own.** Check the rendered meta tags after any metadata change. Why: question pages lost their preview image, then /ask shared as the home page. Lane: copy, build. Caught: gallop-ai verifier Oct 5, again /ask council Oct 5. Count: 2.
- **Every link exists before the PR, including links in the UI.** Commit the screenshot, add the live link only after the first deploy, and never point at a file that only exists on the branch. Why: a broken README image, then a privacy link to `blob/main/lib/ask.ts` that 404'd until merge. Lane: copy. Caught: gallop-ai council Oct 5, again /ask council Oct 5. Count: 2.

## Security and privacy
- **Every path gets a CSP. A per-route policy replaces the static one, it never leaves a gap.** Put the static policy on `/(.*)`, let the proxy replace it on the exact sensitive path, and never skip the proxy for prefetch headers. Test the path with `purpose: prefetch`, a different case and a trailing slash. Why: `/ask` served with no CSP on prefetch, and `/ASK` with none at all. Lane: security. Caught: /ask council, Oct 5 2026. Count: 1.
- **Secret inputs are uncontrolled.** Read them from a ref on submit. Why: React mirrors a controlled input's value into the DOM `value` attribute, so a key showed up in the page HTML. Lane: security. Caught: /ask council, Oct 5 2026. Count: 1.
- **Lookups keyed by model output or visitor labels use `Object.hasOwn` or a null-prototype object.** Why: an answer of `constructor` or a label of `__proto__` crashed the page and dropped the visitor's connection. Lane: build, security. Caught: /ask verifier, Oct 6 2026. Count: 1.
- **A privacy claim says who doesn't save it.** "Gallop saves nothing" is true. "Nothing is saved" isn't, once OpenRouter or a provider is involved, and "Disconnect" doesn't revoke a key that lives on another service. Say where the visitor's input goes. Why: the first /ask copy overclaimed on both. Lane: privacy, copy. Caught: /ask council, Oct 5 2026. Count: 1.
- **Browser-side calls carrying a key set `redirect: "error"`, `credentials: "omit"`, `referrerPolicy: "no-referrer"`, a timeout and a token cap.** Why: a custom key header can follow a redirect to another host, and every call must be bounded. Lane: security. Caught: /ask red team, Oct 5 2026. Count: 1.

## Build and correctness
- **Merge Dependabot majors only after their CI passes, and pin tooling majors the lint stack doesn't support yet.** Why: TypeScript 7 and ESLint 10 landed on Oct 6 and broke CI on main for every later PR. Lane: build. Caught: Oct 6 2026. Count: 1.
- **Run the gates on a clean checkout before calling CI green.** Typecheck runs `next typegen` first, because `PageProps` comes from generated types that only exist after a build. Why: it passed locally on a stale `.next` and would have failed in CI. Lane: build. Caught: gallop-ai verifier, Oct 5 2026. Count: 1.
- **Every path that aborts work also resets the UI that was waiting on it.** Why: Clear keys and Disconnect mid-run left the form stuck on "Asking" until a reload. Lane: build. Caught: /ask council, Oct 5 2026. Count: 1.
- **Parse model output against the formats models actually use.** Cover `**Name**: description`, headings, nested items, `<think>` blocks and a cap hit with no text. Report a cap hit as its own error. Why: descriptions leaked into names and broke the agreement math, and reasoning models burned the cap and showed "reword your question". Lane: build. Caught: /ask council, Oct 5 2026. Count: 1.
- **When a plan changes mid-build, rewrite or strike the old sections that day.** Why: plan.md said 300 tokens, 30s and "never sessionStorage" after the OpenRouter change made all three wrong. Lane: process. Caught: /ask council, Oct 5 2026. Count: 1.

## Copy
- **Describe data by how it was collected, not by its labels.** Check git history and the generator before calling something monthly or over time. Why: month labels in a one-batch snapshot read as observations and overclaim. Lane: copy. Caught: gallop-ai council, Oct 5 2026. Count: 1.
- **Generalize only as far as the data goes.** Check each framing claim ("on taste they disagree", "any model works", "well under a cent") against every case before using it. Why: one counterexample makes the headline wrong. Lane: copy. Caught: gallop-ai council Oct 5; the cost and "any model" claims on /ask were the same miss. Count: 1.
- **Check the title template against titles that end in punctuation.** Why: "%s. Site" turns questions into "?.". Lane: copy. Caught: gallop-ai council, Oct 5 2026. Count: 1.

## Design
- **Hover wakes things up; it never fades ink to secondary.** Use an ink underline or a darker hairline. Why: lighter on hover reads as disabled. Lane: design. Caught: gallop-ai council, Oct 5 2026. Count: 1.
- **Chrome on a pale ground needs a dark edge.** Show the full gradient at rest with a 1px bezel. Why: the bright stops vanish into #E3E4E2 and the rule reads as broken. Lane: design. Caught: gallop-ai council, Oct 5 2026. Count: 1.
- **Data marks stay lighter than the headline.** Use thin ticks on a baseline, not solid blocks. Why: a barcode row outweighed the H1. Lane: design. Caught: gallop-ai council, Oct 5 2026. Count: 1.
- **Forms in his system are hairline rows, not grids of boxes.** One column at the content width, labels above, one solid button. No status dots. Why: own-keys mode read as a SaaS settings panel. Lane: design. Caught: /ask council, Oct 5 2026. Count: 1.
- **A repeated layout reuses the same markup.** Why: the /ask results lead used gaps and floating rules instead of the home lead's hairlines. Lane: design. Caught: /ask council, Oct 5 2026. Count: 1.

## Mobile and accessibility
- **The proof goes on the first phone screen, checked at 390 x 664 (in-app browser), not just 844.** Why: the four picks sat below the fold for Instagram visitors. Lane: design, mobile. Caught: gallop-ai council, Oct 5 2026. Count: 1.
- **Tables with more than four columns keep a minimum width and scroll inside a labelled region.** Why: six columns squeezed into wrapped headers at 390. Lane: mobile. Caught: /ask council, Oct 5 2026. Count: 1.
- **When the focused element goes away, move focus somewhere that makes sense.** Remove moves to the next remove, close returns to its opener, a mode switch goes to the new heading. Announce async results in a live region. Why: focus fell to the body after five common actions, and lane results were silent. Lane: accessibility. Caught: /ask council, Oct 5 2026. Count: 1.
- **A meter inside a link is aria-hidden when a visible label says the same thing.** Why: its bare value joins the link's accessible name. Lane: accessibility. Caught: gallop-ai council, Oct 5 2026. Count: 1.
- **The reduced-motion block turns off every transition, and focus rings never fade in.** Why: hover and chevron transitions kept moving, and `transition-colors` faded the focus ring in over 300 ms. Lane: accessibility. Caught: gallop-ai council Oct 5, /ask council Oct 5. Count: 1.

## Accepted exceptions
- Static pages use `'unsafe-inline'` scripts instead of a nonce, because they take no input and nonces would force per-request rendering. `/ask` takes keys, so `proxy.ts` replaces that policy there with a nonce policy.
- The dev-only `braces` advisory (via eslint-config-next) has no patched release. CI audits production dependencies only. Remove this once Dependabot brings a fix.
- The OpenRouter one-time `?code=` reaches Gallop's request log before the URL is scrubbed. It is single use and useless without the verifier.
- `TRACE /ask` returns 500 locally. Vercel's edge should reject the method; recheck on the preview.
