#!/usr/bin/env python3
"""P2.4 CAD-derived LODs, NOT three independent B-Rep tessellations.

HIGH is directly tessellated from native CAD. BALANCED and PERFORMANCE are
simplified from that HIGH geometry with VTK QuadricDecimation. We preserve
semantic part IDs, PBR material parameters, scene transforms, and metre units.
"""
from __future__ import annotations
import numpy as np
import trimesh
import vtk
from vtk.util.numpy_support import numpy_to_vtk, numpy_to_vtkIdTypeArray, vtk_to_numpy

TARGET_REDUCTION={"BALANCED":0.73,"PERFORMANCE":0.87}

def decimate_mesh(mesh,reduction):
    if len(mesh.faces)<96:return mesh.copy()
    poly=vtk.vtkPolyData()
    points=vtk.vtkPoints()
    points.SetData(numpy_to_vtk(np.ascontiguousarray(mesh.vertices,dtype=np.float64),deep=True))
    poly.SetPoints(points)
    faces=np.asarray(mesh.faces,dtype=np.int64)
    packed=np.column_stack((
        np.full(len(faces),3,dtype=np.int64),faces
    )).ravel()
    cells=vtk.vtkCellArray()
    cells.SetCells(len(faces),numpy_to_vtkIdTypeArray(packed,deep=True))
    poly.SetPolys(cells)
    # OpenCascade export has duplicate points at face seams. Without exact
    # merging, many 9k-triangle spheres remain virtually unchanged in LOD.
    cleaner=vtk.vtkCleanPolyData()
    cleaner.SetInputData(poly)
    cleaner.SetTolerance(0)
    cleaner.Update()
    decimator=vtk.vtkQuadricDecimation()
    decimator.SetInputConnection(cleaner.GetOutputPort())
    decimator.SetTargetReduction(reduction)
    decimator.VolumePreservationOn()
    decimator.Update()
    output=decimator.GetOutput()
    if output.GetNumberOfPolys()<4 or output.GetNumberOfPoints()<4:
        raise ValueError("LOD simplification removed a semantic CAD part")
    vertices=np.asarray(vtk_to_numpy(output.GetPoints().GetData()),dtype=np.float64)
    indices=np.asarray(
        vtk_to_numpy(output.GetPolys().GetData()),dtype=np.int64
    ).reshape(-1,4)[:,1:]
    result=trimesh.Trimesh(vertices=vertices,faces=indices,process=False)
    result.visual=mesh.visual.copy()
    return result

def create_lod(high_path,output_path,quality):
    if quality not in TARGET_REDUCTION:
        raise ValueError("Only BALANCED/PERFORMANCE are simplified from CAD HIGH")
    source=trimesh.load(high_path,force="scene")
    output=trimesh.Scene()
    counts={}
    for node in source.graph.nodes_geometry:
        transform,geom_name=source.graph.get(node)
        mesh=decimate_mesh(source.geometry[geom_name],TARGET_REDUCTION[quality])
        output.add_geometry(mesh,node_name=node,geom_name=node,transform=transform)
        counts[node]=len(mesh.faces)
    if len(counts)!=len(source.graph.nodes_geometry):
        raise ValueError("Source hierarchy lost during CAD LOD conversion")
    output_path.write_bytes(output.export(file_type="glb"))
    return counts
