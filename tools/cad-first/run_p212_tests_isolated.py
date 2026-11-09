#!/usr/bin/env python3
"""Run each P2.12 CadQuery/OCCT test in a separate native process.

OpenCascade mesh/Boolean caches grow across many complex solids when all
tests share a single Python interpreter. Isolated runs produce reliable
per-test PASS/FAIL evidence without masking timeouts or invoking GitHub Actions.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import subprocess
import sys
import time

HERE=Path(__file__).resolve().parent
CASES=(
  "test_five_new_solids_replace_not_duplicate_old_link",
  "test_real_rod_helix_and_separate_axial_sleeve_nuts",
  "test_helical_phase_is_geometry_not_shader",
  "test_limited_six_pose_thread_pair_motion",
  "test_static_171_pairs_and_collision_guard",
  "test_step_glb_roundtrip_hashes_and_mechanical_hold",
)
CLASS="test_p2_12_toe_adjuster.RearToeAdjusterCADTest."

def run(out:Path)->dict:
    out.parent.mkdir(parents=True,exist_ok=True)
    records=[]
    for case in CASES:
        argv=[sys.executable,"-m","unittest","-v",CLASS+case]
        t0=time.monotonic()
        try:
            p=subprocess.run(argv,cwd=HERE,text=True,
                             capture_output=True,timeout=135,check=False)
            record={"name":case,"returncode":p.returncode,
                    "elapsedSeconds":round(time.monotonic()-t0,3),
                    "stdout":p.stdout[-3000:],"stderr":p.stderr[-3000:],
                    "passed":p.returncode==0}
        except subprocess.TimeoutExpired as error:
            record={"name":case,"elapsedSeconds":round(time.monotonic()-t0,3),
                    "error":str(error),"passed":False}
        records.append(record)
        print(case,"PASS" if record["passed"] else "FAIL",flush=True)
        evidence={
          "schema":"podium-eds.p212.threaded-v2.isolated-native-qa.v1",
          "mode":"local-process-isolated-open-cascade",
          "passed":sum(x["passed"] for x in records),
          "total":len(CASES),
          "complete":len(records)==len(CASES) and all(x["passed"] for x in records),
          "tests":records,
          "mechanicalG2":"HOLD",
        }
        out.write_text(json.dumps(evidence,indent=2)+"\n",encoding="utf8")
        if not record["passed"]:
            raise RuntimeError("P2.12 native CAD QA failure: "+case)
    return evidence

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--out",type=Path,required=True)
    x=p.parse_args()
    evidence=run(x.out)
    print("P2.12 ISOLATED CAD QA",evidence["passed"],"/",evidence["total"],"PASS")
