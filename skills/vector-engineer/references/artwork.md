<!-- SPDX-License-Identifier: MIT · Copyright (c) 2026 Artem Bohdanov -->
# Artwork — what makes vector art look made by an illustrator

> Status: starting principles. Rewritten as iterations with the user teach us; confirmed lessons go to the
> bottom section with the artwork they came from.

## Rubric (score each 1–10; ship at 8+ everywhere)
| criterion | 4 | 6 | 8 | 10 |
|---|---|---|---|---|
| read | unclear what it is | clear up close | reads as a thumbnail (still at 270 px wide) | reads instantly, with a feeling |
| composition | everything centered, same size | a focal point exists | clear path for the eye: first, second, third; varied sizes | memorable layout |
| shape language | clip art: symmetric triangles, circles, rectangles | some variation | organic, asymmetric shapes with overlaps; big–medium–small | a recognizable hand |
| value & light | flat, no light source | some shading | 3–5 value groups, one light source, shadows agree | light tells the mood |
| color | default/saturated | harmonious | limited palette, one accent, atmospheric perspective (far = lighter, cooler, less contrast) | distinctive |
| detail | none or noise everywhere | uniform | detail only where the eye goes; edges vary (hard near focus, soft far) | every detail earns its place |
| animation-ready | one flat group | some groups | parts grouped by how they move, anchors set, paint order = draw order | the build tells a story |

## Principles
- **Silhouettes first.** If the black silhouette doesn't read, no detail will save it.
- **No primitive clip art.** A tree is not two triangles: irregular masses, a trunk, uneven layers, a lean.
  Mountains are not zig-zags: ridges, a lit side and a shadow side, snow or texture following the form.
- **Big–medium–small.** Vary sizes and spacing; avoid equal intervals and mirror symmetry.
- **Overlap** creates depth; so do value steps toward the horizon.
- **Edges**: line weight varies (thicker in shadow and in front), lines taper, curves have tension.
- **Restraint**: fewer, better shapes. Path count is a budget — spend it at the focal point.

## Perspective — one consistent space
A picture can be stylized and still have to agree with itself. Check every version:
- **One eye level.** Decide where the horizon (eye level) is and put it there for everything: the far shore of a lake,
  the base of distant hills, the line all vanishing points sit on.
- **Vanishing points on that line.** Buildings, docks, fences, roads: their parallel edges converge to points on the
  eye level. A dock seen from above is a converging walkway; its planks get shorter and closer together with distance.
- **Scale falls with distance**, and the scales agree: a cabin is about as tall as a young tree next to it; a door is
  about 2 m against it; far trees are tiny and low in contrast.
- **Foreshortening.** Ground and water compress toward the horizon: shorelines flatten, ripples get thinner and denser,
  spacing shrinks.
- **Reflections** sit straight below what they reflect, mirrored at the waterline (not at the object's base on land),
  a little darker, broken by ripples.
- **Overlap** tells depth before anything else; never let a far object cut in front of a near one.

## Filling the picture — a place, not a diagram
A first draft is usually empty: a few big shapes and nothing between them. Real illustrations are full of things
that belong to the place and tell its story.
- List what would really be there (a lake cabin at dusk: a rowboat at the dock, a lantern, a woodpile, a path to the
  door, a bench or fence, stones on the shore, reeds and lily pads of several kinds, smoke, layered far ridges and
  forest edges, mist bands, birds or fireflies). Pick the ones that support the mood; draw them properly.
- **Detail density** is highest at the focal point and falls toward the edges — but no zone is dead: the foreground
  gets texture (grass tufts, bushes, ferns, rocks) instead of a flat dark band.
- **Big–medium–small** in every group (stones, trees, clouds) and irregular spacing.
- Budget: 150–300 elements for a full scene is fine at 60 fps; spend them where the eye goes.

## Sky
- A real gradient has bands: deep color at the top, a lighter band near the horizon, an afterglow (sunset/dusk) or a
  glow around the light source — with value steps, not one linear ramp.
- Clouds have volume: a lit side toward the light (from below at dusk), a shadow side, soft and ragged edges, several
  layers at different distances (higher = smaller and cooler).
- Stars: denser and brighter high up, fading near the glow; varied sizes; none on top of the brightest sky.
- Celestial objects only with intent: a moon has a shape (crescent/disk) and a place in the composition, and its light
  agrees with the scene. No random floating dots or halos.

## Making organic shapes (technique)
- Generate them from a seeded script instead of typing coordinates: ridges by recursive midpoint displacement, smooth
  curves through points, parameterized generators for trees, rocks, grass, clouds. Same seed = same SVG; keep the
  generator next to each version.
- Mountains: faces divided by lines that run down the slope, each lit/shaded face its own fill, all faces on one
  `gradientUnits="userSpaceOnUse"` gradient so light falls off consistently; break long faces with an overlapping
  foreground layer (foothills, forest) so they don't read as stripes. Rock structure is a few strata/gullies following
  the form, not scratches.
- Conifers: a solid mass with a ragged edge; notches between tiers at 25–50 % of the branch reach (never to the trunk),
  drooping tips with small tufts, widest in the lower third.
- Soft light (glows, reflections, mist) is always a radial gradient fading to transparent — never a flat ellipse with
  lowered opacity.

## Technical
- Valid XML only (`data-piece=""`, not `data-piece`); look.mjs refuses invalid SVG.
- Keep all geometry inside the viewBox — morph does not clip; look.mjs warns.
- Build order tells the story: the focal light gets its own later `data-order` (the window lights up last);
  `data-sketch="none"` for glows, stars and reflections.

## Lessons from iterations
Lake cabin at dusk (vector-lab/landscape):
- v0 → v4 (artist): from clip art to an illustration by: one light source with a muted afterglow and the window as the
  only saturated warm accent; darkest values next to the accent; a framing dark tree that must not cover the secondary
  light; mountains as faces; ragged conifers; gradient glows. *(user: "generally not bad")*
- v4 review *(user, confirmed)*: perspective problems; the picture is still empty — elements are missing; the sky looks
  strange. → sections Perspective, Filling the picture, Sky above.
