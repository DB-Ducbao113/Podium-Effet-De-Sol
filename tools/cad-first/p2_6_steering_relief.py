#!/usr/bin/env python3
"""P2.6 ORIGINAL CAD: source-only ±8° sampled steering-relief B-Rep.

Do NOT market as genuine F1 or manufacturing-certified geometry.
HIGH/BALANCED are native CAD tessellations; PERFORMANCE is explicitly
CAD-derived VTK quadric decimation from HIGH to avoid OCCT cache stalls.
"""
import argparse,hashlib,json,math
from pathlib import Path
import numpy as np
import cadquery as cq
from p2_4_assembly_fit import make_fitted_parts,export_glb,QUALITY
from p2_6_steering_kinematics import pose as steer_pose,KINGPIN,TIE_OUTER,RACK_REST

LINKS=('P2_UPPER_WISHBONE_LINK','P2_LOWER_WISHBONE_LINK','P2_TIE_ROD')
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()

def move_tie(s,pose):
    a=TIE_OUTER
    target_a=np.array(pose['tieOuterWorldMm'])
    target_b=np.array(pose['rackAnchorMm'])
    v=(RACK_REST-a)/np.linalg.norm(RACK_REST-a)
    w=(target_b-target_a)/np.linalg.norm(target_b-target_a)
    axis=np.cross(v,w)
    theta=math.degrees(math.acos(np.clip(np.dot(v,w),-1,1)))
    if np.linalg.norm(axis)>1e-10:
        axis/=np.linalg.norm(axis)
        s=s.rotate(tuple(a),tuple(a+axis),theta)
    return s.translate(tuple(target_a-a))

def make_steering_parts():
    parts,_,_=make_fitted_parts()
    upright=parts['P2_UPRIGHT_BEARING_CARRIER']
    old_volume=upright.Volume()
    for deg in (-8,-4,0,4,8):
        motion=steer_pose(deg)
        for name in LINKS:
            rod=move_tie(parts[name],motion) if name=='P2_TIE_ROD' else parts[name]
            # Stationary rod envelope, projected to the upright's original
            # frame. Boolean cuts remove real CAD material, not PBR normals.
            cutter=rod.rotate(tuple(KINGPIN),tuple(KINGPIN+np.array([0.,1.,0.])),float(-deg))
            upright=upright.cut(cutter)
    if not upright.isValid() or len(upright.Solids())!=1 or upright.Volume()<0.9*old_volume:
        raise ValueError('Steering source relief invalid/disconnected')
    parts['P2_UPRIGHT_BEARING_CARRIER']=upright
    for name,solid in parts.items():
        if not solid.isValid() or solid.Volume()<=0 or len(solid.Solids())!=1:
            raise ValueError('Invalid source CAD: '+name)
    proof={'sampledReliefAnglesDeg':[-8,-4,0,4,8],
           'originalUprightVolumeMm3':round(old_volume,4),
           'remainingUprightVolumeMm3':round(upright.Volume(),4),
           'removedVolumeMm3':round(old_volume-upright.Volume(),4),
           'mechanicalCertification':False}
    return parts,proof

def prepare(folder):
    folder.mkdir(parents=True,exist_ok=True)
    parts,proof=make_steering_parts()
    assembly=cq.Assembly(name='P2_6_ORIGINAL_STEERING_RELIEF')
    for name,solid in parts.items():assembly.add(solid,name=name)
    master=folder/'P2_6_steering_mated_master.step'
    assembly.save(str(master),exportType='STEP')
    record={'schema':'podium-eds.p2.cad-first.steer-machined.v1',
      'unitsCAD':'mm','unitsGLB':'m',
      'sourceSTEP':master.name,'sourceSTEPsha256':sha(master),
      'parts':list(parts),'sourcePartCount':len(parts),
      'sourceReliefMachining':proof,'profiles':{},
      'notCertified':['continuous dynamic motion','suspension travel',
                      'load capacity','actual Formula 1 provenance']}
    (folder/'.P2_6_core.json').write_text(json.dumps(record,indent=2)+'\n')
    print('STEP',len(parts),'solids',proof)

def export_profile(folder,profile):
    out=folder/f'P2_6_steering_{profile.lower()}.glb'
    if profile=='PERFORMANCE':
        from p2_4_lod import create_lod
        original=folder/'P2_6_steering_high.glb'
        if not original.exists():raise FileNotFoundError('Export HIGH CAD before PERFORMANCE')
        faces=create_lod(original,out,'PERFORMANCE')
        method='CAD-derived VTK quadric decimation of HIGH (not independent B-Rep)'
    else:
        parts,_=make_steering_parts()
        faces=export_glb(parts,out,*QUALITY[profile])
        method='Native STEP B-Rep tessellation'
    row={'file':out.name,'sha256':sha(out),'bytes':out.stat().st_size,
         'totalTriangles':sum(faces.values()),'perPartTriangles':faces,'method':method}
    (folder/f'.P2_6_profile_{profile}.json').write_text(json.dumps(row,indent=2)+'\n')
    print('GLB',profile,row['totalTriangles'],out.stat().st_size)

def finalize(folder):
    record=json.loads((folder/'.P2_6_core.json').read_text())
    for profile in ('HIGH','BALANCED','PERFORMANCE'):
        row=json.loads((folder/f'.P2_6_profile_{profile}.json').read_text())
        out=folder/row['file']
        if not out.is_file() or sha(out)!=row['sha256'] or set(row['perPartTriangles'])!=set(record['parts']):
            raise ValueError('LOD checksum or source identities mismatch: '+profile)
        record['profiles'][profile]=row
    n=[record['profiles'][q]['totalTriangles'] for q in ('HIGH','BALANCED','PERFORMANCE')]
    if not n[0]>n[1]>n[2]:raise ValueError('Missing progressive LOD')
    (folder/'P2_6_steering_manifest.json').write_text(json.dumps(record,indent=2)+'\n')
    print('MANIFEST',n)

if __name__=='__main__':
    cli=argparse.ArgumentParser()
    cli.add_argument('--out',type=Path,required=True)
    a=cli.add_mutually_exclusive_group(required=True)
    a.add_argument('--init',action='store_true')
    a.add_argument('--profile',choices=['HIGH','BALANCED','PERFORMANCE'])
    a.add_argument('--finalize',action='store_true')
    opt=cli.parse_args()
    if opt.init:prepare(opt.out)
    elif opt.profile:export_profile(opt.out,opt.profile)
    else:finalize(opt.out)
