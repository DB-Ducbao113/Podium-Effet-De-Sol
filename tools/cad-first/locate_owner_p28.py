#!/usr/bin/env python3
"""Locate previously authored P2.8 owner files without replacing or publishing them.

Search bounded project asset roots first. Optionally restore a verified owner ZIP
into an EMPTY private folder, preventing path traversal and oversized extraction.
Does not build substitute models or claim that a matching file is manufacturer CAD.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import os
import zipfile
import sys

MANIFEST="P28_remate_manifest.json"
REQUIRED_SCHEMA="podium-eds.p2.cad-first.full-corner.remate.v1"
GLOBS=("PODIUM_EDS_P2_8*REVIEW*.zip","*P28*SOURCE*.zip","*P28*REMATE*.zip")

def valid_candidate(path):
    m=path/MANIFEST
    if not m.is_file():return False
    try:
        j=json.loads(m.read_text(encoding="utf8"))
        if j.get("schema")!=REQUIRED_SCHEMA or len(j.get("partIds",[]))!=59:
            return False
        if len(set(j["partIds"]))!=59:return False
        if not (path/j.get("masterSTEP","")).is_file():return False
        return all((path/row["file"]).is_file() for row in j.get("profiles",{}).values()) and all(
            k in j.get("profiles",{}) for k in ("HIGH","BALANCED","PERFORMANCE"))
    except (OSError,ValueError,KeyError,TypeError):return False

def candidates(roots,max_depth=6):
    visited=set()
    for root in roots:
        root=Path(root)
        if not root.exists():continue
        if root.is_file():root=root.parent
        for directory,subdirs,files in os.walk(root):
            d=Path(directory)
            try:depth=len(d.relative_to(root).parts)
            except ValueError:continue
            if depth>=max_depth:subdirs[:]=[]
            subdirs[:]=[n for n in subdirs if n not in {
                "node_modules",".git",".venv",".venv-cad","dist","build",".next","__pycache__"}]
            if str(d) in visited:continue
            visited.add(str(d))
            if MANIFEST in files and valid_candidate(d):
                yield d

def archive_candidates(roots,max_depth=5):
    for root in roots:
        root=Path(root)
        if not root.is_dir():continue
        for directory,subdirs,files in os.walk(root):
            d=Path(directory)
            try:depth=len(d.relative_to(root).parts)
            except ValueError:continue
            if depth>=max_depth:subdirs[:]=[]
            subdirs[:]=[n for n in subdirs if n not in {
                "node_modules",".git",".venv",".venv-cad","dist","build",".next","__pycache__"}]
            for name in files:
                if name.lower().endswith(".zip") and ("p2_8" in name.lower() or "p28" in name.lower()):
                    yield d/name

def safe_extract(archive,target,max_bytes=1200*1024*1024):
    if target.exists() and any(target.iterdir()):
        raise ValueError("Extraction target must be empty; owner files will never be overwritten")
    with zipfile.ZipFile(archive) as z:
        entries=z.infolist()
        total=sum(x.file_size for x in entries)
        if total>max_bytes:raise ValueError("Oversized owner archive")
        base=target.resolve()
        for f in entries:
            dst=(base/f.filename).resolve()
            if not dst.is_relative_to(base) or f.filename.startswith(("/", "\\")):
                raise ValueError("Unsafe path in archive")
            if f.file_size>max_bytes:raise ValueError("Oversized member")
        target.mkdir(parents=True,exist_ok=True)
        z.extractall(target)

def owner_roots(repo):
    roots=[repo/".local-assets",repo/"scratch",repo/"docs",repo.parent]
    if os.name=="nt":
        roots.extend([Path(r"E:\Formula 1\archives"),Path(r"E:\Formula 1\Podium-Effet-De-Sol")])
    return list(dict.fromkeys(str(x.resolve()) for x in roots if x.exists()))

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--repo",type=Path,default=Path(__file__).resolve().parents[2])
    p.add_argument("--restore-to",type=Path)
    p.add_argument("--report",type=Path)
    a=p.parse_args()
    roots=owner_roots(a.repo.resolve())
    found=list(candidates(roots))
    restored=None
    if not found and a.restore_to:
        for archive in archive_candidates(roots):
            try:
                safe_extract(archive,a.restore_to)
                found=list(candidates([a.restore_to]))
                if found:
                    restored=str(archive);break
                # Extraction did not create an accepted package; do not delete it,
                # and do not overwrite it with another archive.
                break
            except (OSError,ValueError,zipfile.BadZipFile) as e:
                print("Archive rejected:",archive,e,file=sys.stderr)
                if a.restore_to.exists():break
    result={"source_dir":str(found[0]) if found else None,
            "source_origin_archive":restored,
            "verified_sha256":False,
            "verified_native_brep":False,
            "status":"CANDIDATE_FOUND_NEEDS_PREFLIGHT" if found else "ORIGINAL_SOURCE_NOT_FOUND"}
    print(json.dumps(result,indent=2))
    if a.report:
        a.report.parent.mkdir(parents=True,exist_ok=True)
        a.report.write_text(json.dumps(result,indent=2)+"\n")
    raise SystemExit(0 if found else 2)

if __name__=="__main__":main()
