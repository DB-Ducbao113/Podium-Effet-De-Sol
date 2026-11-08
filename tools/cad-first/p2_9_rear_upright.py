#!/usr/bin/env python3
"""P2.9 rear upright FIRST original CAD proposal for Podium Effet De Sol.

Not a copy or a mirror of the P2.8 front upright. Independent one-piece B-Rep:
- open bearing carrier bore, 3 separately bored mounting clevis faces,
- joined load-path webs, negative-Z inboard placement.

Axle frame X forward, Y up, Z outboard. STEP mm, GLB m. The bore/ribs/
clevis dimensions are project-authored preliminary engineering choices,
NOT Model B hardpoint measurements, OEM F1 CAD, validated fits or kinematics.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import cadquery as cq
import numpy as np
import trimesh

SCHEMA='podium-eds.p2.cad-first.rear-upright-proposal.v1'
PART_ID='P29_REAR_UPRIGHT_BEARING_CARRIER_PROPOSAL'
AXIS='Z'
MM_PER_M=1000
# ORIGINAL, provisional hardpoints in rear-source wheel-local millimetres.
# Not inferred from exterior showroom surface or an FIA manufacturer drawing.
DATUMS_MM={
    'bearingAxisPoint':[0,0,-117],
    'upperClevisBore':[-110,142,-153],
    'lowerClevisBore':[-102,-144,-154],
    'toeClevisBore':[139,-24,-156],
}
BORE_RADIUS_MM={'bearing':71.5,'upper':8.2,'lower':8.2,'toe':7.2}
PROFILES={
    'HIGH':(.035,.09),
    'BALANCED':(.15,.25),
    'PERFORMANCE':(.45,.46),
}

def hash_file(path:Path)->str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

def cyl(radius:float,z0:float,height:float, x:float=0,y:float=0):
    return cq.Solid.makeCylinder(radius,height,cq.Vector(x,y,z0),cq.Vector(0,0,1))

def web(a:tuple[float,float,float],b:tuple[float,float,float],radius:float):
    v=cq.Vector(*(b[i]-a[i] for i in range(3)))
    return cq.Solid.makeCylinder(radius,v.Length,cq.Vector(*a),v.normalized())

def lug(center:list[float],length_x:float,length_y:float,height_z:float):
    return cq.Workplane('XY').box(length_x,length_y,height_z).edges('|Z').chamfer(3).val().translate(tuple(center))

def build_rear_upright()->cq.Shape:
    # Native, open central bore. The wheel and bearing remain separately owned
    # by P2.8; this file authors only the NEW rear carrier and mounting lugs.
    carrier=cyl(97,-150,76).cut(cyl(BORE_RADIUS_MM['bearing'],-151,78))
    # Face-to-face bearing support ribs sit inboard. No axle shaft is authored.
    endpoints=[
        ('upper',(-54,77,-113),DATUMS_MM['upperClevisBore'],18,51,42,44),
        ('lower',(-50,-77,-115),DATUMS_MM['lowerClevisBore'],19,55,43,45),
        ('toe',(88,-28,-117),DATUMS_MM['toeClevisBore'],17,43,40,43),
    ]
    for _,root,target,r,lx,ly,lz in endpoints:
        # The connecting web is fused BEFORE boring the lug; a pierced lug
        # remains part of the single upright B-Rep rather than a floating proxy.
        carrier=carrier.fuse(web(root,tuple(target),r))
        carrier=carrier.fuse(lug(target,lx,ly,lz))
    for key in ('upper','lower','toe'):
        x,y,z=DATUMS_MM[key+'ClevisBore']
        radius=BORE_RADIUS_MM[key]
        carrier=carrier.cut(cyl(radius,z-27,54,x,y))
    carrier=carrier.clean()
    if carrier.isNull() or not carrier.isValid() or len(carrier.Solids())!=1 or carrier.Volume()<=0:
        raise ValueError('Rear upright is not a single connected valid CAD solid')
    # Validate pierced mounting datum axes (not tolerances or clearances).
    for key in ('upper','lower','toe'):
        x,y,z=DATUMS_MM[key+'ClevisBore']
        probe=cyl(BORE_RADIUS_MM[key]*.65,z-26,52,x,y)
        # Each mounting hole must have no solid material along its central axis.
        if carrier.intersect(probe).Volume()>.02:
            raise ValueError('Rear upright bore obstructed at '+key)
    return carrier

def tessellate(part:cq.Shape,linear:float,angular:float):
    vertices,faces=part.tessellate(linear,angular)
    v=np.array([[p.x,p.y,p.z] for p in vertices],dtype=np.float64)/MM_PER_M
    f=np.array(faces,dtype=np.int32)
    mesh=trimesh.Trimesh(vertices=v,faces=f,process=False)
    # OCCT emits coincident seam vertices on adjacent CAD faces. Weld only
    # geometrically identical vertices at sub-micron rounding precision.
    mesh.merge_vertices(digits_vertex=7)
    if len(mesh.faces)==0 or not mesh.is_watertight or not mesh.is_winding_consistent:
        raise ValueError('Rear upright GLB mesh seam/winding integrity failure')
    mesh.visual=trimesh.visual.TextureVisuals(material=trimesh.visual.material.PBRMaterial(
        name=PART_ID,baseColorFactor=[155,163,170,255],metallicFactor=.78,
        roughnessFactor=.38,doubleSided=True))
    return mesh

def build(out:Path)->dict:
    if out.exists() and any(out.iterdir()):
        raise FileExistsError('Refusing to overwrite rear upright evidence in '+str(out))
    out.mkdir(parents=True,exist_ok=True)
    part=build_rear_upright()
    step=out/'P29_rear_upright_proposal.step'
    assembly=cq.Assembly(name='P29_INDEPENDENT_REAR_UPRIGHT_PROPOSAL')
    assembly.add(part,name=PART_ID)
    assembly.save(str(step),exportType='STEP')
    imported=cq.importers.importStep(str(step)).solids().vals()
    if len(imported)!=1 or not imported[0].isValid() or imported[0].Volume()<=0:
        raise RuntimeError('P2.9 STEP roundtrip invalid')
    profile_data={}
    for quality,(linear,angular) in PROFILES.items():
        # Rebuild CAD before tessellating; prevent OpenCascade mesh cache LOD drift.
        mesh=tessellate(build_rear_upright(),linear,angular)
        scene=trimesh.Scene()
        scene.add_geometry(mesh,node_name=PART_ID,geom_name=PART_ID)
        path=out/('P29_rear_upright_'+quality.lower()+'.glb')
        path.write_bytes(scene.export(file_type='glb'))
        profile_data[quality]={
            'file':path.name,'sha256':hash_file(path),'bytes':path.stat().st_size,
            'meshNodes':[PART_ID],'triangles':len(mesh.faces),
            'linearToleranceMm':linear,'angularToleranceRad':angular,
            'tessellationWatertight':bool(mesh.is_watertight),
        }
    manifest={
        'schema':SCHEMA,'partId':PART_ID,
        'cadSourceNature':'Original independent rear-upright proposal, not a P2.8 front copy',
        'unitsCAD':'mm','unitsGLB':'m','axleAxis':AXIS,'inboardDirection':'-Z',
        'sourceFrameOrigin':'rear wheel axle centre, P2.8 local frame (not showroom origin)',
        'masterSTEP':step.name,'masterSTEPsha256':hash_file(step),
        'roundtripSolids':1,'volumeMm3':part.Volume(),
        'boundsMm':[part.BoundingBox().xmin,part.BoundingBox().xmax,
                    part.BoundingBox().ymin,part.BoundingBox().ymax,
                    part.BoundingBox().zmin,part.BoundingBox().zmax],
        'datumHardpointsMm':DATUMS_MM,
        'mountingBoreRadiusMm':BORE_RADIUS_MM,
        'sourceP28WheelGeometryModified':False,
        'independentActualRearWishbonesAvailable':False,
        'actualRearChassisHardpointsMeasured':False,
        'mechanicalMatingCertified':False,
        'limitations':[
            'Rear upright geometry and hardpoints are an original engineering proposal only',
            'No actual chassis pick-up points or 2026 regulations clearance verification',
            'P2.8 rear wheel-end copy is temporary graphics, NOT a certified rear wheel assembly',
            'Brake, drive shaft, CV, steering/toe, suspension joints and loads not validated',
            'Cross-part STEP Boolean clearance, dynamic bump, fatigue and bearing fit HOLD',
        ],
        'profiles':profile_data,
    }
    (out/'P29_rear_upright_manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    return manifest

if __name__=='__main__':
    ap=argparse.ArgumentParser()
    ap.add_argument('--out',required=True,type=Path)
    args=ap.parse_args()
    m=build(args.out)
    print('REAR UPRIGHT NATIVE CAD; G2 HOLD',m['roundtripSolids'],{k:v['triangles'] for k,v in m['profiles'].items()})
