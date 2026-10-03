// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Bohdanov
// Fonts for films. Loaded explicitly so the renderer never captures a frame with a fallback face.

/**
 * Loads font faces and resolves when all are ready.
 * faces: [{ family, src: url | ArrayBuffer, weight? = '100 900', style? }]
 * Check the face covers your script (e.g. Poppins has no Cyrillic).
 */
export function loadFonts(faces) {
  return Promise.all(faces.map(({ family, src, weight = '100 900', style = 'normal' }) => {
    const face = new FontFace(family, typeof src === 'string' ? `url(${src})` : src, { weight, style });
    document.fonts.add(face);
    return face.load();
  }));
}
