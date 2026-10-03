// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Bohdanov
// Films cut to an existing track: load a segment of it as the film's sound, and a grid built from the
// music.json that music-engineer/scripts/analyze.mjs writes (beats, downbeats, sections, energy).

/**
 * Loads [start, start + duration) of a track as the film's AudioBuffer (stereo, at sampleRate).
 * gainDb: from music.json segments[L][k].gainDb (brings the segment to −14 LUFS). Short fades avoid clicks;
 * fadeOut can be longer for a soft ending. url resolves against the page — use new URL(…, import.meta.url).href.
 */
export async function loadTrack(url, { start = 0, duration, sampleRate = 48000, gainDb = 0, fadeIn = .005, fadeOut = .03 }) {
  const data = await (await fetch(url)).arrayBuffer();
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const o = new OAC(2, Math.ceil(duration * sampleRate), sampleRate);
  const buf = await o.decodeAudioData(data);
  const src = o.createBufferSource(), g = o.createGain(), lvl = Math.pow(10, gainDb / 20);
  src.buffer = buf;
  g.gain.setValueAtTime(0, 0); g.gain.linearRampToValueAtTime(lvl, fadeIn);
  g.gain.setValueAtTime(lvl, Math.max(fadeIn, duration - fadeOut)); g.gain.linearRampToValueAtTime(0, duration);
  src.connect(g); g.connect(o.destination); src.start(0, start, duration);
  return o.startRendering();
}

/**
 * The music's own grid for a segment starting at `start` (seconds in the track), in film time.
 * Returns { bpm, beat, beats, downbeats, sections, cuts, at(t) } where at(t) gives:
 *   beat/dt   — index of the current beat and seconds since it (like f.lt / f.beat, but from the real track)
 *   bar/barDt — current bar (downbeat) and seconds since it
 *   section   — the music.json section (label: intro/build/drop/break/high/mid/outro) and sdt since its start
 *   energy    — 0..1 energy of the current bar; pulse — 1 on each beat → 0
 * `cuts`: section starts inside the segment — natural places for scene cuts.
 */
export function musicGrid(music, start = 0, duration = music.duration - start) {
  const end = start + duration, inside = t => t >= start - 1e-3 && t < end;
  const beats = music.beats.filter(inside).map(t => t - start);
  const downbeats = music.downbeats.filter(inside).map(t => t - start);
  const bars = music.bars.filter(b => b.end > start && b.start < end).map(b => ({ ...b, start: b.start - start, end: b.end - start }));
  const sections = music.sections.filter(s => s.end > start && s.start < end).map(s => ({ ...s, start: Math.max(0, s.start - start), end: s.end - start }));
  const last = (arr, t, key = v => v) => { let i = -1; for (let k = 0; k < arr.length && key(arr[k]) <= t; k++) i = k; return i; };
  return {
    bpm: music.bpm, beat: music.beat, beats, downbeats, sections,
    cuts: sections.map(s => s.start).filter(t => t > 0),
    at(t) {
      const i = last(beats, t), b = last(downbeats, t), s = Math.max(0, last(sections, t, x => x.start)), r = last(bars, t, x => x.start);
      const dt = i >= 0 ? t - beats[i] : t;
      return {
        beat: i, dt, bar: b, barDt: b >= 0 ? t - downbeats[b] : t,
        section: sections[s], sdt: sections[s] ? t - sections[s].start : t,
        energy: r >= 0 ? bars[r].energy : 0, pulse: Math.exp(-dt / music.beat * 6)
      };
    }
  };
}
