/** P2.34AM: deterministic source-vertex particle overlay for verified Model B GLB.
 * Samples existing mesh positions only. No fabricated geometry or CAD acceptance.
 */
import * as THREE from 'three';

export type OwnerSourceParticles={
 points:THREE.Points<THREE.BufferGeometry,THREE.PointsMaterial>;
 dispose:()=>void;
 sampleCount:number;
 sampledMeshCount:number;
};

export function buildOwnerSourceParticles(root:THREE.Group,budget=7200):OwnerSourceParticles{
 if(!Number.isInteger(budget)||budget<256||budget>30000)
   throw Error('Original source vertex budget invalid');
 root.updateWorldMatrix(true,true);
 const source:THREE.Mesh[]=[];
 let total=0;
 root.traverse(node=>{
  if(!(node instanceof THREE.Mesh))return;
  const attr=node.geometry.getAttribute('position');
  if(!(attr instanceof THREE.BufferAttribute)||
      attr.itemSize!==3||attr.count===0)return;
  source.push(node);total+=attr.count;
 });
 if(total===0)throw Error('No original Model B position vertices');
 // The original GLB is already Git-identity-checked by useOriginalBody.
 // Allocate samples proportionally to actual source vertex counts, not
 // fabricated points. Every material uses the same neutral CAD color.
 const transform=new THREE.Matrix4();
 const inverse=root.matrixWorld.clone().invert();
 const point=new THREE.Vector3();
 const values:number[]=[];
 for(const mesh of source){
  const attr=mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
  const count=Math.max(1,Math.floor(budget*attr.count/total));
  const stride=Math.max(1,Math.ceil(attr.count/count));
  transform.multiplyMatrices(inverse,mesh.matrixWorld);
  let taken=0;
  for(let index=0;index<attr.count&&taken<count;index+=stride){
   point.set(attr.getX(index),attr.getY(index),attr.getZ(index))
     .applyMatrix4(transform);
   if(Number.isFinite(point.x)&&Number.isFinite(point.y)&&Number.isFinite(point.z)){
    values.push(point.x,point.y,point.z);
    taken++;
   }
  }
 }
 if(values.length===0)throw Error('Original Model B mesh vertices nonfinite');
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(values,3));
 geometry.computeBoundingSphere();
 const material=new THREE.PointsMaterial({
  color:'#87929d',size:.073,sizeAttenuation:true,transparent:true,
  opacity:0,depthWrite:false,depthTest:true,
 });
 const points=new THREE.Points(geometry,material);
 points.name='verified-model-b-source-cad-vertices';
 points.frustumCulled=false;
 points.visible=false;
 return {points,sampleCount:values.length/3,sampledMeshCount:source.length,
         dispose:()=>{geometry.dispose();material.dispose();}};
}

/** Chapter-local accent: never claims mechanical fit and never obscures final car. */
export function ownerParticleOpacity(progress:number):number{
 const p=Number.isFinite(progress)?Math.max(0,Math.min(1,progress)):0;
 if(p<=.1||p>=.84)return 0;
 const intro=Math.min(1,(p-.1)/.08);
 const outro=Math.min(1,(.84-p)/.13);
 return .55*Math.min(intro,outro);
}
