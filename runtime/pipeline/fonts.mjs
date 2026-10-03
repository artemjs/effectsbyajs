// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Bohdanov
// Fonts for films. Loaded explicitly so the renderer never captures a frame with a fallback face.

/**
 * Loads font faces and resolves when all are ready.
 * faces: [{ family, src: url | ArrayBuffer, weight? = '100 900', style?, unicodeRange? }]
 * - Check the face covers your script (e.g. Poppins has no Cyrillic).
 * - Relative URLs resolve against the PAGE, not this module: pass new URL('fonts/x.woff2', import.meta.url).href.
 * - Fonts split by subset (e.g. @fontsource cyrillic + latin files): register both under ONE family with their
 *   unicodeRange, and the browser picks the right file per character.
 * Where to get fonts: npm i -D @fontsource-variable/<name> (or @fontsource/<name>), copy the .woff2 files you need
 * from node_modules into the project (e.g. film/fonts/), keep the OFL/LICENSE file next to them.
 */
export function loadFonts(faces) {
  return Promise.all(faces.map(({ family, src, weight = '100 900', style = 'normal', unicodeRange }) => {
    const face = new FontFace(family, typeof src === 'string' ? `url(${src})` : src,
      { weight, style, ...(unicodeRange && { unicodeRange }) });
    document.fonts.add(face);
    return face.load();
  }));
}
