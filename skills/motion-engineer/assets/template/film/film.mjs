// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Bohdanov
// The film: config + scenes. Every scene draws from f = { ctx, W, H, t, lt, dur, duration, beat, bpm, pulse }
// and nothing else — no state between frames, no Math.random().
// Effects: node <plugin>/skills/useeffects/scripts/effects.mjs add <name>, then import from
// '../.effectsbyajs/effects/<name>/index.mjs'.

import { createFilm, expose, isRenderMode } from '../.effectsbyajs/pipeline/film.mjs';
import { handheld, cutFlash } from '../.effectsbyajs/pipeline/camera.mjs';
import { renderScore, groove } from '../.effectsbyajs/pipeline/synth.mjs';
import { attachPlayer } from '../.effectsbyajs/pipeline/player.mjs';
import { cl, eOut } from '../.effectsbyajs/pipeline/math.mjs';
import { fitText } from '../.effectsbyajs/pipeline/text.mjs';
import { loadFonts } from '../.effectsbyajs/pipeline/fonts.mjs';

const BG = '#141413', FG = '#faf9f5', AC = '#d97757';
const DURATION = 4, BPM = 120;
const CUTS = [2];

// Fonts: explicit, so no frame is captured with a fallback face. Get them with
// npm i -D @fontsource-variable/<name>, copy the .woff2 into film/fonts/ (+ the license), then e.g.:
// const FONT = '"Display", system-ui, sans-serif';
// const fonts = loadFonts([
//   { family: 'Display', src: new URL('fonts/display-cyrillic.woff2', import.meta.url).href, unicodeRange: 'U+0400-045F' },
//   { family: 'Display', src: new URL('fonts/display-latin.woff2', import.meta.url).href, unicodeRange: 'U+0000-00FF' }
// ]);
// …and pass `ready: fonts` to createFilm, `{ font: FONT }` to fitText.

// Placeholder hook: one word per beat. Replace with the scenes from BRIEF.md.
const words = ['ONE', 'WORD', 'PER', 'BEAT'];
const hook = f => {
  const i = Math.min(words.length - 1, Math.floor(f.lt / f.beat)), dt = f.lt - i * f.beat;
  const s = 1 + .6 * (1 - eOut(cl(dt / .14)));
  f.ctx.save(); f.ctx.translate(f.W / 2, f.H / 2); f.ctx.scale(s, s);
  fitText(f.ctx, words[i], 0, 0, 260, f.W * .86, i % 2 ? AC : FG);
  f.ctx.restore();
};

const film = createFilm({
  canvas: document.getElementById('film'),
  duration: DURATION, bpm: BPM, fps: 60, background: BG,
  scenes: [{ at: 0, draw: hook }, { at: 2, draw: hook }],
  camera: handheld(),
  post: cutFlash(CUTS),
  audio: sampleRate => renderScore({
    duration: DURATION, sampleRate,
    score: kit => groove(kit, { duration: DURATION, beat: 60 / BPM, cuts: CUTS })
  })
});

expose(film);
if (!isRenderMode()) attachPlayer(film, { accent: AC });
