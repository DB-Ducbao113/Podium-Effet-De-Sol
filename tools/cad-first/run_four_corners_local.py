#!/usr/bin/env python3
"""One LOCAL command: original owner P2.8 source -> four measured wheel WebGL video.

No GitHub Actions, remote job, deployment, synthetic car geometry, or source
upload. Native owner-private STEP/GLB remains in .local-assets.
"""
from __future__ import annotations
import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
from datetime import datetime,timezone
from run_owner_fullcar_review import choose_source,wait_http

ROOT=Path(__file__).resolve().parents[2]
TOOLS=ROOT/"tools"/"cad-first"
MODEL_B=ROOT/"apps/web/public/models/model-b-eds-optimized-v1.glb"

def invoke(*args:object,timeout:int=900)->None:
    command=[str(x) for x in args]
    print("+"," ".join(command),flush=True)
    subprocess.run(command,cwd=ROOT,check=True,timeout=timeout)

def main()->None:
    p=argparse.ArgumentParser()
    p.add_argument("--p28-dir",type=Path,required=True)
    p.add_argument("--out",type=Path,required=True)
    p.add_argument("--quality",choices=("HIGH","BALANCED","PERFORMANCE"),default="BALANCED")
    p.add_argument("--allow-rebuild",action="store_true")
    p.add_argument("--skip-web-qa",action="store_true")
    a=p.parse_args()
    out=a.out.resolve()
    out.mkdir(parents=True,exist_ok=True)
    status={
      "schema":"podium-eds.local-four-wheel-review.gates.v1",
      "execution":"LOCAL_ONLY_NO_GITHUB_ACTIONS",
      "started_at_utc":datetime.now(timezone.utc).isoformat(),
      "branch_expected":"work/engineering-four-corners-local",
      "model_b_source":"apps/web/public/models/model-b-eds-optimized-v1.glb",
      "original_p28_scale":1,
      "g2_mechanical_mating":"HOLD",
      "genuine_rear_suspension_available":False,
      "all_four_wheel_review":"NOT_RUN",
      "steps":[],
      "final_video":None,
    }
    job=None
    log=(out/"vite-dev.log").open("wb")
    def gate(name:str,outcome:str)->None:
        status["steps"].append({"name":name,"status":outcome})
        print(name,":",outcome,flush=True)
    try:
        branch=subprocess.check_output(["git","branch","--show-current"],
            cwd=ROOT,text=True).strip()
        if branch!="work/engineering-four-corners-local":
            raise RuntimeError("Wrong branch: expected work/engineering-four-corners-local, got "+branch)
        gate("CORRECT_REPO_AND_LOCAL_BRANCH","PASS")
        if not MODEL_B.is_file() or MODEL_B.read_bytes()[:4]!=b"glTF":
            raise RuntimeError("Original Model B GLB missing from correct repo")
        gate("OWNER_ORIGINAL_SHOWROOM_GLTF","PASS")
        source=choose_source(a.p28_dir.resolve())
        if source is None:
            if not a.allow_rebuild:
                raise RuntimeError("Missing P2.8 source. Use --allow-rebuild for exact original CAD scripts")
            if a.p28_dir.exists() and any(a.p28_dir.iterdir()):
                raise RuntimeError("Refusing to overwrite nonempty private owner CAD directory")
            invoke(sys.executable,TOOLS/"rebuild_owner_p28.py",
                   "--out",a.p28_dir,timeout=2700)
            source=choose_source(a.p28_dir.resolve())
        if source is None:
            raise RuntimeError("Exact project-authored 59-part P2.8 source was not regenerated")
        gate("ORIGINAL_59_PART_P28_PRESENT","PASS")
        invoke(sys.executable,TOOLS/"test_rebuild_owner_p28.py",timeout=150)
        invoke(sys.executable,TOOLS/"test_audit_assembly_mesh.py",timeout=150)
        gate("LOCAL_SOURCE_PROVENANCE_UNIT_TESTS","PASS")
        invoke(sys.executable,TOOLS/"assembly_modelb_p28_preflight.py",
               "--modelb",MODEL_B,"--p28-dir",source,
               "--quality",a.quality,"--out",out/"source-preflight.json",timeout=900)
        gate("NATIVE_STEP_AND_GLB_INTEGRITY","PASS")
        npm=shutil.which("npm")
        if npm is None:raise RuntimeError("Node/npm missing")
        if not a.skip_web_qa:
            invoke(npm,"run","lint",timeout=600)
            invoke(npm,"run","typecheck","--workspace=@peds/web",timeout=600)
            invoke(npm,"test","--workspace=@peds/web","--",
                   "src/dev/assemblyPreview/fourCornerLayout.test.ts",
                   "src/dev/assemblyPreview/cadPresentation.test.ts",
                   "src/dev/assemblyPreview/ownerMeasuredFit.test.ts",
                   "src/dev/assemblyPreview/showroomWheelMask.test.ts",timeout=300)
            invoke(npm,"run","build","--workspace=@peds/web",timeout=900)
            gate("LOCAL_WEB_LINT_TYPES_TESTS_BUILD","PASS")
        job=subprocess.Popen([
            npm,"run","dev","--workspace=@peds/web","--",
            "--host","127.0.0.1","--port","5184","--strictPort"],
            cwd=ROOT,stdout=log,stderr=subprocess.STDOUT,
            start_new_session=os.name!="nt")
        url="http://127.0.0.1:5184/engineering/assembly-preview"
        wait_http(url,deadline_seconds=75)
        gate("LOCAL_VITE_WEBGL_ROUTE","PASS")
        invoke(sys.executable,TOOLS/"record_four_corners_local.py",
               "--p28-dir",source,"--out",out/"browser",
               "--quality",a.quality,"--url",url,timeout=1100)
        detail=json.loads((out/"browser/four-wheel-browser-evidence.json")
                          .read_text(encoding="utf8"))
        if not detail.get("all_four_original_modelb_wheel_positions"):
            raise RuntimeError("Four distinct original Model B measured wheel positions not rendered")
        movie=detail.get("recorded_video")
        if not movie or not Path(movie).is_file() or Path(movie).stat().st_size<1024:
            raise RuntimeError("No genuine WebGL four-wheel video created")
        status["all_four_wheel_review"]="VISUAL_PASS_G2_HOLD"
        status["final_video"]=movie
        gate("LOCAL_ACTUAL_FOUR_WHEEL_WEBGL_VIDEO","PASS")
    except Exception as exc:
        status["all_four_wheel_review"]="FAILED_CANNOT_CLAIM_VIDEO"
        status["error"]=type(exc).__name__+": "+str(exc)
        gate("ABORT_ON_REAL_SOURCE_OR_BROWSER_FAILURE","FAIL")
        raise
    finally:
        status["finished_at_utc"]=datetime.now(timezone.utc).isoformat()
        (out/"four-wheel-review-gates.json").write_text(
            json.dumps(status,indent=2)+"\n",encoding="utf8")
        if job is not None:
            job.terminate()
            try:job.wait(timeout=10)
            except subprocess.TimeoutExpired:job.kill()
        log.close()
    print("LOCAL OWNER REVIEW VIDEO:",status["final_video"])
    print("Native rear corner mechanical signoff: NOT AVAILABLE; G2 HOLD")

if __name__=="__main__":main()
