# Faithful UI repro: do bricks reset on a new level after the shop?
import sys, pathlib, json
sys.stdout.reconfigure(encoding="utf-8")
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
URL = (HERE / "index.html").as_uri()
errors = []

with sync_playwright() as p:
    b = p.chromium.launch(channel="msedge", headless=True)
    pg = b.new_page(viewport={"width": 1000, "height": 760})
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(700)
    pg.click("#btn-start"); pg.wait_for_timeout(250)

    rows = []
    def snap(label):
        s = pg.evaluate("(()=>{const g=window.__DEBUG.state();return{round:g.round,scene:g.scene,"
                        "total:g.bricks.length,alive:g.bricks.filter(b=>b.alive).length,score:g.score};})()")
        s["label"] = label; rows.append(s); return s

    snap("round1-fresh")
    for i in range(4):
        # break ~12 bricks WITHOUT triggering a full-clear wave refill
        pre = pg.evaluate("(()=>{const g=window.__DEBUG.state();"
                          "g.bricks.filter(b=>b.alive).slice(0,12).forEach(b=>b.alive=false);"
                          "return g.bricks.filter(b=>b.alive).length;})()")
        rows.append({"label": f"round{i+1}-after-breaking-12", "alive_now": pre})
        # force quota -> cash out button
        pg.evaluate("window.__DEBUG.gain(100000)"); pg.wait_for_timeout(120)
        if not pg.eval_on_selector("#cashout", "el=>el.classList.contains('hidden')"):
            pg.click("#cashout")
        pg.wait_for_timeout(180)
        if not pg.eval_on_selector("#screen-perk", "el=>el.classList.contains('hidden')"):
            pg.evaluate("window.__DEBUG.pickFirstPerk()"); pg.wait_for_timeout(150)
        if not pg.eval_on_selector("#screen-shop", "el=>el.classList.contains('hidden')"):
            pg.click("#btn-nextround"); pg.wait_for_timeout(220)
        snap(f"after-transition-{i+1}")

    print(json.dumps(rows, indent=2))
    print("ERRORS:", errors or "none")
    # verdict: every fresh round must have alive == total (fully reset)
    fresh = [r for r in rows if "total" in r]
    bug = any(r["alive"] != r["total"] for r in fresh)
    print("RESET-OK:", not bug, "(bug present)" if bug else "(all rounds reset fully)")
    b.close()
