# v3 verification: real images+sounds, inventory stacking, 4 meme bosses, music.
import sys, pathlib, json
sys.stdout.reconfigure(encoding="utf-8")
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
URL = (HERE / "index.html").as_uri()
errors, cons = [], []
C = {}

with sync_playwright() as p:
    b = p.chromium.launch(channel="msedge", headless=True)
    pg = b.new_page(viewport={"width": 1000, "height": 760})
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.on("console", lambda m: cons.append(m.text) if m.type == "error" else None)
    pg.goto(URL); pg.wait_for_timeout(1600)

    C["items"] = pg.evaluate("CONTENT.items.length")
    C["perks"] = pg.evaluate("CONTENT.perks.length")
    C["meme_local"] = pg.evaluate("Object.keys(window.MEME_LOCAL||{}).length")
    C["meme_sounds"] = pg.evaluate("Object.keys(window.MEME_SOUNDS||{}).length")
    C["roster"] = pg.evaluate("MEMES.ids.length")
    C["images_loaded"] = pg.evaluate("Object.keys(window.MEME_LOCAL).filter(id=>{const i=MEMES.get(id);return i&&i.complete&&i.naturalWidth>0;}).length")
    # pingas must be a real local image (AoStH)
    C["pingas_src"] = pg.evaluate("MEMES.get('pingas').src.split('/').slice(-2).join('/')")

    pg.click("#btn-start"); pg.wait_for_timeout(250)

    # inventory stacking (no cap): give doge x6 -> 6 items, 1 chip w/ badge, mult up
    for _ in range(6): pg.evaluate("window.__DEBUG.give('doge')")
    C["items_after_stack"] = pg.evaluate("window.__DEBUG.state().items.length")
    C["doge_chip_badge"] = pg.evaluate("(()=>{const c=[...document.querySelectorAll('#inventory .invchip')].find(x=>x.querySelector('.badge')&&x.querySelector('.badge').textContent>='6');return c?c.querySelector('.badge').textContent:null;})()")
    C["mult_after_stack"] = pg.evaluate("(1+window.__DEBUG.state().agg.mult).toFixed(2)")

    # meme boss USES the player's items: multiball (Dat Boi), lasers (MLG), damage scaling
    pg.evaluate("['mlg','datboi','shrek'].forEach(id=>window.__DEBUG.give(id))")
    pg.evaluate("window.__DEBUG.startRound(5)"); pg.wait_for_timeout(200)
    box = pg.query_selector("#game").bounding_box()
    pg.mouse.move(box["x"]+box["width"]/2, box["y"]+box["height"]*0.7)
    pg.evaluate("window.__DEBUG.bossDown()")  # launch (Dat Boi adds extra balls)
    pg.wait_for_timeout(150)
    C["memeboss_balls_at_launch"] = pg.evaluate("window.__DEBUG.bossDebug().balls")
    hp0 = pg.evaluate("window.__DEBUG.bossDebug().hp")
    laser_seen = 0
    for _ in range(12):
        pg.evaluate("window.__DEBUG.bossDown()")   # ball already launched -> fires MLG lasers
        l = pg.evaluate("window.__DEBUG.bossDebug().lasers")
        if l and l > 0: laser_seen += 1
        pg.wait_for_timeout(120)
    C["memeboss_lasers_fired"] = laser_seen
    C["memeboss_hp_dropped"] = pg.evaluate("window.__DEBUG.bossDebug().hp") < hp0
    pg.screenshot(path=str(HERE / "shot3_boss_meme_items.png"))

    # bosses: each type starts, runs, accepts input, and win transitions out
    boss_results = {}
    rounds = {"meme": 5, "shmup": 10, "tetris": 15, "puyo": 20}
    shots = {"meme": 5, "tetris": 15, "puyo": 20}
    for typ, rnd in rounds.items():
        pg.evaluate(f"window.__DEBUG.startRound({rnd})"); pg.wait_for_timeout(200)
        info = pg.evaluate("window.__DEBUG.bossInfo()")
        # interact
        if typ in ("meme", "shmup"):
            box = pg.query_selector("#game").bounding_box()
            pg.mouse.move(box["x"]+box["width"]*0.4, box["y"]+box["height"]*0.7)
            pg.mouse.click(box["x"]+box["width"]/2, box["y"]+box["height"]*0.7)
        else:
            for k in ["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"]:
                pg.evaluate(f"window.__DEBUG.bossKey('{k}')")
            pg.evaluate("window.__DEBUG.bossDown()")
        pg.wait_for_timeout(1400)  # let it run/fall
        if typ in shots:
            pg.screenshot(path=str(HERE / f"shot3_boss_{typ}.png"))
        # force win -> should leave boss scene cleanly
        pg.evaluate("window.__DEBUG.bossForceWin()"); pg.wait_for_timeout(200)
        after = pg.evaluate("window.__DEBUG.state().scene")
        shop_or_perk = (not pg.eval_on_selector("#screen-shop","el=>el.classList.contains('hidden')")) or \
                       (not pg.eval_on_selector("#screen-perk","el=>el.classList.contains('hidden')"))
        boss_results[typ] = {"started": info.get("type")==typ and info.get("scene")=="boss",
                             "won_to_shop": after != "boss" and after != "over" and shop_or_perk}
        # clear any shop/perk back to a clean state for next loop
        if not pg.eval_on_selector("#screen-perk","el=>el.classList.contains('hidden')"):
            pg.evaluate("window.__DEBUG.pickFirstPerk()"); pg.wait_for_timeout(120)
    C["bosses"] = boss_results

    # boss lose -> game over
    pg.evaluate("window.__DEBUG.startRound(5)"); pg.wait_for_timeout(150)
    pg.evaluate("window.__DEBUG.bossForceLose()"); pg.wait_for_timeout(200)
    C["boss_lose_over"] = (pg.evaluate("window.__DEBUG.state().scene") == "over")

    # meme flash still good
    pg.evaluate("window.__DEBUG.state().scene='over'")  # leave any state
    pg.evaluate("window.__DEBUG.startRound(3)"); pg.wait_for_timeout(120)
    C["flash_id"] = pg.evaluate("window.__DEBUG.breakMeme()")
    b.close()

print(json.dumps(C, indent=2))
print("PAGE ERRORS:", errors or "none")
print("CONSOLE ERRORS (non-404):", [c for c in cons if "404" not in c and "Failed to load resource" not in c] or "none")

allboss = all(v["started"] and v["won_to_shop"] for v in C["bosses"].values())
ok = (not errors
      and C["items"] >= 50 and C["perks"] >= 20
      and C["meme_local"] >= 50 and C["meme_sounds"] >= 18
      and C["images_loaded"] >= 50
      and "pingas" in C["pingas_src"] and "memes/" in C["pingas_src"] and "svg" not in C["pingas_src"]
      and C["items_after_stack"] == 6 and C["doge_chip_badge"]
      and C["memeboss_balls_at_launch"] >= 2 and C["memeboss_lasers_fired"] > 0 and C["memeboss_hp_dropped"]
      and allboss and C["boss_lose_over"] and C["flash_id"])
print("VERDICT:", "PASS" if ok else "FAIL")
sys.exit(0 if ok else 1)
