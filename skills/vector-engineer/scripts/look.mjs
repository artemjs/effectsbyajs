#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Bohdanov
// Look at an SVG artwork the way films will show it — then judge it. Writes into --out (default out/look/):
//   still.png    the artwork rendered by the morph effect (what films draw), full size
//   compare.png  left: the browser's own SVG render · right: the morph render — differences = unsupported SVG features
//   sketch.png   drawOn (sketch → paint) at 8 moments
//   build.png    play (piece-by-piece build, then idle) at 8 moments
//
//   node look.mjs <artwork.svg> [--root .] [--out out/look] [--w 1080] [--h 1350]
// The project needs the morph effect (useeffects: effects.mjs add morph) and puppeteer.

import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { serve } from '../../../runtime/serve.mjs';
import { args, requireFrom } from '../../../runtime/project.mjs';

const a = args(), file = a._[0];
if (!file) { console.log('usage: look.mjs <artwork.svg> [--root .] [--out out/look]'); process.exit(1); }
const root = path.resolve(a.root || '.'), out = path.resolve(root, a.out || 'out/look'), W = +(a.w || 1080), H = +(a.h || 1350);
const rel = path.relative(root, path.resolve(file)).split(path.sep).join('/');
if (rel.startsWith('..')) { console.error('the svg must be inside --root (it is served from there)'); process.exit(1); }

const { default: puppeteer } = await import(pathToFileURL(requireFrom(root, 'puppeteer')).href);
const server = await serve(root, { '/__look.html': (req, res) => { res.writeHead(200, { 'content-type': 'text/html' }); res.end('<!doctype html><canvas id=c></canvas>'); } });
const browser = await puppeteer.launch({ headless: true }), page = await browser.newPage();
const errors = []; page.on('pageerror', e => errors.push(e.message));
await page.goto(`${server.url}/__look.html`);

const frame = (mode, x) => page.evaluate(async ({ rel, mode, x, W, H }) => {
  const m = await import('/.effectsbyajs/effects/morph/index.mjs');
  const svg = await (await fetch('/' + rel)).text();
  const c = document.getElementById('c'); c.width = mode === 'compare' ? W * 2 : W; c.height = H;
  const ctx = c.getContext('2d'); ctx.fillStyle = '#141413'; ctx.fillRect(0, 0, c.width, c.height);
  const art = m.fit(svg, [40, 40, W - 80, H - 80]);
  if (mode === 'still') m.drawShape(ctx, art);
  else if (mode === 'compare') {
    const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); await img.decode();
    const s = Math.min((W - 80) / img.width, (H - 80) / img.height);
    ctx.drawImage(img, (W - img.width * s) / 2, (H - img.height * s) / 2, img.width * s, img.height * s);
    ctx.translate(W, 0); m.drawShape(ctx, art);
  } else if (mode === 'sketch') m.drawOn(ctx, art, x, { group: 'piece', stagger: .35, fillLen: .4, paint: 'after', sketch: '#faf9f5', width: 3, head: 7, headColor: '#d97757' });
  else m.play(ctx, art, x, { step: .5, len: .8 });
  return c.toDataURL('image/png');
}, { rel, mode, x, W, H }).then(u => Buffer.from(u.split(',')[1], 'base64'));

mkdirSync(out, { recursive: true });
writeFileSync(path.join(out, 'still.png'), await frame('still'));
writeFileSync(path.join(out, 'compare.png'), await frame('compare'));
const sheet = async (mode, xs, name) => {
  const dir = path.join(out, name + '-frames'); rmSync(dir, { recursive: true, force: true }); mkdirSync(dir);
  for (const [i, x] of xs.entries()) writeFileSync(path.join(dir, `${String(i).padStart(2, '0')}.png`), await frame(mode, x));
  spawnSync('ffmpeg', ['-y', '-v', 'error', '-pattern_type', 'glob', '-i', path.join(dir, '*.png'),
    '-vf', `scale=270:-1,tile=${xs.length}x1`, '-frames:v', '1', path.join(out, name + '.png')]);
};
await sheet('sketch', [.06, .15, .25, .35, .45, .6, .8, 1], 'sketch');
const { end } = await page.evaluate(async rel => {
  const m = await import('/.effectsbyajs/effects/morph/index.mjs');
  const c = document.createElement('canvas'); return m.play(c.getContext('2d'), await (await fetch('/' + rel)).text(), 0, { step: .5, len: .8 });
}, rel);
await sheet('build', Array.from({ length: 8 }, (_, i) => +((end + 1) * (i + 1) / 8).toFixed(2)), 'build');
await browser.close(); server.close();

console.log(`look: ${out}/  still.png · compare.png (browser | morph) · sketch.png · build.png (until ${end.toFixed(1)} s + idle)`);
if (errors.length) console.log('page errors:\n' + errors.join('\n'));
