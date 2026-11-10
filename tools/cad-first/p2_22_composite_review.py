#!/usr/bin/env python3
"""Source-verified neutral 40-part P2.22 rear preview, NOT owner Model B.

Replace only P216 hub + P217 hat and dust-seal *review* source meshes from
P2.21. Do not mutate any original STEP/GLB file or mark G2 as certified.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import trimesh

from p2_22_keyed_hub_rotor import HUB, HAT, SEAL, SCHEMA as NATIVE_SCHEMA

SCHEMA = 'peds.cad-first.p222-keyed-rear40-source-review.v1'
COLOR = (135,146,157,255)


def _sha(path:Path)->str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _source(folder:Path,info:dict)->trimesh.Scene:
    path=folder/info['file']
    if not path.is_file() or _sha(path)!=info['sha256']:
        raise ValueError('Source GLB SHA-256 mismatch: '+str(path))
    return trimesh.load(path,force='scene')


def compose(previous_dir:Path,new_dir:Path,out:Path)->dict:
    if out.exists():
        raise FileExistsError('Refuse to overwrite original CAD review')
    previous=json.loads((previous_dir/'P221_rear40_neutral_review_manifest.json').read_text())
    new=json.loads((new_dir/'P222_keyed_hub_hat_manifest.json').read_text())
    if previous.get('schema')!='peds.cad-first.p221-rear40-source-preview.v1' or previous.get('partCount')!=40:
        raise ValueError('Wrong P2.21 SHA-authored rear40 source provenance')
    if new.get('schema')!=NATIVE_SCHEMA or new.get('nativeSTEPsolids')!=3:
        raise ValueError('Wrong P2.22 native source identity')
    if not new.get('geometryAudit',{}).get('nominalStaticAudit',{}).get('passStatic'):
        raise ValueError('P2.22 40-native-solid CAD static audit has not passed')
    if previous.get('uniformColor')!='#87929d' or new.get('uniformColor')!='#87929d':
        raise ValueError('Inconsistent engineering base color')
    original_names=set(previous['partIds'])
    replacements={HUB,HAT,SEAL}
    if len(original_names)!=40 or not replacements <= original_names or set(new['replacesOnlyOnReview'])!=replacements:
        raise ValueError('Wrong source part replacement ownership')
    out.mkdir(parents=True)
    tiers={}
    for quality in ('HIGH','BALANCED','PERFORMANCE'):
        original=_source(previous_dir,previous['profiles'][quality])
        replacement=_source(new_dir,new['qualityProfiles'][quality])
        if set(original.graph.nodes_geometry)!=original_names or set(replacement.graph.nodes_geometry)!=replacements:
            raise ValueError('GLB source node identities do not match manifest')
        joined=trimesh.Scene()
        for scene in (original,replacement):
            for node in scene.graph.nodes_geometry:
                if scene is original and node in replacements:
                    continue
                matrix,key=scene.graph[node]
                mesh=scene.geometry[key]
                if tuple(int(x) for x in mesh.visual.material.baseColorFactor)!=COLOR:
                    raise ValueError('Material color drift in source GLB: '+node)
                if node in joined.graph.nodes_geometry:
                    raise ValueError('Duplicate part ID in source merge: '+node)
                joined.add_geometry(mesh.copy(),geom_name=node,node_name=node,transform=matrix)
        if set(joined.graph.nodes_geometry)!=original_names:
            raise ValueError('P2.22 GLB review lost native source identities')
        path=out/('P222_rear40_keyed_neutral_'+quality.lower()+'.glb')
        path.write_bytes(joined.export(file_type='glb'))
        reopened=trimesh.load(path,force='scene')
        if set(reopened.graph.nodes_geometry)!=original_names or len(reopened.geometry)!=40:
            raise ValueError('P2.22 GLB review roundtrip lost named parts')
        tiers[quality]={'file':path.name,'sha256':_sha(path),
                        'bytes':path.stat().st_size,'meshCount':40,
                        'triangles':sum(len(mesh.faces) for mesh in reopened.geometry.values())}
    report={'schema':SCHEMA,'status':'REAR40_STATIC_PREVIEW_MODEL_B_UNINSTALLED_G2_HOLD',
            'partIds':sorted(original_names),'partCount':40,'replacedIds':sorted(replacements),
            'uniformColor':'#87929d','originalModelBIncluded':False,
            'manufacturingFitCertified':False,'mechanicalG2Certified':False,
            'shaftLoadPathCertified':False,'sourceChangesToOriginalAsset':False,
            'qualityProfiles':tiers}
    (out/'P222_rear40_keyed_neutral_manifest.json').write_text(json.dumps(report,indent=2)+'\n')
    return report


if __name__ == '__main__':
    ap=argparse.ArgumentParser()
    ap.add_argument('--previous-dir',required=True,type=Path)
    ap.add_argument('--native-dir',required=True,type=Path)
    ap.add_argument('--out',required=True,type=Path)
    a=ap.parse_args()
    print(json.dumps(compose(a.previous_dir,a.native_dir,a.out),indent=2))
