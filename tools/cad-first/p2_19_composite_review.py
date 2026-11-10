#!/usr/bin/env python3
"""Neutral 43-part rear engineering source review; never install into Model B.

Source-derived P2.9/P2.10 9 unchanged CAD bodies + 2 P2.19 reworked arms
are combined with SHA-pinned P2.18 32-mesh review. Source file content and
output identity are recorded; all G2/mechanical and original-car gates HOLD.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
import trimesh

from p2_16_rear_wheel_end import QUALITY, neutral_palette
from p2_19_rear_wishbone_clearance import ARMS, revised_suspension

SCHEMA='peds.cad-first.p219-43-body-source-review.v1'
RGBA=(135,146,157,255)


def digest(path:Path)->str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def verified_glb(folder:Path, info:dict)->trimesh.Scene:
    path=folder/info['file']
    if not path.is_file() or digest(path)!=info['sha256']:
        raise ValueError('Source GLB digest mismatch: '+str(path))
    return trimesh.load(path,force='scene')


def _add(scene:trimesh.Scene, node:str, mesh:trimesh.Trimesh, matrix=None)->None:
    if node in scene.graph.nodes_geometry or tuple(int(x) for x in mesh.visual.material.baseColorFactor)!=RGBA:
        raise ValueError('Duplicate source geometry or nonuniform RGB: '+node)
    scene.add_geometry(mesh.copy(),geom_name=node,node_name=node,transform=matrix)


def _mesh(name:str,solid,linear:float,angular:float)->trimesh.Trimesh:
    verts,faces=solid.tessellate(linear,angular)
    mesh=trimesh.Trimesh(vertices=np.array([[v.x,v.y,v.z] for v in verts],dtype=float)/1000,
                         faces=np.array(faces,dtype=np.int64),process=False)
    mesh.merge_vertices(digits_vertex=7)
    if not mesh.is_watertight or not mesh.is_winding_consistent:
        raise ValueError('P2.9/P2.10 source tessellation failure: '+name)
    palette,rgba=neutral_palette()
    role='bearing' if 'BEARING' in name else 'hardware' if 'PIN' in name else 'suspension'
    surface=palette['presets'][role]
    mesh.visual=trimesh.visual.TextureVisuals(material=trimesh.visual.material.PBRMaterial(
        name=name,baseColorFactor=rgba,metallicFactor=surface['metalness'],
        roughnessFactor=surface['roughness'],doubleSided=True))
    return mesh


def composite(base_dir:Path,p219_dir:Path,out:Path)->dict:
    if out.exists() and any(out.iterdir()):
        raise FileExistsError('Never overwrite previous 43-part static rear source review')
    base=json.loads((base_dir/'P218_rear32_neutral_review_manifest.json').read_text())
    new=json.loads((p219_dir/'P219_rear_wishbone_manifest.json').read_text())
    if base.get('schema')!='peds.cad-first.p218-static-composite-review.v1' or base.get('partCount')!=32:
        raise ValueError('Incorrect source P2.18 composite manifest')
    if new.get('schema')!='peds.cad-first.p219-rear-double-wishbone-clearance.v1' or new.get('revisedPartCount')!=2:
        raise ValueError('Incorrect native P2.19 source manifest')
    if not new.get('staticSourceAudit',{}).get('passStatic'):
        raise ValueError('P2.19 source native 43-body static gate has not passed')
    if base.get('uniformColor')!='#87929d' or new.get('materialBaseColor')!='#87929d':
        raise ValueError('CAD sources have incompatible material palettes')
    source_dir=Path(__file__).resolve().parent
    source_hashes={file:digest(source_dir/file) for file in (
        'p2_9_rear_upright.py','p2_10_rear_wishbone.py',
        'p2_19_rear_wishbone_clearance.py')}
    original_32=set(base['rearPartIds'])
    parts=revised_suspension()
    if len(parts)!=11 or len(original_32)!=32:
        raise ValueError('Suspension source does not match expected 11 original part IDs')
    expected=original_32|set(parts)
    if len(expected)!=43:
        raise ValueError('Source CAD part ownership conflicts')
    out.mkdir(parents=True,exist_ok=True)
    outputs={}
    for tier,(linear,angular) in QUALITY.items():
        old_scene=verified_glb(base_dir,base['profiles'][tier])
        new_scene=verified_glb(p219_dir,new['profiles'][tier])
        if set(old_scene.graph.nodes_geometry)!=original_32 or set(new_scene.graph.nodes_geometry)!=set(ARMS):
            raise ValueError('Original GLB mesh name mismatch')
        result=trimesh.Scene()
        for source in (old_scene,new_scene):
            for node in source.graph.nodes_geometry:
                transform,geometry_id=source.graph[node]
                _add(result,node,source.geometry[geometry_id],transform)
        # Fresh OCCT B-Reps for this LOD. Use source P2.9 + P2.10 unchanged
        # geometry, not guesses or wheel-end visual proxies.
        solids=revised_suspension()
        for name,solid in solids.items():
            if name in ARMS:continue
            _add(result,name,_mesh(name,solid,linear,angular))
        if set(result.graph.nodes_geometry)!=expected:
            raise ValueError('43-body source preview omitted or doubled CAD nodes')
        path=out/('P219_rear43_neutral_review_'+tier.lower()+'.glb')
        path.write_bytes(result.export(file_type='glb'))
        reload=trimesh.load(path,force='scene')
        if set(reload.graph.nodes_geometry)!=expected:
            raise ValueError('43-node GLB roundtrip identity failure')
        outputs[tier]={'file':path.name,'sha256':digest(path),'bytes':path.stat().st_size,
                       'meshCount':len(reload.graph.nodes_geometry),
                       'triangles':sum(len(g.faces) for g in reload.geometry.values())}
    report={'schema':SCHEMA,'status':'REAR_STATIC_CAD_PREVIEW_ONLY_MODEL_B_UNINSTALLED_G2_HOLD',
            'partCount':43,'partIds':sorted(expected),'uniformColor':'#87929d',
            'sourceCadScriptSha256':source_hashes,
            'mechanicalG2Certified':False,'originalModelBIncluded':False,
            'rearSuspensionKinematicsCertified':False,'actualChassisHardpointsMeasured':False,
            'staticSourceAudit':new['staticSourceAudit'],'profiles':outputs}
    (out/'P219_rear43_neutral_review_manifest.json').write_text(json.dumps(report,indent=2)+'\n')
    return report


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--rear32-dir',type=Path,required=True)
    parser.add_argument('--p219-dir',type=Path,required=True)
    parser.add_argument('--out',type=Path,required=True)
    args=parser.parse_args()
    print(json.dumps(composite(args.rear32_dir,args.p219_dir,args.out),indent=2))
