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
- Something new must happen every 2–4 s — and inside a scene, beats must not repeat the same layout.
  Six beats of the same frame with a different word is one long beat: move the anchor, alternate the
  composition, escalate (bigger, closer, inverted) toward the scene's last beat.
- **Nothing stands still.** A frozen frame reads as wooden and machine-made. Floor: handheld camera
  (drift + micro-rotation + push-in + beat kick). On top: text breathes/sways, icons rotate, characters idle.
- Motion vocabulary: eases out/in/back, scale slams, camera shake on hits, mask wipes, rolls, flips,
  morphs between shapes. Avoid linear motion and plain opacity fades.
- Em-dashes and purple-blue gradients are tells of generic AI output. Do not use them in on-screen copy
  or as backgrounds — unless the film is deliberately mocking them (then destroy them on screen).
  Hyphens and minus signs are fine: "-20%" with a hyphen-minus, or U+2212 (−) if the font has it (check the subset).

## Transitions
- Cuts land on beats, with a short flash and a whoosh into the cut.
- Prefer a continuous move over a hard cut between related ideas: the last element of scene A becomes
  the first element of scene B (flatten, resize, wipe content) — then drop the flash for that join.

## Sound
- Score and SFX are synthesized in code unless a track is supplied.
- Every hit, cut and accent is on the beat grid (or on half/quarter beats). Loudness −14 LUFS, measured.

## Loop before showing anything
1. Render one frame per beat as a contact sheet and LOOK at it. Then a second sheet with `--cuts`
   (frames around every cut and the loop seam) — cut problems are invisible on the per-beat sheet.
2. Score 1–10 on each criterion, using the anchors below.
3. Fix the 3 worst problems. Repeat until every score is 8+.
4. Only then do the full render. Check the printed loudness and true peak.

| criterion | 4 | 6 | 8 | 10 |
|---|---|---|---|---|
| hook (first 2 s) | a title appears | words change on beats | the frame changes completely on every beat, with a punch on beat 4 | you would not scroll past it |
| readability | some text unreadable at 360 px wide | readable but small or crossed by motion | every word readable at 360 px, on solid ground | instant, even mid-motion |
| motion quality | fades, linear moves | eased, but frames hold still | every frame moves; hits land on beats with slam/shake | moves have weight, follow-through and intent |
| variety | one kind of motion | new scene every 4+ s | new kind of motion every 2–4 s, no repeated layout inside a scene | each scene surprises |
| brand accuracy | default colors/fonts | palette right, type generic | palette, ONE accent, chosen faces, brand marks handled honestly | feels made by the brand's designer |
| sound sync | not checked | on the grid by construction | every hit/cut/accent scheduled on the grid; loudness and peak measured | (needs ears — say it was not listened to) |

Sound you cannot hear: say so in the hand-off. "On the grid by construction + measured LUFS/peak" is the honest ceiling.

## Typical problems the sheet catches
- Moving lines/rings crossing text → put a solid plate or a window behind the text.
- Small text on busy backgrounds → bigger, on a solid plate, or invert (dark text on accent).
- A character that "reads wrong" (proportions) → fix the pixel grid/silhouette, not the animation.
- Waves/flips too slow, so the frame shows the previous state → shorten delays.
- Elements offset before they should move (gaps before a break) → gate offsets with `cl(dt * k)`.
