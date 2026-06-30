/* ============================================================
   bosses.js — MEME BOSS BATTLES
   create(type, deps) -> { update, render, key, down, move, state, forceWin, forceLose, debug }
   types: 'meme'  = giant-meme brick-breaker boss (meme attacks you)
          'shmup' = bullet-hell vs a giant meme
          'tetris'= VERSUS tetris — the meme plays its own board; bury it in garbage to win
          'puyo'  = VERSUS puyo  — the meme plays its own board; bury it in nuisance to win
   state: 'run' | 'win' | 'lose'
   deps: { ctx, W, H, memeId, toast, agg, round }   (SFX & MEMES are globals)
   ============================================================ */
(function (global) {
  'use strict';
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  function bossImg(id) { return (global.MEMES && MEMES.get(id)) || null; }
  function drawImg(ctx, img, x, y, w, h) { if (img && img.complete && img.naturalWidth) { try { ctx.drawImage(img, x, y, w, h); } catch (e) {} } }
  function hpBar(ctx, x, y, w, hp, max, label) {
    ctx.fillStyle = '#000a'; ctx.fillRect(x, y, w, 14);
    ctx.fillStyle = '#ff3b3b'; ctx.fillRect(x + 2, y + 2, (w - 4) * Math.max(0, hp / max), 10);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, 14);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Comic Sans MS'; ctx.textAlign = 'center';
    ctx.fillText((label || 'BOSS') + '  ' + Math.max(0, Math.ceil(hp)) + '/' + max, x + w / 2, y + 12);
  }
  function hearts(ctx, n, x, y) { ctx.font = '18px serif'; ctx.textAlign = 'left'; ctx.fillText('❤️'.repeat(Math.max(0, n)), x, y); }
  function banner(ctx, W, txt, sub) {
    ctx.textAlign = 'center'; ctx.fillStyle = '#ffd23f'; ctx.font = 'bold 22px Comic Sans MS';
    ctx.fillText(txt, W / 2, 26); if (sub) { ctx.fillStyle = '#00ffd5'; ctx.font = '12px Comic Sans MS'; ctx.fillText(sub, W / 2, 44); }
  }

  /* =====================================================================
     1) MEME BOSS — brick-breaker vs a giant moving meme (uses your items)
     ===================================================================== */
  function memeBoss(d) {
    const W = d.W, H = d.H, ctx = d.ctx, img = bossImg(d.memeId);
    const a = d.agg || {}, ROUND = d.round || 5;
    const padW = 130 * (a.paddleProd || 1), ballR = 9 * (a.ballProd || 1), spd = 430 * (a.speedProd || 1);
    const extra = a.extraBalls || 0, laserN = a.laserCount || 0, hasLaser = laserN > 0, dmgBase = Math.max(1, Math.round(a.multProd || 1)), critCh = a.critChance || 0;
    const mHp = 40 + ROUND * 4;
    const S = {
      state: 'run', paddle: { x: W / 2, w: padW, y: H - 30 },
      balls: [{ x: W / 2, y: H - 46, vx: 0, vy: 0, r: ballR, stuck: true }],
      boss: { x: W / 2, y: 130, w: 220, h: 150, dir: 1, t: 0 },
      hp: mHp, max: mHp, bombs: [], lasers: [], lives: 3, fireT: 0, laserCd: 0, hitFlash: 0,
    };
    function newBall() { return { x: S.paddle.x, y: S.paddle.y - 16, vx: 0, vy: 0, r: ballR, stuck: true }; }
    function launch() {
      const b = S.balls.find(x => x.stuck); if (!b) return; b.stuck = false;
      const an = -Math.PI / 2 + (Math.random() - .5) * .4; b.vx = Math.cos(an) * spd; b.vy = Math.sin(an) * spd;
      for (let i = 0; i < extra; i++) { const aa = -Math.PI / 2 + (i + 1) * .3 * (i % 2 ? 1 : -1); S.balls.push({ x: S.paddle.x, y: S.paddle.y - 16, vx: Math.cos(aa) * spd, vy: Math.sin(aa) * spd, r: ballR, stuck: false }); }
      SFX.hit();
    }
    function fireLaser() { if (S.laserCd > 0) return; S.laserCd = 0.3; const beams = 2 * laserN, w = S.paddle.w; for (let i = 0; i < beams; i++) S.lasers.push({ x: S.paddle.x - w / 2 + (i + 0.5) * (w / beams), y: S.paddle.y }); SFX.laser(); }
    function dmg(n) { let v = n; if (critCh && Math.random() < critCh) v *= 5; S.hp -= v; S.hitFlash = 0.12; SFX.bossHit(); if (S.hp <= 0) S.state = 'win'; }
    return {
      get state() { return S.state; },
      forceWin() { S.state = 'win'; }, forceLose() { S.state = 'lose'; },
      debug() { return { hp: S.hp, lives: S.lives, balls: S.balls.length, lasers: S.lasers.length }; },
      move(x) { S.paddle.x = clamp(x, S.paddle.w / 2, W - S.paddle.w / 2); },
      down() { if (S.balls.some(b => b.stuck)) launch(); else if (hasLaser) fireLaser(); },
      key() {},
      update(dt) {
        if (S.state !== 'run') return;
        if (S.laserCd > 0) S.laserCd -= dt;
        const bo = S.boss; bo.t += dt; bo.x += bo.dir * 90 * dt;
        if (bo.x < bo.w / 2 + 10) { bo.x = bo.w / 2 + 10; bo.dir = 1; } if (bo.x > W - bo.w / 2 - 10) { bo.x = W - bo.w / 2 - 10; bo.dir = -1; }
        bo.y = 120 + Math.sin(bo.t * 1.3) * 26;
        if (S.hitFlash > 0) S.hitFlash -= dt;
        S.fireT -= dt; if (S.fireT <= 0) { S.fireT = 1.1; S.bombs.push({ x: bo.x, y: bo.y + bo.h / 2, vy: 150 + Math.random() * 70 }); }
        for (const b of S.bombs) b.y += b.vy * dt;
        for (const b of S.bombs) { if (b.y > S.paddle.y - 8 && b.y < S.paddle.y + 14 && Math.abs(b.x - S.paddle.x) < S.paddle.w / 2 + 6) { b.dead = true; hurt(); } }
        S.bombs = S.bombs.filter(b => !b.dead && b.y < H + 20);
        for (const l of S.lasers) { l.y -= 900 * dt; if (Math.abs(l.x - bo.x) < bo.w / 2 && Math.abs(l.y - bo.y) < bo.h / 2) { l.dead = true; dmg(dmgBase); } }
        S.lasers = S.lasers.filter(l => !l.dead && l.y > -20);
        for (const b of S.balls) {
          if (b.stuck) { b.x = S.paddle.x; b.y = S.paddle.y - 16; continue; }
          b.x += b.vx * dt; b.y += b.vy * dt;
          if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx); } if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx); }
          if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy); }
          if (b.vy > 0 && b.y + b.r > S.paddle.y - 8 && b.y < S.paddle.y + 10 && Math.abs(b.x - S.paddle.x) < S.paddle.w / 2 + b.r) {
            const hit = clamp((b.x - S.paddle.x) / (S.paddle.w / 2), -1, 1), aa = -Math.PI / 2 + hit * 1.05, sp = Math.hypot(b.vx, b.vy);
            b.vx = Math.cos(aa) * sp; b.vy = Math.sin(aa) * sp; b.y = S.paddle.y - 10 - b.r; SFX.bounce();
          }
          if (Math.abs(b.x - bo.x) < bo.w / 2 + b.r && Math.abs(b.y - bo.y) < bo.h / 2 + b.r) {
            const ox = (bo.w / 2 + b.r) - Math.abs(b.x - bo.x), oy = (bo.h / 2 + b.r) - Math.abs(b.y - bo.y);
            if (ox < oy) b.vx = b.x < bo.x ? -Math.abs(b.vx) : Math.abs(b.vx); else b.vy = b.y < bo.y ? -Math.abs(b.vy) : Math.abs(b.vy);
            dmg(dmgBase);
          }
        }
        S.balls = S.balls.filter(b => b.y - b.r <= H + 4);
        if (S.balls.length === 0) { hurt(); if (S.state === 'run') S.balls.push(newBall()); }
        function hurt() { S.lives--; SFX.hurt(); if (S.lives <= 0) S.state = 'lose'; }
      },
      render() {
        banner(ctx, W, '👹 MEME BOSS 👹', (hasLaser ? 'CLICK fires LASERS · ' : 'CLICK to launch · ') + 'bounce the ball into the meme · dodge bombs');
        const bo = S.boss;
        if (S.hitFlash > 0) { ctx.save(); ctx.globalAlpha = .5; ctx.fillStyle = '#fff'; ctx.fillRect(bo.x - bo.w / 2, bo.y - bo.h / 2, bo.w, bo.h); ctx.restore(); }
        drawImg(ctx, img, bo.x - bo.w / 2, bo.y - bo.h / 2, bo.w, bo.h);
        ctx.strokeStyle = '#ff3ea5'; ctx.lineWidth = 3; ctx.strokeRect(bo.x - bo.w / 2, bo.y - bo.h / 2, bo.w, bo.h);
        hpBar(ctx, W / 2 - 150, 54, 300, S.hp, S.max, 'BOSS HP');
        for (const b of S.bombs) { ctx.fillStyle = '#ff3b3b'; ctx.beginPath(); ctx.arc(b.x, b.y, 8, 0, 7); ctx.fill(); ctx.fillStyle = '#ffd23f'; ctx.fillRect(b.x - 1, b.y - 12, 2, 5); }
        ctx.strokeStyle = '#39ff14'; ctx.lineWidth = 4; ctx.shadowColor = '#39ff14'; ctx.shadowBlur = 10;
        for (const l of S.lasers) { ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.lineTo(l.x, l.y - 18); ctx.stroke(); } ctx.shadowBlur = 0;
        ctx.fillStyle = (d.arena ? d.arena.pad[1] : '#00ffd5'); ctx.fillRect(S.paddle.x - S.paddle.w / 2, S.paddle.y - 6, S.paddle.w, 12);
        for (const b of S.balls) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill(); }
        ctx.fillStyle = '#fff'; hearts(ctx, S.lives, 12, H - 14);
      },
    };
  }

  /* =====================================================================
     2) SHMUP BOSS — dodge bullet patterns, shoot the meme (uses your items)
     ===================================================================== */
  function shmupBoss(d) {
    const W = d.W, H = d.H, ctx = d.ctx, img = bossImg(d.memeId);
    const a = d.agg || {}, ROUND = d.round || 10;
    const dmgB = Math.max(1, Math.round(a.multProd || 1)), critS = a.critChance || 0, ex = a.extraBalls || 0;
    const mHp = 60 + ROUND * 5;
    const S = {
      state: 'run', ship: { x: W / 2, y: H - 54, w: 30 }, bul: [], eb: [],
      boss: { x: W / 2, y: 110, w: 200, h: 140, t: 0, dir: 1 }, hp: mHp, max: mHp,
      fireT: 0, patT: 0, lives: 3, inv: 0, hitFlash: 0,
    };
    function fire() { S.bul.push({ x: S.ship.x - 8, y: S.ship.y - 10 }, { x: S.ship.x + 8, y: S.ship.y - 10 }); for (let i = 0; i < ex; i++) S.bul.push({ x: S.ship.x - 16 - i * 6, y: S.ship.y }, { x: S.ship.x + 16 + i * 6, y: S.ship.y }); SFX.laser(); }
    function ring(n, sp) { const bo = S.boss; for (let i = 0; i < n; i++) { const an = (i / n) * Math.PI * 2 + S.boss.t; S.eb.push({ x: bo.x, y: bo.y + 30, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp }); } }
    function aimed(sp) { const bo = S.boss, an = Math.atan2(S.ship.y - bo.y, S.ship.x - bo.x); S.eb.push({ x: bo.x, y: bo.y + 30, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp }); }
    return {
      get state() { return S.state; },
      forceWin() { S.state = 'win'; }, forceLose() { S.state = 'lose'; },
      debug() { return { hp: S.hp, lives: S.lives }; },
      move(x) { S.ship.x = clamp(x, S.ship.w / 2, W - S.ship.w / 2); },
      down() { fire(); },
      key() {},
      update(dt) {
        if (S.state !== 'run') return;
        const bo = S.boss; bo.t += dt; bo.x += bo.dir * 70 * dt;
        if (bo.x < bo.w / 2 + 10) bo.dir = 1; if (bo.x > W - bo.w / 2 - 10) bo.dir = -1;
        bo.y = 100 + Math.sin(bo.t) * 20;
        if (S.inv > 0) S.inv -= dt; if (S.hitFlash > 0) S.hitFlash -= dt;
        S.fireT -= dt; if (S.fireT <= 0) { S.fireT = 0.16; fire(); }
        S.patT -= dt; if (S.patT <= 0) { S.patT = 1.0; if (Math.random() < .6) ring(14, 150); else { aimed(220); aimed(220); } }
        for (const b of S.bul) b.y -= 560 * dt;
        for (const b of S.bul) { if (Math.abs(b.x - bo.x) < bo.w / 2 && Math.abs(b.y - bo.y) < bo.h / 2) { b.dead = true; S.hp -= dmgB * ((critS && Math.random() < critS) ? 5 : 1); S.hitFlash = .08; SFX.bossHit(); if (S.hp <= 0) S.state = 'win'; } }
        S.bul = S.bul.filter(b => !b.dead && b.y > -10);
        for (const e of S.eb) { e.x += e.vx * dt; e.y += e.vy * dt; }
        for (const e of S.eb) { if (S.inv <= 0 && Math.hypot(e.x - S.ship.x, e.y - S.ship.y) < S.ship.w / 2 + 5) { e.dead = true; S.lives--; S.inv = 1.2; SFX.hurt(); if (S.lives <= 0) S.state = 'lose'; } }
        S.eb = S.eb.filter(e => !e.dead && e.x > -20 && e.x < W + 20 && e.y > -20 && e.y < H + 20);
      },
      render() {
        banner(ctx, W, '🚀 SHMUP BOSS 🚀', 'move to dodge · auto-fires · destroy the meme');
        const bo = S.boss;
        if (S.hitFlash > 0) { ctx.save(); ctx.globalAlpha = .5; ctx.fillStyle = '#fff'; ctx.fillRect(bo.x - bo.w / 2, bo.y - bo.h / 2, bo.w, bo.h); ctx.restore(); }
        drawImg(ctx, img, bo.x - bo.w / 2, bo.y - bo.h / 2, bo.w, bo.h);
        ctx.strokeStyle = '#b06bff'; ctx.lineWidth = 3; ctx.strokeRect(bo.x - bo.w / 2, bo.y - bo.h / 2, bo.w, bo.h);
        hpBar(ctx, W / 2 - 150, 54, 300, S.hp, S.max, 'BOSS HP');
        ctx.fillStyle = '#39ff14'; for (const b of S.bul) ctx.fillRect(b.x - 2, b.y - 8, 4, 8);
        ctx.fillStyle = '#ff3b3b'; for (const e of S.eb) { ctx.beginPath(); ctx.arc(e.x, e.y, 5, 0, 7); ctx.fill(); }
        const sh = S.ship; if (S.inv <= 0 || Math.floor(S.inv * 12) % 2) { ctx.fillStyle = (d.arena ? d.arena.pad[1] : '#00ffd5'); ctx.beginPath(); ctx.moveTo(sh.x, sh.y - 14); ctx.lineTo(sh.x - 14, sh.y + 12); ctx.lineTo(sh.x + 14, sh.y + 12); ctx.closePath(); ctx.fill(); }
        ctx.fillStyle = '#fff'; hearts(ctx, S.lives, 12, H - 14);
      },
    };
  }

  /* =====================================================================
     TETRIS pieces (shared)
     ===================================================================== */
  const COLS = 10, ROWS = 18;
  const BASE = { I: ['0000', '1111', '0000', '0000'], O: ['0110', '0110', '0000', '0000'], T: ['010', '111', '000'], S: ['011', '110', '000'], Z: ['110', '011', '000'], J: ['100', '111', '000'], L: ['001', '111', '000'] };
  const PCOLOR = { I: '#00ffd5', O: '#ffd23f', T: '#b06bff', S: '#39ff14', Z: '#ff3b3b', J: '#3ea5ff', L: '#ff8a3e' };
  function rotM(m) { const n = m.length, o = []; for (let r = 0; r < n; r++) { let row = ''; for (let c = 0; c < n; c++) row += m[n - 1 - c][r]; o.push(row); } return o; }
  function statesOf(key) { const out = []; let m = BASE[key].map(s => s); for (let i = 0; i < 4; i++) { const cells = []; for (let r = 0; r < m.length; r++) for (let c = 0; c < m.length; c++) if (m[r][c] === '1') cells.push([c, r]); out.push(cells); m = rotM(m); } return out; }
  const TSTATES = {}; Object.keys(BASE).forEach(k => TSTATES[k] = statesOf(k));
  const BAG = Object.keys(BASE);
  const GARB = '#888';

  /* =====================================================================
     3) VERSUS TETRIS — the MEME plays its own board; bury it in garbage
     ===================================================================== */
  function tetrisBoss(d) {
    const W = d.W, H = d.H, ctx = d.ctx, img = bossImg(d.memeId);
    const a = d.agg || {};
    const sendBoost = Math.min(3, a.multProd || 1);      // items send MORE garbage (capped)
    const cell = 20, PB = { x: 90, y: 120 }, EB = { x: 620, y: 120 };
    const rnd = () => BAG[(Math.random() * BAG.length) | 0];
    function mkBoard() { return { grid: Array.from({ length: ROWS }, () => Array(COLS).fill(0)), cur: null, nextK: rnd(), pending: 0, dead: false, lines: 0, flash: 0 }; }
    const player = mkBoard(), ai = mkBoard();
    const S = { state: 'run', fall: 0, fallInt: 0.6, aiT: 0, aiInt: 0.85 };  // AI is slower (dumber)
    const cellsP = (p) => TSTATES[p.k][p.rot].map(([c, r]) => [p.x + c, p.y + r]);
    function collide(b, p) { return cellsP(p).some(([c, r]) => c < 0 || c >= COLS || r >= ROWS || (r >= 0 && b.grid[r][c])); }
    function spawn(b) { const k = b.nextK; b.nextK = rnd(); b.cur = { k, rot: 0, x: 3, y: 0, color: PCOLOR[k] }; if (collide(b, b.cur)) { b.dead = true; b.cur = null; } }
    function applyGarbage(b, n) { for (let i = 0; i < n; i++) { if (b.grid[0].some(v => v)) { b.dead = true; return; } b.grid.shift(); const row = Array(COLS).fill(GARB); row[(Math.random() * COLS) | 0] = 0; b.grid.push(row); } }
    function lock(b, sendTo) {
      for (const [c, r] of cellsP(b.cur)) if (r >= 0) b.grid[r][c] = b.cur.color;
      let cleared = 0;
      for (let r = ROWS - 1; r >= 0; r--) { if (b.grid[r].every(v => v)) { b.grid.splice(r, 1); b.grid.unshift(Array(COLS).fill(0)); cleared++; r++; } }
      if (cleared) { b.lines += cleared; SFX.bossHit(); }
      else SFX.brick();
      if (b.pending > 0) { applyGarbage(b, b.pending); b.pending = 0; }
      if (cleared && sendTo) { const amt = Math.round((cleared + (cleared >= 4 ? 2 : cleared >= 2 ? 1 : 0)) * (sendTo === ai ? sendBoost : 1)); sendTo.pending += amt; sendTo.flash = .25; if (sendTo === ai) SFX.play('over9000'); }
      if (!b.dead) spawn(b);
    }
    function evalBoard(b, pp) {
      const g = b.grid.map(r => r.slice());
      for (const [c, r] of cellsP(pp)) if (r >= 0) g[r][c] = 1;
      let lines = 0; for (let r = ROWS - 1; r >= 0; r--) { if (g[r].every(v => v)) { g.splice(r, 1); g.unshift(Array(COLS).fill(0)); lines++; r++; } }
      const h = Array(COLS).fill(0); let holes = 0;
      for (let c = 0; c < COLS; c++) { let seen = false; for (let r = 0; r < ROWS; r++) { if (g[r][c]) { if (!seen) { h[c] = ROWS - r; seen = true; } } else if (seen) holes++; } }
      const agg = h.reduce((x, y) => x + y, 0); let bump = 0; for (let c = 0; c < COLS - 1; c++) bump += Math.abs(h[c] - h[c + 1]);
      return -0.51 * agg + 0.76 * lines - 0.36 * holes - 0.18 * bump;
    }
    function aiBest(b) {
      let best = null, bs = -1e9; const valids = [];
      for (let rot = 0; rot < 4; rot++) for (let x = -2; x < COLS; x++) {
        let p = { k: b.cur.k, rot, x, y: 0, color: b.cur.color };
        if (collide(b, p)) continue;
        let y = 0; while (!collide(b, { ...p, y: y + 1 })) y++;
        p = { ...p, y };
        if (cellsP(p).some(([c, r]) => r < 0)) continue;
        valids.push(p);
        const sc = evalBoard(b, p); if (sc > bs) { bs = sc; best = p; }
      }
      if (Math.random() < 0.35 && valids.length) return valids[(Math.random() * valids.length) | 0];  // dumb mistakes
      return best;
    }
    spawn(player); spawn(ai);
    function drawBoard(b, ox, oy, label) {
      ctx.fillStyle = '#0a0018cc'; ctx.fillRect(ox - 4, oy - 4, COLS * cell + 8, ROWS * cell + 8);
      ctx.strokeStyle = b.flash > 0 ? '#fff' : '#00ffd5'; ctx.lineWidth = 2; ctx.strokeRect(ox - 4, oy - 4, COLS * cell + 8, ROWS * cell + 8);
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (b.grid[r][c]) box(ox + c * cell, oy + r * cell, b.grid[r][c]);
      if (b.cur) for (const [c, r] of cellsP(b.cur)) if (r >= 0) box(ox + c * cell, oy + r * cell, b.cur.color);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Comic Sans MS'; ctx.textAlign = 'center';
      ctx.fillText(label, ox + COLS * cell / 2, oy - 12);
      if (b.pending > 0) { ctx.fillStyle = '#ff3b3b'; ctx.fillText('+' + b.pending + ' junk incoming', ox + COLS * cell / 2, oy + ROWS * cell + 22); }
    }
    function box(x, y, color) { ctx.fillStyle = color; ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2); ctx.fillStyle = '#fff3'; ctx.fillRect(x + 1, y + 1, cell - 2, 4); }
    return {
      get state() { return S.state; },
      forceWin() { S.state = 'win'; }, forceLose() { S.state = 'lose'; },
      debug() { return { pdead: player.dead, adead: ai.dead, pLines: player.lines, aLines: ai.lines }; },
      move() {}, down() { if (S.state !== 'run' || !player.cur) return; while (!collide(player, { ...player.cur, y: player.cur.y + 1 })) player.cur.y++; lock(player, ai); checkEnd(); },
      key(e) {
        if (S.state !== 'run' || !player.cur) return; const k = e.key, p = player;
        if (k === 'ArrowLeft' || k === 'a') { const n = { ...p.cur, x: p.cur.x - 1 }; if (!collide(p, n)) p.cur = n; }
        else if (k === 'ArrowRight' || k === 'd') { const n = { ...p.cur, x: p.cur.x + 1 }; if (!collide(p, n)) p.cur = n; }
        else if (k === 'ArrowDown' || k === 's') { const n = { ...p.cur, y: p.cur.y + 1 }; if (!collide(p, n)) p.cur = n; }
        else if (k === 'ArrowUp' || k === 'w') { const n = { ...p.cur, rot: (p.cur.rot + 1) % 4 }; if (!collide(p, n)) p.cur = n; else { const r1 = { ...n, x: n.x + 1 }; if (!collide(p, r1)) p.cur = r1; else { const r2 = { ...n, x: n.x - 1 }; if (!collide(p, r2)) p.cur = r2; } } }
      },
      update(dt) {
        if (S.state !== 'run') return;
        if (player.flash > 0) player.flash -= dt; if (ai.flash > 0) ai.flash -= dt;
        S.fall += dt; if (S.fall >= S.fallInt) { S.fall = 0; if (player.cur) { const n = { ...player.cur, y: player.cur.y + 1 }; if (collide(player, n)) lock(player, ai); else player.cur = n; } }
        S.aiT += dt; if (S.aiT >= S.aiInt) { S.aiT = 0; if (ai.cur) { const best = aiBest(ai); if (best) ai.cur = best; lock(ai, player); } }
        checkEnd();
      },
      render() {
        banner(ctx, W, '🧩 VERSUS TETRIS 🧩', '← → move · ↑ rotate · ↓ soft · CLICK hard-drop · clear lines to BURY the meme!');
        drawBoard(player, PB.x, PB.y, 'YOU');
        drawBoard(ai, EB.x, EB.y, 'MEME');
        const mw = 200, mx = W / 2 - mw / 2, my = 150;
        if (ai.flash > 0) { ctx.save(); ctx.globalAlpha = .5; ctx.fillStyle = '#fff'; ctx.fillRect(mx, my, mw, mw * .8); ctx.restore(); }
        drawImg(ctx, img, mx, my, mw, mw * .8);
        ctx.strokeStyle = '#ff3ea5'; ctx.lineWidth = 3; ctx.strokeRect(mx, my, mw, mw * .8);
        ctx.fillStyle = '#ffd23f'; ctx.font = 'bold 13px Comic Sans MS'; ctx.textAlign = 'center';
        ctx.fillText('the meme is playing too!', W / 2, my + mw * .8 + 24);
        ctx.fillText('bury its board to WIN', W / 2, my + mw * .8 + 44);
      },
    };
    function checkEnd() { if (ai.dead) S.state = 'win'; else if (player.dead) S.state = 'lose'; }
  }

  /* =====================================================================
     4) VERSUS PUYO — the MEME plays its own board; bury it in nuisance
     ===================================================================== */
  function puyoBoss(d) {
    const W = d.W, H = d.H, ctx = d.ctx, img = bossImg(d.memeId);
    const a = d.agg || {};
    const sendBoost = Math.min(3, a.multProd || 1);
    const PC = 6, PR = 12, cell = 26, PB = { x: 70, y: 110 }, EB = { x: 640, y: 110 };
    const COLORS = ['#ff3b3b', '#39ff14', '#3ea5ff', '#ffd23f'], GRAY = '#9a9aa5';
    const rc = () => COLORS[(Math.random() * COLORS.length) | 0];
    function mkBoard() { return { grid: Array.from({ length: PR }, () => Array(PC).fill(0)), pair: null, pending: 0, dead: false, chain: 0, flash: 0, resolving: false }; }
    const player = mkBoard(), ai = mkBoard();
    const S = { state: 'run', fall: 0, fallInt: 0.6, aiT: 0, aiInt: 1.3 };  // AI is much slower (dumber)
    function occ(b, c, r) { return c < 0 || c >= PC || r >= PR || (r >= 0 && b.grid[r][c]); }
    function satXY(p) { const o = [[0, -1], [1, 0], [0, 1], [-1, 0]][p.ori]; return [p.col + o[0], p.row + o[1]]; }
    function valid(b, p) { const [sc, sr] = satXY(p); return !occ(b, p.col, p.row) && !occ(b, sc, sr); }
    function spawn(b) { b.pair = { col: 2, row: 0, ori: 0, a: rc(), b: rc() }; if (occ(b, 2, 0) || occ(b, 2, 1)) b.dead = true; }
    function gravity(b) { for (let c = 0; c < PC; c++) { const st = []; for (let r = PR - 1; r >= 0; r--) if (b.grid[r][c]) st.push(b.grid[r][c]); for (let r = PR - 1; r >= 0; r--) b.grid[r][c] = st[PR - 1 - r] || 0; } }
    function applyNuisance(b, n) { for (let i = 0; i < n; i++) { let bc = 0, bh = PR + 1; for (let c = 0; c < PC; c++) { let h = 0; for (let r = 0; r < PR; r++) if (b.grid[r][c]) { h = PR - r; break; } if (h < bh) { bh = h; bc = c; } } if (bh >= PR) { b.dead = true; return; } b.grid[PR - 1 - bh][bc] = GRAY; } }
    function lockPair(b, foe) {
      const [sc, sr] = satXY(b.pair);
      if (b.pair.row >= 0) b.grid[b.pair.row][b.pair.col] = b.pair.a;
      if (sr >= 0) b.grid[sr][sc] = b.pair.b;
      b.pair = null; resolve(b, foe);
    }
    function resolve(b, foe) {
      b.resolving = true; let chain = 0, totalSent = 0;
      const step = () => {
        gravity(b);
        const seen = Array.from({ length: PR }, () => Array(PC).fill(false));
        let popped = 0; const toGray = [];
        for (let r = 0; r < PR; r++) for (let c = 0; c < PC; c++) {
          if (b.grid[r][c] && b.grid[r][c] !== GRAY && !seen[r][c]) {
            const col = b.grid[r][c], grp = [], st = [[r, c]]; seen[r][c] = true;
            while (st.length) { const [y, x] = st.pop(); grp.push([y, x]); for (const [dy, dx] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ny = y + dy, nx = x + dx; if (ny >= 0 && ny < PR && nx >= 0 && nx < PC && !seen[ny][nx] && b.grid[ny][nx] === col) { seen[ny][nx] = true; st.push([ny, nx]); } } }
            if (grp.length >= 4) { for (const [y, x] of grp) { b.grid[y][x] = 0; for (const [dy, dx] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ny = y + dy, nx = x + dx; if (ny >= 0 && ny < PR && nx >= 0 && nx < PC && b.grid[ny][nx] === GRAY) toGray.push([ny, nx]); } } popped += grp.length; }
          }
        }
        for (const [y, x] of toGray) b.grid[y][x] = 0;
        if (popped > 0) {
          chain++; b.chain = chain;
          const send = Math.round((Math.floor(popped / 2) + (chain - 1) * 2) * (foe === ai ? sendBoost : 1));
          totalSent += send; SFX.bossHit(); if (foe === ai) SFX.play('vineboom');
          setTimeout(step, 150);
        } else {
          b.resolving = false; b.chain = 0;
          if (totalSent > 0 && foe) { foe.pending += totalSent; foe.flash = .25; }
          if (b.pending > 0) { applyNuisance(b, b.pending); b.pending = 0; }
          if (!b.dead) spawn(b);
        }
      };
      step();
    }
    function aiBest(b) {
      let best = null, bs = -1e9; const valids = [];
      for (let col = 0; col < PC; col++) for (let ori = 0; ori < 4; ori++) {
        let p = { col, row: 0, ori, a: b.pair.a, b: b.pair.b };
        if (!valid(b, p)) continue;
        let row = 0; while (valid(b, { ...p, row: row + 1 })) row++;
        p = { ...p, row };
        valids.push(p);
        const sc = evalPuyo(b, p); if (sc > bs) { bs = sc; best = p; }
      }
      if (Math.random() < 0.45 && valids.length) return valids[(Math.random() * valids.length) | 0];  // dumb mistakes
      return best;
    }
    function evalPuyo(b, p) {
      const g = b.grid.map(r => r.slice()); const [sc, sr] = satXY(p);
      if (p.row >= 0 && p.row < PR && p.col >= 0 && p.col < PC) g[p.row][p.col] = p.a;
      if (sr >= 0 && sr < PR && sc >= 0 && sc < PC) g[sr][sc] = p.b;
      let adj = 0, maxh = 0;
      for (let c = 0; c < PC; c++) { for (let r = 0; r < PR; r++) if (g[r][c]) { maxh = Math.max(maxh, PR - r); break; } }
      for (let r = 0; r < PR; r++) for (let c = 0; c < PC; c++) { const v = g[r][c]; if (v && v !== GRAY) { if (c + 1 < PC && g[r][c + 1] === v) adj++; if (r + 1 < PR && g[r + 1][c] === v) adj++; } }
      return adj * 3 - maxh * 2;
    }
    spawn(player); spawn(ai);
    function drawBoard(b, ox, oy, label) {
      ctx.fillStyle = '#0a0018cc'; ctx.fillRect(ox - 4, oy - 4, PC * cell + 8, PR * cell + 8);
      ctx.strokeStyle = b.flash > 0 ? '#fff' : '#ff3ea5'; ctx.lineWidth = 2; ctx.strokeRect(ox - 4, oy - 4, PC * cell + 8, PR * cell + 8);
      for (let r = 0; r < PR; r++) for (let c = 0; c < PC; c++) if (b.grid[r][c]) blob(ox + c * cell, oy + r * cell, b.grid[r][c]);
      if (b.pair) { blob(ox + b.pair.col * cell, oy + b.pair.row * cell, b.pair.a); const [sc, sr] = satXY(b.pair); if (sr >= 0) blob(ox + sc * cell, oy + sr * cell, b.pair.b); }
      ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Comic Sans MS'; ctx.textAlign = 'center'; ctx.fillText(label, ox + PC * cell / 2, oy - 12);
      if (b.pending > 0) { ctx.fillStyle = '#ff3b3b'; ctx.fillText('+' + b.pending + ' nuisance!', ox + PC * cell / 2, oy + PR * cell + 22); }
      if (b.chain > 1) { ctx.fillStyle = '#ffd23f'; ctx.fillText(b.chain + ' CHAIN!', ox + PC * cell / 2, oy + PR * cell + 40); }
    }
    function blob(x, y, color) { const cx = x + cell / 2, cy = y + cell / 2; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(cx, cy, cell / 2 - 2, 0, 7); ctx.fill(); if (color !== GRAY) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx - 4, cy - 4, 3, 0, 7); ctx.fill(); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(cx - 4, cy - 4, 1.4, 0, 7); ctx.fill(); } }
    return {
      get state() { return S.state; },
      forceWin() { S.state = 'win'; }, forceLose() { S.state = 'lose'; },
      debug() { return { pdead: player.dead, adead: ai.dead }; },
      move() {}, down() { if (S.state !== 'run' || player.resolving || !player.pair) return; while (valid(player, { ...player.pair, row: player.pair.row + 1 })) player.pair.row++; lockPair(player, ai); checkEnd(); },
      key(e) {
        if (S.state !== 'run' || player.resolving || !player.pair) return; const k = e.key, p = player;
        if (k === 'ArrowLeft' || k === 'a') { const n = { ...p.pair, col: p.pair.col - 1 }; if (valid(p, n)) p.pair = n; }
        else if (k === 'ArrowRight' || k === 'd') { const n = { ...p.pair, col: p.pair.col + 1 }; if (valid(p, n)) p.pair = n; }
        else if (k === 'ArrowDown' || k === 's') { const n = { ...p.pair, row: p.pair.row + 1 }; if (valid(p, n)) p.pair = n; }
        else if (k === 'ArrowUp' || k === 'w') { const n = { ...p.pair, ori: (p.pair.ori + 1) % 4 }; if (valid(p, n)) p.pair = n; }
      },
      update(dt) {
        if (S.state !== 'run') return;
        if (player.flash > 0) player.flash -= dt; if (ai.flash > 0) ai.flash -= dt;
        if (!player.resolving && player.pair) { S.fall += dt; if (S.fall >= S.fallInt) { S.fall = 0; const n = { ...player.pair, row: player.pair.row + 1 }; if (valid(player, n)) player.pair = n; else lockPair(player, ai); } }
        if (!ai.resolving && ai.pair) { S.aiT += dt; if (S.aiT >= S.aiInt) { S.aiT = 0; const best = aiBest(ai); if (best) ai.pair = best; lockPair(ai, player); } }
        checkEnd();
      },
      render() {
        banner(ctx, W, '🫧 VERSUS PUYO 🫧', '← → move · ↑ rotate · ↓ soft · CLICK drop · match 4+ to nuke the MEME board!');
        drawBoard(player, PB.x, PB.y, 'YOU');
        drawBoard(ai, EB.x, EB.y, 'MEME');
        const mw = 200, mx = W / 2 - mw / 2, my = 150;
        if (ai.flash > 0) { ctx.save(); ctx.globalAlpha = .5; ctx.fillStyle = '#fff'; ctx.fillRect(mx, my, mw, mw * .8); ctx.restore(); }
        drawImg(ctx, img, mx, my, mw, mw * .8);
        ctx.strokeStyle = '#00ffd5'; ctx.lineWidth = 3; ctx.strokeRect(mx, my, mw, mw * .8);
        ctx.fillStyle = '#ffd23f'; ctx.font = 'bold 13px Comic Sans MS'; ctx.textAlign = 'center';
        ctx.fillText('the meme pops too!', W / 2, my + mw * .8 + 24);
        ctx.fillText('flood its board to WIN', W / 2, my + mw * .8 + 44);
      },
    };
    function checkEnd() { if (ai.dead) S.state = 'win'; else if (player.dead) S.state = 'lose'; }
  }

  const MAKERS = { meme: memeBoss, shmup: shmupBoss, tetris: tetrisBoss, puyo: puyoBoss };
  const ORDER = ['meme', 'shmup', 'tetris', 'puyo'];
  global.BOSSES = {
    order: ORDER,
    typeForRound(r) { return ORDER[(Math.floor(r / 5) - 1) % ORDER.length]; },
    create(type, deps) { return (MAKERS[type] || memeBoss)(deps); },
  };
})(window);
