import * as THREE from 'three';

/**
 * DEV engineering diagnostic, original GLB source is unchanged.
 * Bounds and vertex samples are in source ROOT coordinates, metres.
 * Meshopt decode is performed by the existing GLTFLoader, not approximated.
 */
export type SourceGeometryProbe = {
  schema: 'podium-eds.geometry-probe.v1';
  source: 'model-b' | 'p28';
  unit: 'm';
  vertexCount: number;
  triangleCount: number;
  meshCount: number;
  sourceBoundsM: [[number, number, number],[number,number,number]];
  subassemblies: Record<string, {
    vertexCount: number;
    sourceBoundsM: [[number,number,number],[number,number,number]];
  }>;
  sampledVerticesM: [number,number,number][];
  samplingStride: number;
  sampleLimit: number;
  visualOnly: true;
};

/** Never includes material textures, geometry connectivity or proprietary CAD solids. */
export function probeOriginalGeometry(
  root: THREE.Object3D, source: 'model-b' | 'p28', maxSamples=28000,
): SourceGeometryProbe {
  root.updateWorldMatrix(true,true);
  const reverse = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const partRecords: {name:string; mesh:THREE.Mesh; count:number}[]=[];
  let vertexCount=0,triangleCount=0;
  root.traverse((object)=>{
    if(!(object instanceof THREE.Mesh))return;
    const position=object.geometry.getAttribute('position');
    if(!position || position.itemSize!==3) return;
    partRecords.push({name:object.name||'unnamed',mesh:object,count:position.count});
    vertexCount+=position.count;
    const index=object.geometry.getIndex();
    triangleCount+=Math.floor((index?.count??position.count)/3);
  });
  if(vertexCount===0)throw new Error('No decoded source vertices for engineering probe');
  const stride=Math.max(1,Math.ceil(vertexCount/Math.max(100,maxSamples)));
  const global=new THREE.Box3();
  const subassemblies: SourceGeometryProbe['subassemblies']={};
  const samples: [number,number,number][]=[];
  const v=new THREE.Vector3();
  const transform=new THREE.Matrix4();
  let n=0;
  for(const record of partRecords){
    const bounds=new THREE.Box3();
    transform.multiplyMatrices(reverse,record.mesh.matrixWorld);
    const pos=record.mesh.geometry.getAttribute('position');
    for(let i=0;i<record.count;i++){
      v.set(pos.getX(i),pos.getY(i),pos.getZ(i)).applyMatrix4(transform);
      if(!Number.isFinite(v.x)||!Number.isFinite(v.y)||!Number.isFinite(v.z)){
        throw new Error('Non-finite original GLB vertex');
      }
      bounds.expandByPoint(v);
      global.expandByPoint(v);
      if(n%stride===0 && samples.length<maxSamples){
        samples.push([+v.x.toFixed(5),+v.y.toFixed(5),+v.z.toFixed(5)]);
      }
      n++;
    }
    if(bounds.isEmpty())continue;
    subassemblies[record.name]={
      vertexCount:record.count,
      sourceBoundsM:[bounds.min.toArray(),bounds.max.toArray()],
    };
    transform.identity();
  }
  return {
    schema:'podium-eds.geometry-probe.v1',source,unit:'m',
    vertexCount,triangleCount,meshCount:partRecords.length,
    sourceBoundsM:[global.min.toArray(),global.max.toArray()],
    subassemblies,
    sampledVerticesM:samples,
    samplingStride:stride,sampleLimit:maxSamples,
    visualOnly:true,
  };
}
