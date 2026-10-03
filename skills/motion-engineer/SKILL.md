---
name: motion-engineer
description: Make high-motion videos, promos, showcases, kinetic typography, animated intros and social clips (Reels/TikTok/Shorts, 9:16 or any size) drawn in Canvas 2D as a pure function of time, with code-synthesized sound, rendered to MP4. Use whenever the user asks for a motion video, an animated film, a promo/showcase clip, "make a cool video about X", a looping animation to export, or wants motion added to a project — even a React/Vite/Next app. Also use to review, fix or re-render an existing Canvas film (a project with .effectsbyajs/ or window.seek).
---
<!-- SPDX-License-Identifier: MIT · Copyright (c) 2026 Artem Bohdanov -->

# Motion engineer

You make films that look like a strong motion designer made them. Each frame is `render(t)` — a pure
function of time drawn in Canvas 2D — so any frame can be rendered, checked and re-rendered exactly.

Quality does not come from one long generation. It comes from **a precise brief, hard constraints and the
look → fix loop** (render a contact sheet, look at it, fix the worst problems, repeat). Skipping the loop is
what turns a short prompt into generic slop, and the loop costs minutes. Never skip it.

Paths below: `<skill>` is this skill's base directory, `<plugin>` is `<skill>/../..`.
Read [references/rules.md](references/rules.md) before writing any scene — it is the studio's taste, as constraints.
[references/craft.md](references/craft.md) has the techniques (timing, easing, slams, hooks, transitions, morphs).
`<plugin>/styles/` has directions to start from — pick one per film (see step 1).

## 1. Brief first

A vague ask ("make a cool video about us") gets the most probable result: centered title on a gradient,
everything fading in. So before code, pin the film down in `BRIEF.md` (template: `<skill>/assets/template/BRIEF.md`):
story in one line, format, palette with ONE accent, fonts, a timeline table where every row says what moves
on which beat, sound accents. Invent boldly when the user leaves room — but write it down.
Pick a style from `<plugin>/styles/` (read its file) and note in the brief what you change about it;
styles are directions with example numbers, not recipes — bend them to the story.
Ask the user only what you cannot decide well yourself (brand, language, must-have content). If you cannot
ask (a non-interactive run) or an ask is ambiguous ("a video about yourself" — the user, or you?), pick the
most useful reading, write it into the brief, and state it in the hand-off.
References the user gives (a screenshot, a site, a film) outrank everything else in the brief.

## 2. Set up the project

| Situation | Do |
|---|---|
| empty dir / no app | `node <skill>/scripts/init.mjs <dir>` → `index.html`, `film/film.mjs` (a placeholder — replace it entirely), `BRIEF.md`, `.effectsbyajs/pipeline/`, puppeteer devDependency; then `npm install` |
| existing app (React, Vite, Next, Svelte…) | `node <skill>/scripts/init.mjs <dir> --integrate` → only `.effectsbyajs/pipeline/`; mount the film on a canvas — see [references/integrate.md](references/integrate.md) |
| existing film | read its `BRIEF.md` / `CLAUDE.md` and the scene code first |

The goal in every case is the same: a canvas, `createFilm({...})`, `expose(film)`. Everything else
(render, sheet, effects) works off that contract.

## 3. Pull effects instead of writing them

Before hand-writing a technique, check the library (the **useeffects** skill):
`node <plugin>/skills/useeffects/scripts/effects.mjs list`, then `add <name>`. Effects install into
`.effectsbyajs/effects/<name>/` with types, a README and a showcase. Read the effect's README, import from
its `index.mjs`. Write scene code on top; write a new technique only when nothing in the library fits.

## 4. Write scenes

A scene is `{ at, draw(f) }`; `f = { ctx, W, H, t, lt, dur, duration, beat, bpm, pulse }`.
- Time is the only input. Hits sit on the beat grid: `Math.floor(f.lt / f.beat)`, `dt = f.lt - i * f.beat`.
- Randomness only via `hash(i, seed)` / `mulberry32` from `pipeline/math.mjs`.
- Every scene owns its entrance and its exit; a cut lands on a beat (flash + whoosh come from `CUTS`).
- Something keeps moving in every frame — `handheld()` camera is the floor, not the ceiling.
- Sound: `renderScore` + `groove` from `pipeline/synth.mjs`, accents (`kit.click/blip/chime/snap`) on the
  moments that matter. A soft limiter keeps peaks at −1 dBTP. Music beyond that belongs to the music-engineer
  skill when it exists.
- Fonts: explicit, via `loadFonts` + `ready` (recipe in the template's film.mjs and in `pipeline/fonts.mjs`).
- A track from the user (or "make it to this song"): use the **music-engineer** skill first — it gives the beat
  grid, sections, drops and the segment, and `f.music` in every scene.

## 5. The loop — before showing anything

1. `node <skill>/scripts/sheet.mjs --root <dir>` → `out/sheet.png`, one frame per beat. **Open it and look.**
   Then `sheet.mjs --cuts --out out/cuts.png` — frames around every cut and the loop seam; that is where
   empty frames, jumps and glitches hide. For any other moment: `--times 14.6,14.7,…`.
   A tile that looks wrong: open the full-size frame (the script prints where).
   Sound: `node <skill>/scripts/render.mjs --root <dir> --audio-only` (seconds) — LUFS and true peak after AAC.
2. Score 1–10 with the anchors in rules.md: hook · readability · motion quality · variety · brand accuracy · sound sync.
3. Fix the three worst problems. Repeat until every score is 8+.
4. Only then: `node <skill>/scripts/render.mjs --root <dir>` → `out/film.mp4` (H.264 High, yuv420p, CRF 16)
   with measured loudness (target −14 LUFS, ±1 LU is fine) and true peak (≤ −1 dBTP) — fix any WARNING.

For apps on a dev server pass `--url http://localhost:<port>/<film page>` to both scripts.

## 6. Hand-off

Tell the user what the film does scene by scene, what you fixed in the loop, the measured numbers
(duration, size, LUFS), and anything you could not verify. Keep `BRIEF.md` in sync with what shipped —
it is how the film gets rebuilt later. Brand marks you drew from memory are approximations: say so.
