<!-- SPDX-License-Identifier: MIT · Copyright (c) 2026 Artem Bohdanov -->
# product-showcase

Show range in space: a tilted wall of live mockups, a camera flying over it, one card stepping out and
morphing through what the product can make. Pick it for "what X can do", templates, features, portfolios.
Why it works: many things at once reads as abundance, and one thing morphing reads as range. Keep both ideas;
the wall can be a grid, a carousel or a stack — the mockups can be anything the product actually makes.

## Look
- The brand's palette. Dark ground, cream/light cards, the brand accent; secondary colors only inside mockups.
- Mockups are simple and flat but specific: a landing page (nav, headline bars, button, image), a dashboard
  (sidebar, KPI tiles, line chart, donut), code (line numbers, colored token bars), a phone app (list rows,
  tab bar), a game (platforms, coins, a hero), slides, a player with a waveform, a map with a route, a chat.
- Category labels as solid pills (Steam-style): cream pill, dark 900 text, ~120 px. Header pill in the accent.
- Brand faces; check script coverage (Cyrillic etc.).

## Motion
- **Every mockup is alive**: charts breathe, code scrolls, cursors blink, the hero hops, routes dash along.
  A wall of static screenshots reads as a slideshow.
- Wall: alternate columns scroll in opposite directions with a jump per beat; the camera flies to a new
  angle per category (`eIO` .45 s) and wobbles; cards flip in a wave from the center into the new category.
- Fly-in at the start (zoom ×2.6 → 1 with `eOut`), fly-through at the end (zoom ×4 with `eIn`).
- Hero card: floats in 3D (`tht` ±.24, `psi` ±.32), morphs one state per beat (size `back`, content wipe).
- Hand-off without a cut: flatten the hero (`flat` → 1), resize it to the next scene's element, wipe content.

## Structure — one way to do it (≈ 27 s, 120 BPM)
| time | scene |
|---|---|
| 0–2 | hook (from kinetic-type or a typed prompt) |
| 2–6 | intro of who is showing (logo / character) |
| 6–12 | the wall: "WHAT I CAN DO?" pill, then one category per second (5 categories), flip waves |
| 12–15 | "ONE PROMPT →" hero card morphing per beat through 6 kinds of output |
| 15–18 | a contrast beat (destroy a cliché, before/after) — continuous from the hero |
| 18–24.5 | proof scenes (code stream, contact sheet of frames, split statement) |
| 24.5–27 | logo lockup + character + tagline, wipe to black → loop |

## Sound
`groove`; a rising `blip` on each category change (392, 440, 494, 523, 587 Hz); `click` on each morph;
`chime` pair on the logo.

## Effects
`pseudo3d` (wall, cameraTrack, floatingCard), `kinetic` for hooks and pills.

## Pitfalls
- Flip wave too slow → the category pill says GAMES while the cards still show dashboards. Wave speed
  ≥ 4500 px/s, flip ≤ .25 s.
- Mockup content too fine to read at phone size → fewer, thicker elements; it's texture, not UI.
- Hard cut from the hero to the next scene feels like a jump → use the continuous hand-off.

## Reference — a film made this way
"One line" — Claude showcase: typed prompt → spark thinking → pixel character → wall of mockups
(SITES / DASHBOARDS / GAMES / CODE / APPS) → one prompt → 6 morphs → the em-dash card breaks → code →
contact sheet → YOU • IDEA / ME • MOTION → logo.
