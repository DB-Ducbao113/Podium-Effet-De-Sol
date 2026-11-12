import {describe,expect,it} from 'vitest';
import * as THREE from 'three';
import {buildOwnerSourceParticles,ownerParticleOpacity,ownerParticleAssemblyFraction} from './ownerSourceParticles';

function originalFixture(){
 const root=new THREE.Group();
 root.position.set(3,0,1);
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute([
   0,0,0, 1,0,0, 0,1,0, 0,0,1,
 ],3));
 const mesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial());
 mesh.name='original-mesh';
 mesh.position.set(4,2,0);
 root.add(mesh);
 return {root,mesh,g};
}

describe('Model B authenticated source vertex dust',()=>{
 it('samples exact original GLB geometry; never invents sampled positions',()=>{
   const {root,mesh,g}=originalFixture();
   const particles=buildOwnerSourceParticles(root,256);
   const positions=particles.points.geometry.getAttribute('position');
   expect(particles.sampledMeshCount).toBe(1);
   expect(particles.sampleCount).toBe(4);
   // Animated initial positions are deliberately displaced for the reveal.
   particles.setAssemblyProgress(.7);
   expect(positions.getX(0)).toBeCloseTo(4);
   expect(positions.getY(0)).toBeCloseTo(2);
   expect(positions.getZ(0)).toBeCloseTo(0);
   expect(positions.getX(1)).toBeCloseTo(5);
   expect(particles.points.material.color.getHexString()).toBe('87929d');
   expect(particles.points.visible).toBe(false);
   particles.dispose();
   g.dispose();
   (mesh.material as THREE.Material).dispose();
 });
 it('animates original vertices to exact source coordinates and reverses',()=>{
   const {root,mesh,g}=originalFixture();
   const particles=buildOwnerSourceParticles(root,256);
   const attr=particles.points.geometry.getAttribute('position') as THREE.BufferAttribute;
   const start=Array.from(attr.array);
   expect(start[0]).not.toBeCloseTo(4);
   particles.setAssemblyProgress(.7);
   expect(attr.getX(0)).toBeCloseTo(4,5);
   expect(attr.getY(0)).toBeCloseTo(2,5);
   expect(attr.getZ(0)).toBeCloseTo(0,5);
   expect(attr.getX(1)).toBeCloseTo(5,5);
   expect(attr.getY(1)).toBeCloseTo(2,5);
   particles.setAssemblyProgress(.25);
   const intermediate=Array.from(attr.array);
   expect(intermediate).not.toEqual(start);
   particles.setAssemblyProgress(0);
   expect(Array.from(attr.array)).toEqual(start);
   particles.dispose();g.dispose();(mesh.material as THREE.Material).dispose();
 });
 it('repeats deterministic geometry for identical original source input',()=>{
   const {root,mesh,g}=originalFixture();
   const first=buildOwnerSourceParticles(root,256);
   const second=buildOwnerSourceParticles(root,256);
   first.setAssemblyProgress(.41);
   second.setAssemblyProgress(.41);
   expect(Array.from(first.points.geometry.getAttribute('position').array))
     .toEqual(Array.from(second.points.geometry.getAttribute('position').array));
   first.dispose();second.dispose();g.dispose();(mesh.material as THREE.Material).dispose();
 });
 it('interpolates monotonically and finishes by original car reveal',()=>{
   expect(ownerParticleAssemblyFraction(0)).toBe(0);
   expect(ownerParticleAssemblyFraction(.12)).toBe(0);
   expect(ownerParticleAssemblyFraction(.35)).toBeGreaterThan(0);
   expect(ownerParticleAssemblyFraction(.5)).toBeGreaterThan(
     ownerParticleAssemblyFraction(.35));
   expect(ownerParticleAssemblyFraction(.7)).toBe(1);
   expect(ownerParticleAssemblyFraction(1)).toBe(1);
   expect(ownerParticleAssemblyFraction(Number.NaN)).toBe(0);
 });
 it('rejects geometry-free source rather than creating synthetic car dots',()=>{
   expect(()=>buildOwnerSourceParticles(new THREE.Group(),256)).toThrow(/vertices/);
 });
 it('rejects nonsensical vertex budget',()=>{
   const {root}=originalFixture();
   expect(()=>buildOwnerSourceParticles(root,12)).toThrow(/budget/);
 });
 it('only reveals source points during build chapters',()=>{
   expect(ownerParticleOpacity(0)).toBe(0);
   expect(ownerParticleOpacity(.1)).toBe(0);
   expect(ownerParticleOpacity(.25)).toBeGreaterThan(0);
   expect(ownerParticleOpacity(.70)).toBeGreaterThan(0);
   expect(ownerParticleOpacity(.84)).toBe(0);
   expect(ownerParticleOpacity(1)).toBe(0);
   expect(ownerParticleOpacity(Number.NaN)).toBe(0);
 });
});
