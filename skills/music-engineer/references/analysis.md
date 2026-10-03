<!-- SPDX-License-Identifier: MIT · Copyright (c) 2026 Artem Bohdanov -->
# Track analysis — what `analyze.mjs` measures and how far to trust it

Built for produced music with a steady tempo (electronic, pop, hip-hop, rock). Rubato, live jazz, classical
and ambient will give a grid that needs ears. Everything is deterministic and runs in about a second per minute.

## Fields of music.json
| field | meaning | trust |
|---|---|---|
| `bpm`, `beat` | tempo from a least-squares fit through the tracked beats | ±0.05 BPM on steady material (checked: 120.02 vs 120, 121.99 vs 122, 122.00 vs 122) |
| `beats` | beat times, s. Steady tempo → an ideal fitted grid; otherwise the tracked beats | ±25 ms on steady material; calibrated so a kick on the grid reads 0 ms |
| `downbeats` | the "one" of each bar (4/4 assumed) | moderate: chosen as the beat phase where the harmony changes most. Wrong phase = everything shifted by 1–3 beats → check with clicks |
| `bars` | `{ start, end, energy }`, energy 0..1 within this track (loudness + low end + attack density) | good as a relative curve |
| `sections` | `{ start, end, bars, energy, slope, label }`, boundaries where 4-bar windows differ most, preferring phrase lines | boundaries good; labels are heuristics |
| `drops`, `builds` | section starts labeled drop; sections labeled build | a drop = a jump into the loudest tier; a build = rising energy right before a jump |
| `key` | key and mode from average chroma (Krumhansl profiles) + confidence | confidence < .7 → treat as unknown |
| `mood` | `arousal` 0..1 (tempo + energy + density), `dynamics` (energy spread), words | arousal/dynamics are measurable; **emotional valence is not reported** — spectral features do not predict "bright/happy" vs "dark" (bass-heavy bright tracks measure darker than aggressive ones) |
| `segments[L]` | top 3 segments ≈ L s in whole bars: `{ start, duration, bars, score, why, lufs, gainDb }` | scoring: energy, contrast, a drop inside, clean section edges |

## When the grid is wrong
Listen to `--clicks`. Typical failures and what to do:
- **Clicks between the kicks** (half-beat phase): the track's off-beats are louder than the kick (heavy hats, offbeat
  bass). Shift: `beats = beats.map(t => t + beat / 2)`, re-derive downbeats.
- **Tempo double/half** (clicks twice as dense/sparse as felt): fine for cutting (every other beat), but say it.
- **Clicks drift**: tempo changes or swing. Use the tracked beats (they follow the music) and avoid long fitted grids.
- **Wrong "one"** (downbeat click on beat 2/3/4): rotate downbeats by 1–3 beats; check against an obvious chord change.
- **Catalog BPM disagrees**: trust ears over metadata. (Ouroboros by Kevin MacLeod is listed at 130 BPM; the onset
  autocorrelation is overwhelmingly at 107 — check with clicks before cutting to it.)

## Choosing a segment for a video
- 9:16 social: 7–30 s. Hook in the first 2 s → start on a strong section or just before a drop (1–4 bars of build).
- End on a section end or a bar line; a fade-out shorter than a beat sounds like a cut — use ≥ half a bar or end on a hit.
- Loops: whole bars, and the start/end sections should have similar energy, or the loop jumps.

## Calibration
`LAG` in analysis.mjs (0.062 s) maps an analysis frame to the moment of the attack; it was measured on a
synthesized track with kicks exactly on a 0.5 s grid (mean error after calibration: −0.4 ms). If you change
the frame size or the onset function, re-measure it the same way.
