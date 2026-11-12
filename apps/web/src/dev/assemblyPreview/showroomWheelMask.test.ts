import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { addReversibleWheelWindow } from './showroomWheelMask';
import type { OwnerMeasuredFit } from './ownerMeasuredFit';

const measured = {
  originalP28TyreWidthM:.314,
  normalizedShellScale:.17357287237986882,
  wheels: [
    { centerSourceUnits: [7.43235, -1.07544, 5.07737], outerRadiusSourceUnits: 1.90398 },
    { centerSourceUnits: [7.24193, -1.06293, -5.234695], outerRadiusSourceUnits: 1.91969 },
    { centerSourceUnits: [-11.23671, -1.10873, 5.740865], outerRadiusSourceUnits: 1.93834 },
    { centerSourceUnits: [-11.453, -1.12272, -5.325905], outerRadiusSourceUnits: 1.89511 },
  ],
} as unknown as OwnerMeasuredFit;

function shaderStub() {
  return {
    uniforms: {} as Record<string, { value: unknown }>,
    vertexShader: `void main(){
#include <begin_vertex>
}`,
    fragmentShader: `void main(){
#include <clipping_planes_fragment>
}`,
  };
}

describe('reversible original Model B wheel window', () => {
  it('injects four separately measured positions in unmodified original-source units', () => {
    const material = new THREE.MeshStandardMaterial();
    const sourceFromMesh = new THREE.Matrix4().makeTranslation(2, -1, 3);
    addReversibleWheelWindow(material, sourceFromMesh, measured);
    const shader = shaderStub();
    material.onBeforeCompile(
      shader as Parameters<typeof material.onBeforeCompile>[0],
      {} as THREE.WebGLRenderer,
    );

    expect(shader.uniforms.pedsWheelRootTransform.value).toBe(sourceFromMesh);
    const centers = shader.uniforms.pedsWheelCenters.value as THREE.Vector3[];
    const radii = shader.uniforms.pedsWheelRadius.value as number[];
    expect(centers.map(p => p.toArray())).toEqual(
      measured.wheels.map(w => w.centerSourceUnits),
    );
    expect(radii).toEqual(measured.wheels.map(w => w.outerRadiusSourceUnits * 1.12));
    expect(shader.vertexShader).toContain('pedsWheelRootTransform*vec4(position,1.0)');
    expect(shader.fragmentShader).toContain('for (int wheel=0;wheel<4;wheel++)');
    expect(shader.fragmentShader).toContain('discard;');
    expect(material.version).toBeGreaterThan(0); // Recompile the modified shader.
  });

  it('keeps real showroom tyres until source CAD arrives, then masks all original tyre depth', () => {
    const material=new THREE.MeshStandardMaterial();
    const fade={value:0};
    addReversibleWheelWindow(material,new THREE.Matrix4(),measured,fade);
    const shader=shaderStub();
    material.onBeforeCompile(
      shader as Parameters<typeof material.onBeforeCompile>[0],
      {} as THREE.WebGLRenderer,
    );
    expect(shader.uniforms.pedsWheelMaskAmount).toBe(fade);
    expect(shader.fragmentShader).toContain('threshold<pedsWheelMaskAmount');
    expect(shader.fragmentShader).toContain('abs(local.z)<pedsWheelHalfWidth');
    expect(shader.uniforms.pedsWheelHalfWidth.value).toBeGreaterThan(1);
    expect(shader.uniforms.pedsWheelHalfWidth.value).toBeLessThan(1.5);
    expect(shader.fragmentShader).not.toContain('gl_FragCoord.xy');
    expect(shader.fragmentShader).toContain('dot(vPedsSourcePosition,vec3(');
    fade.value=1;
    expect(shader.uniforms.pedsWheelMaskAmount.value).toBe(1);
    expect(shader.fragmentShader).toContain('discard;');
    material.dispose();
  });

  it('P2.42 masks each real showroom wheel using its own verified CAD tyre convergence',()=>{
    const material=new THREE.MeshStandardMaterial();
    const scalar={value:0};
    const perWheel={value:[0,.20,.50,1]};
    addReversibleWheelWindow(
      material,new THREE.Matrix4(),measured,scalar,perWheel);
    const shader=shaderStub();
    material.onBeforeCompile(
      shader as Parameters<typeof material.onBeforeCompile>[0],
      {} as THREE.WebGLRenderer,
    );
    expect(shader.uniforms.pedsWheelMaskAmounts).toBe(perWheel);
    expect(shader.fragmentShader).toContain('uniform float pedsWheelMaskAmounts[4];');
    expect(shader.fragmentShader).toContain('threshold<pedsWheelMaskAmounts[wheel]');
    expect(shader.fragmentShader).not.toContain('threshold<pedsWheelMaskAmount) discard;');
    expect(shader.fragmentShader).toContain('pedsWheelMaskAmounts[wheel]) discard;\n');
    perWheel.value[0]=1;
    perWheel.value[3]=0;
    expect(shader.uniforms.pedsWheelMaskAmounts.value).toEqual([1,.2,.5,0]);
    material.dispose();
  });
  it('P2.42 rejects invalid per-wheel source masks rather than showing false wheel replacements',()=>{
    const material=new THREE.MeshStandardMaterial();
    const bad=[
      {value:[.5,.5,.5]},
      {value:[.5,.5,.5,NaN]},
      {value:[.5,.5,-.1,1]},
      {value:[.5,.5,.5,1.5]},
    ];
    for(const values of bad)
      expect(()=>addReversibleWheelWindow(
        material,new THREE.Matrix4(),measured,{value:0},values))
        .toThrow(/Invalid per-wheel/);
    material.dispose();
  });

  it('fails closed rather than silently rendering duplicates with an unknown shader', () => {
    const material = new THREE.MeshStandardMaterial();
    addReversibleWheelWindow(material, new THREE.Matrix4(), measured);
    const shader = { ...shaderStub(), fragmentShader: 'void main() {}' };
    expect(() => material.onBeforeCompile(
      shader as Parameters<typeof material.onBeforeCompile>[0],
      {} as THREE.WebGLRenderer,
    )).toThrow(/injection points/);
  });

  it('rejects incomplete or non-finite source wheel measurements', () => {
    const material = new THREE.MeshStandardMaterial();
    const missing = { ...measured, wheels: measured.wheels.slice(0, 3) };
    expect(() => addReversibleWheelWindow(material, new THREE.Matrix4(), missing)).toThrow(/Four original source/);
    const invalid = { ...measured, wheels: measured.wheels.map((wheel, i) =>
      i === 0 ? { ...wheel, outerRadiusSourceUnits: Number.NaN } : wheel) };
    expect(() => addReversibleWheelWindow(material, new THREE.Matrix4(), invalid)).toThrow(/Invalid original source/);
  });
});
