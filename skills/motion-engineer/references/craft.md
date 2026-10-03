<!-- SPDX-License-Identifier: MIT · Copyright (c) 2026 Artem Bohdanov -->
# Craft — techniques every style uses

Formulas are in seconds and pixels for a 1080×1920 frame; scale for other sizes.
Helpers: `cl, eOut, eIn, eIO, back, hash` from `pipeline/math.mjs`; `slam, shake, roll` from the `kinetic` effect.

## Timing on the beat
- `i = Math.floor(lt / beat)`, `dt = lt - i * beat` — which hit we are on and how long ago it landed.
- Things **arrive** on the beat and **settle** within it: an entrance takes 0.12–0.3 s, never the whole beat.
- Half beats (`beat / 2`) for lists and stutters; quarter beats only for very short ticks.
- `pulse = exp(-(t % beat) / beat * 6)` — 1 on the hit → 0; use it to kick scale, ray length, line width.

## Easing — which and when
| motion | easing | duration |
|---|---|---|
| something lands / appears | `eOut` (quartic out) | .12–.3 s |
| something leaves / gets sucked out | `eIn` | .2–.4 s |
| a move between two rests (camera, panels) | `eIO` | .3–.5 s |
| a size change that should feel alive | `back` (overshoot) | .25–.35 s |
| scroll steps | `floor(i) + eOut(frac / .2)` — a jump per beat, rest between | — |
Linear motion only for continuous drift (scroll speed, slow rotation). Opacity fades are the last resort.

## The slam (the most used hit)
`scale = 1 + .6 * (1 - eOut(dt / .14))` + `shake(dt, 20–30)` + optional `rotate((hash(i) - .5) * .1 * (1 - dt / .2))`.
Bigger amount (.7) for single words, smaller (.4) for two-line blocks. Pair with a kick in the sound.

## Hook — the first 2 seconds
One idea per beat, 4 beats. The frame must change completely on every beat (new word, inverted background,
new color block). Shake on each hit. The 4th beat is the punch: full-screen color wipe + the biggest slam.
The hook text should make a promise the film keeps ("STOP. LOOK. THIS IS CODE.", a prompt being typed).

## Holding an element for several beats
Counters, menus, logos and plates often stay on screen for a whole scene. Holding is fine; freezing is not.
Escalate on every beat instead of repeating the frame: re-slam it (smaller amount), grow it a step, roll a caption
under it, swap its color/plate, move the anchor, add one new element per beat, and save the biggest change for
the last beat of the scene.

## Text that stays readable
- Big: 160–260 px for hero words, ≥ 56 px for any secondary line on 1080 wide.
- `fitText` shrinks to `maxW` (use `W * .86`).
- Anything that crosses text (rings, lines, particles, walls) gets a solid plate or window behind the text.
- On busy backgrounds invert: dark text on an accent plate (pill or band).
- Rotating text: `translate` to the text's own center first, then `rotate`, then draw at (0, 0). A bare
  `ctx.rotate` turns around the canvas origin and pushes the text off-frame (`fitText` cannot see that).
- Slot-machine `roll` for words that replace each other in place.

## Never static
- Floor: `handheld()` camera — drift, micro-rotation, push-in per scene, beat kick.
- Every held element gets an idle: sway `±.03 rad`, bob `±8–14 px` at 2–3 Hz, slow spin, breathing scale.
- Characters breathe (`squash = .04 * sin(t * 9)`) even before they act.

## Transitions
- **Cut on the beat**: flash (`cutFlash`) + whoosh into the cut. Default between unrelated ideas.
- **Wipe**: a solid slab with an accent leading edge, rotated −.35 rad, `eIO` over .3 s.
- **Zoom through**: scale the outgoing scene `1 + 3–8 * eIn(...)` over the last .3–.4 s into its center.
- **Continuous (no cut)**: the last element of A becomes the first of B — flatten it out of 3D, resize it to
  B's shape, wipe its content, roll the header. Mark scene B `join: 'continuous'` (no flash), and add the moment
  of an in-scene transition to `createFilm({ marks })` so `sheet.mjs --cuts` shows it. Best for related ideas.
- **Break**: split an element along a jagged crack, halves swing out (`rotate(side * 1.9 * tt)`) and fall
  (`+3800 * tt²`), shards fly. For "destroying" something (a cliché, an old way).

## Morph
Between two shapes: size with `back` over .3 s, content with a diagonal wipe over .25 s (`wipeClip` in pseudo3d).
Chain morphs one per beat to show range ("one prompt → landing → app → dashboard → game").

## Particles that are not "generic particles"
Only when they are something: pixels that assemble a character, shards of a broken thing, sparks from a hit.
They start from a meaningful point, travel on arcs (`sin(PI * v)` bulge), and end somewhere meaningful.

## Variety plan
Every 2–4 s a different *kind* of motion: typography → geometry → radial burst → tunnel → split screen →
wall → morph → card. Two scenes in a row with the same motion type read as one long scene.

## Sound sync
Kick on every beat, snare 2 & 4, off-beat hats and bass (`groove`). Accents on story moments:
`click` for typing, `blip` for character hops / list items (rising pitches), `snap` for breaks,
`chime` for the logo, whooshes into cuts. `render.mjs --audio-only` normalizes and measures the sound in seconds
(−14 LUFS, true peak ≤ −1 dBTP after AAC) — run it inside the loop, not only at the end.
A real track instead of synthesized sound: the music-engineer skill (beat grid, sections, drops, segments).
