#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Bohdanov
// Look at an SVG artwork the way films will show it — then judge it. Writes into --out (default out/look/):
//   still.png    the artwork rendered by the morph effect (what films draw), full size
//   compare.png  left: the browser's own SVG render · right: the morph render — differences = unsupported SVG features
//   sketch.png   drawOn (sketch → paint) at 8 moments
//   build.png    play (piece-by-piece build, then idle) at 8 moments
//   zoom-tl/tr/bl/br.png  the still rendered at 2× and cut into quadrants — slivers, seams and straight edges only show here
//   thumb.png    270 px wide — does it still read?
//
//   node look.mjs <artwork.svg> [--root .] [--out out/look] [--w 1080] [--h 1350]
// The project needs the morph effect (useeffects: effects.mjs add morph) and puppeteer. With data-waterline on the root
// (and the reflection effect installed) still.png and build.png show REAL reflections: depth layers mirrored about
// their own waterlines, front layer (data-layer="front") on top.

import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { serve } from '../../../runtime/serve.mjs';
import { args, requireFrom } from '../../../runtime/project.mjs';

const a = args(), file = a._[0];
if (!file) { console.log('usage: look.mjs <artwork.svg> [--root .] [--out out/look]'); process.exit(1); }
const root = path.resolve(a.root || '.'), out = path.resolve(root, a.out || 'out/look'), W0 = +(a.w || 1080), H0 = +(a.h || 1350);
// the file may be given relative to the cwd or to --root
const abs = existsSync(path.resolve(file)) ? path.resolve(file) : path.resolve(root, file);
if (!existsSync(abs)) { console.error(`file not found: ${file} (looked in ${process.cwd()} and ${root})`); process.exit(1); }
const rel = path.relative(root, abs).split(path.sep).join('/');
if (rel.startsWith('..')) { console.error('the svg must be inside --root (it is served from there)'); process.exit(1); }

const { default: puppeteer } = await import(pathToFileURL(requireFrom(root, 'puppeteer')).href);
const server = await serve(root, { '/__look.html': (req, res) => { res.writeHead(200, { 'content-type': 'text/html' }); res.end('<!doctype html><canvas id=c></canvas>'); } });
const browser = await puppeteer.launch({ headless: true }), page = await browser.newPage();
const errors = []; page.on('pageerror', e => errors.push(e.message));
await page.goto(`${server.url}/__look.html`);

const frame = (mode, x, W = W0, H = H0) => page.evaluate(async ({ rel, mode, x, W, H }) => {
  const m = await import('/.effectsbyajs/effects/morph/index.mjs');
  const svg = await (await fetch('/' + rel)).text();
  const c = document.getElementById('c'); c.width = mode === 'compare' ? W * 2 : W; c.height = H;
  const ctx = c.getContext('2d'); ctx.fillStyle = '#141413'; ctx.fillRect(0, 0, c.width, c.height);
  const box = [40, 40, W - 80, H - 80], art = m.fit(svg, box);
  // real reflections when the artwork marks a waterline and the reflection effect is installed
  const rf = /data-waterline=/.test(svg) && mode !== 'sketch' && mode !== 'compare'
    ? await import('/.effectsbyajs/effects/reflection/index.mjs').catch(() => null) : null;
  if (rf) {
    const vb = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement.getAttribute('viewBox').split(/[\s,]+/).map(Number);
    const { layers, front, horizon } = rf.splitLayers(svg), Y = y => rf.fitY(vb, box, y);
    const paint = (c, s) => mode === 'still' ? m.drawShape(c, m.fit(s, box)) : m.play(c, m.fit(s, box), x, { step: .5, len: .8 });
    for (const L of layers) {
      paint(ctx, L.svg);
      if (Number.isFinite(L.y)) rf.reflect(ctx, mode === 'still' ? 0 : x, { y: Y(L.y), horizon: Y(horizon), x0: box[0], x1: box[0] + box[2], depth: box[1] + box[3] - Y(L.y), clip: c => c.rect(...box), source: c => paint(c, L.svg) });
    }
    paint(ctx, front);
  } else if (mode === 'still') m.drawShape(ctx, art);
  else if (mode === 'compare') {
    const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); await img.decode();
    const s = Math.min((W - 80) / img.width, (H - 80) / img.height);
    ctx.drawImage(img, (W - img.width * s) / 2, (H - img.height * s) / 2, img.width * s, img.height * s);
    ctx.translate(W, 0); m.drawShape(ctx, art);
  } else if (mode === 'sketch') m.drawOn(ctx, art, x, { group: 'piece', stagger: .35, fillLen: .4, paint: 'after', sketch: '#faf9f5', width: 3, head: 7, headColor: '#d97757' });
  else m.play(ctx, art, x, { step: .5, len: .8 });
  return c.toDataURL('image/png');
}, { rel, mode, x, W, H }).then(u => Buffer.from(u.split(',')[1], 'base64'));

// checks first: invalid XML (browsers refuse it, the morph parser may not) and geometry outside the viewBox
// (morph does not clip — anything outside shows up outside the art box in films)
const check = await page.evaluate(async rel => {
  const svg = await (await fetch('/' + rel)).text();
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml'), err = doc.querySelector('parsererror');
  if (err) return { xml: err.textContent.trim().split('\n').slice(0, 2).join(' ') };
  const m = await import('/.effectsbyajs/effects/morph/index.mjs');
  const vb = (doc.documentElement.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number), b = m.bounds(svg);
  return { vb, b };
}, rel);
if (check.xml) { console.error(`invalid SVG/XML — fix it first (e.g. attributes need values: data-piece=""):\n${check.xml}`); await browser.close(); server.close(); process.exit(1); }
const warnings = [];
if (check.vb.length === 4 && check.b) {
  const [x, y, w, h] = check.vb, { b } = check, over = Math.max(x - b.x, y - b.y, b.x + b.w - (x + w), b.y + b.h - (y + h));
  if (over > 1) warnings.push(`geometry reaches ${over.toFixed(0)} units outside the viewBox (morph does not clip) — clamp it to the frame`);
}

mkdirSync(out, { recursive: true });
writeFileSync(path.join(out, 'still.png'), await frame('still'));
writeFileSync(path.join(out, 'compare.png'), await frame('compare'));
// detail and read checks: a 2× render cut into quadrants, and a thumbnail
const big = path.join(out, 'big.png');
writeFileSync(big, await frame('still', 0, W0 * 2, H0 * 2));
for (const [n, cx, cy] of [['tl', 0, 0], ['tr', W0, 0], ['bl', 0, H0], ['br', W0, H0]])
  spawnSync('ffmpeg', ['-y', '-v', 'error', '-i', big, '-vf', `crop=${W0}:${H0}:${cx}:${cy}`, path.join(out, `zoom-${n}.png`)]);
spawnSync('ffmpeg', ['-y', '-v', 'error', '-i', path.join(out, 'still.png'), '-vf', 'scale=270:-1', path.join(out, 'thumb.png')]);
rmSync(big);
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

console.log(`look: ${out}/  still.png · thumb.png · zoom-tl/tr/bl/br.png (2×) · compare.png (browser | morph) · sketch.png · build.png (until ${end.toFixed(1)} s + idle)`);
if (warnings.length) console.log('WARNING: ' + warnings.join('\nWARNING: '));
if (errors.length) console.log('page errors:\n' + errors.join('\n'));
