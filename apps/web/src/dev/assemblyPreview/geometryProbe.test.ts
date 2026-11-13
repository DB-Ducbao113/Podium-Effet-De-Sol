import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { probeOriginalGeometry } from './geometryProbe';

describe('source geometry probe — original GLB coordinate preservation',()=>{
 it('records source ROOT local metres, ignoring preview stage/world transform',()=>{
  const root=new THREE.Group();
  root.position.set(9,5,-3);
  root.rotation.y=.4;
  const wheel=new THREE.Mesh(new THREE.BoxGeometry(2,4,6));
  wheel.name='P2_TYRE_SLICK_BODY';
  wheel.position.set(1,2,3);
  root.add(wheel);
  const p=probeOriginalGeometry(root,'p28',1000);
  expect(p.sourceBoundsM[0][0]).toBeCloseTo(0);
  expect(p.sourceBoundsM[1][0]).toBeCloseTo(2);
  expect(p.sourceBoundsM[0][1]).toBeCloseTo(0);
  expect(p.sourceBoundsM[1][1]).toBeCloseTo(4);
  expect(p.sourceBoundsM[0][2]).toBeCloseTo(0);
  expect(p.sourceBoundsM[1][2]).toBeCloseTo(6);
  expect(p.meshCount).toBe(1);
  expect(p.triangleCount).toBe(12);
  expect(p.visualOnly).toBe(true);
 });
 it('refuses empty source geometry rather than inventing wheel centers',()=>{
  expect(()=>probeOriginalGeometry(new THREE.Group(),'model-b')).toThrow(/No decoded/);
 });
 it('includes all original meshes and does not modify scale/positions',()=>{
  const g=new THREE.Group();
  const left=new THREE.Mesh(new THREE.BoxGeometry(.2,.8,.8));
  left.name='FrontLeft';
  left.position.x=2;
  const right=new THREE.Mesh(new THREE.BoxGeometry(.2,.8,.8));
  right.name='FrontRight';
  right.position.x=-2;
  g.add(left,right);
  const previous=[...left.position.toArray(),...right.position.toArray()];
  const p=probeOriginalGeometry(g,'model-b',100);
  expect(Object.keys(p.subassemblies)).toEqual(['FrontLeft','FrontRight']);
  expect(p.sourceBoundsM[0][0]).toBeCloseTo(-2.1);
  expect(p.sourceBoundsM[1][0]).toBeCloseTo(2.1);
  expect([...left.position.toArray(),...right.position.toArray()]).toEqual(previous);
 });
});
