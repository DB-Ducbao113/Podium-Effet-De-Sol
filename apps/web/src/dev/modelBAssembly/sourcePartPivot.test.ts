import {describe,expect,it} from 'vitest';
import * as THREE from 'three';
import {applyVisualScrewSpin,pivotSourceMeshAtCentroid} from './sourcePartPivot';
const closeMatrix=(a:THREE.Matrix4,b:THREE.Matrix4)=>{
  for(let i=0;i<16;i++)expect(a.elements[i]).toBeCloseTo(b.elements[i],7);
};
describe('Original CAD screw source pivot preserves final native geometry',()=>{
 it('preserves non-centred GLB source mesh world matrix with rotation, scale and parent',()=>{
  const root=new THREE.Group();
  const parent=new THREE.Group();
  parent.position.set(1,2,-.4);
  parent.rotation.y=Math.PI;
  root.add(parent);
  const geometry=new THREE.BoxGeometry(.007,.009,.035);
  geometry.translate(.12,-.04,.32); // source CAD vertices far from local origin
  const original=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial());
  original.name='P28_SOURCE_NATIVE_BOLT';
  original.position.set(-.31,.44,.26);
  original.rotation.set(.13,.22,-.18);
  original.scale.set(1.1,.8,1.3);
  parent.add(original);
  root.updateWorldMatrix(true,true);
  const originalMatrix=original.matrixWorld.clone();
  const originalPartRootCount=parent.children.length;
  const pivot=pivotSourceMeshAtCentroid(original);
  root.updateWorldMatrix(true,true);
  closeMatrix(original.matrixWorld,originalMatrix);
  expect(parent.children.length).toBe(originalPartRootCount);
  expect(pivot.root.children).toEqual([original]);
  expect(pivot.root.name).toContain('P28_SOURCE_NATIVE_BOLT');
  expect(original.matrixWorld.determinant()).toBeGreaterThan(0);
  expect(pivot.spinAxis.z).toBe(1);

  applyVisualScrewSpin(pivot,.25,2);
  root.updateWorldMatrix(true,true);
  expect(original.matrixWorld.elements.some((v,i)=>
    Math.abs(v-originalMatrix.elements[i])>1e-5)).toBe(true);
  applyVisualScrewSpin(pivot,1,2);
  root.updateWorldMatrix(true,true);
  closeMatrix(original.matrixWorld,originalMatrix);
  geometry.dispose();
 });
 it('rejects absent source parent and invalid geometry',()=>{
  const unparented=new THREE.Mesh(new THREE.BoxGeometry(1,1,1));
  expect(()=>pivotSourceMeshAtCentroid(unparented)).toThrow(/attached/);
  const group=new THREE.Group();
  const empty=new THREE.Mesh(new THREE.BufferGeometry());
  group.add(empty);
  expect(()=>pivotSourceMeshAtCentroid(empty)).toThrow(/bounds/);
 });
 it('restores the native source orientation at the last scroll frame',()=>{
  const root=new THREE.Group();
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(.01,.01,.05));
  root.add(mesh);mesh.rotation.y=.7;
  root.updateWorldMatrix(true,true);
  const matrix=mesh.matrixWorld.clone();
  const item=pivotSourceMeshAtCentroid(mesh);
  applyVisualScrewSpin(item,.7,1.5);
  applyVisualScrewSpin(item,1,1.5);
  root.updateWorldMatrix(true,true);
  closeMatrix(mesh.matrixWorld,matrix);
  expect(()=>applyVisualScrewSpin(item,.2,99)).toThrow(/turn count/);
  applyVisualScrewSpin(item,Number.NaN,1.5);
  root.updateWorldMatrix(true,true);
  closeMatrix(mesh.matrixWorld,matrix);
 });
});
