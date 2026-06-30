# 🧱 NUBBY'S BRICK FACTORY 🧱
### *Arkanoid × Nubby's Number Factory — the world's most EPIC meme hybrid*

> break bricks · make number · please Nubby · much wow

A web-based, single-file-ish browser game that fuses **Arkanoid** brick-breaking
with the roguelike **quota → shop → perk** loop of **Nubby's Number Factory**,
deep-fried in maximum meme energy (Doge, Dat Boi, Pingas, It's Over 9000, Stonks,
Trollface, Nyan Cat, Shrek, This Is Fine, Big Chungus, Sanic, Amogus, MLG 420,
Rickroll, Galaxy Brain…).

## ▶ How to run
Just open **`index.html`** in any modern browser (Chrome, Edge, Firefox).
No build step, no install. Uses **real meme images** (downloaded to `assets/memes/`)
and **real meme sound effects** (`assets/sounds/`), with hand-drawn SVG art as a fallback.

## 🎮 How to play
- **Mouse** — move the paddle.
- **Click / Space** — launch the ball (and fire MLG lasers if you own them).
- **C** — cash out once the quota is met. **M** — mute SFX. **N** — toggle meme music.
- **Boss rounds:** Tetris/Puyo use **← → ↑ ↓** (+ **Click/Space** to hard-drop); the
  Shmup and Giant-Meme bosses are mouse-controlled.

## 🔊 Sound & music
Every meme has its **own real sound** (PINGAS, "o shit waddup", "IT'S OVER 9000",
vine boom, bruh, "and his name is John Cena"…) that blasts on the obnoxious meme-brick
flash, plus event sounds (bruh on a lost ball, WASTED on game-over, taco-bell on buy).
A looping 8-bit **meme chiptune** plays in the background (toggle with **N**).

## 👹 BOSS ROUNDS (every 5th round)
Boss rounds rotate through four meme battles, each fronted by a giant random meme:
1. **Giant Meme Boss** — brick-breaker vs a huge moving meme with an HP bar; dodge its bombs.
2. **Shmup Boss** — bullet-hell; pilot a ship, dodge patterns, gun the meme down.
3. **Tetris Boss** — clear lines to KO the meme before you top out.
4. **Puyo Boss** — pop chains of 4+ to chain-damage the meme.
Beating a boss pays a big NUBBIN bounty.

### The loop (pure Nubby energy)
1. Each **ROUND** has a rising **QUOTA** (score requirement) shown up top.
2. Smash bricks to manufacture **NUMBER**. Bricks have values; gold = x5,
   💣 bomb = chain explosion, 🟣 meme bricks = x3.
3. You get a limited number of **NUBBYS** (ball launches) — Nubby's core tension.
   Run out before hitting quota = **GAME OVER** (roguelike permadeath).
4. Beat the quota → **CASH OUT** for **NUBBINS** (coins, scaled by overage + leftover balls).
5. **NUBBY-MART** shop every round: buy memetic **items** that trigger on events.
6. Every 3rd round: pick a powerful **PERK**.
7. Quota keeps climbing (`50 × 1.42^round`). How long can you feed Nubby?

### Inventory (top bar)
Owned items & perks sit in the top inventory bar (hover for tooltips), just like Nubby.
**No inventory cap — every item stacks.** Buy six Doges for +1.8x, stack three Stonks,
go nuts. Stacks show a count badge; the bar scrolls when it's packed.

There are **50+ items** and **20+ perks** across **50+ memes**, with mechanics like
crits (x5 bricks), magnet loot, quota-cut, free rerolls, combo-keep, multiball, lasers,
revives, and gold/bomb/meme-brick chance boosts.

## 🐸 Some of the items & perks
| Meme | Effect |
|------|--------|
| 🐕 **Doge** | +0.30x global NUMBER multiplier — much score |
| 🐸 **Dat Boi** | +1 extra ball every launch — *o shit waddup* |
| **Pingas** | bricks spit out coins — *PINGAS* |
| **Over 9000** | cross 9000 in a round → NUKE the whole board 💥 |
| 📈 **Stonks** | +50% coins on cash out |
| **Troll Face** | gamble: 32% bricks pay x3, 14% pay nothing |
| 🌈 **Nyan Cat** | ball phases through bricks |
| **Shrek** | +30% paddle width — *it's all ogre now* |
| 🔥🐶 **This Is Fine** | 45% chance to refund a drained ball |
| **Rickroll** | revive once per run — *never gonna give you up* |
| 🧠 **Galaxy Brain** | combo multiplier that grows per brick |
| **MLG 420** | click to fire dual lasers · 360 noscope |
| …and more (Big Chungus, Sanic, Amogus, Sad Pepe, Doubloon) | |

## 🗂 Files
- `index.html` — shell, top inventory bar, shop/perk/over screens
- `styles.css` — vaporwave deep-fried meme styling
- `js/memes.js` — meme assets (hand-drawn SVG + internet-image upgrade w/ fallback)
- `js/audio.js` — 100% synthesized MLG soundboard (airhorn, coin, over9000…)
- `js/content.js` — items & perks (the Nubby brain)
- `js/game.js` — the Arkanoid engine + quota/round/shop/perk loop
- `test_headless.py` — Playwright smoke test (PASS ✅)

## 📚 Documentation referenced
Mechanics modeled on Nubby's Number Factory (quota from total peg value scaled by
shops, limited launches, restock on overage, shops every few rounds, perks that
force-trigger items, bosses) per the official wiki + reviews, and classic Arkanoid
brick/paddle/ball physics.

*much game · very epic · 10/10 IGN · wow*
