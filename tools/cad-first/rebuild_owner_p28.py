#!/usr/bin/env python3
"""Rebuild the project's original P2.8 mechanical assembly from its own CAD.

Never generates a substitute full car or substitutes owner Model B geometry.
Runs source authoring stages in separate processes (OCC mesh-cache isolation).
Default is NO OVERWRITE: preserves completed, hash-matched owner source packs.
"""
import argparse
import json
from pathlib import Path
import subprocess
import sys

ROOT=Path(__file__).resolve().parents[2]
TOOLS=ROOT/"tools"/"cad-first"
def run(*args):
    cmd=[sys.executable,str(TOOLS/args[0]),*map(str,args[1:])]
    print("+"," ".join(cmd),flush=True)
    subprocess.run(cmd,check=True,cwd=ROOT)

def complete(folder):
    manifest=folder/"P28_remate_manifest.json"
    if not manifest.exists(): return False
    try:
        data=json.loads(manifest.read_text(encoding="utf-8"))
        if data.get("schema")!="podium-eds.p2.cad-first.full-corner.remate.v1":return False
        if len(data.get("partIds",[]))!=59 or len(set(data["partIds"]))!=59:return False
        if not data.get("allRoundtripValid"):return False
        for tier in ("HIGH","BALANCED","PERFORMANCE"):
            if tier not in data.get("profiles",{}):return False
            from hashlib import sha256
            item=data["profiles"][tier];path=folder/item["file"]
            if not path.is_file() or sha256(path.read_bytes()).hexdigest()!=item["sha256"]:return False
        from hashlib import sha256
        step=folder/data["masterSTEP"]
        return step.is_file() and sha256(step.read_bytes()).hexdigest()==data["masterSTEPsha256"]
    except (ValueError,KeyError,TypeError,IOError):return False

def rebuild(out:Path,replace=False):
    out=out.resolve()
    existing = out if complete(out) else out / 'p28'
    if complete(existing) and not replace:
        print("Existing owner P2.8 package verified; leaving it unchanged:",existing)
        return
    if out.exists() and any(out.iterdir()):
        raise SystemExit("Refusing to overwrite a non-empty owner CAD directory. Choose a NEW --out folder.")
    out.mkdir(parents=True,exist_ok=True)
    p26=out/"_p26";p27=out/"_p27";p28=out/"p28"
    for folder in (p26,p27,p28):folder.mkdir()
    run("p2_6_steering_relief.py","--out",p26,"--init")
    for tier in ("HIGH","BALANCED","PERFORMANCE"):
        run("p2_6_steering_relief.py","--out",p26,"--profile",tier)
    run("p2_6_steering_relief.py","--out",p26,"--finalize")
    run("p2_7_wishbone_cad.py","--out",p27)
    run("p2_8_upright_remate.py","--out",p28)
    run("p2_8_source_glb_composition.py","--p26",p26,"--p27",p27,"--out",p28)
    if not complete(p28):
        raise RuntimeError("Generated owner P2.8 file hash/part count preflight failed")
    print("P2.8 CAD source recreated and SHA checked:",p28)
    print("Mechanical fit to Model B: NOT YET VERIFIED.")

if __name__=="__main__":
    ap=argparse.ArgumentParser()
    ap.add_argument("--out",required=True,type=Path,help="New empty parent directory")
    args=ap.parse_args()
    rebuild(args.out)
