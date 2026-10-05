# Lessons

Each lesson is a rule for the next round. Format: rule, why, lane, where caught, count.

- **Describe data by how it was collected, not by its labels.** Check git history and the generator before calling something monthly or over time. Why: month labels in a one-batch snapshot read as observations and overclaim. Lane: copy. Caught: gallop-ai council, Oct 5 2026. Count: 1.
- **Generalize only as far as the data goes.** Check each framing claim ("on taste they disagree") against every question before using it. Why: one counterexample (design tools, taste, high agreement) makes the headline wrong. Lane: copy. Caught: gallop-ai council, Oct 5 2026. Count: 1.
- **Sentence templates are copy too.** Generated sentences take their words from content.ts as an argument, so pure functions stay testable. Why: strings in lib/ escape the one-content-file rule. Lane: copy. Caught: gallop-ai council, Oct 5 2026. Count: 1.
- **Check the title template against titles that end in punctuation.** Why: "%s. Site" turns questions into "?.". Lane: copy. Caught: gallop-ai council, Oct 5 2026. Count: 1.
- **Hover wakes things up; it never fades ink to secondary.** Use an ink underline or a darker hairline. Why: lighter on hover reads as disabled. Lane: design. Caught: gallop-ai council, Oct 5 2026. Count: 1.
- **Chrome on a pale ground needs a dark edge.** Show the full gradient at rest with a 1px bezel. Why: the bright stops vanish into #E3E4E2 and the rule reads as broken. Lane: design. Caught: gallop-ai council, Oct 5 2026. Count: 1.
- **Data marks stay lighter than the headline.** Use thin ticks on a baseline, not solid blocks. Why: a barcode row outweighed the H1. Lane: design. Caught: gallop-ai council, Oct 5 2026. Count: 1.
- **The proof goes on the first phone screen, checked at 390 x 664 (in-app browser), not just 844.** Why: the four picks sat below the fold for Instagram visitors. Lane: design, mobile. Caught: gallop-ai council, Oct 5 2026. Count: 1.
- **A meter inside a link is aria-hidden when a visible label says the same thing.** Why: its bare value joins the link's accessible name. Lane: mobile and accessibility. Caught: gallop-ai council, Oct 5 2026. Count: 1.
- **The reduced-motion block turns off every transition, not just the authored animation.** Why: hover and chevron transitions kept moving. Lane: mobile and accessibility. Caught: gallop-ai council, Oct 5 2026. Count: 1.
- **Every link in the README exists before the PR.** Commit the screenshot, and add the live link only after the first deploy. Why: a broken image and an unverified link on GitHub. Lane: copy. Caught: gallop-ai council, Oct 5 2026. Count: 1.

## Accepted exceptions
- CSP uses `'unsafe-inline'` for scripts instead of a nonce, because nonces force per-request rendering on a fully static site with no user input or third-party scripts. Revisit if any user input or third-party script is added.
- Dev-only `braces` advisory (via eslint-config-next) has no patched release. CI audits production dependencies only. Remove this once Dependabot brings a fix.
