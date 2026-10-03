<!-- SPDX-License-Identifier: MIT · Copyright (c) 2026 Artem Bohdanov -->
# Integrating a film into an existing app

`init.mjs --integrate` copies the engine to `.effectsbyajs/pipeline/`. All that matters is a canvas,
`createFilm`, and `expose(film)` on the page you will render. Keep the film code framework-free
(`film/film.mjs` exporting a function that takes a canvas); the framework only mounts it.

## Film module (any framework)
```js
// src/film/film.mjs
import { createFilm } from '../../.effectsbyajs/pipeline/film.mjs';
import { handheld } from '../../.effectsbyajs/pipeline/camera.mjs';
export function makeFilm(canvas) {
  return createFilm({ canvas, duration: 16, bpm: 120, background: '#141413', camera: handheld(), scenes: [/* … */] });
}
```

## React
```jsx
import { useEffect, useRef } from 'react';
import { expose, isRenderMode } from '../.effectsbyajs/pipeline/film.mjs';
import { attachPlayer } from '../.effectsbyajs/pipeline/player.mjs';
import { makeFilm } from './film/film.mjs';

export function Film() {
  const ref = useRef(null);
  useEffect(() => {
    const film = makeFilm(ref.current);
    expose(film);                                   // render.mjs / sheet.mjs drive this
    if (!isRenderMode()) attachPlayer(film, { fit: false });
  }, []);
  return <canvas ref={ref} style={{ width: '100%', height: 'auto' }} />;
}
```
- StrictMode mounts effects twice in dev: harmless (the second `createFilm` wins), but don't attach the player twice in production code paths.
- The canvas's CSS size is free; the film renders at its own `width × height`.
- TypeScript: the pipeline is plain ESM; add `"allowJs": true` or a `declare module` shim if the project is strict.
  Effects ship their own `.d.ts`.

## Vue / Svelte / others
Same shape: get the canvas element after mount → `makeFilm(canvas)` → `expose(film)`.

## Rendering an app film
Run the dev server, open the film page (a route that shows only the film is best), then:
```
node <skill>/scripts/sheet.mjs  --root . --url http://localhost:5173/film
node <skill>/scripts/render.mjs --root . --url http://localhost:5173/film
```
The scripts add `?render=1`; `isRenderMode()` lets the page skip the player and any UI.

## Static assets
Fonts and images must be served by the app (public/ folder) — load fonts with `loadFonts` from
`pipeline/fonts.mjs` and pass the promise as `ready` to `createFilm`, so no frame is captured with a fallback face.
