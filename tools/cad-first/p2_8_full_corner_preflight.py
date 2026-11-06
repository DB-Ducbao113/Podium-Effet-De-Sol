#!/usr/bin/env python3
"""P2.8 honest P2.7→P2.6 neutral-pose integration PRE-FLIGHT, NOT final fit.

Source-owned P2.7 A-arms and studs are compared against all P2.6 corner solids
except the obsolete upper/lower straight links that they would replace.
Detects any >0.05mm3 interference using native OpenCascade B-Rep Boolean
intersections after AABB screening. Does NOT cut or silently modify originals.

Requires:
  python tools/cad-first/p2_8_full_corner_preflight.py \
    --report .local-assets/cad-first/p2-8/P28_full_corner_preflight.json

Exit code 2 means mechanical SOURCE REWORK is required (not an execution error).
"""
import argparse,json,sys
from pathlib import Path
from p2_7_wishbone_cad import build_parts
from p2_6_steering_relief import make_steering_parts

THRESHOLD_MM3=.05

def preflight():
    incoming=build_parts()
    p26,_=make_steering_parts()
    obsolete={'P2_UPPER_WISHBONE_LINK','P2_LOWER_WISHBONE_LINK'}
    original={name:solid for name,solid in p26.items() if name not in obsolete}
    if len(incoming)!=8 or len(original)!=51:
        raise ValueError('Unexpected P2.7/P2.6 CAD source part-count drift')
    rejects=0
    exact=0
    collisions=[]
    errors=[]
    for new_name,new_solid in incoming.items():
        new_box=new_solid.BoundingBox()
        for old_name,old_solid in original.items():
            old_box=old_solid.BoundingBox()
            intersects=all(
                min(getattr(new_box,axis+'max'),getattr(old_box,axis+'max'))-
                max(getattr(new_box,axis+'min'),getattr(old_box,axis+'min'))>1e-5
                for axis in 'xyz')
            if not intersects:
                rejects+=1
                continue
            exact+=1
            try:
                volume=new_solid.intersect(old_solid).Volume()
                if volume>THRESHOLD_MM3:
                    collisions.append({
                        'newPart':new_name,
                        'existingPart':old_name,
                        'overlapMm3':round(volume,4),
                    })
            except Exception as error:
                errors.append({'newPart':new_name,'existingPart':old_name,
                               'reason':str(error)})
    return {
        'schema':'podium-eds.p2.cad-first.full-corner-preflight.v1',
        'scope':'P2.7 eight-part original subassembly versus P2.6 51 parts after removing legacy upper/lower links',
        'newCADSolids':len(incoming),
        'existingCADSolids':len(original),
        'expectedCombinedSourceSolids':len(incoming)+len(original),
        'crossPairsConsidered':len(incoming)*len(original),
        'aabbRejected':rejects,
        'exactBrepChecks':exact,
        'thresholdMm3':THRESHOLD_MM3,
        'collisions':collisions,
        'booleanErrors':errors,
        'canIntegrateWithoutSourceCADRework':not collisions and not errors,
        'mechanicalFitCertified':False,
        'continuousSteeringBumpCoupled':False,
        'warning':'Only new-vs-existing neutral-pose pairs measured. All-pairs static, coupled travel and steering still require separate tests.',
    }

if __name__=='__main__':
    cli=argparse.ArgumentParser(description=__doc__)
    cli.add_argument('--report',type=Path,required=True)
    args=cli.parse_args()
    result=preflight()
    args.report.parent.mkdir(parents=True,exist_ok=True)
    args.report.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print('P2.8 source integration:',
          'PRE-FLIGHT PASS' if result['canIntegrateWithoutSourceCADRework'] else 'SOURCE CAD REWORK REQUIRED',
          '- unresolved collisions:',len(result['collisions']),
          '- Boolean errors:',len(result['booleanErrors']))
    sys.exit(0 if result['canIntegrateWithoutSourceCADRework'] else 2)
