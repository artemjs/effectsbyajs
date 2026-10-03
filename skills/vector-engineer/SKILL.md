---
name: vector-engineer
description: Draw real vector artwork as SVG — illustrations, landscapes, flowers, still lifes, characters, posters — that looks made by an illustrator, not clip art, and is built to animate (sketch → paint, grow, bloom, morph) in Canvas films. Use whenever a film or page needs drawn imagery, the user asks for an illustration, artwork, a drawing, an SVG picture or icon set, or wants a drawn scene brought to life.
---
<!-- SPDX-License-Identifier: MIT · Copyright (c) 2026 Artem Bohdanov -->

> **Before starting:** run the acceptance step from the `effectsbyajs` skill (`<plugin>/skills/effectsbyajs/SKILL.md`)
> unless this task was already accepted in this conversation — it also says which other skills this task needs.

# Vector engineer

Paths: `<skill>` is this skill's base directory, `<plugin>` is `<skill>/../..`. Animation is done by the `morph`
effect and water by the `reflection` effect (useeffects: `effects.mjs add morph reflection`). Once installed, read
`<project>/.effectsbyajs/effects/morph/README.md` → "Authoring artwork" for the SVG marks (data-order, data-anchor, …).

Artwork quality comes from the same thing as film quality: **look at it and fix it, many times**. A first draft of
vector art is almost always clip art — symmetric shapes, flat triangles, even lines, everything the same size.
Never ship a first draft.

## The loop
1. **Concept first** (2–4 lines in the brief): subject, mood, light source and time of day, palette (3–5 values
   plus one accent), composition (where the eye goes first, second, third), eye level, what will move — and a list
   of the things that would really be in this place (see "Filling the picture").
2. **Block in** big shapes only — silhouettes and value masses. Check the still: does it read as a thumbnail?
3. **Refine**: perspective check (eye level, vanishing points, scale), secondary shapes, overlaps, light and shadow,
   then the details that fill the place — densest at the focal point, but no dead zones. Sky with real bands and
   cloud volume. All of it in [references/artwork.md](references/artwork.md) — read it before drawing.
4. **Look**: `node <skill>/scripts/look.mjs <art.svg> --out out/look/vN` → `still.png` (what films draw),
   `thumb.png` (does it read small?), `zoom-tl/tr/bl/br.png` (2× — slivers, seams, ruler-straight edges and low-poly
   facets only show here), `compare.png` (browser | morph), `sketch.png`, `build.png`. Open them — the zooms too.
5. **Score** 1–10 with the rubric in [references/artwork.md](references/artwork.md); fix the three worst problems;
   save as a new version (`vN+1.svg`), never overwrite. Repeat until every score is 8+. If a criterion has not
   improved for 3 versions, stop and report it as the open problem instead of looping.
6. **Animate-ready**: group per moving part, paint order = drawing order, anchors on parts that sway or bloom
   (`data-anchor`, `data-order`, `data-mode`) — see the morph README "Authoring artwork".

## Hand-off
The final SVG, the version history with what changed and why, the scores, and what still is not good enough.
