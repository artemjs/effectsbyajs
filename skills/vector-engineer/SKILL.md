---
name: vector-engineer
description: Draw real vector artwork as SVG — illustrations, landscapes, flowers, still lifes, characters, posters — that looks made by an illustrator, not clip art, and is built to animate (sketch → paint, grow, bloom, morph) in Canvas films. Use whenever a film or page needs drawn imagery, the user asks for an illustration, artwork, a drawing, an SVG picture or icon set, or wants a drawn scene brought to life.
---
<!-- SPDX-License-Identifier: MIT · Copyright (c) 2026 Artem Bohdanov -->

# Vector engineer

Paths: `<skill>` is this skill's base directory, `<plugin>` is `<skill>/../..`. Animation is done by the `morph`
effect (useeffects: `effects.mjs add morph`; its README has the API and the SVG authoring marks).

Artwork quality comes from the same thing as film quality: **look at it and fix it, many times**. A first draft of
vector art is almost always clip art — symmetric shapes, flat triangles, even lines, everything the same size.
Never ship a first draft.

## The loop
1. **Concept first** (2–4 lines in the brief): subject, mood, light source and time of day, palette (3–5 values
   plus one accent), composition (where the eye goes first, second, third), what will move.
2. **Block in** big shapes only — silhouettes and value masses. Check the still: does it read as a thumbnail?
3. **Refine**: secondary shapes, overlaps, edges, light and shadow, then details — only where the eye goes.
4. **Look**: `node <skill>/scripts/look.mjs <art.svg> --out out/look/vN` → `still.png` (what films draw),
   `compare.png` (browser | morph — differences mean unsupported SVG), `sketch.png`, `build.png`. Open them.
5. **Score** 1–10 with the rubric in [references/artwork.md](references/artwork.md); fix the three worst problems;
   save as a new version (`vN+1.svg`), never overwrite. Repeat until every score is 8+.
6. **Animate-ready**: group per moving part, paint order = drawing order, anchors on parts that sway or bloom
   (`data-anchor`, `data-order`, `data-mode`) — see the morph README "Authoring artwork".

## Hand-off
The final SVG, the version history with what changed and why, the scores, and what still is not good enough.
