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
        invoke(sys.executable,TOOLS/"run_p212_tests_isolated.py",
               "--out",out/"p212-isolated-native-qa.json",timeout=750)
        invoke(sys.executable,TOOLS/"test_p2_12_joint_closure_gate.py",timeout=45)
        invoke(sys.executable,TOOLS/"test_p2_12_constrained_kinematics.py",timeout=60)
        invoke(sys.executable,TOOLS/"test_p2_13_rear_joint_prototype.py",timeout=120)
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
        p212_dir=out/"p212-threaded-v3-source"
        if not p212_dir.is_dir():
            invoke(sys.executable,TOOLS/"p2_12_toe_adjuster.py",
                   "--out",p212_dir,timeout=600)
        p212_manifest=p212_dir/"P212_rear_toe_adjuster_manifest.json"
        if not p212_manifest.is_file():
            raise RuntimeError("P2.12 original toe adjuster manifest missing")
        p212=json.loads(p212_manifest.read_text(encoding="utf8"))
        a212=p212.get("nativeStaticAudit",{})
        ids212=p212.get("partIds",[])
        if (p212.get("schema")!="podium-eds.p2.cad-first.rear-toe-adjuster-threaded.v3"
            or p212.get("sourcePartCount")!=19 or p212.get("totalCadSolids")!=19
            or p212.get("newParts")!=5 or len(set(ids212))!=19
            or p212.get("replacedPriorPartId")!="P211_REAR_TOE_LINK_TUBULAR_FORGED"
            or "P211_REAR_TOE_LINK_TUBULAR_FORGED" in ids212
            or p212.get("outerThreadHand")!="RIGHT"
            or p212.get("innerThreadHand")!="LEFT"
            or p212.get("actualChassisToeHardpointMeasured") is not False
            or p212.get("fullFemaleThreadProfileModelled") is not True
            or p212.get("threadRunoutsModelled") is not True
            or p212.get("threadRunoutRadiusMm")!=10.12
            or p212.get("threadedRodSpanMm")!=24
            or p212.get("threadGeometryRevision")!="P2.12-R3-BREP-LOCKNUT-ENGAGEMENT"
            or p212.get("nominalNutBodyAxialRangesMm")!=[[47.5,53.5],[114.5,120.5]]
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
        sweep_path=out/"p212-thread-pair-sweep.json"
        if not sweep_path.is_file():
            invoke(sys.executable,TOOLS/"p2_12_thread_sweep.py",
                   "--out",sweep_path,timeout=240)
        sweep=json.loads(sweep_path.read_text(encoding="utf8"))
        source_sha=sha256((TOOLS/"p2_12_toe_adjuster.py").read_bytes()).hexdigest()
        if (sweep.get("cadSourceSchema")!="podium-eds.p2.cad-first.rear-toe-adjuster-threaded.v3"
            or sweep.get("cadSourceSha256")!=source_sha
            or sweep.get("complete") is not True
            or sweep.get("minimumLocknutGapMm",0)<2.0
            or sweep.get("sampleCount")!=6
            or sweep.get("anglesDeg")!=[-90,0,90]
            or sweep.get("threadPairsPassLimitedSweep") is not True
            or sweep.get("maximumPositiveOverlapMm3",1)>.05
            or sweep.get("chassisToeKinematicsCertified") is not False):
            raise RuntimeError("P2.12 isolated ±90-degree thread pair sweep is not verified")
        status["p212_limited_thread_pair_sweep"]=True
        gate("P212_THREAD_PAIR_SIX_POSES_NO_BREP_CLASH","PASS")
        phase_path=out/"p212-helical-phase-occupancy.json"
        if not phase_path.is_file():
            invoke(sys.executable,TOOLS/"p2_12_phase_contact_audit.py",
                   "--out",phase_path,timeout=360)
        phase=json.loads(phase_path.read_text(encoding="utf8"))
        samples=phase.get("samples",[])
        matched=[row for row in samples if row.get("deliberatelyMisphased") is False]
        negative=[row for row in samples if row.get("deliberatelyMisphased") is True]
        expected={(angle,side,False,"sleeve") for angle in (-90,0,90)
                  for side in ("outer","inner")}
        expected.update((0,side,True,"sleeve") for side in ("outer","inner"))
        expected.update((0,side,False,"locknut") for side in ("outer","inner"))
        expected.update((0,side,True,"locknut") for side in ("outer","inner"))
        observed={(row.get("angleDeg"),row.get("rod"),
                   row.get("deliberatelyMisphased"),row.get("contactTarget"))
                  for row in samples}
        if (phase.get("schema")!="podium-eds.p212.threaded-v3.phase-occupancy.v2"
            or phase.get("cadSourceSha256")!=source_sha
            or phase.get("complete") is not True
            or phase.get("mechanicalG2")!="HOLD"
            or phase.get("sampleCount")!=12
            or phase.get("matchedPhaseCases")!=8
            or phase.get("negativeControlCases")!=4
            or phase.get("sleeveMatchedCases")!=6
            or phase.get("sleeveNegativeCases")!=2
            or phase.get("locknutMatchedCases")!=2
            or phase.get("locknutNegativeCases")!=2
            or phase.get("surfaceSamplesPerCase")!=30
            or phase.get("matchingPhaseZeroIntrusions") is not True
            or phase.get("halfPitchNegativeControlsDetectIntrusion") is not True
            or phase.get("mechanicalLoadCapacityCertified") is not False
            or phase.get("continuousMotionCertified") is not False
            or len(samples)!=12 or len(matched)!=8 or len(negative)!=4
            or observed!=expected
            or any(row.get("valid") is not True or
                   row.get("sourceCrestSamples")!=30 or
                   row.get("crestSamplesInsideFemale")!=0 for row in matched)
            or any(row.get("valid") is not True or
                   row.get("sourceCrestSamples")!=30 or
                   row.get("crestSamplesInsideFemale",0)<20 for row in negative)):
            raise RuntimeError("P2.12 OCC Boolean false-negative guard: independent "
                               "helical sleeve/locknut surface phase QA did not pass")
        status["p212_independent_phase_negative_control"]=True
        gate("P212_OCC_FALSE_NEGATIVE_PHASE_SURFACE_GUARD","PASS")
        five_path=out/"p212-five-body-pose-audit.json"
        if not five_path.is_file():
            invoke(sys.executable,TOOLS/"p2_12_five_body_pose_audit.py",
                   "--out",five_path,timeout=240)
        five=json.loads(five_path.read_text(encoding="utf8"))
        five_rows=five.get("poses",[])
        if (five.get("schema")!="podium-eds.p212.five-body-pose-audit.v1"
            or five.get("cadSourceSha256")!=source_sha
            or five.get("complete") is not True
            or five.get("sampleCount")!=3
            or five.get("anglesDeg")!=[-90,0,90]
            or five.get("pairChecks")!=30
            or five.get("booleanOnlyAudit") is not True
            or five.get("independentPhaseOccupancyQARequired") is not True
            or five.get("fullNineteenBodyKinematicsCertified") is not False
            or five.get("continuousCollisionClearanceCertified") is not False
            or five.get("physicalRearChassisMatingCertified") is not False
            or five.get("mechanicalG2")!="HOLD"
            or len(five_rows)!=3
            or {r.get("sleeveAngleDeg") for r in five_rows}!={-90,0,90}
            or any(r.get("nativePairCount")!=10 or
                   r.get("aabbExcluded",0)+r.get("nativeBrepPairsEvaluated",0)!=10
                   or r.get("recordedBrepPositiveOverlaps")!=0
                   or r.get("booleanErrors")!=0
                   or r.get("booleanOnlyPassed") is not True
                   for r in five_rows)):
            raise RuntimeError("P2.12 independent free-adjuster five-body motion "
                               "source audit incomplete; G2 HOLD")
        status["p212_five_body_free_pose_audit"]=True
        gate("P212_FIVE_BODY_THREE_STATIC_POSES_BREP_ONLY","PASS")
        closure_path=out/"p212-fixed-bearing-joint-closure.json"
        if not closure_path.is_file():
            invoke(sys.executable,TOOLS/"p2_12_joint_closure_gate.py",
                   "--out",closure_path,timeout=45)
        closure=json.loads(closure_path.read_text(encoding="utf8"))
        closure_rows=closure.get("samples",[])
        if (closure.get("schema")!="podium-eds.p212.v3.joint-closure-blocker.v1"
            or closure.get("cadSourceSha256")!=source_sha
            or closure.get("sampleCount")!=7
            or closure.get("anglesDeg")!=[-180,-90,-45,0,45,90,180]
            or closure.get("nominalRadialGapMm")!=.4
            or closure.get("staticCenterClosurePass") is not True
            or closure.get("adjustedRigidFixedBearingClosurePass") is not False
            or closure.get("freeThreadMotionCanBeAcceptedAsVehicleToeMotion") is not False
            or closure.get("fullNineteenBodyKinematicsCertified") is not False
            or closure.get("sourceJointCoordinatesAreProposalsNotMeasuredChassis") is not True
            or closure.get("mechanicalG2")!="HOLD"
            or len(closure_rows)!=7
            or not all(row.get("twoPinnedEyeCentersCloseWithinReviewThreshold") is (row.get("sleeveAngleDeg")==0) for row in closure_rows)
            or any(abs(row.get("outerEyeErrorFromFixedBearingMm",-1)-abs(row.get("sleeveAngleDeg",0))/180)>1e-6 for row in closure_rows)
            or any(abs(row.get("innerEyeErrorFromFixedBearingMm",-1)-abs(row.get("sleeveAngleDeg",0))/180)>1e-6 for row in closure_rows)):
            raise RuntimeError("P2.12 fixed-joint source kinematics mismatch was hidden; G2 HOLD")
        status["p212_unverified_chassis_joint_closure"]=True
        gate("P212_FIXED_BEARING_KINEMATIC_NONCLOSURE_IDENTIFIED","PASS")
        full_path=out/"p212-19-body-pose-closure.json"
        if not full_path.is_file():
            invoke(sys.executable,TOOLS/"p2_12_19_body_motion_audit.py",
                   "--out",full_path,"--per-case-timeout","110",timeout=430)
        full=json.loads(full_path.read_text(encoding="utf8"))
        full_rows=full.get("cases",[])
        if (full.get("schema")!="podium-eds.p212.v3.all-19-pose-closure.v1"
            or full.get("sourceSha256")!=source_sha
            or full.get("complete") is not True
            or full.get("sampleCount")!=3
            or full.get("anglesDeg")!=[-90,0,90]
            or full.get("pairClassifications")!=513
            or full.get("nominalPinnedEyeClosureWithin0p01mm") is not True
            or full.get("adjustedPinnedEyeClosureWithin0p01mm") is not False
            or full.get("independentThreadSurfaceOccupancyRequired") is not True
            or full.get("continuousKinematicsCertified") is not False
            or full.get("actualChassisHardpointsVerified") is not False
            or full.get("mechanicalG2")!="HOLD"
            or len(full_rows)!=3
            or {row.get("sleeveAngleDeg") for row in full_rows}!={-90,0,90}
            or any(row.get("pairCount")!=171
                   or row.get("aabbExcluded",0)+row.get("nativeBrepPairsEvaluated",0)!=171
                   or row.get("recordedNativePositiveOverlaps")!=[]
                   or row.get("nativeBooleanExceptions")!=[]
                   or row.get("booleanStaticReviewOnly") is not True
                   or row.get("knownHelicalBooleanFalseNegatives") is not True
                   or row.get("vehicleKinematicsCertified") is not False
                   or row.get("pinnedEyeClosureWithin0p01mm") is (row.get("sleeveAngleDeg")!=0)
                   for row in full_rows)):
            raise RuntimeError("P2.12 19-body source pose/closure audit incomplete; G2 HOLD")
        status["p212_full_19_body_free_pose_boolean_review"]=True
        gate("P212_ALL_19_BODY_THREE_POSES_BOOLEAN_ONLY_AND_G2_HOLD","PASS")
        six_dof_path=out/"p212-constrained-6dof-kinematics.json"
        if not six_dof_path.is_file():
            invoke(sys.executable,TOOLS/"p2_12_constrained_kinematics.py",
                   "--out",six_dof_path,timeout=60)
        solution=json.loads(six_dof_path.read_text(encoding="utf8"))
        solution_rows=solution.get("samples",[])
        source_files=['p2_9_rear_upright.py','p2_10_rear_wishbone.py',
                      'p2_11_rear_toe_link.py','p2_12_toe_adjuster.py']
        expected_source_hashes={
          name:sha256((TOOLS/name).read_bytes()).hexdigest() for name in source_files
        }
        expected_angles=[-180,-90,-45,0,45,90,180]
        if (solution.get("schema")!="podium-eds.p212.v3.constrained-six-dof-ideal-joints.v1"
            or solution.get("cadSourceSha256")!=source_sha
            or solution.get("inputCadSourceSha256")!=expected_source_hashes
            or solution.get("cadSourceSchema")!="podium-eds.p2.cad-first.rear-toe-adjuster-threaded.v3"
            or solution.get("complete") is not True
            or solution.get("sampleCount")!=7
            or solution.get("anglesDeg")!=expected_angles
            or solution.get("maximumConstraintResidualMm",1)>.001
            or solution.get("maximumBoreAxisMismatchDeg",0)<1.0
            or solution.get("provisionalHardpointsOnly") is not True
            or solution.get("sphericalJointCADNotVerified") is not True
            or solution.get("fullNativeBrepDynamicCollisionNotRun") is not True
            or solution.get("vehicleKinematicsCertified") is not False
            or solution.get("mechanicalG2")!="HOLD"
            or len(solution_rows)!=7
            or [row.get("sleeveTurnDeg") for row in solution_rows]!=expected_angles
            or any(row.get("maximumIdealLinkageConstraintResidualMm",1)>.001
                   or len(row.get("idealWishboneHingeSolutions",[]))!=2
                   or row.get("sourceChassisHardpointsMeasured") is not False
                   or row.get("nativeBallJointArticulationValidated") is not False
                   or row.get("realVehicleKinematicsCertified") is not False
                   or row.get("mechanicalG2")!="HOLD"
                   or abs(row.get("toeLengthChangeMm",-100)-row.get("sleeveTurnDeg",0)/90)>.000001
                   or any(arm.get("rigidArmOuterPivotClosureResidualMm",1)>.001
                          or arm.get("actualSphericalBearingArticulationCertified") is not False
                          for arm in row.get("idealWishboneHingeSolutions",[]))
                   for row in solution_rows)):
            raise RuntimeError("P2.12 ideal-joint 6DOF source closure report is incomplete; G2 HOLD")
        status["p212_ideal_6dof_constrained_kinematics"]=True
        gate("P212_PROVISIONAL_6DOF_WISHBONE_AND_TOE_JOINT_CENTRE_SOLVER","PASS")
        p213_dir=out/"p213-four-spherical-joint-cad-prototypes"
        if not p213_dir.is_dir():
            invoke(sys.executable,TOOLS/"p2_13_rear_joint_prototype.py",
                   "--out",p213_dir,timeout=180)
        p213_file=p213_dir/"P213_joint_articulation_manifest.json"
        if not p213_file.is_file():
            raise RuntimeError("Missing P2.13 native bearing concept evidence")
        p213=json.loads(p213_file.read_text(encoding="utf8"))
        p213_source_names=['p2_9_rear_upright.py','p2_10_rear_wishbone.py',
                           'p2_11_rear_toe_link.py','p2_12_toe_adjuster.py',
                           'p2_12_constrained_kinematics.py']
        p213_hashes={name:sha256((TOOLS/name).read_bytes()).hexdigest()
                     for name in p213_source_names}
        expected_joint_stations={'UPPER','LOWER','TOE_OUTER','TOE_INNER'}
        positions=p213.get("poseReviews",[])
        measured_pairs=[pair for pose in positions for pair in pose.get("cases",[])]
        if (p213.get("schema")!="podium-eds.p213.source-spherical-joint-articulation.v1"
            or p213.get("sourceCadFileSha256")!=p213_hashes
            or p213.get("newCadSolids")!=8
            or p213.get("replacedOldCadSolids")!=4
            or p213.get("candidateCombinedCadSolids")!=23
            or p213.get("stepRoundtripSolids")!=8
            or p213.get("poseCount")!=7
            or p213.get("anglesDeg")!=[-180,-90,-45,0,45,90,180]
            or len(set(p213.get("newCadPartIds",[])))!=8
            or set(p213.get("replaceAnnularProxies",{}))!=expected_joint_stations
            or p213.get("sphericalBallRetainedCertified") is not False
            or p213.get("actualSphericalArticulationCertified") is not False
            or p213.get("chassisHardpointsMeasured") is not False
            or p213.get("wholeCarClearanceCertified") is not False
            or p213.get("continuousSweptCollisionCertified") is not False
            or p213.get("mechanicalG2")!="HOLD"
            or len(positions)!=7
            or len(measured_pairs)!=28
            or any(set(pair.get("station") for pair in pose.get("cases",[]))
                   !=expected_joint_stations for pose in positions)
            or any(pair.get("nativeOverlapMm3",1)>.02
                   or pair.get("radialSeatGapMm")!=p213.get("nominalSphericalRadialGapMm")
                   or pair.get("realMechanicalJointCertified") is not False
                   for pair in measured_pairs)):
            raise RuntimeError("P2.13 native race/ball proposal QA failed, or G2 falsely certified")
        p213_step=p213_dir/p213["masterSTEP"]
        if (not p213_step.is_file() or
            sha256(p213_step.read_bytes()).hexdigest()!=p213["masterSTEPsha256"]):
            raise RuntimeError("P2.13 native STEP source SHA mismatch")
        for tier in ("HIGH","BALANCED","PERFORMANCE"):
            entry=p213.get("profiles",{}).get(tier,{})
            file=p213_dir/entry.get("file","")
            if (not file.is_file() or
                sha256(file.read_bytes()).hexdigest()!=entry.get("sha256")
                or entry.get("meshCount")!=8 or
                entry.get("allWatertight") is not True):
                raise RuntimeError("P2.13 native GLB LOD provenance failure: "+tier)
        status["p213_spherical_bearing_candidate_native_cad"]=True
        gate("P213_FOUR_NATIVE_SPHERICAL_JOINTS_28_POSE_PAIRS_G2_HOLD","PASS")
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
