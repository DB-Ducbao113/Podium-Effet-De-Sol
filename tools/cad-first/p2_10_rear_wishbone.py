#!/usr/bin/env python3
"""P2.10 original independently authored rear double-wishbone CAD proposal.

Extends P2.9 upright source, not mirrored/reused P2.7 front wishbones.
Geometric assembly only. Both chassis pickup pairs are preliminary project
CAD datums: NO inferred Model B mechanical hardpoints or suspension certification.
STEP mm, GLB m, local wheel axle Z (inboard -Z).
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
from pathlib import Path
from typing import Any

import cadquery as cq
import numpy as np
import trimesh

from p2_9_rear_upright import (
    BORE_RADIUS_MM as UPRIGHT_BORE_RADIUS_MM,
    DATUMS_MM as UPRIGHT_DATUMS_MM,
    PART_ID as REAR_UPRIGHT_ID,
    build_rear_upright,
)

SCHEMA='podium-eds.p2.cad-first.rear-double-wishbone-proposal.v1'
QUALITY={'HIGH':(.035,.09),'BALANCED':(.15,.25),'PERFORMANCE':(.45,.46)}
# These are engineering PROPOSAL origins in mm relative to each REAR WHEEL,
# not physical chassis pickup measurements or an F1 manufacturer source.
ARM_PICKUPS_MM={
    'UPPER': {
        'innerA':[34.,189.,-286.],
        'innerB':[-302.,189.,-286.],
        'outerUprightBore':UPRIGHT_DATUMS_MM['upperClevisBore'],
    },
    'LOWER': {
        'innerA':[40.,-193.,-286.],
        'innerB':[-303.,-193.,-286.],
        'outerUprightBore':UPRIGHT_DATUMS_MM['lowerClevisBore'],
    }
}
# Axial position of spherical-bearing eye behind upright mounting faces.
# Maintains a visible 10 mm axial gap from the P2.9 lug in static pose.
OUTER_EYE_Z_OFFSET_MM=-43.
# Real bore interfaces are deliberately explicit, clearance analysis not certified.
RADIUS={
  'outerEyeOuter':19.2,'outerEyeBore':12.0,
  'outerBearingOuter':11.65,'outerBearingBore':7.85,
  'outerPinShank':7.25,'outerPinHead':10.4,
  'innerEyeOuter':15.6,'innerEyeBore':9.4,
  'innerBushingOuter':9.05,'innerBushingBore':5.1,
}

def sha(path:Path)->str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

def vector(p):return cq.Vector(*map(float,p))

def cylinder(radius:float,z0:float,height:float,x:float,y:float)->cq.Solid:
    return cq.Solid.makeCylinder(radius,height,cq.Vector(x,y,z0),cq.Vector(0,0,1))

def annulus(inner:float,outer:float,center:list[float],height:float)->cq.Shape:
    x,y,z=map(float,center)
    return cylinder(outer,z-height/2,height,x,y).cut(cylinder(inner,z-height/2-1,height+2,x,y))

def tubular_link(a:list[float],b:list[float],radius:float)->cq.Solid:
    start=np.asarray(a,dtype=float);end=np.asarray(b,dtype=float)
    d=end-start
    return cq.Solid.makeCylinder(radius,float(np.linalg.norm(d)),vector(start),vector(d/np.linalg.norm(d)))

def build_parts()->dict[str,cq.Shape]:
    parts={}
    for name,dt in ARM_PICKUPS_MM.items():
        outer=list(dt['outerUprightBore'])
        outer[2]+=OUTER_EYE_Z_OFFSET_MM
        a=list(dt['innerA']); b=list(dt['innerB'])
        arm=annulus(RADIUS['outerEyeBore'],RADIUS['outerEyeOuter'],outer,16)
        # Both legs are truly fused to the outer eye and inner pivot housings.
        for inner in (a,b):
            arm=arm.fuse(tubular_link(outer,inner,10.2))
            arm=arm.fuse(annulus(RADIUS['innerEyeBore'],RADIUS['innerEyeOuter'],inner,24))
        # Re-cut through each housing AFTER union, avoiding tubular end caps
        # accidentally closing a functional spherical bearing/bushing bore.
        for center,rad,thick in [(outer,RADIUS['outerEyeBore'],110),
                                 (a,RADIUS['innerEyeBore'],100),
                                 (b,RADIUS['innerEyeBore'],100)]:
            arm=arm.cut(cylinder(rad,center[2]-thick/2-1,thick+2,center[0],center[1]))
        arm=arm.clean()
        parts[f'P210_REAR_{name}_A_ARM_FORGED']=arm
        for label,inner in (('A',a),('B',b)):
            parts[f'P210_REAR_{name}_CHASSIS_PIVOT_BUSHING_{label}']=annulus(
                RADIUS['innerBushingBore'],RADIUS['innerBushingOuter'],inner,20)
        parts[f'P210_REAR_{name}_OUTER_SPHERICAL_BEARING_PROPOSAL']=annulus(
            RADIUS['outerBearingBore'],RADIUS['outerBearingOuter'],outer,13)
        # Carrier lug extends approximately z-22..z+22; the visible pin
        # passes through BOTH the outboard carrier and inboard eye. It is
        # separated from each by a modeled radial clearance, no fake welding.
        x,y,z=map(float,dt['outerUprightBore'])
        shank=cylinder(RADIUS['outerPinShank'],z-66,86,x,y)
        head=cylinder(RADIUS['outerPinHead'],z-70,4,x,y)
        pin=shank.fuse(head).clean()
        parts[f'P210_REAR_{name}_OUTER_JOINT_PIN']=pin
    if len(parts)!=10:raise RuntimeError('Expected 10 independently modeled P2.10 CAD solids')
    for name,part in parts.items():
        if part.isNull() or not part.isValid() or len(part.Solids())!=1 or part.Volume()<=0:
            raise ValueError('Nonconnected/invalid rear source CAD: '+name)
    return parts

def exact_static_audit(parts:dict[str,cq.Shape], threshold_mm3:float=.05)->dict[str,Any]:
    names=list(parts)
    bb={name:shape.BoundingBox() for name,shape in parts.items()}
    excluded=0;checked=0;collisions=[];errors=[]
    for i,name in enumerate(names):
        for other in names[i+1:]:
            a,b=bb[name],bb[other]
            if any(min(getattr(a,s+'max'),getattr(b,s+'max')) -
                max(getattr(a,s+'min'),getattr(b,s+'min')) <=1e-6 for s in 'xyz'):
                excluded+=1;continue
            checked+=1
            try:
                volume=parts[name].intersect(parts[other]).Volume()
                if not math.isfinite(volume):raise ValueError('nonfinite CAD intersection')
                if volume>threshold_mm3:
                    collisions.append({'a':name,'b':other,'volumeMm3':round(volume,6)})
            except Exception as e:
                errors.append({'a':name,'b':other,'error':str(e)})
    return {
        'pairCount':len(names)*(len(names)-1)//2,
        'aabbExcluded':excluded,'nativeBrepIntersectionsEvaluated':checked,
        'unresolvedCollisions':collisions,'booleanErrors':errors,
        'thresholdMm3':threshold_mm3,
        'passStatic':not collisions and not errors,
        'dynamicKinematicsCertified':False,
        'jointRetentionCertified':False,
    }

def export_glb(parts:dict[str,cq.Shape],path:Path,linear:float,angular:float)->dict[str,Any]:
    scene=trimesh.Scene();faces={};watertight={}
    for name,part in parts.items():
        vertices,triangles=part.tessellate(linear,angular)
        v=np.asarray([[p.x,p.y,p.z] for p in vertices],dtype=np.float64)/1000
        f=np.asarray(triangles,dtype=np.int32)
        mesh=trimesh.Trimesh(vertices=v,faces=f,process=False)
        mesh.merge_vertices(digits_vertex=7)
        if len(mesh.faces)==0 or not mesh.is_watertight or not mesh.is_winding_consistent:
            raise ValueError('P2.10 source GLB seam/winding invalid: '+name)
        if 'BUSHING' in name:rgba,metal,rough=[164,131,85,255],.65,.44
        elif 'BEARING' in name:rgba,metal,rough=[188,195,205,255],.78,.26
        elif 'PIN' in name:rgba,metal,rough=[202,205,209,255],.86,.22
        else:rgba,metal,rough=[85,99,111,255],.64,.42
        mesh.visual=trimesh.visual.TextureVisuals(material=trimesh.visual.material.PBRMaterial(
            name=name,baseColorFactor=rgba,metallicFactor=metal,roughnessFactor=rough,
            doubleSided=True))
        scene.add_geometry(mesh,node_name=name,geom_name=name)
        faces[name]=len(mesh.faces);watertight[name]=bool(mesh.is_watertight)
    path.write_bytes(scene.export(file_type='glb'))
    return {'triangles':sum(faces.values()),'perPartTriangles':faces,
            'allNodesWatertight':all(watertight.values())}

def build(out:Path)->dict[str,Any]:
    if out.exists() and any(out.iterdir()):
        raise FileExistsError('Refusing to overwrite existing original P2.10 CAD evidence')
    out.mkdir(parents=True,exist_ok=True)
    p29=build_rear_upright()
    parts=build_parts()
    combined={REAR_UPRIGHT_ID:p29,**parts}
    audit=exact_static_audit(combined)
    # A failing mechanical static audit must refuse final STEP/GLB source outputs.
    if not audit['passStatic']:
        (out/'P210_candidate_failed_static_audit.json').write_text(json.dumps(audit,indent=2)+'\n')
        raise ValueError('P2.10 rear upright + wishbones static source overlap; see failure audit')
    assembly=cq.Assembly(name='P210_INDEPENDENT_REAR_SUSPENSION_STATIC_PROPOSAL')
    for name,part in combined.items():assembly.add(part,name=name)
    step=out/'P210_rear_upright_wishbone_static_master.step'
    assembly.save(str(step),exportType='STEP')
    roundtrip=cq.importers.importStep(str(step)).solids().vals()
    if len(roundtrip)!=11 or not all(p.isValid() and p.Volume()>0 for p in roundtrip):
        raise ValueError('P2.10 native 11-solid STEP roundtrip failed')
    profiles={}
    for quality,(linear,angular) in QUALITY.items():
        fresh={REAR_UPRIGHT_ID:build_rear_upright(),**build_parts()}
        path=out/('P210_rear_suspension_'+quality.lower()+'.glb')
        metrics=export_glb(fresh,path,linear,angular)
        profiles[quality]={'file':path.name,'bytes':path.stat().st_size,
                           'sha256':sha(path),**metrics}
    profile_counts=[profiles[k]['triangles'] for k in QUALITY]
    if not profile_counts[0]>profile_counts[1]>profile_counts[2]:
        raise ValueError('P2.10 progressive LOD triangles gate failed')
    manifest={
        'schema':SCHEMA,'cadSourceNature':'Project-authored independent rear upright + upper/lower wishbone proposal',
        'parentP29SourcePartId':REAR_UPRIGHT_ID,
        'sourceP28Modified':False,'modelBSourceModified':False,
        'coordinates':'rear wheel local, X forward Y up Z outboard',
        'unitsCAD':'mm','unitsGLB':'m',
        'masterSTEP':step.name,'masterSTEPsha256':sha(step),
        'totalCadSolids':11,'originalP29PlusNewP210PartIds':list(combined),
        'newP210PartIds':list(parts),'newSolids':len(parts),
        'sourceP29BearingAxisMm':UPRIGHT_DATUMS_MM['bearingAxisPoint'],
        'rearChassisPickupProposalMm':ARM_PICKUPS_MM,
        'uprightBoreRadiusMm':UPRIGHT_BORE_RADIUS_MM,
        'fitToleranceCertification':False,'chassisHardpointsMeasured':False,
        'mechanicalMateCertified':False,'dynamicSuspensionCertified':False,
        'nativeStaticAudit':audit,
        'profiles':profiles,
        'notYetVerified':[
          'Rear chassis pickup locations/geometry vs owner Model B and real chassis',
          'Bolted joint retention, torque, bearing preload, and clearance stackups',
          'Coupled bump/toe/roll kinematics and dynamic interference',
          'Real rear driveshaft/CV/gearbox interfaces and loads/stress/fatigue',
          'P2.8 original wheel-end and P2.10 complete B-Rep cross-source fit',
          'FIA rules and any F1 manufacturer authenticity',
        ],
    }
    (out/'P210_rear_suspension_manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    (out/'P210_rear_suspension_static_audit.json').write_text(json.dumps(audit,indent=2)+'\n')
    return manifest

if __name__=='__main__':
    cli=argparse.ArgumentParser()
    cli.add_argument('--out',type=Path,required=True)
    opts=cli.parse_args()
    manifest=build(opts.out)
    print('P2.10 PASS',manifest['totalCadSolids'],'STEP solids',
          manifest['newSolids'],'new solids',
          {k:v['triangles'] for k,v in manifest['profiles'].items()},
          'native static pairs:',manifest['nativeStaticAudit']['pairCount'])
