#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Bohdanov
// Contact sheet: one frame per beat (or the given times) tiled into one PNG — LOOK at it before a full render.
//
// node sheet.mjs [--root .] [--page index.html | --url ...] [--out out/sheet.png]
//                [--offset .2] [--times 1.5,2.25,...] [--cuts] [--cols 8] [--tile 216] [--frames dir]
// --cuts: frames around every scene start and the loop seam instead of one per beat. The per-beat sheet
//         samples after the hit has settled, so empty frames, jumps and glitches at cuts only show up here.

import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { openFilm } from '../../../runtime/browser.mjs';
import { args } from '../../../runtime/project.mjs';

const a = args(), root = path.resolve(a.root || '.');
const out = path.resolve(root, a.out || 'out/sheet.png');
const film = await openFilm({ root, page: a.page, url: a.url });
const { duration, bpm, cuts, w, h } = film.info;

// default: every beat, slightly after the hit (the hit frame itself is mid-slam)
const beat = 60 / bpm, offset = +(a.offset ?? .2);
const around = c => [-.1, .02, .08, .16, .3].map(d => +(((c + d) % duration + duration) % duration).toFixed(3));
const times = a.times ? String(a.times).split(',').map(Number)
  : a.cuts ? [...cuts, 0].flatMap(around)
  : Array.from({ length: Math.round(duration / beat) }, (_, i) => +(i * beat + offset).toFixed(3));

const dir = path.resolve(root, a.frames || out.replace(/\.png$/, '') + '-frames');   // one dir per sheet
rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
for (const [i, t] of times.entries()) writeFileSync(path.join(dir, `${String(i).padStart(4, '0')}.png`), await film.frame(t));
await film.close();

const cols = Math.min(+(a.cols || (a.cuts ? 5 : 8)), times.length), rows = Math.ceil(times.length / cols);
const tw = +(a.tile || 216), th = Math.round(tw * h / w);
const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-pattern_type', 'glob', '-i', path.join(dir, '*.png'),
  '-vf', `scale=${tw}:${th},tile=${cols}x${rows}`, '-frames:v', '1', out], { stdio: 'inherit' });
if (r.status !== 0) process.exit(1);
if (film.errors.length) console.warn('page errors:\n' + film.errors.join('\n'));
console.log(`sheet: ${out}  (${times.length} frames, ${cols}×${rows}, left→right, top→bottom)\ntimes: ${times.join(', ')}\nfull-size frames: ${dir}/NNNN.png (N = position in times) — open one when a tile looks wrong`);
