#!/usr/bin/env python3
"""Native P2.7 SUBASSEMBLY audit; does not certify full P2.6 front corner.

A-arm rotation is around fixed chassis-side Z pivot axes. Studs translate
with their independently solved outer joint centers. Chassis bushings stay
anchored. Checks all 28 unique pairs at 31 discrete ±15mm bump positions.
"""
import argparse,json,math
from pathlib import Path
import cadquery as cq
import numpy as np
import trimesh
from p2_7_wishbone_cad import build_parts,sha

THRESHOLD_MM3=.05
def audit(folder):
    manifest=json.loads((folder/'P27_wishbone_manifest.json').read_text())
    source=folder/manifest['masterSTEP']
    if sha(source)!=manifest['masterSTEPsha256']:
        raise ValueError('STEP source digest mismatch')
    imported=cq.importers.importStep(str(source)).solids().vals()
    if len(imported)!=8 or any(not solid.isValid() or solid.Volume()<=0 for solid in imported):
        raise ValueError('P2.7 source STEP B-Rep failed to re-import')
    parts=build_parts()
    if set(parts)!=set(manifest['partIds']):raise ValueError('Named source solids differ')
    candidates=0;collisions=[];boolean_errors=[];results=[]
    for pose in manifest['poses']:
        transformed={}
        for name,solid in parts.items():
            upper='UPPER' in name
            old_outer=np.array([-98.,114. if upper else -114.,-170.])
            center=np.array([-370.,190. if upper else -190.,-260.])
            new_outer=np.array(pose['upperOuterMm' if upper else 'lowerOuterMm'])
            direction=old_outer[:2]-center[:2]
            final_direction=new_outer[:2]-center[:2]
            angle=math.degrees(math.atan2(
                float(np.linalg.det(np.vstack([direction,final_direction]))),
                float(np.dot(direction,final_direction))))
            if '_A_ARM_' in name:
                moved=solid.rotate(tuple(center),tuple(center+[0,0,1]),angle)
            elif '_OUTER_JOINT_' in name:
                moved=solid.translate(tuple(new_outer-old_outer))
            else:
                moved=solid
            transformed[name]=moved
        names=list(transformed);checks=0;errors_here=0
        for i,a in enumerate(names):
            for b in names[i+1:]:
                one=transformed[a].BoundingBox();two=transformed[b].BoundingBox()
                overlap=all(
                    min(getattr(one,axis+'max'),getattr(two,axis+'max'))-
                    max(getattr(one,axis+'min'),getattr(two,axis+'min'))>0.00001
                    for axis in 'xyz')
                if not overlap:continue
                candidates+=1;checks+=1
                try:
                    volume=transformed[a].intersect(transformed[b]).Volume()
                    if not math.isfinite(volume):raise ValueError('Nonfinite volume')
                    if volume>THRESHOLD_MM3:
                        collisions.append({'bumpMm':pose['lowerBumpMm'],
                            'a':a,'b':b,'overlapMm3':round(volume,5)})
                except Exception as e:
                    errors_here+=1
                    boolean_errors.append({'bumpMm':pose['lowerBumpMm'],
                        'a':a,'b':b,'reason':str(e)})
        results.append({'bumpMm':pose['lowerBumpMm'],
            'exactBrepChecks':checks,'booleanErrors':errors_here})
    for tier in ('HIGH','BALANCED','PERFORMANCE'):
        info=manifest['profiles'][tier];file=folder/info['file']
        if sha(file)!=info['sha256']:raise ValueError(tier+' GLB SHA mismatch')
        scene=trimesh.load(file,force='scene')
        if set(scene.graph.nodes_geometry)!=set(parts):
            raise ValueError(tier+' semantic part count mismatch')
        faces=sum(len(mesh.faces) for mesh in scene.geometry.values())
        if faces!=info['totalTriangles']:raise ValueError(tier+' triangle mismatch')
    return {
        'schema':'podium-eds.p2.cad-first.wishbone-audit.v1',
        'masterSTEPsha256':manifest['masterSTEPsha256'],
        'totalCadSolids':len(imported),
        'cadFaces':sum(len(s.Faces()) for s in imported),
        'sampledBumpPoses':len(results),
        'totalPotentialPairs':len(results)*28,
        'exactBrepChecks':candidates,
        'overlapThresholdMm3':THRESHOLD_MM3,
        'collisions':collisions,'booleanErrors':boolean_errors,
        'sampledPoseResults':results,
        'subassemblySampledPass':not collisions and not boolean_errors,
        'wholeCornerMechanicalFitCertified':False,
        'sourceP26Integrated':False,
        'continuousBumpSteeringCouplingCertified':False,
    }
if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--folder',required=True,type=Path)
    args=parser.parse_args()
    result=audit(args.folder)
    (args.folder/'P27_wishbone_audit.json').write_text(
        json.dumps(result,indent=2)+'\n')
    print('P2.7 sampled 8-solid subassembly:',
        'PASS' if result['subassemblySampledPass'] else 'FAIL',
        'at',result['sampledBumpPoses'],'poses;',
        result['exactBrepChecks'],'Boolean intersections')
