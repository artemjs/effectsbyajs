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
 * Where to get fonts: npm i -D @fontsource-variable/<name> if it exists, else @fontsource/<name> (static: one file
 * per weight — pass `weight: '900'` etc. per face). Copy the .woff2 files you need into the project
 * (e.g. film/fonts/), keep the OFL/LICENSE file next to them. Ready ranges: RANGES.latin, RANGES.cyrillic.
 */
/** unicode-range strings matching @fontsource subset files. */
export const RANGES = {
  latin: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
  cyrillic: 'U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116'
};

export function loadFonts(faces) {
  return Promise.all(faces.map(({ family, src, weight = '100 900', style = 'normal', unicodeRange }) => {
    const face = new FontFace(family, typeof src === 'string' ? `url(${src})` : src,
      { weight, style, ...(unicodeRange && { unicodeRange }) });
    document.fonts.add(face);
    return face.load();
  }));
}
