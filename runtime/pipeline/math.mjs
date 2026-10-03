// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Bohdanov
// Deterministic math: seeded PRNG, easings, beat pulse. Math.random() is banned in films.

/** Seeded PRNG (mulberry32): returns a function → [0, 1). */
export function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/** Stable "random" number for index i — the same in every frame. */
export const hash = (i, seed = 1) => mulberry32(i * 9973 + seed * 7919)();

export const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, v) => a + (b - a) * v;
export const eOut = v => 1 - Math.pow(1 - v, 4);
export const eIn = v => v * v * v * v;
export const eIO = v => v < .5 ? 8 * v ** 4 : 1 - Math.pow(-2 * v + 2, 4) / 2;
export const back = v => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(v - 1, 3) + c1 * Math.pow(v - 1, 2); };

/** 1.0 exactly on the beat, decays exponentially until the next one. */
export const pulse = (t, beat) => Math.exp(-((t % beat) / beat) * 6);

export const TAU = Math.PI * 2;
