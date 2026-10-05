# Design

Bassey Duke's silver and chrome system: a calm, pale room with one polished chrome lamp. Color comes only from content; the interface is silver, graphite and ink.

## Tokens (app/globals.css)

| Token | Value | Use |
| --- | --- | --- |
| ground | #E3E4E2 | page background |
| raised | #EFF0EE | skip link, selection text |
| ink | #141516 | text |
| secondary | #585B5E | supporting text |
| hairline | #C5C7C8 | rules, meter track, tick baseline |
| graphite | #17181A | meter fill, changed ticks, focus ring |
| chrome | gradient | the one rule under the lead question |

## Type

- Display: Shippori Mincho 400 and 500. Questions, headings, #1 picks.
- Text: Zen Kaku Gothic New 400.
- Mono: Fragment Mono, only for ranks and dates.
- All self-hosted from `app/fonts` with `next/font/local`. Sentence case, tight tracking on display sizes, body under 65 characters.

## Structure

- Hairlines carry the layout. No cards, no drop shadows, no glass. The only edge effect is the chrome rule's 1px bezel.
- Models are told apart by name and position, never by color.
- Home opens on the headline, then the most divided question with the four #1 picks side by side, so the proof lands on the first phone screen. The intro comes after.

## Ask your own

- Same room: form fields are raised silver with a hairline border, labels above, hints below in secondary.
- One solid graphite button (Ask). Connect OpenRouter is outlined. Everything else is an underlined text link.
- The list length is a three-way segmented control; the chosen segment fills graphite.
- Connected state is a small chrome bead, the page's second chrome moment.
- Model lanes are hairline rows with the name and the id in mono. Results reuse the lead-question layout and the rank table, which scrolls inside itself on phones when there are many columns.

## Motion

One authored moment: the chrome rule under the lead question draws in and its light settles once on arrival. It has a 1px dark bezel so the bright stops read on the pale ground. `prefers-reduced-motion` shows it still and turns off every transition. Hover never fades text; links and rows gain an ink underline.

## Don'ts

No green, indigo, rainbow or neon. No eyebrow labels, fake numbering, gradient text, big-number stat blocks, emoji or glyph icons. Icons are SVG with a 1.25 stroke.
