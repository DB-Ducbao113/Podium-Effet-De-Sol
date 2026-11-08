#!/usr/bin/env python3
"""Local-only provenance and mesh audit for Model B + original P2.8.
Does not place wheels, modify either source, or certify a mechanical mate.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import sys

def sha(path:Path)->str:
    d=hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda:stream.read(1024*1024),b''):d.update(chunk)
    return d.hexdigest()

def check(modelb:Path, p28dir:Path, quality:str)->dict:
    import trimesh
    manifest_path=p28dir/'P28_remate_manifest.json'
    if not modelb.is_file() or not manifest_path.is_file():
        raise ValueError('Local Model B asset and P2.8 owner manifest are both required')
    m=json.loads(manifest_path.read_text(encoding='utf8'))
    ids=m.get('partIds',[])
    if (m.get('schema')!='podium-eds.p2.cad-first.full-corner.remate.v1'
        or len(ids)!=59 or len(set(ids))!=59):
        raise ValueError('The selected manifest is not original P2.8 with 59 distinct source IDs')
    profile=m.get('profiles',{}).get(quality)
    if not profile:raise ValueError('P2.8 source GLB profile is missing: '+quality)
    glb=p28dir/profile['file']
    if not glb.is_file() or glb.stat().st_size!=profile['bytes'] or sha(glb)!=profile['sha256']:
        raise ValueError('P2.8 GLB missing, incorrect size or SHA-256 mismatch')
    step=p28dir/m.get('masterSTEP','')
    if not step.is_file() or sha(step)!=m.get('masterSTEPsha256'):
        raise ValueError('P2.8 editable STEP source not found or SHA-256 mismatch')
    external=trimesh.load(modelb,force='scene')
    internal=trimesh.load(glb,force='scene')
    found=set(internal.graph.nodes_geometry)
    if found!=set(ids):raise ValueError(f'P2.8 GLB part ID mismatch: missing={sorted(set(ids)-found)} extra={sorted(found-set(ids))}')
    if len(internal.graph.nodes_geometry)!=59:raise ValueError('P2.8 preview must contain 59 geometry nodes')
    if not m.get('allRoundtripValid'):raise ValueError('P2.8 source manifest did not pass STEP round-trip')
    # Read source again instead of relying only on a past manifest result.
    import cadquery as cq
    solids=cq.importers.importStep(str(step)).solids().vals()
    if len(solids)!=59 or any(not s.isValid() for s in solids):
        raise ValueError('P2.8 STEP readback does not contain 59 valid solids')
    return {
        'status':'SOURCE_FILES_VERIFIED_PLACEMENT_UNVERIFIED',
        'model_b':{'file':modelb.name,'bytes':modelb.stat().st_size,'sha256':sha(modelb),
                   'mesh_nodes':len(external.graph.nodes_geometry),'bounds_m':external.bounds.tolist()},
        'p28':{'file':glb.name,'sha256':sha(glb),'part_count':59,
                'step_sha256':sha(step),'valid_step_solids':len(solids),
                'bounds_m':internal.bounds.tolist(),'quality':quality,
                'source_nodes':ids},
        'scale_factor':1.0,
        'coordinate_mapping_verified':False,
        'hardpoint_mates_verified':False,
        'source_step_to_shell_interference_tested':False,
        'owner_signoff':'HOLD',
        'note':'Axis origins/handedness may differ. Bounding boxes never establish a mechanical mate.'
    }

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--modelb',type=Path,default=Path('apps/web/public/models/model-b-eds-optimized-v1.glb'))
    p.add_argument('--p28-dir',required=True,type=Path)
    p.add_argument('--quality',choices=['HIGH','BALANCED','PERFORMANCE'],default='BALANCED')
    p.add_argument('--out',type=Path,default=Path('modelb-p28-preflight.json'))
    a=p.parse_args()
    try:
        report=check(a.modelb,a.p28_dir,a.quality)
        a.out.write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
        print('SOURCE VERIFIED, MECHANICAL MATE HOLD:',a.out)
    except (ValueError,KeyError,FileNotFoundError) as e:
        print('SOURCE PREFLIGHT FAIL:',str(e),file=sys.stderr)
        sys.exit(1)
if __name__=='__main__':main()
