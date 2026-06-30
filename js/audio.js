/* ============================================================
   audio.js — MLG soundboard + real meme SFX + chiptune meme music
   - synthesized blips for gameplay (no files needed)
   - real meme sound files (assets/sounds/*) played per meme / event
   - a looping 8-bit chiptune background track (pure WebAudio)
   ============================================================ */
(function (global) {
  'use strict';
  let ctx = null, master = null, musicGain = null, muted = false, musicMuted = false;

  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.35; master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.16; musicGain.connect(ctx.destination);
  }

  function tone(freq, dur, type, vol, slideTo, delay) {
    if (!ctx || muted) return;
    const t = ctx.currentTime + (delay || 0);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'square'; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.3, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol) {
    if (!ctx || muted) return;
    const n = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    n.buffer = buf;
    const g = ctx.createGain(); g.gain.value = vol || 0.2;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 800;
    n.connect(f); f.connect(g); g.connect(master); n.start();
  }

  // ---------- real meme sound files (ONE at a time) ----------
  const cache = {};
  let curSound = null;
  function play(key, vol) {
    if (muted) return false;
    const map = global.MEME_SOUNDS || {};
    const url = map[key];
    if (!url) return false;
    const a = cache[key] || (cache[key] = new Audio(url));
    if (curSound) { try { curSound.pause(); curSound.currentTime = 0; } catch (e) {} }  // only one meme sound plays at once
    try { a.currentTime = 0; a.volume = vol == null ? 0.6 : vol; const p = a.play(); if (p) p.catch(() => {}); curSound = a; return true; }
    catch (e) { return false; }
  }

  // ---------- chiptune meme music (looping) ----------
  const LEAD = [523, 0, 659, 784, 880, 0, 784, 659, 587, 0, 494, 587, 659, 0, 523, 0];
  const BASS = [131, 131, 0, 196, 220, 220, 0, 196, 175, 175, 0, 147, 196, 196, 0, 98];
  // unsettling creepypasta drone (minor / dissonant, very slow) — Lavender-Town-ish
  const CREEPY_LEAD = [220, 0, 233, 0, 311, 0, 233, 0, 207, 0, 246, 0, 220, 0, 185, 0];
  const CREEPY_BASS = [55, 0, 0, 0, 58, 0, 0, 0, 49, 0, 0, 0, 52, 0, 0, 0];
  const music = { on: false, timer: null, step: 0, next: 0, mode: 'chip' };
  function mNote(freq, t, dur, type, vol) {
    if (!ctx || !freq) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(musicGain); o.start(t); o.stop(t + dur + 0.02);
  }
  function creepyTick() {
    const bpm = 60, step = (60 / bpm) / 2;
    while (music.next < ctx.currentTime + 0.35) {
      const s = music.step % 16, t = music.next;
      if (CREEPY_LEAD[s]) { mNote(CREEPY_LEAD[s], t, step * 1.7, 'sine', 0.07); mNote(CREEPY_LEAD[s] * 1.008, t, step * 1.7, 'triangle', 0.05); } // detuned wobble
      if (CREEPY_BASS[s]) mNote(CREEPY_BASS[s], t, step * 3.2, 'sawtooth', 0.09);
      if (s === 0 && Math.random() < 0.5) noise(0.5, 0.04);  // distant hiss
      music.next += step; music.step++;
    }
  }
  function mTick() {
    if (!music.on || !ctx) return;
    if (music.mode === 'creepy') return creepyTick();
    const bpm = 148, step = (60 / bpm) / 2; // 8th notes
    while (music.next < ctx.currentTime + 0.25) {
      const s = music.step % 16, t = music.next;
      mNote(LEAD[s], t, step * 0.9, 'square', 0.10);
      mNote(BASS[s], t, step * 0.95, 'triangle', 0.16);
      if (s % 4 === 0) { // kick
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(50, t + 0.12);
        g.gain.setValueAtTime(0.22, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
        o.connect(g); g.connect(musicGain); o.start(t); o.stop(t + 0.16);
      }
      music.next += step; music.step++;
    }
  }
  function musicStart() { ensure(); if (!ctx || music.on || musicMuted) return; music.on = true; music.step = 0; music.next = ctx.currentTime + 0.1; music.timer = setInterval(mTick, 60); }
  function musicStop() { music.on = false; if (music.timer) { clearInterval(music.timer); music.timer = null; } }

  const SFX = {
    init: ensure,
    setMuted(m) { muted = m; if (m) musicStop(); },
    toggleMusic() { musicMuted = !musicMuted; if (musicMuted) musicStop(); else musicStart(); return !musicMuted; },
    musicStart, musicStop,
    setMusicMode(m) { music.mode = m; music.step = 0; if (music.on) { music.next = ctx ? ctx.currentTime + 0.1 : 0; } },
    play,                              // real meme sound by key, returns true if it existed
    bounce() { tone(220 + Math.random() * 80, 0.06, 'square', 0.18); },
    hit() { tone(420, 0.05, 'square', 0.2, 620); },
    brick() { tone(330 + Math.random() * 120, 0.07, 'square', 0.22, 180); noise(0.05, 0.08); },
    gold() { tone(880, 0.08, 'triangle', 0.25, 1320); tone(1320, 0.1, 'triangle', 0.2, 1760, 0.06); },
    coin() { tone(988, 0.06, 'square', 0.22); tone(1319, 0.1, 'square', 0.2, null, 0.05); },
    explode() { noise(0.35, 0.35); tone(120, 0.35, 'sawtooth', 0.3, 40); },
    laser() { tone(1200, 0.12, 'sawtooth', 0.18, 220); },
    lose() { tone(300, 0.5, 'sawtooth', 0.3, 70); },
    buy() { tone(660, 0.06, 'square', 0.2); tone(880, 0.08, 'square', 0.2, null, 0.05); },
    reroll() { tone(500, 0.05, 'triangle', 0.18, 900); },
    quota() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'square', 0.28, null, i * 0.08)); },
    airhorn() { [0, 0.18, 0.36].forEach((d) => { tone(360, 0.16, 'sawtooth', 0.32, 380, d); tone(362, 0.16, 'square', 0.18, 384, d); }); },
    wow() { tone(700, 0.12, 'triangle', 0.25, 1100); tone(1100, 0.18, 'triangle', 0.22, 700, 0.1); },
    levelup() { [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.13, 'square', 0.26, null, i * 0.07)); },
    over9000() { tone(110, 0.6, 'sawtooth', 0.35, 1760); noise(0.6, 0.2); },
    hurt() { tone(200, 0.18, 'sawtooth', 0.3, 90); noise(0.1, 0.15); },
    bossHit() { tone(160, 0.1, 'square', 0.28, 80); noise(0.06, 0.12); },
    // unique themed "voice" per item (seed = hash of item id) — guarantees a distinct sound per meme
    procVoice(seed, theme, cat) {
      ensure(); if (!ctx || muted) return;
      const base = 174 + (seed % 16) * 33;            // unique pitch per item
      if (theme === 'creepy') {
        tone(base * 0.5, 0.45, 'sawtooth', 0.16, base * 0.32);            // descending dread
        tone(base * 0.5 * 1.03, 0.45, 'sine', 0.12, base * 0.33);          // detuned wobble
        if (cat === 'crit' || cat === 'laser' || cat === 'ball') noise(0.35, 0.18);
        if ((seed >> 3) % 2) tone(base * 0.25, 0.6, 'triangle', 0.1, base * 0.2);
      } else {
        const arps = [[0,4,7,12],[0,3,7,10],[0,5,7,12],[0,4,9,12]][seed % 4];   // varied arpeggio
        const type = ['square','triangle','sawtooth'][(seed >> 2) % 3];
        arps.forEach((iv, i) => tone(base * Math.pow(2, iv / 12), 0.09, type, 0.2, null, i * 0.06));
        if (cat === 'coin') tone(base * 3, 0.08, 'square', 0.18, null, 0.26);
      }
    },
  };

  global.SFX = SFX;
})(window);
