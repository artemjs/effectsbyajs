// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Bohdanov
// Sound synthesized in code (OfflineAudioContext), deterministic: seeded noise, everything on the beat grid.

import { mulberry32 } from './math.mjs';

/** Builds the drum/synth kit bound to an OfflineAudioContext. All sounds go to `master`. */
export function makeKit(o, master, seed = 42) {
  const sr = o.sampleRate, rnd = mulberry32(seed);
  const nb = o.createBuffer(1, sr, sr), d = nb.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = rnd() * 2 - 1;

  const noise = (t, dur, type, f, q, g) => {
    const s = o.createBufferSource(); s.buffer = nb;
    const fl = o.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    const gn = o.createGain(); gn.gain.setValueAtTime(g, t); gn.gain.exponentialRampToValueAtTime(.001, t + dur);
    s.connect(fl); fl.connect(gn); gn.connect(master); s.start(t); s.stop(t + dur + .02);
  };
  const tone = (t, type, f, f2, g, dur) => {
    const os = o.createOscillator(); os.type = type;
    os.frequency.setValueAtTime(f, t); os.frequency.exponentialRampToValueAtTime(f2, t + dur * .3);
    const gn = o.createGain(); gn.gain.setValueAtTime(g, t); gn.gain.exponentialRampToValueAtTime(.001, t + dur);
    os.connect(gn); gn.connect(master); os.start(t); os.stop(t + dur + .02);
  };
  const kick = t => {
    const os = o.createOscillator(), g = o.createGain();
    os.frequency.setValueAtTime(160, t); os.frequency.exponentialRampToValueAtTime(42, t + .12);
    g.gain.setValueAtTime(1, t); g.gain.exponentialRampToValueAtTime(.001, t + .4);
    os.connect(g); g.connect(master); os.start(t); os.stop(t + .42);
  };
  const bass = (t, f, dur) => {
    const os = o.createOscillator(); os.type = 'sawtooth'; os.frequency.value = f;
    const fl = o.createBiquadFilter(); fl.type = 'lowpass';
    fl.frequency.setValueAtTime(900, t); fl.frequency.exponentialRampToValueAtTime(120, t + dur);
    const g = o.createGain(); g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(.35, t + .01); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    os.connect(fl); fl.connect(g); g.connect(master); os.start(t); os.stop(t + dur + .02);
  };
  const whoosh = c => {
    const t0 = Math.max(0, c - .4);
    const s = o.createBufferSource(); s.buffer = nb;
    const fl = o.createBiquadFilter(); fl.type = 'bandpass'; fl.Q.value = 1.2;
    fl.frequency.setValueAtTime(400, t0); fl.frequency.exponentialRampToValueAtTime(6000, c);
    const g = o.createGain(); g.gain.setValueAtTime(.001, t0);
    g.gain.exponentialRampToValueAtTime(.4, c); g.gain.exponentialRampToValueAtTime(.001, c + .1);
    s.connect(fl); fl.connect(g); g.connect(master); s.start(t0); s.stop(c + .12);
  };
  return {
    noise, tone, kick, bass, whoosh,
    snare: t => noise(t, .18, 'bandpass', 1800, .8, .6),
    hat: t => noise(t, .05, 'highpass', 7000, .7, .25),
    click: t => noise(t, .035, 'highpass', 3500, .7, .7),
    blip: (t, f = 660) => tone(t, 'square', f, f * 1.5, .12, .14),
    chime: (t, f = 880) => tone(t, 'sine', f, f, .3, 1.4),
    snap: t => { noise(t, .3, 'bandpass', 2200, .5, 1); tone(t, 'sine', 180, 45, .5, .3); }
  };
}

/** Default groove: kick on every beat, snare on 2 and 4, off-beat hats and bass, whooshes into cuts. */
export function groove(kit, { duration, beat, cuts = [], roots = [41.2, 41.2, 49, 36.7, 41.2, 55, 49, 36.7] }) {
  const n = Math.round(duration / beat);
  for (let b = 0; b < n; b++) {
    const t = b * beat, bar = Math.floor(b / 4);
    kit.kick(t);
    if (b % 2 === 1) kit.snare(t);
    kit.hat(t + beat / 2);
    kit.bass(t + beat / 2, roots[bar % roots.length], beat / 2 * .9);
  }
  cuts.forEach(kit.whoosh);
}

/**
 * Renders a score into an AudioBuffer. score(kit, ctx) schedules sounds.
 * The master runs through a compressor (≈ −14 LUFS for social; measure the result, see render.mjs).
 */
export async function renderScore({ duration, sampleRate = 48000, seed = 42, score }) {
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const o = new OAC(2, Math.ceil(sampleRate * duration), sampleRate);
  const comp = o.createDynamicsCompressor();
  comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = .003; comp.release.value = .15;
  const master = o.createGain(); master.gain.value = .8;
  master.connect(comp); comp.connect(o.destination);
  score(makeKit(o, master, seed), o);
  return o.startRendering();
}

/** AudioBuffer → 16-bit PCM WAV as base64 (handed to Node by the renderer). */
export function toWavBase64(ab) {
  const ch = ab.numberOfChannels, sr = ab.sampleRate, n = ab.length;
  const bytes = 44 + n * ch * 2, b = new ArrayBuffer(bytes), v = new DataView(b);
  const ws = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, 'RIFF'); v.setUint32(4, bytes - 8, true); ws(8, 'WAVE');
  ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, ch, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * ch * 2, true); v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true);
  ws(36, 'data'); v.setUint32(40, n * ch * 2, true);
  const data = []; for (let c = 0; c < ch; c++) data.push(ab.getChannelData(c));
  let p = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) {
    const s = Math.max(-1, Math.min(1, data[c][i]));
    v.setInt16(p, s < 0 ? s * 0x8000 : s * 0x7FFF, true); p += 2;
  }
  const u8 = new Uint8Array(b);
  let s = '';
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(s);
}
