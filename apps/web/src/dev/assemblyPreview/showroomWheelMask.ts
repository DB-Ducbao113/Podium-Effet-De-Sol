import * as THREE from 'three';
import type {OwnerMeasuredFit} from './ownerMeasuredFit';

/**
 * Hide EXISTING showroom tyre/rim pixels around four owner-measured wheel
 * envelopes so authentic CAD-derived wheel ends can be seen without z-fighting.
 * Renderer-only discard: original Model B vertices, indices, materials and GLB
 * file bytes are not modified. The wheel window can also hide nearby showroom
 * pieces and is explicitly NOT a precise mechanical subtraction.
 *
 * The wheel centres live in original showroom-source units, not world metres.
 */
export function addReversibleWheelWindow(
  material:THREE.Material,
  meshToSourceRoot:THREE.Matrix4,
  fit:OwnerMeasuredFit,
  maskAmount:{value:number}={value:1},
  /** Optional per-source-wheel values in the original fit.wheels order. */
  wheelMaskAmounts?:{value:number[]},
):void{
  if(fit.wheels.length!==4)throw Error('Four original source wheel positions required');
  if(fit.wheels.some(w=>w.centerSourceUnits.length!==3 ||
      w.centerSourceUnits.some(v=>!Number.isFinite(v)) ||
      !Number.isFinite(w.outerRadiusSourceUnits) || w.outerRadiusSourceUnits<=0))
    throw Error('Invalid original source wheel position or radius');
  if(wheelMaskAmounts&&
     (wheelMaskAmounts.value.length!==4||
      wheelMaskAmounts.value.some(v=>!Number.isFinite(v)||v<0||v>1)))
    throw Error('Invalid per-wheel original Model B showroom mask');
  const positions=fit.wheels.map(w=>new THREE.Vector3(...w.centerSourceUnits));
  const radii=fit.wheels.map(w=>w.outerRadiusSourceUnits*1.12);
  const original=material.onBeforeCompile.bind(material);
  material.onBeforeCompile=(shader,renderer)=>{
    original(shader,renderer);
    shader.uniforms.pedsWheelRootTransform={value:meshToSourceRoot};
    shader.uniforms.pedsWheelCenters={value:positions};
    shader.uniforms.pedsWheelRadius={value:radii};
    shader.uniforms.pedsWheelMaskAmount=maskAmount;
    if(wheelMaskAmounts)
      shader.uniforms.pedsWheelMaskAmounts=wheelMaskAmounts;
    const vertexMarker='#include <begin_vertex>';
    const fragmentMarker='#include <clipping_planes_fragment>';
    if(!shader.vertexShader.includes(vertexMarker)||
       !shader.fragmentShader.includes(fragmentMarker)){
      throw Error('Original showroom material shader lacks required injection points');
    }
    shader.vertexShader=
      'varying vec3 vPedsSourcePosition;\n'+
      'uniform mat4 pedsWheelRootTransform;\n'+
      shader.vertexShader.replace(vertexMarker,
        vertexMarker+'\n'+
        'vPedsSourcePosition=(pedsWheelRootTransform*vec4(position,1.0)).xyz;');
    shader.fragmentShader=
      'varying vec3 vPedsSourcePosition;\n'+
      'uniform vec3 pedsWheelCenters[4];\n'+
      'uniform float pedsWheelRadius[4];\n'+
      'uniform float pedsWheelMaskAmount;\n'+
        (wheelMaskAmounts?'uniform float pedsWheelMaskAmounts[4];\n':'')+
      shader.fragmentShader.replace(fragmentMarker,
        fragmentMarker+'\n'+
        'for (int wheel=0;wheel<4;wheel++) {\n'+
        '  vec3 local=vPedsSourcePosition-pedsWheelCenters[wheel];\n'+
        '  if (length(local.xy)<pedsWheelRadius[wheel] && abs(local.z)<max(2.5,1.24*pedsWheelRadius[wheel])) {\n'+
        '    float threshold=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);\n'+
        '    if (threshold<'+
          (wheelMaskAmounts?'pedsWheelMaskAmounts[wheel]':'pedsWheelMaskAmount')+
          ') discard;\n'+
        '  }\n'+
        '}\n');
  };
  material.needsUpdate=true;
}
