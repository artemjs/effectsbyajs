<!-- SPDX-License-Identifier: MIT · Copyright (c) 2026 Artem Bohdanov -->
# effectsbyajs

A Claude Code plugin for motion engineering: films drawn in Canvas 2D as a pure function of time,
a render pipeline to MP4, and a library of ready-made effects.

## Skills
| skill | does |
|---|---|
| `motion-engineer` | brief → project (new or integrated into an app) → scenes → contact-sheet loop → MP4 |
| `useeffects` | list / install / update effects from the registry, local showcase server |
| `music-engineer` | planned |

## Install
```
/plugin marketplace add <path-or-git-url-of-this-repo>
/plugin install effectsbyajs@effectsbyajs
```
Needs Node 18+, ffmpeg in PATH; projects get `puppeteer` as a devDependency (`init.mjs` adds it).

## Layout
```
runtime/pipeline/    the film engine, copied into projects as .effectsbyajs/pipeline/
  film.mjs           createFilm, expose, isRenderMode
  math.mjs           mulberry32, hash, easings, pulse
  camera.mjs         handheld camera, cut flash
  synth.mjs          code-synthesized kit, groove, renderScore, WAV export
  text.mjs fonts.mjs player.mjs
runtime/*.mjs        Node side: static server (random free port), project layout, headless browser
skills/motion-engineer/   SKILL.md, references/, scripts/ (init, sheet, render), assets/template/
skills/useeffects/        SKILL.md, scripts/ (effects, hostShowcase), assets/showcase.html
```

## In a project
```
.effectsbyajs/
  pipeline/          engine (VERSION stamp; refreshed when the plugin updates)
  effects/<name>/    installed effects: index.mjs, <name>.mjs, *.d.ts, showcase.mjs, README.md
  effects.json       installed versions
```

## License
MIT © Artem Bohdanov. Every source file carries the MIT header.
