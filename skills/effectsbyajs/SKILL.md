---
name: effectsbyajs
description: Entry point of the effectsbyajs plugin — decides which of its skills a task needs (motion video, music for a video, vector artwork, ready-made effects) and runs the acceptance step before any of them starts. Use first whenever the user asks for a video, promo, reel, animation, motion design, kinetic typography, a film cut to a song, beat sync, an illustration or SVG artwork, or anything with .effectsbyajs in the project — even if they don't name the plugin.
---
<!-- SPDX-License-Identifier: MIT · Copyright (c) 2026 Artem Bohdanov -->

# effectsbyajs — which skill, and asking first

## Which skill
| the user wants | skill | notes |
|---|---|---|
| a video, promo, reel, intro, animation, kinetic type, a showcase clip | `motion-engineer` | always the base for films |
| the film cut to a song / "a video for this track" / beat sync / BPM, sections, drops of a track | `music-engineer` + `motion-engineer` | music first: its grid drives the film |
| original background music for a film | `music-engineer` (part B) | |
| drawn imagery: an illustration, artwork, a landscape, flowers, an SVG picture, drawings that draw themselves | `vector-engineer` | + `motion-engineer` if it goes into a film |
| a technique the library may have (3D card wall, transitions, morphs, motion blur, kinetic type) | `useeffects` | used inside the others; never write from scratch what the library has |

Most films use several: e.g. "a promo for our café to this song" = music-engineer → motion-engineer (+ useeffects,
+ vector-engineer if it needs drawings).

## Acceptance — propose before starting
These skills take minutes and produce files (a project folder, renders, downloads). So the user decides first —
unless they turned it off or the environment cannot ask.

1. Check the mode:
   ```
   cat ~/.effectsbyajs/settings.json 2>/dev/null; echo "CLAUDECODE=$CLAUDECODE"
   ```
   - `CLAUDECODE` is not `1` (not Claude Code: SDK, CI, other agents) → **no acceptance**, start working.
   - you cannot ask the user (you are a subagent, a non-interactive run, or the task says no questions) →
     **no acceptance**, start working.
   - settings say `"acceptance": "off"` → **no acceptance**, start working.
   - otherwise → propose (step 2) and stop.
   Already accepted earlier in this conversation for this task → don't ask again.
2. Propose in a few lines, then stop and wait:
   - which skills you will use and why (one line each),
   - what you will make: format, length, where the files go, what gets downloaded (fonts, music, effects),
   - anything you need from them (a track, a brand, a language) — or the defaults you will assume.
   End with exactly:
   > `/effectsbyajs:accept` — start · `/effectsbyajs:deny` — don't use the plugin for this · `/effectsbyajs:noacceptance` — stop asking, just work
3. On `/effectsbyajs:accept` (or a plain "yes/go") → run the plan. On `/effectsbyajs:deny` → do not use these
   skills or scripts for this task; offer to do it another way. If the user answers with changes instead, adjust
   the plan and propose again.
