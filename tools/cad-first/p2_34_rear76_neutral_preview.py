#!/usr/bin/env python3
"""P2.34 named neutral rear76 preview: replace exactly two authentic native solids.

Reuse 74 unchanged previously verified P2.33 source GLB meshes. Re-tessellate
only actual P2.34 modified CV housing and driveshaft B-Reps from the SHA-
verified new STEP. No empty/proxy geometry, no original Model B car included.
"""
from __future__ import annotations
import argparse,hashlib,json
from pathlib import Path
import cadquery as cq
import numpy as np
import trimesh

SHA_P233_PREVIEW='0b0c40d1c3117668240a5e6a38af394c08e6fb84cf982f5e9dfc56650501e676'
SCHEMA='peds.cad-first.p234-76-source-neutral-glb-preview.v1'
TIERS={'HIGH':(.05,.12),'BALANCED':(.15,.28),'PERFORMANCE':(.40,.48)}
CHANGED={'P217_REAR_DRIVE_HALF_SHAFT_UNSPLINED','P217_REAR_CV_HOUSING_PROTOTYPE'}
RGBA=(135,146,157,255)

def sha(p:Path)->str:return hashlib.sha256(p.read_bytes()).hexdigest()

def native_mesh(shape:cq.Shape,node:str,linear:float,angular:float)->trimesh.Trimesh:
    verts,faces=shape.tessellate(linear,angular)
    mesh=trimesh.Trimesh(vertices=np.asarray([[v.x,v.y,v.z] for v in verts],dtype=float)/1000,
                          faces=np.asarray(faces,dtype=np.int64),process=False)
    mesh.merge_vertices(digits_vertex=7)
    if not mesh.is_watertight or not mesh.is_winding_consistent or len(mesh.faces)<4:
        raise ValueError('P2.34 native source GLB tessellation invalid: '+node)
    mesh.visual=trimesh.visual.TextureVisuals(material=trimesh.visual.material.PBRMaterial(
        name=node,baseColorFactor=RGBA,metallicFactor=.79,roughnessFactor=.3,doubleSided=True))
    return mesh

def compose(original_preview:Path,p234_native:Path,out:Path)->dict:
    if out.exists():raise FileExistsError('P2.34 preview refuses overwrite')
    meta_path=original_preview/'P233_rear76_source_preview_manifest.json'
    if sha(meta_path)!=SHA_P233_PREVIEW:raise ValueError('Original P2.33 neutral GLB manifest SHA mismatch')
    meta=json.loads(meta_path.read_text())
    if meta.get('schema')!='peds.cad-first.p233-rear76-neutral-source-preview.v1' or len(meta['partIds'])!=76:
        raise ValueError('Original P2.33 source-named GLB manifest wrong')
    audit=json.loads((p234_native/'P234_rear76_static_coupler_audit.json').read_text())
    mapping=json.loads((p234_native/'P234_rear76_source_name_map.json').read_text())
    step=p234_native/audit['nativeSTEP']['file']
    if (audit.get('status')!='RIGID_SHAFT_CV_HOUSING_NATIVE_STATIC_PASS_G2_HOLD'
        or not audit['staticNativeAudit']['nominalStaticPass']
        or mapping.get('partCount')!=76
        or step.stat().st_size<=0
        or sha(step)!=audit['nativeSTEP']['sha256']
        or mapping['sourceStepSHA256']!=sha(step)):
        raise ValueError('P2.34 native 76-solid STEP authenticity not proven')
    names=set(mapping['nameToZeroBasedSolidIndex'])
    if names!=set(meta['partIds']) or not CHANGED<=names:
        raise ValueError('Source part identity mismatch between P2.33/P2.34')
    # Preload authentic GLB inputs; output is not created until every input passes.
    inputs={}
    for quality in TIERS:
        row=meta['profiles'][quality];path=original_preview/row['file']
        if sha(path)!=row['sha256']:raise ValueError('P2.33 original source GLB SHA mismatch')
        scene=trimesh.load(path,force='scene')
        if set(scene.graph.nodes_geometry)!=names or len(scene.geometry)!=76:
            raise ValueError('Original source GLB 76 source IDs missing')
        for mesh in scene.geometry.values():
            if tuple(map(int,mesh.visual.material.baseColorFactor))!=RGBA or not mesh.is_watertight:
                raise ValueError('Original source material or watertightness changed')
        inputs[quality]=scene
    out.mkdir(parents=True)
    profiles={}
    for quality,(linear,angular) in TIERS.items():
        # OpenCascade tessellation caches mesh fidelity: import STEP afresh for each tier.
        sources=cq.importers.importStep(str(step)).solids().vals()
        if len(sources)!=76:raise ValueError('Native source 76 STEP reread failed')
        src=inputs[quality]
        result=trimesh.Scene()
        for node in sorted(names):
            if node in CHANGED:
                key=mapping['nameToZeroBasedSolidIndex'][node]
                mesh=native_mesh(sources[key],node,linear,angular)
                result.add_geometry(mesh,geom_name=node,node_name=node)
            else:
                matrix,key=src.graph[node]
                mesh=src.geometry[key].copy()
                result.add_geometry(mesh,geom_name=node,node_name=node,transform=matrix)
        file=out/f'P234_rear76_keyed_inboard_neutral_{quality.lower()}.glb'
        file.write_bytes(result.export(file_type='glb'))
        reread=trimesh.load(file,force='scene')
        if set(reread.graph.nodes_geometry)!=names or len(reread.geometry)!=76:
            raise ValueError('P2.34 exported GLB lost source names')
        if any(not mesh.is_watertight or not mesh.is_winding_consistent for mesh in reread.geometry.values()):
            raise ValueError('P2.34 exported GLB not watertight')
        if {tuple(map(int,m.visual.material.baseColorFactor)) for m in reread.geometry.values()}!={RGBA}:
            raise ValueError('P2.34 exported GLB changed neutral engineering base color')
        profiles[quality]={'file':file.name,'sha256':sha(file),'bytes':file.stat().st_size,
            'sourceMeshNodes':76,'triangles':sum(len(m.faces) for m in reread.geometry.values())}
    if not profiles['HIGH']['triangles']>profiles['BALANCED']['triangles']>profiles['PERFORMANCE']['triangles']:
        raise ValueError('P2.34 LOD triangle counts not descending')
    record={'schema':SCHEMA,'status':'REAL_NATIVE_TWO_PART_REPLACEMENT_76_SOURCE_GLBS_PASS_G2_HOLD',
        'sourceP233NeutralManifestSHA256':sha(meta_path),
        'sourceP234NativeSTEPsha256':sha(step),'partIds':sorted(names),
        'revisedNativePartIds':sorted(CHANGED),'reusedOriginalP233VisualMeshes':74,
        'neutralBaseColor':'#87929d','profiles':profiles,
        'originalModelBFullCarIncluded':False,'functionalArticulatingCvCertified':False,
        'mechanicalG2Certified':False}
    (out/'P234_rear76_neutral_preview_manifest.json').write_text(json.dumps(record,indent=2)+'\n')
    return record

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--p233-preview',type=Path,required=True)
    p.add_argument('--p234-native',type=Path,required=True)
    p.add_argument('--out',type=Path,required=True)
    args=p.parse_args()
    print(json.dumps(compose(args.p233_preview,args.p234_native,args.out),indent=2))
