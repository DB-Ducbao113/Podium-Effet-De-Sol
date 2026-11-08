#!/usr/bin/env python3
"""One-command local REVIEW gate for real original Model B + P2.8 source.
Never substitutes fake geometry, never modifies production, never pushes code.
Does NOT certify a full-car CAD system: Model B is a polygon showroom shell.
"""
from __future__ import annotations
import argparse
import json
import os
from pathlib import Path
import shutil
import socket
import subprocess
import sys
import time
from locate_owner_p28 import candidates, archive_candidates, safe_extract, owner_roots
from urllib.request import urlopen

ROOT=Path(__file__).resolve().parents[2]
TOOLS=ROOT/"tools"/"cad-first"
MODEL_B=ROOT/"apps"/"web"/"public"/"models"/"model-b-eds-optimized-v1.glb"

def execute(cmd, *, cwd=ROOT, timeout=900):
    print("+"," ".join(map(str,cmd)),flush=True)
    subprocess.run([str(x) for x in cmd],cwd=cwd,check=True,timeout=timeout)

def choose_source(folder:Path):
    if (folder/"P28_remate_manifest.json").is_file():return folder
    if (folder/"p28"/"P28_remate_manifest.json").is_file():return folder/"p28"
    return None

def wait_http(url,deadline_seconds=35):
    deadline=time.monotonic()+deadline_seconds
    while time.monotonic()<deadline:
        try:
            with urlopen(url,timeout=3) as r:
                if r.status==200:return
        except Exception:time.sleep(.5)
    raise RuntimeError("Vite DEV preview did not start or route was not reachable")

def run(args):
    out=args.out.resolve()
    out.mkdir(parents=True,exist_ok=True)
    log={"repo":"DB-Ducbao113/Podium-Effet-De-Sol",
         "production_deploy":False,"merge":False,
         "owner_mechanical_gate":"HOLD","video":"NOT_CREATED",
         "steps":[]}
    report=out/"review-gates.json"
    server=None
    def record(name,status,reason=None):
        log["steps"].append({"gate":name,"status":status,"reason":reason})
        report.write_text(json.dumps(log,indent=2)+"\n",encoding="utf8")
    try:
        if not MODEL_B.is_file():
            raise RuntimeError("Original Model B GLB is missing; abort without substitute")
        record("MODEL_B_FILE","PASS")
        p28=choose_source(args.p28_dir.resolve())
        if p28 is None:
            roots=[args.p28_dir.resolve(), *owner_roots(ROOT)]
            found=next(candidates(roots),None)
            if found is not None:
                p28=found
                record("AUTO_DISCOVER_OWNER_SOURCE","FOUND_PRIVATE_CANDIDATE",str(found))
        if p28 is None:
            roots=[args.p28_dir.resolve(), *owner_roots(ROOT)]
            for archive in archive_candidates(roots):
                restore=out/"restored-owner-p28"
                try:
                    safe_extract(archive,restore)
                    found=next(candidates([restore]),None)
                    if found is not None:
                        p28=found
                        record("RESTORE_OWNER_ARCHIVE","FOUND_PRIVATE_CANDIDATE",str(archive))
                    break
                except (OSError,ValueError,RuntimeError) as exc:
                    record("RESTORE_OWNER_ARCHIVE","REJECTED",str(exc))
                    if restore.exists():break
        if p28 is None:
            if not args.allow_rebuild:
                raise RuntimeError("Original P2.8 source not found. Pass --allow-rebuild to reconstruct it in an EMPTY private directory.")
            execute([sys.executable,TOOLS/"rebuild_owner_p28.py","--out",args.p28_dir],timeout=2400)
            p28=choose_source(args.p28_dir.resolve())
        if p28 is None:raise RuntimeError("P2.8 recovery produced no original manifest")
        execute([sys.executable,TOOLS/"test_rebuild_owner_p28.py"],timeout=45)
        record("OWNER_SOURCE_PROTECTION_UNIT_TESTS","PASS")
        execute([sys.executable,TOOLS/"test_audit_assembly_mesh.py"],timeout=120)
        record("VISUAL_AABB_UNIT_TESTS_SYNTHETIC","PASS")
        execute([sys.executable,TOOLS/"assembly_modelb_p28_preflight.py",
                 "--p28-dir",p28,"--quality",args.quality,
                 "--out",out/"source-preflight.json"],timeout=180)
        record("MODEL_B_P28_SOURCE_AND_NATIVE_STEP","PASS")
        npm_exe=shutil.which("npm")
        if not npm_exe:raise RuntimeError("npm unavailable")
        execute([npm_exe,"run","typecheck","--workspace=@peds/web"],timeout=600)
        record("WEB_TYPESCRIPT","PASS")
        execute([npm_exe,"test","--workspace=@peds/web","--",
                 "src/dev/assemblyPreview/assemblyPlacement.test.ts",
                 "src/dev/assemblyPreview/assemblyRegistration.test.ts",
                 "src/dev/cadFirstScroll/cadSource.test.ts"],timeout=450)
        record("WEB_SOURCE_TESTS","PASS")
        execute([npm_exe,"run","build","--workspace=@peds/web"],timeout=900)
        record("WEB_PRODUCTION_BUILD_ISOLATION","PASS")
        # Vite is started only after CAD/TypeScript/unit preflights pass.
        server=subprocess.Popen([npm_exe,"run","dev","--workspace=@peds/web","--",
                                "--host","127.0.0.1","--port","5184","--strictPort"],
                               cwd=ROOT,stdout=(out/"dev-server.log").open("wb"),
                               stderr=subprocess.STDOUT,start_new_session=(os.name!="nt"))
        url="http://127.0.0.1:5184/engineering/assembly-preview"
        wait_http(url)
        record("DEV_SERVER","PASS")
        execute([sys.executable,TOOLS/"record_modelb_p28_browser.py",
                 "--p28-dir",p28,"--quality",args.quality,
                 "--out",out/"browser","--url",url],timeout=300)
        record("ACTUAL_BROWSER_CAPTURE","PASS")
        placement=out/"browser"/"visual-placement-audit.json"
        if not placement.is_file():
            raise RuntimeError("Original-root transform not exported by WebGL viewer")
        execute([sys.executable,TOOLS/"audit_assembly_mesh.py",
                 "--modelb",MODEL_B,"--p28-dir",p28,
                 "--placement",placement,"--quality",args.quality,
                 "--out",out/"visual-overlap-aabb.json"],timeout=180)
        mesh_report=json.loads((out/"visual-overlap-aabb.json").read_text(encoding="utf8"))
        record("VISUAL_MESH_BROADPHASE",
               "PASS_DIAGNOSTIC_ONLY_G2_HOLD" if mesh_report["model_b_aabb_available"]
               else "NOT_AVAILABLE_NATIVE_DECODER_G2_HOLD")
        video=out/"browser"/"modelb-p28-browser-real.webm"
        if not video.is_file() or video.stat().st_size<1024:
            raise RuntimeError("Browser video file missing or empty")
        scroll_video=out/"browser"/"p28-source-scroll-0-100-0.webm"
        if not scroll_video.is_file() or scroll_video.stat().st_size<1024:
            raise RuntimeError("Source P2.8 scroll video 0→100→0 missing")
        if shutil.which("ffmpeg"):
            mp4=out/"modelb-p28-real-browser.mp4"
            scroll_mp4=out/"p28-source-scroll-real-browser.mp4"
            execute(["ffmpeg","-hide_banner","-loglevel","error","-y",
                     "-i",video,"-c:v","libx264","-pix_fmt","yuv420p",
                     "-movflags","+faststart",mp4],timeout=180)
            execute(["ffmpeg","-hide_banner","-loglevel","error","-y",
                     "-i",scroll_video,"-c:v","libx264","-pix_fmt","yuv420p",
                     "-movflags","+faststart",scroll_mp4],timeout=180)
            log["video"]=str(mp4)
            log["source_scroll_video"]=str(scroll_mp4)
        else:
            log["video"]=str(video)
            log["source_scroll_video"]=str(scroll_video)
        record("REAL_VIDEO_FILE","PASS")
        log["result"]="VISUAL_REVIEW_READY_MECHANICAL_G2_HOLD"
        report.write_text(json.dumps(log,indent=2)+"\n")
        print("REAL OWNER WEBGL REVIEW VIDEO:",log["video"])
        print("NOT production acceptance, NOT mechanical fit verification.")
        return 0
    except (Exception) as e:
        record("STOPPED","FAIL",str(e))
        log["result"]="INCOMPLETE_NO_FALSE_ACCEPTANCE"
        report.write_text(json.dumps(log,indent=2)+"\n")
        print("REVIEW STOPPED:",str(e),file=sys.stderr)
        return 1
    finally:
        if server is not None:
            server.terminate()
            try:server.wait(timeout=5)
            except subprocess.TimeoutExpired:server.kill();server.wait()

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--p28-dir",type=Path,required=True)
    p.add_argument("--out",type=Path,required=True)
    p.add_argument("--quality",choices=["HIGH","BALANCED","PERFORMANCE"],default="BALANCED")
    p.add_argument("--allow-rebuild",action="store_true")
    raise SystemExit(run(p.parse_args()))
