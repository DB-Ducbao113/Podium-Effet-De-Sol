#!/usr/bin/env python3
"""P2.26: 51-source-GLB triangle-surface collision and solid containment screening.

Read only a SHA-256-verified, source-named P2.25 review. Check the 35
cross-owner AABB candidates against actual watertight mesh triangles with VTK's
collision detection filter and opposite-direction enclosed-point tests.
Mesh-screen ≠ B-Rep proof, mechanical G2 or an original Model B chassis fit.
Never repair mesh by hiding intersections or export a fake 71-part assembly.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
import trimesh
import vtk
from vtk.util.numpy_support import numpy_to_vtk, numpy_to_vtkIdTypeArray, vtk_to_numpy

SCHEMA='peds.cad-first.p226-real-glb-surface-screen.v1'
TIERS=('HIGH','BALANCED','PERFORMANCE')
NEUTRAL=(135,146,157,255)
# Immutable snapshots from the owner's previously SHA-verified P2.25 handoff.
SOURCE_MANIFEST_SHA256='3278b28e5a00c7a0ff69f05c4d5db2935802025756fdeeed3601155e377fc2d7'
SOURCE_GLBS_SHA256={
    'HIGH':'c5f2a5eca885c9aff19b8674fd186ff25b076dd0fbde535b999c00519c3d6956',
    'BALANCED':'eed9db862ccf119da81350366b86706205f924512f2942cf28a58e6a1134e6d5',
    'PERFORMANCE':'d41ce7fc8586de0855111754f1b79268032e8c592ae844d0f5dfe7b3b4162d28',
}


def sha(path:Path)->str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def vtk_mesh(mesh:trimesh.Trimesh)->vtk.vtkPolyData:
    if mesh.faces.shape[1]!=3 or len(mesh.faces)==0:
        raise ValueError('Triangle surface is missing')
    if not mesh.is_watertight or not mesh.is_winding_consistent:
        raise ValueError('Source mesh must be watertight and winding consistent')
    pts=vtk.vtkPoints()
    pts.SetData(numpy_to_vtk(np.asarray(mesh.vertices,dtype=np.float64),deep=True))
    offsets=np.arange(0,3*len(mesh.faces)+1,3,dtype=np.int64)
    conn=np.asarray(mesh.faces,dtype=np.int64).reshape(-1)
    polys=vtk.vtkCellArray()
    polys.SetData(numpy_to_vtkIdTypeArray(offsets,deep=True),
                  numpy_to_vtkIdTypeArray(conn,deep=True))
    pd=vtk.vtkPolyData();pd.SetPoints(pts);pd.SetPolys(polys)
    return pd


def inside_vertices(subject:vtk.vtkPolyData,surface:vtk.vtkPolyData)->int:
    # An enclosed object can penetrate another without any triangle contact.
    # Therefore test BOTH mesh directions and do not rely on surface crossings.
    query=vtk.vtkPolyData()
    query.SetPoints(subject.GetPoints())
    detector=vtk.vtkSelectEnclosedPoints()
    detector.SetInputData(query)
    detector.SetSurfaceData(surface)
    detector.SetTolerance(1e-8)
    detector.SetCheckSurface(True)
    detector.Update()
    selected=detector.GetOutput().GetPointData().GetArray('SelectedPoints')
    if selected is None:
        raise RuntimeError('VTK containment query did not return results')
    return int(vtk_to_numpy(selected).sum())


def mesh_pair_probe(a:trimesh.Trimesh,b:trimesh.Trimesh)->dict:
    pa=vtk_mesh(a);pb=vtk_mesh(b)
    detector=vtk.vtkCollisionDetectionFilter()
    detector.SetInputData(0,pa);detector.SetInputData(1,pb)
    detector.SetTransform(0,vtk.vtkTransform())
    detector.SetTransform(1,vtk.vtkTransform())
    detector.SetCollisionModeToAllContacts()
    detector.SetBoxTolerance(0.0)
    detector.SetCellTolerance(0.0)
    detector.Update()
    contacts=detector.GetNumberOfContacts()
    if contacts<0:
        raise RuntimeError('VTK triangle collision detection failed')
    ainb=inside_vertices(pa,pb)
    bina=inside_vertices(pb,pa)
    return {'surfaceTriangleContacts':int(contacts),
            'firstVerticesInsideSecond':ainb,'secondVerticesInsideFirst':bina,
            'potentialMeshInterference':bool(contacts or ainb or bina)}


def load_meshes(glb:Path,ids:set[str])->dict[str,trimesh.Trimesh]:
    scene=trimesh.load(glb,force='scene')
    if set(scene.graph.nodes_geometry)!=ids or len(scene.geometry)!=len(ids):
        raise ValueError('Missing/duplicate native source node name in review GLB')
    meshes={}
    for name in scene.graph.nodes_geometry:
        transform,geom=scene.graph[name]
        mesh=scene.geometry[geom].copy()
        if tuple(map(int,mesh.visual.material.baseColorFactor))!=NEUTRAL:
            raise ValueError('Source CAD neutral base color drift: '+name)
        if not np.isfinite(transform).all() or not np.isfinite(mesh.vertices).all():
            raise ValueError('Invalid source triangle coordinates')
        mesh.apply_transform(transform)
        if not mesh.is_watertight or not mesh.is_winding_consistent:
            raise ValueError('Invalid source closed triangle mesh: '+name)
        meshes[name]=mesh
    return meshes


def run(source:Path,out:Path)->dict:
    if out.exists():
        raise FileExistsError('Refusing overwrite of P2.26 review evidence')
    manifest=source/'P225_rear51_source_manifest.json'
    if sha(manifest)!=SOURCE_MANIFEST_SHA256:
        raise ValueError('P2.25 source manifest SHA-256 snapshot mismatch')
    meta=json.loads(manifest.read_text())
    if meta.get('schema')!='peds.cad-first.p225-source-pinned-rear51-mesh-review.v1':
        raise ValueError('Wrong upstream P2.25 source lineage')
    if meta.get('partCount')!=51 or meta.get('uniformBaseColor')!='#87929d':
        raise ValueError('Wrong 51-part P2.25 neutral source')
    if meta.get('nativeP224Full71AuditPassed') is not False:
        raise ValueError('P2.24 original full 71-native body gate status unknown')
    ids=set(meta['partIds'])
    if len(ids)!=51:
        raise ValueError('Source part IDs not unique')
    susp=set(meta['sourceOwnership']['retainedSuspensionPartIds'])
    wheel=set(meta['sourceOwnership']['latestRearPartIds'])
    if len(susp)!=11 or len(wheel)!=40 or susp|wheel!=ids or susp&wheel:
        raise ValueError('P2.25 physical source partition invalid')
    candidates=meta['crossSourceMeshAabbAudit']['possibleInterferenceCandidates']
    pairs=[(c['suspensionPartId'],c['wheelPartId']) for c in candidates]
    if len(pairs)!=35 or len(set(pairs))!=35:
        raise ValueError('The original P2.25 35 AABB candidates changed')
    if any(a not in susp or b not in wheel for a,b in pairs):
        raise ValueError('Unexpected source owner in AABB candidates')
    evidence={}
    for tier in TIERS:
        info=meta['profiles'][tier]
        glb=source/info['file']
        if not glb.is_file() or sha(glb)!=info['sha256'] or info['sha256']!=SOURCE_GLBS_SHA256[tier]:
            raise ValueError('Source review GLB SHA-256 invalid: '+str(glb))
        meshes=load_meshes(glb,ids)
        results=[]
        for a,b in pairs:
            result=mesh_pair_probe(meshes[a],meshes[b])
            results.append({'suspensionPartId':a,'wheelPartId':b,**result})
        hits=[r for r in results if r['potentialMeshInterference']]
        evidence[tier]={
            'sourceGlb':glb.name,'sourceSha256':info['sha256'],
            'allIndependentSuspensionWheelPairs':440,
            'aabbSeparatedPairs':405,'aabbCandidatePairsTested':35,
            'triangleContactPairs':sum(r['surfaceTriangleContacts']>0 for r in results),
            'containedVertexPairs':sum((r['firstVerticesInsideSecond'] or r['secondVerticesInsideFirst'])>0 for r in results),
            'possibleInterferencePairs':len(hits),
            'passMeshSurfaceScreen':not hits,'candidateResults':results,
        }
    consistent=len({v['possibleInterferencePairs'] for v in evidence.values()})==1
    status='THREE_LOD_MESH_SURFACE_SCREEN_PASS_G2_HOLD' if consistent and all(
        v['passMeshSurfaceScreen'] for v in evidence.values()) else 'MESH_SCREEN_INTERFERENCE_OR_LOD_DRIFT_HOLD'
    report={'schema':SCHEMA,'status':status,
        'partCount':51,'sourceManifestSha256':sha(manifest),
        'uniformColor':'#87929d','sourceLodEvidence':evidence,
        'actualOriginalCADBRep71CheckPerformed':False,
        'meshSurfaceCollisionFreeCertifiedForThese35Pairs':status.startswith('THREE_LOD_'),
        'complete3dInterpenetrationProof':False,
        'realModelBChassisFitCertified':False,
        'mechanicalG2Certified':False,'originalF1Complete':False,
        'knownLimits':['VTK triangle contacts plus vertex containment are screeners, not robust exact B-Rep solids',
            'Subtriangle cases of partial volumetric overlap without face crossing are not ruled out',
            'Only 11 P2.19 suspension vs 40 P2.23 wheel cross pairs, excluding original P2.12/P2.14',
            'Original model B body attachment, suspension kinematic sweep and actual load paths not verified']}
    out.mkdir(parents=True)
    (out/'P226_real_rear51_surface_qa.json').write_text(json.dumps(report,indent=2)+'\n')
    return report


if __name__=='__main__':
    arg=argparse.ArgumentParser()
    arg.add_argument('--p225-dir',type=Path,required=True)
    arg.add_argument('--out',type=Path,required=True)
    opts=arg.parse_args()
    result=run(opts.p225_dir,opts.out)
    print(json.dumps({'status':result['status'],'lodCounts':{
        k:{field:v[field] for field in ('aabbCandidatePairsTested','triangleContactPairs','containedVertexPairs','possibleInterferencePairs')}
        for k,v in result['sourceLodEvidence'].items()}},indent=2))
