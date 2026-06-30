# Headless smoke test for Nubby's Brick Factory using Playwright + installed Edge.
import sys, pathlib, json
sys.stdout.reconfigure(encoding="utf-8")
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
URL = (HERE / "index.html").as_uri()
errors, console = [], []

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True)
        page = browser.new_page(viewport={"width": 1000, "height": 760})
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: console.append(f"{m.type}: {m.text}") if m.type in ("error", "warning") else None)
        page.goto(URL)
        page.wait_for_timeout(800)

        def js(expr): return page.evaluate(expr)

        results = {}
        # 1) loaded clean + globals present
        results["MEMES_ids"] = js("window.MEMES.ids.length")
        results["CONTENT_items"] = js("window.CONTENT.items.length")
        results["CONTENT_perks"] = js("window.CONTENT.perks.length")
        results["title_visible"] = not js("document.getElementById('screen-title').classList.contains('hidden')")

        # screenshot title
        page.screenshot(path=str(HERE / "shot_title.png"))

        # 2) start round 1
        js("window.__DEBUG.startRound(1)")
        page.wait_for_timeout(200)
        st = js("(()=>{const g=window.__DEBUG.state();return {scene:g.scene,quota:g.quota,bricks:g.bricks.length,balls:g.balls.length,ballsLeft:g.ballsLeft,mult:1+g.agg.mult};})()")
        results["round1"] = st

        # 3) launch the ball, let physics run a bit, expect score to rise
        page.mouse.move(500, 400)
        cv = page.query_selector("#game"); box = cv.bounding_box()
        page.mouse.click(box["x"] + box["width"]/2, box["y"] + box["height"]/2)
        page.wait_for_timeout(2500)
        results["score_after_play"] = js("window.__DEBUG.state().score")

        # 4) force quota -> cashout button should appear
        js("window.__DEBUG.gain(100000)")
        page.wait_for_timeout(100)
        results["quotaMet"] = js("window.__DEBUG.state().quotaMet")
        results["cashout_visible"] = not js("document.getElementById('cashout').classList.contains('hidden')")

        # 5) cash out -> should go to shop or perk, coins earned
        js("window.__DEBUG.cashOut()")
        page.wait_for_timeout(200)
        after = js("(()=>{const g=window.__DEBUG.state();return {scene:g.scene,coins:g.coins};})()")
        results["after_cashout"] = after
        shop_vis = not js("document.getElementById('screen-shop').classList.contains('hidden')")
        perk_vis = not js("document.getElementById('screen-perk').classList.contains('hidden')")
        results["shop_or_perk_visible"] = shop_vis or perk_vis

        # ensure we're at a shop to test buying (round 1 finish -> shop, not perk)
        if not shop_vis:
            js("window.__DEBUG.showShop()")
            page.wait_for_timeout(150)
        page.screenshot(path=str(HERE / "shot_shop.png"))

        # 6) buy first item -> inventory grows, mult may change
        before_items = js("window.__DEBUG.state().items.length")
        js("window.__DEBUG.buyFirst()")
        page.wait_for_timeout(150)
        results["items_before"] = before_items
        results["items_after_buy"] = js("window.__DEBUG.state().items.length")
        results["inventory_chips"] = js("document.querySelectorAll('#inventory .invchip').length")

        # 7) perk screen works
        js("window.__DEBUG.showPerks()")
        page.wait_for_timeout(150)
        results["perk_cards"] = js("document.querySelectorAll('#perk-items .card').length")
        js("window.__DEBUG.pickFirstPerk()")
        page.wait_for_timeout(150)
        results["perks_owned"] = js("window.__DEBUG.state().perks.length")

        # 8) advance a few rounds via breakAll+gain to ensure no crash & quota scales
        quotas = []
        for r in range(2, 8):
            js(f"window.__DEBUG.startRound({r})")
            quotas.append(js("window.__DEBUG.state().quota"))
        results["quota_curve"] = quotas

        # gameplay screenshot
        js("window.__DEBUG.startRound(3)")
        page.mouse.click(box["x"] + box["width"]/2, box["y"] + box["height"]/2)
        page.wait_for_timeout(1500)
        page.screenshot(path=str(HERE / "shot_play.png"))

        browser.close()

        print("=== RESULTS ===")
        print(json.dumps(results, indent=2))
        print("=== JS ERRORS ===", errors or "none")
        print("=== CONSOLE warn/err ===", console or "none")

        # assertions
        ok = (not errors
              and results["round1"]["bricks"] > 0
              and results["round1"]["quota"] == 40
              and results["score_after_play"] > 0
              and results["quotaMet"] is True
              and results["cashout_visible"] is True
              and results["after_cashout"]["coins"] > 0
              and results["shop_or_perk_visible"]
              and results["items_after_buy"] == results["items_before"] + 1
              and results["perk_cards"] >= 1
              and results["perks_owned"] >= 1
              and results["quota_curve"] == sorted(results["quota_curve"]))
        print("=== VERDICT ===", "PASS ✅" if ok else "FAIL ❌")
        sys.exit(0 if ok else 1)

if __name__ == "__main__":
    main()
