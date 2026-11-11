#!/usr/bin/env python3
"""P2.28: source-hash pinned rear51 review after actual native shaft/hub repair.

Replaces only two named P2.25 source meshes from validated P2.28 STEP/GLBs.
Runs VTK triangle/containment inspection for the two modified components
versus 11 original P2.19 suspension meshes. No 71-solid or original Model B
claim; actual B-Rep 40-solid static test is checked in the P2.28 manifest.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
import trimesh

from p2_26_mesh_surface_qa import mesh_pair_probe
from p2_28_halfshaft_hub_connection import HUB,SHAFT,SCHEMA as NATIVE_SCHEMA

SCHEMA='peds.cad-first.p228-rear51-reviewed-source-composite.v1'
P225_MANIFEST_SHA='3278b28e5a00c7a0ff69f05c4d5db2935802025756fdeeed3601155e377fc2d7'
NEUTRAL=(135,146,157,255)
TIERS=('HIGH','BALANCED','PERFORMANCE')
REPLACED={HUB,SHAFT}


def sha(path:Path)->str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def verified_scene(folder:Path,info:dict,expected:set[str])->trimesh.Scene:
    file=folder/info['file']
    if not file.is_file() or sha(file)!=info['sha256']:
        raise ValueError('SHA-256 verified source GLB differs: '+str(file))
    scene=trimesh.load(file,force='scene')
    if set(scene.graph.nodes_geometry)!=expected or len(scene.geometry)!=len(expected):
        raise ValueError('Source GLB part identity mismatch')
    for node in scene.graph.nodes_geometry:
        tf,gkey=scene.graph[node];geom=scene.geometry[gkey]
        if not np.isfinite(tf).all() or not np.isfinite(geom.vertices).all() or \
           not geom.is_watertight or not geom.is_winding_consistent:
            raise ValueError('Source GLB contains invalid geometry: '+node)
        if tuple(int(c) for c in geom.visual.material.baseColorFactor)!=NEUTRAL:
            raise ValueError('CAD base RGB drift at '+node)
    return scene


def worldmesh(scene:trimesh.Scene,node:str)->trimesh.Trimesh:
    matrix,key=scene.graph[node]
    geom=scene.geometry[key].copy()
    geom.apply_transform(matrix)
    return geom


def review(p225_dir:Path,p228_dir:Path,out:Path)->dict:
    if out.exists():raise FileExistsError('Cannot overwrite original review or evidence')
    oldpath=p225_dir/'P225_rear51_source_manifest.json'
    if not oldpath.is_file() or sha(oldpath)!=P225_MANIFEST_SHA:
        raise ValueError('P2.25 source manifest does not match owner handoff')
    old=json.loads(oldpath.read_text())
    new=json.loads((p228_dir/'P228_halfshaft_hub_manifest.json').read_text())
    if old.get('partCount')!=51 or old.get('uniformBaseColor')!='#87929d' or \
       new.get('schema')!=NATIVE_SCHEMA or new.get('nativePartCount')!=2 or \
       new.get('sharedColor')!='#87929d' or not new.get('audit',{}).get('nativeStaticAudit',{}).get('passStatic'):
        raise ValueError('P2.25 or P2.28 authentic native source static proof missing')
    step=p228_dir/new['sourceSTEP']
    if not step.is_file() or sha(step)!=new['sourceSTEPsha256']:
        raise ValueError('P2.28 native STEP SHA-256 differs')
    original=set(old['partIds'])
    suspend=set(old['sourceOwnership']['retainedSuspensionPartIds'])
    wheel=set(old['sourceOwnership']['latestRearPartIds'])
    if len(original)!=51 or len(suspend)!=11 or len(wheel)!=40 or \
       suspend|wheel!=original or not REPLACED<=wheel:
        raise ValueError('Source part ownership does not match 11 + 40 original')
    all_sources={}
    qa={}
    # Check 3 source GLBs and native-only new mesh contacts before any writing.
    for quality in TIERS:
        previous=verified_scene(p225_dir,old['profiles'][quality],original)
        revised=verified_scene(p228_dir,new['profiles'][quality],REPLACED)
        checks=[]
        for name in sorted(REPLACED):
            changed=worldmesh(revised,name)
            for arm in sorted(suspend):
                attached=worldmesh(previous,arm)
                delta=np.minimum(changed.bounds[1],attached.bounds[1])-np.maximum(changed.bounds[0],attached.bounds[0])
                if np.any(delta<=1e-9):continue
                observed=mesh_pair_probe(changed,attached)
                checks.append({'newSourcePart':name,'suspensionSourcePart':arm,**observed})
        if any(pair['potentialMeshInterference'] for pair in checks):
            raise ValueError('P2.28 modified native part intersects original suspension mesh: '+str(checks))
        all_sources[quality]=(previous,revised)
        qa[quality]={'candidatePairs':22,'aabbCandidatePairs':len(checks),
                     'aabbExcludedPairs':22-len(checks),'surfaceAndContainmentHits':0,
                     'actualNativeBRepCrossCheckPerformed':False,'records':checks}
    out.mkdir(parents=True)
    outputs={}
    for quality,(previous,revised) in all_sources.items():
        scene=trimesh.Scene()
        for node in previous.graph.nodes_geometry:
            source=revised if node in REPLACED else previous
            tf,geom=source.graph[node]
            scene.add_geometry(source.geometry[geom].copy(),node_name=node,geom_name=node,transform=tf)
        if set(scene.graph.nodes_geometry)!=original or len(scene.geometry)!=51:
            raise ValueError('P2.28 review dropped/duplicated a source part')
        file=out/('P228_rear51_halfshaft_hub_neutral_'+quality.lower()+'.glb')
        file.write_bytes(scene.export(file_type='glb'))
        reread=trimesh.load(file,force='scene')
        if set(reread.graph.nodes_geometry)!=original or len(reread.geometry)!=51:
            raise ValueError('P2.28 output GLB identity roundtrip failed')
        if {tuple(int(c) for c in g.visual.material.baseColorFactor) for g in reread.geometry.values()}!={NEUTRAL}:
            raise ValueError('P2.28 unified grey base color lost')
        outputs[quality]={'file':file.name,'sha256':sha(file),'bytes':file.stat().st_size,
                          'meshNodes':len(reread.graph.nodes_geometry),
                          'triangles':sum(len(m.faces) for m in reread.geometry.values())}
    if not outputs['HIGH']['triangles']>outputs['BALANCED']['triangles']>outputs['PERFORMANCE']['triangles']:
        raise ValueError('P2.28 review did not have descending LOD triangles')
    report={'schema':SCHEMA,'status':'P228_REAL_REAR51_SOURCE_VISUAL_ONLY_G2_HOLD',
            'sourceP225ManifestSHA256':sha(oldpath),'sourceP228NativeSTEPhash':sha(step),
            'partCount':51,'replacedPartIds':sorted(REPLACED),'partIds':sorted(original),
            'sameNeutralBaseColor':'#87929d','modifiedPartVsSuspensionMeshAudit':qa,
            'qualityProfiles':outputs,
            'p224Original71BRepGatePassed':False,'native51BodyBRepGatePassed':False,
            'vehicleOriginalModelBIncluded':False,'mechanicalG2Certified':False}
    (out/'P228_rear51_source_manifest.json').write_text(json.dumps(report,indent=2)+'\n')
    return report


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--p225-dir',required=True,type=Path)
    parser.add_argument('--p228-dir',required=True,type=Path)
    parser.add_argument('--out',required=True,type=Path)
    a=parser.parse_args()
    print(json.dumps(review(a.p225_dir,a.p228_dir,a.out),indent=2))
