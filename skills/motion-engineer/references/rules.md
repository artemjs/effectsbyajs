<!-- SPDX-License-Identifier: MIT · Copyright (c) 2026 Artem Bohdanov -->
# Studio rules

These are constraints, not suggestions. Each one exists because the default without it is worse.

## Render contract
- A film is a pure function of time: `seek(t)` paints frame `t` deterministically — the same pixels every time.
- No CSS transitions, no setTimeout/requestAnimationFrame in render code, no state carried between frames.
  (The preview player may use rAF to *call* `render(t)` — that is all.)
- Seeded noise only (`hash`, `mulberry32`); never `Math.random()`.
- The page is only a container for `<canvas>`; no HTML/CSS layout in the film.
- Encode H.264 yuv420p, CRF 16 (render.mjs does this).

## Look
- Banned defaults: centered title on a gradient · everything fading in · corner labels and frame borders ·
  glow on UI chrome · generic particle fields. These are what "AI-made" looks like.
- One display face, one UI/mono face. One accent color unless the brief says otherwise.
- Check the font covers the on-screen language before designing around it (Poppins has no Cyrillic).
- Something new must happen every 2–4 s.
- **Nothing stands still.** A frozen frame reads as wooden and machine-made. Floor: handheld camera
  (drift + micro-rotation + push-in + beat kick). On top: text breathes/sways, icons rotate, characters idle.
- Motion vocabulary: eases out/in/back, scale slams, camera shake on hits, mask wipes, rolls, flips,
  morphs between shapes. Avoid linear motion and plain opacity fades.
- Em-dashes and purple-blue gradients are tells of generic AI output. Do not use them in on-screen copy
  or as backgrounds — unless the film is deliberately mocking them (then destroy them on screen).

## Transitions
- Cuts land on beats, with a short flash and a whoosh into the cut.
- Prefer a continuous move over a hard cut between related ideas: the last element of scene A becomes
  the first element of scene B (flatten, resize, wipe content) — then drop the flash for that join.

## Sound
- Score and SFX are synthesized in code unless a track is supplied.
- Every hit, cut and accent is on the beat grid (or on half/quarter beats). Loudness −14 LUFS, measured.

## Loop before showing anything
1. Render one frame per beat as a contact sheet and LOOK at it.
2. Score 1–10: hook in first 2 s, readability at phone size, motion quality, variety, brand accuracy, sound sync.
3. Fix the 3 worst problems. Repeat until every score is 8+.
4. Only then do the full render.

## Typical problems the sheet catches
- Moving lines/rings crossing text → put a solid plate or a window behind the text.
- Small text on busy backgrounds → bigger, on a solid plate, or invert (dark text on accent).
- A character that "reads wrong" (proportions) → fix the pixel grid/silhouette, not the animation.
- Waves/flips too slow, so the frame shows the previous state → shorten delays.
- Elements offset before they should move (gaps before a break) → gate offsets with `cl(dt * k)`.
