# Reproduce all reported bugs:
#  (1) bricks don't reset on a new level after the shop
#  (2) paddle and ball randomly disappear
import sys, pathlib, json
sys.stdout.reconfigure(encoding="utf-8")
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
URL = (HERE / "index.html").as_uri()
errors, cons = [], []

with sync_playwright() as p:
    b = p.chromium.launch(channel="msedge", headless=True)
    pg = b.new_page(viewport={"width": 1000, "height": 760})
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.on("console", lambda m: cons.append(f"{m.type}: {m.text}") if m.type == "error" else None)
    pg.goto(URL); pg.wait_for_timeout(700)
    pg.click("#btn-start"); pg.wait_for_timeout(250)

    print("===== PART A: brick reset across shop transitions =====")
    reset = []
    def snap(label):
        s = pg.evaluate("(()=>{const g=window.__DEBUG.state();return{round:g.round,scene:g.scene,"
                        "total:g.bricks.length,alive:g.bricks.filter(b=>b.alive).length};})()")
        s["label"] = label; reset.append(s); return s
    snap("round1-fresh")
    for i in range(3):
        pg.evaluate("window.__DEBUG.state().bricks.filter(b=>b.alive).slice(0,12).forEach(b=>b.alive=false)")
        pg.evaluate("window.__DEBUG.gain(100000)"); pg.wait_for_timeout(120)
        if not pg.eval_on_selector("#cashout", "el=>el.classList.contains('hidden')"):
            pg.eval_on_selector("#cashout", "el=>el.click()")
        pg.wait_for_timeout(180)
        if not pg.eval_on_selector("#screen-perk", "el=>el.classList.contains('hidden')"):
            pg.evaluate("window.__DEBUG.pickFirstPerk()"); pg.wait_for_timeout(150)
        if not pg.eval_on_selector("#screen-shop", "el=>el.classList.contains('hidden')"):
            pg.eval_on_selector("#btn-nextround", "el=>el.click()"); pg.wait_for_timeout(220)
        snap(f"after-transition-{i+1}")
    print(json.dumps(reset, indent=2))
    fresh = [r for r in reset if "total" in r]
    reset_bug = any(r["alive"] != r["total"] for r in fresh)
    print("RESET-OK:", not reset_bug)

    print("\n===== PART B: paddle/ball stability during real play =====")
    # fresh round, launch, auto-steer paddle to keep ball alive, sample stability
    pg.evaluate("window.__DEBUG.startRound(2)"); pg.wait_for_timeout(150)
    box = pg.query_selector("#game").bounding_box()
    pg.mouse.click(box["x"] + box["width"]/2, box["y"] + box["height"]/2)  # launch
    # force-spawn coins so the (previously fatal) spinning-coin ellipse path is exercised
    pg.evaluate("for(let i=0;i<10;i++) window.GAME.spawnCoinAt(80+i*70, 110, 1)")
    zero_ball_frames, nan_frames, samples = 0, 0, 0
    last_balls = None
    moved = False
    for k in range(70):  # ~7s
        st = pg.evaluate("""(()=>{const g=window.__DEBUG.state();
          const mv=g.balls.filter(b=>!b.stuck); if(mv.length) g.mouseX=mv[0].x;
          const nan=g.balls.some(b=>!isFinite(b.x)||!isFinite(b.y)||!isFinite(b.vx)||!isFinite(b.vy))||!isFinite(g.paddle.x);
          return{scene:g.scene,balls:g.balls.length,moving:mv.length,nan,padx:Math.round(g.paddle.x),
                 bx:mv.length?Math.round(mv[0].x):null,by:mv.length?Math.round(mv[0].y):null,ballsLeft:g.ballsLeft};})()""")
        samples += 1
        if st["scene"] == "play" and st["balls"] == 0: zero_ball_frames += 1
        if st["nan"]: nan_frames += 1
        if st["bx"] is not None: moved = True
        if k in (5, 30, 60):
            print(f"  sample[{k}] {st}")
        pg.wait_for_timeout(100)
    print(f"SUMMARY: samples={samples} zero_ball_frames={zero_ball_frames} nan_frames={nan_frames} ball_ever_moved={moved}")
    pg.screenshot(path=str(HERE / "shot_diag_play.png"))

    print("\n===== ERRORS =====")
    print("pageerrors:", errors or "none")
    print("console errors:", [c for c in cons if "404" not in c] or "none(except 404 image probes)")
    b.close()
