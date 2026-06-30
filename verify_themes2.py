import sys, json, pathlib
sys.stdout.reconfigure(encoding="utf-8")
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(r"C:\Users\hyper\NubbysBrickFactory")
URL = (ROOT / "index.html").as_uri()
errs = []; C = {}

with sync_playwright() as p:
    b = p.chromium.launch(channel="msedge", headless=True)
    pg = b.new_page(viewport={"width": 1000, "height": 760})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(1800)

    C["skin_loaded"] = pg.evaluate("typeof window.SKIN==='object'")
    C["procVoice"] = pg.evaluate("typeof SFX.procVoice==='function'")
    # every item/perk produces a themed icon data-uri
    C["all_have_retro_icon"] = pg.evaluate("CONTENT.items.concat(CONTENT.perks).every(it=>SKIN.itemURI(it,'retro').startsWith('data:image/svg'))")
    C["all_have_creepy_icon"] = pg.evaluate("CONTENT.items.concat(CONTENT.perks).every(it=>SKIN.itemURI(it,'creepy').startsWith('data:image/svg'))")
    # NO DUPLICATE skins across all items+perks (uniqueness requirement)
    C["dup_retro"] = pg.evaluate("(()=>{const s=new Set(),d=[];CONTENT.items.concat(CONTENT.perks).forEach(it=>{const u=SKIN.itemURI(it,'retro');if(s.has(u))d.push(it.id);s.add(u);});return d;})()")
    C["dup_creepy"] = pg.evaluate("(()=>{const s=new Set(),d=[];CONTENT.items.concat(CONTENT.perks).forEach(it=>{const u=SKIN.itemURI(it,'creepy');if(s.has(u))d.push(it.id);s.add(u);});return d;})()")
    # effectText non-empty for all
    C["all_effecttext"] = pg.evaluate("CONTENT.items.every(it=>!!window.__DEBUG.effectText(it) && window.__DEBUG.effectText(it).length>3)") if pg.evaluate("!!window.__DEBUG.effectText") else "no-debug"
    # themed death sounds exist
    C["retro_death_snd"] = pg.evaluate("!!(window.MEME_SOUNDS||{}).retro_death")
    C["creepy_death_snd"] = pg.evaluate("!!(window.MEME_SOUNDS||{}).creepy_death")
    # enriched theme images loaded
    C["retro_pool_imgs"] = pg.evaluate("(()=>{const p=['retro_mario','retro_dk','retro_bowser','retro_sonic','retro_tetris','retro_finishhim','retro_duckhunt'];return p.filter(id=>{const i=MEMES.get(id);return i&&i.complete&&i.naturalWidth>0;}).length;})()")
    C["creepy_pool_imgs"] = pg.evaluate("(()=>{const p=['creepy_scp173','creepy_scp096','creepy_backrooms','creepy_zalgo','creepy_masky'];return p.filter(id=>{const i=MEMES.get(id);return i&&i.complete&&i.naturalWidth>0;}).length;})()")

    # themed shop card uses SKIN icon + name + auto desc
    pg.evaluate("window.__DEBUG.setTheme('retro')")
    pg.click("#btn-start"); pg.wait_for_timeout(150)
    pg.evaluate("window.__DEBUG.showShop()"); pg.wait_for_timeout(200)
    card = pg.evaluate("(()=>{const c=document.querySelector('#shop-items .card');return c?{img:c.querySelector('img').src.slice(0,20),nm:c.querySelector('.nm').textContent,ds:c.querySelector('.ds').textContent}:null;})()")
    C["retro_card"] = card
    pg.screenshot(path=str(ROOT/"shot_retro_shop.png"))

    # themed gameplay screenshots
    pg.evaluate("window.__DEBUG.setTheme('retro'); window.__DEBUG.startRound(2)"); pg.wait_for_timeout(300)
    pg.screenshot(path=str(ROOT/"shot_retro_play.png"))
    pg.evaluate("window.__DEBUG.setTheme('creepy'); window.__DEBUG.startRound(3)"); pg.wait_for_timeout(300)
    pg.screenshot(path=str(ROOT/"shot_creepy_play.png"))
    # themed boss: giant meme reskinned
    pg.evaluate("window.__DEBUG.setTheme('creepy'); window.__DEBUG.startRound(5)"); pg.wait_for_timeout(300)
    C["creepy_boss_meme"] = pg.evaluate("window.__DEBUG.state().boss.memeId")
    pg.screenshot(path=str(ROOT/"shot_creepy_boss.png"))

    print("PAGE ERRORS:", errs or "none")
    b.close()

print(json.dumps(C, indent=2))
ok = (not errs
      and C["skin_loaded"] and C["procVoice"]
      and C["all_have_retro_icon"] and C["all_have_creepy_icon"]
      and C["dup_retro"] == [] and C["dup_creepy"] == []
      and C["retro_death_snd"] and C["creepy_death_snd"]
      and C["retro_pool_imgs"] >= 5 and C["creepy_pool_imgs"] >= 4
      and C["retro_card"] and C["retro_card"]["img"].startswith("data:image/svg")
      and isinstance(C["creepy_boss_meme"], str) and C["creepy_boss_meme"].startswith("creepy_"))
print("VERDICT:", "PASS" if ok else "FAIL")
sys.exit(0 if ok else 1)
