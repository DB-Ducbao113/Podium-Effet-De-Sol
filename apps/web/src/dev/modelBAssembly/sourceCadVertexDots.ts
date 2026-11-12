/** P2.44 — dotted assembly made exclusively from decoded original CAD vertices.
 *
 * These point-cloud overlays sample existing original P2.8/P2.12/P2.14
 * geometry. They are not synthetic hardware, mechanical mates or proxies.
 * The sample points are children of their exact original mounted mesh nodes:
 * the selected screw pivot, wheel carrier, wheel Y rotation and reversible
 * assembly offsets automatically propagate to every source-vertex dot.
 */
import * as THREE from 'three';
import {sourceSampleIndices} from './ownerParticleSampling';
import {sourceMeshWorldFocusBounds} from './cadFocus';

export type SourceCadVertexDots={
 points:THREE.Points<THREE.BufferGeometry,THREE.PointsMaterial>;
 sampleCount:number;
 sourceVertexCount:number;
 dispose:()=>void;
};

/** Pixel-independent 3D dot radii fitted to actual source geometry. */
export function sourceCadVertexDotSize(worldDiagonal:number):number{
 if(!Number.isFinite(worldDiagonal)||worldDiagonal<=0)
  throw Error('Original CAD vertex point bounds invalid');
 return Math.min(.012,Math.max(.0015,worldDiagonal*.018));
}

/** Only appears mid-assembly; never covers the original final CAD geometry. */
export function sourceCadAssemblyDotOpacity(
 assemblyFraction:number,reducedMotion:boolean,
):number{
 if(reducedMotion||!Number.isFinite(assemblyFraction))return 0;
 const p=Math.max(0,Math.min(1,assemblyFraction));
 return .67*Math.sin(Math.PI*p);
}

/** Keep the source CAD inspection overlay stationary relative to the REAL
 * selected mesh; it must never create imaginary dots outside the GLB surface.
 */
export function sourceCadInspectionDotOpacity(
 inspecting:boolean,reducedMotion:boolean,
):number{
 return inspecting&&!reducedMotion?.82:0;
}

/** Allocate only a bounded sampled overlay. This does not modify
 * mesh.geometry, source indices, any original vertex buffer or transforms.
 * sourceSampleIndices ensures globally deterministic, spaced source sampling.
 */
export function buildSourceCadVertexDots(
 mesh:THREE.Mesh,
 budget=1100,
 inspection=false,
):SourceCadVertexDots{
 if(!(mesh instanceof THREE.Mesh)||
    !Number.isInteger(budget)||budget<256||budget>30000)
  throw Error('Original CAD vertex source or sampling budget invalid');
 const source=mesh.geometry.getAttribute('position');
 if(!(source instanceof THREE.BufferAttribute||
      source instanceof THREE.InterleavedBufferAttribute)||
      source.itemSize!==3||source.count<3)
  throw Error('Original CAD vertex points require authentic geometry');
 const bound=sourceMeshWorldFocusBounds(mesh);
 const indices=sourceSampleIndices(source.count,budget);
 const positions=new Float32Array(indices.length*3);
 for(let i=0;i<indices.length;i++){
  const index=indices[i];
  const x=source.getX(index),y=source.getY(index),z=source.getZ(index);
  if(![x,y,z].every(Number.isFinite))
   throw Error('Original CAD source contains nonfinite vertex positions');
  positions[3*i]=x;
  positions[3*i+1]=y;
  positions[3*i+2]=z;
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
 geometry.computeBoundingSphere();
 // The native vertex coordinates are immutable after allocation. Start the
 // construction overlay with zero visible samples; the selected inspector
 // intentionally shows all original samples at once.
 geometry.setDrawRange(0,inspection?indices.length:0);
 const material=new THREE.PointsMaterial({
  color:inspection?'#e1dad0':'#a2adae',
  size:sourceCadVertexDotSize(bound.diagonal),
  sizeAttenuation:true,transparent:true,
  // Source vertex dots coincide with the native solid CAD surface. Ordinary
  // depth testing makes them disappear behind the exact source triangle.
  // Show dots during assembly in a late *presentation-only* pass, and disable
  // them completely in the final authentic solid-part pose.
  opacity:0,depthTest:false,depthWrite:false,
 });
 const points=new THREE.Points(geometry,material);
 points.name=inspection?
   'authentic-selected-cad-vertex-dots':
   'authentic-four-wheel-cad-vertex-dots';
 // Build dots are placed after normal CAD materials so their authentic
 // sampled vertex positions remain visible rather than z-fighting with the
 // source mesh; selected inspection dots render above the X-ray part.
 points.renderOrder=inspection?1002:850;
 points.frustumCulled=false;
 points.visible=false;
 mesh.add(points);
 let disposed=false;
 return {
  points,sampleCount:indices.length,sourceVertexCount:source.count,
  dispose:()=>{
   if(disposed)return;
   disposed=true;
   // An already-unmounted source object must never report late render
   // evidence into the replacement Model B scene.
   points.onAfterRender=()=>{};
   mesh.remove(points);
   geometry.dispose();
   material.dispose();
  },
 };
}
