# Design

Bassey Duke's silver and chrome system: a calm, pale room with one polished chrome lamp. Color comes only from content; the interface is silver, graphite and ink.

## Tokens (app/globals.css)

| Token | Value | Use |
| --- | --- | --- |
| ground | #E3E4E2 | page background |
| raised | #EFF0EE | skip link, selection text |
| ink | #141516 | text |
| secondary | #585B5E | supporting text |
| hairline | #C5C7C8 | rules, unchanged ticks |
| graphite | #17181A | meter fill, changed ticks, focus ring |
| aluminum | #D4D7DA | meter track |
| chrome | gradient | the one rule under the lead question |

## Type

- Display: Shippori Mincho 400 and 500. Questions, headings, #1 picks.
- Text: Zen Kaku Gothic New 400 and 500.
- Mono: Fragment Mono, only for ranks and dates.
- All self-hosted through Fontsource. Sentence case, tight tracking on display sizes, body under 65 characters.

## Structure

- Hairlines carry the layout. No cards, no shadows, no glass.
- Models are told apart by name and position, never by color.
- Home opens on the headline, then the most divided question with the four #1 picks side by side.

## Motion

One authored moment: the chrome rule under the lead question catches light once on arrival. `prefers-reduced-motion` shows it still. Everything else is a quiet color change on hover.

## Don'ts

No green, indigo, rainbow or neon. No eyebrow labels, fake numbering, gradient text, big-number stat blocks, emoji or glyph icons. Icons are SVG with a 1.25 stroke.
