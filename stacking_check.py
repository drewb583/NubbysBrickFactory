import sys, json, pathlib
sys.stdout.reconfigure(encoding="utf-8")
from playwright.sync_api import sync_playwright
URL = (pathlib.Path(r"C:\Users\hyper\NubbysBrickFactory") / "index.html").as_uri()
errs = []; C = {}
with sync_playwright() as p:
    b = p.chromium.launch(channel="msedge", headless=True); pg = b.new_page(viewport={"width": 1000, "height": 760})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(1300); pg.click("#btn-start"); pg.wait_for_timeout(200)

    for _ in range(6): pg.evaluate("window.__DEBUG.give('doge')")
    C["mult_6doge"] = round(pg.evaluate("window.__DEBUG.state().agg.multProd"), 3)        # 1.3^6 = 4.827 (multiplicative)
    for _ in range(2): pg.evaluate("window.__DEBUG.give('shrek')")
    C["paddleProd_2shrek"] = round(pg.evaluate("window.__DEBUG.state().agg.paddleProd"), 3)  # 1.3^2 = 1.69
    C["paddle_w_2shrek"] = round(pg.evaluate("window.__DEBUG.state().paddle.w"), 1)           # 130*1.69
    for _ in range(3): pg.evaluate("window.__DEBUG.give('datboi')")
    C["extraBalls_3datboi"] = pg.evaluate("window.__DEBUG.state().agg.extraBalls")           # 3
    for _ in range(2): pg.evaluate("window.__DEBUG.give('mlg')")
    C["laserCount_2mlg"] = pg.evaluate("window.__DEBUG.state().agg.laserCount")              # 2
    for _ in range(2): pg.evaluate("window.__DEBUG.give('pressf')")
    C["revive_2pressf"] = pg.evaluate("window.__DEBUG.state().agg.revive")                   # 2

    # main-game lasers: launch, then fire (more mlg => more beams)
    pg.evaluate("window.__DEBUG.startRound(1)"); pg.wait_for_timeout(150)
    box = pg.query_selector("#game").bounding_box()
    pg.mouse.click(box["x"] + box["width"]/2, box["y"] + box["height"]*0.82); pg.wait_for_timeout(120)
    pg.evaluate("window.__DEBUG.state().balls=window.__DEBUG.state().balls.filter(b=>!b.stuck)")  # ensure no stuck ball
    pg.mouse.click(box["x"] + box["width"]/2, box["y"] + box["height"]*0.82); pg.wait_for_timeout(40)
    C["main_laser_beams"] = pg.evaluate("window.__DEBUG.state().lasers.length")              # ~4

    # meme boss lasers (2 mlg => 4 beams)
    pg.evaluate("window.__DEBUG.startRound(5)"); pg.wait_for_timeout(150)
    pg.mouse.move(box["x"] + box["width"]/2, box["y"] + box["height"]*0.7)
    pg.evaluate("window.__DEBUG.bossDown()"); pg.wait_for_timeout(100)
    beams = 0
    for _ in range(10):
        pg.evaluate("window.__DEBUG.bossDown()")
        l = pg.evaluate("window.__DEBUG.bossDebug().lasers"); beams = max(beams, l or 0)
        pg.wait_for_timeout(50)
    C["memeboss_max_beams"] = beams

    C["spaghetti_loaded"] = pg.evaluate("(()=>{const i=MEMES.get('spaghetti');return i&&i.complete&&i.naturalWidth>0&&/spaghetti/.test(i.src);})()")
    # versus AI still runs (dumbed) without error
    pg.evaluate("window.__DEBUG.startRound(15)"); pg.wait_for_timeout(1500)
    C["tetris_dbg"] = pg.evaluate("window.__DEBUG.bossDebug()")
    b.close()

print(json.dumps(C, indent=2)); print("errors:", errs or "none")
ok = (not errs
      and abs(C["mult_6doge"] - 4.827) < 0.05
      and abs(C["paddleProd_2shrek"] - 1.69) < 0.02
      and C["extraBalls_3datboi"] == 3
      and C["laserCount_2mlg"] == 2
      and C["revive_2pressf"] == 2
      and C["main_laser_beams"] >= 4
      and C["memeboss_max_beams"] >= 4
      and C["spaghetti_loaded"])
print("VERDICT:", "PASS" if ok else "FAIL")
sys.exit(0 if ok else 1)
