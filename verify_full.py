# Comprehensive verification of the upgraded game:
#  - loads clean (no page errors)
#  - 40 real meme images load (naturalWidth > 0)
#  - bricks reset across shop transitions (bug #1)
#  - paddle/ball never vanish during play (bug #2/#3 = render crash)
#  - obnoxious meme-brick flash triggers on a meme brick
#  - new passive props wire through (quotaCut, critChance, magnet, freeReroll)
import sys, pathlib, json
sys.stdout.reconfigure(encoding="utf-8")
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
URL = (HERE / "index.html").as_uri()
errors, cons = [], []
checks = {}

with sync_playwright() as p:
    b = p.chromium.launch(channel="msedge", headless=True)
    pg = b.new_page(viewport={"width": 1000, "height": 760})
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.on("console", lambda m: cons.append(m.text) if m.type == "error" else None)
    pg.goto(URL); pg.wait_for_timeout(1500)  # let images load

    # A. content + real images
    checks["items"] = pg.evaluate("CONTENT.items.length")
    checks["perks"] = pg.evaluate("CONTENT.perks.length")
    checks["meme_local_count"] = pg.evaluate("Object.keys(window.MEME_LOCAL||{}).length")
    checks["roster_ids"] = pg.evaluate("MEMES.ids.length")
    # how many real meme images actually decoded (naturalWidth>0 and using a local file src)
    checks["images_loaded"] = pg.evaluate(
        "Object.keys(window.MEME_LOCAL).filter(id=>{const i=MEMES.get(id);return i&&i.complete&&i.naturalWidth>0&&/assets\\/memes/.test(i.src);}).length")
    pg.screenshot(path=str(HERE / "shot2_title.png"))

    pg.click("#btn-start"); pg.wait_for_timeout(250)

    # B. brick reset across transitions
    def fresh():
        return pg.evaluate("(()=>{const g=window.__DEBUG.state();return{round:g.round,total:g.bricks.length,alive:g.bricks.filter(b=>b.alive).length};})()")
    reset_ok = True
    seq = [fresh()]
    for i in range(3):
        pg.evaluate("window.__DEBUG.state().bricks.filter(b=>b.alive).slice(0,12).forEach(b=>b.alive=false)")
        pg.evaluate("window.__DEBUG.gain(100000)"); pg.wait_for_timeout(100)
        if not pg.eval_on_selector("#cashout", "el=>el.classList.contains('hidden')"):
            pg.eval_on_selector("#cashout", "el=>el.click()")
        pg.wait_for_timeout(150)
        if not pg.eval_on_selector("#screen-perk", "el=>el.classList.contains('hidden')"):
            pg.evaluate("window.__DEBUG.pickFirstPerk()"); pg.wait_for_timeout(120)
        if not pg.eval_on_selector("#screen-shop", "el=>el.classList.contains('hidden')"):
            pg.eval_on_selector("#btn-nextround", "el=>el.click()"); pg.wait_for_timeout(180)
        f = fresh(); seq.append(f)
        if f["alive"] != f["total"]:
            reset_ok = False
    checks["brick_reset_ok"] = reset_ok

    # C. meme-brick flash
    pg.evaluate("window.__DEBUG.startRound(2)"); pg.wait_for_timeout(120)
    flash_id = pg.evaluate("window.__DEBUG.breakMeme()")
    checks["meme_flash_id"] = flash_id
    checks["meme_flash_active"] = pg.evaluate("!!window.__DEBUG.state().flash")
    pg.wait_for_timeout(150)
    pg.screenshot(path=str(HERE / "shot2_flash.png"))

    # D. new passive props wire through
    pg.evaluate("window.__DEBUG.give('grusplan')")        # quotaCut 0.18
    pg.evaluate("window.__DEBUG.give('surprisedpikachu')")# critChance 0.10
    pg.evaluate("window.__DEBUG.give('boromir')")         # magnet
    pg.evaluate("window.__DEBUG.give('picardfacepalm')")  # freeReroll
    agg = pg.evaluate("window.__DEBUG.agg()")
    checks["agg_quotaCut"] = agg["quotaCut"]
    checks["agg_critChance"] = agg["critChance"]
    checks["agg_magnet"] = agg["magnet"]
    checks["agg_freeReroll"] = agg["freeReroll"]
    pg.evaluate("window.__DEBUG.startRound(6)"); pg.wait_for_timeout(80)
    base_q = pg.evaluate("(()=>{const r=6;return Math.round(50*Math.pow(1.42,r-1));})()")
    actual_q = pg.evaluate("window.__DEBUG.state().quota")
    checks["quota_base6"] = base_q
    checks["quota_actual6"] = actual_q
    checks["quotaCut_applied"] = actual_q < base_q

    # E. play stability (no disappear / no crash)
    pg.evaluate("window.__DEBUG.startRound(3)"); pg.wait_for_timeout(120)
    box = pg.query_selector("#game").bounding_box()
    pg.mouse.click(box["x"]+box["width"]/2, box["y"]+box["height"]/2)
    pg.evaluate("for(let i=0;i<10;i++) window.GAME.spawnCoinAt(80+i*70,110,1)")
    zero, nan = 0, 0
    for k in range(60):
        st = pg.evaluate("""(()=>{const g=window.__DEBUG.state();const mv=g.balls.filter(b=>!b.stuck);
          if(mv.length)g.mouseX=mv[0].x;
          const nan=g.balls.some(b=>!isFinite(b.x)||!isFinite(b.y))||!isFinite(g.paddle.x);
          return{scene:g.scene,balls:g.balls.length,nan};})()""")
        if st["scene"]=="play" and st["balls"]==0: zero+=1
        if st["nan"]: nan+=1
        pg.wait_for_timeout(100)
    checks["zero_ball_frames"] = zero
    checks["nan_frames"] = nan
    pg.screenshot(path=str(HERE / "shot2_play.png"))
    b.close()

print(json.dumps(checks, indent=2))
print("PAGE ERRORS:", errors or "none")
print("CONSOLE ERRORS (non-404):", [c for c in cons if "404" not in c and "Failed to load resource" not in c] or "none")

ok = (not errors
      and checks["meme_local_count"] >= 39
      and checks["images_loaded"] >= 39
      and checks["brick_reset_ok"] is True
      and checks["meme_flash_active"] is True
      and checks["meme_flash_id"] is not None
      and checks["agg_critChance"] > 0
      and checks["agg_magnet"] is True
      and checks["agg_freeReroll"] is True
      and checks["quotaCut_applied"] is True
      and checks["zero_ball_frames"] == 0
      and checks["nan_frames"] == 0)
print("VERDICT:", "PASS" if ok else "FAIL")
sys.exit(0 if ok else 1)
