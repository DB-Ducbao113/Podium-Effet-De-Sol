#!/usr/bin/env python3
"""P2.20 neutral 63-body native preview: strict source-only export AFTER B-Rep gate.

One BALANCED glTF scene with original individual CAD IDs, no car or invented
source transforms. Produces no GLB if the real P2.20 static check is on HOLD.
Do not copy output to production/public; it is an isolated unverified rear
chassis study, not OEM engineering geometry or a mechanically mated car.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

import numpy as np
import trimesh

from p2_20_rear_joint_cross_source_gate import EXPECTED_FULL,SCHEMA as AUDIT_SCHEMA

RGB = (135,146,157,255)
PREVIEW_SCHEMA = 'peds.cad-first.p220-rear63-source-preview.v1'
BASE_COLOR = '#87929d'


def _role(name: str) -> str:
    if 'TYRE' in name:return 'tyre'
    if 'RIM' in name:return 'rim'
    if 'DISC' in name:return 'carbon-brake'
    if 'PAD' in name:return 'friction-pad'
    if 'CALIPER' in name:return 'caliper'
    if 'BEARING' in name or 'RACE' in name:return 'bearing'
    if 'BUSHING' in name:return 'bearing'
    if 'JOINT' in name or 'SLEEVE' in name:return 'rear-joint'
    if 'PIN' in name or 'NUT' in name or 'THREADED' in name or 'SPINDLE' in name:return 'hardware'
    if 'ARM' in name or 'TOE' in name:return 'suspension'
    if 'UPRIGHT' in name:return 'upright'
    if 'HUB' in name:return 'hub'
    return 'other'


def source_preview(shapes:dict, verified_audit:dict, out:Path,
                   palette_file:Path, linear_mm:float=.15,angular_rad:float=.25)->dict:
    if out.exists():
        raise FileExistsError('Refuse to overwrite existing source preview')
    if not isinstance(verified_audit,dict) or not verified_audit.get('passNewCrossSourceStatic'):
        raise ValueError('P2.20 full cross-source static gate must PASS before any source preview')
    if verified_audit.get('allPairs')!=1953 or verified_audit.get('previouslyCertifiedOldOldPairs')!=820:
        raise ValueError('P2.20 63-part static audit scope incomplete')
    if len(shapes)!=EXPECTED_FULL or len(set(shapes))!=EXPECTED_FULL:
        raise ValueError('Unexpected 63 individually named native source parts')
    palette=json.loads(palette_file.read_text(encoding='utf-8'))
    if palette.get('schema')!='peds.engineering.neutral-materials.v1' or palette.get('uniformColor')!=BASE_COLOR:
        raise ValueError('Source neutral material palette mismatch')
    scene=trimesh.Scene()
    total=0
    for name,solid in shapes.items():
        if solid.isNull() or not solid.isValid() or len(solid.Solids())!=1:
            raise ValueError('P2.20 native source mesh not valid: '+name)
        vertices,faces=solid.tessellate(linear_mm,angular_rad)
        mesh=trimesh.Trimesh(
            vertices=np.asarray([[v.x,v.y,v.z] for v in vertices],dtype=float)/1000,
            faces=np.asarray(faces,dtype=np.int64),process=False)
        mesh.merge_vertices(digits_vertex=7)
        if len(mesh.faces)<4 or not mesh.is_watertight or not mesh.is_winding_consistent:
            raise ValueError('P2.20 source tessellation failure: '+name)
        preset=palette['presets'][_role(name)]
        mesh.visual=trimesh.visual.TextureVisuals(material=trimesh.visual.material.PBRMaterial(
            name=name,baseColorFactor=list(RGB),metallicFactor=preset['metalness'],
            roughnessFactor=preset['roughness'],doubleSided=True))
        scene.add_geometry(mesh,geom_name=name,node_name=name)
        total+=len(mesh.faces)
    out.mkdir(parents=True)
    glb=out/'P220_rear63_native_balanced_neutral.glb'
    glb.write_bytes(scene.export(file_type='glb'))
    loaded=trimesh.load(glb,force='scene')
    if set(loaded.graph.nodes_geometry)!=set(shapes):
        raise ValueError('P2.20 63-source node identities lost in GLB roundtrip')
    colors={tuple(int(i) for i in g.visual.material.baseColorFactor)
            for g in loaded.geometry.values()}
    if colors!={RGB}:
        raise ValueError('Original native CAD viewer monochrome RGB policy failed')
    record={'schema':PREVIEW_SCHEMA,'sourceAuditSchema':AUDIT_SCHEMA,
            'status':'STATIC_SOURCE_PREVIEW_ONLY_MODEL_B_UNINSTALLED_G2_HOLD',
            'materialBaseColor':BASE_COLOR,'partCount':EXPECTED_FULL,
            'nativePartIds':sorted(shapes),'triangles':total,
            'filename':glb.name,'fileBytes':glb.stat().st_size,
            'sha256':hashlib.sha256(glb.read_bytes()).hexdigest(),
            'staticGatePass':True,'mechanicalG2Certified':False,
            'originalModelBIncluded':False,'fullCarInstalled':False,
            'continuousKinematicsCertified':False}
    (out/'P220_rear63_native_preview_manifest.json').write_text(json.dumps(record,indent=2)+'\n')
    return record


def run(out:Path)->dict:
    """CLI entry only: enforce exact Git source bytes and B-Rep pass first."""
    from p2_20_rear_joint_cross_source_gate import (
        authenticate_sources,compose_nominal,incremental_brep_audit)
    root=Path(__file__).resolve().parent
    authenticate_sources(root)
    from p2_19_rear_wishbone_clearance import full_source_audit
    from p2_12_toe_adjuster import all_parts
    from p2_14_split_spherical_race import source_parts,SOURCE_BEARING_TO_REPLACE
    old,proof=full_source_audit()
    shapes,old_ids,new_ids,_=compose_nominal(old,all_parts(),source_parts(),SOURCE_BEARING_TO_REPLACE,proof['passStatic'])
    audit=incremental_brep_audit(shapes,old_ids,new_ids)
    palette=root.parents[1]/'apps/web/src/dev/assemblyPreview/engineeringNeutralPalette.json'
    return source_preview(shapes,audit,out,palette)


if __name__=='__main__':
    import argparse
    cli=argparse.ArgumentParser()
    cli.add_argument('--out',type=Path,required=True)
    print(json.dumps(run(cli.parse_args().out),indent=2))
