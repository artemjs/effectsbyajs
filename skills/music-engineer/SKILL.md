---
name: music-engineer
description: Music for films and motion — analyze a track (tempo, beat grid, downbeats, sections, builds and drops, energy, key, character), pick the best segment for a video length, cut a Canvas film to it so every hit lands on the real beat; or write the film's own music in code. Use whenever the user gives a song/track/audio file for a video, asks to sync or cut a video to music, wants a beat-synced edit, a "video for this track", needs the BPM/structure of a track, or wants original background music for a motion film.
---
<!-- SPDX-License-Identifier: MIT · Copyright (c) 2026 Artem Bohdanov -->

# Music engineer

Paths: `<skill>` is this skill's base directory, `<plugin>` is `<skill>/../..`. Films themselves are made with the
**motion-engineer** skill — this skill owns the sound and the musical timeline.

You cannot hear. Everything below is built around that: measure what can be measured, structure the film so it
is right by construction, and hand the user something they can check by ear in seconds.

## A. A film for an existing track

1. **Analyze**: `node <skill>/scripts/analyze.mjs <track> --length <video seconds> --out film/music.json --clicks out/clicks.mp3`
   Prints tempo, key, character, sections (intro / build / drop / break / high / mid / outro), the best segments for
   the length with their reasons and the gain to −14 LUFS. Read [references/analysis.md](references/analysis.md)
   for what the numbers mean and where they are unreliable.
2. **Check the grid by ear — the user's ear.** Offer `out/clicks.mp3` (the track with a click on every detected
   beat, higher on downbeats). If the clicks drift or sit between the kicks, the film will too: stop and fix
   (see analysis.md → "When the grid is wrong").
3. **Pick the segment** from the suggestions, or the one the user asks for. Prefer: starts on a section, a drop or
   a clear change inside, ends on a section or a bar line. Whole bars only — the analyzer already rounds to bars.
4. **Read the music into the brief**: the film's timeline comes from the track, not the other way round.
   - Scene cuts on section starts (`grid.cuts`) and on phrase lines (every 4 or 8 bars).
   - The drop is the film's biggest moment: hold back before it (fewer elements, a build that tightens — a bar
     filling, words speeding up), then release (fly-in, inversion, the busiest scene) exactly on it.
   - Motion intensity follows `energy`: slams scale with it, the camera works harder in high sections.
   - Hits on beats, big changes on downbeats, small ticks on half beats. Breaks breathe (slower, emptier).
   - The emotional color (bright, dark, playful, aggressive) comes from the user, the title or the genre —
     the analyzer reports energy and structure, not feelings.
5. **Wire it** (pipeline `music.mjs`, `createFilm({ grid })`):
   ```js
   import { loadTrack, musicGrid } from '../.effectsbyajs/pipeline/music.mjs';
   const music = await (await fetch(new URL('music.json', import.meta.url))).json();
   const seg = music.segments['15'][0], grid = musicGrid(music, seg.start, seg.duration);
   createFilm({ duration: seg.duration, bpm: music.bpm, grid, scenes: [...],
     audio: sr => loadTrack(new URL('track.mp3', import.meta.url).href, { start: seg.start, duration: seg.duration, sampleRate: sr, gainDb: seg.gainDb }) });
   // in a scene: f.music = { beat, dt, bar, barDt, section, sdt, energy, pulse }
   ```
   Copy the track into the project (it is served with the film) and note its license in the brief —
   CC BY needs a credit line in the video description.
6. **Loop as usual** (motion-engineer): sheet, `--cuts`, render. render.mjs prints loudness and true peak.
   Tell the user what lands where ("drop at 5.9 s = wall fly-in"), so they can verify by watching once.

## B. Original music in code

When there is no track, the film's sound is written with `pipeline/synth.mjs` (`renderScore`, the kit, `groove`).
Make it musical, not just a metronome — [references/compose.md](references/compose.md) covers structure, layers,
sound design with the kit, mixing and loudness. The user is the ears: render, hand over, take notes, iterate,
and record every lesson in compose.md so the next track starts better.

## Hand-off
Segment chosen and why, the grid check (clicks file), what happens on the drop and on each section,
measured loudness/peak, the track's license, and anything you could not verify by measurement.
