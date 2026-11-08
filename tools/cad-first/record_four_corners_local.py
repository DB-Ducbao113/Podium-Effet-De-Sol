#!/usr/bin/env python3
"""LOCAL Chromium WebGL review of four measured Model B wheel stations.

Never runs GitHub Actions, uploads sources or claims rear chassis CAD validation.
Requires a local Vite DEV server and original SHA-matched private P2.8 files.
Record real source frames, not synthetic GLB, CGI, mock or screenshots.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
from pathlib import Path
import shutil
import subprocess
import sys

WHEELS=(
    ("front-positive-z","Front +Z original P2.8"),
    ("front-negative-z","Front -Z proper rotated source"),
    ("rear-positive-z","Rear +Z source wheel-end only"),
    ("rear-negative-z","Rear -Z source wheel-end only"),
)

def verify(p28:Path,quality:str)->tuple[Path,Path,dict]:
    manifest=p28/"P28_remate_manifest.json"
    if not manifest.is_file():
        raise RuntimeError("Missing owner original P2.8 manifest")
    record=json.loads(manifest.read_text(encoding="utf8"))
    if record.get("schema")!="podium-eds.p2.cad-first.full-corner.remate.v1":
        raise RuntimeError("Wrong source CAD manifest")
    ids=record.get("partIds",[])
    if len(ids)!=59 or len(set(ids))!=59:
        raise RuntimeError("P2.8 must contain exactly 59 source part IDs")
    profile=record["profiles"][quality]
    glb=p28/profile["file"]
    if not glb.is_file() or glb.stat().st_size!=profile["bytes"]:
        raise RuntimeError("Original P2.8 source GLB missing or size mismatch")
    h=hashlib.file_digest(glb.open("rb"),"sha256").hexdigest()
    if h!=profile["sha256"]:raise RuntimeError("P2.8 original GLB SHA mismatch")
    return manifest,glb,record

def capture(url:str,p28:Path,out:Path,quality:str,p29:Path|None=None,
            p210:Path|None=None)->dict:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError as exc:
        raise RuntimeError("Install Python Playwright and Chromium locally") from exc
    manifest,glb,record=verify(p28,quality)
    out.mkdir(parents=True,exist_ok=True)
    runtime={
        "schema":"podium-eds.four-wheel.chromium-owner-review.v1",
        "original_p28_sha256":record["profiles"][quality]["sha256"],
        "source_part_count":59,
        "real_p29_rear_upright_loaded":False,
        "real_p210_rear_wishbone_loaded":False,
        "p210_step_source_sha256":None,
        "p29_step_source_sha256":None,
        "native_cad_scale":1,
        "all_four_original_modelb_wheel_positions":False,
        "real_rear_chassis_cad_approved":False,
        "mechanical_g2":"HOLD",
        "scope":"visual review of genuine CAD-derived front source at four measured wheels",
        "screenshots":[],
        "javascript_errors":[],
        "webgl_shader_errors":[],
        "mask_comparison":None,
        "recorded_video":None,
    }
    model_statuses=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,args=[
            "--enable-webgl","--use-gl=angle","--use-angle=swiftshader"])
        context=browser.new_context(viewport={"width":1440,"height":900},
            record_video_dir=str(out),record_video_size={"width":1440,"height":900},
            accept_downloads=True)
        page=context.new_page()
        page.on("pageerror",lambda e:runtime["javascript_errors"].append(str(e)))
        page.on("console",lambda m:runtime["webgl_shader_errors"].append(m.text)
                if m.type=="error" and
                any(word in m.text.lower() for word in
                    ("webgl", "shader error", "validate_status", "gl_invalid_operation"))
                else None)
        page.on("response",lambda r:model_statuses.append(r.status)
            if "model-b-eds-optimized-v1.glb" in r.url else None)
        try:
            response=page.goto(url,wait_until="domcontentloaded",timeout=60000)
            if response is None or response.status>=400:
                raise RuntimeError("Local DEV route not reachable")
            page.locator('input[type="file"]').nth(0).set_input_files(str(manifest))
            page.get_by_text("P2.8 MANIFEST READY",exact=False).first.wait_for(timeout=20000)
            page.locator('input[type="file"]').nth(1).set_input_files(str(glb))
            page.get_by_text("MODEL B + VERIFIED P2.8 LOADED",exact=False).first.wait_for(timeout=90000)
            if 200 not in model_statuses:
                raise RuntimeError("Actual original Model B GLB did not load")
            all_wheels=page.get_by_label("Show four original-source wheel-end placements")
            all_wheels.wait_for(state="visible",timeout=15000)
            if not all_wheels.is_checked():
                all_wheels.check()
            selector=page.get_by_label("Inspect wheel")
            if not selector.is_enabled():
                raise RuntimeError("Four-wheel visual mode disabled or original source fit failed")
            if p29 is not None:
                manifest29=p29/"P29_rear_upright_manifest.json"
                if not manifest29.is_file():
                    raise RuntimeError("Missing independently authored P2.9 rear upright manifest")
                source29=json.loads(manifest29.read_text(encoding="utf8"))
                if (source29.get("schema") !=
                    "podium-eds.p2.cad-first.rear-upright-proposal.v1" or
                    source29.get("mechanicalMatingCertified") is not False):
                    raise RuntimeError("Unverified rear upright design")
                step29=p29/source29["masterSTEP"]
                if (not step29.is_file() or
                    hashlib.sha256(step29.read_bytes()).hexdigest() !=
                    source29["masterSTEPsha256"]):
                    raise RuntimeError("P2.9 rear upright STEP source mismatch")
                glb_entry=source29["profiles"][quality]
                glb29=p29/glb_entry["file"]
                if (not glb29.is_file() or
                    hashlib.sha256(glb29.read_bytes()).hexdigest()!=glb_entry["sha256"]):
                    raise RuntimeError("P2.9 rear upright GLB source hash mismatch")
                page.get_by_label("P2.9 rear upright manifest (.json)").set_input_files(str(manifest29))
                page.get_by_label("P2.9 rear upright GLB (.glb)").set_input_files(str(glb29))
                page.get_by_text("P29 REAR UPRIGHT RENDERED",exact=False).first.wait_for(timeout=45000)
                runtime["p29_step_source_sha256"]=source29["masterSTEPsha256"]
                runtime["p29_source_glb_sha256"]=glb_entry["sha256"]
            if p210 is not None:
                p210_manifest=p210/"P210_rear_suspension_manifest.json"
                if not p210_manifest.is_file():
                    raise RuntimeError("Missing independently authored P2.10 source manifest")
                source210=json.loads(p210_manifest.read_text(encoding="utf8"))
                pair_audit=source210.get("nativeStaticAudit",{})
                if (source210.get("schema") !=
                    "podium-eds.p2.cad-first.rear-double-wishbone-proposal.v1" or
                    source210.get("totalCadSolids")!=11 or
                    source210.get("newSolids")!=10 or
                    source210.get("chassisHardpointsMeasured") is not False or
                    source210.get("mechanicalMateCertified") is not False or
                    pair_audit.get("pairCount")!=55 or
                    pair_audit.get("passStatic") is not True or
                    pair_audit.get("unresolvedCollisions") or
                    pair_audit.get("booleanErrors")):
                    raise RuntimeError("P2.10 source rear suspension is not a valid static 11-solid proposal")
                step210=p210/source210["masterSTEP"]
                if (not step210.is_file() or
                    hashlib.sha256(step210.read_bytes()).hexdigest() !=
                    source210["masterSTEPsha256"]):
                    raise RuntimeError("P2.10 STEP digest mismatch")
                profile210=source210["profiles"][quality]
                glb210=p210/profile210["file"]
                if (not glb210.is_file() or
                    hashlib.sha256(glb210.read_bytes()).hexdigest()!=profile210["sha256"]):
                    raise RuntimeError("P2.10 11-part GLB digest mismatch")
                page.get_by_label("P2.10 rear suspension manifest (.json)").set_input_files(str(p210_manifest))
                page.get_by_label("P2.10 rear suspension GLB (.glb)").set_input_files(str(glb210))
                page.get_by_text("P210 REAR SUSPENSION MESHES PARSED",exact=False).first.wait_for(timeout=60000)
                runtime["p210_step_source_sha256"]=source210["masterSTEPsha256"]
                runtime["p210_source_glb_sha256"]=profile210["sha256"]
            with page.expect_download(timeout=15000) as download_info:
                page.get_by_role("button",name="EXPORT PLACEMENT JSON").click()
            audit_file=out/"four-corner-original-source-placement.json"
            download_info.value.save_as(str(audit_file))
            placement=json.loads(audit_file.read_text(encoding="utf8"))
            layout=placement.get("fourWheelLayout") or {}
            corners=layout.get("corners",[])
            if len(corners)!=4 or {x.get("id") for x in corners}!={x[0] for x in WHEELS}:
                raise RuntimeError("Browser did NOT place exactly four measured wheels")
            if p210 is not None:
                rear_susp=placement.get("rearSuspensionProposal")
                if (not isinstance(rear_susp,dict) or
                    rear_susp.get("totalCadSolids")!=11 or
                    rear_susp.get("nativeStaticPairCount")!=55 or
                    rear_susp.get("sourceSha256")!=runtime["p210_source_glb_sha256"] or
                    rear_susp.get("mechanicalMatingCertified") is not False or
                    rear_susp.get("rearChassisHardpointsMeasured") is not False or
                    rear_susp.get("dynamicSuspensionCertified") is not False):
                    raise RuntimeError("P2.10 real WebGL export missing original source evidence")
                runtime["real_p210_rear_wishbone_loaded"]=True
            if p29 is not None:
                rear=placement.get("rearUprightProposal")
                if (not isinstance(rear,dict) or
                    rear.get("partId") != "P29_REAR_UPRIGHT_BEARING_CARRIER_PROPOSAL" or
                    rear.get("sourceSha256") != runtime["p29_source_glb_sha256"] or
                    rear.get("mechanicalMatingCertified") is not False or
                    rear.get("rearChassisHardpointsMeasured") is not False):
                    raise RuntimeError("P2.9 source was not verified and exported from the real browser")
                runtime["real_p29_rear_upright_loaded"]=True
            if any(x.get("p28Scale")!=1 or x.get("mechanicalMateCertified") is not False
                   for x in corners):
                raise RuntimeError("Native P2.8 CAD was altered or falsely certified")
            if layout.get("genuineRearAssemblyAvailable") is not False or layout.get("mechanicalG2")!="HOLD":
                raise RuntimeError("Rear wheel visual proxy incorrectly marked authentic")
            fit=placement.get("ownerSourceWheelCalibration") or {}
            src=fit.get("originalP28WheelCenterM")
            measured=fit.get("wheels") or []
            if not isinstance(src,list) or len(src)!=3 or not all(
                    isinstance(v,(int,float)) and math.isfinite(v) for v in src):
                raise RuntimeError("Original source P2.8 wheel center missing")
            if len(measured)!=4:
                raise RuntimeError("Four actual measured source wheel envelopes missing")
            mounts={x["id"]:x for x in corners}
            expected_status={
                "front-positive-z":"ORIGINAL_FRONT_P28",
                "front-negative-z":"ROTATED_FRONT_P28_VISUAL",
                "rear-positive-z":"FRONT_WHEEL_END_PROXY_FOR_REAR",
                "rear-negative-z":"FRONT_WHEEL_END_PROXY_FOR_REAR",
            }
            max_error=0.0
            for wheel in measured:
                ident=(wheel["station"]+"-"+("positive" if wheel["side"]==1
                    else "negative")+"-z")
                mount=mounts.get(ident)
                if mount is None or mount.get("sourceStatus")!=expected_status[ident]:
                    raise RuntimeError("Incorrect original source identity for "+ident)
                theta=mount["rotationYRad"]
                dx,dy,dz=mount["translationM"]
                if not all(math.isfinite(v) for v in (theta,dx,dy,dz)):
                    raise RuntimeError("Nonfinite four-corner transform for "+ident)
                expected_theta=0 if wheel["side"]==1 else math.pi
                if abs(theta-expected_theta)>1e-7:
                    raise RuntimeError("Wheel mount has incorrect orientation or chirality: "+ident)
                x=math.cos(theta)*src[0]+math.sin(theta)*src[2]+dx
                y=src[1]+dy
                z=-math.sin(theta)*src[0]+math.cos(theta)*src[2]+dz
                actual_center=wheel["centerM"]
                error=math.dist((x,y,z),actual_center)
                max_error=max(max_error,error)
                if error>.0005:
                    raise RuntimeError("CAD-to-Model B wheel center residual >0.5 mm: "+ident)
            runtime["max_wheel_center_residual_m"]=max_error
            runtime["all_four_original_modelb_wheel_positions"]=True
            runtime["four_corner_mounts"]=corners
            def shot(name:str,delay:int=650)->None:
                page.wait_for_timeout(delay)
                page.screenshot(path=str(out/name),full_page=False)
                runtime["screenshots"].append(name)
            shot("01-whole-car-four-source-wheelends.png",800)
            page.get_by_label("Review camera").select_option("wheel-macro")
            selector.select_option("front-positive-z")
            mask=page.get_by_label(
                "Mask original Model B wheel volumes (reversible shader-only view)"
            )
            if not mask.is_checked():
                raise RuntimeError("Original Model B wheel duplication mask is not enabled")
            page.wait_for_timeout(900)
            masked=page.locator("canvas").first.screenshot(path=str(out/"mask-enabled-canvas.png"))
            mask.uncheck()
            page.wait_for_timeout(900)
            unmasked=page.locator("canvas").first.screenshot(path=str(out/"mask-disabled-canvas.png"))
            changed=hashlib.sha256(masked).digest()!=hashlib.sha256(unmasked).digest()
            runtime["mask_comparison"]={
                "original_model_b_glb_modified":False,
                "mask_only_changes_canvas_pixels":changed,
                "mask_enabled_png_sha256":hashlib.sha256(masked).hexdigest(),
                "mask_disabled_png_sha256":hashlib.sha256(unmasked).hexdigest(),
            }
            if not changed:
                raise RuntimeError("Four-wheel shader mask produced no visible canvas change")
            mask.check()
            page.wait_for_timeout(400)
            for i,(wheel_id,label) in enumerate(WHEELS,start=2):
                selector.select_option(wheel_id)
                shot(str(i).zfill(2)+"-"+wheel_id+".png",800)
                if "rear" in wheel_id:
                    # Deliberately show absence of certified rear wishbones/uprights.
                    page.get_by_label("CAD assembly presentation").select_option("mechanism-core")
                    shot(str(i).zfill(2)+"b-"+wheel_id+"-brake-core.png")
                    page.get_by_label("CAD assembly presentation").select_option("assembled")
            selector.select_option("front-positive-z")
            page.get_by_label("CAD assembly presentation").select_option("exploded")
            shot("06-front-positive-z-real-cad-exploded.png",700)
            page.get_by_label("CAD assembly presentation").select_option("assembled")
            page.get_by_label("Review camera").select_option("whole-car")
            shot("07-all-four-source-wheelends-restored.png",700)
            runtime["viewports"]=[]
            for width,height in [(390,844),(768,1024),(1440,900),(1920,1080)]:
                page.set_viewport_size({"width":width,"height":height})
                rect=page.evaluate("""() => ({
                  width:document.documentElement.clientWidth,
                  scrollWidth:document.documentElement.scrollWidth,
                  canvasWidth:document.querySelector('canvas')?.getBoundingClientRect().width||0,
                  canvasHeight:document.querySelector('canvas')?.getBoundingClientRect().height||0
                })""")
                rect["target"]=[width,height]
                runtime["viewports"].append(rect)
                if rect["scrollWidth"]-rect["width"]>2 or rect["canvasWidth"]<=0:
                    raise RuntimeError("Four-wheel Canvas responsive regression at "+str(width))
            if runtime["javascript_errors"]:
                raise RuntimeError("Browser runtime errors: "+str(runtime["javascript_errors"]))
            if runtime["webgl_shader_errors"]:
                raise RuntimeError("WebGL/shader compilation errors: "+
                                   str(runtime["webgl_shader_errors"]))
        finally:
            video=page.video
            context.close()
            if video:
                webm=out/"four-wheel-real-browser.webm"
                video.save_as(str(webm))
                runtime["recorded_video"]=str(webm)
            browser.close()
    if runtime["all_four_original_modelb_wheel_positions"] and shutil.which("ffmpeg"):
        output=out/"four-wheel-real-browser.mp4"
        subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-y",
            "-i",str(out/"four-wheel-real-browser.webm"),"-c:v","libx264",
            "-pix_fmt","yuv420p","-movflags","+faststart",str(output)],
            check=True,timeout=240)
        runtime["recorded_video"]=str(output)
    (out/"four-wheel-browser-evidence.json").write_text(
        json.dumps(runtime,indent=2)+"\n",encoding="utf8")
    return runtime

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--url",default="http://127.0.0.1:5184/engineering/assembly-preview")
    parser.add_argument("--p28-dir",type=Path,required=True)
    parser.add_argument("--p29-dir",type=Path,default=None)
    parser.add_argument("--p210-dir",type=Path,default=None)
    parser.add_argument("--out",type=Path,required=True)
    parser.add_argument("--quality",choices=["HIGH","BALANCED","PERFORMANCE"],default="BALANCED")
    args=parser.parse_args()
    result=capture(args.url,args.p28_dir.resolve(),args.out.resolve(),args.quality,
                   args.p29_dir.resolve() if args.p29_dir else None,
                   args.p210_dir.resolve() if args.p210_dir else None)
    print("LOCAL four-wheel browser review recorded:",result["recorded_video"])
    print("G2 HOLD: rear is front source wheel-end proxy, NOT rear suspension CAD.")

if __name__=="__main__":
    main()
