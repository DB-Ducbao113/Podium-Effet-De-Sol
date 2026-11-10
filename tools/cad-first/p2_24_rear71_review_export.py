#!/usr/bin/env python3
"""P2.24 source-native rear71 STEP + neutral GLB, only after authentic QA PASS.

NEVER install into original Model B automatically. No 3D preview if either
full 51-body or 71-body collision step failed or authenticated source files
were absent/changed. Review assets remain private and non-production.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

import cadquery as cq
import numpy as np
import trimesh

from p2_16_rear_wheel_end import neutral_palette
from p2_24_rear71_authentic_gate import (
    VERIFIED_SOURCE_BLOBS, PALETTE_PATH, PALETTE_BLOB, SCHEMA as GATE_SCHEMA, FINAL71,
    COLOR, git_blob_sha,
)

SCHEMA='peds.cad-first.p224-rear71-native-source-review.v1'
RGB=(135,146,157,255)


def role_of(name:str)->str:
    if 'TYRE' in name:return 'tyre'
    if 'RIM' in name:return 'rim'
    if 'CALIPER' in name:return 'caliper'
    if 'BRAKE_PAD' in name:return 'friction-pad'
    if 'BRAKE_DISC' in name or 'ROTOR' in name and 'HAT' not in name:return 'carbon-brake'
    if 'BEARING' in name or 'RACE' in name or 'BALL' in name:return 'bearing'
    if 'SLEEVE' in name or 'JOINT' in name:return 'rear-joint'
    if any(s in name for s in ('STUD','LOCK','NUT','PIN','THREAD','SPINDLE')):return 'hardware'
    if 'UPRIGHT' in name:return 'upright'
    if 'HUB' in name or 'HAT' in name:return 'hub'
    if any(s in name for s in ('ARM','TOE','WISHBONE')):return 'suspension'
    return 'other'


def digest(path:Path)->str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def validate_gate(shapes:dict,report:dict)->None:
    if report.get('schema')!=GATE_SCHEMA or report.get('static71SourceCertified') is not True:
        raise ValueError('Actual P2.24 authenticated 71-body B-Rep gate must PASS')
    first=report.get('initial51NativeBRepAudit') or {}
    second=report.get('candidate71NativeBRepAudit') or {}
    if (first.get('allPairs')!=1275 or first.get('previouslyCertifiedOldOldPairs')!=780 or
        second.get('allPairs')!=2485 or second.get('previouslyCertifiedOldOldPairs')!=1176 or
        not first.get('passNewCrossSourceStatic') or not second.get('passNewCrossSourceStatic')):
        raise ValueError('Source 51/71 actual static pair audit is incomplete')
    if report.get('exactOriginalUpstreamGitBlobSha1')!={**VERIFIED_SOURCE_BLOBS,PALETTE_PATH:PALETTE_BLOB}:
        raise ValueError('Source Git blob authenticity is not certified')
    if len(shapes)!=FINAL71 or len(set(shapes))!=FINAL71 or set(shapes)!=set(report.get('candidatePartIds',[])):
        raise ValueError('Wrong 71 native CAD source identities')


def export_source(shapes:dict,report:dict,out:Path, linear_mm:float=.18,
                  angular_rad:float=.26)->dict:
    # Fail before writing anything when the underlying CAD isn't authentic.
    validate_gate(shapes,report)
    if out.exists():
        raise FileExistsError('Refuse to overwrite a reviewed original CAD STEP/GLB')
    palette,rgba=neutral_palette()
    if palette['uniformColor']!=COLOR or tuple(rgba)!=RGB:
        raise ValueError('User-approved monochrome palette changed')
    out.mkdir(parents=True)
    assembly=cq.Assembly(name='P224_REAR71_STATIC_SOURCE_G2_HOLD')
    for name,solid in shapes.items():
        if solid.isNull() or not solid.isValid() or len(solid.Solids())!=1:
            raise ValueError('Invalid native CAD source solid: '+name)
        assembly.add(solid,name=name)
    step=out/'P224_rear71_static_source.step'
    assembly.save(str(step),exportType='STEP')
    imported=cq.importers.importStep(str(step)).solids().vals()
    if len(imported)!=FINAL71 or any(not solid.isValid() for solid in imported):
        raise ValueError('Native P2.24 STEP must roundtrip 71 valid solids')
    scene=trimesh.Scene()
    triangles=0
    for name,solid in shapes.items():
        v,f=solid.tessellate(linear_mm,angular_rad)
        mesh=trimesh.Trimesh(
            vertices=np.asarray([[p.x,p.y,p.z] for p in v],dtype=float)/1000,
            faces=np.asarray(f,dtype=np.int64),process=False)
        mesh.merge_vertices(digits_vertex=7)
        if not len(mesh.faces) or not mesh.is_watertight or not mesh.is_winding_consistent:
            raise ValueError('Original P2.24 CAD glTF mesh not watertight: '+name)
        pbr=palette['presets'][role_of(name)]
        mesh.visual=trimesh.visual.TextureVisuals(material=trimesh.visual.material.PBRMaterial(
            name=name,baseColorFactor=rgba,metallicFactor=pbr['metalness'],
            roughnessFactor=pbr['roughness'],doubleSided=True))
        scene.add_geometry(mesh,node_name=name,geom_name=name)
        triangles+=len(mesh.faces)
    glb=out/'P224_rear71_neutral_balanced.glb'
    glb.write_bytes(scene.export(file_type='glb'))
    reloaded=trimesh.load(glb,force='scene')
    if set(reloaded.graph.nodes_geometry)!=set(shapes) or len(reloaded.geometry)!=FINAL71:
        raise ValueError('P2.24 source-named mesh identity lost in GLB roundtrip')
    if {tuple(int(c) for c in m.visual.material.baseColorFactor) for m in reloaded.geometry.values()}!={RGB}:
        raise ValueError('P2.24 source GLB changed unified base color')
    receipt={
        'schema':SCHEMA,'status':'SOURCE_STATIC_GLTF_ONLY_MODEL_B_UNINSTALLED_G2_HOLD',
        'nativeStep':step.name,'nativeStepSha256':digest(step),
        'nativeStepRoundtripSolids':len(imported),
        'glb':glb.name,'glbSha256':digest(glb),
        'partCount':FINAL71,'partIds':sorted(shapes),
        'triangles':triangles,'uniformMaterialBaseColor':COLOR,
        'modelBOriginalIncluded':False,'mechanicalG2Certified':False,
        'sourceAuditSchema':GATE_SCHEMA,
    }
    (out/'P224_rear71_neutral_preview_manifest.json').write_text(json.dumps(receipt,indent=2)+'\n')
    return receipt
