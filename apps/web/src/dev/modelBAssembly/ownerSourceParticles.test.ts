import {describe,expect,it} from 'vitest';
import * as THREE from 'three';
import {buildOwnerSourceParticles,ownerParticleOpacity} from './ownerSourceParticles';

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
   // Extract mesh local positions and transform to root-local space.
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
