# Handoff: gallop-ai "Ask your own" (branch `ask`)

Last updated Oct 6, 2026. Read this first, then `.claude/plan.md`, `.claude/claude-security-guidance.md` and `.claude/lessons.md`.

## Where it stands
- Branch `ask` is pushed to GitHub. There's no PR yet; open one when the list below is done.
- Live site: https://gallop-ai-eight.vercel.app. `main` has the static site (PR #3) and the URL fix (PR #10).
- Lint, typecheck, 29 tests and the build all pass. The `/ask` browser check (`.claude/checks/ask-e2e.py`) passed 28 of 28 before the first fix round. Rerun it.

## What /ask is (decided with Bassey, Oct 5)
- Visitors compare any 2 to 6 models on one question, top 3, 5 or 10.
- **Main path:** Connect OpenRouter (OAuth PKCE in the browser, `lib/openrouter.ts`, `components/ask/use-openrouter.ts`). The key lives in React state only. Reload means reconnect. Bassey chose memory only over keeping it for the tab.
- **Fallback:** paste provider keys (OpenAI, Anthropic, Gemini, Perplexity).
- **No Gallop API route.** Every request goes browser to provider (`lib/ask.ts`). Bassey's own bill can't grow.
- **CSP:** `proxy.ts` gives `/ask` a per-request nonce CSP. `connect-src` is limited to `ASK_HOSTS`. `next.config.ts` sets the static CSP on every path, and the proxy replaces it on the exact `/ask`.
- **Not used:** "Sign in with ChatGPT" is a partner trial. Anthropic, Google and Perplexity have no third-party OAuth for API billing.

## Council round 1 (full council, 8 lanes): fixed already (commit 8f09fd2)
- `/ask` served with no CSP on prefetch headers, and `/ASK` with no CSP. Fixed: the static CSP covers everything and the proxy acts only on the exact `/ask`.
- Clear keys or Disconnect mid-run left the form stuck.
- The parser kept `**Name**: description`. It also now handles headings, nested items, `<think>` blocks and unpaired `**`.
- Reasoning models ate the cap. OpenRouter lanes now send `reasoning: { effort: "low", exclude: true }`, Gemini lanes get +600, and a cap hit returns the `cap` error.
- `redirect: "error"` on every fetch. Timeouts on the OAuth exchange and the catalog.
- `uniqueLabels` collisions. Default lane names and the OpenRouter key label moved to `content.ts`.

## Still to do (from the council reports)
**Security and privacy**
- [ ] Key inputs are controlled, so React writes keys into the DOM `value` attribute. Make them uncontrolled (refs).
- [ ] Add `Cross-Origin-Opener-Policy: same-origin` on `/ask` in `proxy.ts`, so an opener can't drive the tab during the OAuth hop. The `state` check stays lenient because it's unverified whether OpenRouter echoes it. Document that.
- [ ] Guard against a double submit with an in-flight ref set at the top of `onSubmit`.
- [ ] On mount, remove an expired PKCE stash when there's no `code`.
- [ ] Restore the question and length after the OpenRouter redirect. The stash already supports `question` and `length`; wire it in `connect()` and the return path.
- [ ] Reset `connecting` on `pageshow` with `persisted` (back button from OpenRouter).
- [ ] The picker's "Use <id>" option ignores `taken`. Show an "Added" label on taken rows.
- [ ] `results.tsx`: build `lists` with `Object.create(null)`, so an id like `x/__proto__` can't break it.
- [ ] Record as accepted: the one-time `?code=` reaches Gallop's request log. It's useless without the verifier.

**Copy (lesson: sentence templates and openGraph regressed, both high)**
- [ ] Give `/ask` its own `openGraph` and `twitter` metadata (title, description, url, image).
- [ ] Add a line saying the question goes to OpenRouter or the provider and on to each model's company, under their policies, and that free models may keep prompts.
- [ ] Reword connect, disconnect and keys so Gallop saves nothing, the key stays on their OpenRouter account until they delete it, and Disconnect only forgets it here. Merge `connectBody` and `connectNote` into one short line.
- [ ] Remove "set a credit limit when you connect", which isn't in OpenRouter's docs.
- [ ] `pickerClose` should read "Close search". Add recovery to `badModel` and `lanesFull`. Change the lanes hint to "any text model". Add a Perplexity hint in keys mode. Prices as `$0.40`.
- [ ] Point `privacyHref` at the README "How it works" anchor, not `blob/main/lib/ask.ts`.
- [ ] Past 4 lanes, collapse the summary sentence ("Two of six put X first. The other four all differ.").
- [ ] README:
  - "Every page is prerendered" is wrong now.
  - Mention the Gemini +600 cap.
  - Cost: "about a cent on the default models, more for bigger ones".
  - Add the code-in-logs note.
- [ ] CLAUDE.md line 3 still says "static". Add back the rule that server-side model calls need rate limits, a cap, a timeout, a kill switch and a spend cap.
- [ ] Update the stale sections of `plan.md` (30s and 300 tokens become 45s and 400/700; sessionStorage now holds the PKCE stash). Update the threat model with the Gemini cap and the accepted items.

**Design and accessibility**
- [ ] Six-column rank table on phones: when there are more than 4 models, give it a min width so it scrolls inside its own region. Make the wrapper `role="region"` with a label and `tabIndex=0`.
- [ ] The results lead should match the home lead markup (vertical hairlines, one shared bottom rule).
- [ ] Keys mode: a single `max-w-2xl` column of hairline rows, not two 2x2 grids of boxes.
- [ ] Picker:
  - Drop `max-h-80` and the top border.
  - Cap at 12 results with "keep typing".
  - After a pick, keep focus in the search field.
- [ ] Focus management on Done, on remove, on mode switch and after connect. Give the results a polite status line ("4 of 6 answered", "None answered").
- [ ] Set `aria-invalid` on the question field and focus it when it's invalid.
- [ ] Put `-ml-1` in the shared link class. Drop the chrome dot (it reads as a SaaS status dot). Give the header "Ask" link `min-w-11`.
- [ ] Turn off the focus-ring transition. Use a darker input border, a new `edge` token `#8D9398`, recorded in DESIGN.md.

**Process**
- [ ] Rerun `.claude/checks/ask-e2e.py`. Its selectors may need updating after the copy changes.
- [ ] The red team couldn't run its browser scenarios. The verifier must cover them:
  - exfiltration via crafted catalog or chat responses
  - CSP blocking of an inline script and other hosts
  - storage after every flow
  - the forged-callback cases
- [ ] Run a fresh verifier on the fixed diff. Update `lessons.md`; the new lessons are in the council reports above. Open the PR with the council report, screenshots at 1440 and 390, and no Claude attribution.

## Needs Bassey
- Test Connect OpenRouter for real on the Vercel preview. The sandbox can't reach openrouter.ai.
- Check whether Perplexity's API allows browser calls (paste a key in keys mode on the preview).
- Once merged, the About box and pin are still open from before.

## Working notes
- Commits as Bassey Duke <bassey.bd@gmail.com>, with no Claude attribution anywhere (his stored preference).
- The workspace's network filter blocks openrouter.ai, openai, google and perplexity from the shell. A 403 with a 71-byte body is the filter, not the provider.
- GitHub is REST only (`gh api`). GraphQL and repo settings are blocked.
- The Vercel MCP returns 403 on his `basseybds-projects` team. He does Vercel himself.
