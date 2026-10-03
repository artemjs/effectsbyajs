// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Bohdanov
// Preview player: tap = play/pause (with sound), bottom strip = scrub.
// requestAnimationFrame here only CALLS render(t); the frame itself stays a pure function.

/** o: { accent = '#d97757', fit = true } — fit scales the canvas into the window (standalone pages only). */
export function attachPlayer(film, o = {}) {
  const { accent = '#d97757', fit = true } = o;
  const { canvas: c, ctx: x, W, H, duration: DUR, render } = film;

  if (fit) {
    Object.assign(document.body.style, { margin: '0', background: '#000', overflow: 'hidden' });
    const resize = () => {
      const s = Math.min(innerWidth / W, innerHeight / H);
      Object.assign(c.style, { width: W * s + 'px', height: H * s + 'px', display: 'block', margin: '0 auto' });
    };
    resize(); addEventListener('resize', resize);
  }

  let playing = false, loading = false, noAudio = !film.audio;
  let actx = null, buf = null, src = null, startAt = 0, tPaused = 0, raf = 0;
  const clockNow = () => noAudio ? performance.now() / 1000 : actx.currentTime;
  const curT = () => playing ? ((clockNow() - startAt) % DUR) : tPaused;

  function ui(t) {
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.fillStyle = 'rgba(242,242,240,.25)'; x.fillRect(0, H - 24, W, 24);
    x.fillStyle = accent; x.fillRect(0, H - 24, W * t / DUR, 24);
    if (playing) return;
    x.fillStyle = 'rgba(10,10,11,.55)'; x.fillRect(0, 0, W, H);
    x.fillStyle = accent; x.beginPath(); x.arc(W / 2, H / 2, 150, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#111'; x.beginPath();
    x.moveTo(W / 2 - 45, H / 2 - 70); x.lineTo(W / 2 - 45, H / 2 + 70); x.lineTo(W / 2 + 75, H / 2); x.closePath(); x.fill();
    x.font = '700 64px system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff';
    x.fillText(loading ? 'LOADING SOUND…' : 'TAP — WITH SOUND', W / 2, H / 2 + 260);
  }
  const draw = () => { const t = curT(); render(t); ui(t); };
  const loop = () => { draw(); raf = requestAnimationFrame(loop); };

  async function play() {
    if (loading || playing) return;
    try {
      if (!noAudio && !actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx) actx.resume();
      if (!noAudio && !buf) { loading = true; draw(); buf = await film.audio(actx.sampleRate); loading = false; }
    } catch (e) { console.warn('preview audio failed, playing silent:', e); noAudio = true; loading = false; }
    startAt = clockNow() - tPaused;
    if (!noAudio && buf) {
      src = actx.createBufferSource(); src.buffer = buf; src.loop = true;
      src.connect(actx.destination); src.start(0, tPaused % DUR);
    }
    playing = true; loop();
  }
  function pause() {
    tPaused = curT();
    if (src) { src.stop(); src = null; }
    playing = false; cancelAnimationFrame(raf); draw();
  }

  let scrubbing = false, wasPlaying = false;
  const toCanvas = e => {
    const r = c.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H];
  };
  const scrubTo = px => { tPaused = Math.max(0, Math.min(1, px / W)) * DUR * .9999; draw(); };
  c.addEventListener('pointerdown', e => {
    const [px, py] = toCanvas(e);
    if (py > H * .88) { scrubbing = true; wasPlaying = playing; if (playing) pause(); scrubTo(px); }
    else playing ? pause() : play();
  });
  c.addEventListener('pointermove', e => { if (scrubbing) scrubTo(toCanvas(e)[0]); });
  addEventListener('pointerup', () => { if (scrubbing) { scrubbing = false; if (wasPlaying) play(); } });

  film.ready.then(draw);
}
