import {describe,expect,it} from 'vitest';
import * as THREE from 'three';
import {applyCadViewerAppearance,cadPreviewAppearance} from './cadPreviewMaterials';
describe('Original P2.8/P2.14 nondestructive PBR material repair',()=>{
 it('replaces washed-out white tyre with dark rubber, not a white metallic cylinder',()=>{
   const a=cadPreviewAppearance('P2_TYRE_SLICK_BODY','p28');
   expect(a.system).toBe('tyre');
   expect(a.metalness).toBeLessThan(.05);
   expect(a.roughness).toBeGreaterThan(.85);
   expect(a.color).not.toBe('#ffffff');
   const rim=cadPreviewAppearance('P2_RIM_FORGED_BARREL','p28');
   expect(rim.system).toBe('rim');
   expect(rim.metalness).toBeGreaterThan(.65);
   expect(rim.color).not.toBe(a.color);
 });
 it('differentiates source carbon brake, bolts and rear spherical split races',()=>{
   const brake=cadPreviewAppearance('P2_ROTOR_DRILLED_CARBON','p28');
   const fastener=cadPreviewAppearance('P2_FASTENER_BOLT_01','p28');
   const rear=cadPreviewAppearance('P214_UPPER_SPLIT_RACE_POSITIVE_X','joint');
   expect(brake.roughness).toBeGreaterThan(.7);
   expect(fastener.metalness).toBeGreaterThan(.65);
   expect(rear.system).toBe('rear-joint');
   expect(new Set([brake.color,fastener.color,rear.color]).size).toBe(3);
 });
 it('applies viewer-only color on a clone and never edits original GLB materials',()=>{
   const source=new THREE.MeshStandardMaterial({
     color:'#ffffff',metalness:0,roughness:.5,
   });
   const viewer=source.clone();
   applyCadViewerAppearance(viewer,cadPreviewAppearance('P2_TYRE_SLICK_BODY','p28'));
   expect(source.color.getHex()).toBe(0xffffff);
   expect(source.roughness).toBe(.5);
   expect(viewer.color.getHex()).not.toBe(0xffffff);
   expect(viewer.roughness).toBeGreaterThan(.9);
   viewer.dispose();source.dispose();
 });
});
