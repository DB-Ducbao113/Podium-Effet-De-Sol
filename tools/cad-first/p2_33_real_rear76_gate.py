#!/usr/bin/env python3
"""P2.33 strict original-source rear76 native CAD gate (G2 HOLD).

Requires Git-blob-identical P2.9-P2.14 source files and SHA-pinned P2.31
56-body STEP plus name map. Retains corrected P2.19 arms/P2.29 upright,
replaces exactly four obsolete bearing IDs, and checks 1419 newly affected
native OpenCascade pairs. NO reconstructed CAD fallback, no original Model B.
"""
from __future__ import annotations
import argparse,hashlib,json,math,sys
from pathlib import Path
import cadquery as cq

SCHEMA='peds.cad-first.p233-original-rear76-cross-source-brep.v1'
STEP_SHA='e09a949f8827be01f9c0e50fc9b9c781b302642f3b40ea432836fe16d7eac284'
MAP_SCHEMA='peds.cad-first.p231-step-56-source-name-index.v1'
BLOBS={
 'p2_9_rear_upright.py':'0a6b95d53479b63006d2103b24efb44e846589b1',
 'p2_10_rear_wishbone.py':'e8cdb4b652300a514e7eb015bf3cc9020765d11e',
 'p2_11_rear_toe_link.py':'8ea653169f8a813acc52421089daf48855b773ca',
 'p2_12_toe_adjuster.py':'561ebdd652e5bf446bb946c56f907f4c5c0a8d67',
 'p2_12_constrained_kinematics.py':'2a419ff07ea5b203273647749af606c27098a67d',
 'p2_13_rear_joint_prototype.py':'32fc40ba114ef52724caa526f81a11e600daecbf',
 'p2_14_split_spherical_race.py':'9cea3e634348aa578391f42b491372d3b03db319',
}
OLD={
 'UPPER':'P210_REAR_UPPER_OUTER_SPHERICAL_BEARING_PROPOSAL',
 'LOWER':'P210_REAR_LOWER_OUTER_SPHERICAL_BEARING_PROPOSAL',
 'TOE_OUTER':'P211_REAR_TOE_OUTER_BEARING_PROPOSAL',
 'TOE_INNER':'P211_REAR_TOE_INNER_BEARING_PROPOSAL',
}
REVISED={'P210_REAR_UPPER_A_ARM_FORGED','P210_REAR_LOWER_A_ARM_FORGED',
         'P29_REAR_UPRIGHT_BEARING_CARRIER_PROPOSAL'}
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def blob(p):
 b=Path(p).read_bytes()
 return hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
def authenticate(root):
 results={}
 for name,expected in BLOBS.items():
  path=root/name
  if not path.is_file():raise FileNotFoundError('Original source required: '+str(path))
  if blob(path)!=expected:raise ValueError('Original Git blob mismatch: '+name)
  results[name]=expected
 return results
def import_p231(step,names):
 if sha(step)!=STEP_SHA:raise ValueError('P2.31 native STEP SHA-256 mismatch')
 m=json.loads(names.read_text())
 idx=m.get('nameToZeroBasedSolidIndex',{})
 if m.get('schema')!=MAP_SCHEMA or m.get('stepSHA256')!=STEP_SHA or m.get('partCount')!=56 or len(idx)!=56 or set(idx.values())!=set(range(56)):
  raise ValueError('P2.31 name map ownership mismatch')
 solids=cq.importers.importStep(str(step)).solids().vals()
 if len(solids)!=56 or any(not x.isValid() or len(x.Solids())!=1 for x in solids):
  raise ValueError('P2.31 native STEP solids invalid')
 return {name:solids[i] for name,i in idx.items()}
def union_sources(base,toe,split,replaced):
 if len(base)!=56 or len(toe)!=19 or len(split)!=16 or replaced!=OLD:
  raise ValueError('Native source counts/bearing identity changed')
 shared=set(base)&set(toe)
 if len(shared)!=11 or shared!={x for x in base if x.startswith(('P29_','P210_'))}:
  raise ValueError('Expected exactly 11 original shared P2.9/P2.10 IDs')
 if set(split)&(set(base)|set(toe)):raise ValueError('Source names collide')
 removed=set(OLD.values())
 if len(removed&set(base))!=2 or not removed<=(set(base)|set(toe)):
  raise ValueError('Four old bearing proxies missing')
 if 'P211_REAR_TOE_LINK_TUBULAR_FORGED' in toe:raise ValueError('Fixed toe rod duplicated')
 retained={n:s for n,s in base.items() if n not in removed}
 added_toe={n:s for n,s in toe.items() if n not in shared and n not in removed}
 if len(retained)!=54 or len(added_toe)!=6 or not REVISED<=set(retained):
  raise ValueError('Wrong retained original 54/source toe six owners')
 for n in sorted(shared-removed-REVISED):
  a,b=base[n],toe[n]
  ab,bb=a.BoundingBox(),b.BoundingBox()
  if abs(a.Volume()-b.Volume())>max(.1,a.Volume()*1e-5) or any(
      abs(getattr(ab,q)-getattr(bb,q))>.02 for q in ('xmin','xmax','ymin','ymax','zmin','zmax')):
   raise ValueError('Unmodified shared native source datum drift: '+n)
 final={**retained,**added_toe,**split}
 fresh=set(added_toe)|set(split)
 if len(final)!=76 or len(fresh)!=22 or set(final)&removed:
  raise ValueError('P2.33 exact native 76-part ownership violated')
 for n,b in final.items():
  if not b.isValid() or len(b.Solids())!=1 or b.Volume()<=0:
   raise ValueError('Invalid genuine native BRep: '+n)
 return final,set(retained),fresh,{'retainedOriginal54Ids':sorted(retained),
   'newToe6Ids':sorted(added_toe),'newSplit16Ids':sorted(split),
   'removedOldBearing4Ids':sorted(removed),'partIds':sorted(final)}
def incremental(solids,old,new,threshold=.05):
 if len(solids)!=76 or len(old)!=54 or len(new)!=22 or set(solids)!=old|new or old&new:
  raise ValueError('Expected 54 inherited and 22 native new original shapes')
 ids=sorted(solids);boxes={n:s.BoundingBox() for n,s in solids.items()}
 skip=exact=0;clashes=[];errors=[];tested=[]
 for i,a in enumerate(ids):
  for b in ids[i+1:]:
   if a in old and b in old:continue
   x,y=boxes[a],boxes[b]
   if any(min(getattr(x,k+'max'),getattr(y,k+'max'))-max(getattr(x,k+'min'),getattr(y,k+'min'))<=1e-6 for k in 'xyz'):
    skip+=1;continue
   exact+=1
   try:
    v=float(solids[a].intersect(solids[b]).Volume())
    if not math.isfinite(v) or v<0:raise ValueError('Invalid OCC intersection')
    row={'a':a,'b':b,'volumeMm3':round(v,6)}
    tested.append(row)
    if v>threshold:clashes.append(row)
   except Exception as exc:errors.append({'a':a,'b':b,'error':repr(exc)})
 if skip+exact!=1419:raise AssertionError('P2.33 pair audit incomplete')
 return {'allPairs':2850,'inheritedOldPairs':1431,'newAffectedPairs':1419,
         'aabbExcluded':skip,'exactNativeBrepPairs':exact,
         'exactPairResults':tested,'confirmedCollisions':clashes,'kernelFailures':errors,
         'nominalStaticPASS':not clashes and not errors,'mechanicalG2Certified':False}
def imported_real_sources(root):
 verified=authenticate(root)
 sys.path.insert(0,str(root.resolve()))
 import p2_12_toe_adjuster as p12
 import p2_13_rear_joint_prototype as p13
 import p2_14_split_spherical_race as p14
 for mod in (p12,p13,p14):
  if Path(mod.__file__).resolve().parent!=root.resolve():
   raise ValueError('Source imported from wrong checkout: '+str(mod.__file__))
 if p13.SOURCE_BEARING_TO_REPLACE!=OLD:raise ValueError('Original P2.13 replacement table altered')
 return p12.all_parts(),p14.source_parts(),p13.SOURCE_BEARING_TO_REPLACE,verified
def export_76(source,out):
 assy=cq.Assembly(name='P233_ORIGINAL_REAR76_STATIC_MODEL_B_NOT_INCLUDED')
 for name,part in sorted(source.items()):assy.add(part,name=name)
 path=out/'P233_original_rear76_native_static.step'
 assy.save(str(path),exportType='STEP')
 loaded=cq.importers.importStep(str(path)).solids().vals()
 if len(loaded)!=76 or any(not p.isValid() for p in loaded):
  raise ValueError('76-BRep STEP readback invalid')
 mapping={};remaining=set(range(76))
 for name,part in source.items():
  a=part.BoundingBox()
  matched=[i for i in remaining if abs(part.Volume()-loaded[i].Volume())<=max(.1,part.Volume()*1e-5)
    and max(abs(getattr(a,k)-getattr(loaded[i].BoundingBox(),k))
            for k in ('xmin','xmax','ymin','ymax','zmin','zmax'))<.02]
  if len(matched)!=1:raise ValueError('Nonunique source STEP ID mapping '+name)
  mapping[name]=matched[0];remaining.remove(matched[0])
 (out/'P233_original76_source_name_index.json').write_text(json.dumps({
  'stepSHA256':sha(path),'partCount':76,'nameToZeroBasedSolidIndex':mapping,
  'mechanicalG2Certified':False},indent=2)+'\n')
 return {'file':path.name,'sha256':sha(path),'roundtripSolids':76,'namedBodiesMapped':len(mapping)}
def run(step,names,root,out,do_export=False):
 if out.exists():raise FileExistsError('Cannot overwrite original evidence')
 approved=authenticate(root)
 prior=import_p231(step,names)
 toe,split,replaced,verified=imported_real_sources(root)
 if verified!=approved:raise ValueError('Original sources modified during run')
 merged,old,new,owners=union_sources(prior,toe,split,replaced)
 check=incremental(merged,old,new)
 report={'schema':SCHEMA,'patch':'P2.33/54',
   'status':'ORIGINAL_76_STATIC_PASS_G2_HOLD' if check['nominalStaticPASS'] else 'ORIGINAL_76_INTERFERENCE_HOLD',
   'verifiedOriginalGitBlobs':verified,'p231StepSHA256':STEP_SHA,
   'p231NameMapSHA256':sha(names),'sourceOwnership':owners,
   'nativeAudit':check,'originalP212andP214Executed':True,
   'originalModelBIncluded':False,'fullCarCertified':False,
   'dynamicKinematicsCertified':False,'mechanicalG2Certified':False}
 out.mkdir(parents=True)
 (out/'P233_native76_original_source_audit.json').write_text(json.dumps(report,indent=2)+'\n')
 if do_export and check['nominalStaticPASS']:
  report['nativeStep']=export_76(merged,out)
  (out/'P233_native76_original_source_audit.json').write_text(json.dumps(report,indent=2)+'\n')
 return report
if __name__=='__main__':
 ap=argparse.ArgumentParser()
 ap.add_argument('--p231-step',type=Path,required=True)
 ap.add_argument('--p231-name-map',type=Path,required=True)
 ap.add_argument('--source-root',type=Path,required=True)
 ap.add_argument('--out',type=Path,required=True)
 ap.add_argument('--export-step',action='store_true')
 arg=ap.parse_args()
 report=run(arg.p231_step,arg.p231_name_map,arg.source_root,arg.out,arg.export_step)
 print(json.dumps({'status':report['status'],'nativeAudit':report['nativeAudit'],
   'nativeSTEP':report.get('nativeStep')},indent=2))
 if not report['nativeAudit']['nominalStaticPASS']:raise SystemExit(2)
