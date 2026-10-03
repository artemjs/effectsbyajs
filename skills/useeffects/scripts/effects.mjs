#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Bohdanov
// Effects library client. Effects come from the registry as one .tar.gz each and are unpacked into
// <project>/.effectsbyajs/effects/<name>/. Every archive is checked against the sha256 in the index.
//
//   node effects.mjs list                     registry catalog (✓ = installed)
//   node effects.mjs installed                what this project has
//   node effects.mjs add <name...>            install with dependencies (+ the pipeline they import)
//   node effects.mjs update [name...]         reinstall newer versions (all installed if no names)
//   node effects.mjs remove <name...>
// Options: --root <project> (default .)  --registry <url|dir> (default $EFFECTSBYAJS_REGISTRY or
//          https://media.files.artemjs.com/effects; a local dir is the output of the worker's `npm run pack`)

import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { args, ensurePipeline, paths, readManifest, writeManifest } from '../../../runtime/project.mjs';

const a = args(), [cmd, ...names] = a._, root = path.resolve(a.root || '.');
const registry = String(a.registry || process.env.EFFECTSBYAJS_REGISTRY || 'https://media.files.artemjs.com/effects').replace(/\/$/, '');
const isRemote = /^https?:\/\//.test(registry);

async function get(rel) {
  if (!isRemote) return readFile(path.join(registry, rel));
  const r = await fetch(`${registry}/${rel}`);
  if (!r.ok) throw new Error(`GET ${registry}/${rel} → ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}
const index = async () => JSON.parse(await get('index.json')).effects;

/** name list + all their dependencies, dependencies first. */
function withDeps(cat, list) {
  const order = [], seen = new Set();
  const visit = (n, from) => {
    if (seen.has(n)) return;
    if (!cat[n]) throw new Error(`unknown effect "${n}"${from ? ` (dependency of ${from})` : ''} — see: effects.mjs list`);
    seen.add(n); (cat[n].deps || []).forEach(d => visit(d, n)); order.push(n);
  };
  list.forEach(n => visit(n));
  return order;
}

async function install(cat, name, manifest) {
  const e = cat[name], buf = await get(e.file);
  const sum = createHash('sha256').update(buf).digest('hex');
  if (sum !== e.sha256) throw new Error(`${name}: checksum mismatch (got ${sum}, index says ${e.sha256}) — not installed`);
  const tmp = await mkdtemp(path.join(tmpdir(), 'effectsbyajs-'));
  try {
    const tgz = path.join(tmp, 'effect.tar.gz'), dest = path.join(paths(root).effects, name);
    await writeFile(tgz, buf);
    await rm(dest, { recursive: true, force: true }); await mkdir(dest, { recursive: true });
    const r = spawnSync('tar', ['-xzf', tgz, '-C', dest], { encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`${name}: tar failed: ${r.stderr}`);
  } finally { await rm(tmp, { recursive: true, force: true }); }
  manifest.effects[name] = e.version;
  await writeManifest(root, manifest);   // per effect: a later failure must not orphan this one
  console.log(`+ ${name}@${e.version}`);
}

const manifest = await readManifest(root);
switch (cmd) {
  case 'list': {
    const cat = await index();
    for (const [n, e] of Object.entries(cat)) {
      const have = manifest.effects[n];
      console.log(`${have ? (have === e.version ? '✓' : '↑') : ' '} ${n}@${e.version}  ${e.description}${e.deps?.length ? `  [deps: ${e.deps.join(', ')}]` : ''}`);
    }
    break;
  }
  case 'installed':
    for (const [n, v] of Object.entries(manifest.effects)) console.log(`${n}@${v}  .effectsbyajs/effects/${n}/`);
    if (!Object.keys(manifest.effects).length) console.log('no effects installed');
    break;
  case 'add': case 'update': {
    const cat = await index();
    const want = names.length ? names : cmd === 'update' ? Object.keys(manifest.effects) : [];
    if (!want.length) throw new Error('usage: effects.mjs add <name...>');
    if (await ensurePipeline(root)) console.log('+ pipeline (.effectsbyajs/pipeline)');
    for (const n of withDeps(cat, want)) {
      if (manifest.effects[n] === cat[n].version && !(cmd === 'add' && names.includes(n) && a.force)) { console.log(`= ${n}@${cat[n].version}`); continue; }
      await install(cat, n, manifest);
    }
    await writeManifest(root, manifest);
    break;
  }
  case 'remove':
    for (const n of names) {
      await rm(path.join(paths(root).effects, n), { recursive: true, force: true });
      delete manifest.effects[n]; console.log(`- ${n}`);
    }
    await writeManifest(root, manifest);
    break;
  default:
    console.log('usage: effects.mjs list | installed | add <name...> | update [name...] | remove <name...>  [--root dir] [--registry url|dir]');
    process.exit(cmd ? 1 : 0);
}
