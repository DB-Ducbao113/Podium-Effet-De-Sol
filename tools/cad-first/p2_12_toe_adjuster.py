#!/usr/bin/env python3
"""P2.12: independently authored opposing-hand rear toe-adjuster CAD proposal.

REPLACES, not overlays, P2.11's fixed-length toe rod with 5 individual solids:
outer RH helical rod end, inner LH helical rod end, hollow adjuster sleeve and
two separate hex locknuts. Female sleeve profile is a circular bore with
clearance, NOT load-bearing internal threads or a validated adjuster mechanism.
Chassis hardpoints are preliminary; source CAD STEP mm and GLB metres.
"""
from __future__ import annotations
import argparse, hashlib, json, math
from pathlib import Path
import numpy as np
import cadquery as cq
import trimesh
from p2_10_rear_wishbone import QUALITY, exact_static_audit
from p2_11_rear_toe_link import (
    IDS as TOE_211_IDS, all_parts as p211_all_parts,
    TOE_OUTER_EYE_MM, TOE_INNER_EYE_MM,
    ring as eye_ring, RADIUS_MM as P211_RADIUS,
)

SCHEMA='podium-eds.p2.cad-first.rear-toe-adjuster-threaded.v3'
PARTS={
    'outer':'P212_TOE_OUTER_RIGHT_HAND_THREADED_ROD_END',
    'inner':'P212_TOE_INNER_LEFT_HAND_THREADED_ROD_END',
    'sleeve':'P212_TOE_TURNBUCKLE_HOLLOW_SLEEVE',
    'outerNut':'P212_TOE_OUTER_HEX_LOCKNUT',
    'innerNut':'P212_TOE_INNER_HEX_LOCKNUT',
}
A=np.asarray(TOE_OUTER_EYE_MM,dtype=float)
B=np.asarray(TOE_INNER_EYE_MM,dtype=float)
D=(B-A)/np.linalg.norm(B-A)
LINK_LENGTH_MM=float(np.linalg.norm(B-A))
SLEEVE_START_MM=56.0
SLEEVE_END_MM=112.0
OUTER_ROD_END_MM=80.0
INNER_ROD_START_MM=88.0
OUTER_NUT_RANGE_MM=(47.5,53.5)
INNER_NUT_RANGE_MM=(114.5,120.5)
ROD_R_MM=8.85
THREAD_PITCH_MM=2.0
THREAD_CREST_R_MM=9.62
SLEEVE_BORE_R_MM=9.05
SLEEVE_BODY_R_MM=15.2
FEMALE_GROOVE_MAJOR_R_MM=10.08
FEMALE_GROOVE_HALF_WIDTH_MM=.60
MALE_OUTER_START_MM=45.0
MALE_INNER_START_MM=99.0
MALE_THREAD_HEIGHT_MM=24.0
THREAD_RUNOUT_RADIUS_MM=10.12
THREAD_RUNOUT_INTERVALS_MM=((56.,58.5),(77.5,80.),(88.,90.5),(109.3,112.))

def sha(path:Path)->str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

def v(point):
    return cq.Vector(*[float(x) for x in point])

def pos(s:float):
    return A+D*s

def cylinder_segment(s0:float,s1:float,radius:float)->cq.Shape:
    return cq.Solid.makeCylinder(radius,s1-s0,v(pos(s0)),v(D))

def on_axis(shape:cq.Shape,s0:float)->cq.Shape:
    """Rotate source +Z into the rod axis. Never reflect threaded geometry."""
    z=np.array([0.,0.,1.])
    cr=np.cross(z,D)
    angle=math.degrees(math.acos(float(np.clip(np.dot(z,D),-1.,1.))))
    if np.linalg.norm(cr)>1e-9:
        shape=shape.rotate((0,0,0),tuple(cr/np.linalg.norm(cr)),angle)
    elif D[2]<0:
        shape=shape.rotate((0,0,0),(1,0,0),180)
    return shape.translate(tuple(pos(s0)))

def male_helix(s0:float,height:float,left_hand:bool)->cq.Shape:
    """Native swept external crest only; no full female thread engagement."""
    radius=ROD_R_MM
    wire=cq.Wire.makeHelix(THREAD_PITCH_MM,height,radius,lefthand=left_hand)
    profile=(cq.Workplane('XZ')
        .polyline([(radius-.22,-.36),(THREAD_CREST_R_MM,.0),(radius-.22,.36)])
        .close())
    crest=profile.sweep(wire,isFrenet=True).val()
    return on_axis(crest,s0)

def rod_end(outer:bool)->cq.Shape:
    if outer:
        eye=TOE_OUTER_EYE_MM
        shank=cylinder_segment(0.,OUTER_ROD_END_MM,ROD_R_MM)
        ridge=male_helix(MALE_OUTER_START_MM,MALE_THREAD_HEIGHT_MM,False)
    else:
        eye=TOE_INNER_EYE_MM
        shank=cylinder_segment(INNER_ROD_START_MM,LINK_LENGTH_MM,ROD_R_MM)
        ridge=male_helix(MALE_INNER_START_MM,MALE_THREAD_HEIGHT_MM,True)
    body=shank.fuse(eye_ring(eye,P211_RADIUS['eyeOuter'],P211_RADIUS['eyeBore'],16.))
    body=body.fuse(ridge)
    x,y,z=eye
    drill=cq.Solid.makeCylinder(P211_RADIUS['eyeBore'],90,cq.Vector(x,y,z-45),cq.Vector(0,0,1))
    return body.cut(drill).clean()

def female_groove(start:float,height:float,left_hand:bool)->cq.Shape:
    """True native swept internal V-groove; deliberate manufacturing tolerance HOLD."""
    helix=cq.Wire.makeHelix(THREAD_PITCH_MM,height,SLEEVE_BORE_R_MM,
                            lefthand=left_hand)
    section=(cq.Workplane('XZ').polyline([
      (SLEEVE_BORE_R_MM-.27,-FEMALE_GROOVE_HALF_WIDTH_MM),
      (FEMALE_GROOVE_MAJOR_R_MM,0),
      (SLEEVE_BORE_R_MM-.27,FEMALE_GROOVE_HALF_WIDTH_MM),
    ]).close())
    return on_axis(section.sweep(helix,isFrenet=True).val(),start)

def sleeve()->cq.Shape:
    blank=cylinder_segment(SLEEVE_START_MM,SLEEVE_END_MM,SLEEVE_BODY_R_MM).cut(
      cylinder_segment(SLEEVE_START_MM-.5,SLEEVE_END_MM+.5,SLEEVE_BORE_R_MM))
    # Simultaneous OCCT subtraction is required: sequential groove cuts have
    # produced an invalid B-Rep on this source in a prior local check.
    grooves=cq.Compound.makeCompound([
      female_groove(57.0,22.0,False),
      female_groove(89.0,22.0,True),
    ])
    threaded=blank.cut(grooves).clean()
    # Cut axial thread runouts separately after both helical grooves.
    # Combining all cutters at once produced invalid topology in a source trial.
    runouts=cq.Compound.makeCompound([
      cylinder_segment(start,end,THREAD_RUNOUT_RADIUS_MM)
      for start,end in THREAD_RUNOUT_INTERVALS_MM])
    result=threaded.cut(runouts).clean()
    material_removed=blank.Volume()-result.Volume()
    if not result.isValid() or len(result.Solids())!=1 or not 1100<material_removed<1450:
        raise ValueError('Female sleeve grooves and end runouts must be a valid connected B-Rep')
    return result

def hex_nut(s0:float,s1:float,left_hand:bool)->cq.Shape:
    blank=cq.Workplane('XY').polygon(6,33).extrude(s1-s0).val()
    bore=cq.Solid.makeCylinder(SLEEVE_BORE_R_MM,s1-s0+2,
                               cq.Vector(0,0,-1),cq.Vector(0,0,1))
    nut=on_axis(blank.cut(bore).clean(),s0)
    # Groove starts at pitch-aligned phases: RH s47 (male s45);
    # LH s115 (male s89). Neither nut uses a fake smooth hole.
    # Keep pitch phase fixed to male crest origins. The nut bodies start
    # 0.5 mm INSIDE the cutter's helical span, avoiding open-cut end clash.
    groove_start=47.0 if not left_hand else 115.0
    result=nut.cut(female_groove(groove_start,6.0,left_hand)).clean()
    if not result.isValid() or len(result.Solids())!=1 or nut.Volume()-result.Volume()<40:
        raise ValueError('Locknut native female thread Boolean failed')
    return result

def build_new_parts()->dict[str,cq.Shape]:
    parts={
        PARTS['outer']:rod_end(True),
        PARTS['inner']:rod_end(False),
        PARTS['sleeve']:sleeve(),
        PARTS['outerNut']:hex_nut(*OUTER_NUT_RANGE_MM,False),
        PARTS['innerNut']:hex_nut(*INNER_NUT_RANGE_MM,True),
    }
    for name,solid in parts.items():
        if solid.isNull() or not solid.isValid() or solid.Volume()<=0 or len(solid.Solids())!=1:
            raise ValueError('Invalid independent P2.12 B-Rep: '+name)
    return parts

def sample_isolated_thread_motion(parts:dict[str,cq.Shape])->dict:
    """Six exact B-Rep checks of free RH/LH rod relative to rotated sleeve.

    This is NOT full chassis toe motion or load-path certification.
    """
    tests=[]
    sleeve_body=parts[PARTS['sleeve']]
    for angle in (-90,0,90):
        turned=sleeve_body.rotate(tuple(A),tuple(A+D),angle)
        travel=THREAD_PITCH_MM*angle/360.
        for label,shift in (('outer',-travel),('inner',travel)):
            male=parts[PARTS[label]].translate(tuple(D*shift))
            volume=turned.intersect(male).Volume()
            tests.append({'sleeveAngleDeg':angle,'rodEnd':label,
                          'rodAxialTranslationMm':round(shift,5),
                          'positiveOverlapMm3':round(volume,6)})
            if not np.isfinite(volume) or volume>.05:
                raise ValueError('P2.12 thread pair limited-sweep collision: '+str(tests[-1]))
    return {'sampleCount':len(tests),'samples':tests,
            'maximumPositiveOverlapMm3':max(r['positiveOverlapMm3'] for r in tests),
            'threadPairsPassLimitedSweep':True,
            'anglesDeg':[-90,0,90],
            'totalTheoreticalEyeSpanChangePerRevolutionMm':2*THREAD_PITCH_MM,
            'chassisToeKinematicsCertified':False,
            'fullDynamicAssemblyInterferenceTested':False}

def all_parts()->dict[str,cq.Shape]:
    prior=p211_all_parts()
    replaced=prior.pop(TOE_211_IDS['link'])
    if replaced.isNull() or len(prior)!=14:
        raise RuntimeError('P2.11 original fixed rod replacement lineage mismatch')
    result={**prior,**build_new_parts()}
    if len(result)!=19:raise RuntimeError('P2.12 must contain 19 independent solids')
    return result

def export_glb(parts:dict[str,cq.Shape],path:Path,linear:float,angular:float)->dict:
    scene=trimesh.Scene();counts={}
    for name,part in parts.items():
        vertices,faces=part.tessellate(linear,angular)
        mesh=trimesh.Trimesh(
            vertices=np.array([[p.x,p.y,p.z] for p in vertices],dtype=np.float64)/1000,
            faces=np.array(faces,dtype=np.int32),process=False)
        mesh.merge_vertices(digits_vertex=7)
        if not mesh.is_watertight or not mesh.is_winding_consistent or len(mesh.faces)<4:
            raise ValueError('P2.12 GLB seam/winding failure: '+name)
        if 'P212_' in name:
            color=([208,181,126,255] if 'NUT' in name else
                   [102,133,145,255] if 'SLEEVE' in name else [180,196,211,255])
        elif 'BUSHING' in name:color=[170,139,91,255]
        else:color=[108,123,136,255]
        mesh.visual=trimesh.visual.TextureVisuals(material=trimesh.visual.material.PBRMaterial(
            name=name,baseColorFactor=color,metallicFactor=.74,roughnessFactor=.33,doubleSided=True))
        scene.add_geometry(mesh,node_name=name,geom_name=name)
        counts[name]=len(mesh.faces)
    path.write_bytes(scene.export(file_type='glb'))
    return {'triangles':sum(counts.values()),'perPartTriangles':counts,'allNodesWatertight':True}

def build(out:Path)->dict:
    if out.exists() and any(out.iterdir()):
        raise FileExistsError('P2.12 export directory must be empty')
    out.mkdir(parents=True,exist_ok=True)
    parts=all_parts()
    audit=exact_static_audit(parts)
    (out/'P212_rear_adjuster_static_audit.json').write_text(json.dumps(audit,indent=2)+'\n')
    if not audit['passStatic'] or audit['pairCount']!=171:
        raise RuntimeError('P2.12 native static B-Rep clearance gate HOLD')
    assembly=cq.Assembly(name='P212_REAR_TOE_ADJUSTER_STATIC_SOURCE')
    for name,part in parts.items():assembly.add(part,name=name)
    step=out/'P212_rear_toe_adjuster_static_master.step'
    assembly.save(str(step),exportType='STEP')
    roundtrip=cq.importers.importStep(str(step)).solids().vals()
    if len(roundtrip)!=19 or any(not x.isValid() or x.Volume()<=0 for x in roundtrip):
        raise RuntimeError('P2.12 native STEP 19-solid roundtrip failure')
    profiles={}
    for tier,(linear,angular) in QUALITY.items():
        glb=out/f'P212_rear_adjuster_{tier.lower()}.glb'
        row=export_glb(all_parts(),glb,linear,angular)
        profiles[tier]={**row,'file':glb.name,'bytes':glb.stat().st_size,'sha256':sha(glb)}
    tris=[profiles[tier]['triangles'] for tier in QUALITY]
    if not tris[0]>tris[1]>tris[2]:
        raise RuntimeError('P2.12 source LOD triangles not strictly descending')
    manifest={
        'schema':SCHEMA,
        'source':'Project-authored P2.9/P2.10/P2.11 lineage, P2.11 fixed rod replaced',
        'unitsCAD':'mm','unitsGLB':'m','partIds':list(parts),'sourcePartCount':19,
        'newPartIds':list(PARTS.values()),'newParts':5,
        'replacedPriorPartId':TOE_211_IDS['link'],
        'totalCadSolids':19,'masterSTEP':step.name,'masterSTEPsha256':sha(step),
        'toeEyeOuterMm':TOE_OUTER_EYE_MM,'toeEyeInnerMm':TOE_INNER_EYE_MM,
        'outerThreadHand':'RIGHT','innerThreadHand':'LEFT',
        'externalHelicalCrestsModelled':True,'pitchMm':THREAD_PITCH_MM,
        'maleThreadCrestRadiusMm':THREAD_CREST_R_MM,
        'femaleSleeveMinorRadiusMm':SLEEVE_BORE_R_MM,
        'femaleThreadMajorRadiusMm':FEMALE_GROOVE_MAJOR_R_MM,
        'femaleThreadGrooveDepthMm':FEMALE_GROOVE_MAJOR_R_MM-SLEEVE_BORE_R_MM,
        'rodRootRadialClearanceMm':SLEEVE_BORE_R_MM-ROD_R_MM,
        'threadCrestRadialClearanceMm':FEMALE_GROOVE_MAJOR_R_MM-THREAD_CREST_R_MM,
        'sleeveOppositeHandGroovesModelled':True,
        'bothLocknutFemaleGroovesModelled':True,
        'nominalThreadPhaseMatched':True,
        'threadedRodSpanMm':MALE_THREAD_HEIGHT_MM,
        'threadGeometryRevision':'P2.12-R3-BREP-LOCKNUT-ENGAGEMENT',
        'nominalNutThreadGrooveAxialPhaseMm':[47.0,115.0],
        'nominalNutBodyAxialRangesMm':[OUTER_NUT_RANGE_MM,INNER_NUT_RANGE_MM],
        'nominalSleeveNutAxialClearanceMm':2.5,
        'maleHelixStartMm':[MALE_OUTER_START_MM,MALE_INNER_START_MM],
        'threadRunoutsModelled':True,
        'threadRunoutRadiusMm':THREAD_RUNOUT_RADIUS_MM,
        'threadRunoutIntervalsMm':THREAD_RUNOUT_INTERVALS_MM,
        'isolatedThreadPairMotionEvidence':'separate 6-sample BRep sweep, not chassis dynamics',
        'sourceP28Modified':False,'modelBSourceModified':False,
        'actualChassisToeHardpointMeasured':False,
        'fullFemaleThreadProfileModelled':True,
        'mechanicalThreadEngagementCertified':False,
        'toeAdjustmentTravelCertified':False,'locknutTorqueCertified':False,
        'dynamicToeKinematicsCertified':False,'mechanicalMateCertified':False,
        'nativeStaticAudit':audit,'profiles':profiles,
        'notCertified':['Actual adjustable preload/engagement or mechanical retention',
          'Independent chassis hardpoint coordinates and 3D bump/roll/toe kinematics',
          'P2.8 wheel-end interface and rear drivetrain/gearbox',
          'FIA/F1 OEM authenticity'],
    }
    (out/'P212_rear_toe_adjuster_manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    return manifest

if __name__=='__main__':
    ap=argparse.ArgumentParser()
    ap.add_argument('--out',type=Path,required=True)
    a=ap.parse_args()
    m=build(a.out)
    print('P2.12',m['sourcePartCount'],'solids',m['nativeStaticAudit']['pairCount'],
          'native static pairs',{t:r['triangles'] for t,r in m['profiles'].items()},'G2 HOLD')
