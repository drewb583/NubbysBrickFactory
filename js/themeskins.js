/* ============================================================
   themeskins.js — procedural, FUNCTION-BASED item skins for the
   secret themes. Every item gets a UNIQUE icon + name that reflects
   WHAT THE ITEM DOES, drawn in NES-retro or creepypasta style.
   (No duplicates: keyed by effect category + a per-item seed/tag.)
   global.SKIN = { category, itemURI, name, flavor, seed }
   ============================================================ */
(function (global) {
  'use strict';
  const svg = (inner, bg) =>
    'data:image/svg+xml;utf8,' + encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>` +
      `<rect width='100' height='100' fill='${bg}'/>` + inner + `</svg>`);
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  const RETRO = ['#f83800','#fc9838','#ffd23f','#00a800','#3cbcfc','#7c08fc','#e40058','#fcfcfc','#b8f818','#00e8d8'];
  const CREEPY = ['#9c0000','#c40000','#7a0000','#aa0000','#6a0010','#8a0000','#b02020','#5a0000'];

  // priority-ordered effect category for an item
  function category(it) {
    if (it.laser) return 'laser';
    if (it.revive) return 'revive';
    if (it.extraBalls) return 'ball';
    if (it.critChance) return 'crit';
    if (it.mult) return 'mult';
    if (it.paddleScale) return 'paddle';
    if (it.ballScale) return 'ballsize';
    if (it.speedScale) return 'speed';
    if (it.magnet) return 'magnet';
    if (it.coinMult || it.coinBrickChance || it.onCashOut || it.onQuota) return 'coin';
    if (it.pierceChance) return 'pierce';
    if (it.comboGain || it.comboKeep) return 'combo';
    if (it.memeChance) return 'meme';
    if (it.goldChance || it.bombChance) return 'brick';
    if (it.quotaCut) return 'quota';
    if (it.freeReroll || it.shopDiscount) return 'reroll';
    if (it.startBalls) return 'ball';
    if (it.onBallLost) return 'refund';
    if (it.onBrickBreak) return 'gamble';
    if (it.onRoundStart) return 'sus';
    return 'misc';
  }

  const RNAME = { mult:'POWER UP', ball:'1-UP', paddle:'WIDE PADDLE', ballsize:'GIANT BALL', speed:'HYPER SPEED',
    laser:'BLASTER', coin:'COIN GET', crit:'CRITICAL HIT', revive:'EXTRA LIFE', magnet:'MAGNET', pierce:'GHOST BALL',
    combo:'COMBO METER', meme:'GLITCH', brick:'BLOCK MOD', quota:'WARP ZONE', reroll:'CONTINUE?', refund:'1 MORE TRY',
    gamble:'? BLOCK', sus:'MYSTERY', misc:'CARTRIDGE' };
  const CNAME = { mult:'CURSED POWER', ball:'LOST SOUL', paddle:'THE SLAB', ballsize:'THE EYE', speed:'POSSESSED',
    laser:'DEATH BEAM', coin:'BLOOD MONEY', crit:'FATAL BLOW', revive:'UNDYING', magnet:'THE PULL', pierce:'PHANTOM',
    combo:'HEX CHAIN', meme:'CORRUPTION', brick:'TOMBSTONE', quota:'THE VOID', reroll:'RITUAL', refund:'SECOND LIFE',
    gamble:'DAMNED DICE', sus:'THE WATCHER', misc:'CURSED.EXE' };
  const RFLAV = { mult:'now you\'re playing with POWER', ball:'extra man!', paddle:'wide load', ballsize:'big shot',
    speed:'blast processing', laser:'pew pew pew', coin:'ka-ching!', crit:'super effective!', revive:'1 UP!',
    magnet:'attract mode', pierce:'no-clip', combo:'C-C-C-COMBO', meme:'corrupted save', brick:'level select',
    quota:'warp whistle', reroll:'insert coin', refund:'continue? 9…8…', gamble:'roll the dice', sus:'? ? ?',
    misc:'blow on it' };
  const CFLAV = { mult:'…it grows stronger…', ball:'one of us now', paddle:'cold to the touch', ballsize:'it sees you',
    speed:'it moves wrong', laser:'burn them all', coin:'thirty pieces', crit:'no survivors', revive:'death is a door',
    magnet:'come closer', pierce:'walks through walls', combo:'the ritual continues', meme:'kill me', brick:'rest in pieces',
    quota:'into the abyss', reroll:'speak the words', refund:'it would not let me die', gamble:'fate is sealed',
    sus:'always watching', misc:'do not run it' };

  // ----- per-category icon (inner SVG); accent c, creepy flag d -----
  function icon(cat, c, d) {
    const eye = d ? `<circle cx='38' cy='30' r='3' fill='#fff'/><circle cx='62' cy='30' r='3' fill='#fff'/><circle cx='38' cy='30' r='1.4' fill='#a00'/><circle cx='62' cy='30' r='1.4' fill='#a00'/>` : '';
    const drip = d ? `<path d='M20 70 q8 18 0 24 M50 74 q8 20 0 24 M80 70 q8 16 0 22' stroke='#5a0000' stroke-width='5' fill='none'/>` : '';
    const S = '#000', sw = d ? 2 : 3;
    switch (cat) {
      case 'mult': return `<path d='M50 10 L61 37 L90 39 L67 58 L75 88 L50 71 L25 88 L33 58 L10 39 L39 37 Z' fill='${c}' stroke='${S}' stroke-width='${sw}'/><text x='50' y='60' font-size='24' text-anchor='middle' fill='${S}' font-family='monospace' font-weight='bold'>${d ? '×' : '×'}</text>${eye}${drip}`;
      case 'ball': return `<rect x='28' y='16' width='44' height='26' rx='4' fill='${c}' stroke='${S}' stroke-width='${sw}'/><text x='50' y='36' font-size='15' text-anchor='middle' fill='${S}' font-family='monospace' font-weight='bold'>${d ? 'RIP' : '1UP'}</text><circle cx='50' cy='70' r='18' fill='${d ? '#300' : '#fff'}' stroke='${S}' stroke-width='${sw}'/><circle cx='50' cy='70' r='8' fill='${c}'/>`;
      case 'paddle': return `<rect x='10' y='44' width='80' height='16' rx='${d ? 2 : 4}' fill='${c}' stroke='${S}' stroke-width='${sw}'/><rect x='14' y='47' width='72' height='4' fill='#ffffff66'/>${drip}`;
      case 'ballsize': return `<circle cx='50' cy='52' r='34' fill='${c}' stroke='${S}' stroke-width='${sw}'/>${d ? `<circle cx='50' cy='52' r='18' fill='#200'/><circle cx='50' cy='52' r='8' fill='#c00'/>` : `<circle cx='40' cy='42' r='8' fill='#ffffff88'/>`}`;
      case 'speed': return `<path d='M58 8 L26 54 L46 54 L40 92 L74 40 L52 40 Z' fill='${c}' stroke='${S}' stroke-width='${sw}'/>${drip}`;
      case 'laser': return `<rect x='30' y='62' width='40' height='14' rx='2' fill='${c}' stroke='${S}' stroke-width='${sw}'/><rect x='46' y='8' width='8' height='54' fill='${d ? '#c40000' : '#39ff14'}'/><rect x='42' y='6' width='16' height='8' fill='${c}'/>`;
      case 'coin': return `<circle cx='50' cy='50' r='32' fill='${d ? '#5a0000' : '#ffd23f'}' stroke='${S}' stroke-width='${sw}'/><circle cx='50' cy='50' r='24' fill='none' stroke='${c}' stroke-width='3'/><text x='50' y='64' font-size='34' text-anchor='middle' fill='${S}' font-family='monospace' font-weight='bold'>$</text>`;
      case 'crit': return `<path d='M50 6 L58 30 L84 22 L66 44 L92 54 L64 56 L72 86 L50 66 L28 86 L36 56 L8 54 L34 44 L16 22 L42 30 Z' fill='${c}' stroke='${S}' stroke-width='${sw}'/><text x='50' y='62' font-size='26' text-anchor='middle' fill='${S}' font-weight='bold' font-family='monospace'>!</text>`;
      case 'revive': return d ? `<rect x='30' y='30' width='40' height='56' rx='18' fill='${c}' stroke='${S}' stroke-width='${sw}'/><rect x='44' y='40' width='12' height='34' fill='#200'/><rect x='36' y='50' width='28' height='8' fill='#200'/><text x='50' y='24' font-size='11' text-anchor='middle' fill='${c}'>R.I.P.</text>` : `<path d='M50 84 C10 56 18 22 50 38 C82 22 90 56 50 84 Z' fill='${c}' stroke='${S}' stroke-width='${sw}'/><text x='50' y='56' font-size='13' text-anchor='middle' fill='${S}' font-weight='bold' font-family='monospace'>1UP</text>`;
      case 'magnet': return `<path d='M24 20 h18 v34 a8 8 0 0 0 16 0 v-34 h18 v34 a26 26 0 0 1 -52 0 Z' fill='${c}' stroke='${S}' stroke-width='${sw}'/><rect x='24' y='78' width='18' height='12' fill='#ddd' stroke='${S}' stroke-width='2'/><rect x='58' y='78' width='18' height='12' fill='#ddd' stroke='${S}' stroke-width='2'/>`;
      case 'pierce': return `<path d='M22 84 V46 a28 28 0 0 1 56 0 V84 l-9 -8 l-9 8 l-9 -8 l-9 8 l-9 -8 Z' fill='${c}' stroke='${S}' stroke-width='${sw}' opacity='${d ? 0.85 : 1}'/><circle cx='40' cy='44' r='5' fill='${d ? '#c00' : '#000'}'/><circle cx='60' cy='44' r='5' fill='${d ? '#c00' : '#000'}'/>`;
      case 'combo': return `<text x='50' y='44' font-size='26' text-anchor='middle' fill='${c}' font-weight='bold' font-family='monospace' stroke='${S}' stroke-width='1'>COMBO</text><text x='50' y='80' font-size='34' text-anchor='middle' fill='${d ? '#c40000' : '#ffd23f'}' font-weight='bold' font-family='monospace'>x9</text>`;
      case 'meme': return `<g>${[14,30,46,62,78].map((y, i) => `<rect x='${(hash('g' + y) % 30)}' y='${y}' width='${40 + (hash('w' + y) % 50)}' height='12' fill='${i % 2 ? c : (d ? '#c40000' : '#fcfcfc')}'/>`).join('')}</g>`;
      case 'brick': return `<g stroke='${S}' stroke-width='${sw}'>${[[18,30],[52,30],[35,52],[18,74],[52,74]].map(p => `<rect x='${p[0]}' y='${p[1]}' width='30' height='18' fill='${c}'/>`).join('')}</g>${drip}`;
      case 'quota': return `<rect x='22' y='30' width='56' height='60' fill='${d ? '#200' : '#00a800'}' stroke='${S}' stroke-width='${sw}'/><rect x='16' y='22' width='68' height='16' fill='${c}' stroke='${S}' stroke-width='${sw}'/><ellipse cx='50' cy='60' rx='16' ry='22' fill='${d ? '#000' : '#063'}'/>`;
      case 'reroll': return `<path d='M30 30 a24 24 0 1 1 -6 28' fill='none' stroke='${c}' stroke-width='9'/><path d='M28 18 l6 16 l-18 2 Z' fill='${c}'/><text x='52' y='86' font-size='12' text-anchor='middle' fill='${c}' font-family='monospace'>${d ? '✟' : '↻'}</text>`;
      case 'refund': return `<path d='M50 86 C18 64 22 30 50 22 C78 30 82 64 50 86 Z' fill='${c}' stroke='${S}' stroke-width='${sw}'/><text x='50' y='58' font-size='22' text-anchor='middle' fill='${S}' font-weight='bold' font-family='monospace'>+1</text>${drip}`;
      case 'gamble': return `<rect x='26' y='26' width='48' height='48' rx='${d ? 3 : 8}' fill='${c}' stroke='${S}' stroke-width='${sw}'/><text x='50' y='64' font-size='34' text-anchor='middle' fill='${S}' font-weight='bold' font-family='monospace'>?</text>${eye}`;
      case 'sus': return d ? `<path d='M30 22 q20 -12 40 0 q4 20 4 40 v26 h-44 v-26 q0 -20 0 -40 Z' fill='#100' stroke='${c}' stroke-width='3'/><circle cx='42' cy='44' r='4' fill='${c}'/><circle cx='58' cy='44' r='4' fill='${c}'/>` : `<rect x='28' y='20' width='44' height='44' fill='${c}' stroke='${S}' stroke-width='${sw}'/><text x='50' y='52' font-size='30' text-anchor='middle' fill='${S}' font-weight='bold' font-family='monospace'>?</text>`;
      default: return `<rect x='22' y='24' width='56' height='52' rx='3' fill='${c}' stroke='${S}' stroke-width='${sw}'/><rect x='34' y='16' width='32' height='12' fill='${c}' stroke='${S}' stroke-width='2'/><rect x='30' y='40' width='40' height='6' fill='${S}'/>${eye}`;
    }
  }

  function seed(def) { return hash(def.id); }
  function tag(def) { return (def.id.replace(/[^a-z0-9]/gi, '') + 'xxx').slice(0, 3).toUpperCase(); }

  global.SKIN = {
    category, seed,
    name(def, theme) { return (theme === 'creepy' ? CNAME : RNAME)[category(def)]; },
    flavor(def, theme) { return (theme === 'creepy' ? CFLAV : RFLAV)[category(def)]; },
    itemURI(def, theme) {
      const d = theme === 'creepy', s = seed(def);
      const pal = d ? CREEPY : RETRO, c = pal[s % pal.length];
      const bg = d ? '#0a0000' : '#000';
      const t = tag(def), tagcol = d ? '#c40000' : '#b8f818';
      return svg(icon(category(def), c, d) +
        `<rect x='0' y='0' width='100' height='100' fill='none' stroke='${d ? '#5a0000' : '#fcfcfc'}' stroke-width='4'/>` +
        `<text x='6' y='95' font-size='15' fill='${tagcol}' font-family='monospace' font-weight='bold'>${t}</text>` +
        `<text x='94' y='14' font-size='10' fill='${tagcol}' font-family='monospace' text-anchor='end' opacity='0.7'>${(s % 90 + 10)}</text>` +
        `<text x='0' y='0' font-size='0.01' opacity='0'>${def.id}</text>`, bg);
    },
  };
})(window);
