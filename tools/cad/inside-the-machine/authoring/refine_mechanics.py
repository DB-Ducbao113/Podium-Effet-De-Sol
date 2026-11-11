"""Localized R4.4-B replacement of three existing illustrative mechanical meshes.

The accepted R4.4-A source is read-only. Semantic objects, parents and control
matrices remain; only engine metal, bank covers and gearbox housing mesh data
are remodeled within their established envelope.
"""
import hashlib
import json
from pathlib import Path
import bpy
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[3]/'source-assets/models/inside-the-machine/authoring'
SOURCE=ROOT/'r4-4-a'/'model-b-cinematic-r4-4-a.blend'
OUT=ROOT/'r4-4-b'
BLEND=OUT/'model-b-cinematic-r4-4-b.blend'
TARGETS=('PEDS_R43_ENGINE_METAL','PEDS_R43_ENGINE_BANK_COVERS','PEDS_R43_GEARBOX_HOUSING')

def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest().upper()
def material(name,color,metal,rough):
    mat=bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.diffuse_color=(*color,1);mat.use_nodes=True
    shader=mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value=(*color,1)
    shader.inputs['Metallic'].default_value=metal
    shader.inputs['Roughness'].default_value=rough
    return mat
def bevel(obj,width=.012,segments=2):
    mod=obj.modifiers.new('Cast edge radius','BEVEL');mod.width=width;mod.segments=segments;mod.limit_method='ANGLE'
    bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=mod.name)
    return obj
def box(name,center,dimensions,mat,edge=.006):
    bpy.ops.mesh.primitive_cube_add(location=center);obj=bpy.context.object;obj.name=name;obj.dimensions=dimensions
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    obj.data.materials.append(mat)
    if edge:bevel(obj,edge)
    return obj
def cylinder(name,center,radius,depth,mat,axis=(0,0,1),vertices=16):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=center)
    obj=bpy.context.object;obj.name=name;obj.rotation_euler=Vector((0,0,1)).rotation_difference(Vector(axis)).to_euler();obj.data.materials.append(mat)
    bevel(obj,min(.006,depth*.2),1)
    return obj
def prism(name,rings,cross_sections,mat,edge=.008):
    # One closed tapered casting, with eight-point bevelled section in Y/Z.
    vertices=[];count=len(cross_sections[0])
    for x,section in zip(rings,cross_sections):vertices.extend((x,y,z) for y,z in section)
    faces=[tuple(reversed(range(count))),tuple((len(rings)-1)*count+i for i in range(count))]
    for layer in range(len(rings)-1):
        for i in range(count):faces.append((layer*count+i,layer*count+(i+1)%count,(layer+1)*count+(i+1)%count,(layer+1)*count+i))
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(vertices,[],faces);mesh.update()
    obj=bpy.data.objects.new(name,mesh);bpy.context.scene.collection.objects.link(obj);obj.data.materials.append(mat)
    if edge:bevel(obj,edge)
    return obj
def octagon(y,z,half_width,half_height,chamfer=.045):
    a=half_width;b=half_height;c=min(chamfer,a*.4,b*.4)
    return [(y-a+c,z-b),(y+a-c,z-b),(y+a,z-b+c),(y+a,z+b-c),(y+a-c,z+b),(y-a+c,z+b),(y-a,z+b-c),(y-a,z-b+c)]
def bank_section(sign):
    # V-like cam cover: central edge higher than the outer edge.
    pts=[(.065,.547),(.218,.525),(.232,.543),(.232,.585),(.217,.604),(.086,.674),(.064,.665),(.055,.59)]
    return [(sign*y,z) for y,z in (pts if sign>0 else list(reversed(pts)))]
def replace(target_name,parts):
    target=bpy.data.objects[target_name]
    target.data.clear_geometry();target.data.materials.clear()
    bpy.ops.object.select_all(action='DESELECT');target.select_set(True)
    for part in parts:part.select_set(True)
    bpy.context.view_layer.objects.active=target;bpy.ops.object.join()
    target.data.calc_loop_triangles()
    return len(target.data.loop_triangles)
def counts():
    meshes=[obj for obj in bpy.data.objects if obj.type=='MESH' and not obj.hide_render]
    for obj in meshes:obj.data.calc_loop_triangles()
    return {'meshObjects':len(meshes),'triangles':sum(len(obj.data.loop_triangles) for obj in meshes),'estimatedDrawCalls':sum(max(1,len({p.material_index for p in obj.data.polygons})) for obj in meshes)}

def main():
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE));before=counts()
    gun=material('PEDS_R44B_SATIN_GUNMETAL',(.17,.225,.255),.22,.39)
    carbon=material('PEDS_R44B_CAM_CARBON',(.04,.056,.068),.09,.48)
    shell=material('PEDS_R44B_GEARCASE_TITANIUM',(.31,.37,.41),.28,.40)
    metal=[prism('R44B tapered crankcase',[-1.435,-1.38,-.72,-.66],[octagon(0,.46,.16,.105),octagon(0,.46,.205,.145),octagon(0,.46,.19,.132),octagon(0,.46,.13,.095)],gun,.014)]
    for sign in (-1,1):
        metal.append(box('R44B long cast shoulder',(-1.04,sign*.187,.492),(.64,.028,.055),gun,.009))
        for i in range(4):
            metal.append(cylinder('R44B cylinder boss',(-1.29+i*.17,sign*.173,.574),.029,.05,gun,vertices=12))
        for i in range(5):
            metal.append(box('R44B side case structural rib',(-1.33+i*.145,sign*.205,.433),(.026,.034,.17),gun,.006))
    metal.append(cylinder('R44B crank access housing',(-.652,0,.445),.098,.033,gun,axis=(1,0,0),vertices=24))
    metal.append(box('R44B intake valley spine',(-1.05,0,.63),(.58,.045,.043),gun,.012))
    metal_tri=replace(TARGETS[0],metal)

    covers=[]
    for sign in (-1,1):
        section=bank_section(sign)
        covers.append(prism('R44B sloped cam bank',[-1.365,-1.33,-.75,-.71],[[(y*.91,z-.018) for y,z in section],section,section,[(y*.91,z-.018) for y,z in section]],carbon,.009))
        for i in range(3):
            covers.append(box('R44B cam service rib',(-1.255+i*.21,sign*.146,.635),(.022,.115,.017),carbon,.003))
        covers.append(box('R44B cam perimeter rail',(-1.04,sign*.214,.592),(.59,.016,.022),carbon,.004))
    cover_tri=replace(TARGETS[1],covers)

    gear=[prism('R44B tapered bellhousing',[-1.49,-1.55,-1.9,-1.97],[octagon(0,.43,.185,.15),octagon(0,.43,.195,.15),octagon(0,.42,.15,.118),octagon(0,.42,.12,.09)],shell,.017)]
    for i in range(4):
        gear.append(box('R44B transverse housing web',(-1.60-i*.078,0,.438),(.025,.31-i*.018,.235-i*.011),shell,.007))
        for sign in (-1,1):
            gear.append(box('R44B output case side rib',(-1.60-i*.078,sign*(.19-i*.01),.427),(.03,.025,.17-i*.01),shell,.005))
    gear.append(cylinder('R44B output inspection ring',(-1.975,0,.421),.08,.024,shell,axis=(1,0,0),vertices=20))
    gear.append(box('R44B top selector cover',(-1.73,0,.55),(.31,.205,.029),shell,.009))
    gear_tri=replace(TARGETS[2],gear)
    bpy.context.view_layer.update();after=counts()
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND))
    manifest=json.loads((ROOT/'r4-4-a'/'assembly-manifest-r4-4-a.json').read_text(encoding='utf-8'))
    manifest['version']='R4.4-B';manifest['schema']='peds.inside-the-machine.full-vehicle-assembly.v5.r4.4-b'
    manifest['geometry'].update(after)
    manifest['r44BContract']={'sourceBlendSha256':digest(SOURCE),'originalModelBSourceMeshesPreserved':64,'topLevelAssembliesPreserved':10,'runtimeTransformsPreserved':75,'remodeledIllustrativeMeshes':list(TARGETS),'newSemanticNodes':0,'manufacturerCadClaim':False}
    (OUT/'assembly-manifest-r4-4-b.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    report={'sourceBlendSha256':digest(SOURCE),'outputBlendSha256':digest(BLEND),'before':before,'after':after,'targetTriangles':dict(zip(TARGETS,(metal_tri,cover_tri,gear_tri))),'note':'Tapered, bevelled castings and sloped V-like cam banks inside accepted authored envelope; no source exterior changes'}
    (OUT/'mechanical-refinement.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8');print(json.dumps(report,indent=2))
if __name__=='__main__':main()
