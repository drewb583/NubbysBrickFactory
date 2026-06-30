/* ============================================================
   game.js — NUBBY'S BRICK FACTORY engine
   Arkanoid brick-breaker  ×  Nubby's Number Factory roguelike.
   Smash bricks -> manufacture NUMBER -> beat the QUOTA -> shop
   for memetic items & perks -> survive the ever-rising quota.
   ============================================================ */
(function () {
  'use strict';

  // ----------------------------------------------------------------
  //  CONSTANTS  (tweak here to rebalance)
  // ----------------------------------------------------------------
  const W = 900, H = 640;
  const BASE_QUOTA = 50, QUOTA_GROW = 1.42;   // quota(round)
  const BASE_BALLS = 4;                        // launches per round
  const BASE_SPEED = 430;                      // px/sec ball speed
  const PAD_W = 130, PAD_H = 16, PAD_Y = H - 36;
  const BALL_R = 9;
  const COLS = 11, GAP = 6, TOP = 64, SIDE = 40, BRICK_H = 22;
  const ROW_COLORS = ['#ff3ea5','#ff8a3e','#ffd23f','#39ff14','#00ffd5','#3ea5ff','#b06bff','#ff5fb0'];

  // catchphrase shouted when a meme brick is smashed (the obnoxious flash)
  const MEME_PHRASES = {
    doge:'MUCH BREAK. WOW.', datboi:'O SHIT WADDUP!', pingas:'PIIINGAS!', over9000:"IT'S OVER 9000!!!",
    stonks:'STONKS!', trollface:'PROBLEM?', nyan:'NYANYANYANYAN!', shrek:"IT'S ALL OGRE NOW",
    thisisfine:'THIS IS FINE.', rickroll:'NEVER GONNA GIVE YOU UP!', galaxybrain:'GALAXY BRAIN!',
    sanic:'GOTTA GO FAST!', pepe:'FEELS GOOD MAN', amogus:'SUUUS!', chungus:'ABSOLUTE UNIT',
    mlg:'360 NOSCOPE!', gigachad:'SIGMA GRINDSET', wojak:'I KNOW THAT FEEL', surprisedpikachu:'!!!',
    mockingspongebob:'sUcH bReAk', coffindance:'⚰️ ASTRONOMIA ⚰️', distractedbf:'WANDERING EYE',
    drake:'NAH... YEAH', womanyellingcat:'SMUDGE SAYS NO', isthisapigeon:'IS THIS A COMBO?',
    rollsafe:"CAN'T MISS IF YOU AIM", grusplan:'WAIT, THAT IS GOOD', harold:"I'M FINE",
    cheems:'BONK!', saltbae:'*sprinkle*', evilkermit:'do it.', successkid:'NAILED IT',
    badluckbrian:'OOF', dealwithit:'( •_•)>⌐■-■', philosoraptor:'DEEP THOUGHTS', boromir:'ONE DOES NOT SIMPLY',
    picardfacepalm:'*facepalm*', thanos:'PERFECTLY BALANCED', ancientaliens:'ALIENS.', bonk:'GO TO HORNY JAIL',
    starfox:"CAN'T LET YOU DO THAT!", barrelroll:'DO A BARREL ROLL!', squadala:"SQUADALA, WE'RE OFF!", weegee:'WEEGEE',
    mahboi:'MAH BOI!', ganon:'YOU MUST DIE!', spaghetti:'SPAGHETTI!', mamaluigi:'MAMA LUIGI!', immeen:'I.M. MEEN',
    mariohaha:'HAHA!', heehee:'HEE HEE!', sparta:'THIS IS SPARTAAA!', doomguy:'RIP AND TEAR', leeroy:'LEEEROY JENKINS!',
    shia:'JUST DO IT!', ugandanknuckles:'DO YOU KNOW DE WAY', immaheadout:'IGHT IMMA HEAD OUT', skibidi:'SKIBIDI BOP',
    grimace:'GRIMACE SHAKE', johnwick:'yeah.', therock:'👁️👄👁️', ohio:'ONLY IN OHIO', pressf:'PRESS F',
  };

  // Guarantee EVERY meme plays a real sound. memeFlash tries the meme's OWN
  // sound file first; if there isn't one, it uses this themed real-sound alias.
  const MEME_SND_ALIAS = {
    amogus:'amongus', doge:'owenwilsonwow', stonks:'taco', trollface:'sheesh', nyan:'crabrave',
    thisisfine:'sadviolin', galaxybrain:'illuminati', pepe:'bruh', chungus:'vineboom', mlg:'airhornmlg',
    gigachad:'airhornmlg', wojak:'sadviolin', surprisedpikachu:'vineboom', mockingspongebob:'sheesh',
    distractedbf:'owenwilsonwow', drake:'vineboom', womanyellingcat:'oof', isthisapigeon:'vineboom',
    rollsafe:'taco', grusplan:'bruh', harold:'sadviolin', cheems:'metalpipe', saltbae:'sheesh',
    evilkermit:'vineboom', successkid:'airhornmlg', badluckbrian:'oof', dealwithit:'airhornmlg',
    philosoraptor:'illuminati', boromir:'vineboom', picardfacepalm:'sadviolin', ancientaliens:'illuminati',
    bonk:'metalpipe',
    // new memes: themed fallback until their own clip downloads (own always wins)
    starfox:'airhornmlg', barrelroll:'sanic', squadala:'crabrave', weegee:'illuminati', mahboi:'owenwilsonwow',
    ganon:'wasted', spaghetti:'taco', mamaluigi:'taco', immeen:'sheesh', mariohaha:'owenwilsonwow', heehee:'sheesh',
    sparta:'airhornmlg', doomguy:'over9000', leeroy:'fbiopenup', shia:'airhornmlg', ugandanknuckles:'bruh',
    immaheadout:'bruh', skibidi:'vineboom', grimace:'vineboom', johnwick:'vineboom', therock:'sheesh',
    ohio:'vineboom', pressf:'oof',
  };

  // ----------------------------------------------------------------
  //  DOM
  // ----------------------------------------------------------------
  const $ = (id) => document.getElementById(id);
  const cv = $('game'), ctx = cv.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = W * dpr; cv.height = H * dpr;

  const elScreens = {
    title: $('screen-title'), shop: $('screen-shop'),
    perk: $('screen-perk'), over: $('screen-over'),
  };

  // ----------------------------------------------------------------
  //  STATE
  // ----------------------------------------------------------------
  let G = null;
  let boss = null;
  const isBossRound = (r) => r % 5 === 0;
  const bossName = (t) => ({ meme: 'GIANT MEME', shmup: 'BULLET HELL', tetris: 'TETRIS', puyo: 'PUYO' }[t] || 'BOSS');
  function freshRun() {
    G = {
      scene: 'title', round: 1, quota: 0, score: 0, coins: 0,
      ballsLeft: BASE_BALLS, wave: 1, combo: 0,
      items: [], perks: [],
      balls: [], bricks: [], pickups: [], lasers: [], particles: [], popups: [],
      paddle: { x: W / 2, w: PAD_W, h: PAD_H, y: PAD_Y },
      agg: {}, shake: 0, laserCd: 0, muted: false, flash: null,
      quotaMet: false, revivesUsed: 0, _over9k: false,
      stats: { bricks: 0, bestRound: 1, totalScore: 0 },
      mouseX: W / 2,
    };
    recompute();
  }

  // aggregate passive stats from owned items + perks
  function recompute() {
    const all = [...G.items, ...G.perks];
    const C = window.CONTENT;
    G.agg = {
      // MULTIPLICATIVE stacking: each copy compounds (2 Doges = 1.3 x 1.3 = 1.69x)
      multProd: C.prod(all, 'mult'),
      paddleProd: C.prod(all, 'paddleScale'),
      ballProd: C.prod(all, 'ballScale'),
      speedProd: C.prod(all, 'speedScale'),
      coinProd: C.prod(all, 'coinMult'),
      // COUNT/ADDITIVE stacking: more copies => more balls / lasers / etc.
      extraBalls: C.sum(all, 'extraBalls'),
      laserCount: C.count(all, 'laser'),
      revive: C.sum(all, 'revive'),
      startBalls: C.sum(all, 'startBalls'),
      shopDiscount: C.sum(all, 'shopDiscount'),
      pierceChance: Math.min(0.9, C.sum(all, 'pierceChance')),
      comboGain: C.any(all, 'comboGain'),
      comboPow: C.maxProp(all, 'comboPow') || 0.04,
      goldChance: C.sum(all, 'goldChance'),
      bombChance: C.sum(all, 'bombChance'),
      memeChance: C.sum(all, 'memeChance'),
      critChance: Math.min(0.9, C.sum(all, 'critChance')),
      coinBrickChance: Math.min(0.85, C.sum(all, 'coinBrickChance')),
      quotaCut: Math.min(0.6, C.sum(all, 'quotaCut')),
      magnet: C.any(all, 'magnet'),
      freeReroll: C.any(all, 'freeReroll'),
      comboKeep: C.any(all, 'comboKeep'),
    };
    G.paddle.w = PAD_W * G.agg.paddleProd;
  }
  const globalMult = () => G.agg.multProd;
  const maxBalls = () => Math.max(1, BASE_BALLS + G.agg.startBalls);
  const ballR = () => BALL_R * G.agg.ballProd;
  const ballSpeed = () => BASE_SPEED * G.agg.speedProd;
  const comboMult = () => (G.agg.comboGain ? 1 + G.combo * G.agg.comboPow : 1);

  function hook(name, e) {
    const all = [...G.items, ...G.perks];
    for (const d of all) if (typeof d[name] === 'function') d[name](G, e);
  }

  // ----------------------------------------------------------------
  //  GAME helper API (called from content.js item/perk hooks)
  // ----------------------------------------------------------------
  window.GAME = {
    rand: Math.random,
    toast,
    spawnCoinAt(x, y, value) {
      G.pickups.push({ x, y, vx: (Math.random() - 0.5) * 40, vy: 90, type: 'coin', value: value || 1, spin: 0 });
    },
    markSuperBrick(mult) {
      const alive = G.bricks.filter(b => b.alive && b.type === 'normal');
      if (!alive.length) return;
      const b = alive[(Math.random() * alive.length) | 0];
      b.type = 'super'; b.value = Math.round(b.value * mult); b.meme = 'amogus';
    },
    explodeAllBricks(bonusPerBrick) {
      let total = 0, cx = 0, cy = 0, n = 0;
      for (const b of G.bricks) if (b.alive) {
        total += b.value + (bonusPerBrick || 0);
        cx += b.x; cy += b.y; n++;
        b.alive = false;
        burst(b.x, b.y, b.color, 4);
      }
      if (!n) return;
      G.shake = 22;
      gainScore(total * globalMult(), cx / n, cy / n, false);
    },
  };

  // ----------------------------------------------------------------
  //  ROUND / BRICK SETUP
  // ----------------------------------------------------------------
  function quotaFor(r) { return r === 1 ? 40 : Math.round(BASE_QUOTA * Math.pow(QUOTA_GROW, r - 1)); }

  function buildBricks() {
    const rows = Math.min(3 + Math.floor(G.round / 2), 8);
    const baseVal = 1 + Math.floor(G.round * 0.7);
    const areaW = W - SIDE * 2;
    const bw = (areaW - (COLS - 1) * GAP) / COLS;
    const a = G.agg || {};
    const gC = 0.08 + (a.goldChance || 0);
    const bC = gC + 0.06 + (a.bombChance || 0);
    const mC = bC + 0.13 + (a.memeChance || 0);
    const bricks = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < COLS; c++) {
        const roll = Math.random();
        let type = 'normal', value = baseVal, meme = null;
        if (roll < gC) { type = 'gold'; value = baseVal * 5; }
        else if (roll < bC) { type = 'bomb'; value = baseVal * 2; }
        else if (roll < mC) { type = 'meme'; value = baseVal * 3; meme = MEMES.ids[(Math.random() * MEMES.ids.length) | 0]; }
        bricks.push({
          x: SIDE + c * (bw + GAP) + bw / 2,
          y: TOP + r * (BRICK_H + GAP) + BRICK_H / 2,
          w: bw, h: BRICK_H, row: r, col: c,
          type, value, meme, alive: true,
          color: type === 'gold' ? '#ffd23f' : type === 'bomb' ? '#ff3b3b'
               : type === 'meme' ? '#b06bff' : ROW_COLORS[r % ROW_COLORS.length],
        });
      }
    }
    G.bricks = bricks;
  }

  function startRound(r) {
    G.round = r;
    recompute();
    if (isBossRound(r)) { startBoss(r); return; }
    $('quotabar').style.display = '';
    G.quota = Math.max(10, Math.round(quotaFor(r) * (1 - (G.agg.quotaCut || 0))));
    G.score = 0; G.combo = 0; G.wave = 1;
    G.quotaMet = false; G._over9k = false;
    G.ballsLeft = maxBalls();
    G.balls = []; G.pickups = []; G.lasers = []; G.particles = []; G.popups = [];
    recompute();
    buildBricks();
    hook('onRoundStart', {});
    reloadBall();
    G.scene = 'play';
    hideAllScreens();
    $('cashout').classList.add('hidden');
    if (r > G.stats.bestRound) G.stats.bestRound = r;
    updateHUD();
    toast('ROUND ' + r + ' — QUOTA ' + G.quota, 1);
  }

  function refillWave() {
    G.wave++;
    buildBricks();
    toast('WAVE ' + G.wave + '! such brick', 0);
  }

  // ----------------------------------------------------------------
  //  BALLS / LAUNCH
  // ----------------------------------------------------------------
  function reloadBall() {
    G.balls.push({ x: G.paddle.x, y: PAD_Y - ballR() - 2, vx: 0, vy: 0, r: ballR(), stuck: true, trail: [] });
  }
  function launch() {
    const ball = G.balls.find(b => b.stuck);
    if (!ball) return;
    const sp = ballSpeed();
    const ang = -Math.PI / 2 + (Math.random() - 0.5) * 0.5;
    ball.vx = Math.cos(ang) * sp; ball.vy = Math.sin(ang) * sp; ball.stuck = false;
    hook('onLaunch', {});
    for (let i = 0; i < G.agg.extraBalls; i++) {
      const a = -Math.PI / 2 + (i + 1) * 0.32 * (i % 2 ? 1 : -1);
      G.balls.push({ x: G.paddle.x, y: PAD_Y - ballR() - 2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: ballR(), stuck: false, trail: [] });
    }
    SFX.hit();
  }

  function endLaunch() {
    const e = { save: false };
    hook('onBallLost', e);
    if (e.save) { reloadBall(); return; }
    G.ballsLeft--;
    SFX.play('bruh');
    updateHUD();
    if (G.ballsLeft > 0) { reloadBall(); return; }
    // out of balls
    if (G.score >= G.quota) { cashOut(); }
    else if (G.agg.revive > G.revivesUsed) {
      G.revivesUsed++; G.ballsLeft = maxBalls(); reloadBall(); updateHUD();
      toast('NEVER GONNA GIVE YOU UP 🎶'); if (!SFX.play('rickroll')) SFX.wow();
    } else gameOver();
  }

  function fireLasers() {
    const n = G.agg.laserCount; if (!n || G.laserCd > 0) return;
    G.laserCd = 0.28;
    const beams = 2 * n, w = G.paddle.w;              // each laser item adds 2 beams
    for (let i = 0; i < beams; i++) G.lasers.push({ x: G.paddle.x - w / 2 + (i + 0.5) * (w / beams), y: PAD_Y });
    SFX.laser();
  }

  // ----------------------------------------------------------------
  //  SCORING
  // ----------------------------------------------------------------
  function gainScore(amount, x, y, withHooks) {
    amount = Math.max(0, Math.round(amount));
    if (amount <= 0) return;
    G.score += amount;
    popup('+' + fmt(amount), x, y, '#00ffd5', 18 + Math.min(20, amount / 40));
    if (withHooks) hook('onScore', {});
    checkQuota();
    updateHUD();
  }

  function breakBrick(b, depth) {
    if (!b.alive) return;
    b.alive = false;
    G.stats.bricks++;
    const e = { brick: b, base: b.value, bonus: 0, multAdd: 0 };
    hook('onBrickBreak', e);
    let crit = 1;
    if (G.agg.critChance && Math.random() < G.agg.critChance) { crit = 5; popup('CRIT! x5', b.x, b.y, '#ff3b3b', 22); }
    const gained = (e.base + e.bonus) * globalMult() * (1 + e.multAdd) * comboMult() * crit;
    G.combo++;
    burst(b.x, b.y, b.color, b.type === 'gold' ? 10 : 6);
    if (G.agg.coinBrickChance && Math.random() < G.agg.coinBrickChance) GAME.spawnCoinAt(b.x, b.y, 1);
    if (b.type === 'gold') { SFX.gold(); if (Math.random() < 0.5) GAME.spawnCoinAt(b.x, b.y, 1); }
    else if (!b.meme) SFX.brick();
    if (b.meme) memeFlash(b.meme);          // OBNOXIOUS fullscreen meme + airhorn
    gainScore(gained, b.x, b.y, true);
    if (b.type === 'bomb' && (depth || 0) < 6) {
      G.shake = Math.max(G.shake, 14); SFX.explode();
      const rad = (b.w + GAP) * 1.7;
      for (const o of G.bricks) {
        if (o.alive && Math.hypot(o.x - b.x, o.y - b.y) < rad) breakBrick(o, (depth || 0) + 1);
      }
    }
  }

  // ===== OBNOXIOUS meme-brick flash: fullscreen strobe meme + airhorn =====
  function memeFlash(id) {
    G.flash = { id, t: 0, life: 1 };
    G.shake = Math.max(G.shake, 22);
    // ONE sound at a time: just the meme's own clip (airhorn only if it has none)
    if (!SFX.play(id) && !SFX.play(MEME_SND_ALIAS[id])) SFX.airhorn();
    toast(MEME_PHRASES[id] || 'MEME!');
    for (let i = 0; i < 5; i++) burst(Math.random() * W, Math.random() * H * 0.6, ['#ff3ea5','#00ffd5','#ffd23f','#39ff14'][i % 4], 4);
  }

  function checkQuota() {
    if (G.quotaMet || G.score < G.quota) return;
    G.quotaMet = true;
    hook('onQuota', {});
    $('cashout').classList.remove('hidden');
    G.shake = Math.max(G.shake, 14);
    SFX.quota(); SFX.play('airhornmlg');
    toast('QUOTA SMASHED! 💰 cash out anytime');
  }

  // ----------------------------------------------------------------
  //  CASH OUT  ->  PERK / SHOP
  // ----------------------------------------------------------------
  function cashOut() {
    if (G.scene !== 'play') return;
    const overage = Math.max(0, G.score - G.quota);
    const e = { coins: 2 + G.ballsLeft * 2 + Math.floor(overage / Math.max(1, G.quota) * 4) };
    hook('onCashOut', e);
    const total = Math.max(2, Math.round(e.coins * G.agg.coinProd));
    G.stats.totalScore += G.score;
    afterRound(total, 'CASHED OUT +' + total + ' NUBBINS 🤑');
  }

  // shared round-end transition -> perk (every 3rd) or shop
  function afterRound(coinReward, msg) {
    G.coins += coinReward;
    SFX.levelup();
    toast(msg);
    $('cashout').classList.add('hidden');
    const finished = G.round;
    G.scene = 'between';
    if (finished % 3 === 0) showPerks(); else showShop();
  }

  // ===== BOSS ROUNDS =====
  function startBoss(r) {
    const type = BOSSES.typeForRound(r);
    const memeId = MEMES.ids[(Math.random() * MEMES.ids.length) | 0];
    boss = BOSSES.create(type, { ctx, W, H, memeId, toast, agg: G.agg, round: r });
    G.boss = { type, memeId };
    G.scene = 'boss';
    hideAllScreens();
    $('cashout').classList.add('hidden');
    $('quotabar').style.display = 'none';
    if (r > G.stats.bestRound) G.stats.bestRound = r;
    updateHUD();
    SFX.musicStart();
    if (!SFX.play('tobecontinued')) SFX.play('johncena');
    SFX.airhorn();
    toast('BOSS ROUND ' + r + '! ' + bossName(type));
  }
  function bossWin() {
    boss = null;
    const reward = 8 + G.round;
    SFX.airhorn(); SFX.play('crabrave');
    afterRound(reward, 'BOSS DEFEATED +' + reward + ' NUBBINS 🏆');
  }
  function bossLose() {
    boss = null;
    if (G.agg.revive > G.revivesUsed) {
      G.revivesUsed++; SFX.play('rickroll'); toast('NEVER GONNA GIVE YOU UP 🎶');
      startBoss(G.round); return;
    }
    gameOver();
  }

  function gameOver() {
    G.scene = 'over';
    boss = null;
    SFX.lose();
    if (!SFX.play('wasted')) SFX.play('sadviolin');
    const phrases = ['Nubby is disappointed.', 'task failed successfully', 'F in the chat',
      'oof. big oof.', 'the quota remains unfed', 'much fail · very sad · wow'];
    $('oversub').textContent = phrases[(Math.random() * phrases.length) | 0];
    $('over-stats').innerHTML =
      'You reached <b>Round ' + G.round + '</b><br>' +
      'Final quota: <b>' + fmt(G.quota) + '</b> · your number: <b>' + fmt(G.score) + '</b><br>' +
      'Total NUMBER manufactured: <b>' + fmt(G.stats.totalScore) + '</b><br>' +
      'Bricks obliterated: <b>' + G.stats.bricks + '</b> · NUBBINS: <b>' + G.coins + '</b><br>' +
      'Items collected: <b>' + G.items.length + '</b> · Perks: <b>' + G.perks.length + '</b>';
    showScreen('over');
  }

  // ----------------------------------------------------------------
  //  SHOP
  // ----------------------------------------------------------------
  function weightedItem() {
    const w = { common: 50, rare: 30, epic: 15, legendary: 5 };
    const pool = [];
    for (const it of CONTENT.items) for (let i = 0; i < w[it.rarity]; i++) pool.push(it);
    return pool[(Math.random() * pool.length) | 0];
  }
  function rollShop() {
    const out = [], seen = new Set();
    let guard = 0;
    while (out.length < 4 && guard++ < 80) {
      const it = weightedItem();
      if (seen.has(it.id)) continue;
      seen.add(it.id); out.push(it);
    }
    G.shopOffer = out;
  }
  function price(it) { return Math.max(1, it.price - G.agg.shopDiscount); }
  function rerollCost() { return G.agg.freeReroll ? 0 : 3; }

  function showShop() {
    if (!G.shopOffer) rollShop();
    renderShop();
    showScreen('shop');
  }
  function renderShop() {
    const host = $('shop-items'); host.innerHTML = '';
    G.shopOffer.forEach((it) => host.appendChild(makeCard(it, false)));
    $('rerollcost').textContent = rerollCost();
    $('btn-reroll').disabled = G.coins < rerollCost();
  }
  function makeCard(def, isPerk) {
    const card = document.createElement('div');
    card.className = 'card' + (isPerk ? ' perkcard' : '');
    const cost = isPerk ? 0 : price(def);
    const owned = !isPerk && false /*no cap: all items stack*/;
    card.innerHTML =
      `<img class="art" src="${MEMES.uri(def.art)}" alt="${def.name}">` +
      `<div class="nm">${def.name}</div>` +
      (isPerk ? '' : `<div class="rar ${def.rarity}">${def.rarity}</div>`) +
      `<div class="ds">${def.desc}</div>` +
      `<div class="fl">“${def.flavor}”</div>` +
      (isPerk
        ? `<button class="buy">✚ TAKE PERK</button>`
        : `<button class="buy">${owned ? 'INV FULL' : 'BUY · ' + cost + ' 🪙'}</button>`);
    const btn = card.querySelector('.buy');
    if (isPerk) {
      btn.onclick = () => pickPerk(def);
    } else {
      btn.disabled = owned || G.coins < cost;
      btn.onclick = () => buyItem(def, card);
    }
    return card;
  }
  function buyItem(def, card) {
    const cost = price(def);
    if (G.coins < cost || false /*no cap: all items stack*/) return;
    G.coins -= cost;
    G.items.push(Object.assign({}, def));   // clone so duplicates stack
    recompute(); updateHUD(); renderInventory();
    if (!SFX.play(def.art) && !SFX.play(MEME_SND_ALIAS[def.art])) SFX.buy();  // the meme you buy shouts its sound (one at a time)
    toast('GOT ' + def.name.toUpperCase() + '!');
    const btn = card.querySelector('.buy');
    btn.textContent = '✔ OWNED'; btn.disabled = true; card.classList.add('owned');
    // refresh other buttons' affordability
    document.querySelectorAll('#shop-items .card').forEach((c, i) => {
      const b = c.querySelector('.buy');
      if (!c.classList.contains('owned')) b.disabled = G.coins < price(G.shopOffer[i]) || false /*no cap: all items stack*/;
    });
    $('btn-reroll').disabled = G.coins < rerollCost();
  }

  // ----------------------------------------------------------------
  //  PERKS
  // ----------------------------------------------------------------
  function showPerks() {
    const ownedIds = new Set(G.perks.map(p => p.id));
    const pool = CONTENT.perks.filter(p => !ownedIds.has(p.id));
    const offer = [];
    while (offer.length < 3 && pool.length) offer.push(pool.splice((Math.random() * pool.length) | 0, 1)[0]);
    const host = $('perk-items'); host.innerHTML = '';
    offer.forEach(p => host.appendChild(makeCard(p, true)));
    showScreen('perk');
  }
  function pickPerk(def) {
    G.perks.push(Object.assign({}, def));
    recompute(); updateHUD(); renderInventory();
    SFX.levelup();
    if (!SFX.play(def.art) && !SFX.play(MEME_SND_ALIAS[def.art])) {}   // perk's meme also shouts
    toast('PERK: ' + def.name + '!');
    G.shopOffer = null; rollShop();
    showShop();
  }

  // ----------------------------------------------------------------
  //  HUD / INVENTORY
  // ----------------------------------------------------------------
  function setStat(id, val, pulse) {
    const el = $(id).querySelector('b');
    el.textContent = val;
    if (pulse) { el.parentElement.classList.remove('pulse'); void el.offsetWidth; el.parentElement.classList.add('pulse'); }
  }
  let lastScore = 0;
  function updateHUD() {
    setStat('stat-round', G.round);
    setStat('stat-quota', fmt(G.quota));
    setStat('stat-score', fmt(G.score), G.score !== lastScore);
    lastScore = G.score;
    setStat('stat-balls', '🔴'.repeat(Math.max(0, G.ballsLeft)) || '0');
    setStat('stat-coins', G.coins);
    setStat('stat-mult', 'x' + globalMult().toFixed(2));
    const pct = G.quota ? Math.min(100, G.score / G.quota * 100) : 0;
    $('quotafill').style.width = pct + '%';
    $('quotalabel').textContent = fmt(G.score) + ' / ' + fmt(G.quota) + (G.quotaMet ? '  ✅ MET!' : '');
  }
  function renderInventory() {
    const host = $('inventory'); host.innerHTML = '';
    const groups = {};
    G.items.forEach(it => { groups[it.id] = groups[it.id] || { def: it, n: 0 }; groups[it.id].n++; });
    Object.values(groups).forEach(g => host.appendChild(chip(g.def, g.n, false)));
    G.perks.forEach(p => host.appendChild(chip(p, 1, true)));
  }
  function chip(def, n, isPerk) {
    const d = document.createElement('div');
    d.className = 'invchip';
    if (isPerk) d.style.borderColor = '#00ffd5', d.style.boxShadow = '0 0 6px #00ffd5';
    d.innerHTML = `<img src="${MEMES.uri(def.art)}">` +
      (n > 1 ? `<span class="badge">${n}</span>` : '') +
      `<div class="tip"><b>${def.name}</b>${isPerk ? ' <i>(perk)</i>' : ''}<br>${def.desc}<br><i>“${def.flavor}”</i></div>`;
    return d;
  }

  // ----------------------------------------------------------------
  //  SCREENS
  // ----------------------------------------------------------------
  function hideAllScreens() { for (const k in elScreens) elScreens[k].classList.add('hidden'); }
  function showScreen(name) { hideAllScreens(); elScreens[name].classList.remove('hidden'); }

  // ----------------------------------------------------------------
  //  TOASTS / POPUPS / PARTICLES
  // ----------------------------------------------------------------
  function toast(text) {
    const host = $('toaster');
    if (host.children.length > 4) host.removeChild(host.firstChild);
    const d = document.createElement('div');
    d.className = 'toast'; d.textContent = text;
    host.appendChild(d);
    setTimeout(() => d.remove(), 1100);
  }
  function popup(text, x, y, color, size) { G.popups.push({ text, x, y, vy: -42, life: 1, color, size: size || 18 }); }
  function burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 40 + Math.random() * 160;
      G.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: 1, color, size: 2 + Math.random() * 3 });
    }
  }

  // ----------------------------------------------------------------
  //  UPDATE
  // ----------------------------------------------------------------
  function update(dt) {
    if (G.laserCd > 0) G.laserCd -= dt;
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 40);

    if (G.scene === 'boss' && boss) {
      boss.update(dt);
      const st = boss.state;
      if (st === 'win') { bossWin(); return; }
      if (st === 'lose') { bossLose(); return; }
      decayFx(dt);
      return;
    }

    // paddle follows mouse
    G.paddle.x += (G.mouseX - G.paddle.x) * Math.min(1, dt * 18);
    G.paddle.x = clamp(G.paddle.x, G.paddle.w / 2, W - G.paddle.w / 2);

    if (G.scene !== 'play') { decayFx(dt); return; }

    // balls
    for (const ball of G.balls) {
      if (ball.stuck) { ball.x = G.paddle.x; ball.y = PAD_Y - ball.r - 2; continue; }
      const steps = Math.max(1, Math.ceil(Math.hypot(ball.vx, ball.vy) * dt / (ball.r * 0.8)));
      const sdt = dt / steps;
      for (let s = 0; s < steps; s++) moveBall(ball, sdt);
      ball.trail.push({ x: ball.x, y: ball.y });
      if (ball.trail.length > 8) ball.trail.shift();
    }
    G.balls = G.balls.filter(b => b.y - b.r <= H + 4);
    if (G.balls.length === 0) { endLaunch(); }

    // lasers
    for (const l of G.lasers) {
      l.y -= 900 * dt;
      for (const b of G.bricks) if (b.alive && Math.abs(b.x - l.x) < b.w / 2 && Math.abs(b.y - l.y) < b.h / 2) {
        breakBrick(b); l.dead = true; break;
      }
    }
    G.lasers = G.lasers.filter(l => !l.dead && l.y > 0);

    // pickups
    for (const p of G.pickups) {
      if (G.agg.magnet) p.x += (G.paddle.x - p.x) * Math.min(1, dt * 4);   // loot goblin homing
      p.x += (p.vx || 0) * dt; p.y += p.vy * dt; p.spin += dt * 8;
      if (p.y > PAD_Y - 14 && p.y < PAD_Y + 14 && Math.abs(p.x - G.paddle.x) < G.paddle.w / 2 + 8) {
        p.dead = true; G.coins += p.value; SFX.coin(); popup('+' + p.value + '🪙', p.x, p.y, '#ffd23f', 16); updateHUD();
      }
    }
    G.pickups = G.pickups.filter(p => !p.dead && p.y < H + 20);

    // wave refill
    if (G.scene === 'play' && !G.bricks.some(b => b.alive)) refillWave();

    decayFx(dt);
  }

  function moveBall(ball, dt) {
    ball.x += ball.vx * dt; ball.y += ball.vy * dt;
    // walls
    if (ball.x < ball.r) { ball.x = ball.r; ball.vx = Math.abs(ball.vx); SFX.bounce(); }
    if (ball.x > W - ball.r) { ball.x = W - ball.r; ball.vx = -Math.abs(ball.vx); SFX.bounce(); }
    if (ball.y < ball.r) { ball.y = ball.r; ball.vy = Math.abs(ball.vy); SFX.bounce(); }
    // paddle
    if (ball.vy > 0 && ball.y + ball.r >= PAD_Y - PAD_H / 2 && ball.y - ball.r < PAD_Y + PAD_H / 2 &&
        Math.abs(ball.x - G.paddle.x) < G.paddle.w / 2 + ball.r) {
      const hit = clamp((ball.x - G.paddle.x) / (G.paddle.w / 2), -1, 1);
      const ang = -Math.PI / 2 + hit * (Math.PI / 3);
      const sp = Math.hypot(ball.vx, ball.vy);
      ball.vx = Math.cos(ang) * sp; ball.vy = Math.sin(ang) * sp;
      ball.y = PAD_Y - PAD_H / 2 - ball.r - 1;
      if (G.agg.comboGain && !G.agg.comboKeep) G.combo = 0;   // bonk keeps the combo
      SFX.bounce();
    }
    // bricks
    for (const b of G.bricks) {
      if (!b.alive) continue;
      if (Math.abs(ball.x - b.x) > b.w / 2 + ball.r || Math.abs(ball.y - b.y) > b.h / 2 + ball.r) continue;
      const pierced = Math.random() < G.agg.pierceChance;
      breakBrick(b);
      if (!pierced) {
        const ox = (b.w / 2 + ball.r) - Math.abs(ball.x - b.x);
        const oy = (b.h / 2 + ball.r) - Math.abs(ball.y - b.y);
        if (ox < oy) ball.vx = ball.x < b.x ? -Math.abs(ball.vx) : Math.abs(ball.vx);
        else ball.vy = ball.y < b.y ? -Math.abs(ball.vy) : Math.abs(ball.vy);
        break;
      }
    }
  }

  function decayFx(dt) {
    for (const p of G.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 380 * dt; p.life -= dt * 1.6; }
    G.particles = G.particles.filter(p => p.life > 0);
    for (const p of G.popups) { p.y += p.vy * dt; p.vy *= 0.92; p.life -= dt * 1.1; }
    G.popups = G.popups.filter(p => p.life > 0);
    if (G.flash) { G.flash.t += dt; G.flash.life -= dt / 0.7; if (G.flash.life <= 0) G.flash = null; }
  }

  // ----------------------------------------------------------------
  //  RENDER
  // ----------------------------------------------------------------
  let t = 0;
  function render() {
    t += 0.016;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (G.shake > 0) ctx.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake);

    // background
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#16002e'); g.addColorStop(1, '#06001a');
    ctx.fillStyle = g; ctx.fillRect(-30, -30, W + 60, H + 60);
    // moving star grid
    ctx.globalAlpha = 0.25;
    for (let i = 0; i < 40; i++) {
      const x = (i * 137.5 + t * 18) % W, y = (i * 53.3 + t * 30) % H;
      ctx.fillStyle = i % 3 ? '#ff3ea5' : '#00ffd5';
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.globalAlpha = 1;

    if (G.scene === 'boss' && boss) { boss.render(); return; }

    // bricks
    for (const b of G.bricks) if (b.alive) drawBrick(b);

    // pickups (coin flip — radiusX must stay positive or canvas throws)
    for (const p of G.pickups) {
      ctx.save(); ctx.translate(p.x, p.y);
      ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 2;
      const rx = Math.max(1.5, Math.abs(Math.cos(p.spin)) * 7);
      ctx.beginPath(); ctx.ellipse(0, 0, rx, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#b8860b'; ctx.font = 'bold 9px Comic Sans MS'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (rx > 4) ctx.fillText('$', 0, 1);
      ctx.textBaseline = 'alphabetic';
      ctx.restore();
    }

    // lasers
    ctx.strokeStyle = '#39ff14'; ctx.lineWidth = 4; ctx.shadowColor = '#39ff14'; ctx.shadowBlur = 10;
    for (const l of G.lasers) { ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.lineTo(l.x, l.y - 18); ctx.stroke(); }
    ctx.shadowBlur = 0;

    // paddle
    drawPaddle();

    // balls + trails
    for (const ball of G.balls) {
      for (let i = 0; i < ball.trail.length; i++) {
        const tp = ball.trail[i];
        ctx.globalAlpha = (i / ball.trail.length) * 0.4;
        ctx.fillStyle = '#00ffd5';
        ctx.beginPath(); ctx.arc(tp.x, tp.y, ball.r * (i / ball.trail.length), 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff'; ctx.shadowColor = '#00ffd5'; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }

    // particles
    for (const p of G.particles) {
      ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    // popups
    ctx.textAlign = 'center'; ctx.font = 'bold 18px Comic Sans MS';
    for (const p of G.popups) {
      ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.color;
      ctx.font = 'bold ' + p.size + 'px Comic Sans MS';
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;

    // combo
    if (G.scene === 'play' && G.agg.comboGain && G.combo > 1) {
      ctx.fillStyle = '#c46bff'; ctx.font = 'bold 22px Comic Sans MS'; ctx.textAlign = 'center';
      ctx.fillText('COMBO x' + (1 + G.combo * G.agg.comboPow).toFixed(2), W / 2, H - 60);
    }

    // OBNOXIOUS meme-brick flash, drawn over everything
    if (G.flash) drawMemeFlash();
  }

  function drawMemeFlash() {
    const f = G.flash, img = MEMES.get(f.id);
    const a = Math.min(1, f.life * 1.5);
    const ready = img && img.complete && img.naturalWidth;
    // strobing rainbow backdrop
    ctx.globalAlpha = a * (0.16 + 0.22 * Math.abs(Math.sin(f.t * 28)));
    ctx.fillStyle = ['#ff3ea5','#00ffd5','#ffd23f','#39ff14','#b06bff'][Math.floor(f.t * 30) % 5];
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = a;
    // 6 orbiting spinning copies
    for (let i = 0; i < 6; i++) {
      const ang = f.t * 7 + i * Math.PI / 3;
      const ox = W / 2 + Math.cos(ang) * 320, oy = H / 2 + Math.sin(ang) * 205, s = 62;
      if (ready) { ctx.save(); ctx.translate(ox, oy); ctx.rotate(ang * 2); try { ctx.drawImage(img, -s / 2, -s / 2, s, s); } catch (e) {} ctx.restore(); }
    }
    // pulsing rotating center meme
    const sc = 1 + 0.16 * Math.sin(f.t * 24), big = Math.min(W, H) * 0.4 * sc;
    if (ready) { ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(Math.sin(f.t * 11) * 0.09); try { ctx.drawImage(img, -big / 2, -big / 2, big, big); } catch (e) {} ctx.restore(); }
    // wobbling catchphrase
    const ph = MEME_PHRASES[f.id] || 'MEME!';
    ctx.textAlign = 'center';
    const fs = 38 + 8 * Math.sin(f.t * 22);
    ctx.font = 'bold ' + fs + 'px Comic Sans MS';
    ctx.lineWidth = 7; ctx.strokeStyle = '#000'; ctx.strokeText(ph, W / 2, H * 0.86);
    ctx.fillStyle = ['#fff','#ffd23f','#00ffd5'][Math.floor(f.t * 24) % 3];
    ctx.fillText(ph, W / 2, H * 0.86);
    ctx.globalAlpha = 1; ctx.textAlign = 'left';
  }

  function drawBrick(b) {
    ctx.save();
    ctx.shadowColor = b.color; ctx.shadowBlur = 8;
    ctx.fillStyle = b.color;
    roundRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 5); ctx.fill();
    ctx.shadowBlur = 0;
    if (b.meme && MEMES.get(b.meme).complete) {
      try { ctx.drawImage(MEMES.get(b.meme), b.x - b.h / 2, b.y - b.h / 2, b.h, b.h); } catch (e) {}
    }
    ctx.fillStyle = '#0a0018'; ctx.font = 'bold 12px Comic Sans MS'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(fmt(b.value), b.x + (b.meme ? b.h / 2 - 4 : 0), b.y);
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }

  function drawPaddle() {
    const p = G.paddle;
    ctx.save();
    ctx.shadowColor = '#ff3ea5'; ctx.shadowBlur = 14;
    const g = ctx.createLinearGradient(p.x - p.w / 2, 0, p.x + p.w / 2, 0);
    g.addColorStop(0, '#ff3ea5'); g.addColorStop(0.5, '#ffd23f'); g.addColorStop(1, '#00ffd5');
    ctx.fillStyle = g;
    roundRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h, 8); ctx.fill();
    ctx.shadowBlur = 0;
    // doge face on paddle
    const dg = MEMES.get('doge');
    if (dg.complete) { try { ctx.drawImage(dg, p.x - 12, p.y - 12, 24, 24); } catch (e) {} }
    ctx.restore();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ----------------------------------------------------------------
  //  LOOP
  // ----------------------------------------------------------------
  let last = 0;
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000 || 0.016);
    last = now;
    // crash-proof: a single bad frame must NEVER kill the loop (that froze
    // the canvas, making the paddle/ball "disappear" and bricks "not reset")
    try { if (G) { update(dt); render(); } }
    catch (err) { if (window.console) console.error('frame error (recovered):', err); }
    requestAnimationFrame(frame);
  }

  // ----------------------------------------------------------------
  //  INPUT
  // ----------------------------------------------------------------
  function canvasX(clientX) {
    const r = cv.getBoundingClientRect();
    return clamp((clientX - r.left) / r.width * W, 0, W);
  }
  cv.addEventListener('mousemove', (e) => { G.mouseX = canvasX(e.clientX); if (G.scene === 'boss' && boss) boss.move(G.mouseX); });
  cv.addEventListener('touchmove', (e) => { if (e.touches[0]) { G.mouseX = canvasX(e.touches[0].clientX); if (G.scene === 'boss' && boss) boss.move(G.mouseX); e.preventDefault(); } }, { passive: false });
  function primary() {
    SFX.init(); SFX.musicStart();
    if (G.scene === 'boss' && boss) { boss.down(); return; }
    if (G.scene !== 'play') return;
    if (G.balls.some(b => b.stuck)) launch();
    else fireLasers();
  }
  cv.addEventListener('mousedown', primary);
  cv.addEventListener('touchstart', (e) => { if (e.touches[0]) G.mouseX = canvasX(e.touches[0].clientX); primary(); e.preventDefault(); }, { passive: false });
  window.addEventListener('keydown', (e) => {
    if (G.scene === 'boss' && boss) {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) || e.code === 'Space') e.preventDefault();
      boss.key(e);
      if (e.code === 'Space') boss.down();
      if (e.key === 'm' || e.key === 'M') { G.muted = !G.muted; SFX.setMuted(G.muted); toast(G.muted ? '🔇 muted' : '🔊 unmuted'); }
      if (e.key === 'n' || e.key === 'N') toast(SFX.toggleMusic() ? '🎵 music on' : '🔇 music off');
      return;
    }
    if (e.code === 'Space') { e.preventDefault(); primary(); }
    else if (e.key === 'm' || e.key === 'M') { G.muted = !G.muted; SFX.setMuted(G.muted); toast(G.muted ? '🔇 muted' : '🔊 unmuted'); }
    else if (e.key === 'n' || e.key === 'N') toast(SFX.toggleMusic() ? '🎵 music on' : '🔇 music off');
    else if (e.key === 'c' && G.quotaMet && G.scene === 'play') cashOut();
  });

  $('btn-start').onclick = () => { SFX.init(); SFX.musicStart(); startRound(1); };
  $('btn-retry').onclick = () => { freshRun(); renderInventory(); updateHUD(); startRound(1); };
  $('btn-nextround').onclick = () => { G.shopOffer = null; startRound(G.round + 1); };
  $('btn-reroll').onclick = () => { const c = rerollCost(); if (G.coins >= c) { G.coins -= c; rollShop(); renderShop(); updateHUD(); SFX.reroll(); } };
  $('cashout').onclick = () => cashOut();

  // ----------------------------------------------------------------
  //  UTIL
  // ----------------------------------------------------------------
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function fmt(n) {
    n = Math.round(n);
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e4) return (n / 1e3).toFixed(1) + 'k';
    return '' + n;
  }

  // ----------------------------------------------------------------
  //  DECORATION: floating meme rain + title memes
  // ----------------------------------------------------------------
  function decorate() {
    const rain = $('memeRain');
    for (let i = 0; i < 14; i++) {
      const img = document.createElement('img');
      img.className = 'float-meme';
      img.src = MEMES.uri(MEMES.ids[i % MEMES.ids.length]);
      img.style.left = (Math.random() * 100) + 'vw';
      img.style.animationDuration = (12 + Math.random() * 16) + 's';
      img.style.animationDelay = (-Math.random() * 20) + 's';
      rain.appendChild(img);
    }
    const tm = $('titleMemes');
    ['doge', 'datboi', 'pingas', 'over9000', 'stonks', 'trollface', 'nyan', 'shrek'].forEach(id => {
      const img = document.createElement('img'); img.src = MEMES.uri(id); img.alt = id; tm.appendChild(img);
    });
  }

  // ----------------------------------------------------------------
  //  DEBUG hook (used by the headless test harness; harmless in prod)
  // ----------------------------------------------------------------
  window.__DEBUG = {
    state: () => G,
    startRound: (r) => startRound(r || 1),
    gain: (n) => gainScore(n, W / 2, H / 2, true),
    cashOut: () => cashOut(),
    showShop: () => showShop(),
    showPerks: () => showPerks(),
    buyFirst: () => { G.coins = 999; buyItem(G.shopOffer[0], document.querySelector('#shop-items .card')); },
    pickFirstPerk: () => { const c = document.querySelector('#perk-items .card'); if (c) c.querySelector('.buy').click(); },
    breakAll: () => { for (const b of G.bricks) if (b.alive) breakBrick(b); },
    give: (id) => { const d = CONTENT.byId[id]; if (d) { G.items.push(Object.assign({}, d)); recompute(); updateHUD(); renderInventory(); } return G.items.length; },
    breakMeme: () => { let b = G.bricks.find(x => x.alive && x.meme); if (!b) { b = G.bricks.find(x => x.alive); if (b) b.meme = 'doge'; } if (b) breakBrick(b); return G.flash ? G.flash.id : null; },
    agg: () => G.agg,
    bossInfo: () => ({ scene: G.scene, type: G.boss && G.boss.type, state: boss && boss.state }),
    bossForceWin: () => boss && boss.forceWin(),
    bossForceLose: () => boss && boss.forceLose(),
    bossKey: (key) => { if (boss) boss.key({ key, code: key === ' ' ? 'Space' : key, preventDefault() {} }); },
    bossDown: () => boss && boss.down(),
    bossDebug: () => boss && boss.debug && boss.debug(),
    soundFor: (id) => { const m = window.MEME_SOUNDS || {}; if (m[id]) return id; return (MEME_SND_ALIAS[id] && m[MEME_SND_ALIAS[id]]) ? MEME_SND_ALIAS[id] : null; },
  };

  // ----------------------------------------------------------------
  //  BOOT
  // ----------------------------------------------------------------
  freshRun();
  decorate();
  renderInventory();
  updateHUD();
  showScreen('title');
  requestAnimationFrame(frame);
})();
