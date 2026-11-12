import {describe,expect,it} from 'vitest';
import * as THREE from 'three';
import type {InspectedCadPart} from './cadPartInspector';
import {highlightSourceMaterials,locateSelectedCadMesh,sourceMeshWorldCentre,
 sourceMeshWorldFocusBounds,type SourceFocusItem} from './cadFocus';

const selected={
 partId:'P28_REAL_BOLT_001',wheelStation:'front-positive-z',
 origin:'p28',subsystem:'Fastener',
 sourceLabel:'P2.8 real original',
 sourceAuthority:'PROJECT_AUTHORED_ORIGINAL_CAD',
 sourceWheelEndIsRearProxy:false,visualOnly:true,mechanicalMateCertified:false,
} as const satisfies InspectedCadPart;

function fixture():{root:THREE.Group;item:SourceFocusItem;material:THREE.MeshStandardMaterial}{
 const root=new THREE.Group();
 const carrier=new THREE.Group();
 carrier.position.set(1.2,-.17,.95);carrier.rotation.y=Math.PI;
 root.add(carrier);
 const geometry=new THREE.BoxGeometry(.012,.008,.035);
 geometry.translate(.25,.04,.18);
 const material=new THREE.MeshStandardMaterial({
  emissive:0x173129,emissiveIntensity:.19,
 });
 const mesh=new THREE.Mesh(geometry,material);
 mesh.name=selected.partId;
 carrier.add(mesh);
 return {root,item:{name:mesh.name,station:selected.wheelStation,
 origin:selected.origin,mesh,materials:[material]},material};
}
describe('Original Model B selected CAD source focusing',()=>{
 it('looks up original source ID and measured station, never guessed names',()=>{
  const {item}=fixture();
  expect(locateSelectedCadMesh([item],selected)).toBe(item);
  expect(locateSelectedCadMesh([item],null)).toBe(null);
  expect(()=>locateSelectedCadMesh([item],{...selected,
   wheelStation:'rear-positive-z'})).toThrow(/one measured/);
  expect(()=>locateSelectedCadMesh([item,item],selected)).toThrow(/one measured/);
  expect(()=>locateSelectedCadMesh([item],{...selected,
   partId:'INVENTED_MODEL_B_ENGINE'})).toThrow(/one measured/);
 });
 it('computes actual GLB vertex-centroid rather than mesh origin',()=>{
  const {root,item}=fixture();
  root.updateWorldMatrix(true,true);
  const result=sourceMeshWorldCentre(item.mesh);
  // Source mesh is rotated 180 degrees in a genuine Model B wheel carrier.
  expect(result.x).toBeCloseTo(.95,9);
  expect(result.y).toBeCloseTo(-.13,9);
  expect(result.z).toBeCloseTo(.77,9);
  const raw=item.mesh.getWorldPosition(new THREE.Vector3());
  expect(result.distanceTo(raw)).toBeGreaterThan(.3);
 });
 it('P2.40 fits only the selected mesh own CAD geometry, not nested children',()=>{
  const {root,item}=fixture();
  const giantChild=new THREE.Mesh(new THREE.BoxGeometry(20,2,3));
  giantChild.position.x=8;
  item.mesh.add(giantChild);
  root.updateWorldMatrix(true,true);
  const focused=sourceMeshWorldFocusBounds(item.mesh);
  expect(focused.diagonal).toBeGreaterThan(0);
  expect(focused.diagonal).toBeLessThan(.08);
  const parentPlusChild=new THREE.Box3().setFromObject(item.mesh);
  expect(parentPlusChild.getSize(new THREE.Vector3()).length())
   .toBeGreaterThan(5);
  giantChild.geometry.dispose();
  item.mesh.geometry.dispose();
 });
 it('P2.40 rejects invalid original CAD part geometry before focus is verified',()=>{
  const mesh=new THREE.Mesh(new THREE.BufferGeometry());
  expect(()=>sourceMeshWorldFocusBounds(mesh)).toThrow(/no vertex geometry/);
  // A fabricated boundingBox without original GLB positions is not source CAD.
  mesh.geometry.boundingBox=new THREE.Box3(
   new THREE.Vector3(-1,-1,-1),new THREE.Vector3(1,1,1));
  expect(()=>sourceMeshWorldFocusBounds(mesh)).toThrow(/no vertex geometry/);
  const corrupted=new THREE.BoxGeometry(.1,.1,.1);
  corrupted.boundingBox=new THREE.Box3(
   new THREE.Vector3(NaN,0,0),new THREE.Vector3(1,1,1));
  const bad=new THREE.Mesh(corrupted);
  expect(()=>sourceMeshWorldFocusBounds(bad)).toThrow(/world bounds/);
  corrupted.dispose();
  mesh.geometry.dispose();
 });
 it('highlights the selected clone only and restores source materials',()=>{
  const {item,material}=fixture();
  const other=new THREE.MeshStandardMaterial({
    emissive:'#223344',emissiveIntensity:.24,
  });
  const previous=material.emissive.clone();
  const reset=highlightSourceMaterials([item,
    {...item,name:'P28_ANOTHER_SOURCE_BOLT',materials:[other]}],selected);
  expect(material.emissive.getHex()).toBe(new THREE.Color('#f79259').getHex());
  expect(material.emissiveIntensity).toBeCloseTo(.68);
  expect(other.emissive.getHex()).toBe(new THREE.Color('#223344').getHex());
  reset();
  expect(material.emissive.getHex()).toBe(previous.getHex());
  expect(material.emissiveIntensity).toBeCloseTo(.19);
  expect(other.emissiveIntensity).toBeCloseTo(.24);
 });
 it('does not invent focus target without real source geometry',()=>{
  const mesh=new THREE.Mesh(new THREE.BufferGeometry());
  expect(()=>sourceMeshWorldCentre(mesh)).toThrow(/real CAD vertex bounds/);
 });
});
