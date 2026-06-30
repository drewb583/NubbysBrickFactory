/* ============================================================
   memes.js — the dankest asset pipeline ever conceived
   Each meme ships with hand-drawn SVG art (guaranteed to render,
   even offline) AND a list of real "from the interwebs" image URLs.
   On load we paint the SVG instantly, then try to UPGRADE to the
   real internet meme image; if the network is down or a host blocks
   hotlinking, we just keep the SVG. No broken images, ever. wow.
   ============================================================ */
(function (global) {
  'use strict';

  const svgURI = (inner, bg) =>
    'data:image/svg+xml;utf8,' + encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>` +
      (bg ? `<rect width='100' height='100' rx='14' fill='${bg}'/>` : '') +
      inner + `</svg>`);

  // ---- hand-drawn SVG meme art (stylized but recognizable) ----
  const ART = {
    doge: svgURI(`
      <ellipse cx='50' cy='58' rx='34' ry='30' fill='#e8c07d'/>
      <path d='M20 40 L14 14 L40 34 Z' fill='#e8c07d'/>
      <path d='M80 40 L86 14 L60 34 Z' fill='#e8c07d'/>
      <ellipse cx='50' cy='66' rx='22' ry='18' fill='#f6e7c8'/>
      <circle cx='38' cy='52' r='4' fill='#222'/><circle cx='62' cy='52' r='4' fill='#222'/>
      <path d='M44 50 q-6 -5 -12 -2' stroke='#a07a3a' stroke-width='2' fill='none'/>
      <path d='M56 50 q6 -5 12 -2' stroke='#a07a3a' stroke-width='2' fill='none'/>
      <ellipse cx='50' cy='64' rx='5' ry='3.5' fill='#3a2a17'/>
      <path d='M42 70 q8 8 16 0' stroke='#3a2a17' stroke-width='2' fill='none'/>
      <text x='8' y='30' font-size='9' fill='#39ff14' font-family='Comic Sans MS'>much</text>
      <text x='66' y='86' font-size='9' fill='#ff3ea5' font-family='Comic Sans MS'>wow</text>`, '#2a004f'),

    datboi: svgURI(`
      <circle cx='50' cy='78' r='14' fill='none' stroke='#222' stroke-width='4'/>
      <circle cx='50' cy='78' r='2' fill='#888'/>
      <line x1='50' y1='78' x2='50' y2='66' stroke='#444' stroke-width='3'/>
      <rect x='42' y='60' width='16' height='8' rx='3' fill='#5a3' />
      <ellipse cx='50' cy='44' rx='20' ry='17' fill='#4caf50'/>
      <circle cx='40' cy='30' r='8' fill='#4caf50'/><circle cx='60' cy='30' r='8' fill='#4caf50'/>
      <circle cx='40' cy='28' r='4' fill='#fff'/><circle cx='60' cy='28' r='4' fill='#fff'/>
      <circle cx='40' cy='29' r='2' fill='#000'/><circle cx='60' cy='29' r='2' fill='#000'/>
      <path d='M40 50 q10 8 20 0' stroke='#1b5e20' stroke-width='2' fill='none'/>
      <text x='6' y='14' font-size='9' fill='#ffd23f' font-family='Comic Sans MS'>o shit</text>
      <text x='44' y='14' font-size='9' fill='#00ffd5' font-family='Comic Sans MS'>waddup</text>`, '#10243a'),

    pingas: svgURI(`
      <ellipse cx='50' cy='52' rx='30' ry='32' fill='#f0b890'/>
      <rect x='26' y='20' width='48' height='14' rx='6' fill='#c62828'/>
      <path d='M30 34 q20 -8 40 0' fill='#c62828'/>
      <circle cx='40' cy='44' r='7' fill='#fff'/><circle cx='60' cy='44' r='7' fill='#fff'/>
      <circle cx='41' cy='45' r='3' fill='#1a3a8a'/><circle cx='59' cy='45' r='3' fill='#1a3a8a'/>
      <ellipse cx='50' cy='56' rx='6' ry='4' fill='#d98c5f'/>
      <path d='M18 64 Q34 56 50 64' stroke='#9a5b2a' stroke-width='9' fill='none' stroke-linecap='round'/>
      <path d='M82 64 Q66 56 50 64' stroke='#9a5b2a' stroke-width='9' fill='none' stroke-linecap='round'/>
      <text x='20' y='96' font-size='14' fill='#ffd23f' font-weight='bold' font-family='Comic Sans MS'>PINGAS</text>`, '#3a0011'),

    over9000: svgURI(`
      <path d='M10 50 Q50 22 90 50 Q50 78 10 50Z' fill='#0a3d2e'/>
      <circle cx='50' cy='50' r='17' fill='#fff'/><circle cx='50' cy='50' r='9' fill='#0d8a3a'/>
      <circle cx='50' cy='50' r='4' fill='#000'/>
      <path d='M68 38 L96 30' stroke='#39ff14' stroke-width='3'/>
      <rect x='2' y='2' width='96' height='96' rx='14' fill='none' stroke='#39ff14' stroke-width='2'/>
      <text x='50' y='90' font-size='16' fill='#39ff14' font-weight='bold' text-anchor='middle' font-family='monospace'>9000</text>`, '#06120a'),

    stonks: svgURI(`
      <rect x='24' y='44' width='30' height='40' rx='4' fill='#34465e'/>
      <circle cx='39' cy='34' r='13' fill='#d9b48a'/>
      <rect x='30' y='60' width='18' height='10' fill='#cfd8e3'/>
      <path d='M18 80 L40 56 L54 66 L86 24' stroke='#39ff14' stroke-width='5' fill='none' stroke-linecap='round'/>
      <path d='M86 24 L70 26 M86 24 L84 40' stroke='#39ff14' stroke-width='5' fill='none' stroke-linecap='round'/>
      <text x='6' y='96' font-size='14' fill='#39ff14' font-weight='bold' font-family='Comic Sans MS'>STONKS</text>`, '#0b1830'),

    trollface: svgURI(`
      <ellipse cx='50' cy='50' rx='40' ry='42' fill='#fff' stroke='#000' stroke-width='3'/>
      <path d='M22 56 Q50 92 78 56 Q66 70 50 70 Q34 70 22 56Z' fill='#fff' stroke='#000' stroke-width='3'/>
      <path d='M28 60 Q50 84 72 60' stroke='#000' stroke-width='3' fill='none'/>
      <path d='M24 40 q10 -8 20 -2' stroke='#000' stroke-width='3' fill='none'/>
      <path d='M56 38 q10 -6 20 2' stroke='#000' stroke-width='3' fill='none'/>
      <circle cx='36' cy='46' r='3' fill='#000'/><circle cx='64' cy='46' r='3' fill='#000'/>`, '#3a0d4a'),

    nyan: svgURI(`
      <rect x='6' y='44' width='14' height='8' fill='#ff0018'/>
      <rect x='6' y='52' width='14' height='6' fill='#ffa52c'/>
      <rect x='6' y='58' width='14' height='6' fill='#fff200'/>
      <rect x='6' y='64' width='14' height='6' fill='#00ff2e'/>
      <rect x='6' y='70' width='14' height='6' fill='#0099ff'/>
      <rect x='34' y='42' width='34' height='28' rx='5' fill='#f6a' stroke='#c36' stroke-width='2'/>
      <circle cx='44' cy='52' r='2.5' fill='#000'/><circle cx='58' cy='52' r='2.5' fill='#000'/>
      <circle cx='40' cy='60' r='3' fill='#ff8fc7'/><circle cx='62' cy='60' r='3' fill='#ff8fc7'/>
      <circle cx='75' cy='44' r='10' fill='#9aa'/>
      <path d='M70 36 l3 6 m12 -6 l-3 6' stroke='#9aa' stroke-width='4'/>
      <circle cx='72' cy='44' r='1.6' fill='#000'/><circle cx='79' cy='44' r='1.6' fill='#000'/>`, '#05021a'),

    shrek: svgURI(`
      <ellipse cx='50' cy='56' rx='32' ry='30' fill='#7cb342'/>
      <ellipse cx='20' cy='40' rx='8' ry='5' fill='#7cb342'/><ellipse cx='80' cy='40' rx='8' ry='5' fill='#7cb342'/>
      <ellipse cx='38' cy='48' rx='7' ry='8' fill='#fff'/><ellipse cx='62' cy='48' rx='7' ry='8' fill='#fff'/>
      <circle cx='38' cy='50' r='3' fill='#3a2a12'/><circle cx='62' cy='50' r='3' fill='#3a2a12'/>
      <ellipse cx='50' cy='62' rx='8' ry='6' fill='#5a8a2a'/>
      <circle cx='44' cy='62' r='2' fill='#3a5a1a'/><circle cx='56' cy='62' r='2' fill='#3a5a1a'/>
      <path d='M36 74 q14 8 28 0' stroke='#3a5a1a' stroke-width='3' fill='none'/>
      <text x='14' y='96' font-size='9' fill='#cfe' font-family='Comic Sans MS'>all ogre now</text>`, '#16330a'),

    thisisfine: svgURI(`
      <rect width='100' height='100' fill='#ff6a00'/>
      <path d='M0 70 q12 -18 22 0 q12 -18 24 0 q12 -18 24 0 q12 -18 22 0 v30 H0Z' fill='#ffd23f' opacity='.6'/>
      <ellipse cx='50' cy='58' rx='22' ry='18' fill='#c8843a'/>
      <rect x='34' y='30' width='32' height='12' rx='3' fill='#b5651d'/>
      <rect x='30' y='40' width='40' height='5' fill='#b5651d'/>
      <circle cx='42' cy='56' r='3' fill='#000'/><circle cx='58' cy='56' r='3' fill='#000'/>
      <path d='M40 66 q10 6 20 0' stroke='#000' stroke-width='2' fill='none'/>
      <text x='8' y='94' font-size='10' fill='#000' font-weight='bold' font-family='Comic Sans MS'>this is fine</text>`),

    rickroll: svgURI(`
      <rect x='30' y='50' width='40' height='40' rx='6' fill='#1b2a4a'/>
      <rect x='44' y='50' width='12' height='30' fill='#fff'/>
      <path d='M48 50 l2 8 l2 -8' fill='#c0392b'/>
      <circle cx='50' cy='34' r='14' fill='#e0a96d'/>
      <path d='M36 30 q14 -16 28 0 q-6 -4 -14 -4 q-8 0 -14 4Z' fill='#7a3b1a'/>
      <circle cx='44' cy='34' r='2' fill='#000'/><circle cx='56' cy='34' r='2' fill='#000'/>
      <path d='M44 40 q6 4 12 0' stroke='#000' stroke-width='2' fill='none'/>
      <path d='M70 60 L92 50' stroke='#e0a96d' stroke-width='6' stroke-linecap='round'/>
      <text x='6' y='14' font-size='8' fill='#39ff14' font-family='Comic Sans MS'>never gonna</text>`, '#100a26'),

    galaxybrain: svgURI(`
      <g fill='none' stroke='#b06bff' stroke-width='3'>
        <path d='M30 36 q-12 0 -12 14 q-10 4 -4 16 q-4 12 12 14 q4 10 18 6 q14 8 24 -4 q14 0 12 -16 q8 -8 0 -18 q4 -14 -12 -16 q-10 -10 -22 -2 q-12 -4 -16 6Z'/>
        <path d='M50 30 v52 M34 44 q16 6 0 14 M66 44 q-16 6 0 14'/>
      </g>
      <circle cx='50' cy='54' r='3' fill='#fff'/>
      <circle cx='22' cy='24' r='1.5' fill='#fff'/><circle cx='80' cy='20' r='2' fill='#fff'/><circle cx='86' cy='70' r='1.5' fill='#fff'/>
      <text x='8' y='96' font-size='9' fill='#c46bff' font-family='Comic Sans MS'>galaxy brain</text>`, '#0a0024'),

    sanic: svgURI(`
      <circle cx='50' cy='54' r='30' fill='#2a7fff'/>
      <path d='M50 24 q24 -16 36 4 q-18 -6 -30 6 M50 24 q-24 -16 -36 4 q18 -6 30 6' fill='#2a7fff'/>
      <ellipse cx='44' cy='52' rx='9' ry='12' fill='#fff'/><ellipse cx='58' cy='52' rx='9' ry='12' fill='#fff'/>
      <circle cx='47' cy='54' r='3' fill='#1a5'/><circle cx='55' cy='54' r='3' fill='#1a5'/>
      <ellipse cx='40' cy='66' rx='5' ry='3' fill='#f0a' opacity='.5'/>
      <path d='M30 74 q20 10 40 0' stroke='#0a3' stroke-width='3' fill='none'/>
      <text x='22' y='96' font-size='12' fill='#fff' font-weight='bold' font-family='Comic Sans MS'>gotta go</text>`, '#02123a'),

    pepe: svgURI(`
      <ellipse cx='50' cy='58' rx='34' ry='28' fill='#6aa84f'/>
      <ellipse cx='34' cy='38' rx='12' ry='10' fill='#6aa84f'/><ellipse cx='66' cy='38' rx='12' ry='10' fill='#6aa84f'/>
      <circle cx='34' cy='38' r='7' fill='#fff'/><circle cx='66' cy='38' r='7' fill='#fff'/>
      <circle cx='34' cy='40' r='3' fill='#000'/><circle cx='66' cy='40' r='3' fill='#000'/>
      <ellipse cx='50' cy='66' rx='26' ry='12' fill='#86c05f'/>
      <path d='M30 64 q20 14 40 0' stroke='#c0392b' stroke-width='4' fill='none'/>
      <ellipse cx='50' cy='58' rx='4' ry='3' fill='#4a7a32'/>`, '#173a0a'),

    amogus: svgURI(`
      <path d='M34 24 q16 -12 30 0 q6 6 6 22 v34 h-10 v-12 h-6 v12 h-10 v-12 h-6 v12 H30 V46 q0 -16 4 -22Z' fill='#c0392b'/>
      <ellipse cx='58' cy='40' rx='14' ry='9' fill='#9bd3e6' stroke='#7fb' stroke-width='2'/>
      <rect x='22' y='44' width='8' height='18' rx='4' fill='#922'/>
      <text x='14' y='96' font-size='12' fill='#fff' font-weight='bold' font-family='Comic Sans MS'>sus</text>`, '#101a2a'),

    coin: svgURI(`
      <circle cx='50' cy='50' r='40' fill='#ffcf2e' stroke='#b8860b' stroke-width='4'/>
      <circle cx='50' cy='50' r='30' fill='none' stroke='#fff3b0' stroke-width='3'/>
      <text x='50' y='66' font-size='40' fill='#b8860b' font-weight='bold' text-anchor='middle' font-family='Comic Sans MS'>$</text>`),

    chungus: svgURI(`
      <ellipse cx='50' cy='62' rx='36' ry='30' fill='#cfcfcf'/>
      <ellipse cx='36' cy='24' rx='8' ry='20' fill='#cfcfcf'/><ellipse cx='64' cy='24' rx='8' ry='20' fill='#cfcfcf'/>
      <ellipse cx='36' cy='24' rx='4' ry='14' fill='#f7b8c8'/><ellipse cx='64' cy='24' rx='4' ry='14' fill='#f7b8c8'/>
      <circle cx='40' cy='56' r='4' fill='#000'/><circle cx='60' cy='56' r='4' fill='#000'/>
      <ellipse cx='50' cy='66' rx='6' ry='4' fill='#f7b8c8'/>
      <path d='M44 72 q6 6 12 0' stroke='#000' stroke-width='2' fill='none'/>`, '#2a2a3a'),

    mlg: svgURI(`
      <rect x='14' y='40' width='72' height='18' rx='8' fill='#000'/>
      <rect x='16' y='42' width='30' height='14' rx='6' fill='#0a0'/>
      <rect x='54' y='42' width='30' height='14' rx='6' fill='#0a0'/>
      <text x='50' y='34' font-size='12' fill='#39ff14' font-weight='bold' text-anchor='middle' font-family='Comic Sans MS'>MLG</text>
      <text x='50' y='80' font-size='18' fill='#ffd23f' font-weight='bold' text-anchor='middle' font-family='Comic Sans MS'>420</text>`, '#000'),

    nubby: svgURI(`
      <rect x='26' y='30' width='48' height='52' rx='10' fill='#ff7ac0' stroke='#fff' stroke-width='3'/>
      <circle cx='40' cy='50' r='6' fill='#fff'/><circle cx='60' cy='50' r='6' fill='#fff'/>
      <circle cx='40' cy='51' r='3' fill='#000'/><circle cx='60' cy='51' r='3' fill='#000'/>
      <path d='M38 66 q12 10 24 0' stroke='#fff' stroke-width='3' fill='none'/>
      <rect x='44' y='18' width='12' height='14' fill='#aa3' /><circle cx='50' cy='16' r='5' fill='#ffd23f'/>
      <text x='50' y='96' font-size='10' fill='#fff' text-anchor='middle' font-family='Comic Sans MS'>NUBBY</text>`, '#3a0030'),
  };

  /* REAL meme pictures (downloaded locally to assets/memes/, sourced from
     the interwebs). These are the PRIMARY visuals now. The hand-drawn SVGs
     above are only an invisible fallback if a file is ever missing. */
  const LOCAL = global.MEME_LOCAL || {};

  // generic deep-fried fallback for any id without specific hand-drawn art
  const PAL = ['#ff3ea5', '#00ffd5', '#ffd23f', '#39ff14', '#b06bff', '#ff8a3e'];
  function genericSVG(id) {
    let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    const c = PAL[h % PAL.length], label = id.slice(0, 9).toUpperCase();
    return svgURI(
      `<circle cx='50' cy='42' r='26' fill='${c}'/>` +
      `<circle cx='40' cy='38' r='5' fill='#fff'/><circle cx='60' cy='38' r='5' fill='#fff'/>` +
      `<circle cx='40' cy='39' r='2' fill='#000'/><circle cx='60' cy='39' r='2' fill='#000'/>` +
      `<path d='M38 52 q12 9 24 0' stroke='#000' stroke-width='3' fill='none'/>` +
      `<text x='50' y='86' font-size='12' fill='#fff' font-weight='bold' text-anchor='middle' font-family='Comic Sans MS'>${label}</text>`,
      '#1a0033');
  }
  const artFor = (id) => ART[id] || genericSVG(id);

  // Build Image objects: real local picture first, SVG fallback on error.
  const IMG = {};
  const allIds = new Set([...Object.keys(LOCAL), ...Object.keys(ART), 'coin', 'nubby']);
  for (const id of allIds) {
    const img = new Image();
    img.decoding = 'async';
    const fallback = artFor(id);
    if (LOCAL[id]) {
      img.onerror = () => { img.onerror = null; img.src = fallback; };
      img.src = LOCAL[id];          // real meme photo
    } else {
      img.src = fallback;           // coin / nubby UI icons stay SVG
    }
    IMG[id] = img;
  }

  // roster of memes usable on bricks / flashes / decor (UI icons + secret-theme memes excluded)
  const IDS = [...allIds].filter((id) => id !== 'coin' && id !== 'nubby' && !/^(retro|creepy)_/.test(id));

  global.MEMES = {
    img: IMG,                       // id -> HTMLImageElement (real pic, SVG fallback)
    ids: IDS,
    get(id) { return IMG[id] || IMG.doge; },
    uri(id) { return LOCAL[id] || artFor(id); },   // DOM <img> src: real file or SVG
  };
})(window);
