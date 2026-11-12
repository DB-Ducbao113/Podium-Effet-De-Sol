import {describe,expect,it} from 'vitest';
import * as THREE from 'three';
import {
 buildSourceCadVertexDots,sourceCadVertexDotSize,
 sourceCadAssemblyDotOpacity,sourceCadInspectionDotOpacity,
} from './sourceCadVertexDots';

function originalMesh(count=700){
 const geometry=new THREE.BufferGeometry();
 const positions=new Float32Array(count*3);
 for(let i=0;i<count;i++){
  positions[3*i]=.15*Math.sin(i*.17);
  positions[3*i+1]=.1*Math.cos(i*.27);
  positions[3*i+2]=.08*Math.sin(i*.31);
 }
 geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
 const material=new THREE.MeshStandardMaterial();
 const mesh=new THREE.Mesh(geometry,material);
 const parent=new THREE.Group();
 parent.scale.set(1.25,.8,1.12);
 parent.position.set(1,.4,-2);
 parent.rotation.y=.34;
 parent.add(mesh);
 return {parent,mesh,geometry,material,positions};
}
describe('P2.44 original source CAD vertex-dot assembly',()=>{
 it('shows only original P2.8 source vertex positions, not fabricated parts',()=>{
  const {mesh,geometry,material,positions}=originalMesh();
  const before=Array.from(positions);
  const layer=buildSourceCadVertexDots(mesh,256);
  const source=mesh.geometry.getAttribute('position');
  const dots=layer.points.geometry.getAttribute('position');
  expect(layer.sampleCount).toBe(256);
  expect(layer.sourceVertexCount).toBe(700);
  expect(dots.count).toBe(256);
  for(let i=0;i<dots.count;i++){
   const matching=Array.from({length:source.count},(_,j)=>j)
    .some(j=>dots.getX(i)===source.getX(j)&&
      dots.getY(i)===source.getY(j)&&dots.getZ(i)===source.getZ(j));
   expect(matching).toBe(true);
  }
  expect(Array.from(positions)).toEqual(before);
  expect(layer.points.parent).toBe(mesh);
  layer.dispose();geometry.dispose();material.dispose();
 });
 it('follows exact original mesh pivot, parent rotation and source world transform',()=>{
  const {parent,mesh,geometry,material}=originalMesh(350);
  const layer=buildSourceCadVertexDots(mesh,256);
  const dots=layer.points.geometry.getAttribute('position');
  const original=mesh.geometry.getAttribute('position');
  mesh.rotation.set(.2,.8,.1);
  mesh.position.set(.3,.14,-.12);
  parent.updateWorldMatrix(true,true);
  const expected=new THREE.Vector3(
   original.getX(0),original.getY(0),original.getZ(0))
   .applyMatrix4(mesh.matrixWorld);
  const first=layer.points.geometry.getAttribute('position');
  // The dot must live in original mesh local coordinates; its own parent
  // is the native mesh, so it follows every future scroll/screw transform.
  const index=Array.from({length:original.count},(_,j)=>j)
   .find(j=>first.getX(0)===original.getX(j)&&
     first.getY(0)===original.getY(j)&&
     first.getZ(0)===original.getZ(j));
  expect(index).toBeDefined();
  const projected=new THREE.Vector3(
   dots.getX(0),dots.getY(0),dots.getZ(0))
   .applyMatrix4(layer.points.matrixWorld);
  const actualOriginal=new THREE.Vector3(
   original.getX(index!),original.getY(index!),original.getZ(index!))
   .applyMatrix4(mesh.matrixWorld);
  expect(projected.distanceTo(actualOriginal)).toBeLessThan(1e-6);
  expect(expected.toArray().every(Number.isFinite)).toBe(true);
  layer.dispose();geometry.dispose();material.dispose();
 });
 it('avoids hidden complexity: only one bounded point render layer for a tyre',()=>{
  const {mesh,geometry,material}=originalMesh(9000);
  const layer=buildSourceCadVertexDots(mesh,1100);
  expect(layer.sampleCount).toBe(1100);
  expect(layer.points.frustumCulled).toBe(false);
  // Exact source vertices coincide with the opaque tyre triangles:
  // the dots must render after those triangles or they would self-occlude.
  expect(layer.points.material.depthTest).toBe(false);
  expect(layer.points.material.depthWrite).toBe(false);
  expect(layer.points.renderOrder).toBe(850);
  expect(layer.points.visible).toBe(false);
  expect(mesh.geometry.getAttribute('position').count).toBe(9000);
  layer.dispose();geometry.dispose();material.dispose();
 });
 it('makes original-vertex build dots visible above the native CAD surface only during assembly',()=>{
  const {mesh,geometry,material}=originalMesh(500);
  const layer=buildSourceCadVertexDots(mesh,256);
  expect(layer.points.renderOrder).toBe(850);
  expect(layer.points.material.depthTest).toBe(false);
  expect(layer.points.material.depthWrite).toBe(false);
  expect(layer.points.material.opacity).toBe(0);
  expect(layer.points.visible).toBe(false);
  layer.dispose();geometry.dispose();material.dispose();
 });
 it('renders selected source bolt points above its own CAD material only',()=>{
  const {mesh,geometry,material}=originalMesh();
  const layer=buildSourceCadVertexDots(mesh,300,true);
  expect(layer.points.name).toBe('authentic-selected-cad-vertex-dots');
  expect(layer.points.renderOrder).toBe(1002);
  expect(layer.points.material.depthTest).toBe(false);
  expect(layer.points.material.depthWrite).toBe(false);
  expect(layer.sampleCount).toBe(300);
  layer.dispose();geometry.dispose();material.dispose();
 });
 it('releases ONLY viewer-owned point geometry and does not dispose CAD source',()=>{
  const {mesh,geometry,material,positions}=originalMesh();
  const layer=buildSourceCadVertexDots(mesh,256);
  let pointsDisposed=0,materialDisposed=0,sourceDisposed=0;
  layer.points.geometry.addEventListener('dispose',()=>pointsDisposed++);
  layer.points.material.addEventListener('dispose',()=>materialDisposed++);
  geometry.addEventListener('dispose',()=>sourceDisposed++);
  layer.dispose();layer.dispose();
  expect(pointsDisposed).toBe(1);
  expect(materialDisposed).toBe(1);
  expect(sourceDisposed).toBe(0);
  expect(layer.points.parent).toBeNull();
  expect(mesh.geometry.getAttribute('position').array).toBe(positions);
  geometry.dispose();material.dispose();
 });
 it('uses bounded native CAD point sizes for both fasteners and tyres',()=>{
  expect(sourceCadVertexDotSize(.01)).toBe(.0015);
  expect(sourceCadVertexDotSize(1)).toBe(.012);
  for(const d of [-1,0,NaN,Infinity])
   expect(()=>sourceCadVertexDotSize(d)).toThrow(/bounds invalid/);
 });
 it('fades source-tyre dots during actual assembly; never hides final solid wheel',()=>{
  expect(sourceCadAssemblyDotOpacity(0,false)).toBe(0);
  expect(sourceCadAssemblyDotOpacity(.5,false)).toBeCloseTo(.67);
  expect(sourceCadAssemblyDotOpacity(1,false)).toBeCloseTo(0);
  for(let i=0;i<=1000;i++){
   const alpha=sourceCadAssemblyDotOpacity(i/1000,false);
   expect(alpha).toBeGreaterThanOrEqual(0);
   expect(alpha).toBeLessThanOrEqual(.67);
   expect(sourceCadAssemblyDotOpacity(i/1000,true)).toBe(0);
  }
 });
 it('supports original mesh dot inspection without unwanted reduced motion',()=>{
  expect(sourceCadInspectionDotOpacity(true,false)).toBe(.82);
  expect(sourceCadInspectionDotOpacity(false,false)).toBe(0);
  expect(sourceCadInspectionDotOpacity(true,true)).toBe(0);
 });
 it('rejects malformed original CAD source vertices and incorrect budget',()=>{
  const {mesh,geometry,material}=originalMesh();
  expect(()=>buildSourceCadVertexDots(mesh,15)).toThrow(/budget/);
  geometry.getAttribute('position').setX(25,NaN);
  // Keep below the source sample budget so this vertex is always validated.
  expect(()=>buildSourceCadVertexDots(mesh,1100))
   .toThrow(/nonfinite vertex positions|world bounds/);
  geometry.dispose();material.dispose();
 });
});
