#!/usr/bin/env python3
"""VTK headless renderer of SHA-pinned real P2.25 rear51 source mesh.
Preview only. Not original Model B body/mesh, no mechanically verified movements.
"""
import os,sys,json,math,hashlib,argparse
from pathlib import Path
import numpy as np,trimesh,vtk
from vtk.util.numpy_support import numpy_to_vtk,numpy_to_vtkIdTypeArray

BASE=Path(os.environ.get('PEDS_P227_SOURCE_DIR', str(Path(__file__).resolve().parent/'source')))
source_manifest=BASE/'P225_rear51_source_manifest.json'
assert hashlib.sha256(source_manifest.read_bytes()).hexdigest()=='3278b28e5a00c7a0ff69f05c4d5db2935802025756fdeeed3601155e377fc2d7'
meta=json.loads(source_manifest.read_text())
p=BASE/meta['profiles']['BALANCED']['file']
assert hashlib.sha256(p.read_bytes()).hexdigest()==meta['profiles']['BALANCED']['sha256']=='eed9db862ccf119da81350366b86706205f924512f2942cf28a58e6a1134e6d5'
assert len(meta['partIds'])==51

def polydata(m):
    points=vtk.vtkPoints();points.SetData(numpy_to_vtk(np.ascontiguousarray(m.vertices,dtype=np.float32),deep=True))
    ids=np.ascontiguousarray(m.faces.reshape(-1),dtype=np.int64)
    offsets=np.arange(0,len(ids)+1,3,dtype=np.int64)
    polygons=vtk.vtkCellArray();polygons.SetData(numpy_to_vtkIdTypeArray(offsets,deep=True),numpy_to_vtkIdTypeArray(ids,deep=True))
    data=vtk.vtkPolyData();data.SetPoints(points);data.SetPolys(polygons)
    normals=vtk.vtkPolyDataNormals();normals.SetInputData(data);normals.SetFeatureAngle(56);normals.SplittingOff();normals.ConsistencyOn();normals.AutoOrientNormalsOn();normals.Update()
    return normals.GetOutput()

s=trimesh.load(p,force='scene')
ren=vtk.vtkRenderer();ren.GradientBackgroundOn();ren.SetBackground(0.033,0.045,0.069);ren.SetBackground2(0.10,0.13,0.19)
win=vtk.vtkRenderWindow();win.AddRenderer(ren);win.SetSize(1280,720);win.SetOffScreenRendering(1);win.SetMultiSamples(4)
actors={};initial={}
for name in s.graph.nodes_geometry:
    mat,key=s.graph[name];mesh=s.geometry[key].copy();mesh.apply_transform(mat)
    mapper=vtk.vtkPolyDataMapper();mapper.SetInputData(polydata(mesh))
    actor=vtk.vtkActor();actor.SetMapper(mapper)
    prop=actor.GetProperty();prop.SetColor(.5294,.5725,.6157)
    prop.SetAmbient(.21);prop.SetDiffuse(.70)
    prop.SetInterpolationToPhong()
    if 'TYRE' in name:prop.SetSpecular(.045);prop.SetSpecularPower(8)
    elif 'BALL' in name or 'RACE' in name or 'NUT' in name or 'PIN' in name:prop.SetSpecular(.7);prop.SetSpecularPower(48)
    elif 'DISC' in name or 'PAD' in name:prop.SetSpecular(.1);prop.SetSpecularPower(18)
    else:prop.SetSpecular(.4);prop.SetSpecularPower(32)
    ren.AddActor(actor);actors[name]=actor

# One source-neutral center axle guide, not a modeled car part
axis=vtk.vtkLineSource();axis.SetPoint1(0,0,-.5);axis.SetPoint2(0,0,.5)
gm=vtk.vtkPolyDataMapper();gm.SetInputConnection(axis.GetOutputPort());ga=vtk.vtkActor();ga.SetMapper(gm)
ga.GetProperty().SetColor(.24,.30,.38);ga.GetProperty().SetOpacity(.35);ga.GetProperty().SetLineWidth(1);ren.AddActor(ga)

for position,intensity in [((1.5,2,2.0),1.05),((-1.5,.7,-1.0),.55),((.2,-2.5,1.0),.65)]:
    l=vtk.vtkLight();l.SetLightTypeToSceneLight();l.SetPosition(*position);l.SetFocalPoint(0,0,0);l.SetIntensity(intensity);ren.AddLight(l)

head=vtk.vtkTextActor();head.SetInput('PODIUM   /   EFFET DE SOL')
head.SetPosition(55,652);ht=head.GetTextProperty();ht.SetFontFamilyToArial();ht.SetFontSize(23);ht.SetBold(True);ht.SetColor(.91,.94,.97);ren.AddActor2D(head)
sub=vtk.vtkTextActor();sub.SetInput('MODEL B  /  REAR-CORNER CAD SOURCE STUDY')
sub.SetPosition(55,616);st=sub.GetTextProperty();st.SetFontFamilyToArial();st.SetFontSize(14);st.SetColor(.6,.68,.75);ren.AddActor2D(sub)
water=vtk.vtkTextActor();water.SetInput('51 REAL SOURCE MESHES   |   NOT INSTALLED ON THE ORIGINAL MODEL B   |   G2 HOLD')
water.SetPosition(55,36);wt=water.GetTextProperty();wt.SetFontSize(13);wt.SetFontFamilyToArial();wt.SetColor(.73,.77,.81);ren.AddActor2D(water)
chapter=vtk.vtkTextActor();chapter.SetInput('01   /   NOMINAL ASSEMBLY')
chapter.SetPosition(55,566);ct=chapter.GetTextProperty();ct.SetFontSize(22);ct.SetFontFamilyToArial();ct.SetBold(True);ct.SetColor(.86,.91,.98);ren.AddActor2D(chapter)

camera=ren.GetActiveCamera();camera.SetParallelProjection(True);camera.SetParallelScale(.58)

# Purely inspectable explode directions; no physically certified assembly path.
def separation(name):
    if name.startswith('P210_') or name.startswith('P29_'):
       return np.array([-.17,0,-.24])
    if 'TYRE' in name:return np.array([0,0,.43])
    if 'RIM' in name:return np.array([0,0,.28])
    if name.startswith('P216_REAR_BEARING_BALL_'):
       return np.array([0,0,-.23])
    if 'BEARING_' in name:return np.array([0,0,-.18])
    if 'BRAKE_DISC' in name:return np.array([0,0,.15])
    if 'CALIPER' in name or 'BRAKE_PAD' in name:return np.array([.14,.18,.12])
    if name.startswith('P221_'):return np.array([0,0,.20])
    if 'HAT' in name:return np.array([0,0,.09])
    if 'SPINDLE' in name or 'CENTER_LOCK' in name:return np.array([0,0,.24])
    if 'CV_' in name or 'HALF_SHAFT' in name:return np.array([0,0,-.30])
    if 'HUB' in name:return np.array([0,0,-.06])
    return np.array([0,0,-.08])

def smooth(x):
    x=max(0,min(1,x));return x*x*(3-2*x)

def frame(t):
    # 0-2s assembled, 2-5s explode, 5-7s hold, 7-10s reassemble, 10-11s hold.
    if t<2:e=0; label='01   /   NOMINAL ASSEMBLY'
    elif t<5:e=smooth((t-2)/3);label='02   /   EXPLODED SOURCE INSPECTION'
    elif t<7:e=1;label='02   /   EXPLODED SOURCE INSPECTION'
    elif t<10:e=1-smooth((t-7)/3);label='03   /   REVERSE ASSEMBLY'
    else:e=0;label='04   /   SOURCE QA HOLD'
    for n,a in actors.items():a.SetPosition(*(separation(n)*e))
    chapter.SetInput(label)
    phi=math.radians(-24+30*t/11)
    radius=1.65+(.40*e)
    target=np.array([-.055,0,-.02])
    camera.SetFocalPoint(*target)
    camera.SetPosition(*(target+radius*np.array([math.cos(phi),.45,math.sin(phi)])))
    camera.SetViewUp(0,1,0)
    ren.ResetCameraClippingRange()
    win.Render()

def write(path):
    snapshot=vtk.vtkWindowToImageFilter();snapshot.SetInput(win);snapshot.SetInputBufferTypeToRGB();snapshot.ReadFrontBufferOff();snapshot.Update()
    writer=vtk.vtkPNGWriter();writer.SetFileName(str(path));writer.SetInputConnection(snapshot.GetOutputPort());writer.Write()

if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--out',type=Path,required=True);ap.add_argument('--frames',type=int,default=132);ap.add_argument('--fps',type=int,default=12);ap.add_argument('--start',type=int,default=0);ap.add_argument('--stop',type=int,default=None);opts=ap.parse_args()
 opts.out.mkdir(parents=True,exist_ok=True)
 for i in range(opts.start,opts.stop if opts.stop is not None else opts.frames):
    sec=11*i/(opts.frames-1)
    frame(sec)
    write(opts.out/f'frame_{i:04d}.png')
    if i%12==0:print(f'Frame {i}/{opts.frames}',flush=True)
