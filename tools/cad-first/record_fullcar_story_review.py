#!/usr/bin/env python3
"""Record the actual 18-chapter MODEL B visual walkthrough in Chromium.

This captures real WebGL from the running Vite DEV server. Optional source-only
front-corner P2.8 requires a matching original manifest and GLB digest. It
does NOT turn the 18 visual chapters into certified 18-module CAD geometry.

Usage:
  python tools/cad-first/record_fullcar_story_review.py --out .local-assets/cad-first/fullcar-story-browser
  python tools/cad-first/record_fullcar_story_review.py --p28-dir .local-assets/cad-first/recovered-p28/p28 --out ...
"""
from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path


CHAPTERS=(
    "THE MACHINE","GEOMETRY","FRONT AERO","FRONT WHEEL",
    "BRAKING SYSTEM","FRONT SUSPENSION","STEERING LINKAGE",
    "COCKPIT & HALO","MONOCOQUE","SIDEPODS","COOLING",
    "POWER UNIT","TRANSMISSION","FLOOR & DIFFUSER",
    "REAR MECHANICS","REAR AERO","INSIDE THE MACHINE","REASSEMBLED",
)
MISSING_CHAPTERS=(10,11,12,14)


def verify_optional_owner_source(folder:Path|None,quality:str):
    if folder is None:
        return None,None,None
    folder=folder.resolve()
    if not (folder/"P28_remate_manifest.json").is_file() and (folder/"p28"/"P28_remate_manifest.json").is_file():
        folder=folder/"p28"
    manifest=folder/"P28_remate_manifest.json"
    if not manifest.is_file():
        raise ValueError("Original owner P2.8 manifest missing")
    data=json.loads(manifest.read_text(encoding="utf8"))
    if data.get("schema")!="podium-eds.p2.cad-first.full-corner.remate.v1" or len(data.get("partIds",[]))!=59:
        raise ValueError("Not an original 59-part P2.8 manifest")
    profile=data.get("profiles",{}).get(quality)
    if not isinstance(profile,dict):
        raise ValueError("Requested original P2.8 LOD profile missing")
    filename=profile.get("file")
    if not isinstance(filename,str) or filename!=Path(filename).name:
        raise ValueError("Invalid owner GLB filename")
    glb=folder/filename
    if not glb.is_file() or glb.stat().st_size!=profile.get("bytes"):
        raise ValueError("Original P2.8 GLB missing or length mismatch")
    if hashlib.sha256(glb.read_bytes()).hexdigest()!=profile.get("sha256"):
        raise ValueError("Original P2.8 SHA-256 does not match the manifest")
    return manifest,glb,profile["sha256"]


def inspect_browser(url:str,out:Path,p28_dir:Path|None,quality:str):
    manifest,glb,sha=verify_optional_owner_source(p28_dir,quality)
    try:
        from playwright.sync_api import sync_playwright
    except ImportError as exc:
        raise RuntimeError("Install playwright and its Chromium browser first") from exc
    out=out.resolve()
    out.mkdir(parents=True,exist_ok=True)
    errors=[]
    model_responses=[]
    evidence={
        "schema":"podium-eds.fullcar-story.browser-evidence.v1",
        "url":url,
        "date_utc":datetime.now(timezone.utc).isoformat(),
        "chapters_expected":18,
        "model_b_source":"apps/web/public/models/model-b-eds-optimized-v1.glb",
        "original_p28_sha256":sha,
        "preview_only":True,
        "whole_car_cad_validated":False,
        "mechanical_g2":"HOLD",
        "source_status":"NO_P28_SOURCE" if not sha else "OWNER_P28_VERIFIED_SHA",
        "snapshots":[],
        "reverse_steps":[],
        "responsive":[],
        "video":"NOT_RECORDED",
    }
    with sync_playwright() as playwright:
        browser=playwright.chromium.launch(
            headless=True,args=["--enable-webgl","--use-gl=angle","--use-angle=swiftshader"],
        )
        context=browser.new_context(
            viewport={"width":1440,"height":900},device_scale_factor=1,
            record_video_dir=str(out),record_video_size={"width":1440,"height":900},
            reduced_motion="reduce",
        )
        page=context.new_page()
        page.on("pageerror",lambda exc:errors.append("PAGEERROR "+str(exc)))
        page.on("console",lambda m:errors.append("CONSOLE "+m.text) if m.type=="error" else None)
        page.on("response",lambda r:model_responses.append(r.status)
                if "model-b-eds-optimized-v1.glb" in r.url else None)
        try:
            response=page.goto(url,wait_until="domcontentloaded",timeout=60000)
            if response is None or response.status>=400:
                raise RuntimeError("18-chapter local DEV page did not load")
            page.get_by_text("MODEL B LOADED",exact=True).wait_for(timeout=90000)
            if 200 not in model_responses:
                raise RuntimeError("The original Model B GLB was not loaded successfully")
            navigator=page.locator(".peds-fullstory-chapters button")
            if navigator.count()!=18:
                raise RuntimeError("The story does not expose exactly 18 chapters")
            if manifest is not None and glb is not None:
                page.locator('.peds-fullstory-source-panel input[type="file"]').nth(0).set_input_files(str(manifest))
                page.locator('.peds-fullstory-source-panel input[type="file"]').nth(1).set_input_files(str(glb))
                page.get_by_text("Original 59-part P2.8 visible",exact=False).wait_for(timeout=90000)
                evidence["source_status"]="OWNER_P28_VISIBLE_METRIC_FIT_ONLY"
            track=page.locator(".peds-fullstory-track")
            for i,title in enumerate(CHAPTERS):
                # Jump to an EXACT chapter boundary with deterministic native
                # scroll, then ensure the matching HUD is present in real DOM.
                page.evaluate("""(i) => {
                  const track=document.querySelector('.peds-fullstory-track');
                  const top=track.getBoundingClientRect().top+scrollY;
                  const travel=track.offsetHeight-innerHeight;
                  scrollTo({top:top+travel*i/17,behavior:'instant'});
                }""",i)
                page.wait_for_timeout(220)
                actual=page.locator(".peds-fullstory-content h1").inner_text()
                if actual!=title:
                    raise RuntimeError(f"Chapter {i}: expected {title!r}, got {actual!r}")
                status=page.locator(".peds-fullstory-source").get_attribute("data-coverage")
                if i in MISSING_CHAPTERS and status!="SOURCE_MISSING":
                    raise RuntimeError(f"Chapter {i}: internal CAD source was falsely marked present")
                page.screenshot(path=str(out/f"chapter-{i:02d}.png"),full_page=False)
                evidence["snapshots"].append({"chapter":i,"title":actual,"status":status})
            # Repeat the exact native-scroll trajectory in reverse and assert
            # the same chapter titles. The 17 -> 0 path is not a new model.
            for i in reversed(range(18)):
                page.evaluate("""(i) => {
                  const track=document.querySelector('.peds-fullstory-track');
                  const top=track.getBoundingClientRect().top+scrollY;
                  scrollTo({top:top+(track.offsetHeight-innerHeight)*i/17,behavior:'instant'});
                }""",i)
                page.wait_for_timeout(130)
                actual=page.locator(".peds-fullstory-content h1").inner_text()
                if actual!=CHAPTERS[i]:
                    raise RuntimeError(f"Reverse chapter {i} returned {actual!r}")
                evidence["reverse_steps"].append(i)
            for width,height in ((390,844),(768,1024),(1440,900),(1920,1080)):
                page.set_viewport_size({"width":width,"height":height})
                page.wait_for_timeout(350)
                profile=page.evaluate("""() => ({
                  clientWidth:document.documentElement.clientWidth,
                  scrollWidth:document.documentElement.scrollWidth,
                  canvasWidth:document.querySelector('canvas')?.getBoundingClientRect().width ?? 0,
                  canvasHeight:document.querySelector('canvas')?.getBoundingClientRect().height ?? 0
                })""")
                profile["width"]=width
                profile["height"]=height
                profile["horizontal_overflow_px"]=profile["scrollWidth"]-profile["clientWidth"]
                evidence["responsive"].append(profile)
                if profile["horizontal_overflow_px"]>2 or profile["canvasWidth"]<100 or profile["canvasHeight"]<100:
                    raise RuntimeError(f"Invalid responsive viewport {width}: {profile}")
                page.screenshot(path=str(out/f"responsive-{width}.png"),full_page=False)
            if errors:
                raise RuntimeError("Browser rendering/console errors: "+"; ".join(errors[:8]))
            movie=page.video
            context.close()
            if movie:
                movie.save_as(str(out/"full-car-story-0-100-0.webm"))
                evidence["video"]="full-car-story-0-100-0.webm"
            evidence["result"]="VISUAL_STORY_BROWSER_PASS_MECHANICAL_G2_HOLD"
        finally:
            try:context.close()
            except Exception:pass
            browser.close()
            evidence["browser_errors"]=errors
            (out/"story-browser-evidence.json").write_text(
                json.dumps(evidence,indent=2,ensure_ascii=False)+"\n",encoding="utf8")
    return evidence


if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--url",default="http://127.0.0.1:5184/engineering/full-car-story")
    parser.add_argument("--out",type=Path,required=True)
    parser.add_argument("--p28-dir",type=Path,default=None)
    parser.add_argument("--quality",choices=("HIGH","BALANCED","PERFORMANCE"),default="BALANCED")
    args=parser.parse_args()
    report=inspect_browser(args.url,args.out,args.p28_dir,args.quality)
    print(json.dumps({"result":report.get("result"),"video":report["video"],"mechanical_g2":"HOLD"},indent=2))
