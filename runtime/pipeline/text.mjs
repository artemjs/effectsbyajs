// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Bohdanov
// Canvas text helpers.

/**
 * Draws a line and shrinks the font size if it is wider than maxW. Returns the final size.
 * o: { align = 'center', weight = 900, font = 'system-ui, sans-serif' }
 */
export function fitText(ctx, s, x, y, size, maxW, color, o = {}) {
  const { align = 'center', weight = 900, font = 'system-ui, sans-serif' } = o;
  ctx.font = `${weight} ${size}px ${font}`;
  const w = ctx.measureText(s).width;
  if (w > maxW) { size = size * maxW / w; ctx.font = `${weight} ${size}px ${font}`; }
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
  return size;
}
