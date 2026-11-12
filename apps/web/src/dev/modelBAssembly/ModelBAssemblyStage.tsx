/* eslint-disable react-hooks/immutability -- Three.js is an imperative render engine: useFrame and WebGL PMREM mutate viewer-owned scene objects, never React state. */
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
import {ORIGINAL_MODEL_B_SOURCE,verifyOriginalModelBBinary} from './originalModelBSource';
import {sourceOnlyModelBCamera} from './modelBSourceOnlyCamera';
import {frameOriginalModelB,originalModelBFitsFrame} from './modelBFraming';
import {buildOwnerSourceParticles,ownerParticleOpacity} from './ownerSourceParticles';
import {applyCadViewerAppearance,cadPreviewAppearance,
 type CadAppearance} from './cadPreviewMaterials';
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
 onFramingVerified:(fit:boolean|null)=>void;
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
  return()=>{active=false;if(parsed)releaseSource(parsed);};
 // Stable parent callbacks and memoized identity arrays avoid repeat source decode.
 },[source,identity,expectedNames,onError,onReady,kind]);
 return decoded;
}
function useOriginalBody(onReady:Props['onReady'],onError:Props['onError']):Decoded|null{
 const [body,setBody]=useState<Decoded|null>(null);
 useEffect(()=>{
   let active=true;
   let loaded:THREE.Group|null=null;
   const controller=new AbortController();
   setBody(null);
   const run=async()=>{
     try{
       const path=import.meta.env.BASE_URL+ORIGINAL_MODEL_B_SOURCE.assetPath;
       const response=await fetch(path,{
         cache:'no-store',signal:controller.signal,
       });
       if(!response.ok)
         throw Error('Original Model B GLB HTTP '+response.status);
       const bytes=await response.arrayBuffer();
       // Do not render a same-shaped substitute. This Git object identity
       // comes from the original Model B GLB committed to this repository.
       await verifyOriginalModelBBinary(bytes);
       if(!active)return;
       await MeshoptDecoder.ready;
       const {scene}=await makeLoader().parseAsync(bytes,'');
       loaded=scene;
       if(!active){releaseSource(scene);loaded=null;return;}
       const probe=probeOriginalGeometry(scene,'model-b');
       const [min,max]=probe.sourceBoundsM;
       if(!finite3(min)||!finite3(max)||
          Math.abs(max[0]-min[0]-FINGERPRINT_LENGTH)>.3)
         throw Error('Unexpected original Model B mesh fingerprint');
       if(active){
         setBody({model:scene,probe});
         onReady('model-b',probe.meshCount);
       }
     }catch(error){
       if(loaded){releaseSource(loaded);loaded=null;}
       if(active)onError('Owner Model B Git-object/geometry validation failed: '+String(error));
     }
   };
   void run();
   return()=>{
     active=false;
     controller.abort();
     if(loaded)releaseSource(loaded);
   };
 },[onReady,onError]);
 return body;
}
function copyMaterials(mesh:THREE.Mesh,store:THREE.Material[],
    appearance?:CadAppearance){
 const input=Array.isArray(mesh.material)?mesh.material:[mesh.material];
 const copies=input.map(original=>{
   const m=original.clone();
   if(appearance)applyCadViewerAppearance(m,appearance);
   else if(m instanceof THREE.MeshStandardMaterial){
     // Preview-only fill light: retain the author's GLB color/texture bytes.
     m.envMapIntensity=Math.max(.85,m.envMapIntensity);
   }
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
   const materials=copyMaterials(mesh,ownedMaterials,
     cadPreviewAppearance(mesh.name,kind));
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
  <directionalLight position={[1,6,-8]} intensity={2.4} color="#f7e5cd"/>
  <pointLight position={[1.5,2,-3]} intensity={32} distance={12} color="#8aaeff"/>
 </>;
}
function ModelBAnimationScene({progressRef,reducedMotion,corner,rearToe,splitRace,onReady,onFit,onRearComposite,onFramingVerified,onInspect,selectedPart,onError}:Props){
 const {camera,size}=useThree();
 const original=useOriginalBody(onReady,onError);
 const originalPartNames=useMemo(()=>corner?.parts.map(x=>x.node)??[],[corner]);
 const [ownerParticles,setOwnerParticles]=useState<ReturnType<
   typeof buildOwnerSourceParticles>|null>(null);
 useEffect(()=>{
   if(!original){setOwnerParticles(null);return;}
   let particles:ReturnType<typeof buildOwnerSourceParticles>|null=null;
   try{particles=buildOwnerSourceParticles(original.model);setOwnerParticles(particles);}
   catch(error){setOwnerParticles(null);
     onError('Verified Model B vertex layer rejected: '+String(error));}
   return()=>{if(particles)particles.dispose();};
 },[original,onError]);
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
 const showroomWheelMask=useMemo(()=>({value:0}),[original,fit]);
 const analyticFinalFrame=useMemo(()=>{
   if(!original?.probe)return null;
   const aspect=size.width/Math.max(1,size.height);
   const pose=frameOriginalModelB(
     original.probe.sourceBoundsM,shellScale,aspect,35,[.88,.44,1]);
   return originalModelBFitsFrame(
     original.probe.sourceBoundsM,shellScale,aspect,35,pose);
 },[original,size.width,size.height,shellScale]);
 useEffect(()=>onFramingVerified(analyticFinalFrame),
   [analyticFinalFrame,onFramingVerified]);
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
     const strength=extent>2.3?0:.10+stablePartOffset(o.name)*5;
     // Only separate original bounded mesh pieces; giant chassis meshes
     // stay in place and become transparent. No invented structural pieces.
     const direction=new THREE.Vector3(
       center.x>0?1:-1,center.y>0?.7:-.5,center.z>=0?1:-1);
     const offset=direction.multiplyScalar(strength/shellScale);
     if(fit&&corner){
       tmp.multiplyMatrices(reverse,o.matrixWorld);
       for(const m of materials)
         addReversibleWheelWindow(m,tmp.clone(),fit,showroomWheelMask);
     }
     records.push({mesh:o,origin:o.position.clone(),offset,
       baseOpacity:materials[0]?.opacity??1,materials});
   });
   setShellVisuals(records);
   return()=>{
     for(const [mesh,mat]of saved)mesh.material=mat;
     for(const r of records)r.mesh.position.copy(r.origin);
     owned.forEach(m=>m.dispose());
   };
 },[original,fit,corner,shellScale,showroomWheelMask]);
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
 const macroFastener=useMemo(()=>visual?.meshes.find(item=>
   item.station==='front-positive-z'&&item.kind==='p28'&&
   classifyP28Part(item.name)==='hardware')??null,[visual]);
 const macroRearJoint=useMemo(()=>visual?.meshes.find(item=>
   item.station==='rear-positive-z'&&item.kind==='joint')??null,[visual]);
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
   const alpha=reducedMotion?1:1-Math.exp(-Math.min(delta,.06)*11);
   progress.current=THREE.MathUtils.lerp(progress.current,desired,alpha);
   const p=progress.current;
   if(ownerParticles){
     const opacity=ownerParticleOpacity(p);
     ownerParticles.points.visible=opacity>.005;
     if(opacity>.005)ownerParticles.setAssemblyProgress(p);
     ownerParticles.points.material.opacity=opacity;
   }
   const showCad=Boolean(visual);
   const shellOpacity=visualShellOpacity(p,showCad);
   const separation=exteriorSeparation(p,showCad);
   // Preserve the four original showroom tyres until their exact CAD
   // replacements start arriving, then hide duplicate dark tyre volumes.
   showroomWheelMask.value=showCad?
     originalPartAssembly('P2_TYRE_SLICK_BODY',p):0;
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
         // Do not render unassembled 5.5%-opaque ghost tyres in front of
         // the F1; reveal the real source only on its scheduled arrival.
         m.opacity=Math.min(1,Math.max(0,fraction*3));
         m.depthWrite=fraction>.94;
       }
       item.mesh.visible=fraction>.008;
     }
   }
   const aspect=size.width/Math.max(1,size.height);
   const cameraTarget=new THREE.Vector3(0,-.1,0);
   let distance=8.6;
   let orbit=.0;
   if(!fit&&original?.probe){
     // No private P2.8 on this checkout? Still animate the genuine original
     // showroom Model B through all six chapters using its actual GLB bounds.
     // Never present assumed wheel/chassis coordinates as measured CAD mates.
     const raw=original.probe.sourceBoundsM;
     const pose=sourceOnlyModelBCamera(
       [raw[0],raw[1]],shellScale,p,aspect);
     cameraTarget.set(...pose.targetM);
     distance=pose.distanceM;
     orbit=pose.orbit;
   }else if(fit){
     // Once native P2.8 is loaded and measured, use its actual four centres.
     const front=fit.frontPositiveZCenterM;
     const rearCenter=fit.wheels.find(w=>w.station==='rear'&&w.side===1)?.centerM;
     if(!rearCenter)throw Error('Source-measured original rear wheel centre absent');
     if(p>=.30&&p<.50){
       cameraTarget.set(front[0],front[1],front[2]);distance=2.65;orbit=.20;
     }else if(p>=.50&&p<.69){
       cameraTarget.set(-.32,-.12,0);distance=7.3;orbit=-.14;
     }else if(p>=.69&&p<.85){
       cameraTarget.set(rearCenter[0],rearCenter[1],rearCenter[2]);distance=2.8;orbit=-.35;
     }else if(p>=.85){
       cameraTarget.set(-.1,-.1,0);distance=8;orbit=.18;
     }else if(p>=.15){
       cameraTarget.set(.05,-.1,0);distance=7.7;orbit=-.15;
     }
     if(aspect<.8)distance*=1.45;
   }
   // Source-authored macro shots. Never look at an invented bolt or fake
   // bearing: the camera follows the actual decoded GLB mesh centroids.
   if(!selectedVisual&&macroFastener&&p>=.45&&p<.54){
     try{
       cameraTarget.copy(sourceMeshWorldCentre(macroFastener.mesh));
       distance=.92;
       orbit=.09;
     }catch{/* Preserve chapter camera on invalid source mesh. */}
   }else if(!selectedVisual&&macroRearJoint&&p>=.74&&p<.83){
     try{
       cameraTarget.copy(sourceMeshWorldCentre(macroRearJoint.mesh));
       distance=1.36;
       orbit=-.13;
     }catch{/* Preserve chapter camera on invalid source mesh. */}
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
   const hardwareMacroActive=Boolean(macroFastener&&p>=.45&&p<.54);
   if(original?.probe&&!selectedVisual&&!hardwareMacroActive&&
     (p>=.85||(p>=.50&&p<.69))){
     const framing=frameOriginalModelB(
       original.probe.sourceBoundsM,shellScale,aspect,35,
       [.72+orbit,.44,1]);
     cameraTarget.set(...framing.targetM);
     distance=Math.max(distance,framing.distanceM);
   }
   targetLook.copy(cameraTarget);
   const orientation=new THREE.Vector3(.72+orbit,.44,1).normalize();
   targetPos.copy(cameraTarget).addScaledVector(orientation,distance);
   const cameraAlpha=reducedMotion?1:1-Math.exp(-Math.min(delta,.06)*9.5);
   camera.position.lerp(targetPos,cameraAlpha);
   cameraLook.lerp(targetLook,cameraAlpha);
   camera.lookAt(cameraLook);
   camera.updateMatrixWorld();
 });
 return <>
   <StudioLights/>
   {original&&<group name="model-b-owner-exterior" scale={shellScale}>
     <primitive object={original.model}/>
     {ownerParticles&&<primitive object={ownerParticles.points}/>}
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
      gl.toneMappingExposure=1.32;
    }}>
    <color attach="background" args={['#080e18']}/>
    <ModelBAnimationScene {...props}/>
  </Canvas>;
}
