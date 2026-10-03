<!-- SPDX-License-Identifier: MIT · Copyright (c) 2026 Artem Bohdanov -->
# effectsbyajs

A Claude Code plugin for motion engineering: films drawn in Canvas 2D as a pure function of time,
a render pipeline to MP4, and a library of ready-made effects.

## Skills
| skill | does |
|---|---|
| `motion-engineer` | brief → project (new or integrated into an app) → scenes → contact-sheet loop → MP4 |
| `useeffects` | list / install / update effects from the registry, local showcase server |
| `music-engineer` | analyze a track (beat grid, sections, drops, segments), cut a film to it; music in code |

## Install
```
/plugin marketplace add <path-or-git-url-of-this-repo>
/plugin install effectsbyajs@effectsbyajs
```
Needs Node 18+, ffmpeg in PATH; projects get `puppeteer` as a devDependency (`init.mjs` adds it).

## Layout
```
styles/              directions shared by all skills: kinetic-type, product-showcase, character-story, editorial
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

## If something does not work
| symptom | fix |
|---|---|
| `"puppeteer" not found` | `npm i -D puppeteer` in the project (init.mjs adds it; run `npm install`) |
| `ffmpeg` not found / exits non-zero | install ffmpeg and make sure it is in PATH (`brew install ffmpeg`, `apt install ffmpeg`) |
| `film did not call expose(film)` | the page threw before `expose` — the error lines are printed under the message; fix the import paths first |
| text renders in a fallback font | load fonts with `loadFonts` and pass the promise as `ready`; check the face covers your script |
| font 404 | relative URLs resolve against the page — use `new URL('fonts/x.woff2', import.meta.url).href` |
| `WARNING: true peak above −1 dBTP` | render normalizes and limits automatically; if it still warns, lower the loudest accents and re-run `render.mjs --audio-only` |
| `checksum mismatch` on effects add | the archive changed under the same version — re-run later; report it if it persists |
| effects add 404 right after publishing | Cloudflare cached a 404 from an earlier request; wait a few minutes |

## License
MIT © Artem Bohdanov. Every source file carries the MIT header.
