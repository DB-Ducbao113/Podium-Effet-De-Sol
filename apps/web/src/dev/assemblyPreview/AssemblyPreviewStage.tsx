import { useEffect, useMemo, useState } from 'react';
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'meshoptimizer';
import * as THREE from 'three';
import type { CadSource } from '../cadFirstScroll/cadSource';
import { centerOffset, initialStagingPosition, type Placement } from './assemblyPlacement';
import type { RegistrationResult } from './assemblyRegistration';
import type { OwnerMeasuredFit } from './ownerMeasuredFit';
import { probeOriginalGeometry, type SourceGeometryProbe } from './geometryProbe';

type Props = {
  source: CadSource | null;
  placement: Placement;
  shellOpacity: number;
  selectedPart: string | null;
  cameraFocus: 'whole-car' | 'wheel-macro' | 'fastener-macro';
  cornerPresentation: 'assembled' | 'tyre-hidden' | 'exploded';
  technicalMaterials: boolean;
  registration: RegistrationResult | null;
  measuredFit: OwnerMeasuredFit | null;
  measuredOverlayEnabled: boolean;
  onError: (message: string) => void;
  onInfo: (info: string) => void;
  pickMode: 'off' | 'modelb' | 'p28';
  onPointPick: (target: 'modelb' | 'p28', point: [number, number, number], mesh: string) => void;
  onBodyPartNames: (parts: string[]) => void;
  hiddenBodyMeshes: number[];
  onGeometryProbe: (data: SourceGeometryProbe) => void;
  onResolvedTransform: (value: {
    translationM: [number,number,number]; rotationQuaternion: [number,number,number,number];
    stagingBasis: 'separate' | 'graphic_center' | 'landmarks' | 'measured_wheel'; scale: 1;
    modelBShellUnitScale: number;
  }) => void;
};

function disposeTree(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse(o => {
    if (!(o instanceof THREE.Mesh)) return;
    geometries.add(o.geometry);
    for (const material of Array.isArray(o.material) ? o.material : [o.material]) {
      materials.add(material);
      Object.values(material).forEach(value=>{if(value instanceof THREE.Texture) textures.add(value);});
    }
  });
  geometries.forEach(x=>x.dispose());
  materials.forEach(x=>x.dispose());
  textures.forEach(x=>x.dispose());
}

function Scene({source,placement,shellOpacity,selectedPart,cameraFocus,cornerPresentation,technicalMaterials,registration,measuredFit,measuredOverlayEnabled,onError,onInfo,pickMode,onPointPick,onBodyPartNames,hiddenBodyMeshes,onResolvedTransform,onGeometryProbe}:Props) {
  const {camera,invalidate} = useThree();
  const [body,setBody] = useState<THREE.Group | null>(null);
  const [corner,setCorner] = useState<THREE.Group | null>(null);
  useEffect(()=>{
    let live=true,model:THREE.Group|null=null;
    const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    // This is the existing owner-selected optimized showroom asset in THIS repo.
    loader.load(import.meta.env.BASE_URL+'models/model-b-eds-optimized-v1.glb',gltf=>{
      model=gltf.scene;
      if(!live){disposeTree(model);return;}
      const named:string[]=[];
      model.traverse(obj=>{if(obj instanceof THREE.Mesh)named.push(obj.name||'UNNAMED_MESH');});
      onBodyPartNames(named);
      try { onGeometryProbe(probeOriginalGeometry(model,'model-b')); }
      catch(err) { onError('Model B geometry profile failed: '+String(err)); }
      setBody(model);
    },undefined,e=>{if(live)onError('Model B could not load: '+String(e));});
    return()=>{live=false;setBody(null);if(model)disposeTree(model);};
  },[onError,onBodyPartNames,onGeometryProbe]);
  useEffect(()=>{
    let live=true,model:THREE.Group|null=null;
    setCorner(null);
    if(!source)return;
    const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    void MeshoptDecoder.ready.then(()=>loader.parseAsync(source.glbBytes.slice(0),'')).then(gltf=>{
      model=gltf.scene;
      if(!live){disposeTree(model);return;}
      const found=new Set<string>();
      let meshCount=0;
      model.traverse(o=>{if(o instanceof THREE.Mesh){meshCount++;found.add(o.name);}});
      if(source.scope!=='front-corner' || source.parts.length!==59 ||
         source.parts.some(p=>!model?.getObjectByName(p.node)) || found.size!==59 || meshCount!==59){
        onError('P2.8 part identity mismatch; must contain exactly 59 source CAD meshes.');
        disposeTree(model);model=null;return;
      }
      try { onGeometryProbe(probeOriginalGeometry(model,'p28')); }
      catch(err) { onError('P2.8 geometry profile failed: '+String(err)); }
      setCorner(model);
      onInfo('MODEL B + VERIFIED P2.8 LOADED · NOT MECHANICALLY MATED');
    }).catch(e=>{if(live)onError('P2.8 GLB could not load: '+String(e));});
    return()=>{live=false;setCorner(null);if(model)disposeTree(model);};
  },[source,onError,onInfo,onGeometryProbe]);
  // Model B GLB is authored in non-metric showroom units (27.79 source-unit long).
  // A uniform display-only normalization uses measured tyre radii; the original
  // GLB remains byte-for-byte identical, and original P2.8 CAD scale stays 1.
  const shellScale=measuredFit?.normalizedShellScale??1;
  useEffect(()=>{
    if(!corner||!technicalMaterials)return;
    const original=new Map<THREE.Mesh,THREE.Material|THREE.Material[]>();
    const clones:THREE.Material[]=[];
    corner.traverse(o=>{
      if(!(o instanceof THREE.Mesh))return;
      let material:THREE.Material|null=null;
      if(o.name==='P2_TYRE_SLICK_BODY'){
        material=new THREE.MeshStandardMaterial({
          color:'#20242b',metalness:0,roughness:.93,side:THREE.DoubleSide
        });
      }else if(o.name==='P2_RIM_FORGED_BARREL'){
        material=new THREE.MeshStandardMaterial({
          color:'#a8aeb7',metalness:.88,roughness:.28,side:THREE.DoubleSide
        });
      }else if(o.name==='P2_BRAKE_ROTOR_DRILLED_CARBON'){
        material=new THREE.MeshStandardMaterial({
          color:'#363a40',metalness:.18,roughness:.72,side:THREE.DoubleSide
        });
      }
      if(!material)return;
      original.set(o,o.material);
      clones.push(material);
      o.material=material;
    });
    invalidate();
    return()=>{
      original.forEach((material,mesh)=>mesh.material=material);
      clones.forEach(m=>m.dispose());
      invalidate();
    };
  },[corner,technicalMaterials,invalidate]);
  const bodyBounds=useMemo(()=>{
    if(!body)return null;
    if(measuredFit){
      const [low,high]=measuredFit.bodyBoundsRaw;
      return new THREE.Box3(new THREE.Vector3(...low).multiplyScalar(shellScale),
                            new THREE.Vector3(...high).multiplyScalar(shellScale));
    }
    return new THREE.Box3().setFromObject(body);
  },[body,measuredFit,shellScale]);
  const cornerBounds=useMemo(()=>corner?new THREE.Box3().setFromObject(corner):null,[corner]);
  const frame=useMemo(()=>{
    if(!bodyBounds)return {target:new THREE.Vector3(),distance:6};
    const size=bodyBounds.getSize(new THREE.Vector3());
    return {target:bodyBounds.getCenter(new THREE.Vector3()),
      distance:Math.max(2,size.length()*1.4)};
  },[bodyBounds]);
  const focus=useMemo(()=>{
    if(cameraFocus==='whole-car'||!measuredFit||!measuredOverlayEnabled)
      return {target:frame.target,distance:frame.distance};
    const center=new THREE.Vector3(...measuredFit.frontPositiveZCenterM);
    if(cameraFocus==='fastener-macro')
      return {target:center.clone().add(new THREE.Vector3(0,0,.07)),distance:.92};
    return {target:center,distance:2.05};
  },[cameraFocus,frame,measuredFit,measuredOverlayEnabled]);
  useEffect(()=>{
    camera.position.copy(focus.target).add(new THREE.Vector3(.75,.4,1.55).normalize().multiplyScalar(focus.distance));
    camera.lookAt(focus.target);
    if(camera instanceof THREE.PerspectiveCamera||camera instanceof THREE.OrthographicCamera)
      camera.updateProjectionMatrix();
    invalidate();
  },[focus,camera,invalidate]);
  useEffect(()=>{
    if(!body)return;
    const hidden=new Set(hiddenBodyMeshes);
    let index=0;
    body.traverse(obj=>{
      if(obj instanceof THREE.Mesh){obj.visible=!hidden.has(index);index++;}
    });
    invalidate();
    return()=>{
      body.traverse(obj=>{if(obj instanceof THREE.Mesh)obj.visible=true;});
      invalidate();
    };
  },[body,hiddenBodyMeshes,invalidate]);
  useEffect(()=>{if(!body)return;
    const original=new Map<THREE.Mesh,THREE.Material|THREE.Material[]>(),clones:THREE.Material[]=[];
    body.traverse(o=>{
      if(!(o instanceof THREE.Mesh))return;
      original.set(o,o.material);
      const sourceMaterials=Array.isArray(o.material)?o.material:[o.material];
      const modified=sourceMaterials.map(m=>{
        const copy=m.clone();clones.push(copy);
        copy.transparent=shellOpacity<.999||m.transparent;
        copy.opacity=m.opacity*shellOpacity;
        copy.depthWrite=shellOpacity>=.999;
        return copy;
      });
      o.material=Array.isArray(o.material)?modified:modified[0];
    });
    invalidate();
    return()=>{original.forEach((mat,mesh)=>mesh.material=mat);clones.forEach(c=>c.dispose());invalidate()};
  },[body,shellOpacity,invalidate]);
  useEffect(()=>{
    if(!corner)return;
    const originals=new Map<THREE.Mesh,{visible:boolean;position:THREE.Vector3}>();
    corner.traverse(o=>{
      if(!(o instanceof THREE.Mesh))return;
      originals.set(o,{visible:o.visible,position:o.position.clone()});
      const tyre=o.name==='P2_TYRE_SLICK_BODY';
      o.visible=(!selectedPart||o.name===selectedPart)&&
        !(cornerPresentation==='tyre-hidden'&&tyre);
      if(cornerPresentation==='exploded'){
        let displacement=0;
        if(tyre)displacement=.52;
        else if(o.name.includes('RIM_'))displacement=.27;
        else if(o.name.includes('CENTER_'))displacement=.4;
        else if(o.name.includes('ROTOR_')||o.name.includes('BRAKE_'))displacement=.12;
        else if(o.name.includes('BEARING_'))displacement=.21;
        else if(o.name.includes('P27_'))displacement=-.23;
        o.position.z+=displacement;
      }
    });
    invalidate();
    return()=>{
      originals.forEach((v,o)=>{o.visible=v.visible;o.position.copy(v.position);});
      invalidate();
    };
  },[corner,selectedPart,cornerPresentation,invalidate]);
  const transform=useMemo(()=>{
    if(registration)return new THREE.Vector3(...registration.translationM).add(new THREE.Vector3(...placement.translationM));
    if(measuredFit && measuredOverlayEnabled){
      return new THREE.Vector3(...measuredFit.frontPositiveZCenterM)
        .sub(new THREE.Vector3(...measuredFit.originalP28WheelCenterM))
        .add(new THREE.Vector3(...placement.translationM));
    }
    if(!bodyBounds||!cornerBounds)return new THREE.Vector3();
    const bodyMin=bodyBounds.min.toArray() as [number,number,number];
    const bodyMax=bodyBounds.max.toArray() as [number,number,number];
    const cornerMin=cornerBounds.min.toArray() as [number,number,number];
    const base=placement.displayedAtBodyCenter
      ? centerOffset(bodyBounds.getCenter(new THREE.Vector3()).toArray() as [number,number,number],
          cornerBounds.getCenter(new THREE.Vector3()).toArray() as [number,number,number])
      : initialStagingPosition(bodyMin,bodyMax,cornerMin);
    return new THREE.Vector3(...base).add(new THREE.Vector3(...placement.translationM));
  },[bodyBounds,cornerBounds,placement,registration,measuredFit,measuredOverlayEnabled]);
  const pickSurface=(target:'modelb'|'p28',event:ThreeEvent<PointerEvent>)=>{
    if(pickMode!==target)return;
    const root=target==='modelb'?body:corner;
    if(!root)return;
    event.stopPropagation();
    // Raycast point is world-space. Convert to the unchanged original GLB root.
    // Never store a point in the temporary translated/rotated display frame.
    root.updateWorldMatrix(true,false);
    const local=root.worldToLocal(event.point.clone());
    const xyz=local.toArray() as [number,number,number];
    if(xyz.every(Number.isFinite))onPointPick(target,xyz,event.object.name||'unnamed-mesh');
  };
  const rotation=useMemo(()=>{
    const euler=new THREE.Euler(...(placement.rotationDeg.map(x=>THREE.MathUtils.degToRad(x)) as [number,number,number]));
    const manual=new THREE.Quaternion().setFromEuler(euler);
    if(!registration)return manual;
    const q=new THREE.Quaternion(...registration.rotationQuaternion);
    return q.multiply(manual);
  },[placement.rotationDeg,registration]);
  useEffect(()=>{
    if(!bodyBounds||!cornerBounds||!corner)return;
    onResolvedTransform({
      translationM:transform.toArray() as [number,number,number],
      rotationQuaternion:[rotation.x,rotation.y,rotation.z,rotation.w],
      stagingBasis:registration?'landmarks':
        measuredFit&&measuredOverlayEnabled?'measured_wheel':
        placement.displayedAtBodyCenter?'graphic_center':'separate',
      scale:1,modelBShellUnitScale:shellScale,
    });
  },[bodyBounds,cornerBounds,corner,transform,rotation,registration,measuredFit,measuredOverlayEnabled,shellScale,placement.displayedAtBodyCenter,onResolvedTransform]);
  useEffect(()=>invalidate(),[transform,placement,selectedPart,invalidate]);
  return <>
    <color attach="background" args={['#0a111b']}/>
    <ambientLight intensity={1.5}/><hemisphereLight args={['#eff5ff','#1a2a3d',2]}/>
    <directionalLight position={[5,8,6]} intensity={3.2}/>
    <directionalLight position={[-4,4,-3]} intensity={2} color="#ff9d84"/>
    {body&&<group scale={shellScale} onPointerDown={event=>pickSurface('modelb',event)}><primitive object={body}/></group>}
    {corner&&<group position={transform.toArray()} quaternion={rotation} scale={1}
      onPointerDown={event=>pickSurface("p28",event)}>
       <primitive object={corner}/>
    </group>}
    <OrbitControls makeDefault target={focus.target.toArray()} enableDamping dampingFactor={.08}/>
  </>;
}
export default function AssemblyPreviewStage(props:Props) {
  return <Canvas frameloop="demand" dpr={[1,1.5]} camera={{fov:38,near:.001,far:500,position:[5,3,8]}}
    gl={{antialias:true,powerPreference:'high-performance'}}
    onCreated={({gl})=>{gl.outputColorSpace=THREE.SRGBColorSpace;gl.toneMapping=THREE.ACESFilmicToneMapping}}>
    <Scene {...props}/>
  </Canvas>;
}
