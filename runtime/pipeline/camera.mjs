// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Bohdanov
// Film camera: the frame never stands still — static frames read as wooden and machine-made.

import { TAU } from './math.mjs';

/**
 * Handheld camera: drift + micro-rotation (periods are multiples of the duration, so the loop is seamless),
 * a slow push-in within each scene and a scale kick on every beat. The frame is slightly zoomed so edges never show.
 * o: { drift = 1, push = .035, kick = .012, base = 1.06 }
 */
export function handheld(o = {}) {
  const { drift = 1, push = .035, kick = .012, base = 1.06 } = o;
  return f => {
    const { ctx, W, H, t, lt, dur, duration, pulse } = f, w = TAU / duration;
    const hx = drift * (10 * Math.sin(t * w * 5) + 6 * Math.sin(t * w * 11 + 1));
    const hy = drift * (12 * Math.sin(t * w * 4 + 2) + 5 * Math.sin(t * w * 13));
    const hr = drift * (.008 * Math.sin(t * w * 3) + .004 * Math.sin(t * w * 9 + 1));
    const z = (base + push * lt / dur) * (1 + kick * pulse);
    ctx.translate(W / 2 + hx, H / 2 + hy); ctx.rotate(hr); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
  };
}

/** Short light flash on cuts. cuts — cut times in seconds; default: the film's hard cuts (not continuous joins). */
export function cutFlash(cuts, color = '250,249,245', len = .12, alpha = .3) {
  return f => {
    for (const c of cuts ?? f.cuts) {
      const d = f.t - c;
      if (d >= 0 && d < len) {
        f.ctx.fillStyle = `rgba(${color},${alpha * (1 - d / len)})`;
        f.ctx.fillRect(0, 0, f.W, f.H);
      }
    }
  };
}
