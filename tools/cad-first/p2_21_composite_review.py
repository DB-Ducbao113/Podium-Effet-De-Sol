#!/usr/bin/env python3
"""SHA-verified 40-body rear rotor-hat source preview (not installed Model B)."""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import trimesh
from p2_21_rear_rotor_mount import ROTOR,HAT,SEAL,SCHEMA as NATIVE_SCHEMA

RGBA=(135,146,157,255)
REVIEW_SCHEMA='peds.cad-first.p221-rear40-source-preview.v1'

def _sha(path:Path)->str:return hashlib.sha256(path.read_bytes()).hexdigest()

def _source(folder:Path,record:dict)->trimesh.Scene:
    file=folder/record['file']
    if not file.is_file() or _sha(file)!=record['sha256']:
        raise ValueError('SHA-256 mismatch: '+str(file))
    return trimesh.load(file,force='scene')

def composite(rear32_dir:Path,p221_dir:Path,out:Path)->dict:
    if out.exists():raise FileExistsError('Refuse overwriting rear source review')
    base=json.loads((rear32_dir/'P218_rear32_neutral_review_manifest.json').read_text())
    new=json.loads((p221_dir/'P221_rear_rotor_hat_manifest.json').read_text())
    if base.get('schema')!='peds.cad-first.p218-static-composite-review.v1' or base.get('partCount')!=32:
        raise ValueError('Wrong original rear32 review lineage')
    if new.get('schema')!=NATIVE_SCHEMA or new.get('fullReviewSolids')!=40:
        raise ValueError('Wrong P2.21 native authoring lineage')
    if not new.get('geometryAudit',{}).get('staticAudit',{}).get('passStatic'):
        raise ValueError('P2.21 new 40-body static source failed native B-Rep QA')
    if base.get('uniformColor')!='#87929d' or new.get('baseMaterial')!='#87929d':
        raise ValueError('Engineering neutral material mismatch')
    replaced={ROTOR,HAT,SEAL}
    old=set(base['rearPartIds'])
    fresh=set(new['changes'])
    expected=(old-replaced)|fresh
    if len(old)!=32 or len(fresh)!=11 or not replaced<=old or not replaced<=fresh or len(expected)!=40:
        raise ValueError('Wrong source part replacement identity')
    out.mkdir(parents=True)
    profiles={}
    for tier in ('HIGH','BALANCED','PERFORMANCE'):
        oldscene=_source(rear32_dir,base['profiles'][tier])
        newscene=_source(p221_dir,new['qualityProfiles'][tier])
        if set(oldscene.graph.nodes_geometry)!=old or set(newscene.graph.nodes_geometry)!=fresh:
            raise ValueError('Wrong original source GLB node IDs')
        joined=trimesh.Scene()
        for source in (oldscene,newscene):
            for node in source.graph.nodes_geometry:
                if source is oldscene and node in replaced:continue
                mat,geom=source.graph[node]
                mesh=source.geometry[geom]
                if tuple(int(x) for x in mesh.visual.material.baseColorFactor)!=RGBA:
                    raise ValueError('Unexpected part color: '+node)
                if node in joined.graph.nodes_geometry:
                    raise ValueError('Duplicate source part name: '+node)
                joined.add_geometry(mesh.copy(),geom_name=node,node_name=node,transform=mat)
        if set(joined.graph.nodes_geometry)!=expected:
            raise ValueError('Composite original part identity mismatch')
        target=out/('P221_rear40_neutral_review_'+tier.lower()+'.glb')
        target.write_bytes(joined.export(file_type='glb'))
        reloaded=trimesh.load(target,force='scene')
        if set(reloaded.graph.nodes_geometry)!=expected:
            raise ValueError('Review GLB roundtrip missing nodes')
        profiles[tier]={'file':target.name,'sha256':_sha(target),
                        'bytes':target.stat().st_size,
                        'meshCount':len(reloaded.graph.nodes_geometry),
                        'triangles':sum(len(g.faces) for g in reloaded.geometry.values())}
    result={'schema':REVIEW_SCHEMA,'status':'REAR40_STATIC_SOURCE_ONLY_G2_HOLD',
            'partIds':sorted(expected),'partCount':40,
            'replacedOldIds':sorted(replaced),
            'newFastenerCount':8,'uniformColor':'#87929d',
            'originalModelBIncluded':False,'mechanicalG2Certified':False,
            'rotorHatFaceContactMeasured':True,
            'hubTorquePathCertified':False,'profiles':profiles}
    (out/'P221_rear40_neutral_review_manifest.json').write_text(json.dumps(result,indent=2)+'\n')
    return result

if __name__=='__main__':
    cli=argparse.ArgumentParser()
    cli.add_argument('--rear32-dir',type=Path,required=True)
    cli.add_argument('--p221-dir',type=Path,required=True)
    cli.add_argument('--out',type=Path,required=True)
    args=cli.parse_args()
    print(json.dumps(composite(args.rear32_dir,args.p221_dir,args.out),indent=2))
