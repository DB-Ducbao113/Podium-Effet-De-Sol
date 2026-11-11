#!/usr/bin/env python3
"""Source-pinned P2.28 rear51 + original P2.29 native seven -> rear56 GLB.

Only detached source CAD review; original Model B still not supplied. Run VTK
collision and two-way vertex containment on each newly affected source vs ten
unaltered P2.10 suspension meshes, not merely AABB pass. Keep the previous
46-body exact native B-Rep PASS as an independent input, not a fake 56 proof.
"""
from __future__ import annotations
import argparse,hashlib,json
from pathlib import Path
import numpy as np
import trimesh
from p2_26_mesh_surface_qa import mesh_pair_probe
from p2_29_caliper_upright_carrier import (
    UPRIGHT,CALIPER,CARRIER,CAL_BOLT,UPR_BOLT,REVIEW_SCHEMA,SCHEMA as NATIVE_SCHEMA,SOURCE_EXPECTED)

SCHEMA='peds.cad-first.p229-rear56-source-visual.v1'
OLD_SCHEMA='peds.cad-first.p228-rear51-reviewed-source-composite.v1'
NEUTRAL=(135,146,157,255)
LEVELS=('HIGH','BALANCED','PERFORMANCE')
REPLACED={UPRIGHT,CALIPER}
ADDED={CARRIER,*CAL_BOLT,*UPR_BOLT}
LATEST=REPLACED|ADDED

def digest(p:Path)->str:return hashlib.sha256(p.read_bytes()).hexdigest()

def load_scene(folder:Path,record:dict,names:set[str])->trimesh.Scene:
    file=folder/record['file']
    if not file.is_file() or digest(file)!=record['sha256']:
        raise ValueError('Original source GLB SHA mismatch '+str(file))
    scene=trimesh.load(file,force='scene')
    if set(scene.graph.nodes_geometry)!=names or len(scene.geometry)!=len(names):
        raise ValueError('Original source identity mismatch '+str(file))
    for node in names:
        transform,key=scene.graph[node]
        mesh=scene.geometry[key]
        if not np.isfinite(transform).all() or not np.isfinite(mesh.vertices).all():
            raise ValueError('Invalid native/source transform '+node)
        if not mesh.is_watertight or not mesh.is_winding_consistent:
            raise ValueError('Nonmanifold original source geometry '+node)
        if tuple(int(c) for c in mesh.visual.material.baseColorFactor)!=NEUTRAL:
            raise ValueError('Non-neutral original source material '+node)
    return scene

def world_mesh(scene:trimesh.Scene,node:str):
    transform,key=scene.graph[node]
    mesh=scene.geometry[key].copy()
    mesh.apply_transform(transform)
    return mesh

def make_review(previous_dir:Path,native_dir:Path,out:Path)->dict:
    if out.exists():raise FileExistsError('P2.29 cannot overwrite source evidence')
    old=json.loads((previous_dir/'P228_rear51_source_manifest.json').read_text())
    native=json.loads((native_dir/'P229_caliper_carrier_source_manifest.json').read_text())
    if old.get('schema')!=OLD_SCHEMA or old.get('partCount')!=51 or old.get('sameNeutralBaseColor')!='#87929d':
        raise ValueError('Unexpected original P2.28 rear51 source lineage')
    if native.get('schema')!=REVIEW_SCHEMA or native.get('revisedAndNewNativeBodies')!=7 or native.get('materialColor')!='#87929d':
        raise ValueError('Unexpected authentic P2.29 source lineage')
    if native.get('sourceGitBlobsVerified')!=SOURCE_EXPECTED:
        raise ValueError('Missing original P2.9/P2.17/P2.28 Git source authenticity')
    if native.get('source46NativeAudit',{}).get('schema')!=NATIVE_SCHEMA or not native.get('source46NativeAudit',{}).get('source46NativeStaticAudit',{}).get('passStatic'):
        raise ValueError('P2.29 original 46-solid native B-Rep gate did not PASS')
    step=native_dir/native['nativeSTEP']['file']
    if not step.is_file() or digest(step)!=native['nativeSTEP']['sha256']:
        raise ValueError('Source P2.29 native STEP SHA mismatch')
    original=set(old['partIds'])
    if len(original)!=51 or not REPLACED<=original or ADDED&original:
        raise ValueError('Original source IDs cannot be dropped/doubled')
    merged_ids=(original-REPLACED)|LATEST
    if len(merged_ids)!=56:
        raise ValueError('Expected exactly 56 source CAD mesh IDs')
    # Explicitly screen new and changed bodies vs original ten independent
    # P2.10 suspension nodes. All other rear40-vs-P210 pairs are unchanged,
    # previously VTK-screened at P2.26 for the older source revision.
    p210={n for n in original if n.startswith('P210_')}
    if len(p210)!=10:
        raise ValueError('Original ten P2.10 suspension parts must be present')
    scenes={};screens={}
    for tier in LEVELS:
        prev=load_scene(previous_dir,old['qualityProfiles'][tier],original)
        fresh=load_scene(native_dir,native['profiles'][tier],LATEST)
        hit=[];processed=[];separated=0
        for owner in sorted(LATEST):
            one=world_mesh(fresh,owner)
            for other in sorted(p210):
                two=world_mesh(prev,other)
                d=np.minimum(one.bounds[1],two.bounds[1])-np.maximum(one.bounds[0],two.bounds[0])
                if np.any(d<=1e-9):
                    separated+=1;continue
                check=mesh_pair_probe(one,two)
                processed.append({'newOrRevised':owner,'suspensionOriginal':other,**check})
                if check['potentialMeshInterference']:hit.append(processed[-1])
        if hit:
            raise ValueError('Confirmed P2.29 vs original P2.10 source mesh interference: '+str(hit[:5]))
        screens[tier]={'allSourceCrossPairs':len(LATEST)*len(p210),
            'aabbSeparated':separated,'vtkChecked':len(processed),
            'potentialMeshInterferences':len(hit),'checkedPairs':processed,
            'exactNativeBRepOfP210NotPerformed':True}
        scenes[tier]=(prev,fresh)
    out.mkdir(parents=True)
    profiles={}
    for tier,(prev,fresh) in scenes.items():
        scene=trimesh.Scene()
        for name in sorted(merged_ids):
            original_scene=fresh if name in LATEST else prev
            transform,key=original_scene.graph[name]
            scene.add_geometry(original_scene.geometry[key].copy(),node_name=name,geom_name=name,transform=transform)
        if set(scene.graph.nodes_geometry)!=merged_ids or len(scene.geometry)!=56:
            raise ValueError('Output source mesh identity incomplete')
        file=out/('P229_rear56_caliper_carrier_neutral_'+tier.lower()+'.glb')
        file.write_bytes(scene.export(file_type='glb'))
        reopened=trimesh.load(file,force='scene')
        if set(reopened.graph.nodes_geometry)!=merged_ids or len(reopened.geometry)!=56:
            raise ValueError('P2.29 mesh roundtrip identity invalid')
        if {tuple(int(x) for x in m.visual.material.baseColorFactor) for m in reopened.geometry.values()}!={NEUTRAL}:
            raise ValueError('P2.29 monochrome base color changed')
        profiles[tier]={'file':file.name,'sha256':digest(file),'bytes':file.stat().st_size,
            'meshCount':len(reopened.geometry),'triangles':sum(len(m.faces) for m in reopened.geometry.values())}
    if not profiles['HIGH']['triangles']>profiles['BALANCED']['triangles']>profiles['PERFORMANCE']['triangles']:
        raise ValueError('P2.29 source LOD triangle count invalid')
    report={'schema':SCHEMA,'status':'AUTHENTIC_P29_REAR56_MESH_SOURCE_REVIEW_G2_HOLD',
        'partCount':56,'nativeBRepAuditPartCount':46,
        'oldSourceP228ManifestSha256':digest(previous_dir/'P228_rear51_source_manifest.json'),
        'originalP229NativeStepSHA256':digest(step),
        'originalP29GitBlobSha1':SOURCE_EXPECTED['p2_9_rear_upright.py'],
        'replacedOriginalPartIds':sorted(REPLACED),'newOriginalCADPartIds':sorted(ADDED),
        'partIds':sorted(merged_ids),'uniformBaseColor':'#87929d',
        'sourceNewVersusP210MeshChecks':screens,'profiles':profiles,
        'modelBOriginalIncluded':False,'native56P210BRepCertified':False,
        'p224FullOriginal71SolidAuditCompleted':False,'mechanicalG2Certified':False}
    (out/'P229_rear56_source_manifest.json').write_text(json.dumps(report,indent=2)+'\n')
    return report

if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--previous-dir',type=Path,required=True)
    ap.add_argument('--native-dir',type=Path,required=True);ap.add_argument('--out',type=Path,required=True)
    args=ap.parse_args();print(json.dumps(make_review(args.previous_dir,args.native_dir,args.out),indent=2))
