#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Bohdanov
// Full render: seek(t) per frame → PNG → ffmpeg. H.264 High, yuv420p, BT.709, AAC 320k. Then measures loudness.
//
// node render.mjs [--root .] [--page index.html | --url http://localhost:5173/film] [--out out/film.mp4] [--crf 16]

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
const wavPath = out.replace(/\.mp4$/, '') + '.wav';
if (wav) writeFileSync(wavPath, wav);
else console.log('film has no audio — rendering silent video');

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

let lufs = 'no audio';
if (wav) {
  const r = spawnSync('ffmpeg', ['-nostats', '-i', out, '-af', 'ebur128', '-f', 'null', '-'], { encoding: 'utf8' });
  lufs = (r.stderr.match(/I:\s+(-?[\d.]+) LUFS/g) || []).pop()?.replace(/\s+/g, ' ') ?? 'unmeasured';
}
console.log(`\ndone: ${out}\n${duration}s · ${fps} fps · ${total} frames · loudness ${lufs} (target −14 LUFS)`);
