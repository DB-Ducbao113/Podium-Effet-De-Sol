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
      "independent_p29_rear_upright_proposal":False,
      "independent_p210_rear_wishbone_static_cad":False,
      "independent_p211_rear_toe_static_cad":False,
      "independent_p212_toe_adjuster_static_cad":False,
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
        invoke(sys.executable,TOOLS/"test_p2_9_rear_upright.py",timeout=150)
        invoke(sys.executable,TOOLS/"test_p2_10_rear_wishbone.py",timeout=180)
        invoke(sys.executable,TOOLS/"test_p2_11_rear_toe_link.py",timeout=180)
        invoke(sys.executable,TOOLS/"test_p2_12_toe_adjuster.py",timeout=300)
        invoke(sys.executable,TOOLS/"test_rebuild_owner_p28.py",timeout=150)
        invoke(sys.executable,TOOLS/"test_audit_assembly_mesh.py",timeout=150)
        gate("LOCAL_SOURCE_PROVENANCE_UNIT_TESTS","PASS")
        invoke(sys.executable,TOOLS/"assembly_modelb_p28_preflight.py",
               "--modelb",MODEL_B,"--p28-dir",source,
               "--quality",a.quality,"--out",out/"source-preflight.json",timeout=900)
        gate("NATIVE_STEP_AND_GLB_INTEGRITY","PASS")
        p29_dir=out/"p29-rear-upright-source"
        if not p29_dir.is_dir():
            invoke(sys.executable,TOOLS/"p2_9_rear_upright.py",
                   "--out",p29_dir,timeout=600)
        p29_manifest=p29_dir/"P29_rear_upright_manifest.json"
        if not p29_manifest.is_file():
            raise RuntimeError("Original rear upright CAD proposal not generated")
        p29=json.loads(p29_manifest.read_text(encoding="utf8"))
        if (p29.get("schema")!="podium-eds.p2.cad-first.rear-upright-proposal.v1" or
            p29.get("mechanicalMatingCertified") is not False or
            p29.get("actualRearChassisHardpointsMeasured") is not False):
            raise RuntimeError("P2.9 source incorrectly certified or manifest missing")
        from hashlib import sha256
        if (sha256((p29_dir/p29["masterSTEP"]).read_bytes()).hexdigest() !=
            p29["masterSTEPsha256"]):
            raise RuntimeError("P2.9 native STEP source hash mismatch")
        for tier,entry in p29["profiles"].items():
            file=p29_dir/entry["file"]
            if (not file.is_file() or
                sha256(file.read_bytes()).hexdigest()!=entry["sha256"] or
                entry["tessellationWatertight"] is not True):
                raise RuntimeError("P2.9 source LOD integrity failed: "+tier)
        status["independent_p29_rear_upright_proposal"]=True
        gate("INDEPENDENT_P29_REAR_UPRIGHT_STEP_AND_GLB_PROPOSAL","PASS")
        p210_dir=out/"p210-rear-wishbone-source"
        if not p210_dir.is_dir():
            invoke(sys.executable,TOOLS/"p2_10_rear_wishbone.py",
                   "--out",p210_dir,timeout=600)
        p210_manifest=p210_dir/"P210_rear_suspension_manifest.json"
        if not p210_manifest.is_file():
            raise RuntimeError("Original independent rear wishbone STEP source absent")
        p210=json.loads(p210_manifest.read_text(encoding="utf8"))
        a210=p210.get("nativeStaticAudit",{})
        if (p210.get("schema")!="podium-eds.p2.cad-first.rear-double-wishbone-proposal.v1"
            or p210.get("totalCadSolids")!=11 or p210.get("newSolids")!=10
            or p210.get("mechanicalMateCertified") is not False
            or p210.get("chassisHardpointsMeasured") is not False
            or p210.get("dynamicSuspensionCertified") is not False
            or a210.get("pairCount")!=55 or a210.get("passStatic") is not True
            or a210.get("unresolvedCollisions") or a210.get("booleanErrors")):
            raise RuntimeError("P2.10 native 11-solid static source incomplete")
        if (sha256((p210_dir/p210["masterSTEP"]).read_bytes()).hexdigest() !=
            p210["masterSTEPsha256"]):
            raise RuntimeError("P2.10 STEP SHA mismatch")
        for tier,entry in p210["profiles"].items():
            candidate=p210_dir/entry["file"]
            if (not candidate.is_file() or
                sha256(candidate.read_bytes()).hexdigest()!=entry["sha256"] or
                entry.get("allNodesWatertight") is not True or
                len(entry.get("perPartTriangles",{})) != 11):
                raise RuntimeError("P2.10 source GLB/mesh integrity failed at "+tier)
        status["independent_p210_rear_wishbone_static_cad"]=True
        gate("INDEPENDENT_P210_REAR_WISHBONES_NATIVE_55_PAIR_STATIC","PASS")
        p211_dir=out/"p211-rear-toe-source"
        if not p211_dir.is_dir():
            invoke(sys.executable,TOOLS/"p2_11_rear_toe_link.py",
                   "--out",p211_dir,timeout=600)
        p211_file=p211_dir/"P211_rear_toe_manifest.json"
        if not p211_file.is_file():
            raise RuntimeError("P2.11 native source manifest missing")
        p211=json.loads(p211_file.read_text(encoding="utf8"))
        a211=p211.get("nativeStaticAudit",{})
        if (p211.get("schema")!="podium-eds.p2.cad-first.rear-toe-link-static-proposal.v1"
            or p211.get("totalCadSolids")!=15 or p211.get("newSolids")!=4
            or len(set(p211.get("sourceP29P210P211PartIds",[])))!=15
            or p211.get("actualChassisToeHardpointMeasured") is not False
            or p211.get("mechanicalMateCertified") is not False
            or p211.get("dynamicToeKinematicsCertified") is not False
            or a211.get("pairCount")!=105 or a211.get("passStatic") is not True
            or a211.get("unresolvedCollisions") or a211.get("booleanErrors")):
            raise RuntimeError("P2.11 source identity, 105-pair audit or G2 flags invalid")
        if sha256((p211_dir/p211["masterSTEP"]).read_bytes()).hexdigest() != p211["masterSTEPsha256"]:
            raise RuntimeError("P2.11 original STEP source hash mismatch")
        for tier,entry in p211["profiles"].items():
            asset=p211_dir/entry["file"]
            if (not asset.is_file() or
                sha256(asset.read_bytes()).hexdigest()!=entry["sha256"] or
                entry.get("allNodesWatertight") is not True or
                len(entry.get("perPartTriangles",{}))!=15):
                raise RuntimeError("P2.11 source GLB and mesh identities invalid: "+tier)
        status["independent_p211_rear_toe_static_cad"]=True
        gate("INDEPENDENT_P211_REAR_TOE_NATIVE_105_PAIR_STATIC","PASS")
        p212_dir=out/"p212-threaded-v2-source"
        if not p212_dir.is_dir():
            invoke(sys.executable,TOOLS/"p2_12_toe_adjuster.py",
                   "--out",p212_dir,timeout=600)
        p212_manifest=p212_dir/"P212_rear_toe_adjuster_manifest.json"
        if not p212_manifest.is_file():
            raise RuntimeError("P2.12 original toe adjuster manifest missing")
        p212=json.loads(p212_manifest.read_text(encoding="utf8"))
        a212=p212.get("nativeStaticAudit",{})
        ids212=p212.get("partIds",[])
        if (p212.get("schema")!="podium-eds.p2.cad-first.rear-toe-adjuster-threaded.v2"
            or p212.get("sourcePartCount")!=19 or p212.get("totalCadSolids")!=19
            or p212.get("newParts")!=5 or len(set(ids212))!=19
            or p212.get("replacedPriorPartId")!="P211_REAR_TOE_LINK_TUBULAR_FORGED"
            or "P211_REAR_TOE_LINK_TUBULAR_FORGED" in ids212
            or p212.get("outerThreadHand")!="RIGHT"
            or p212.get("innerThreadHand")!="LEFT"
            or p212.get("actualChassisToeHardpointMeasured") is not False
            or p212.get("fullFemaleThreadProfileModelled") is not True
            or p212.get("sleeveOppositeHandGroovesModelled") is not True
            or p212.get("bothLocknutFemaleGroovesModelled") is not True
            or p212.get("threadGeometryRevision")!="P2.12-R2-BREP-GROOVED"
            or p212.get("mechanicalThreadEngagementCertified") is not False
            or p212.get("toeAdjustmentTravelCertified") is not False
            or p212.get("mechanicalMateCertified") is not False
            or a212.get("pairCount")!=171 or a212.get("passStatic") is not True
            or a212.get("unresolvedCollisions") or a212.get("booleanErrors")):
            raise RuntimeError("P2.12 19-solid source static/honesty gate failed")
        if sha256((p212_dir/p212["masterSTEP"]).read_bytes()).hexdigest() != p212["masterSTEPsha256"]:
            raise RuntimeError("P2.12 source STEP SHA mismatch")
        for tier,entry in p212["profiles"].items():
            asset=p212_dir/entry["file"]
            if (not asset.is_file() or
                sha256(asset.read_bytes()).hexdigest()!=entry["sha256"] or
                entry.get("allNodesWatertight") is not True or
                len(entry.get("perPartTriangles",{}))!=19):
                raise RuntimeError("P2.12 original 19-mesh GLB digest failure: "+tier)
        status["independent_p212_toe_adjuster_static_cad"]=True
        gate("INDEPENDENT_P212_TOE_ADJUSTER_NATIVE_171_PAIR_STATIC","PASS")
        npm=shutil.which("npm")
        if npm is None:raise RuntimeError("Node/npm missing")
        if not a.skip_web_qa:
            invoke(npm,"run","lint",timeout=600)
            invoke(npm,"run","typecheck","--workspace=@peds/web",timeout=600)
            invoke(npm,"test","--workspace=@peds/web","--",
                   "src/dev/assemblyPreview/fourCornerLayout.test.ts",
                   "src/dev/assemblyPreview/cadPresentation.test.ts",
                   "src/dev/assemblyPreview/ownerMeasuredFit.test.ts",
                   "src/dev/assemblyPreview/showroomWheelMask.test.ts",
                   "src/dev/assemblyPreview/rearUprightSource.test.ts",
                   "src/dev/assemblyPreview/rearSuspensionSource.test.ts",
                   "src/dev/assemblyPreview/rearToeSource.test.ts",
                   "src/dev/assemblyPreview/rearToeAdjusterSource.test.ts",timeout=300)
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
               "--quality",a.quality,"--url",url,
               "--p29-dir",p29_dir,
               "--p210-dir",p210_dir,
               "--p211-dir",p211_dir,
               "--p212-dir",p212_dir,timeout=1100)
        detail=json.loads((out/"browser/four-wheel-browser-evidence.json")
                          .read_text(encoding="utf8"))
        if not detail.get("all_four_original_modelb_wheel_positions"):
            raise RuntimeError("Four distinct original Model B measured wheel positions not rendered")
        if not detail.get("real_p29_rear_upright_loaded"):
            raise RuntimeError("The STEP-derived P2.9 upright was not loaded on both rear wheel stations")
        if not detail.get("real_p210_rear_wishbone_loaded"):
            raise RuntimeError("P2.10 11-mesh rear wishbone source was not loaded on both rear stations")
        if not detail.get("real_p211_rear_toe_loaded"):
            raise RuntimeError("P2.11 15-mesh rear toe source was not loaded on both rear stations")
        if not detail.get("real_p212_toe_adjuster_loaded"):
            raise RuntimeError("P2.12 19-mesh rear toe adjuster was not parsed on both rear stations")
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
