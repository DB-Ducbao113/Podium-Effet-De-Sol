import { useEffect, useMemo, useState } from 'react';
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'meshoptimizer';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import * as THREE from 'three';
import type { CadSource } from '../cadFirstScroll/cadSource';
import { centerOffset, initialStagingPosition, type Placement } from './assemblyPlacement';
import type { RegistrationResult } from './assemblyRegistration';
import type { OwnerMeasuredFit } from './ownerMeasuredFit';
import { probeOriginalGeometry, type SourceGeometryProbe } from './geometryProbe';
import { classifyP28Part, materialForP28Part, presentationForP28Part, type CornerPresentation } from './cadPresentation';
import FourCornerInstances from './FourCornerInstances';
import { layoutFourCorners, type WheelId } from './fourCornerLayout';
import { addReversibleWheelWindow } from './showroomWheelMask';

type Props = {
  source: CadSource | null;
  placement: Placement;
  shellOpacity: number;
  selectedPart: string | null;
  cameraFocus: 'whole-car' | 'wheel-macro' | 'fastener-macro';
  cornerPresentation: CornerPresentation;
  technicalMaterials: boolean;
  allFourWheelsEnabled: boolean;
  activeWheelId: WheelId;
  showroomWheelWindowsEnabled: boolean;
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
  p28GeometryProfile: SourceGeometryProbe | null;
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


// Local procedural softbox reflections, no CDN/HDR downloads and no changes to
// original P2.8 GLB or Model B materials. Metallic CAD is nearly black without
// an environment reflection; the room provides that energy in real-time.
function EngineeringStudioEnvironment() {
  const {gl,scene,invalidate}=useThree();
  useEffect(()=>{
    const pmrem=new THREE.PMREMGenerator(gl);
    const studio=new RoomEnvironment();
    const env=pmrem.fromScene(studio,0.05).texture;
    const previous=scene.environment;
    // Three.js scene illumination is intentionally set imperatively after commit.
    // eslint-disable-next-line react-hooks/immutability
    scene.environment=env;
    invalidate();
    return()=>{
      // Restore the previous Three.js environment on teardown.
      // eslint-disable-next-line react-hooks/immutability
      scene.environment=previous;
      env.dispose();
      pmrem.dispose();
      disposeTree(studio);
      invalidate();
    };
  },[gl,scene,invalidate]);
  return null;
}

function needsRecomputedSourceNormals(geometry:THREE.BufferGeometry):boolean {
  const normal=geometry.getAttribute('normal');
  const position=geometry.getAttribute('position');
  if(!normal||!position||normal.count!==position.count)return true;
  const stride=Math.max(1,Math.floor(normal.count/80));
  let checked=0,invalid=0;
  for(let i=0;i<normal.count;i+=stride){
    const x=normal.getX(i),y=normal.getY(i),z=normal.getZ(i);
    const lengthSquared=x*x+y*y+z*z;
    checked++;
    if(!Number.isFinite(lengthSquared)||lengthSquared<.5||lengthSquared>1.5)invalid++;
  }
  return checked>0 && invalid/checked>.05;
}

function Scene({source,placement,shellOpacity,selectedPart,cameraFocus,cornerPresentation,technicalMaterials,
  allFourWheelsEnabled,activeWheelId,showroomWheelWindowsEnabled,registration,measuredFit,measuredOverlayEnabled,onError,onInfo,
  pickMode,onPointPick,onBodyPartNames,hiddenBodyMeshes,onResolvedTransform,onGeometryProbe,p28GeometryProfile}:Props) {
  const {camera,invalidate} = useThree();
  const [body,setBody] = useState<THREE.Group | null>(null);
  const [corner,setCorner] = useState<THREE.Group | null>(null);
  const [pristineCorner,setPristineCorner]=useState<THREE.Group|null>(null);
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
    setPristineCorner(null);
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
      setPristineCorner(model.clone(true));
      setCorner(model);
      onInfo('MODEL B + VERIFIED P2.8 LOADED · NOT MECHANICALLY MATED');
    }).catch(e=>{if(live)onError('P2.8 GLB could not load: '+String(e));});
    return()=>{live=false;setCorner(null);setPristineCorner(null);if(model)disposeTree(model);};
  },[source,onError,onInfo,onGeometryProbe]);
  // Model B GLB is authored in non-metric showroom units (27.79 source-unit long).
  // A uniform display-only normalization uses measured tyre radii; the original
  // GLB remains byte-for-byte identical, and original P2.8 CAD scale stays 1.
  const shellScale=measuredFit?.normalizedShellScale??1;
  const fourMounts=useMemo(()=>(
    allFourWheelsEnabled&&measuredFit ? layoutFourCorners(measuredFit):null
  ),[allFourWheelsEnabled,measuredFit]);
  const activeMount=useMemo(()=>fourMounts?.find(x=>x.id===activeWheelId),
    [fourMounts,activeWheelId]);
  useEffect(()=>{
    if(!corner||!technicalMaterials)return;
    const original=new Map<THREE.Mesh,{material:THREE.Material|THREE.Material[];geometry:THREE.BufferGeometry}>();
    const clonedMaterials:THREE.Material[]=[];
    const clonedGeometry:THREE.BufferGeometry[]=[];
    corner.traverse(o=>{
      if(!(o instanceof THREE.Mesh))return;
      const preset=materialForP28Part(classifyP28Part(o.name));
      const selected=selectedPart===o.name;
      const material=new THREE.MeshStandardMaterial({
        color:selected?'#e2e9ef':preset.color,
        metalness:preset.metalness,
        roughness:selected?Math.max(.28,preset.roughness-.12):preset.roughness,
        emissive:new THREE.Color(preset.color),
        emissiveIntensity:preset.metalness > 0.6 ? 0.18 : 0.3,
        envMapIntensity:1.55,
        side:THREE.DoubleSide,
      });
      if(!material)return;
      original.set(o,{material:o.material,geometry:o.geometry});
      if(needsRecomputedSourceNormals(o.geometry)){
        const copy=o.geometry.clone();
        copy.computeVertexNormals();
        o.geometry=copy;
        clonedGeometry.push(copy);
      }
      clonedMaterials.push(material);
      o.material=material;
    });
    invalidate();
    return()=>{
      original.forEach((prior,mesh)=>{mesh.material=prior.material;mesh.geometry=prior.geometry;});
      clonedGeometry.forEach(g=>g.dispose());
      clonedMaterials.forEach(m=>m.dispose());
      invalidate();
    };
  },[corner,technicalMaterials,selectedPart,invalidate]);
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
    const center=new THREE.Vector3(...(activeMount?.centerM??measuredFit.frontPositiveZCenterM));
    if(cameraFocus==='fastener-macro'){
      // Isolated original parts are framed at THEIR own native mesh bounds.
      const partBounds=selectedPart&&p28GeometryProfile?.subassemblies[selectedPart]?.sourceBoundsM;
      if(partBounds&&selectedPart){
        // The recorded geometry profile is P2.8 ROOT-LOCAL, captured before
        // any R3F scene placement or visual explosion. No double transforms.
        const bounds=new THREE.Box3(new THREE.Vector3(...partBounds[0]),
                                   new THREE.Vector3(...partBounds[1]));
        const position=bounds.getCenter(new THREE.Vector3())
          .sub(new THREE.Vector3(...measuredFit.originalP28WheelCenterM))
          .add(new THREE.Vector3(...presentationForP28Part(selectedPart,cornerPresentation).offsetM))
          .applyAxisAngle(new THREE.Vector3(0,1,0),activeMount?.rotationYRad??0);
        const distance=Math.max(.58,Math.min(1.9,bounds.getSize(new THREE.Vector3()).length()*3.2));
        return {target:center.clone().add(position),distance};
      }
      return {target:center,distance:1.28};
    }
    if(cornerPresentation==='exploded')
      return {target:center.clone().add(new THREE.Vector3(-.15,.19,0)),distance:3.1};
    if(cornerPresentation==='mechanism-core')
      return {target:center,distance:1.75};
    return {target:center,distance:2.05};
  },[cameraFocus,frame,measuredFit,measuredOverlayEnabled,selectedPart,cornerPresentation,p28GeometryProfile,activeMount]);
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
    body.updateWorldMatrix(true,true);
    const sourceInverse=body.matrixWorld.clone().invert();
    body.traverse(o=>{
      if(!(o instanceof THREE.Mesh))return;
      original.set(o,o.material);
      const sourceMaterials=Array.isArray(o.material)?o.material:[o.material];
      const modified=sourceMaterials.map(m=>{
        const copy=m.clone();clones.push(copy);
        const effectiveOpacity=cameraFocus==='whole-car'?shellOpacity:Math.min(shellOpacity,.055);
        copy.transparent=effectiveOpacity<.999||m.transparent;
        copy.opacity=m.opacity*effectiveOpacity;
        copy.depthWrite=effectiveOpacity>=.999;
        if(allFourWheelsEnabled&&showroomWheelWindowsEnabled&&measuredFit){
          const sourceRootFromMesh=new THREE.Matrix4()
            .multiplyMatrices(sourceInverse,o.matrixWorld);
          addReversibleWheelWindow(copy,sourceRootFromMesh,measuredFit);
        }
        return copy;
      });
      o.material=Array.isArray(o.material)?modified:modified[0];
    });
    invalidate();
    return()=>{original.forEach((mat,mesh)=>mesh.material=mat);clones.forEach(c=>c.dispose());invalidate()};
  },[body,shellOpacity,cameraFocus,allFourWheelsEnabled,showroomWheelWindowsEnabled,measuredFit,invalidate]);
  useEffect(()=>{
    if(!corner)return;
    const originals=new Map<THREE.Mesh,{visible:boolean;position:THREE.Vector3}>();
    corner.traverse(o=>{
      if(!(o instanceof THREE.Mesh))return;
      originals.set(o,{visible:o.visible,position:o.position.clone()});
      const presentation=presentationForP28Part(o.name,cornerPresentation);
      const isolateHere=!allFourWheelsEnabled||activeWheelId==='front-positive-z';
      o.visible=(!isolateHere||!selectedPart||o.name===selectedPart)&&presentation.visible;
      o.position.add(new THREE.Vector3(...presentation.offsetM));
    });
    invalidate();
    return()=>{
      originals.forEach((v,o)=>{o.visible=v.visible;o.position.copy(v.position);});
      invalidate();
    };
  },[corner,selectedPart,cornerPresentation,allFourWheelsEnabled,activeWheelId,invalidate]);
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
    <color attach="background" args={[cameraFocus==='whole-car'?'#0a111b':'#1c2835']}/>
    <ambientLight intensity={1.5}/><hemisphereLight args={['#eff5ff','#1a2a3d',2]}/>
    <directionalLight position={[5,8,6]} intensity={3.2}/>
    <directionalLight position={[-4,4,-3]} intensity={2} color="#ff9d84"/>
    {body&&<group scale={shellScale} onPointerDown={event=>pickSurface('modelb',event)}><primitive object={body}/></group>}
    {corner&&<group position={transform.toArray()} quaternion={rotation} scale={1}
      onPointerDown={event=>pickSurface("p28",event)}>
       <primitive object={corner}/>
    </group>}
    {pristineCorner&&measuredFit&&fourMounts&&measuredOverlayEnabled&&
      <FourCornerInstances originalFrontCorner={pristineCorner} fit={measuredFit}
        activeWheelId={activeWheelId} selectedPart={selectedPart}
        presentation={cornerPresentation} technicalMaterials={technicalMaterials}/>}

    <OrbitControls makeDefault target={focus.target.toArray()} enableDamping dampingFactor={.08}/>
  </>;
}
export default function AssemblyPreviewStage(props:Props) {
  return <Canvas frameloop="demand" dpr={[1,1.5]} camera={{fov:38,near:.001,far:500,position:[5,3,8]}}
    gl={{antialias:true,powerPreference:'high-performance'}}
    onCreated={({gl})=>{
      gl.outputColorSpace=THREE.SRGBColorSpace;
      gl.toneMapping=THREE.ACESFilmicToneMapping;
      gl.toneMappingExposure=1.35;
    }}>
    <EngineeringStudioEnvironment/>
    <Scene {...props}/>
  </Canvas>;
}
