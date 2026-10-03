<!-- SPDX-License-Identifier: MIT · Copyright (c) 2026 Artem Bohdanov -->
# character-story

A small hero carries the film: it is born, reacts, travels through the scenes and waves goodbye.
Pick it for mascots, brand characters, friendly products, explainers with a narrator.
Why it works: people follow a face. A character that keeps acting (never just standing) turns a sequence of
scenes into a journey. The character can be pixels, shapes or a logo with eyes — invent one for the brand.

## Look
- The character is simple enough to draw from a grid: a pixel sprite (12×7 cells), or a few primitives.
  One body color (the accent), dark eyes, a readable silhouette at 300 px wide.
- The character never sits on text; text sits above it on its own line.
- Ground: a thin line or a soft shadow ellipse that shrinks while the character is in the air.

## Motion — the character is always acting
- Birth: its cells fly in from a meaningful point (an exploding logo, a cursor) on arcs, staggered by
  `hash(k) * .3`, `eOut` over .5 s, scale .35 → 1.
- Landing: squash `1 + .2 * exp(-ph * 10)` in x, inverse in y, right on the beat.
- Hops on the beat: `y = 4 * ph * (1 - ph) * height` with `ph` = beat phase; alternate leg pairs in the air.
- Idle: breathing squash `.04 * sin(t * 9)`; blink for .1 s every few seconds; wave an arm on beats.
- It travels between scenes: jumps out of the top of one, falls into the next and lands on its UI.
- Exit: jump up out of frame (`eIn`) or pop down behind a line (clipped).

## Structure — one way to do it (any length)
1. Hook (2 s) — the problem or the promise.
2. Birth (2 s) — the character assembles, lands, says hi ("HELLO." → "IT'S ME.").
3. Journey (most of the film) — the character in each scene, reacting to the content.
4. Farewell (2–2.5 s) — logo lockup, the character pops up under it and waves, tagline wipes in.

## Sound
8-bit `blip` on every hop/landing with rising pitch on important ones (523 → 659 → 784);
`click` for typing; `chime` at the logo.

## Effects
`kinetic` for the speech lines; `pseudo3d` if the character visits a wall of cards.

## Pitfalls
- Proportions read wrong (looks like a different creature) → fix the grid silhouette first.
- The character hidden behind the text or the wall → give it its own band of the frame.
- Too many hops in a row → vary: hop, hop, blink, wave.

## Reference — a film made this way
The pixel character in "One line": assembles from the exploded spark, lands, HELLO. / IT'S ME., falls into
the code stream and rides the text band, stands on the split-screen seam, waves under the logo.
