#!/usr/bin/env python3
"""P2.25: strict, source-authenticated rear51 *mesh* composition, G2 HOLD.

Combines SHA-verified P2.19 43 GLB (11 independent suspension meshes)
with SHA-verified latest P2.23 40 GLB wheel/brake/spindle. Exact names,
transform matrices and neutral material are retained. AABB only identifies
potential clashes. It NEVER proves collision-free B-Reps or owner Model B fit.
No original source files are changed; outputs refuse overwrite.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
import trimesh

SCHEMA='peds.cad-first.p225-source-pinned-rear51-mesh-review.v1'
OLD_SCHEMA='peds.cad-first.p219-43-body-source-review.v1'
NEW_SCHEMA='peds.cad-first.p223-40body-source-preview.v1'
NEUTRAL='#87929d'
RGBA=(135,146,157,255)
LEVELS=('HIGH','BALANCED','PERFORMANCE')
SUSP_PREFIX=('P29_','P210_')
EXPECTED_REVISIONS={
 'P216_REAR_BRAKE_DISC_VENTED', 'P216_REAR_HUB_STUB',
 'P217_REAR_BEARING_DUST_SEAL', 'P217_REAR_ROTOR_HAT_SPACER',
 'P218_REAR_MALE_HELICAL_SPINDLE_EXTENSION'}


def sha(path:Path)->str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_manifest(folder:Path,name:str, expected_schema:str, count:int)->dict:
    path=folder/name
    if not path.is_file():raise FileNotFoundError('Missing owner source manifest '+str(path))
    doc=json.loads(path.read_text(encoding='utf-8'))
    if doc.get('schema')!=expected_schema or doc.get('partCount')!=count or doc.get('uniformColor')!=NEUTRAL:
        raise ValueError('Wrong original GLB owner schema/count/neutral color: '+str(path))
    if set(doc.get('profiles',{})) != set(LEVELS):
        raise ValueError('All three original owner LOD files required')
    return doc


def load_scene(folder:Path,record:dict,expected_names:set[str],quality:str)->trimesh.Scene:
    item=record['profiles'][quality]
    path=folder/item['file']
    if not path.is_file() or sha(path)!=item['sha256']:
        raise ValueError('Owner GLB SHA-256 mismatch: '+str(path))
    scene=trimesh.load(path,force='scene')
    if (len(scene.graph.nodes_geometry)!=len(expected_names)
            or set(scene.graph.nodes_geometry)!=expected_names
            or len(scene.geometry)!=len(expected_names)):
        raise ValueError('Owner GLB node identity differs from signed manifest: '+quality)
    for node in scene.graph.nodes_geometry:
        matrix,key=scene.graph[node]
        geometry=scene.geometry[key]
        if not np.isfinite(matrix).all() or not np.isfinite(geometry.vertices).all():
            raise ValueError('Non-finite original transform or mesh '+node)
        if not geometry.is_watertight or not geometry.is_winding_consistent:
            raise ValueError('Non-watertight source original mesh '+node)
        if tuple(int(x) for x in geometry.visual.material.baseColorFactor)!=RGBA:
            raise ValueError('Original source violates requested monochrome PBR '+node)
    return scene


def owner_partition(old_manifest:dict,new_manifest:dict)->tuple[set[str],set[str],dict]:
    old=set(old_manifest.get('partIds',[])); latest=set(new_manifest.get('partIds',[]))
    if len(old)!=43 or len(latest)!=40:
        raise ValueError('Original source list missing or duplicated part IDs')
    common=old & latest
    susp=old-latest
    if (len(common)!=32 or len(susp)!=11 or
        any(not name.startswith(SUSP_PREFIX) for name in susp) or
        any(name.startswith(SUSP_PREFIX) for name in latest)):
        raise ValueError('Expected exact P2.19 suspension11 + latest P2.23 rear40 source lineage')
    if len(susp|latest)!=51:
        raise ValueError('P2.25 cannot merge duplicated part owner names')
    if not {'P210_REAR_UPPER_A_ARM_FORGED','P210_REAR_LOWER_A_ARM_FORGED'}<=susp:
        raise ValueError('Original P2.19 corrected A-arms missing')
    if not {'P216_REAR_HUB_STUB','P218_REAR_MALE_HELICAL_SPINDLE_EXTENSION'}<=latest:
        raise ValueError('Latest P2.23 keyed hub/spindle missing')
    if sum(n.startswith('P221_REAR_ROTOR_HAT_STUD_UNTHREADED_') for n in latest)!=8:
        raise ValueError('P2.21 eight original rotor-hat studs missing')
    return susp,latest,{'p219PartIds':43,'p223PartIds':40,'legacyRear40OverwrittenIds':len(common),
        'retainedSuspensionPartIds':sorted(susp),'latestRearPartIds':sorted(latest),
        'composedSourceMeshIds':51, 'provisionalAuthoringParts':True}


def source_delta(old_scene:trimesh.Scene,latest_scene:trimesh.Scene)->dict:
    old=set(old_scene.graph.nodes_geometry)
    fresh=set(latest_scene.graph.nodes_geometry)
    retained=[];changed=[]
    for name in sorted(old&fresh):
        _,oldkey=old_scene.graph[name]
        _,newkey=latest_scene.graph[name]
        a=old_scene.geometry[oldkey].identifier_hash
        b=latest_scene.geometry[newkey].identifier_hash
        (retained if a==b else changed).append(name)
    new=sorted(fresh-old)
    if set(changed)!=EXPECTED_REVISIONS or len(retained)!=27 or len(new)!=8:
        raise ValueError('Real CAD source shape revision ledger differs from P2.19→P2.23 history')
    return {'unchangedSourcePartIds':retained,'unchangedSharedPartCount':len(retained),
            'revisedNativePartIds':changed,'revisedShapeCount':len(changed),
            'newNativeStudPartIds':new,'addedStudCount':len(new),
            'comparisonMethod':'trimesh invariant geometry identifier_hash',
            'sourceCADBRepIdentityProven':False}


def _world_mesh(scene:trimesh.Scene,node:str)->trimesh.Trimesh:
    transform,key=scene.graph[node]
    mesh=scene.geometry[key].copy()
    mesh.apply_transform(transform)
    return mesh


def aabb_cross_source_audit(susp_scene:trimesh.Scene,wheel_scene:trimesh.Scene,
                            suspension:set[str],wheel:set[str])->dict:
    """Conservative mesh bounding boxes, NEVER a proof of physical interference."""
    bounds_s={n:_world_mesh(susp_scene,n).bounds for n in sorted(suspension)}
    bounds_w={n:_world_mesh(wheel_scene,n).bounds for n in sorted(wheel)}
    candidates=[]
    for s,b in bounds_s.items():
        for w,bw in bounds_w.items():
            delta=np.minimum(b[1],bw[1])-np.maximum(b[0],bw[0])
            if np.all(delta>1e-9):
                candidates.append({'suspensionPartId':s,'wheelPartId':w,
                    'overlapBoxMm3':round(float(np.prod(delta))*1e9,6)})
    return {'candidatePairs':len(suspension)*len(wheel),'aabbSeparatedPairs':
       len(suspension)*len(wheel)-len(candidates), 'aabbOverlapCandidates':len(candidates),
       'possibleInterferenceCandidates':candidates, 'exactNativeBRepIntersections':0,
       'trueVolumeOverlapMeasured':False,'staticCollisionFreeCertified':False,
       'passMechanicalG2':False}


def compose(old_dir:Path,new_dir:Path,out:Path)->dict:
    if out.exists():raise FileExistsError('P2.25 refuses to overwrite earlier source/QA')
    old=load_manifest(old_dir,'P219_rear43_neutral_review_manifest.json',OLD_SCHEMA,43)
    new=load_manifest(new_dir,'P223_rear40_neutral_review_manifest.json',NEW_SCHEMA,40)
    susp,wheel,ledger=owner_partition(old,new)
    generated={}
    # Validate all original input GLBs BEFORE creating any output.
    delta_by_tier={}
    for tier in LEVELS:
        a=load_scene(old_dir,old,set(old['partIds']),tier)
        b=load_scene(new_dir,new,set(new['partIds']),tier)
        generated[tier]=(a,b)
        delta_by_tier[tier]=source_delta(a,b)
    out.mkdir(parents=True)
    profiles={}
    for tier in LEVELS:
        old_scene,new_scene=generated[tier]
        scene=trimesh.Scene()
        for names,source in ((sorted(susp),old_scene),(sorted(wheel),new_scene)):
            for node in names:
                matrix,key=source.graph[node]
                scene.add_geometry(source.geometry[key].copy(),geom_name=node,node_name=node,transform=matrix)
        if set(scene.graph.nodes_geometry)!=(susp|wheel) or len(scene.geometry)!=51:
            raise RuntimeError('Source part identity dropped or doubled during merge')
        path=out/('P225_rear51_neutral_source_'+tier.lower()+'.glb')
        path.write_bytes(scene.export(file_type='glb'))
        parsed=trimesh.load(path,force='scene')
        if set(parsed.graph.nodes_geometry)!=(susp|wheel) or len(parsed.geometry)!=51:
            raise RuntimeError('51 source mesh GLB did not roundtrip')
        if {tuple(int(v) for v in m.visual.material.baseColorFactor) for m in parsed.geometry.values()}!={RGBA}:
            raise RuntimeError('Unified neutral color lost after export')
        profiles[tier]={'file':path.name,'sha256':sha(path),'bytes':path.stat().st_size,
            'meshCount':51,'triangles':sum(len(mesh.faces) for mesh in parsed.geometry.values())}
    if not profiles['HIGH']['triangles']>profiles['BALANCED']['triangles']>profiles['PERFORMANCE']['triangles']:
        raise ValueError('Source LOD triangles not strictly descending')
    geometry_audit=aabb_cross_source_audit(generated['BALANCED'][0],generated['BALANCED'][1],susp,wheel)
    result={'schema':SCHEMA,'status':'AUTHENTIC_OWNER_DERIVED_GLTF_SOURCE_REVIEW_ONLY_G2_HOLD',
        'partCount':51,'sourceOwnership':ledger,'sourceManifestHashes':{
            'P219':sha(old_dir/'P219_rear43_neutral_review_manifest.json'),
            'P223':sha(new_dir/'P223_rear40_neutral_review_manifest.json')},
        'originalP219GlbSha256':{tier:old['profiles'][tier]['sha256'] for tier in LEVELS},
        'originalP223GlbSha256':{tier:new['profiles'][tier]['sha256'] for tier in LEVELS},
        'partIds':sorted(susp|wheel),'uniformBaseColor':NEUTRAL,
        'partGeometryChangeAudit':delta_by_tier,
        'crossSourceMeshAabbAudit':geometry_audit,'profiles':profiles,
        'sourceP29P210RecomputedFromNativeBrep':False,
        'sourceP212P214Included':False,'nativeP224Full71AuditPassed':False,
        'modelBOriginalIncluded':False,'fullCarAssemblyComplete':False,
        'mechanicalG2Certified':False,'movingSuspensionCertified':False}
    (out/'P225_rear51_source_manifest.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    return result


if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--p219-rear43',type=Path,required=True)
    p.add_argument('--p223-rear40',type=Path,required=True)
    p.add_argument('--out',type=Path,required=True)
    opts=p.parse_args()
    result=compose(opts.p219_rear43,opts.p223_rear40,opts.out)
    print(json.dumps({'status':result['status'],'parts':result['partCount'],
      'aabbCandidates':result['crossSourceMeshAabbAudit']['aabbOverlapCandidates']},indent=2))
