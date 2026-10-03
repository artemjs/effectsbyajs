#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Bohdanov
// Starts a local server for the project on a random free port and opens the effects showcase in the browser.
// The showcase imports every installed effect's showcase.mjs straight from .effectsbyajs/effects/.
//
//   node hostShowcase.mjs [--root .] [--effect <name>] [--no-open]
// Runs until stopped (Ctrl-C) — start it in the background.

import { readdir } from 'node:fs/promises';
import { existsSync, createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve, openBrowser } from '../../../runtime/serve.mjs';
import { args, paths } from '../../../runtime/project.mjs';

const a = args(), root = path.resolve(a.root || '.');
const page = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'showcase.html');
const fx = paths(root).effects;

const server = await serve(root, {
  '/showcase.html': (req, res) => { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); createReadStream(page).pipe(res); },
  // installed effects that ship a showcase
  '/__effects.json': async (req, res) => {
    const names = existsSync(fx) ? (await readdir(fx, { withFileTypes: true }))
      .filter(d => d.isDirectory() && existsSync(path.join(fx, d.name, 'showcase.mjs'))).map(d => d.name) : [];
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    res.end(JSON.stringify(names));
  }
});

const url = `${server.url}/showcase.html${a.effect ? `?effect=${encodeURIComponent(a.effect)}` : ''}`;
console.log(`showcase: ${url}\nserving: ${root}\nstop with Ctrl-C`);
if (!a['no-open']) openBrowser(url);
