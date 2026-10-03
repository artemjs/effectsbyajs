// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Bohdanov
// Project layout: everything effectsbyajs owns lives in <project>/.effectsbyajs/
//   pipeline/          — the film engine (copied from this plugin)
//   effects/<name>/    — installed effects
//   effects.json       — installed effect versions

import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const RUNTIME = path.dirname(fileURLToPath(import.meta.url));
export const VERSION = JSON.parse(await readFile(path.join(RUNTIME, '..', '.claude-plugin', 'plugin.json'), 'utf8')).version;

export const paths = root => {
  const home = path.join(path.resolve(root), '.effectsbyajs');
  return { root: path.resolve(root), home, pipeline: path.join(home, 'pipeline'), effects: path.join(home, 'effects'), manifest: path.join(home, 'effects.json') };
};

/** Copies the pipeline into the project if it is missing or older than this plugin. Returns true if it wrote. */
export async function ensurePipeline(root) {
  const p = paths(root), stamp = path.join(p.pipeline, 'VERSION');
  if (existsSync(stamp) && (await readFile(stamp, 'utf8')).trim() === VERSION) return false;
  await mkdir(p.pipeline, { recursive: true });
  await cp(path.join(RUNTIME, 'pipeline'), p.pipeline, { recursive: true });
  await writeFile(stamp, VERSION + '\n');
  return true;
}

export async function readManifest(root) {
  const f = paths(root).manifest;
  return existsSync(f) ? JSON.parse(await readFile(f, 'utf8')) : { effects: {} };
}
export async function writeManifest(root, m) {
  await mkdir(paths(root).home, { recursive: true });
  await writeFile(paths(root).manifest, JSON.stringify(m, null, 2) + '\n');
}

/** Resolves a package from the project first, then from the plugin. Throws with an install hint. */
export function requireFrom(root, name) {
  for (const base of [path.resolve(root), RUNTIME]) {
    try { return createRequire(path.join(base, 'noop.js')).resolve(name); } catch {}
  }
  throw new Error(`"${name}" not found. Install it in the project: npm i -D ${name}`);
}

/** Minimal --flag value / --flag parsing. Returns { _: positional, flag: value|true }. */
export function args(argv = process.argv.slice(2)) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { out._.push(a); continue; }
    const k = a.slice(2), v = argv[i + 1];
    if (v === undefined || v.startsWith('--')) out[k] = true; else { out[k] = v; i++; }
  }
  return out;
}
