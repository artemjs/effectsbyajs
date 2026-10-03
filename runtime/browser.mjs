// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Bohdanov
// Opens a film page in headless Chrome (Puppeteer) and waits until it is ready to seek.

import { pathToFileURL } from 'node:url';
import { serve } from './serve.mjs';
import { requireFrom } from './project.mjs';

/**
 * o: { root, page = 'index.html', url } — either serve `root` and open `page`,
 * or open an already running dev server `url` (React/Vite/Next projects).
 * The page must call expose(film) from the pipeline.
 */
export async function openFilm({ root, page = 'index.html', url }) {
  const { default: puppeteer } = await import(pathToFileURL(requireFrom(root, 'puppeteer')).href);
  const server = url ? null : await serve(root);
  const target = new URL(url || `${server.url}/${page}`);
  target.searchParams.set('render', '1');

  const browser = await puppeteer.launch({ headless: true });
  const tab = await browser.newPage();
  const errors = [];
  tab.on('pageerror', e => errors.push(e.message));
  tab.on('console', m => m.type() === 'error' && errors.push(m.text()));
  await tab.goto(target.href);
  try {
    // the predicate must return a plain boolean: a returned Promise would be awaited and resolve to undefined
    await tab.waitForFunction(() => !!window.filmReady, { timeout: 15000 });
  } catch {
    await browser.close(); server?.close();
    throw new Error(`film did not call expose(film) at ${target.href}\n${errors.join('\n')}`);
  }
  await tab.evaluate(() => window.filmReady);
  const info = await tab.evaluate(() => ({ duration: window.DURATION, fps: window.FPS, bpm: window.__film.bpm, w: window.__film.W, h: window.__film.H }));
  await tab.setViewport({ width: info.w, height: info.h, deviceScaleFactor: 1 });

  const frame = t => tab.evaluate(t => { window.seek(t); return window.__film.canvas.toDataURL('image/png'); }, t)
    .then(u => Buffer.from(u.split(',')[1], 'base64'));
  const wav = sr => tab.evaluate(sr => window.exportWav(sr), sr).then(b => b && Buffer.from(b, 'base64'));
  const close = async () => { await browser.close(); server?.close(); };
  return { info, frame, wav, errors, close };
}
