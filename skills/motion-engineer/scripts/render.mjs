#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Bohdanov
// Full render: seek(t) per frame → PNG → ffmpeg. H.264 High, yuv420p, BT.709, AAC 320k. Then measures loudness.
// The film's sound is normalized to −14 LUFS / −1.5 dBTP true peak (two-pass loudnorm) before muxing, so the
// AAC never overshoots — skip with --raw-audio.
//
// node render.mjs [--root .] [--page index.html | --url http://localhost:5173/film] [--out out/film.mp4] [--crf 16]
//                 [--audio-only]   just the sound: normalize, AAC round-trip, print LUFS / true peak (seconds, not minutes)
//                 [--raw-audio]

import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { openFilm } from '../../../runtime/browser.mjs';
import { args } from '../../../runtime/project.mjs';

const a = args(), root = path.resolve(a.root || '.');
const out = path.resolve(root, a.out || 'out/film.mp4'), crf = String(a.crf || 16);
mkdirSync(path.dirname(out), { recursive: true });

const film = await openFilm({ root, page: a.page, url: a.url });
const { duration, fps } = film.info, total = Math.round(duration * fps);

const wav = await film.wav(48000);
const base = out.replace(/\.mp4$/, ''), rawPath = base + '.raw.wav', wavPath = base + '.wav';
if (wav) {
  writeFileSync(rawPath, wav);
  if (a['raw-audio']) writeFileSync(wavPath, wav); else normalize(rawPath, wavPath);
} else console.log('film has no audio — rendering silent video');

if (a['audio-only']) {
  await film.close();
  if (!wav) process.exit(0);
  const m4a = base + '.m4a';
  spawnSync('ffmpeg', ['-y', '-v', 'error', '-i', wavPath, '-c:a', 'aac', '-b:a', '320k', m4a]);
  console.log(`audio: ${wavPath} (AAC check: ${m4a})\n${measure(m4a)}`);
  process.exit(0);
}

const ff = spawn('ffmpeg', [
  '-y', '-loglevel', 'error',
  '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
  ...(wav ? ['-i', wavPath] : []),
  '-vf', 'scale=out_color_matrix=bt709,format=yuv420p',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', crf, '-profile:v', 'high',
  '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
  ...(wav ? ['-c:a', 'aac', '-b:a', '320k', '-shortest'] : []),
  '-movflags', '+faststart', out
], { stdio: ['pipe', 'inherit', 'inherit'] });

for (let i = 0; i < total; i++) {
  if (!ff.stdin.write(await film.frame(i / fps))) await once(ff.stdin, 'drain');
  if (i % fps === 0) process.stdout.write(`\rframe ${i}/${total}`);
}
ff.stdin.end();
const [code] = await once(ff, 'close');
await film.close();
if (film.errors.length) console.warn('\npage errors:\n' + film.errors.join('\n'));
if (code !== 0) { console.error(`\nffmpeg exited with ${code}`); process.exit(1); }

console.log(`\ndone: ${out}\n${duration}s · ${fps} fps · ${total} frames · ${wav ? measure(out) : 'no audio'}`);

/** Two-pass EBU R128 normalization to −14 LUFS (linear — no pumping), then an oversampled limiter for true peak. */
function normalize(src, dst) {
  // the limiter costs 0–2 LU on punchy material: measure the result once and aim the second run higher by that
  normalizeTo(src, dst, -14);
  const got = lufsOf(dst);
  if (Number.isFinite(got) && Math.abs(got + 14) > .3) normalizeTo(src, dst, Math.min(-9, -14 + (-14 - got)));
}
function lufsOf(file) {
  const r = spawnSync('ffmpeg', ['-nostats', '-i', file, '-af', 'ebur128', '-f', 'null', '-'], { encoding: 'utf8' });
  return +(r.stderr.match(/I:\s+(-?[\d.]+) LUFS/g) || []).pop()?.match(/-?[\d.]+/)[0];
}

function normalizeTo(src, dst, I) {
  const target = `I=${I.toFixed(1)}:TP=-1.5:LRA=11`;
  const p1 = spawnSync('ffmpeg', ['-nostats', '-i', src, '-af', `loudnorm=${target}:print_format=json`, '-f', 'null', '-'], { encoding: 'utf8' });
  const j = JSON.parse(p1.stderr.match(/\{[^{}]*"input_i"[^{}]*\}/)[0]);
  const p2 = spawnSync('ffmpeg', ['-y', '-v', 'error', '-i', src, '-af',
    `loudnorm=${target}:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true,` +
    // true-peak safety: limit on a 4× oversampled signal with headroom for the AAC encoder's overshoot
    'aresample=192000,alimiter=limit=0.7:attack=1:release=60:level=false,aresample=48000',
    '-ar', '48000', dst], { encoding: 'utf8' });
  if (p2.status !== 0) throw new Error(`loudnorm failed: ${p2.stderr}`);
}

function measure(file) {
  const r = spawnSync('ffmpeg', ['-nostats', '-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8' });
  const lufs = +(r.stderr.match(/I:\s+(-?[\d.]+) LUFS/g) || []).pop()?.match(/-?[\d.]+/)[0];
  const peak = +(r.stderr.match(/Peak:\s+(-?[\d.]+) dBFS/g) || []).pop()?.match(/-?[\d.]+/)[0];
  let s = `loudness ${lufs} LUFS (target −14) · true peak ${peak} dBTP (max −1)`;
  if (peak > -1) s += '\nWARNING: true peak above −1 dBTP after encoding — lower the mix (accents/master) and re-run --audio-only.';
  if (Math.abs(lufs + 14) > 1.5) s += '\nWARNING: loudness is more than 1.5 LU off −14.';
  return s;
}
