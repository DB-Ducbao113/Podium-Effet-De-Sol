"""Local R4.4-C detail pass on three already-authored R4.4-B mechanical meshes.

The accepted exterior, semantic objects, transforms, and parents are read only.
Geometry added here is illustrative and has no manufacturer CAD claim.
"""
import importlib.util
import json
from pathlib import Path
import bpy

REPO=Path(__file__).resolve().parents[3]
ROOT=REPO/'source-assets/models/inside-the-machine/authoring'
BASE=ROOT/'r4-4-b'
OUT=ROOT/'r4-4-c'
SOURCE=BASE/'model-b-cinematic-r4-4-b.blend'
OUTPUT=OUT/'model-b-cinematic-r4-4-c.blend'
TARGETS=('PEDS_R43_ENGINE_METAL','PEDS_R43_ENGINE_BANK_COVERS','PEDS_R43_GEARBOX_HOUSING')
spec=importlib.util.spec_from_file_location('r44b_refine_helpers',Path(__file__).with_name('refine_mechanics.py'))
helper=importlib.util.module_from_spec(spec)
spec.loader.exec_module(helper)

def join_into(target_name,parts):
    target=bpy.data.objects[target_name]
    bpy.ops.object.select_all(action='DESELECT')
    target.select_set(True)
    for part in parts:part.select_set(True)
    bpy.context.view_layer.objects.active=target
    bpy.ops.object.join()
    target.data.calc_loop_triangles()
    return len(target.data.loop_triangles)

def curved_casting(name,locations,widths,heights,material):
    sections=[helper.octagon(y,z,w,h,min(.019,w*.4,h*.6)) for (_,y,z),w,h in zip(locations,widths,heights)]
    return helper.prism(name,[x for x,_,_ in locations],sections,material,.008)

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
    before=helper.counts()
    gun=bpy.data.materials['PEDS_R44B_SATIN_GUNMETAL']
    carbon=bpy.data.materials['PEDS_R44B_CAM_CARBON']
    titanium=bpy.data.materials['PEDS_R44B_GEARCASE_TITANIUM']
    # Keep the existing materials and one semantic object per assembly. These
    # shapes add legible cast transitions at close inspection without tiny trim.
    metal=[]
    for sign in (-1,1):
        metal.append(curved_casting('R44C curved cylinder-bank shoulder',
            [(-1.36,sign*.18,.54),(-1.31,sign*.19,.555),(-1.05,sign*.20,.565),(-.79,sign*.19,.555),(-.73,sign*.17,.54)],
            [.025,.042,.050,.040,.020],[.022,.035,.045,.033,.018],gun))
        metal.append(curved_casting('R44C lower case transition',
            [(-1.35,sign*.16,.39),(-1.29,sign*.18,.40),(-1.05,sign*.19,.405),(-.78,sign*.17,.40),(-.71,sign*.14,.39)],
            [.025,.035,.046,.033,.018],[.027,.041,.049,.038,.018],gun))
    metal_tri=join_into(TARGETS[0],metal)

    covers=[]
    for sign in (-1,1):
        covers.append(curved_casting('R44C domed cam cover',
            [(-1.34,sign*.15,.625),(-1.30,sign*.15,.635),(-1.05,sign*.15,.646),(-.81,sign*.15,.635),(-.76,sign*.15,.621)],
            [.044,.070,.077,.067,.037],[.015,.031,.033,.029,.014],carbon))
        covers.append(curved_casting('R44C outer cam rail',
            [(-1.34,sign*.225,.606),(-1.30,sign*.224,.612),(-1.04,sign*.222,.619),(-.80,sign*.224,.612),(-.76,sign*.225,.606)],
            [.009,.013,.016,.013,.009],[.010,.015,.018,.015,.010],carbon))
    covers_tri=join_into(TARGETS[1],covers)

    gearbox=[curved_casting('R44C arched selector housing',
        [(-1.56,0,.559),(-1.61,0,.568),(-1.74,0,.573),(-1.87,0,.561),(-1.93,0,.536)],
        [.105,.129,.125,.098,.064],[.016,.035,.044,.036,.015],titanium)]
    for sign in (-1,1):
        gearbox.append(curved_casting('R44C swept gearbox side rib',
            [(-1.57,sign*.19,.47),(-1.62,sign*.197,.47),(-1.76,sign*.177,.46),(-1.86,sign*.146,.446),(-1.93,sign*.12,.43)],
            [.010,.015,.018,.014,.008],[.015,.022,.027,.019,.010],titanium))
    # Output flange is already authored. This cast lip reinforces its mounting
    # interface without moving the flange or making shaft-contact claims.
    bpy.ops.mesh.primitive_torus_add(major_segments=20,minor_segments=7,
        location=(-1.979,0,.421),major_radius=.084,minor_radius=.008)
    lip=bpy.context.object;lip.name='R44C output flange cast lip';lip.rotation_euler[1]=1.57079632679
    lip.data.materials.append(titanium);gearbox.append(lip)
    gearbox_tri=join_into(TARGETS[2],gearbox)

    bpy.context.view_layer.update()
    after=helper.counts()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT))
    manifest=json.loads((BASE/'assembly-manifest-r4-4-b.json').read_text(encoding='utf-8'))
    manifest['version']='R4.4-C'
    manifest['schema']='peds.inside-the-machine.full-vehicle-assembly.v5.r4.4-c'
    manifest['geometry'].update(after)
    manifest['r44CContract']={'sourceBlendSha256':helper.digest(SOURCE),'originalModelBSourceMeshesPreserved':64,
        'topLevelAssembliesPreserved':10,'runtimeTransformsPreserved':75,
        'remodeledIllustrativeMeshes':list(TARGETS),'newSemanticNodes':0,'manufacturerCadClaim':False,
        'rearShaftHubFit':'illustrative; source geometry unchanged'}
    (OUT/'assembly-manifest-r4-4-c.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    report={'sourceBlendSha256':helper.digest(SOURCE),'outputBlendSha256':helper.digest(OUTPUT),
        'before':before,'after':after,'targetTriangles':dict(zip(TARGETS,(metal_tri,covers_tri,gearbox_tri))),
        'newSemanticNodes':0,'rearShaftHub':'retained; no physical engagement claim'}
    (OUT/'mechanical-polish.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(report,indent=2))
if __name__=='__main__':main()
