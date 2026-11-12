/** P2.34AM: deterministic source-vertex particle overlay for verified Model B GLB.
 * Samples existing mesh positions only. No fabricated geometry or CAD acceptance.
 */
import * as THREE from 'three';

export type OwnerSourceParticles={
 points:THREE.Points<THREE.BufferGeometry,THREE.PointsMaterial>;
 dispose:()=>void;
 setAssemblyProgress:(progress:number)=>void;
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
 // Immutable targets come only from the decoded GLB. Movement is visual:
 // no point is interpreted as a new mechanical/CAD source part.
 const targets=new Float32Array(values);
 const renderPositions=new Float32Array(targets);
 const positionAttribute=new THREE.BufferAttribute(renderPositions,3);
 geometry.setAttribute('position',positionAttribute);
 const halfSpan=Math.max(1,geometryFromPositionsSpan(targets)*.1);
 const offsets=new Float32Array(targets.length);
 for(let i=0;i<targets.length/3;i++){
  // Fixed, repeatable particle travel; no random seeded source geometry.
  const a=i*2.399963229728653;
  const r=halfSpan*(.2+.8*((i*37)%101)/100);
  offsets[i*3]=Math.cos(a)*r;
  offsets[i*3+1]=Math.sin(a*1.37)*r*.68;
  offsets[i*3+2]=Math.sin(a)*r;
 }
 let previousFraction=-1;
 const setAssemblyProgress=(progress:number)=>{
  const fraction=ownerParticleAssemblyFraction(progress);
  if(fraction===previousFraction)return;
  previousFraction=fraction;
  const separation=1-fraction;
  for(let j=0;j<targets.length;j++)
   renderPositions[j]=targets[j]+offsets[j]*separation;
  positionAttribute.needsUpdate=true;
 };
 geometry.computeBoundingSphere();
 const material=new THREE.PointsMaterial({
  color:'#87929d',size:.073,sizeAttenuation:true,transparent:true,
  opacity:0,depthWrite:false,depthTest:true,
 });
 const points=new THREE.Points(geometry,material);
 points.name='verified-model-b-source-cad-vertices';
 points.frustumCulled=false;
 points.visible=false;
 setAssemblyProgress(0);
 return {points,sampleCount:values.length/3,sampledMeshCount:source.length,
         setAssemblyProgress,
         dispose:()=>{geometry.dispose();material.dispose();}};
}

function geometryFromPositionsSpan(positions:Float32Array):number{
 let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity,minZ=Infinity,maxZ=-Infinity;
 for(let i=0;i<positions.length;i+=3){
  minX=Math.min(minX,positions[i]);maxX=Math.max(maxX,positions[i]);
  minY=Math.min(minY,positions[i+1]);maxY=Math.max(maxY,positions[i+1]);
  minZ=Math.min(minZ,positions[i+2]);maxZ=Math.max(maxZ,positions[i+2]);
 }
 return Math.hypot(maxX-minX,maxY-minY,maxZ-minZ);
}

/** Deterministic source-vertex convergence; 1 means exact original vertices. */
export function ownerParticleAssemblyFraction(progress:number):number{
 const p=Number.isFinite(progress)?Math.max(0,Math.min(1,progress)):0;
 const t=Math.max(0,Math.min(1,(p-.12)/.58));
 return t*t*(3-2*t);
}

/** Chapter-local accent: never claims mechanical fit and never obscures final car. */
export function ownerParticleOpacity(progress:number):number{
 const p=Number.isFinite(progress)?Math.max(0,Math.min(1,progress)):0;
 if(p<=.1||p>=.84)return 0;
 const intro=Math.min(1,(p-.1)/.08);
 const outro=Math.min(1,(.84-p)/.13);
 return .55*Math.min(intro,outro);
}
