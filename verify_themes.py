import sys, json, pathlib
sys.stdout.reconfigure(encoding="utf-8")
from playwright.sync_api import sync_playwright
URL = (pathlib.Path(r"C:\Users\hyper\NubbysBrickFactory") / "index.html").as_uri()
errs = []; C = {}

def kd(pg, key):
    pg.evaluate("(k)=>window.dispatchEvent(new KeyboardEvent('keydown',{key:k}))", key)

with sync_playwright() as p:
    b = p.chromium.launch(channel="msedge", headless=True)
    pg = b.new_page(viewport={"width": 1000, "height": 760})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(1600)

    # theme images loaded
    C["theme_local_imgs"] = pg.evaluate("Object.keys(window.MEME_LOCAL).filter(id=>/^(retro|creepy)_/.test(id)).length")
    C["theme_imgs_loaded"] = pg.evaluate("Object.keys(window.MEME_LOCAL).filter(id=>/^(retro|creepy)_/.test(id)).filter(id=>{const i=MEMES.get(id);return i&&i.complete&&i.naturalWidth>0;}).length")
    C["theme_sounds"] = pg.evaluate("Object.keys(window.MEME_SOUNDS).filter(id=>/^(retro|creepy)_/.test(id)).length")
    # default roster excludes theme ids
    C["default_roster_clean"] = pg.evaluate("MEMES.ids.every(id=>!/^(retro|creepy)_/.test(id))")

    # --- KONAMI code on title -> retro ---
    for k in ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a","Enter"]:
        kd(pg, k)
    pg.wait_for_timeout(200)
    C["konami_theme"] = pg.evaluate("window.__DEBUG.state().theme")
    C["body_class_retro"] = pg.evaluate("document.body.className")
    C["doge_to_retro"] = pg.evaluate("window.__DEBUG.themedId('doge')")
    C["title_meme_retro"] = pg.evaluate("(()=>{const im=document.querySelector('#titleMemes img');return im?im.src:'';})()").split('/')[-1]

    # back to default then 666 -> creepy
    pg.evaluate("window.__DEBUG.setTheme('default')")
    for _ in range(3): kd(pg, "6")
    pg.wait_for_timeout(200)
    C["six_theme"] = pg.evaluate("window.__DEBUG.state().theme")
    C["body_class_creepy"] = pg.evaluate("document.body.className")
    C["doge_to_creepy"] = pg.evaluate("window.__DEBUG.themedId('doge')")

    # themed brick flash uses themed id + themed sound resolves
    pg.click("#btn-start"); pg.wait_for_timeout(200)
    pg.evaluate("window.__DEBUG.startRound(3)"); pg.wait_for_timeout(120)
    flash_id = pg.evaluate("window.__DEBUG.breakMeme()")
    C["creepy_flash_id"] = flash_id
    C["flash_is_creepy"] = bool(flash_id) and flash_id.startswith("creepy_")
    C["flash_sound_ok"] = pg.evaluate(f"!!window.__DEBUG.soundFor({json.dumps(flash_id)})") if flash_id else False

    # jumpscare on game over (creepy)
    pg.evaluate("window.__DEBUG.triggerGameOver()")
    pg.wait_for_timeout(150)
    C["jumpscare_active"] = pg.evaluate("window.__DEBUG.jumpscareActive()")
    pg.screenshot(path=str(pathlib.Path(r"C:\Users\hyper\NubbysBrickFactory")/"shot_creepy.png"))

    # retro screenshot
    pg.evaluate("window.__DEBUG.setTheme('retro')"); pg.evaluate("window.__DEBUG.startRound(2)"); pg.wait_for_timeout(300)
    pg.screenshot(path=str(pathlib.Path(r"C:\Users\hyper\NubbysBrickFactory")/"shot_retro.png"))
    b.close()

print(json.dumps(C, indent=2))
print("PAGE ERRORS:", errs or "none")
ok = (not errs
      and C["theme_local_imgs"] >= 28 and C["theme_imgs_loaded"] >= 28
      and C["theme_sounds"] >= 26
      and C["default_roster_clean"] is True
      and C["konami_theme"] == "retro" and C["body_class_retro"] == "theme-retro"
      and C["doge_to_retro"].startswith("retro_")
      and C["six_theme"] == "creepy" and C["body_class_creepy"] == "theme-creepy"
      and C["doge_to_creepy"].startswith("creepy_")
      and C["flash_is_creepy"] and C["flash_sound_ok"]
      and C["jumpscare_active"] is True)
print("VERDICT:", "PASS" if ok else "FAIL")
sys.exit(0 if ok else 1)
