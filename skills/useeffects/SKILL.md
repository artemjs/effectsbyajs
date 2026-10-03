---
name: useeffects
description: Find, install and use ready-made motion effects from the effectsbyajs library (kinetic typography, camera moves, transitions, 3D-ish card walls and more) in a Canvas 2D film or any project, and preview them in a local showcase. Use whenever a film or animation needs a technique the library may already have, when the user mentions effectsbyajs, .effectsbyajs, "effects lib", installing/updating/removing effects, or wants to browse/preview available effects.
---
<!-- SPDX-License-Identifier: MIT · Copyright (c) 2026 Artem Bohdanov -->

> **Before starting:** run the acceptance step from the `effectsbyajs` skill (`<plugin>/skills/effectsbyajs/SKILL.md`)
> unless this task was already accepted in this conversation — it also says which other skills this task needs.

# Use effects

The library ships effects as small ES-module packages. Importing one is cheaper and better than
re-inventing it: it is tested, typed, documented and has a showcase. Write your own technique only
when nothing in the library fits — and then consider proposing it as a new effect.

Paths: `<skill>` is this skill's base directory. All commands take `--root <project>` (default: cwd).

## Commands
```
node <skill>/scripts/effects.mjs list               # catalog; ✓ installed, ↑ update available
node <skill>/scripts/effects.mjs add kinetic        # + dependencies + .effectsbyajs/pipeline if missing
node <skill>/scripts/effects.mjs installed
node <skill>/scripts/effects.mjs update [name…]
node <skill>/scripts/effects.mjs remove <name…>
node <skill>/scripts/hostShowcase.mjs [--effect kinetic] [--no-open]   # run in background
```
The registry is `https://media.files.artemjs.com/effects` (override: `--registry <url|dir>` or
`$EFFECTSBYAJS_REGISTRY`; a local `dist/` from the registry repo works for testing unpublished effects).
Each effect arrives as one `.tar.gz`, is checked against the sha256 in the index, and is unpacked into
`<project>/.effectsbyajs/effects/<name>/`. Installed versions are recorded in `.effectsbyajs/effects.json`.

## What an installed effect contains
```
.effectsbyajs/effects/<name>/
  index.mjs      import from here
  index.d.ts     + <name>.d.ts — types (TS / IntelliSense)
  <name>.mjs     implementation
  showcase.mjs   live demo used by the showcase page — also the best usage example
  README.md      API table and snippets — read it before using the effect
```
Effects import the engine from `../../pipeline/` — keep the `.effectsbyajs/` layout intact.

## Using one
1. `add` it, read its `README.md` (and `showcase.mjs` for a working example).
2. Import from the film: `import { slamText } from '../.effectsbyajs/effects/kinetic/index.mjs'`
   (path relative to your file).
3. Call it inside a scene with time-derived arguments only — effects are pure in time like the film.
4. Preview in isolation with `hostShowcase.mjs --effect <name>` when tuning parameters; the server picks a
   free random localhost port, prints the URL and opens the browser. Stop it when done.

Do not edit files inside `.effectsbyajs/effects/` — `update` overwrites them. Wrap or compose in your own code.
