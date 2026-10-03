<!-- SPDX-License-Identifier: MIT · Copyright (c) 2026 Artem Bohdanov -->
# Composing in code — making the film's own music good

> Status: principles plus the current kit. This file grows from listening sessions with the user: every note
> they give ("the kick is cardboard", "boring at bar 8") becomes a rule or a recipe here. Untested advice is
> marked as such.

## What "good" means for a film score
- It serves the cut: sections change where scenes change, the biggest sound where the biggest visual is.
- It develops: something is added or removed every 4–8 bars. A 2-bar loop for 30 s is the musical version of a
  static frame.
- It is mixed for phones: the bass is audible on small speakers (add upper harmonics, not just sub), the mix is
  −14 LUFS with peaks ≤ −1 dBTP (the master limiter handles peaks; you handle balance).

## Structure (arrange in phrases)
- 4 bars = a phrase, 8 or 16 bars = a section. Plan the energy curve against the film timeline first.
- Typical short film: intro (sparse: hats or a motif) → build (add layers, rising filter, snare roll on the last
  bar, a whoosh into the drop) → drop (full kit + bass + chords/lead) → break or outro (pull the kick, keep a
  pad/motif) → end on a hit or a bar line for the loop.
- Fills on the last beat of every 4th bar; a short silence (a "gap") right before the drop makes it hit harder.

## Layers and the current kit (`pipeline/synth.mjs`)
| layer | kit | notes |
|---|---|---|
| kick | `kick(t)` | on every beat in high sections; drop it in breaks |
| snare/clap | `snare(t)` | 2 and 4; rolls (`beat/4` spacing) into drops |
| hats | `hat(t)` | off-beats; 16ths in high sections |
| bass | `bass(t, hz, dur)` | off-beat or on the roots of the progression; keep it on the key from the brief |
| accents | `click`, `blip(t, hz)`, `chime(t, hz)`, `snap`, `whoosh(cut)` | story moments, cuts |
| anything else | `kit.tone`, `kit.noise`, or raw WebAudio on `ctx` with `master` (3rd arg of `score`) | chords, pads, leads |

Untested recipes (to verify by ear and then promote):
- Chord stab: 3–4 `tone(t, 'sawtooth', f, f, .06, .25)` on chord notes, slightly detuned pairs (±3 cents).
- Pad: two detuned saws per note through a lowpass (~1.2 kHz) with a slow attack (.3–.6 s) on the master.
- Sidechain feel: duck the bass/pad gain to 30 % for 120 ms on every kick (gain automation).
- Riser: `noise` through a bandpass sweeping 400 Hz → 6 kHz over the build's last bar + rising `tone`.

## Pitch helpers
`hz = 440 * 2 ** ((midi - 69) / 12)`. Minor keys read tense/serious, major open/bright — but tempo, register and
rhythm matter as much. Stay in one key per film unless the story turns.

## Mixing checklist
Bass and kick don't fight (bass off the kick, or ducked) · nothing but kick/bass below 120 Hz · hats quiet, they
cut through anyway · accents a little louder than you think (they carry the story) · render, read LUFS/peak.

## Lessons from listening
(empty — add each confirmed note from the user here, with the film it came from)
