// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Bohdanov
// Music analysis without dependencies: beat grid, downbeats, energy, sections, builds/drops, key, mood, segments.
// Input is mono PCM (Float32Array). All heuristics are documented in references/analysis.md — they are good for
// produced music with a steady tempo (pop, electronic, hip-hop, rock); rubato or ambient material needs ears.

const SR = 22050, N = 2048, HOP = 512, FPS = SR / HOP;
// time of frame f: an attack shows up in the flux once it is inside the window; LAG is calibrated on a
// synthetic track with kicks exactly on the grid (see references/analysis.md)
let LAG = .062;
const at = f => (f * HOP) / SR + LAG;

// ----- FFT (radix-2, in place) -----
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const a = -2 * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const p = i + k, q = p + len / 2, tr = re[q] * cr - im[q] * ci, ti = re[q] * ci + im[q] * cr;
        re[q] = re[p] - tr; im[q] = im[p] - ti; re[p] += tr; im[p] += ti;
        [cr, ci] = [cr * wr - ci * wi, cr * wi + ci * wr];
      }
    }
  }
}

// ----- frame features -----
function features(pcm) {
  const frames = Math.max(1, Math.floor((pcm.length - N) / HOP) + 1), bins = N / 2;
  const win = Float64Array.from({ length: N }, (_, i) => .5 - .5 * Math.cos(2 * Math.PI * i / N));
  const hz = k => k * SR / N, band = (a, b) => [Math.ceil(a * N / SR), Math.floor(b * N / SR)];
  const [l0, l1] = band(30, 150), [m0, m1] = band(150, 2000), [h0, h1] = band(4000, 11000);
  // chroma bins: 65 Hz … 2 kHz → pitch class
  const pc = new Int8Array(bins).fill(-1);
  for (let k = 1; k < bins; k++) if (hz(k) >= 65 && hz(k) <= 2000) pc[k] = ((Math.round(12 * Math.log2(hz(k) / 440)) % 12) + 12 + 9) % 12; // 0 = C

  const flux = new Float32Array(frames), fluxLow = new Float32Array(frames), rms = new Float32Array(frames);
  const low = new Float32Array(frames), mid = new Float32Array(frames), high = new Float32Array(frames), cent = new Float32Array(frames);
  const chroma = Array.from({ length: frames }, () => new Float32Array(12));
  let prev = new Float32Array(bins);
  const re = new Float64Array(N), im = new Float64Array(N);
  for (let f = 0; f < frames; f++) {
    const o = f * HOP; let e = 0;
    for (let i = 0; i < N; i++) { const s = pcm[o + i] || 0; e += s * s; re[i] = s * win[i]; im[i] = 0; }
    rms[f] = Math.sqrt(e / N);
    fft(re, im);
    const cur = new Float32Array(bins);
    let fl = 0, flL = 0, sw = 0, sm = 0, lo = 0, mi = 0, hi = 0;
    for (let k = 1; k < bins; k++) {
      const mag = Math.hypot(re[k], im[k]), lm = Math.log1p(10 * mag);
      cur[k] = lm;
      const d = lm - prev[k]; if (d > 0) { fl += d; if (k <= l1) flL += d; }
      const p = mag * mag; sw += p * hz(k); sm += p;
      if (k >= l0 && k <= l1) lo += p; else if (k >= m0 && k <= m1) mi += p; else if (k >= h0 && k <= h1) hi += p;
      if (pc[k] >= 0) chroma[f][pc[k]] += mag;
    }
    flux[f] = fl; fluxLow[f] = flL; cent[f] = sm ? sw / sm : 0;
    low[f] = lo; mid[f] = mi; high[f] = hi; prev = cur;
  }
  return { frames, flux, fluxLow, rms, low, mid, high, cent, chroma };
}

const mean = a => a.reduce((s, v) => s + v, 0) / (a.length || 1);
const db = v => 10 * Math.log10(v + 1e-12);
const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };

/** Onset envelope: flux minus its local mean, half-wave rectified, unit std. */
function onsetEnvelope(flux) {
  const n = flux.length, w = Math.round(FPS * .5), out = new Float32Array(n);
  let s = 0; const q = [];
  for (let i = 0; i < n; i++) {
    q.push(flux[i]); s += flux[i]; if (q.length > w) s -= q.shift();
    out[i] = Math.max(0, flux[i] - s / q.length);
  }
  const sd = Math.sqrt(mean(Array.from(out, v => v * v))) || 1;
  for (let i = 0; i < n; i++) out[i] /= sd;
  return out;
}

/** Tempo by autocorrelation of the onset envelope with a log-normal prior around 120 BPM. */
function tempo(env) {
  let best = 0, bestBpm = 120;
  const score = bpm => {
    const lag = 60 / bpm * FPS, l0 = Math.floor(lag), fr = lag - l0;
    let ac = 0; for (let i = 0; i + l0 + 1 < env.length; i++) ac += env[i] * (env[i + l0] * (1 - fr) + env[i + l0 + 1] * fr);
    return ac / env.length * Math.exp(-.5 * (Math.log2(bpm / 120) / .9) ** 2);
  };
  for (let bpm = 70; bpm <= 180; bpm += .5) { const s = score(bpm); if (s > best) { best = s; bestBpm = bpm; } }
  for (let bpm = bestBpm - .5; bpm <= bestBpm + .5; bpm += .02) { const s = score(bpm); if (s > best) { best = s; bestBpm = bpm; } }
  return bestBpm;
}

/** Dynamic-programming beat tracker (Ellis 2007): beats that sit on onsets and keep the period. */
function trackBeats(env, bpm) {
  const P = 60 / bpm * FPS, n = env.length, score = new Float32Array(n), back = new Int32Array(n).fill(-1);
  for (let t = 0; t < n; t++) {
    let bs = 0, bi = -1;
    for (let tau = Math.max(0, Math.round(t - 2 * P)); tau <= t - Math.round(P / 2); tau++) {
      const s = score[tau] - 100 * Math.log((t - tau) / P) ** 2;
      if (bi < 0 || s > bs) { bs = s; bi = tau; }
    }
    score[t] = env[t] + (bi >= 0 ? bs : 0); back[t] = bi;
  }
  let t = n - 1; for (let i = Math.max(0, Math.round(n - P)); i < n; i++) if (score[i] > score[t]) t = i;
  const beats = []; for (; t >= 0; t = back[t]) beats.push(t);
  return beats.reverse();
}

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MAJ = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MIN = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
function corr(a, b) {
  const ma = mean(a), mb = mean(b); let s = 0, sa = 0, sb = 0;
  for (let i = 0; i < a.length; i++) { s += (a[i] - ma) * (b[i] - mb); sa += (a[i] - ma) ** 2; sb += (b[i] - mb) ** 2; }
  return s / Math.sqrt(sa * sb || 1);
}
function detectKey(chroma) {
  const avg = new Array(12).fill(0); chroma.forEach(c => c.forEach((v, i) => avg[i] += v));
  let best = { r: -2 };
  for (let k = 0; k < 12; k++) for (const [mode, prof] of [['major', MAJ], ['minor', MIN]]) {
    const rot = prof.map((_, i) => prof[(i - k + 12) % 12]), r = corr(avg, rot);
    if (r > best.r) best = { key: KEYS[k], mode, r };
  }
  return { key: best.key, mode: best.mode, confidence: +best.r.toFixed(2) };
}

/**
 * Full analysis. pcm: mono Float32Array at 22050 Hz. lengths: target segment lengths in seconds.
 */
export function analyze(pcm, { lengths = [15, 30] } = {}) {
  const F = features(pcm), full = onsetEnvelope(F.flux), lowEnv = onsetEnvelope(F.fluxLow);
  // beats follow the kick/bass first: full-band flux alone locks onto off-beat hats in most dance music
  const env = Float32Array.from(full, (v, i) => v * .5 + lowEnv[i]);
  const duration = pcm.length / SR, beatFrames = trackBeats(env, tempo(env));
  const beats = beatFrames.map(f => +at(f).toFixed(3));
  // tempo from the tracked beats (least squares) — far more precise than the autocorrelation peak
  const n = beats.length, mi = (n - 1) / 2, mt = mean(beats);
  let sxy = 0, sxx = 0; beats.forEach((t, i) => { sxy += (i - mi) * (t - mt); sxx += (i - mi) ** 2; });
  const bpm = n > 8 ? 60 / (sxy / sxx) : tempo(env);
  // steady tempo (residual < 25 ms): replace the frame-quantized beats with the fitted grid
  const b0 = mt - (sxy / sxx) * mi, resid = Math.sqrt(mean(beats.map((t, i) => (t - (b0 + i * sxy / sxx)) ** 2)));
  const steady = n > 8 && resid < .025;
  if (steady) {
    const per = 60 / bpm; let first = b0; while (first - per >= -.02) first -= per;
    beats.length = 0;
    for (let t = first; t < duration; t += per) if (t >= -.02) beats.push(+Math.max(0, t).toFixed(3));
  }

  // downbeats: the beat phase (mod 4) where the harmony changes most (chords and bass notes change on the one;
  // the loudest attack is often the backbeat snare on 2 and 4, so attacks alone pick the wrong phase)
  const fr = t => Math.max(0, Math.min(F.frames - 1, Math.round((t - LAG) * FPS)));
  const beatChroma = beats.map((t, i) => {
    const c = new Array(12).fill(0), e = beats[i + 1] ?? t + 60 / bpm;
    for (let f = fr(t); f < fr(e); f++) F.chroma[f].forEach((v, k) => c[k] += v);
    const nrm = Math.hypot(...c) || 1; return c.map(v => v / nrm);
  });
  const change = beatChroma.map((c, i) => i ? 1 - c.reduce((s, v, k) => s + v * beatChroma[i - 1][k], 0) : 0);
  const phaseScore = [0, 1, 2, 3].map(p => beats.reduce((s, t, i) => s + (i % 4 === p ? change[i] + .1 * lowEnv[fr(t)] : 0), 0));
  const phase = phaseScore.indexOf(Math.max(...phaseScore));
  const downbeats = beats.filter((_, i) => i % 4 === phase);

  // per-bar features (bar = downbeat → next downbeat)
  const bars = downbeats.map((t, i) => {
    const t1 = downbeats[i + 1] ?? Math.min(duration, t + 240 / bpm), a = Math.max(0, Math.floor((t - LAG) * FPS)), b = Math.max(a + 1, Math.floor((t1 - LAG) * FPS));
    const sl = arr => Array.prototype.slice.call(arr, a, b);
    const ch = new Array(12).fill(0); for (let f = a; f < b && f < F.frames; f++) F.chroma[f].forEach((v, k) => ch[k] += v);
    const chs = Math.max(...ch) || 1;
    return {
      start: t, end: +t1.toFixed(3),
      loud: db(mean(sl(F.rms).map(v => v * v))), low: db(mean(sl(F.low))), mid: db(mean(sl(F.mid))), high: db(mean(sl(F.high))),
      bright: mean(sl(F.cent)), density: mean(sl(env)), chroma: ch.map(v => v / chs)
    };
  });

  // energy 0..1 per bar: loudness + low end + density, scaled between the 5th and 95th percentiles
  const rawE = bars.map(b => b.loud + .5 * b.low + 6 * b.density);
  const e5 = pct(rawE, .05), e95 = pct(rawE, .95);
  const energy = rawE.map(v => +Math.max(0, Math.min(1, (v - e5) / (e95 - e5 || 1))).toFixed(3));

  // sections: novelty between the 4 bars before and after each bar line, peaks snapped to phrases (4 bars)
  const vec = b => [b.loud, b.low, b.mid, b.high, b.bright / 300, b.density * 4, ...b.chroma.map(v => v * 3)];
  const V = bars.map(vec), dims = V[0]?.length || 0;
  const mu = Array.from({ length: dims }, (_, d) => mean(V.map(v => v[d])));
  const sd = Array.from({ length: dims }, (_, d) => Math.sqrt(mean(V.map(v => (v[d] - mu[d]) ** 2))) || 1);
  const Z = V.map(v => v.map((x, d) => (x - mu[d]) / sd[d]));
  const W = 4, nov = bars.map((_, i) => {
    if (i < 2 || i > bars.length - 2) return 0;
    const avg = (a, b) => Array.from({ length: dims }, (_, d) => mean(Z.slice(Math.max(0, a), Math.min(bars.length, b)).map(z => z[d])));
    const A = avg(i - W, i), B = avg(i, i + W);
    return Math.sqrt(A.reduce((s, v, d) => s + (v - B[d]) ** 2, 0));
  });
  const thr = pct(nov, .8);
  let cuts = [0];
  for (let i = 4; i < bars.length - 3; i++) {
    const phrase = i % 4 === 0 ? 1.25 : 1;           // prefer phrase starts
    if (nov[i] * phrase >= thr && nov[i] >= nov[i - 1] && nov[i] >= (nov[i + 1] ?? 0) && i - cuts[cuts.length - 1] >= 4) cuts.push(i);
  }
  const sections = cuts.map((b0, k) => {
    const b1 = cuts[k + 1] ?? bars.length, e = mean(energy.slice(b0, b1));
    const slope = b1 - b0 > 1 ? (energy[b1 - 1] - energy[b0]) / (b1 - b0) : 0;
    return { start: bars[b0]?.start ?? 0, end: bars[b1 - 1]?.end ?? duration, bars: [b0, b1], energy: +e.toFixed(3), slope: +slope.toFixed(3) };
  });
  // labels: drop = a jump up into the loudest tier; build = rising energy right before a drop; break = a dip
  const hiE = pct(sections.map(s => s.energy), .66);
  sections.forEach((s, k) => {
    const p = sections[k - 1], nx = sections[k + 1];
    s.label = k === 0 ? 'intro' : k === sections.length - 1 && s.energy < hiE ? 'outro'
      : s.energy >= hiE && p && s.energy - p.energy > .2 ? 'drop'
      : nx && nx.energy - s.energy > .2 && (s.slope > 0 || s.energy < nx.energy) ? 'build'
      : p && nx && s.energy < p.energy - .15 && s.energy < nx.energy - .1 ? 'break' : s.energy >= hiE ? 'high' : 'mid';
  });
  const drops = sections.filter(s => s.label === 'drop').map(s => s.start);
  const builds = sections.filter(s => s.label === 'build').map(s => ({ start: s.start, end: s.end }));

  // key and measurable character. Emotional valence (bright/dark, happy/sad) is NOT derived: spectral features
  // do not predict it (bass-heavy "bright" tracks measure darker than "aggressive" ones). Take the emotional
  // read from the user, the title or the genre — see references/analysis.md.
  const key = detectKey(F.chroma);
  const meanE = mean(energy), dyn = pct(energy, .9) - pct(energy, .1), density = mean(bars.map(b => b.density));
  const arousal = Math.max(0, Math.min(1, .4 * (bpm - 70) / 110 + .35 * meanE + .25 * Math.min(1, density / 1.2)));
  const words = [
    arousal > .66 ? 'driving' : arousal > .4 ? 'steady' : 'calm',
    bpm >= 140 ? 'fast' : bpm < 95 ? 'slow' : null,
    dyn > .5 ? 'dramatic' : dyn < .25 ? 'even' : null,
    drops.length ? 'with drops' : builds.length ? 'building' : null,
    key.confidence >= .7 ? `${key.mode} key` : null
  ].filter(Boolean);
  const mood = { arousal: +arousal.toFixed(2), dynamics: +dyn.toFixed(2), words };

  // segments: whole bars, start on a section start or phrase line; prefer energy, a drop inside, clean edges
  const barLen = 240 / bpm, sectionBars = new Set(sections.map(s => s.bars[0])), sectionEnds = new Set(sections.map(s => s.bars[1]));
  const segments = {};
  for (const L of lengths) {
    const nb = Math.max(2, Math.round(L / barLen)), cands = [];
    for (let b0 = 0; b0 + nb <= bars.length; b0++) {
      if (!sectionBars.has(b0) && b0 % 4) continue;
      const b1 = b0 + nb, e = energy.slice(b0, b1);
      const dropIn = sections.find(s => s.label === 'drop' && s.bars[0] > b0 && s.bars[0] < b1 - 1);
      const s = mean(e) + .35 * (Math.max(...e) - Math.min(...e)) + (dropIn ? .4 : 0)
        + (sectionBars.has(b0) ? .15 : 0) + (sectionEnds.has(b1) ? .15 : 0) - (b0 === 0 && energy[0] < .2 ? .3 : 0);
      const why = [dropIn && `drop at ${(dropIn.start - bars[b0].start).toFixed(2)} s`, sectionBars.has(b0) && 'starts on a section',
        sectionEnds.has(b1) && 'ends on a section', `mean energy ${mean(e).toFixed(2)}`].filter(Boolean).join(', ');
      cands.push({ start: bars[b0].start, duration: +(nb * barLen).toFixed(3), bars: nb, score: +s.toFixed(3), why });
    }
    // top 3, not overlapping by more than half
    const pick = [];
    for (const c of cands.sort((a, b) => b.score - a.score)) {
      if (pick.every(p => Math.abs(p.start - c.start) > c.duration / 2)) pick.push(c);
      if (pick.length === 3) break;
    }
    segments[L] = pick;
  }

  return {
    duration: +duration.toFixed(3), bpm: +bpm.toFixed(2), beat: +(60 / bpm).toFixed(4),
    key, mood, beats, downbeats,
    bars: bars.map((b, i) => ({ start: b.start, end: b.end, energy: energy[i] })),
    sections, drops, builds, segments
  };
}

export const SAMPLE_RATE = SR;
export const setLag = v => { LAG = v; };

