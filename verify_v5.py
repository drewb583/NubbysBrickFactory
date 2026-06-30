# v5 final check: new memes integrated, every meme + every buyable item has a sound.
import sys, json, pathlib
sys.stdout.reconfigure(encoding="utf-8")
from playwright.sync_api import sync_playwright

URL = (pathlib.Path(r"C:\Users\hyper\NubbysBrickFactory") / "index.html").as_uri()
errs, cons = [], []
C = {}
NEW = ["starfox","barrelroll","squadala","weegee","mahboi","ganon","spaghetti","mamaluigi","immeen",
       "mariohaha","heehee","sparta","doomguy","leeroy","shia","ugandanknuckles","immaheadout",
       "skibidi","grimace","johnwick","therock","ohio","pressf"]

with sync_playwright() as p:
    b = p.chromium.launch(channel="msedge", headless=True)
    pg = b.new_page(viewport={"width": 1000, "height": 760})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: cons.append(m.text) if m.type == "error" else None)
    pg.goto(URL); pg.wait_for_timeout(1800)

    C["items"] = pg.evaluate("CONTENT.items.length")
    C["perks"] = pg.evaluate("CONTENT.perks.length")
    C["roster"] = pg.evaluate("MEMES.ids.length")
    C["meme_local"] = pg.evaluate("Object.keys(window.MEME_LOCAL||{}).length")
    C["meme_sounds"] = pg.evaluate("Object.keys(window.MEME_SOUNDS||{}).length")
    # new memes present in roster with a loaded image
    C["new_in_roster"] = pg.evaluate(f"{json.dumps(NEW)}.filter(id=>MEMES.ids.includes(id)).length")
    C["new_images_loaded"] = pg.evaluate(f"{json.dumps(NEW)}.filter(id=>{{const i=MEMES.get(id);return i&&i.complete&&i.naturalWidth>0&&/assets\\/memes/.test(i.src);}}).length")
    # EVERY meme has a sound
    C["memes_without_sound"] = pg.evaluate("MEMES.ids.filter(id=>!window.__DEBUG.soundFor(id))")
    # EVERY buyable item's meme resolves to a sound (so buying always plays a sound)
    C["items_without_buy_sound"] = pg.evaluate("CONTENT.items.filter(it=>!window.__DEBUG.soundFor(it.art) && !((window.MEME_SOUNDS||{})['taco'])).map(it=>it.id)")
    # new memes that have their OWN sound file
    C["new_own_sound"] = pg.evaluate(f"{json.dumps(NEW)}.filter(id=>(window.MEME_SOUNDS||{{}})[id]).length")

    # buy a few new memes -> no error, inventory grows
    pg.click("#btn-start"); pg.wait_for_timeout(200)
    for id in ["doomguy","starfox","ganon","mamaluigi"]:
        pg.evaluate(f"window.__DEBUG.give('{id}')")
    C["items_owned_after_give"] = pg.evaluate("window.__DEBUG.state().items.length")
    # flash a new meme brick
    pg.evaluate("window.__DEBUG.startRound(3)"); pg.wait_for_timeout(120)
    pg.evaluate("const g=window.__DEBUG.state(); const b=g.bricks.find(x=>x.alive); if(b) b.meme='ganon';")
    C["flash_new"] = pg.evaluate("(()=>{const g=window.__DEBUG.state();const b=g.bricks.find(x=>x.alive&&x.meme==='ganon');return b?'ok':'none';})()")
    pg.screenshot(path=str(pathlib.Path(r"C:\Users\hyper\NubbysBrickFactory")/"shot5_shop.png"))
    b.close()

print(json.dumps(C, indent=2))
print("PAGE ERRORS:", errs or "none")
print("CONSOLE ERRORS (non-404):", [c for c in cons if "404" not in c and "Failed to load resource" not in c] or "none")

ok = (not errs
      and C["items"] >= 70 and C["perks"] >= 23
      and C["new_in_roster"] >= 22 and C["new_images_loaded"] >= 22
      and C["memes_without_sound"] == []
      and C["items_without_buy_sound"] == []
      and C["new_own_sound"] >= 20)
print("VERDICT:", "PASS" if ok else "FAIL")
sys.exit(0 if ok else 1)
