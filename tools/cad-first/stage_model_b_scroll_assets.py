#!/usr/bin/env python3
"""Stage only ORIGINAL SHA-checked owner CAD for DEV Model B scroll playback.

No asset enters git, Vite public/, production dist or Cloudflare deployment.
Vite serves only fixed paths from .local-assets/model-b-scroll-preview over
loopback via modelBLocalCadPlugin, not arbitrary filesystem access.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import re
import struct
from pathlib import Path
import shutil
import tempfile
import uuid

from record_four_corners_local import verify
from record_model_b_scroll_local import check_source

ROOT=Path(__file__).resolve().parents[2]
LOCAL=ROOT/'.local-assets'
OUTPUT=LOCAL/'model-b-scroll-preview'

def checked_sha(path:Path)->str:
    with path.open('rb') as stream:
        return hashlib.file_digest(stream,'sha256').hexdigest()

def verify_glb_mesh_identities(glb:Path,expected_names:list[str])->None:
    """Read native glTF 2.0 GLB JSON header; check exact authored mesh nodes.

    No browser rendering is inferred from this metadata test. It runs before
    replacing any known-good local source bundle.
    """
    if (not expected_names or len(set(expected_names))!=len(expected_names)
        or glb.stat().st_size<24 or glb.stat().st_size>150*1024*1024):
        raise RuntimeError('Invalid original source GLB bounds or CAD node list')
    with glb.open('rb') as stream:
        header=stream.read(20)
        if len(header)!=20:raise RuntimeError('Original source GLB header is truncated')
        magic,version,total,jlength,jtype=struct.unpack('<IIIII',header)
        if (magic!=0x46546c67 or version!=2 or total!=glb.stat().st_size
            or jtype!=0x4e4f534a or jlength<2 or jlength>10*1024*1024
            or 20+jlength>total):
            raise RuntimeError('Source GLB 2.0 header/json size invalid')
        gltf=json.loads(stream.read(jlength))
    meshes=gltf.get('meshes',[])
    nodes=gltf.get('nodes',[])
    if not isinstance(meshes,list) or not isinstance(nodes,list):
        raise RuntimeError('GLB geometry/nodes are not lists')
    names=[]
    for node in nodes:
        if 'mesh' not in node:continue
        index=node['mesh']
        if (not isinstance(index,int) or isinstance(index,bool)
            or index<0 or index>=len(meshes)
            or not isinstance(node.get('name'),str)):
            raise RuntimeError('Source GLB mesh-node topology invalid')
        names.append(node['name'])
    if len(names)!=len(expected_names) or set(names)!=set(expected_names):
        raise RuntimeError('Original GLB authored CAD part node identities mismatch')
    for entry in [*(gltf.get('buffers') or []),*(gltf.get('images') or [])]:
        uri=entry.get('uri')
        if uri and (not isinstance(uri,str) or not uri.startswith('data:')):
            raise RuntimeError('External geometry/texture URI in private CAD GLB refused')

def verify_cad_source_evidence(name:str,record:dict)->None:
    """Do not evict a good local CAD bundle with a weak, stale manifest."""
    if name=='p28':
        ids=record.get('partIds',[])
        stat=record.get('staticFit') or {}
        if (not isinstance(ids,list) or len(ids)!=59 or len(set(ids))!=59
            or record.get('source')!='Project-authored P2.6/P2.7 original B-Rep'
            or record.get('allRoundtripValid') is not True
            or not re.fullmatch(r'[0-9a-fA-F]{64}',record.get('masterSTEPsha256',''))
            or stat.get('totalPairs')!=1711
            or stat.get('singleStaticPosePass') is not True):
            raise RuntimeError('P2.8 59-body original STEP and 1711-pair source evidence missing')
    elif name=='p212':
        audit=record.get('nativeStaticAudit') or {}
        if (len(record.get('partIds',[]))!=19
            or len(set(record.get('partIds',[])))!=19
            or record.get('threadGeometryRevision')!='P2.12-R3-BREP-LOCKNUT-ENGAGEMENT'
            or record.get('mechanicalMateCertified') is not False
            or record.get('actualChassisToeHardpointMeasured') is not False
            or audit.get('pairCount')!=171 or audit.get('passStatic') is not True
            or audit.get('unresolvedCollisions')!=[]
            or audit.get('booleanErrors')!=[]
            or audit.get('dynamicKinematicsCertified') is not False):
            raise RuntimeError('P2.12 threaded source lineage and G2 HOLD evidence missing')
    elif name=='p214':
        audit=record.get('nominalStaticAudit') or {}
        path=record.get('discreteAssemblyPathAudit') or {}
        ids=record.get('newPartNames',[])
        if (not isinstance(ids,list) or len(ids)!=16 or len(set(ids))!=16
            or record.get('candidateCombinedSourceSolids')!=31
            or record.get('stepRoundtripSolids')!=16
            or audit.get('pairCount')!=465 or audit.get('passStatic') is not True
            or audit.get('unresolvedCollisions')!=[]
            or audit.get('booleanErrors')!=[]
            or path.get('finiteInsertionPairChecks')!=144
            or path.get('positiveControlCount')!=4
            or record.get('axialRetentionCertified') is not False
            or record.get('chassisHardpointsMeasured') is not False
            or record.get('mechanicalG2')!='HOLD'):
            raise RuntimeError('P2.14 31-body split race and 144-path G2 HOLD evidence missing')
    else:raise ValueError('Unknown allowed source kind: '+name)

def run(p28:Path,out:Path,quality:str='BALANCED',
        p212:Path|None=None,p214:Path|None=None)->dict:
    if p214 is not None and p212 is None:
        raise ValueError('P2.14 requires P2.12 original source')
    out=out.resolve()
    if not out.is_relative_to(LOCAL.resolve()) or out==LOCAL.resolve():
        raise ValueError('Original private CAD staging MUST stay inside .local-assets')
    if out.exists() and not (out/'.peds-model-b-cad-staged').is_file():
        raise FileExistsError('Refuse to overwrite unrelated output folder: '+str(out))
    # Validate ALL incoming original sources before touching the last good
    # local source bundle. A bad or interrupted rebuild must not erase it.
    front=verify(p28.resolve(),quality)
    sources={'p28':front}
    if p212:
        sources['p212']=check_source(p212.resolve(),'P212_rear_toe_adjuster_manifest.json',quality)
    if p214:
        sources['p214']=check_source(p214.resolve(),'P214_split_race_manifest.json',quality)
    expected={
      'p28':('podium-eds.p2.cad-first.full-corner.remate.v1',59),
      'p212':('podium-eds.p2.cad-first.rear-toe-adjuster-threaded.v3',19),
      'p214':('podium-eds.p214.split-race-radial-assembly.v1',16),
    }
    row={}
    for name,(manifest,glb,record) in sources.items():
        schema,expected_count=expected[name]
        current=(record.get('totalCadSolids') if name=='p28' else
          record.get('sourcePartCount') if name=='p212' else
          record.get('newNativeSolidCount'))
        if record.get('schema')!=schema or current!=expected_count:
            raise RuntimeError('Wrong original source/part count for '+name)
        verify_cad_source_evidence(name,record)
        source_sha=record['profiles'][quality]['sha256']
        advertised_name=record['profiles'][quality]['file']
        if (not isinstance(advertised_name,str)
            or Path(advertised_name).name!=advertised_name
            or not advertised_name.lower().endswith('.glb')):
            raise RuntimeError('Original CAD manifest may not escape its source directory')
        expected_names=(record['partIds'] if name in ('p28','p212')
                        else record['newPartNames'])
        verify_glb_mesh_identities(glb,expected_names)
        if checked_sha(glb)!=source_sha:
            raise RuntimeError('Original source GLB modified while staging: '+str(glb))
        if name=='p214':
            own_sha=checked_sha(ROOT/'tools/cad-first/p2_14_split_spherical_race.py')
            if record.get('ownCadSourceSha256')!=own_sha:
                raise RuntimeError('P2.14 manifest generator SHA differs from current branch')
            upstream=record.get('upstreamCadSourceSha256',{})
            if len(upstream)!=6 or any(
                checked_sha(ROOT/'tools/cad-first'/filename)!=digest
                for filename,digest in upstream.items()):
                raise RuntimeError('P2.14 upstream sources are not current checkout')
        if name=='p212' and record.get('threadGeometryRevision')!=\
          'P2.12-R3-BREP-LOCKNUT-ENGAGEMENT':
            raise RuntimeError('P2.12 old incorrect locknut revision rejected')
        row[name]={'manifestFile':'manifest.json','glbFile':'source.glb',
                   'originalGlbFileName':glb.name,'sha256':source_sha,
                   'meshCount':expected_count,'profile':quality}
    out.parent.mkdir(parents=True,exist_ok=True)
    scratch=Path(tempfile.mkdtemp(prefix='.'+out.name+'.staging-',dir=out.parent))
    old_bundle:Path|None=None
    try:
        for name,(manifest,glb,_) in sources.items():
            folder=scratch/name;folder.mkdir()
            shutil.copy2(manifest,folder/'manifest.json')
            shutil.copy2(glb,folder/'source.glb')
            verify_glb_mesh_identities(folder/'source.glb',
                record['partIds'] if name in ('p28','p212') else record['newPartNames'])
            if checked_sha(folder/'source.glb')!=row[name]['sha256']:
                raise RuntimeError('Source GLB changed during final local staging: '+name)
            if (json.loads((folder/'manifest.json').read_text(encoding='utf8'))
                .get('schema')!=expected[name][0]):
                raise RuntimeError('Source manifest mutated while staging: '+name)
        index={
          'schema':'podium-eds.model-b-assembly.local-owner-cad.v1',
          'quality':quality,'sources':row,
          'localOnlyNotDeployed':True,'mechanicalG2':'HOLD',
          'noFabricatedGeometry':True,
        }
        (scratch/'index.json').write_text(json.dumps(index,indent=2)+'\n',encoding='utf8')
        (scratch/'.peds-model-b-cad-staged').write_text(
          'Generated only from original owner source manifests and SHA-matched GLBs.\n')
        if out.exists():
            if not (out/'.peds-model-b-cad-staged').is_file():
                raise FileExistsError('Original CAD target changed before replacement')
            old_bundle=out.parent/('.'+out.name+'.previous-'+uuid.uuid4().hex)
            out.rename(old_bundle)
        try:
            scratch.rename(out)
        except Exception:
            if old_bundle and old_bundle.exists() and not out.exists():
                old_bundle.rename(out)
            raise
    finally:
        if scratch.exists():shutil.rmtree(scratch,ignore_errors=True)
    if old_bundle and old_bundle.exists():
        shutil.rmtree(old_bundle)
    return index

if __name__=='__main__':
    a=argparse.ArgumentParser()
    a.add_argument('--p28-dir',type=Path,required=True)
    a.add_argument('--p212-dir',type=Path)
    a.add_argument('--p214-dir',type=Path)
    a.add_argument('--quality',choices=['HIGH','BALANCED','PERFORMANCE'],default='BALANCED')
    a.add_argument('--out',type=Path,default=OUTPUT)
    args=a.parse_args()
    result=run(args.p28_dir,args.out,args.quality,args.p212_dir,args.p214_dir)
    print('Model B DEV local original CAD staged:',{
      k:v['meshCount'] for k,v in result['sources'].items()},'G2 HOLD')
