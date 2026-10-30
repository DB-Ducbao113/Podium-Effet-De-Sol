"""R4.4-A -> R4.4-B mesh ownership, 75-node transform, and normal integrity audit."""
import hashlib,json,math,struct
from pathlib import Path
import bpy
ROOT=Path(__file__).resolve().parents[3]/'source-assets/models/inside-the-machine/authoring'
BASE=ROOT/'r4-4-c';OUT=ROOT/'r4-5';TARGETED={'PEDS_WHEEL_HUB_GEOMETRY','PEDS_FR_WHEEL_HUB_GEOMETRY','PEDS_RL_WHEEL_HUB_GEOMETRY','PEDS_RR_WHEEL_HUB_GEOMETRY'}
MANIFEST=json.loads((BASE/'assembly-manifest-r4-4-c.json').read_text(encoding='utf8'))
NODES=[x['node'] for x in MANIFEST['assemblies']+MANIFEST['components']]
def mesh_hash(obj):
    h=hashlib.sha256()
    for v in obj.data.vertices:
        for n in v.co:h.update(struct.pack('<d',float(n)))
    for p in obj.data.polygons:
        h.update(struct.pack('<i',p.material_index))
        for i in p.vertices:h.update(struct.pack('<i',i))
    for m in obj.data.materials:h.update((m.name if m else '').encode())
    return h.hexdigest()
def snapshot():
    return {'meshes':{o.name:mesh_hash(o) for o in bpy.data.objects if o.type=='MESH'},'nodes':{name:tuple(round(float(x),9) for row in bpy.data.objects[name].matrix_world for x in row) for name in NODES if name in bpy.data.objects},'sourceMaterials':{o.name:tuple(m.name for m in o.data.materials if m) for o in bpy.data.objects if o.type=='MESH' and not o.name.startswith('PEDS_R43_')}}
def invalid():
    records=[]
    for name in TARGETED:
        obj=bpy.data.objects[name];obj.data.calc_loop_triangles();deg=norm=0
        for tri in obj.data.loop_triangles:
            a,b,c=(obj.data.vertices[i].co for i in tri.vertices)
            if (b-a).cross(c-a).length<=1e-10:deg+=1
            if not all(math.isfinite(v) for v in tri.normal) or tri.normal.length<=1e-8:norm+=1
        records.append({'name':name,'triangles':len(obj.data.loop_triangles),'degenerate':deg,'invalidNormals':norm})
    return records
def main():
    bpy.ops.wm.open_mainfile(filepath=str(BASE/'model-b-cinematic-r4-4-c.blend'));before=snapshot()
    bpy.ops.wm.open_mainfile(filepath=str(OUT/'model-b-cinematic-r4-5.blend'));after=snapshot();records=invalid()
    changed=[name for name in before['meshes'].keys()&after['meshes'].keys() if before['meshes'][name]!=after['meshes'][name]]
    report={'sourceMeshCount':len([x for x in before['meshes'] if not x.startswith('PEDS_R43_')]),'missingMeshes':sorted(before['meshes'].keys()-after['meshes'].keys()),'addedMeshes':sorted(after['meshes'].keys()-before['meshes'].keys()),'changedMeshes':sorted(changed),'unexpectedChangedMeshes':sorted(set(changed)-TARGETED),'sourceMaterialsPreserved':before['sourceMaterials']==after['sourceMaterials'],'controlCount':len(after['nodes']),'missingControlNodes':sorted(before['nodes'].keys()-after['nodes'].keys()),'changedControlMatrices':sorted(name for name in before['nodes'].keys()&after['nodes'].keys() if before['nodes'][name]!=after['nodes'][name]),'refinedMeshQA':records}
    report['pass']=not report['missingMeshes'] and not report['addedMeshes'] and not report['unexpectedChangedMeshes'] and report['sourceMaterialsPreserved'] and report['controlCount']==75 and not report['missingControlNodes'] and not report['changedControlMatrices'] and all(x['degenerate']==0 and x['invalidNormals']==0 for x in records)
    (OUT/'geometry-transform-regression.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8');print(json.dumps(report,indent=2))
    if not report['pass']:raise RuntimeError('R4.5 geometry regression')
if __name__=='__main__':main()
