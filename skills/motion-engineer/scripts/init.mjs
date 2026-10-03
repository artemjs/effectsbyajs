#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Bohdanov
// Sets a project up for films.
//   node init.mjs [dir]              new standalone film: index.html + film/ + BRIEF.md + package.json
//   node init.mjs [dir] --integrate  existing app (React, Vite, Next…): only installs .effectsbyajs/pipeline
// Never overwrites existing files.

import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { args, ensurePipeline, paths } from '../../../runtime/project.mjs';

const a = args(), root = path.resolve(a._[0] || '.');
const template = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'template');
await mkdir(root, { recursive: true });

const wrote = await ensurePipeline(root);
console.log(`${wrote ? 'installed' : 'up to date'}: ${path.relative(root, paths(root).pipeline)}/`);

if (!a.integrate) {
  for (const f of ['index.html', 'film', 'BRIEF.md']) {
    const dst = path.join(root, f);
    if (existsSync(dst)) { console.log(`kept existing: ${f}`); continue; }
    await cp(path.join(template, f), dst, { recursive: true });
    console.log(`created: ${f}`);
  }
}

// puppeteer drives render.mjs / sheet.mjs; it belongs to the project, not to the app bundle
const pkgPath = path.join(root, 'package.json');
const pkg = existsSync(pkgPath) ? JSON.parse(await readFile(pkgPath, 'utf8'))
  : { name: path.basename(root).toLowerCase().replace(/[^a-z0-9-]+/g, '-'), private: true, type: 'module' };
if (!pkg.dependencies?.puppeteer && !pkg.devDependencies?.puppeteer) {
  pkg.devDependencies = { ...pkg.devDependencies, puppeteer: '^23.0.0' };
  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log('added devDependency: puppeteer — run npm install');
}

const ignore = path.join(root, '.gitignore');
const lines = existsSync(ignore) ? (await readFile(ignore, 'utf8')).split('\n') : [];
const need = ['out/', 'node_modules/'].filter(l => !lines.includes(l));
if (need.length) { await writeFile(ignore, [...lines.filter(Boolean), ...need].join('\n') + '\n'); console.log(`.gitignore: ${need.join(' ')}`); }
