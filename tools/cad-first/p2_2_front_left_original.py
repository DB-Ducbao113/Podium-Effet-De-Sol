#!/usr/bin/env python3
"""P2.2 original illustrated formula front-left corner. Not certified F1 CAD.

Master B-Rep units mm, axle +Z outboard. GLB tessellation units metres.
49 standalone, named solids; tyre/rim, rotor, caliper, hub, upright,
bearings, suspension links, separate fasteners, real external helical stud.
All geometric dimensions are project-original educational choices.
No OEM provenance, tolerances or physical fitment certification.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path

import cadquery as cq
import numpy as np
import trimesh

QUALITY = {'HIGH':(.035,.095),'BALANCED':(.15,.25),'PERFORMANCE':(.45,.46)}

def wp(z=0):
    return cq.Workplane('XY').workplane(offset=z)

def annulus(inner,outer,z,height):
    return wp(z).circle(outer).circle(inner).extrude(height).val()

def cylinder(radius,z,height):
    return wp(z).circle(radius).extrude(height).val()

def at(shape,x=0,y=0,z=0):
    return shape.translate((x,y,z))

def ring_profile(points):
    # XZ local y maps to CAD global Z (wheel axle).
    return cq.Workplane('XZ').polyline(points).close().revolve(360,(0,0),(0,1)).val()

def bar_between(start,end,radius):
    delta=cq.Vector(*[end[i]-start[i] for i in range(3)])
    return cq.Solid.makeCylinder(radius,delta.Length,cq.Vector(*start),delta.normalized())

def make_parts():
    parts={}
    parts['P2_TYRE_SLICK_BODY']=ring_profile([
        (232,-149),(258,-157),(302,-151),(319,-138),(331,-104),(332,104),
        (323,136),(305,152),(257,157),(232,150),(235,122),(242,114),
        (254,108),(254,-108),(242,-114),(235,-122)])
    parts['P2_RIM_FORGED_BARREL']=ring_profile([
        (201,-125),(213,-136),(228,-137),(232,-128),(230,-119),(222,-109),
        (216,-100),(216,101),(222,113),(231,121),(233,133),(227,140),
        (208,136),(202,126),(199,99),(198,-97)])
    parts['P2_RIM_CENTRE_DISC']=annulus(22.5,69,50,17)
    for i in range(10):
        spoke=wp(48).polyline([
            (60,-10),(181,-19),(202,-15),(202,15),(181,19),(60,10)
        ]).close().extrude(19).edges('|Z').chamfer(1.4)
        parts[f'P2_RIM_SPOKE_{i+1:02d}']=spoke.val().rotate((0,0,0),(0,0,1),36*i)

    hub=cylinder(30,-163,218)
    hub=hub.fuse(cylinder(103,-48,20)).fuse(cylinder(64,29,22))
    parts['P2_WHEEL_HUB_SHAFT_FLANGE']=hub
    stud=cylinder(19.6,50,50)
    helix=cq.Wire.makeHelix(3.0,26.0,19.6).translate((0,0,67))
    thread=cq.Workplane('XZ').polyline([
        (19.54,66.0),(21.45,67.0),(19.54,68.0)
    ]).close().sweep(helix,isFrenet=True).val()
    parts['P2_CENTER_STUD_EXTERNAL_HELIX']=stud.fuse(thread)
    nut=wp(68).polygon(12,73).extrude(27).faces('>Z').edges().chamfer(1.2)
    nut=nut.cut(wp(67).circle(22.2).extrude(29))
    parts['P2_CENTER_LOCK_NUT_BORE']=nut.val()
    parts['P2_CENTER_LOCK_FACE_RING']=annulus(22.3,38.5,63,4)

    rotor=annulus(104,183,-79,15)
    hole=wp(-83).circle(3.7).extrude(24).val()
    for radius,count,phase in [(132,18,0),(158,26,.075)]:
        for i in range(count):
            angle=2*math.pi*i/count+phase
            rotor=rotor.cut(at(hole,radius*math.cos(angle),radius*math.sin(angle)))
    parts['P2_BRAKE_ROTOR_DRILLED_CARBON']=rotor
    parts['P2_BRAKE_ROTOR_HAT']=ring_profile([
        (42,-100),(70,-100),(82,-83),(104,-81),
        (104,-64),(93,-64),(75,-84),(42,-84)])
    caliperOutline=[(-52,125),(52,125),(62,147),(52,191),(34,201),(-34,201),(-52,191),(-62,147)]
    for name,z in [('P2_CALIPER_INBOARD_CASTING',-105),('P2_CALIPER_OUTBOARD_CASTING',-42)]:
        housing=wp(z).polyline(caliperOutline).close().extrude(15).edges('|Z').fillet(3)
        parts[name]=housing.val()
    for name,z in [('P2_BRAKE_PAD_INBOARD',-90),('P2_BRAKE_PAD_OUTBOARD',-62)]:
        parts[name]=wp(z).polyline([(-43,135),(43,135),(48,177),(-48,177)]).close().extrude(9).val()
    for sign in [-1,1]:
        parts[f'P2_CALIPER_BRIDGE_{"L" if sign<0 else "R"}']=at(
            cq.Workplane('XY').box(15,16,80).edges('|Z').chamfer(1.2).val(),
            41*sign,189,-67)

    parts['P2_BEARING_INNER_RACE']=annulus(31.1,44,-126,38)
    parts['P2_BEARING_OUTER_RACE']=annulus(56,69,-126,38)
    ball=cq.Workplane('XY').sphere(5.96).val()
    for k in range(12):
        theta=2*math.pi*k/12
        parts[f'P2_BEARING_BALL_{k+1:02d}']=at(ball,50*math.cos(theta),50*math.sin(theta),-107)

    upright=annulus(70.5,95,-145,74)
    ears=[]
    for y in [-137,137]:
        ears.append(at(cq.Workplane('XY').box(55,84,30).edges('|Z').chamfer(6).val(),-100,y,-121))
    ears.append(at(cq.Workplane('XY').box(38,48,30).edges('|Z').chamfer(4).val(),120,0,-121))
    for lug in ears:
        upright=upright.fuse(lug)
    for sign in [-1,1]:
        upright=upright.fuse(bar_between((-64,sign*65,-121),(-100,sign*127,-121),22))
    upright=upright.fuse(bar_between((85,0,-121),(119,0,-121),19))
    parts['P2_UPRIGHT_BEARING_CARRIER']=upright
    links=[
        ('P2_UPPER_WISHBONE_LINK',(-117,140,-122),(-355,225,-241),11),
        ('P2_LOWER_WISHBONE_LINK',(-117,-140,-122),(-360,-216,-248),13),
        ('P2_TIE_ROD',(123,0,-122),(-260,-49,-243),8)
    ]
    for name,a,b,r in links:
        parts[name]=bar_between(a,b,r).fuse(cq.Solid.makeSphere(r+5,cq.Vector(*a)))
    for j in range(6):
        theta=math.tau*j/6
        x,y=95*math.cos(theta),95*math.sin(theta)
        fastener=cylinder(4.6,-89,33).fuse(wp(-90).polygon(6,15).extrude(5).val())
        parts[f'P2_ROTOR_MOUNT_FASTENER_{j+1:02d}']=at(fastener,x,y)

    for name,shape in parts.items():
        if shape.isNull() or not shape.isValid() or shape.Volume()<=0 or len(shape.Solids())!=1:
            raise RuntimeError(f'Invalid or disconnected CAD solid: {name}')
    return parts

COLOR={
 'TYRE':([45,47,52,255],0,.91),'RIM':([93,101,112,255],.82,.32),
 'BRAKE':([70,73,76,255],.10,.83),'CALIPER':([155,49,46,255],.48,.41),
 'PAD':([69,69,66,255],.1,.88),'BEARING':([170,185,195,255],.83,.23),
 'UPRIGHT':([124,133,143,255],.76,.40),
 'FASTENER':([181,191,203,255],.84,.25),'LINK':([102,112,124,255],.76,.47)
}
def pbr(name):
    if 'TYRE' in name:return COLOR['TYRE']
    if 'RIM' in name:return COLOR['RIM']
    if 'BRAKE_ROTOR_DRILLED' in name:return COLOR['BRAKE']
    if 'BRAKE_PAD' in name:return COLOR['PAD']
    if 'CALIPER' in name:return COLOR['CALIPER']
    if 'BEARING' in name:return COLOR['BEARING']
    if 'UPRIGHT' in name:return COLOR['UPRIGHT']
    if 'LINK' in name or 'ROD' in name:return COLOR['LINK']
    return COLOR['FASTENER']

def export_glb(parts,target,linear,angular):
    scene=trimesh.Scene()
    counts={}
    for name,shape in parts.items():
        vertices,faces=shape.tessellate(linear,angular)
        points=np.asarray([[v.x,v.y,v.z] for v in vertices],dtype=np.float64)/1000
        mesh=trimesh.Trimesh(vertices=points,faces=np.asarray(faces,dtype=np.int32),process=False)
        if not len(mesh.faces):raise ValueError(f'Empty mesh {name}')
        rgba,metal,rough=pbr(name)
        mesh.visual=trimesh.visual.TextureVisuals(
            material=trimesh.visual.material.PBRMaterial(
                name=name+'_PBR',baseColorFactor=rgba,
                metallicFactor=metal,roughnessFactor=rough,doubleSided=True))
        scene.add_geometry(mesh,node_name=name,geom_name=name)
        counts[name]=len(mesh.faces)
    target.write_bytes(scene.export(file_type='glb'))
    return counts

def build(out):
    out.mkdir(parents=True,exist_ok=True)
    parts=make_parts()
    assembly=cq.Assembly(name='P2_FRONT_LEFT_ORIGINAL_CAD')
    for name,shape in parts.items():assembly.add(shape,name=name)
    step=out/'P2_front_left_CAD_master.step'
    assembly.save(str(step),exportType='STEP')
    manifest={
        'schema':'podium-eds.p2.cad-first.front-corner.v1',
        'name':'P2 Original formula-style front-left upright/brake/wheel reference',
        'unitsCAD':'mm','unitsGLB':'m','axleOutboardCADAxis':'+Z',
        'sourceRights':'Original generated CAD — project-authored; no third-party STEP meshes',
        'notCertified':[
            'Formula 1 OEM provenance','racing homologation',
            'female nut thread engagement','bearing tolerances','load/stress',
            'suspension kinematics'
        ],
        'mechanicalTruth':{
            'realSeparateBRepSolids':True,
            'realRotorThroughBores':True,
            'realExternalMaleHelix':True,
            'femaleThreadEngagementCertified':False,
            'productionSafe':False
        },
        'masterSTEP':step.name,
        'masterSTEPsha256':hashlib.sha256(step.read_bytes()).hexdigest(),
        'totalCadSolids':len(parts),
        'parts':[{'id':name,'volumeMm3':round(shape.Volume(),2),'faces':len(shape.Faces())}
                 for name,shape in parts.items()],
        'profiles':{}
    }
    for quality,(linear,angular) in QUALITY.items():
        # Open Cascade caches tessellation. Rebuild fresh B-Rep for every LOD.
        fresh=make_parts()
        glb=out/f'P2_front_left_{quality.lower()}.glb'
        counts=export_glb(fresh,glb,linear,angular)
        manifest['profiles'][quality]={
            'file':glb.name,'bytes':glb.stat().st_size,
            'sha256':hashlib.sha256(glb.read_bytes()).hexdigest(),
            'totalTriangles':sum(counts.values()),'perPartTriangles':counts,
            'linearToleranceMm':linear,'angularToleranceRad':angular
        }
    (out/'P2_front_left_manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    return manifest

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--out',required=True,type=Path)
    args=parser.parse_args()
    data=build(args.out)
    print(json.dumps({k:v['totalTriangles'] for k,v in data['profiles'].items()},indent=2))
