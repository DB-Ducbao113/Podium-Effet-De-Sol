#!/usr/bin/env python3
"""P2.32 early 62-body static PRE-FLIGHT for upper/lower split bearings.

Uses genuine SHA-pinned P2.31 56-solid STEP and 56-name index plus a
separate, explicitly RECONSTRUCTED implementation of the P2.13/P2.14
upper/lower bearing source shape formulas reviewed on GitHub. It is not
execution of the exact P2.14 authoring script; it DOES exercise real OCC
B-Rep contact with the actual original P2.31 geometry and does not certify
76-part owner source integration or dynamic mechanical fit.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
import cadquery as cq

STEP_SHA = 'e09a949f8827be01f9c0e50fc9b9c781b302642f3b40ea432836fe16d7eac284'
P210_UPPER = 'P210_REAR_UPPER_OUTER_SPHERICAL_BEARING_PROPOSAL'
P210_LOWER = 'P210_REAR_LOWER_OUTER_SPHERICAL_BEARING_PROPOSAL'
STATIONS = {'UPPER':(-110.,142.,-196.), 'LOWER':(-102.,-144.,-197.)}
THRESHOLD = .05


def sha(p: Path)->str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def sphere(radius:float)->cq.Shape:
    return cq.Solid.makeSphere(radius, cq.Vector(0,0,0),angleDegrees1=-90,angleDegrees2=90)


def parts_local(station:str)->dict[str,cq.Shape]:
    """Same analytic primitives/dims as P2.13 + P2.14, rewritten for isolated probing."""
    if station not in STATIONS:raise ValueError('Unknown original joint station')
    # P2.14 barrel, P2.13 sphere cavity and clipped, through-bored ball.
    barrel=cq.Solid.makeCylinder(11.25,13.,cq.Vector(0,0,-6.5))
    race=barrel.cut(sphere(9.95)).clean()
    positive=cq.Workplane('XY').box(30,45,17).val().translate((15,0,0))
    negative=cq.Workplane('XY').box(30,45,17).val().translate((-15,0,0))
    half_pos=race.intersect(positive).clean()
    half_neg=race.intersect(negative).clean()
    flat=cq.Workplane('XY').box(28,28,10).val()
    ball=sphere(9.65).intersect(flat)
    hole=cq.Solid.makeCylinder(7.5,12.,cq.Vector(0,0,-6.))
    ball=ball.cut(hole).clean()
    sleeve=cq.Solid.makeCylinder(11.88,13.,cq.Vector(0,0,-6.5)).cut(
        cq.Solid.makeCylinder(11.35,15.,cq.Vector(0,0,-7.5))).clean()
    native={f'P214_{station}_SPLIT_RACE_POSITIVE_X':half_pos,
        f'P214_{station}_SPLIT_RACE_NEGATIVE_X':half_neg,
        f'P214_{station}_DRILLED_SPHERICAL_BALL':ball,
        f'P214_{station}_SLIDING_RETENTION_SLEEVE':sleeve}
    for n,p in native.items():
        if p.isNull() or not p.isValid() or len(p.Solids())!=1 or p.Volume()<10:
            raise ValueError('P2.14 reconstructed shape invalid '+n)
    return native


def build_nominal():
    out={}
    for station,center in STATIONS.items():
        for name,body in parts_local(station).items():
            out[name]=body.translate(center)
    return out


def native_audit(shapes:dict[str,cq.Shape],old_ids:set[str])->dict:
    if len(shapes)!=62 or len(old_ids)!=54:
        raise ValueError('Expected 54 P2.31 retained + 8 reconstructed split bodies')
    names=sorted(shapes)
    bb={n:shape.BoundingBox() for n,shape in shapes.items()}
    past=separated=booleans=0;collisions=[];errors=[];results=[]
    for i,a in enumerate(names):
        for b in names[i+1:]:
            if a in old_ids and b in old_ids:
                past+=1;continue
            x,y=bb[a],bb[b]
            if any(min(getattr(x,q+'max'),getattr(y,q+'max'))-max(getattr(x,q+'min'),getattr(y,q+'min'))<=1e-6 for q in 'xyz'):
                separated+=1;continue
            booleans+=1
            try:
                v=float(shapes[a].intersect(shapes[b]).Volume())
                if not math.isfinite(v) or v < 0:raise ValueError('Invalid BRep Boolean')
                if v>.05:collisions.append({'partA':a,'partB':b,'volumeMm3':round(v,6)})
                results.append({'partA':a,'partB':b,'volumeMm3':round(v,6)})
            except Exception as e:
                errors.append({'partA':a,'partB':b,'error':str(e)})
    assert past+separated+booleans==62*61//2
    return {'nativeBRepSolids':62,'allCandidatePairs':1891,'inheritedOriginal54Pairs':past,
        'newAffectedPairs':1891-past,'aabbExcludedNewPairs':separated,
        'exactNativeBooleanNewPairs':booleans,'exactPairs':results,
        'overlapsOverPoint05Mm3':collisions,'booleanErrors':errors,
        'preflightNominalPass':not collisions and not errors,
        'originalP214SourceScriptExecuted':False,'full76SourceGatePerformed':False,
        'dynamicMechanicsCertified':False,'modelBOriginalInstalled':False}


def run(step:Path,names_path:Path,out:Path,export_step:bool=False)->dict:
    if out.exists():raise FileExistsError('Never overwrite P2.32 preflight evidence')
    if sha(step)!=STEP_SHA:raise ValueError('Original P2.31 STEP SHA-256 mismatch')
    names=json.loads(names_path.read_text())
    if names.get('stepSHA256')!=STEP_SHA or names.get('partCount')!=56:
        raise ValueError('Original source-name STEP map mismatch')
    mapping=names['nameToZeroBasedSolidIndex']
    if len(mapping)!=56 or set(mapping.values())!=set(range(56)):
        raise ValueError('Non-bijective original STEP part-name mapping')
    imported=cq.importers.importStep(str(step)).solids().vals()
    if len(imported)!=56 or any(not x.isValid() or x.Volume()<=0 for x in imported):
        raise ValueError('Original P2.31 native source B-Rep invalid')
    original={name:imported[idx] for name,idx in mapping.items()}
    replaced={P210_UPPER,P210_LOWER}
    if not replaced <= set(original):raise ValueError('P2.10 old bearing owners not found')
    retained={k:v for k,v in original.items() if k not in replaced}
    bearings=build_nominal()
    union={**retained,**bearings}
    audit=native_audit(union,set(retained))
    doc={'schema':'peds.cad-first.p232-reconstructed-upper-lower-split-brep-preflight.v1',
        'status':'NATIVE_PREFLIGHT_PASS_NOT_FULL_SOURCE_G2_HOLD' if audit['preflightNominalPass'] else 'NATIVE_PREFLIGHT_CLASH_HOLD',
        'realP231NativeStepSHA256':sha(step), 'realP231NameMapSHA256':sha(names_path),
        'originalNativeP231Solids':56,'removedOldP210BearingIds':sorted(replaced),
        'newP214ReconstructedIds':sorted(bearings),
        'analyticalSourceDimensions':'Exact nominal P2.13/P2.14 formula transcription; original authoring script not executed locally',
        'provisionalMergedSolids':62,'audit':audit,
        'reconstructedGeometryProvesOriginalSourceIdentity':False,
        'mechanicalG2Certified':False,'modelBOriginalAssetIncluded':False}
    out.mkdir(parents=True)
    if export_step and audit['preflightNominalPass']:
        assy=cq.Assembly(name='P232_RECONSTRUCTED_UPPER_LOWER_SPLIT_PARTIAL_62_NOT_MODEL_B')
        for name,body in union.items():assy.add(body,name=name)
        output=out/'P232_partial62_reconstructed_split_races_NOT_ORIGINAL_P214.step'
        assy.save(str(output),exportType='STEP')
        checked=cq.importers.importStep(str(output)).solids().vals()
        if len(checked)!=62 or any(not solid.isValid() for solid in checked):
            raise ValueError('Reconstructed source demonstration 62-solid STEP roundtrip invalid')
        doc['partialDemonstrationSTEP']={
            'file':output.name,'sha256':sha(output),'roundtripSolids':len(checked),
            'sourceOwnersP231Native':54,'additionalP214FormulaReconstructedParts':8,
            'originalP214GithubBrepSourceExecuted':False,
            'full76NativeSourceClaim':False,'engineeringG2Certification':False}
    (out/'P232_upper_lower_split_native_preflight.json').write_text(json.dumps(doc,indent=2)+'\n')
    return doc


if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--step',required=True,type=Path)
    p.add_argument('--names',required=True,type=Path)
    p.add_argument('--out',required=True,type=Path)
    p.add_argument('--export-step',action='store_true',help='Export explicitly reconstructed 62-solid preflight, not original P2.14')
    args=p.parse_args();print(json.dumps(run(args.step,args.names,args.out,args.export_step),indent=2))
