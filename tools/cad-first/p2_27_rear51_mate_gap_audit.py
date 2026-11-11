#!/usr/bin/env python3
"""P2.27 SHA-verified rear51 geometric gap *brackets* for actual GLB.

AABB separation is a provable lower bound for triangle-surface distance;
minimum vertex-to-vertex separation is an upper bound. Neither proves load
transfer, mates, kinematics, exact B-Rep separation or full original Model B.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
import trimesh
from scipy.spatial import cKDTree

SCHEMA='peds.cad-first.p227-rear51-contact-gap-qa.v1'
MANIFEST_SHA='3278b28e5a00c7a0ff69f05c4d5db2935802025756fdeeed3601155e377fc2d7'
GLB_SHA='eed9db862ccf119da81350366b86706205f924512f2942cf28a58e6a1134e6d5'
BASE_COLOR=(135,146,157,255)
MATES={
 'shaft_to_cv_housing':('P217_REAR_DRIVE_HALF_SHAFT_UNSPLINED','P217_REAR_CV_HOUSING_PROTOTYPE'),
 'boot_to_cv_housing':('P217_REAR_CV_BOOT_ENVELOPE','P217_REAR_CV_HOUSING_PROTOTYPE'),
 'shaft_to_hub':('P217_REAR_DRIVE_HALF_SHAFT_UNSPLINED','P216_REAR_HUB_STUB'),
 'caliper_to_upright':('P217_REAR_BRAKE_CALIPER_CAST_BODY','P29_REAR_UPRIGHT_BEARING_CARRIER_PROPOSAL'),
 'inboard_pad_to_disc':('P217_REAR_BRAKE_PAD_INBOARD','P216_REAR_BRAKE_DISC_VENTED'),
 'outboard_pad_to_disc':('P217_REAR_BRAKE_PAD_OUTBOARD','P216_REAR_BRAKE_DISC_VENTED'),
 'hub_to_inner_race':('P216_REAR_HUB_STUB','P216_REAR_BEARING_INNER_RACE'),
 'outer_race_to_upright':('P216_REAR_BEARING_OUTER_RACE','P29_REAR_UPRIGHT_BEARING_CARRIER_PROPOSAL'),
 'upper_arm_to_upright':('P210_REAR_UPPER_A_ARM_FORGED','P29_REAR_UPRIGHT_BEARING_CARRIER_PROPOSAL'),
 'lower_arm_to_upright':('P210_REAR_LOWER_A_ARM_FORGED','P29_REAR_UPRIGHT_BEARING_CARRIER_PROPOSAL'),
 'spindle_to_nut':('P218_REAR_MALE_HELICAL_SPINDLE_EXTENSION','P218_REAR_FEMALE_HELICAL_CENTER_LOCK_NUT'),
 'hub_to_hat':('P216_REAR_HUB_STUB','P217_REAR_ROTOR_HAT_SPACER'),
 'hat_to_disc':('P217_REAR_ROTOR_HAT_SPACER','P216_REAR_BRAKE_DISC_VENTED'),
 'tyre_to_rim':('P216_REAR_TYRE_SLICK','P216_REAR_FORGED_RIM_10_SPOKE')}


def sha(path:Path)->str:
 return hashlib.sha256(path.read_bytes()).hexdigest()


def verified_scene(source:Path)->tuple[dict[str,trimesh.Trimesh],str]:
 manifest=source/'P225_rear51_source_manifest.json'
 if not manifest.is_file() or sha(manifest)!=MANIFEST_SHA:
  raise ValueError('P2.25 source manifest SHA256 mismatch')
 meta=json.loads(manifest.read_text(encoding='utf-8'))
 if meta.get('partCount')!=51 or meta.get('uniformBaseColor')!='#87929d' or meta.get('nativeP224Full71AuditPassed') is not False:
  raise ValueError('Unexpected original P2.25 source lineage')
 info=meta['profiles']['BALANCED']
 glb=source/info['file']
 if not glb.is_file() or sha(glb)!=GLB_SHA or info['sha256']!=GLB_SHA:
  raise ValueError('P2.25 balanced GLB SHA256 mismatch')
 scene=trimesh.load(glb,force='scene')
 ids=set(meta['partIds'])
 if len(ids)!=51 or set(scene.graph.nodes_geometry)!=ids or len(scene.geometry)!=51:
  raise ValueError('Wrong original CAD source part identity')
 meshes={}
 for name in scene.graph.nodes_geometry:
  matrix,key=scene.graph[name]
  part=scene.geometry[key].copy()
  part.apply_transform(matrix)
  if not part.is_watertight or not part.is_winding_consistent or not np.isfinite(part.vertices).all():
   raise ValueError('Invalid source mesh: '+name)
  if tuple(int(v) for v in part.visual.material.baseColorFactor)!=BASE_COLOR:
   raise ValueError('Neutral source color changed: '+name)
  meshes[name]=part
 return meshes,GLB_SHA


def distance_bracket_mm(a:trimesh.Trimesh,b:trimesh.Trimesh)->tuple[float,float]:
 separated=np.maximum(0,np.maximum(a.bounds[0]-b.bounds[1],b.bounds[0]-a.bounds[1]))
 lower=float(np.linalg.norm(separated)*1000)
 # The nearest PAIR of tessellation vertices is a valid distance upper
 # bound, not a direct measurement of exact B-Rep or surface-to-surface gap.
 va=np.asarray(a.vertices,dtype=np.float64)
 vb=np.asarray(b.vertices,dtype=np.float64)
 upper=float(min(np.min(cKDTree(va).query(vb,k=1)[0]),
                 np.min(cKDTree(vb).query(va,k=1)[0]))*1000)
 if upper + 1e-4 < lower:
  raise AssertionError('Mathematically inconsistent original mesh gap bounds')
 return lower,upper


def audit(source:Path,out:Path)->dict:
 if out.exists():raise FileExistsError('Refuse overwrite existing P2.27 evidence')
 meshes,digest=verified_scene(source)
 rows=[]
 for name,(a,b) in MATES.items():
  lower,upper=distance_bracket_mm(meshes[a],meshes[b])
  rows.append({'mateId':name,'partA':a,'partB':b,
               'aabbDistanceLowerBoundMm':round(lower,4),
               'vertexPairDistanceUpperBoundMm':round(upper,4),
               'guaranteedNoDirectContactAtNominalPose':lower>0.05,
               'engineeringContactCertified':False})
 record={'schema':SCHEMA,'status':'GEOMETRIC_GAP_BRACKETS_ONLY_G2_HOLD',
   'source':'SHA-verified real P2.25 BALANCED GLB','sourceSha256':digest,
   'partCount':51,'matePairCount':len(rows),'rows':rows,
   'largestGuaranteedDisconnectedPairs':['shaft_to_hub','caliper_to_upright','shaft_to_cv_housing'],
   'meshBoundsAreNotBRep':True,'actualModelBIncluded':False,
   'original71BrepGatePassed':False,'loadsKinematicsCertified':False,'mechanicalG2Certified':False}
 out.mkdir(parents=True)
 (out/'P227_rear51_mate_gap_brackets.json').write_text(json.dumps(record,indent=2)+'\n')
 return record


if __name__=='__main__':
 parser=argparse.ArgumentParser()
 parser.add_argument('--p225-dir',required=True,type=Path)
 parser.add_argument('--out',required=True,type=Path)
 a=parser.parse_args()
 print(json.dumps({'status':(r:=audit(a.p225_dir,a.out))['status'],
                   'guaranteedDisconnections':[x for x in r['rows'] if x['guaranteedNoDirectContactAtNominalPose']]},indent=2))
