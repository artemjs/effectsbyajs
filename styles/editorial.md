<!-- SPDX-License-Identifier: MIT · Copyright (c) 2026 Artem Bohdanov -->
# editorial

Calm and confident, like a well-set magazine page that moves. Large serif, generous space, fewer hits —
but still never static. Pick it for premium brands, quotes, values, reports, numbers that matter.
Why it works: restraint signals confidence. Motion is slower and rarer, so each move carries weight.

> Untested style: no film has been made with it yet. Treat the numbers as a starting point and record what
> the first film's contact-sheet loop teaches.

## Look
- Light ground (cream `#faf9f5`) and near-black text, or the inverse; ONE muted accent (rust, deep green).
- A serif display face (Lora, Playfair, a high-contrast serif) at 120–200 px, sentence case; a quiet sans
  for small labels in caps with wide tracking. Check script coverage.
- Asymmetric layout on a 12-column grid: text starts on a column line, not centered by default.
- Thin rules (2–4 px) and large numbers as graphic elements. No slabs of saturated color.

## Motion
- Lines reveal through masks (a rectangle clip growing `eOut` .4–.6 s), word by word on half beats.
- Moves are longer and softer: `eIO` .5–.8 s; slams are replaced by a small settle (`back` with 1.05 → 1).
- Numbers count up (`eOut` over 1–2 s) with tabular figures.
- The camera drifts slowly (handheld with `drift = .6`), push-in per scene is stronger (`push = .06`).
- Hits happen every bar (4 beats), not every beat; the beat still drives micro-motion (rules extending,
  a dot pulsing).

## Structure — one way to do it (20–30 s, 90–100 BPM)
| part | content |
|---|---|
| open (3 s) | one strong sentence revealed line by line |
| 3–4 sections (5 s each) | a number, a quote, a claim — each with one moving graphic element |
| close (3 s) | logo, one line, a rule drawing across, fade to the opening frame for the loop |

## Sound
A slower `groove` (90–100 BPM), fewer accents; consider a softer kit (lower kick, no hats) — this is where
the music-engineer skill should take over.

## Effects
`kinetic.roll` for replacing words; mask reveals are a few lines of code.

## Pitfalls
- "Calm" turning into "static": check every frame of the sheet has something in motion.
- Centered serif on a gradient — the banned default; stay on the grid and flat.
