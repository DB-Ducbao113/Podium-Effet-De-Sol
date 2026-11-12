import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {
 sourceBodyWorldRevealStrength,sourceMeshOwnWorldBounds,sourceMeshRevealWorldDirection,worldDeltaToParentLocal,
} from './sourceWorldReveal';

function near(actual:number,expected:number){
 expect(actual).toBeCloseTo(expected,7);
}
describe('P2.37A nested original THREE GLB world transforms',()=>{
 it('preserves intended world offset through shell scaling, parent rotation and nonuniform scale',()=>{
  const scene=new THREE.Group();
  const shell=new THREE.Group();
  shell.scale.setScalar(.17357287237986882);
  scene.add(shell);
  const parent=new THREE.Group();
  parent.position.set(.8,-.4,1.2);
  parent.rotation.set(.17,1.06,-.31);
  parent.scale.set(1.4,.75,2.3);
  shell.add(parent);
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(.45,.28,.3));
  mesh.position.set(.25,-.09,.12);
  parent.add(mesh);
  scene.updateWorldMatrix(true,true);
  const worldBox=new THREE.Box3().setFromObject(mesh);
  const worldExtent=worldBox.getSize(new THREE.Vector3()).length();
  const strength=sourceBodyWorldRevealStrength(worldExtent,.5);
  expect(strength).toBeGreaterThan(0);
  const centroid=new THREE.Box3().setFromObject(mesh)
   .getCenter(new THREE.Vector3());
  const worldDelta=new THREE.Vector3(...sourceMeshRevealWorldDirection(
   [centroid.x,centroid.y,centroid.z])).multiplyScalar(strength);
  near(worldDelta.length(),strength);
  const originalLocal=mesh.position.clone();
  const originalWorld=mesh.getWorldPosition(new THREE.Vector3());
  const inverse=parent.matrixWorld.clone().invert();
  const localDelta=worldDeltaToParentLocal(
   [worldDelta.x,worldDelta.y,worldDelta.z],inverse.elements);
  mesh.position.add(new THREE.Vector3(...localDelta));
  scene.updateWorldMatrix(true,true);
  const actual=mesh.getWorldPosition(new THREE.Vector3())
   .sub(originalWorld);
  near(actual.x,worldDelta.x);
  near(actual.y,worldDelta.y);
  near(actual.z,worldDelta.z);
  // The source model retains its authored matrix exactly at final progress.
  mesh.position.copy(originalLocal);
  scene.updateWorldMatrix(true,true);
  const restored=mesh.getWorldPosition(new THREE.Vector3());
  near(restored.x,originalWorld.x);
  near(restored.y,originalWorld.y);
  near(restored.z,originalWorld.z);
  mesh.geometry.dispose();
 });
 it('excludes giant nested descendants from a genuine small owner source mesh',()=>{
  const shell=new THREE.Group();
  shell.scale.setScalar(.17357287237986882);
  const parentMesh=new THREE.Mesh(new THREE.BoxGeometry(.3,.2,.1));
  shell.add(parentMesh);
  const giantChild=new THREE.Mesh(new THREE.BoxGeometry(30,3,4));
  giantChild.position.set(6,0,0);
  parentMesh.add(giantChild);
  shell.updateWorldMatrix(true,true);
  // Box3.setFromObject aggregates the nested giant child: wrong for the
  // source-only assembly phase of the small parent mesh itself.
  const aggregate=new THREE.Box3().setFromObject(parentMesh)
   .getSize(new THREE.Vector3()).length();
  expect(aggregate).toBeGreaterThan(2.3);
  parentMesh.geometry.computeBoundingBox();
  const original=parentMesh.geometry.boundingBox;
  expect(original).not.toBeNull();
  if(!original)throw Error('Missing authored source box');
  const own=sourceMeshOwnWorldBounds(
    [original.min.x,original.min.y,original.min.z],
    [original.max.x,original.max.y,original.max.z],
    parentMesh.matrixWorld.elements);
  expect(own.diagonal).toBeLessThan(.2);
  expect(sourceBodyWorldRevealStrength(own.diagonal,.5)).toBeGreaterThan(0);
  expect(sourceBodyWorldRevealStrength(aggregate,.5)).toBe(0);
  parentMesh.geometry.dispose();
  giantChild.geometry.dispose();
 });
 it('measures oversized original chassis in world space without applying shell scale twice',()=>{
  const root=new THREE.Group();
  root.scale.setScalar(.15);
  const chassis=new THREE.Mesh(new THREE.BoxGeometry(30,3,4));
  root.add(chassis);
  root.updateWorldMatrix(true,true);
  const extent=new THREE.Box3().setFromObject(chassis)
   .getSize(new THREE.Vector3()).length();
  expect(extent).toBeGreaterThan(2.3);
  expect(sourceBodyWorldRevealStrength(extent,.3)).toBe(0);
  chassis.geometry.dispose();
 });
});
