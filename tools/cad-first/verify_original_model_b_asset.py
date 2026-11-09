#!/usr/bin/env python3
"""Check the EXACT original owner Model B showroom binary before browser QA.

The Git blob SHA was read from the checked-in project source file entry on the
work branch (not from an assistant-generated showroom substitute).
This is identity/integrity only; it is not an approved four-wheel CAD mate.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import struct

ROOT=Path(__file__).resolve().parents[2]
ORIGINAL=ROOT/'apps/web/public/models/model-b-eds-optimized-v1.glb'
EXPECTED_SIZE=2120816
EXPECTED_GIT_BLOB_SHA1='74fbd44daf709d0d368adef9de66e4e22a49fed4'
PROVENANCE='PODIUM_EDS_GITHUB_COMMITTED_OWNER_MODEL_B_GLB'

def git_blob_sha1(payload:bytes)->str:
    return hashlib.sha1(b'blob '+str(len(payload)).encode('ascii')+
                        b'\x00'+payload).hexdigest()

def verify(path:Path)->dict:
    payload=path.read_bytes()
    if len(payload)!=EXPECTED_SIZE:
        raise RuntimeError('Original Model B GLB byte size does not match source')
    digest=git_blob_sha1(payload)
    if digest!=EXPECTED_GIT_BLOB_SHA1:
        raise RuntimeError('Original Model B GLB Git object SHA-1 differs')
    if len(payload)<20:
        raise RuntimeError('Model B GLB header truncated')
    magic,version,length,jsonlen,json_type=struct.unpack('<IIIII',payload[:20])
    if (magic!=0x46546c67 or version!=2 or length!=len(payload)
        or json_type!=0x4e4f534a or jsonlen<4 or 20+jsonlen>length):
        raise RuntimeError('Original Model B source is not valid GLB 2.0')
    document=json.loads(payload[20:20+jsonlen])
    if (str(document.get('asset',{}).get('version'))!='2.0'
        or not document.get('meshes') or not document.get('nodes')):
        raise RuntimeError('Original owner Model B GLB JSON scene missing')
    return {
      'schema':'podium-eds.owner-model-b-original-file-git-integrity.v1',
      'sourceAsset':'apps/web/public/models/model-b-eds-optimized-v1.glb',
      'sourceProvenance':PROVENANCE,
      'fileBytes':len(payload),'gitBlobSHA1':digest,
      'meshDefinitionCount':len(document['meshes']),
      'nodeDefinitionCount':len(document['nodes']),
      'glbVersion':2,
      'gitBlobIdentityValid':True,
      'rendererDecoded':False,
      'fourWheelCadMated':False,
      'mechanicalG2':'HOLD',
    }

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--source',type=Path,default=ORIGINAL)
    parser.add_argument('--out',type=Path)
    arguments=parser.parse_args()
    proof=verify(arguments.source.resolve())
    if arguments.out:
        target=arguments.out.resolve()
        if target.exists():
            raise FileExistsError('Refuse to overwrite prior Model B identity evidence')
        target.parent.mkdir(parents=True,exist_ok=True)
        target.write_text(json.dumps(proof,indent=2)+'\n',encoding='utf8')
    print('OWNER ORIGINAL MODEL B SOURCE GLB GIT ID VERIFIED / no mechanical mate')
