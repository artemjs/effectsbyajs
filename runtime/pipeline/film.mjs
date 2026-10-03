// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Bohdanov
// Core: a film is a pure function of time. render(t) paints the frame at t, with no state between frames.

import { pulse } from './math.mjs';
import { toWavBase64 } from './synth.mjs';

/**
 * @param {object} o
 * @param {HTMLCanvasElement} o.canvas
 * @param {number} o.duration         length in seconds (loops)
 * @param {Array<{at:number, draw:(f)=>void, join?:'continuous'}>} o.scenes  scenes by start time; join 'continuous'
 *        = this scene continues the previous one without a cut (no flash, see cutFlash)
 * @param {number[]} [o.marks]       extra moments to inspect (in-scene transitions) — sheet.mjs --cuts samples them
 * @param {number} [o.width=1080] @param {number} [o.height=1920] @param {number} [o.bpm=120] @param {number} [o.fps=60]
 * @param {string} [o.background='#000']
 * @param {(f)=>void} [o.camera]     transform applied under every scene (see camera.mjs)
 * @param {(f)=>void} [o.post]       drawn on top without the camera (flashes etc.)
 * @param {(sampleRate:number)=>Promise<AudioBuffer>} [o.audio]  the film's sound (see synth.mjs)
 * @param {Promise<any>} [o.ready]   what to wait for before the first frame (fonts)
 * @param {object} [o.grid]          musicGrid(…) from music.mjs — scenes then get f.music = grid.at(t)
 */
export function createFilm(o) {
  const { canvas, duration, scenes, width: W = 1080, height: H = 1920, bpm = 120, fps = 60, background = '#000' } = o;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d'), beat = 60 / bpm;
  const sorted = [...scenes].sort((a, b) => a.at - b.at);
  const cuts = sorted.slice(1).filter(s => s.join !== 'continuous').map(s => s.at);
  const joins = sorted.slice(1).filter(s => s.join === 'continuous').map(s => s.at);

  function render(t) {
    t = ((t % duration) + duration) % duration;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = background; ctx.fillRect(0, 0, W, H);
    let i = sorted.length - 1; while (i > 0 && sorted[i].at > t) i--;
    const s = sorted[i], lt = t - s.at, dur = (sorted[i + 1]?.at ?? duration) - s.at;
    // f — everything a scene needs: canvas, scene and film time, the beat grid
    const f = { ctx, W, H, t, lt, dur, duration, beat, bpm, pulse: pulse(t, beat), music: o.grid?.at(t), cuts };
    ctx.save(); o.camera?.(f); s.draw(f); ctx.restore();
    o.post?.(f);
  }

  return { canvas, ctx, W, H, duration, fps, bpm, beat, render, audio: o.audio, ready: o.ready ?? Promise.resolve(),
    cuts, joins, marks: o.marks ?? [] };
}

/** Public contract for render.mjs / sheet.mjs: window.seek, DURATION, FPS, filmReady, exportWav. */
export function expose(film) {
  window.__film = film;
  window.seek = t => film.render(t);
  window.DURATION = film.duration;
  window.FPS = film.fps;
  window.filmReady = film.ready.then(() => film.render(0));
  window.exportWav = async sr => film.audio ? toWavBase64(await film.audio(sr)) : null;
}

/** true when the page was opened by the renderer (?render) — the preview player is not needed then. */
export const isRenderMode = () => new URLSearchParams(location.search).has('render');
