#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Bohdanov
// Analyzes a music track for a film: tempo, beat grid, downbeats, energy per bar, sections (intro/build/drop/
// break/outro), key, mood, and the best segments for the requested video lengths.
//
//   node analyze.mjs <track> [--length 15,30] [--out music.json] [--root .] [--clicks clicks.mp3]
// Writes music.json and prints a summary. Needs ffmpeg (decoding).
// --clicks writes the track with a click on every detected beat (higher on downbeats) — listen to it to check
// the grid by ear; analysis cannot hear, a person can in ten seconds.

import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { analyze, SAMPLE_RATE } from './analysis.mjs';
import { args } from '../../../runtime/project.mjs';

const a = args(), track = a._[0];
if (!track) { console.log('usage: analyze.mjs <track> [--length 15,30] [--out music.json]'); process.exit(1); }
const root = path.resolve(a.root || '.'), out = path.resolve(root, a.out || 'music.json');
const lengths = String(a.length || '15,30').split(',').map(Number);

const r = spawnSync('ffmpeg', ['-v', 'error', '-i', track, '-ac', '1', '-ar', String(SAMPLE_RATE), '-f', 'f32le', '-'],
  { maxBuffer: 1 << 30 });
if (r.status !== 0) { console.error(`ffmpeg could not decode ${track}: ${r.stderr}`); process.exit(1); }
const pcm = new Float32Array(r.stdout.buffer, r.stdout.byteOffset, r.stdout.length / 4);

const m = analyze(pcm, { lengths });
// loudness of each suggested segment → the gain that brings it to −14 LUFS (pass it to loadTrack)
for (const list of Object.values(m.segments)) for (const s of list) {
  const r2 = spawnSync('ffmpeg', ['-nostats', '-ss', String(s.start), '-t', String(s.duration), '-i', track, '-af', 'ebur128', '-f', 'null', '-'], { encoding: 'utf8' });
  const lufs = +(r2.stderr.match(/I:\s+(-?[\d.]+) LUFS/g) || []).pop()?.match(/-?[\d.]+/)[0];
  if (Number.isFinite(lufs)) { s.lufs = lufs; s.gainDb = +(-14 - lufs).toFixed(1); }
}
m.source = path.relative(path.dirname(out), path.resolve(track));
mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(m, null, 1) + '\n');

if (a.clicks) {
  // click track at 44.1 kHz: 1.5 kHz on beats, 2.5 kHz louder on downbeats, 25 ms decaying sine
  const sr = 44100, n = Math.ceil(m.duration * sr), buf = Buffer.alloc(n * 4), down = new Set(m.downbeats);
  for (const t of m.beats) {
    const hz = down.has(t) ? 2500 : 1500, g = down.has(t) ? .5 : .3, s0 = Math.round(t * sr);
    for (let i = 0; i < sr * .025 && s0 + i < n; i++)
      buf.writeFloatLE(buf.readFloatLE((s0 + i) * 4) + g * Math.sin(2 * Math.PI * hz * i / sr) * Math.exp(-i / (sr * .006)), (s0 + i) * 4);
  }
  const clicksOut = path.resolve(root, a.clicks);
  const c = spawnSync('ffmpeg', ['-y', '-v', 'error', '-i', track, '-f', 'f32le', '-ar', String(sr), '-ac', '1', '-i', '-',
    '-filter_complex', '[0:a]volume=0.7[m];[m][1:a]amix=inputs=2:normalize=0', clicksOut], { input: buf, maxBuffer: 1 << 30 });
  if (c.status !== 0) console.error(`click track failed: ${c.stderr}`); else console.log(`clicks: ${clicksOut}`);
}

const f = s => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
console.log(`${path.basename(track)} — ${f(m.duration)}
tempo ${m.bpm} BPM (beat ${m.beat} s) · ${m.beats.length} beats · ${m.downbeats.length} bars · first downbeat ${m.downbeats[0]} s
key ${m.key.key} ${m.key.mode} (confidence ${m.key.confidence}) · character: ${m.mood.words.join(', ')} (arousal ${m.mood.arousal}, dynamics ${m.mood.dynamics})
sections:`);
for (const s of m.sections) console.log(`  ${f(s.start)}–${f(s.end)}  ${s.label.padEnd(6)} energy ${s.energy.toFixed(2)}  bars ${s.bars[0]}–${s.bars[1]}`);
for (const [L, list] of Object.entries(m.segments)) {
  console.log(`best ~${L} s segments:`);
  for (const c of list) console.log(`  start ${c.start} s, ${c.duration} s (${c.bars} bars) — ${c.why}${c.gainDb !== undefined ? ` · ${c.lufs} LUFS → gainDb ${c.gainDb}` : ''}`);
}
console.log(`→ ${out}`);
