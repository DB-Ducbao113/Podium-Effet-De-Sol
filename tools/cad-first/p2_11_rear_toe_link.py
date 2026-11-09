#!/usr/bin/env python3
"""P2.11: project-authored independent rear toe-control link CAD proposal.

Grounded only to P2.9 toe-lug source datum, NOT an inferred chassis hardpoint.
P2.9 + P2.10 CAD are reused unmodified. Native STEP mm / GLB m.
Static fit only, not a coupled kinematics, rear steering or load-path certificate.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
from typing import Any

import cadquery as cq
import numpy as np
import trimesh

from p2_9_rear_upright import DATUMS_MM as P29_DATUMS
from p2_10_rear_wishbone import (
    REAR_UPRIGHT_ID, QUALITY, build_rear_upright, build_parts as build_p210,
    exact_static_audit, cylinder, vector,
)

SCHEMA='podium-eds.p2.cad-first.rear-toe-link-static-proposal.v1'
OUTER_UPRIGHT_DATUM_MM=P29_DATUMS['toeClevisBore']
TOE_OUTER_EYE_MM=[OUTER_UPRIGHT_DATUM_MM[0],OUTER_UPRIGHT_DATUM_MM[1],OUTER_UPRIGHT_DATUM_MM[2]-43.]
# A proposed free/chassis-side pickup, NOT derived from an engineering chassis.
TOE_INNER_EYE_MM=[236.,-69.,-328.]
RADIUS_MM={
  'eyeOuter':20.2,'eyeBore':12.0,'bearingOuter':11.6,
  'bearingBore':7.65,'pinShaft':6.95,'pinHead':10.3,
  'shaftOuter':10.5,'shaftBore':4.8,
}
IDS={
  'link':'P211_REAR_TOE_LINK_TUBULAR_FORGED',
  'outerBearing':'P211_REAR_TOE_OUTER_BEARING_PROPOSAL',
  'innerBearing':'P211_REAR_TOE_INNER_BEARING_PROPOSAL',
  'pin':'P211_REAR_TOE_OUTER_CLEVIS_PIN',
}

def sha(file:Path)->str:
    return hashlib.sha256(file.read_bytes()).hexdigest()

def ring(center:list[float],outer:float,inner:float,height:float)->cq.Shape:
    x,y,z=map(float,center)
    return cylinder(outer,z-height/2,height,x,y).cut(
        cylinder(inner,z-height/2-1,height+2,x,y))

def hollow_beam(start:list[float],end:list[float],outer:float,inner:float)->cq.Shape:
    a=np.asarray(start,dtype=float); b=np.asarray(end,dtype=float)
    axis=b-a;length=float(np.linalg.norm(axis)); unit=vector(axis/length)
    shell=cq.Solid.makeCylinder(outer,length,vector(a),unit)
    bore=cq.Solid.makeCylinder(inner,length+2,vector(a-unit.toTuple()),unit)
    return shell.cut(bore)

def build_parts()->dict[str,cq.Shape]:
    outer=TOE_OUTER_EYE_MM; inner=TOE_INNER_EYE_MM
    # Forge one connected hollow cross-axis tube, with two separately bored eyes.
    link=hollow_beam(outer,inner,RADIUS_MM['shaftOuter'],RADIUS_MM['shaftBore'])
    for eye in (outer,inner):
        link=link.fuse(ring(eye,RADIUS_MM['eyeOuter'],RADIUS_MM['eyeBore'],16.))
    # Re-machine after all unions so tube endcaps can never obstruct joint bores.
    for eye in (outer,inner):
        x,y,z=eye
        link=link.cut(cylinder(RADIUS_MM['eyeBore'],z-40,80,x,y))
    link=link.clean()
    # Annular inserts separate from the rod eye and radial pin axis.
    outerBearing=ring(outer,RADIUS_MM['bearingOuter'],RADIUS_MM['bearingBore'],13.)
    innerBearing=ring(inner,RADIUS_MM['bearingOuter'],RADIUS_MM['bearingBore'],13.)
    x,y,z=OUTER_UPRIGHT_DATUM_MM
    # Through-shaft spans the upright lug and the detached inboard rod eye.
    shank=cylinder(RADIUS_MM['pinShaft'],z-66,89,x,y)
    head=cylinder(RADIUS_MM['pinHead'],z-70,4,x,y)
    pin=shank.fuse(head).clean()
    parts={IDS['link']:link,IDS['outerBearing']:outerBearing,
           IDS['innerBearing']:innerBearing,IDS['pin']:pin}
    for name,shape in parts.items():
        if shape.isNull() or not shape.isValid() or len(shape.Solids())!=1 or shape.Volume()<=0:
            raise ValueError('P2.11 disconnected or invalid source CAD: '+name)
    return parts

def all_parts():
    return {REAR_UPRIGHT_ID:build_rear_upright(),**build_p210(),**build_parts()}

def export_glb(parts:dict[str,cq.Shape],file:Path,linear:float,angular:float)->dict[str,Any]:
    scene=trimesh.Scene();faces={}
    for name,shape in parts.items():
        points,triangles=shape.tessellate(linear,angular)
        mesh=trimesh.Trimesh(vertices=np.asarray([[v.x,v.y,v.z] for v in points],dtype=np.float64)/1000,
                             faces=np.asarray(triangles,dtype=np.int32),process=False)
        mesh.merge_vertices(digits_vertex=7)
        if not len(mesh.faces) or not mesh.is_watertight or not mesh.is_winding_consistent:
            raise ValueError('P2.11 watertight GLB source failure: '+name)
        if name.startswith('P211_'):
            if 'BEARING' in name:rgba,metal,rough=[184,195,203,255],.79,.27
            elif 'PIN' in name:rgba,metal,rough=[190,199,210,255],.84,.22
            else:rgba,metal,rough=[77,107,121,255],.72,.36
        elif 'BUSHING' in name:rgba,metal,rough=[164,131,85,255],.65,.44
        elif 'BEARING' in name:rgba,metal,rough=[188,195,205,255],.78,.26
        else:rgba,metal,rough=[90,106,119,255],.68,.42
        mesh.visual=trimesh.visual.TextureVisuals(material=trimesh.visual.material.PBRMaterial(
            name=name,baseColorFactor=rgba,metallicFactor=metal,roughnessFactor=rough,doubleSided=True))
        scene.add_geometry(mesh,node_name=name,geom_name=name)
        faces[name]=int(len(mesh.faces))
    file.write_bytes(scene.export(file_type='glb'))
    return {'triangles':sum(faces.values()),'perPartTriangles':faces,'allNodesWatertight':True}

def build(out:Path)->dict[str,Any]:
    if out.exists() and any(out.iterdir()):
        raise FileExistsError('Refusing to overwrite existing P2.11 CAD evidence')
    out.mkdir(parents=True,exist_ok=True)
    parts=all_parts()
    audit=exact_static_audit(parts)
    (out/'P211_rear_toe_static_audit.json').write_text(json.dumps(audit,indent=2)+'\n')
    if len(parts)!=15 or audit['pairCount']!=105 or not audit['passStatic']:
        raise RuntimeError('P2.11 native 15-body 105-pair B-Rep gate FAIL')
    assembly=cq.Assembly(name='P211_INDEPENDENT_REAR_UPRIGHT_WISHBONE_TOE_STATIC_PROPOSAL')
    for name,body in parts.items():assembly.add(body,name=name)
    step=out/'P211_rear_toe_static_master.step'
    assembly.save(str(step),exportType='STEP')
    roundtrip=cq.importers.importStep(str(step)).solids().vals()
    if len(roundtrip)!=15 or any(not x.isValid() or x.Volume()<=0 for x in roundtrip):
        raise RuntimeError('P2.11 STEP roundtrip failed')
    profiles={}
    for tier,(linear,angular) in QUALITY.items():
        file=out/f'P211_rear_toe_{tier.lower()}.glb'
        row=export_glb(all_parts(),file,linear,angular)
        profiles[tier]={'file':file.name,'bytes':file.stat().st_size,'sha256':sha(file),**row}
    tris=[profiles[k]['triangles'] for k in QUALITY]
    if not tris[0]>tris[1]>tris[2]:raise RuntimeError('P2.11 progressive LOD gate failed')
    record={
      'schema':SCHEMA,'cadSourceNature':'Original independent rear toe link, project-engineered proposal',
      'unitsCAD':'mm','unitsGLB':'m','coordinateFrame':'rear wheel local, X forward Y up +Z outboard',
      'P29ExistingToelugDatumMm':OUTER_UPRIGHT_DATUM_MM,
      'P211OuterEyeMm':TOE_OUTER_EYE_MM,'P211InnerChassisProposalMm':TOE_INNER_EYE_MM,
      'actualChassisToeHardpointMeasured':False,
      'rootP28SourceModified':False,'modelBSourceModified':False,
      'nativeStaticAudit':audit,
      'newP211Parts':list(IDS.values()),'newSolids':4,'sourceP29P210P211PartIds':list(parts),
      'totalCadSolids':15,'masterSTEP':step.name,'masterSTEPsha256':sha(step),
      'mechanicalMateCertified':False,'dynamicToeKinematicsCertified':False,
      'toeAdjustabilityCertified':False,'jointRetentionCertified':False,
      'profiles':profiles,
      'notYetVerified':[
        'actual chassis toe pickup, axial pin retention and tolerance stacks',
        'coupled 3D bump/toe/camber, stresses, realistic spherical bearing articulation',
        'cross-source original P2.8 wheel/brake/shaft clearance',
        'real rear gearbox, axle and driveshaft support architecture',
        'original Model B structural chassis contact and F1 manufacturer authenticity',
      ]
    }
    (out/'P211_rear_toe_manifest.json').write_text(json.dumps(record,indent=2)+'\n')
    return record

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--out',type=Path,required=True)
    args=p.parse_args()
    r=build(args.out)
    print('P2.11 original rear toe: ',r['totalCadSolids'],'STEP solids',
          r['nativeStaticAudit']['pairCount'],'B-Rep pairs',
          {p:e['triangles'] for p,e in r['profiles'].items()},'G2 HOLD')
