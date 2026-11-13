#!/usr/bin/env python3
"""P2.7 source-authored eight-solid A-arm subassembly, NOT F1 manufacturer CAD.

Original upper/lower A-arms, four separate chassis pivot bushings and
two outer studs. This is a physically modeled SUBASSEMBLY only. It has
not been re-mated to the P2.6 53-part front-left corner. STEP mm; GLB m.
"""
import argparse,hashlib,json
from pathlib import Path
import cadquery as cq
import numpy as np
import trimesh
from scipy.optimize import root

U0=np.array([-98.,114.,-170.]); L0=np.array([-98.,-114.,-170.])
UA=np.array([-370.,190.,-285.]); UB=np.array([-370.,190.,-235.])
LA=np.array([-370.,-190.,-285.]); LB=np.array([-370.,-190.,-235.])
HARDPOINTS={'upperOuter':U0,'lowerOuter':L0,'upperInnerA':UA,'upperInnerB':UB,'lowerInnerA':LA,'lowerInnerB':LB}
def vec(p):return cq.Vector(*map(float,p))
def cylinder(radius,height,center):
    return cq.Solid.makeCylinder(radius,height,vec(center)-cq.Vector(0,0,height/2),cq.Vector(0,0,1))
def ring(outer,inner,height,center):
    return cylinder(outer,height,center).cut(cylinder(inner,height+2,center))
def beam(a,b,r):
    d=np.asarray(b)-np.asarray(a)
    return cq.Solid.makeCylinder(r,float(np.linalg.norm(d)),vec(a),vec(d/np.linalg.norm(d)))
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def build_parts():
    parts={}
    for prefix,outer,a,b,r in [
      ('UPPER',U0,UA,UB,10),('LOWER',L0,LA,LB,12)]:
        arm=ring(19,9.4,25,outer).fuse(beam(outer,a,r),beam(outer,b,r))
        for i,center in enumerate((a,b),1):
            arm=arm.fuse(ring(15.5,8.1,22,center))
            parts[f'P27_{prefix}_CHASSIS_BUSHING_{i}']=ring(7.85,5,20,center)
        for center in (a,b):
            arm=arm.cut(cylinder(8.1,26,center))
        # The through-bore must include the diagonal lower-tube envelope,
        # not just the outer housing thickness. This removes the earlier
        # 29.65 mm3 persistent stud/arm overlap in all sampled poses.
        arm=arm.cut(cylinder(9.4,60,outer))
        parts[f'P27_{prefix}_A_ARM_FORGED']=arm
        stud=cylinder(8.9,36,outer+np.array([0,0,2.]))
        stud=stud.fuse(cylinder(12,5,outer+np.array([0,0,22.5])))
        parts[f'P27_{prefix}_OUTER_JOINT_STUD']=stud.cut(
            cylinder(3.5,49,outer+np.array([0,0,4.])))
    for name,solid in parts.items():
        if solid.isNull() or not solid.isValid() or solid.Volume()<=0 or len(solid.Solids())!=1:
            raise ValueError('Invalid independent CAD solid: '+name)
    if len(parts)!=8:raise AssertionError('P2.7 part-count drift')
    return parts
def poses():
    length=lambda a,b:np.linalg.norm(a-b)
    dimensions=np.array([length(U0,UA),length(U0,UB),length(L0,LA),
                          length(L0,LB),length(U0,L0)])
    neutral=np.array([*U0,L0[0],L0[2]])
    records={}
    for sequence in [range(0,16),range(-1,-16,-1)]:
        seed=neutral.copy()
        for bump in sequence:
            def residual(q):
                upper=q[:3];lower=np.array([q[3],L0[1]+bump,q[4]])
                distances=np.array([length(upper,UA),length(upper,UB),
                                    length(lower,LA),length(lower,LB),
                                    length(upper,lower)])
                return (distances**2-dimensions**2)/1e4
            solved=root(residual,seed,method='hybr',tol=1e-10)
            if not solved.success or max(abs(residual(solved.x)))>1e-6:
                raise RuntimeError('Hardpoint constraint failure at '+str(bump))
            seed=solved.x
            upper=seed[:3];lower=np.array([seed[3],L0[1]+bump,seed[4]])
            records[bump]={
                'lowerBumpMm':bump,'upperOuterMm':upper.tolist(),
                'lowerOuterMm':lower.tolist(),
                'maximumRodResidualMm':float(max(abs(np.array([
                    length(upper,UA),length(upper,UB),length(lower,LA),
                    length(lower,LB),length(upper,lower)])-dimensions)))}
    return [records[bump] for bump in range(-15,16)]
def export_glb(parts,path,linear,angular):
    scene=trimesh.Scene();counts={}
    for name,solid in parts.items():
        vertices,faces=solid.tessellate(linear,angular)
        mesh=trimesh.Trimesh(
            vertices=np.array([[p.x,p.y,p.z] for p in vertices])/1000,
            faces=np.array(faces,dtype=np.int32),process=False)
        if not len(mesh.faces):raise ValueError('Empty mesh '+name)
        bronze='BUSHING' in name;dark='A_ARM' in name
        mesh.visual=trimesh.visual.TextureVisuals(
            material=trimesh.visual.material.PBRMaterial(
                name=name,
                baseColorFactor=[165,134,91,255] if bronze else
                  [76,85,94,255] if dark else [183,190,195,255],
                metallicFactor=.72 if bronze else .78,
                roughnessFactor=.42 if dark else .32,doubleSided=True))
        scene.add_geometry(mesh,node_name=name,geom_name=name)
        counts[name]=len(mesh.faces)
    path.write_bytes(scene.export(file_type='glb'))
    return counts
def build(out):
    out.mkdir(parents=True,exist_ok=True)
    parts=build_parts();samples=poses()
    assembly=cq.Assembly(name='P27_ORIGINAL_DOUBLE_WISHBONE_SUBASSEMBLY')
    for name,shape in parts.items():assembly.add(shape,name=name)
    master=out/'P27_double_wishbone_source.step'
    assembly.save(str(master),exportType='STEP')
    manifest={
        'schema':'podium-eds.p2.cad-first.wishbone.v1',
        'description':'Original standalone 8-solid double-wishbone CAD proposal; not integrated with P2.6 upright',
        'unitsCAD':'mm','unitsGLB':'m','masterSTEP':master.name,
        'masterSTEPsha256':sha(master),'partIds':list(parts),
        'totalCadSolids':len(parts),
        'hardpointsMm':{key:value.tolist() for key,value in HARDPOINTS.items()},
        'poses':samples,
        'geometryLimitations':[
          'P2.6 original corner not re-mated to this A-arm CAD',
          'Bushing and outer joint studs are illustrative, not certified ball joints',
          'Steering and bump coupled dynamics unresolved',
          'Not Formula 1 manufacturer CAD'],
        'profiles':{}}
    for tier,(linear,angle) in {'HIGH':(.035,.09),
                                'BALANCED':(.15,.25),
                                'PERFORMANCE':(.45,.46)}.items():
        # Fresh geometry avoids OpenCascade mesh cache inheritance across LODs.
        file=out/f'P27_wishbone_{tier.lower()}.glb'
        counts=export_glb(build_parts(),file,linear,angle)
        manifest['profiles'][tier]={
            'file':file.name,'sha256':sha(file),'bytes':file.stat().st_size,
            'totalTriangles':sum(counts.values()),
            'perPartTriangles':counts}
    (out/'P27_wishbone_manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    return manifest
if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--out',type=Path,required=True)
    opts=parser.parse_args()
    m=build(opts.out)
    print({q:(r['totalTriangles'],r['bytes']) for q,r in m['profiles'].items()})
