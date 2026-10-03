<!-- SPDX-License-Identifier: MIT · Copyright (c) 2026 Artem Bohdanov -->
# kinetic-type

Typography is the picture. Words slam onto the beat, the frame inverts, geometry punctuates.
Pick it for a message, a manifesto, a launch line — anything where the words carry the film.
Why it works: one idea per beat is easy to read on a phone, and a frame that changes completely on every hit
holds attention. Keep that, change everything else.

## Look
- Dark ground, light text, ONE acid accent (lime `#C6FF2E`, orange, red). The accent inverts the frame on
  alternate beats: accent background + dark text.
- One very heavy face (900), uppercase for hits, sentence case only for small supporting lines.
- Hero words 220–320 px, max 2 lines on screen. Supporting line ≥ 56 px, 700 weight.
- Geometry is flat and hard: bars, squares, rings, rays. No gradients, no glow, no rounded "app" shapes.

## Motion
- Slam + shake on every hit; underline bars that grow `eOut` .18 s under the word.
- Letters can drop in one by one with `back` and a little seeded rotation that straightens out.
- Geometry scenes: a field of shapes driven by one formula (distance to a moving point, `sin(d/90 - t*6)`),
  appearing in a diagonal wave (`delay = (row + col) * .025`).
- Radial burst: rays from a center with length kicked by `pulse`, rings expanding on each beat, a counter
  0→100 (`eOut` over ~2 s) in the middle on a solid disc.
- Tunnel: nested rotated rectangles moving toward the camera (`z = (i/16 + step*.07 + t*.12) % 1`), outlined
  marquee rows on solid bands top and bottom.
- Split screen: two halves slide in from opposite sides (.25 s apart), text drifts inside them.
- Camera: handheld floor; the hook may add stronger shake.

## Structure — one way to do it (16 s, 120 BPM)
| time | scene |
|---|---|
| 0–2 | hook: 4 words, one per beat, background inverts on beats 2 and 4 |
| 2–4.5 | letters drop in with bounce, a slash bar crosses, a small line wipes in |
| 4.5–7 | geometry wave + a band with one claim sliding through |
| 7–9.5 | radial burst + counter |
| 9.5–12 | tunnel + marquee + a stamped word on an accent plate |
| 12–14 | split screen: two-part statement |
| 14–16 | final card: accent fills from the bottom, the title slams, equalizer bars, wipe to black → loop |

## Sound
`groove` at 120 BPM, whooshes into every cut, flashes on cuts. Nothing else needed — the hits are the kick.

## Effects
`kinetic` (slamText, beatWords, roll).

## Pitfalls
- Rings/rays crossing the counter or the subtitle → solid disc / plate behind the text.
- Outlined marquee text gets lost over line fields → solid bands under the marquee rows.
- A tiny word in a busy tunnel → make it big on an accent plate, dark text.

## Reference — a film made this way
"f(t)" — 16 s film: STOP. / LOOK. / THIS IS / CODE. → EVERY FRAME → ONLY JS → 0→100% → SEEK(T) tunnel →
FUNCTION / OF TIME → f(t).
