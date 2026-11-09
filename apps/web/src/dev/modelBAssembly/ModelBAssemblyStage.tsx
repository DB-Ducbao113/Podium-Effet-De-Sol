import {useEffect,useMemo,useState,type RefObject} from 'react';
import {Canvas,useFrame,useThree,type ThreeEvent} from '@react-three/fiber';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'meshoptimizer';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import * as THREE from 'three';
import type {CadSource} from '../cadFirstScroll/cadSource';
import type {ToeAdjusterSource} from '../assemblyPreview/rearToeAdjusterSource';
import type {SplitRaceSource} from '../assemblyPreview/splitRaceSource';
import {P214_PARTS} from '../assemblyPreview/splitRaceSource';
import {probeOriginalGeometry,type SourceGeometryProbe} from '../assemblyPreview/geometryProbe';
import {fitOwnerShellToOriginalP28,type OwnerMeasuredFit} from '../assemblyPreview/ownerMeasuredFit';
import {layoutFourCorners,visibleInFourCornerPreview} from '../assemblyPreview/fourCornerLayout';
import {addReversibleWheelWindow} from '../assemblyPreview/showroomWheelMask';
import {classifyP28Part} from '../assemblyPreview/cadPresentation';
import {pivotSourceMeshAtCentroid,applyVisualScrewSpin,
 type CadAnimatedPivot} from './sourcePartPivot';
import {rearVisualPartIds,type RearVisualParts} from './rearVisualComposite';
import {inspectOriginalCadMesh,type InspectedCadPart} from './cadPartInspector';
import {locateSelectedCadMesh,sourceMeshWorldCentre,highlightSourceMaterials} from './cadFocus';
import type {WheelId} from '../assemblyPreview/fourCornerLayout';
import {
 clamp01,exteriorSeparation,originalPartAssembly,rearSourceAssembly,
 visualShellOpacity,wheelOffset,stablePartOffset,
} from './modelBAssemblyTimeline';

type ProgressRef=RefObject<number>;
type Props={
 progressRef:ProgressRef;
 reducedMotion:boolean;
 corner:CadSource|null;
 rearToe:ToeAdjusterSource|null;
 splitRace:SplitRaceSource|null;
 onReady:(which:'model-b'|'p28'|'rear-toe'|'p214',meshCount:number)=>void;
 onFit:(value:OwnerMeasuredFit|null)=>void;
 onRearComposite:(value:RearVisualParts|null)=>void;
 onInspect:(part:InspectedCadPart)=>void;
 selectedPart:InspectedCadPart|null;
 onError:(message:string)=>void;
};
type Decoded={model:THREE.Group;probe?:SourceGeometryProbe};
type AnimatedMesh={
 mesh:THREE.Mesh;
 station:WheelId;
 origin:'p28'|'rear-toe'|'joint';
 target:THREE.Object3D;
 spin:CadAnimatedPivot|null;
 originalPosition:THREE.Vector3;
 offset:THREE.Vector3;
 name:string;
 kind:'p28'|'rear-toe'|'joint';
 materials:THREE.Material[];
};
type Visual={
 root:THREE.Group;
 meshes:AnimatedMesh[];
 ownedMaterials:THREE.Material[];
 rearComposite:RearVisualParts|null;
};

const FINGERPRINT_LENGTH=27.7926;
const OWNER_CALIBRATED_FALLBACK_SCALE=.17357287237986882;
const finite3=(items:number[])=>items.length===3&&items.every(Number.isFinite);

function releaseSource(model:THREE.Group){
 const geometries=new Set<THREE.BufferGeometry>();
 const materials=new Set<THREE.Material>();
 const textures=new Set<THREE.Texture>();
 model.traverse(o=>{
  if(!(o instanceof THREE.Mesh))return;
  geometries.add(o.geometry);
  for(const m of Array.isArray(o.material)?o.material:[o.material]){
   materials.add(m);
   for(const item of Object.values(m))if(item instanceof THREE.Texture)textures.add(item);
  }
 });
 geometries.forEach(g=>g.dispose());
 materials.forEach(m=>m.dispose());
 textures.forEach(t=>t.dispose());
}
function makeLoader(){
 return new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
}
function useLocalSource(
 source:{glbBytes:ArrayBuffer}|null,
 expectedNames:readonly string[],
 identity:string,
 onReady:Props['onReady'],
 onError:Props['onError'],
 kind:'p28'|'rear-toe'|'p214',
):Decoded|null{
 const [decoded,setDecoded]=useState<Decoded|null>(null);
 // Source SHA verification occurs in the route BEFORE this function.
 useEffect(()=>{
  let active=true;
  let parsed:THREE.Group|null=null;
  setDecoded(null);
  if(!source)return;
  void MeshoptDecoder.ready.then(()=>makeLoader().parseAsync(source.glbBytes.slice(0),''))
   .then(({scene})=>{
    parsed=scene;
    const names:string[]=[];
    scene.traverse(o=>{if(o instanceof THREE.Mesh)names.push(o.name);});
    if(!active){releaseSource(scene);return;}
    const allowed=new Set(expectedNames);
    if(names.length!==expectedNames.length||
       new Set(names).size!==names.length||
       names.some(name=>!allowed.has(name))){
      releaseSource(scene);parsed=null;
      onError(identity+' GLB must contain exactly '+expectedNames.length+
       ' source-named meshes, no duplicates.');
      return;
    }
    let probe:SourceGeometryProbe|undefined;
    if(kind==='p28'){
      try{probe=probeOriginalGeometry(scene,'p28');}
      catch(error){releaseSource(scene);parsed=null;onError('P2.8 measurement failed: '+String(error));return;}
    }
    setDecoded({model:scene,probe});
    onReady(kind,names.length);
   }).catch(error=>{if(active)onError(identity+' decode failed: '+String(error));});
  return()=>{active=false;setDecoded(null);if(parsed)releaseSource(parsed);};
 // Stable parent callbacks and memoized identity arrays avoid repeat source decode.
 },[source,identity,expectedNames,onError,onReady,kind]);
 return decoded;
}
function useOriginalBody(onReady:Props['onReady'],onError:Props['onError']):Decoded|null{
 const [body,setBody]=useState<Decoded|null>(null);
 useEffect(()=>{
  let active=true;
  let loaded:THREE.Group|null=null;
  const loader=makeLoader();
  loader.load(import.meta.env.BASE_URL+'models/model-b-eds-optimized-v1.glb',gltf=>{
    const scene=gltf.scene;loaded=scene;
    if(!active){releaseSource(scene);return;}
    try{
      const probe=probeOriginalGeometry(scene,'model-b');
      const [min,max]=probe.sourceBoundsM;
      if(!finite3(min)||!finite3(max)||Math.abs(max[0]-min[0]-FINGERPRINT_LENGTH)>.3)
        throw Error('Unexpected original Model B mesh fingerprint');
      setBody({model:scene,probe});
      onReady('model-b',probe.meshCount);
    }catch(error){
      loaded=null;releaseSource(scene);
      onError('Original Model B source fingerprint failed: '+String(error));
    }
  },undefined,error=>{if(active)onError('Original Model B GLB failed: '+String(error));});
  return()=>{active=false;setBody(null);if(loaded)releaseSource(loaded);};
 },[onReady,onError]);
 return body;
}
function copyMaterials(mesh:THREE.Mesh,store:THREE.Material[]){
 const input=Array.isArray(mesh.material)?mesh.material:[mesh.material];
 const copies=input.map(original=>{
   const m=original.clone();
   m.transparent=true;
   m.depthWrite=true;
   store.push(m);
   return m;
 });
 mesh.material=Array.isArray(mesh.material)?copies:copies[0];
 return copies;
}
function createWheelVisual(
 p28:THREE.Group,fit:OwnerMeasuredFit,
 toe:THREE.Group|null,joints:THREE.Group|null,
):Visual{
 const root=new THREE.Group();
 const meshes:AnimatedMesh[]=[];
 const ownedMaterials:THREE.Material[]=[];
 const rearNames:string[]=[];
 const jointNames:string[]=[];
 toe?.traverse(o=>{if(o instanceof THREE.Mesh)rearNames.push(o.name);});
 joints?.traverse(o=>{if(o instanceof THREE.Mesh)jointNames.push(o.name);});
 const rearComposite=toe?rearVisualPartIds(rearNames,joints?jointNames:null):null;
 const allowedRearPartNames=rearComposite?new Set(rearComposite.visiblePartNames):null;
 function bindMesh(mesh:THREE.Mesh,kind:AnimatedMesh['kind'],
     offset:THREE.Vector3,station:WheelId){
   mesh.userData.pedsCadOrigin=kind;
   mesh.userData.pedsWheelStation=station;
   mesh.userData.pedsCadPartId=mesh.name;
   const animatedScrew=kind==='p28'&&classifyP28Part(mesh.name)==='hardware'
     ?pivotSourceMeshAtCentroid(mesh):null;
   const target=animatedScrew?.root??mesh;
   const materials=copyMaterials(mesh,ownedMaterials);
   meshes.push({mesh,station,origin:kind,target,spin:animatedScrew,
     originalPosition:target.position.clone(),
     offset,name:mesh.name,kind,materials});
 }
 for(const mount of layoutFourCorners(fit)){
   const carrier=new THREE.Group();
   carrier.name='model-b-scroll-'+mount.id;
   carrier.position.set(...mount.translationM);
   carrier.rotation.y=mount.rotationYRad;
   const partRoot=p28.clone(true);
   const originalMeshNodes:THREE.Mesh[]=[];
   partRoot.traverse(o=>{
     if(o instanceof THREE.Mesh)originalMeshNodes.push(o);
   });
   // Do not edit a Three.js scene's children while traversing it: adding
   // screw-centre pivot groups during traversal could recurse indefinitely.
   for(const o of originalMeshNodes){
     if(!visibleInFourCornerPreview(o.name,mount.station)){
       o.visible=false;continue;
     }
     const [x,y,z]=wheelOffset(o.name,mount.station);
     // Native hardware rotates about its measured local geometry centroid.
     // The pivot has an exactly identical final world matrix to the source.
     bindMesh(o,'p28',new THREE.Vector3(x,y,z),mount.id);
   }
   carrier.add(partRoot);
   root.add(carrier);
 }
 const rearMounts=layoutFourCorners(fit).filter(m=>m.station==='rear');
 function addRear(asset:THREE.Group,kind:'rear-toe'|'joint'){
   for(const mount of rearMounts){
     const carrier=new THREE.Group();
     carrier.name='model-b-scroll-'+kind+'-'+mount.id;
     carrier.position.set(...mount.translationM);
     carrier.rotation.y=mount.rotationYRad;
     const view=asset.clone(true);
     // Same source-local translation as existing RearToeAdjusterInstances.
     view.position.add(new THREE.Vector3(...fit.originalP28WheelCenterM));
     view.traverse(o=>{
       if(!(o instanceof THREE.Mesh))return;
       if(allowedRearPartNames&&!allowedRearPartNames.has(o.name)){
         o.visible=false;return;
       }
       const e=(stablePartOffset(o.name)*33);
       const offset=kind==='rear-toe'
         ?new THREE.Vector3(-.55,e+.05,mount.side*.60)
         :new THREE.Vector3(-.20,e+.25,mount.side*.48);
       bindMesh(o,kind,offset,mount.id);
     });
     carrier.add(view);
     root.add(carrier);
   }
 }
 if(toe)addRear(toe,'rear-toe');
 if(joints&&toe)addRear(joints,'joint');
 return {root,meshes,ownedMaterials,rearComposite};
}
function StudioLights(){
 const {gl,scene}=useThree();
 useEffect(()=>{
   const previous=scene.environment;
   const pmrem=new THREE.PMREMGenerator(gl);
   const room=new RoomEnvironment();
   const texture=pmrem.fromScene(room,.05).texture;
   scene.environment=texture;
   return()=>{
     scene.environment=previous;
     texture.dispose();pmrem.dispose();
     // RoomEnvironment creates its own buffers and does not outlive this effect.
   };
 },[gl,scene]);
 return <>
  <hemisphereLight args={['#dbe9fa','#101c2d',2.15]}/>
  <ambientLight intensity={.65}/>
  <directionalLight position={[4,7,7]} intensity={3.8} color="#e2f1ff"/>
  <directionalLight position={[-6,3,-5]} intensity={2.8} color="#fa8257"/>
  <pointLight position={[1.5,2,-3]} intensity={32} distance={12} color="#8aaeff"/>
 </>;
}
function ModelBAnimationScene({progressRef,reducedMotion,corner,rearToe,splitRace,onReady,onFit,onRearComposite,onInspect,selectedPart,onError}:Props){
 const {camera,size}=useThree();
 const original=useOriginalBody(onReady,onError);
 const originalPartNames=useMemo(()=>corner?.parts.map(x=>x.node)??[],[corner]);
 const p28=useLocalSource(corner,originalPartNames,'P2.8',onReady,onError,'p28');
 const rearToeNames=useMemo(()=>rearToe?.manifest.partIds??[],[rearToe]);
 const rear=useLocalSource(rearToe,rearToeNames,'P2.12',onReady,onError,'rear-toe');
 const split=useLocalSource(splitRace,P214_PARTS,'P2.14',onReady,onError,'p214');
 const fitResult=useMemo(()=>{
   if(!original?.probe||!p28?.probe)return {fit:null,error:null};
   try {
     return {fit:fitOwnerShellToOriginalP28(original.probe,p28.probe),error:null};
   }catch(error){return {fit:null,error:String(error)};}
 },[original,p28]);
 useEffect(()=>{if(fitResult.error)onError('Original wheel geometry fit: '+fitResult.error);},
   [fitResult.error,onError]);
 const fit=fitResult.fit;
 useEffect(()=>onFit(fit),[fit,onFit]);
 const shellScale=fit?.normalizedShellScale??OWNER_CALIBRATED_FALLBACK_SCALE;
 const [shellVisuals,setShellVisuals]=useState<{
   mesh:THREE.Mesh;origin:THREE.Vector3;offset:THREE.Vector3;
   baseOpacity:number;materials:THREE.Material[];
 }[]>([]);
 useEffect(()=>{
   const body=original?.model;
   if(!body)return;
   const saved=new Map<THREE.Mesh,THREE.Material|THREE.Material[]>();
   const owned:THREE.Material[]=[];
   const records:typeof shellVisuals=[];
   body.updateWorldMatrix(true,true);
   const reverse=body.matrixWorld.clone().invert();
   const tmp=new THREE.Matrix4();
   body.traverse(o=>{
     if(!(o instanceof THREE.Mesh))return;
     saved.set(o,o.material);
     const materials=copyMaterials(o,owned);
     const box=new THREE.Box3().setFromObject(o);
     const center=box.getCenter(new THREE.Vector3());
     const extent=box.getSize(new THREE.Vector3()).length()*shellScale;
     const strength=extent>2.3?0:.42+stablePartOffset(o.name)*27;
     // Only separate original bounded mesh pieces; giant chassis meshes
     // stay in place and become transparent. No invented structural pieces.
     const direction=new THREE.Vector3(
       center.x>0?1:-1,center.y>0?.7:-.5,center.z>=0?1:-1);
     const offset=direction.multiplyScalar(strength/shellScale);
     if(fit&&corner){
       tmp.multiplyMatrices(reverse,o.matrixWorld);
       for(const m of materials)addReversibleWheelWindow(m,tmp.clone(),fit);
     }
     records.push({mesh:o,origin:o.position.clone(),offset,
       baseOpacity:materials[0]?.opacity??1,materials});
   });
   setShellVisuals(records);
   return()=>{
     for(const [mesh,mat]of saved)mesh.material=mat;
     for(const r of records)r.mesh.position.copy(r.origin);
     owned.forEach(m=>m.dispose());
     setShellVisuals([]);
   };
 },[original,fit,corner,shellScale]);
 const visual=useMemo(()=>{
   if(!p28||!fit)return null;
   return createWheelVisual(p28.model,fit,rear?.model??null,split?.model??null);
 },[p28,fit,rear,split]);
 useEffect(()=>onRearComposite(visual?.rearComposite??null),
   [visual,onRearComposite]);
 useEffect(()=>()=>{
   if(!visual)return;
   visual.ownedMaterials.forEach(m=>m.dispose());
 },[visual]);
 useEffect(()=>{
   if(!visual||!selectedPart)return;
   try{
     return highlightSourceMaterials(visual.meshes,selectedPart);
   }catch(error){
     onError('Selected original CAD material highlight failed: '+String(error));
   }
 },[visual,selectedPart,onError]);
 const selectedVisual=useMemo(()=>{
   if(!visual||!selectedPart)return null;
   try{return locateSelectedCadMesh(visual.meshes,selectedPart);}
   catch{return null;}
 },[visual,selectedPart]);
 const progress=useMemo(()=>({current:0}),[]);
 const targetPos=useMemo(()=>new THREE.Vector3(7,3,9),[]);
 const targetLook=useMemo(()=>new THREE.Vector3(),[]);
 const cameraLook=useMemo(()=>new THREE.Vector3(),[]);
 useFrame((_,delta)=>{
   const desired=clamp01(progressRef.current??0);
   const alpha=reducedMotion?1:1-Math.exp(-Math.min(delta,.06)*6.5);
   progress.current=THREE.MathUtils.lerp(progress.current,desired,alpha);
   const p=progress.current;
   const showCad=Boolean(visual);
   const shellOpacity=visualShellOpacity(p,showCad);
   const separation=exteriorSeparation(p,showCad);
   for(const item of shellVisuals){
     item.mesh.position.copy(item.origin).addScaledVector(item.offset,separation);
     for(const material of item.materials){
       material.opacity=item.baseOpacity*shellOpacity;
       material.depthWrite=shellOpacity>.92;
     }
   }
   if(visual){
     for(const item of visual.meshes){
       const fraction=item.kind==='p28'?
         originalPartAssembly(item.name,p):
         rearSourceAssembly(p,item.kind==='rear-toe'?'toe':'joint',item.name);
       item.target.position.copy(item.originalPosition)
         .addScaledVector(item.offset,1-fraction);
       if(item.spin)applyVisualScrewSpin(item.spin,fraction,1.5);
       for(const m of item.materials){
         m.opacity=Math.max(.055,fraction);
         m.depthWrite=fraction>.92;
       }
       item.mesh.visible=p>.235;
     }
   }
   const front=fit?.frontPositiveZCenterM??[1.29,-.18,.88];
   const rearCenter=fit?.wheels.find(w=>w.station==='rear'&&w.side===1)?.centerM
     ??[-1.95,-.19,.99];
   let cameraTarget=new THREE.Vector3(0,-.1,0);
   let distance=8.6;
   let orbit=.0;
   if(p>=.30&&p<.50){
     cameraTarget=new THREE.Vector3(front[0],front[1],front[2]);distance=2.65;orbit=.20;
   }else if(p>=.50&&p<.69){
     cameraTarget.set(-.32,-.12,0);distance=7.3;orbit=-.14;
   }else if(p>=.69&&p<.85){
     cameraTarget=new THREE.Vector3(rearCenter[0],rearCenter[1],rearCenter[2]);distance=2.8;orbit=-.35;
   }else if(p>=.85){
     cameraTarget.set(-.1,-.1,0);distance=8;orbit=.18;
   }else if(p>=.15){
     cameraTarget.set(.05,-.1,0);distance=7.7;orbit=-.15;
   }
   // Focus moves with the actual animated source geometry. Its original
   // GLB mesh vertices can be offset from Object3D.position, so target the
   // real mesh bounding-box centre, not a guessed chassis hardpoint.
   if(selectedVisual&&p>.24){
     try{
       const centre=sourceMeshWorldCentre(selectedVisual.mesh);
       cameraTarget.copy(centre);
       distance=selectedVisual.kind==='p28'&&
         classifyP28Part(selectedVisual.name)==='hardware' ? 0.52 : 1.4;
       orbit=.14;
     }catch{
       // Geometry failing provenance must never become a fictional camera
       // target: retain source-derived chapter camera instead.
     }
   }
   const aspect=size.width/Math.max(1,size.height);
   if(aspect<.8)distance*=1.45;
   targetLook.copy(cameraTarget);
   const orientation=new THREE.Vector3(.72+orbit,.44,1).normalize();
   targetPos.copy(cameraTarget).addScaledVector(orientation,distance);
   const cameraAlpha=reducedMotion?1:1-Math.exp(-Math.min(delta,.06)*3.8);
   camera.position.lerp(targetPos,cameraAlpha);
   cameraLook.lerp(targetLook,cameraAlpha);
   camera.lookAt(cameraLook);
   camera.updateMatrixWorld();
 });
 return <>
   <StudioLights/>
   {original&&<group name="model-b-owner-exterior" scale={shellScale}>
     <primitive object={original.model}/>
   </group>}
   {visual&&<primitive object={visual.root}
     onClick={(event:ThreeEvent<MouseEvent>)=>{
       const hit=event.object;
       if(!(hit instanceof THREE.Mesh)||!hit.visible)return;
       const {pedsCadOrigin,pedsWheelStation,pedsCadPartId}=hit.userData;
       if(typeof pedsCadOrigin!=='string'||
          typeof pedsWheelStation!=='string'||
          typeof pedsCadPartId!=='string')return;
       try{
         const part=inspectOriginalCadMesh(
           pedsCadPartId,pedsWheelStation as WheelId,
           pedsCadOrigin as 'p28'|'rear-toe'|'joint',originalPartNames);
         event.stopPropagation();
         onInspect(part);
       }catch(error){
         onError('Model B CAD raycast provenance rejected: '+String(error));
       }
     }/>}
 </>;
}
/** Browser-native WebGL source viewer: original Model B is auto-loaded;
 * imported CAD is SHA verified by the route, never generated as fake parts.
 */
export default function ModelBAssemblyStage(props:Props){
 return <Canvas
    dpr={[1,Math.min(1.7,typeof window==='undefined'?1.5:window.devicePixelRatio||1.5)]}
    frameloop="always"
    camera={{fov:35,position:[7,3,9],near:.025,far:110}}
    gl={{antialias:true,powerPreference:'high-performance',alpha:false}}
    onCreated={({gl})=>{
      gl.outputColorSpace=THREE.SRGBColorSpace;
      gl.toneMapping=THREE.ACESFilmicToneMapping;
      gl.toneMappingExposure=1.18;
    }}>
    <color attach="background" args={['#080e18']}/>
    <ModelBAnimationScene {...props}/>
  </Canvas>;
}
