#!/usr/bin/env python3
"""Record a REAL Chrome/Chromium Model B + verified original P2.8 viewer.
Precondition: Vite DEV server running; original P2.8 GLB and manifest on disk.
No synthetic substitute, offline render, fabricated performance or visual acceptance.
Dependency: python -m pip install playwright && python -m playwright install chromium
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
from datetime import datetime,timezone
import sys

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--url",default="http://127.0.0.1:5184/engineering/assembly-preview")
    p.add_argument("--p28-dir",type=Path,required=True)
    p.add_argument("--out",type=Path,required=True)
    p.add_argument("--quality",choices=["HIGH","BALANCED","PERFORMANCE"],default="BALANCED")
    a=p.parse_args()
    out=a.out.resolve();out.mkdir(parents=True,exist_ok=True)
    owner=a.p28_dir.resolve()
    manifest=owner/"P28_remate_manifest.json"
    if not manifest.is_file():raise SystemExit("Missing ORIGINAL P2.8 manifest; no synthetic substitute allowed")
    data=json.loads(manifest.read_text(encoding="utf8"))
    if data.get("schema")!="podium-eds.p2.cad-first.full-corner.remate.v1" or len(data.get("partIds",[]))!=59:
        raise SystemExit("Expected original 59-solid P2.8 manifest")
    profile=data.get("profiles",{}).get(a.quality)
    if not profile:raise SystemExit("Requested original LOD not available")
    glb=owner/profile["file"]
    if not glb.is_file():raise SystemExit("Missing original P2.8 GLB")
    from hashlib import sha256
    if glb.stat().st_size!=profile["bytes"] or sha256(glb.read_bytes()).hexdigest()!=profile["sha256"]:
        raise SystemExit("P2.8 GLB integrity failed, refusing screenshot/video")
    try:
        from playwright.sync_api import sync_playwright
    except ImportError as e:
        raise SystemExit("Install Playwright: python -m pip install playwright") from e
    errors=[]
    model_b_responses=[]
    runtime={"url":a.url,"source":"original SHA-verified P2.8 + repo Model B",
        "quality":a.quality,"model_b_source":"apps/web/public/models/model-b-eds-optimized-v1.glb",
        "p28_source_sha256":profile["sha256"],"browser":"chromium",
        "created_at_utc":datetime.now(timezone.utc).isoformat(),"video":"NOT_RECORDED",
        "mechanical_mate_validated":False,"g2":"HOLD"}
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True,args=["--enable-webgl","--use-gl=angle","--use-angle=swiftshader"])
        try:
            context=browser.new_context(viewport={"width":1440,"height":900},
                device_scale_factor=1,record_video_dir=str(out),
                record_video_size={"width":1440,"height":900})
            page=context.new_page()
            page.on("response",lambda r:model_b_responses.append(r.status) if "model-b-eds-optimized-v1.glb" in r.url else None)
            page.on("pageerror",lambda e:errors.append("PAGEERROR "+str(e)))
            page.on("console",lambda m:errors.append("CONSOLE "+m.text) if m.type=="error" else None)
            response=page.goto(a.url,wait_until="domcontentloaded",timeout=60000)
            if response is None or response.status>=400:raise RuntimeError("DEV route inaccessible")
            page.locator('input[type="file"]').nth(0).set_input_files(str(manifest))
            page.get_by_text("P2.8 MANIFEST READY",exact=False).wait_for(timeout=20000)
            page.locator('input[type="file"]').nth(1).set_input_files(str(glb))
            page.get_by_text("GLB HASH MATCHES OWNER MANIFEST",exact=False).first.wait_for(timeout=45000)
            page.get_by_text("MODEL B + VERIFIED P2.8 LOADED",exact=False).wait_for(timeout=60000)
            page.wait_for_timeout(1800)
            if not 200 in model_b_responses:
                raise RuntimeError("Original Model B asset was not loaded successfully; refusing fake video")
            page.screenshot(path=str(out/"01-original-separate.png"),full_page=True)
            page.get_by_label("Display mode").select_option("center")
            page.wait_for_timeout(1200)
            page.screenshot(path=str(out/"02-unverified-centre-overlay.png"),full_page=True)
            with page.expect_download(timeout=15000) as event:
                page.get_by_role("button",name="EXPORT PLACEMENT JSON").click()
            event.value.save_as(str(out/"visual-placement-audit.json"))
            exported=json.loads((out/"visual-placement-audit.json").read_text(encoding="utf8"))
            if not isinstance(exported.get("resolvedOriginalRootTransform"),dict):
                raise RuntimeError("Real browser did not export original-root 3D transform")
            runtime["resolved_transform_record"]="visual-placement-audit.json"
            slider=page.locator('input[type="range"]').first
            slider.focus()
            slider.press("Home")
            for _ in range(7):slider.press("ArrowRight")
            page.wait_for_timeout(1200)
            page.screenshot(path=str(out/"03-transparent-shell.png"),full_page=True)
            source_parts=data["partIds"]
            bolt=next((x for x in source_parts if "LOCK" in x or "STUD" in x or "BOLT" in x),None)
            if bolt:
                page.get_by_label("Source part isolation").select_option(bolt)
                page.wait_for_timeout(1200)
                page.screenshot(path=str(out/"04-existing-fastener-isolated.png"),full_page=True)
                page.get_by_label("Source part isolation").select_option("")
            canvas=page.locator("canvas").first
            canvas.scroll_into_view_if_needed()
            rect=canvas.bounding_box()
            if rect:
                x,y=rect["x"]+rect["width"]*.61,rect["y"]+rect["height"]*.52
                page.mouse.move(x,y)
                page.mouse.down()
                for j in range(1,40):
                    page.mouse.move(x+(j/39)*165,y+(j/39)*65,steps=2)
                page.mouse.up()
            page.wait_for_timeout(1200)
            page.screenshot(path=str(out/"05-orbit-review.png"),full_page=True)
            runtime["responsive_views"]=[]
            for width,height in ((390,844),(768,1024),(1440,900),(1920,1080)):
                page.set_viewport_size({"width":width,"height":height})
                page.wait_for_timeout(250)
                geometry=page.evaluate("""() => ({
                    viewport: document.documentElement.clientWidth,
                    scrollWidth: document.documentElement.scrollWidth,
                    canvasWidth: document.querySelector('canvas')?.getBoundingClientRect().width || 0,
                    canvasHeight: document.querySelector('canvas')?.getBoundingClientRect().height || 0
                })""")
                overflow=geometry["scrollWidth"]-geometry["viewport"]
                geometry["horizontal_overflow_px"]=overflow
                runtime["responsive_views"].append({"width":width,"height":height,**geometry})
                if overflow>2 or geometry["canvasWidth"]<=0 or geometry["canvasHeight"]<=0:
                    errors.append(f"Responsive WebGL layout failure at {width}x{height}: {geometry}")
                page.screenshot(path=str(out/f"responsive-{width}.png"),full_page=False)
            page.set_viewport_size({"width":1440,"height":900})
            page.wait_for_timeout(300)
            # Separate source-only scroll QA. This does NOT show Model B as a
            # mechanically completed whole car; label footage precisely.
            scroll_url=a.url.replace("/engineering/assembly-preview",
                                     "/engineering/cinematic-rebuild")
            scroll= context.new_page()
            scroll.on("pageerror",lambda e:errors.append("SCROLL PAGEERROR "+str(e)))
            scroll_response=scroll.goto(scroll_url,wait_until="domcontentloaded",timeout=60000)
            if scroll_response is None or scroll_response.status>=400:
                raise RuntimeError("Original source scroll DEV route missing")
            scroll.locator('input[type="file"]').nth(0).set_input_files(str(manifest))
            scroll.locator('input[type="file"]').nth(1).set_input_files(str(glb))
            scroll.get_by_text("59-SOLID FRONT CORNER",exact=False).first.wait_for(timeout=60000)
            scroll.get_by_text("DECODING VERIFIED CAD",exact=False).wait_for(state="hidden",timeout=60000)
            scroll.wait_for_timeout(900)
            scroll.screenshot(path=str(out/"06-source-scroll-start.png"),full_page=False)
            for index in range(1,21):
                scroll.evaluate("(p)=>window.scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*p)",index/20)
                scroll.wait_for_timeout(140)
            scroll.screenshot(path=str(out/"07-source-scroll-end.png"),full_page=False)
            for index in range(19,-1,-1):
                scroll.evaluate("(p)=>window.scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*p)",index/20)
                scroll.wait_for_timeout(140)
            scroll.screenshot(path=str(out/"08-source-scroll-reverse.png"),full_page=False)
            scroll_video=scroll.video
            scroll.close()
            # The Playwright context video contains actual application frames.
            video=page.video
            context.close()
            if video:
                video.save_as(str(out/"modelb-p28-browser-real.webm"))
                runtime["video"]="modelb-p28-browser-real.webm"
            if scroll_video:
                scroll_video.save_as(str(out/"p28-source-scroll-0-100-0.webm"))
                runtime["source_scroll_video"]="p28-source-scroll-0-100-0.webm"
        finally:
            browser.close()
    runtime["js_errors"]=errors
    runtime["state"]="BROWSER_CAPTURED_MECHANICAL_G2_HOLD" if not errors else "BROWSER_ERRORS"
    (out/"browser-evidence.json").write_text(json.dumps(runtime,indent=2)+"\n",encoding="utf8")
    if errors:
        print(json.dumps(errors,indent=2),file=sys.stderr)
        raise SystemExit(1)
    print("REAL browser video:",out/runtime["video"])
    print("No fabricated F1 mechanical mate claim; G2 HOLD remains.")

if __name__=="__main__":main()
