/* eslint-disable react-hooks/immutability -- Three.js is an imperative render engine: useFrame and WebGL PMREM mutate viewer-owned scene objects, never React state. */
import {useEffect,useMemo,useRef,useState,type RefObject} from 'react';
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
import {
 buildSourceCadVertexDots,sourceCadAssemblyDotOpacity,
 sourceCadInspectionDotOpacity,type SourceCadVertexDots,
} from './sourceCadVertexDots';
import {sourceCadDotFrame,updateSourceCadDotRange} from './sourceCadDotProgress';
import {
 selectNativeHardwareDotParts,validateNativeCadDotsBudget,
 SOURCE_CAD_HARDWARE_DOT_BUDGET,SOURCE_CAD_TYRE_DOT_BUDGET,
} from './sourceCadDotSelection';
import {sourceBodyMeshKey,sourceBodyMeshPhase,sourceBodyVisualDisplacement} from './sourceOnlyMeshMotion';
import {auditMountedCadScene,type MountedCadSceneAudit} from './mountedCadSceneAudit';
import {auditMountedCadIdentity} from './mountedCadIdentity';
import {cadInspectionVisualFrame,cadInspectionShellAlpha,cadInspectionAssemblyFraction} from './cadInspectionVisualFrame';
import {sourceCadXrayRenderLayer,sourceCadXrayFrameVerified} from './sourceCadXrayRenderLayer';
import {sourceBodyWorldRevealStrength,sourceMeshOwnWorldBounds,sourceMeshRevealWorldDirection,worldDeltaToParentLocal} from './sourceWorldReveal';
import {accessibleAssemblyFraction,accessibleShellOpacity} from './accessibleAssemblyPose';
import {sourceMaterialFrame,type SourceMaterialState} from './sourceShellMaterialState';
import {applyCadViewerAppearance,cadPreviewAppearance,
 type CadAppearance} from './cadPreviewMaterials';
import {inspectOriginalCadMesh,type InspectedCadPart} from './cadPartInspector';
import {locateSelectedCadMesh,sourceMeshWorldCentre,sourceMeshWorldFocusBounds,highlightSourceMaterials} from './cadFocus';
import {sourceCadFocusDistance} from './sourceCadFocusFraming';
import type {WheelId} from '../assemblyPreview/fourCornerLayout';
import {
 clamp01,exteriorSeparation,originalPartAssembly,rearSourceAssembly,
 visualShellOpacity,wheelOffset,stablePartOffset,originalPartAssemblyAtStation,
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
 onMountedCadAudit:(value:MountedCadSceneAudit|null)=>void;
 onFramingVerified:(fit:boolean|null)=>void;
 onInspect:(part:InspectedCadPart)=>void;
 onFocusVerified:(part:InspectedCadPart|null)=>void;
 onXrayRenderVerified:(part:InspectedCadPart|null)=>void;
 onSourceCadDotsReady:(sampledVertices:number,fastenerMeshes:number)=>void;
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
 originalDepthTests:boolean[];
 originalRenderOrder:number;
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
   const originalDepthTests=materials.map(material=>material.depthTest);
   const originalRenderOrder=mesh.renderOrder;
   meshes.push({mesh,station,origin:kind,target,spin:animatedScrew,
     originalPosition:target.position.clone(),
     offset,name:mesh.name,kind,materials,
     originalDepthTests,originalRenderOrder});
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
function ModelBAnimationScene({progressRef,reducedMotion,corner,rearToe,splitRace,onReady,onFit,onRearComposite,onMountedCadAudit,onFramingVerified,onInspect,onFocusVerified,onXrayRenderVerified,onSourceCadDotsReady,selectedPart,onError}:Props){
 const {camera,size,gl}=useThree();
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
 const showroomWheelMaskByStation=useMemo(
   ()=>({value:[0,0,0,0]}),[original,fit]);
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
   sourceKey:string;materialStates:SourceMaterialState[];materials:THREE.Material[];
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
   let meshOrdinal=0;
   body.traverse(o=>{
     if(!(o instanceof THREE.Mesh))return;
     saved.set(o,o.material);
     const originals=Array.isArray(o.material)?o.material:[o.material];
     const materialStates=originals.map(material=>({
       opacity:material.opacity,depthWrite:material.depthWrite,
     }));
     const materials=copyMaterials(o,owned);
     // Three.js Box3.setFromObject includes child meshes, which caused
     // small authentic body pieces to inherit a giant chassis extent.
     // Measure THIS source geometry only, after its exact world matrix.
     // Duplicate/unnamed GLB nodes keep distinct deterministic phases.
     const sourceKey=sourceBodyMeshKey(o.name,meshOrdinal++);
     let strength=0;
     const center=new THREE.Vector3();
     try{
       if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();
       const ownBox=o.geometry.boundingBox;
       if(ownBox&&!ownBox.isEmpty()){
         const measured=sourceMeshOwnWorldBounds(
           [ownBox.min.x,ownBox.min.y,ownBox.min.z],
           [ownBox.max.x,ownBox.max.y,ownBox.max.z],
           o.matrixWorld.elements);
         center.set(...measured.center);
         strength=sourceBodyWorldRevealStrength(
           measured.diagonal,sourceBodyMeshPhase(sourceKey));
       }
     }catch(error){
       // An invalid source mesh must not crash the complete F1 renderer.
       // Keep that owner's mesh at its untouched original transform and
       // expose the provenance failure rather than fabricating a shape.
       strength=0;
       onError('Original Model B source mesh bounds rejected ('+
         sourceKey+'): '+String(error));
     }
     // An exact unit direction makes strength the actual world-metre
     // visual travel distance, independent of the selected octant.
     const direction=sourceMeshRevealWorldDirection(
       [center.x,center.y,center.z]);
     const offset=new THREE.Vector3(...direction).multiplyScalar(strength);
     // Giant meshes stay fixed and do not need parent matrix inversions.
     if(o.parent&&strength>0){
       const inverse=o.parent.matrixWorld.clone().invert();
       const [x,y,z]=worldDeltaToParentLocal(
         [offset.x,offset.y,offset.z],inverse.elements);
       offset.set(x,y,z);
     }
     if(fit&&corner){
       tmp.multiplyMatrices(reverse,o.matrixWorld);
       for(const m of materials)
         addReversibleWheelWindow(m,tmp.clone(),fit,showroomWheelMask,
           showroomWheelMaskByStation);
     }
     records.push({mesh:o,origin:o.position.clone(),offset,sourceKey,
       materialStates,materials});
   });
   setShellVisuals(records);
   return()=>{
     for(const [mesh,mat]of saved)mesh.material=mat;
     for(const r of records)r.mesh.position.copy(r.origin);
     owned.forEach(m=>m.dispose());
   };
 },[original,fit,corner,shellScale,showroomWheelMask,
   showroomWheelMaskByStation]);
 const visual=useMemo(()=>{
   if(!p28||!fit)return null;
   return createWheelVisual(p28.model,fit,rear?.model??null,split?.model??null);
 },[p28,fit,rear,split]);
 useEffect(()=>onRearComposite(visual?.rearComposite??null),
   [visual,onRearComposite]);
 useEffect(()=>{
   if(!visual){onMountedCadAudit(null);return;}
   try{
     const countAudit=auditMountedCadScene(visual.meshes);
     const rearVisibleNames=new Set(visual.rearComposite?.visiblePartNames??[]);
     const exact=auditMountedCadIdentity(visual.meshes,{
       frontP28:originalPartNames,
       rearP28:originalPartNames.filter(name=>
         visibleInFourCornerPreview(name,'rear')),
       rearToe:rear?rearToeNames.filter(name=>rearVisibleNames.has(name)):[],
       rearJoint:split?P214_PARTS:[],
     });
     if(countAudit.mountedMeshInstances!==exact.checkedSourceMeshInstances)
       throw Error('Mounted Model B source mesh count/name mismatch');
     // Real scene ancestry, original geometry and four measured wheel
     // carrier transforms must match the mounted source metadata. A count-only
     // audit cannot detect a clone attached to the wrong corner or a hidden
     // parent that would prevent its source material from ever rendering.
     if(!fit)throw Error('Measured owner Model B wheel transform unavailable');
     const measuredMounts=new Map(layoutFourCorners(fit).map(mount=>
       [mount.id,mount] as const));
     for(const item of visual.meshes){
       const prefix=item.kind==='p28'?'model-b-scroll-':
         'model-b-scroll-'+item.kind+'-';
       const carrierName=prefix+item.station;
       let node:THREE.Object3D|null=item.mesh.parent;
       while(node&&node!==visual.root&&node.name!==carrierName){
         if(!node.visible)
           throw Error('Mounted source CAD has permanently hidden parent: '+
             item.station+'/'+item.name);
         node=node.parent;
       }
       const carrier=node?.name===carrierName&&node.parent===visual.root?
         node:null;
       const mount=measuredMounts.get(item.station);
       const position=item.mesh.geometry.getAttribute('position');
       if(!carrier||!mount||!position||position.itemSize!==3||
          position.count<3)
         throw Error('Original mounted CAD mesh detached/empty/wrong station: '+
           item.station+'/'+item.name);
       if(!carrier.visible||
          carrier.position.distanceTo(new THREE.Vector3(...mount.translationM))>1e-6||
          Math.abs(carrier.rotation.y-mount.rotationYRad)>1e-6)
         throw Error('Original mounted CAD carrier does not match measured wheel: '+
           item.station+'/'+item.name);
       if(item.mesh.userData.pedsCadOrigin!==item.kind||
          item.mesh.userData.pedsWheelStation!==item.station||
          item.mesh.userData.pedsCadPartId!==item.name)
         throw Error('Original mounted CAD inspection metadata mismatched: '+
           item.station+'/'+item.name);
     }
     onMountedCadAudit({...countAudit,sourceNamesExact:true});
   }catch(error){
     onMountedCadAudit(null);
     onError('Mounted original Model B CAD scene validation failed: '+
       String(error));
   }
 },[visual,originalPartNames,rearToeNames,rear,split,onMountedCadAudit,onError]);
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
 const selection=useMemo(()=>{
   if(!visual||!selectedPart)return {mesh:null,error:null};
   try{
     return {mesh:locateSelectedCadMesh(visual.meshes,selectedPart),
       error:null};
   }catch(error){
     return {mesh:null,error:String(error)};
   }
 },[visual,selectedPart]);
 const selectedVisual=selection.mesh;
 type NativeBuildDots={
   station:WheelId;name:string;layer:SourceCadVertexDots;
 };
 // Imperative THREE resources must not be stored in React state:
 // asynchronous source switches and StrictMode effect cleanup can otherwise
 // leave a frame referencing an already-disposed point buffer.
 const buildSourceDots=useRef<NativeBuildDots[]>([]);
 const selectedSourceDots=useRef<SourceCadVertexDots|null>(null);
 useEffect(()=>{
   if(!visual){
     buildSourceDots.current=[];
     onSourceCadDotsReady(0,0);
     return;
   }
   const tyres=visual.meshes.filter(item=>
     item.kind==='p28'&&item.name==='P2_TYRE_SLICK_BODY');
   if(tyres.length!==4||new Set(tyres.map(item=>item.station)).size!==4){
     buildSourceDots.current=[];
     onSourceCadDotsReady(0,0);
     onError('Original four-wheel CAD source vertex overlay rejected: '+
       'expected four genuine P2.8 tyre mesh instances at separate stations');
     return;
   }
   const layers:NativeBuildDots[]=[];
   let actualHardwareLayers=0;
   try{
     for(const item of tyres)
       layers.push({station:item.station,name:item.name,
         layer:buildSourceCadVertexDots(
           item.mesh,SOURCE_CAD_TYRE_DOT_BUDGET,false)});
     // A bounded selection of *real mounted* P2.8 bolts/nuts/studs now
     // materializes as source-derived dots before rim and tyre arrival.
     // No generic fastener geometry is ever synthesized.
     const hardware=selectNativeHardwareDotParts(visual.meshes);
     for(const item of hardware){
       try{
         layers.push({station:item.station,name:item.name,
           layer:buildSourceCadVertexDots(
             item.mesh,SOURCE_CAD_HARDWARE_DOT_BUDGET,false)});
         actualHardwareLayers++;
       }catch(error){
         // A malformed bolt must never replace a real tyre layer or bring
         // down the complete four-corner source assembly visualization.
         onError('P2.8 hardware source dots skipped ('+
           item.station+'/'+item.name+'): '+String(error));
       }
     }
     const count=validateNativeCadDotsBudget(
       layers.map(item=>item.layer));
     buildSourceDots.current=layers;
     onSourceCadDotsReady(count,actualHardwareLayers);
   }catch(error){
     for(const item of layers)item.layer.dispose();
     buildSourceDots.current=[];
     onSourceCadDotsReady(0,0);
     onError('Original four-wheel CAD vertex overlay rejected: '+
       String(error));
     return;
   }
   return()=>{
     if(buildSourceDots.current===layers)buildSourceDots.current=[];
     for(const item of layers)item.layer.dispose();
   };
 },[visual,onSourceCadDotsReady,onError]);
 useEffect(()=>{
   if(!selectedVisual){selectedSourceDots.current=null;return;}
   let layer:SourceCadVertexDots|null=null;
   try{
     layer=buildSourceCadVertexDots(selectedVisual.mesh,1200,true);
     selectedSourceDots.current=layer;
   }catch(error){
     selectedSourceDots.current=null;
     onError('Original selected CAD vertex overlay rejected: '+
       String(error));
   }
   return()=>{
     if(selectedSourceDots.current===layer)selectedSourceDots.current=null;
     layer?.dispose();
   };
 },[selectedVisual,onError]);
 const lastReportedXray=useRef<string|null>(null);
 useEffect(()=>{
   if(selection.error)
     onError('Original source CAD X-ray focus rejected: '+selection.error);
   if(!selectedVisual||!selectedPart){
     onFocusVerified(null);
     return;
   }
   try{
     const bound=sourceMeshWorldFocusBounds(selectedVisual.mesh);
     const hardware=selectedVisual.kind==='p28'&&
       classifyP28Part(selectedVisual.name)==='hardware';
     sourceCadFocusDistance(bound.size,
       size.width/Math.max(1,size.height),35,hardware);
     onFocusVerified(selectedPart);
   }catch(error){
     onFocusVerified(null);
     onError('Original source CAD focus geometry rejected: '+String(error));
   }
 },[selection.error,selectedVisual,selectedPart,
   size.width,size.height,onFocusVerified,onError]);
 const progress=useMemo(()=>({current:0}),[]);
 const targetPos=useMemo(()=>new THREE.Vector3(7,3,9),[]);
 const targetLook=useMemo(()=>new THREE.Vector3(),[]);
 const cameraLook=useMemo(()=>new THREE.Vector3(),[]);
 useFrame((_,delta)=>{
   const desired=clamp01(progressRef.current??0);
   const alpha=reducedMotion?1:1-Math.exp(-Math.min(delta,.06)*11);
   progress.current=THREE.MathUtils.lerp(progress.current,desired,alpha);
   const p=progress.current;
   const inspecting=selectedVisual!==null;
   if(ownerParticles){
     const opacity=reducedMotion||inspecting?0:ownerParticleOpacity(p);
     ownerParticles.points.visible=opacity>.005;
     if(opacity>.005)ownerParticles.setAssemblyProgress(p);
     ownerParticles.points.material.opacity=opacity;
   }
   const showCad=Boolean(visual);
   const shellOpacity=cadInspectionShellAlpha(
     accessibleShellOpacity(visualShellOpacity(p,showCad),reducedMotion),
     inspecting);
   // P2.35 source-only mode still animates the owner's existing body mesh
   // nodes, rather than showing a motionless exterior until private CAD loads.
   const separation=showCad?exteriorSeparation(p,true):0;
   // Preserve the four original showroom tyres until their exact CAD
   // replacements start arriving, then hide duplicate dark tyre volumes.
   // Keep the existing global mask for older viewer uses, but real four-
   // corner shell shader masks follow the exact measured wheel station.
   showroomWheelMask.value=showCad?
     inspecting?1:accessibleAssemblyFraction(
       originalPartAssembly('P2_TYRE_SLICK_BODY',p),reducedMotion):0;
   if(showCad&&fit){
     for(let index=0;index<fit.wheels.length;index++){
       const measured=fit.wheels[index];
       const station=(measured.station+'-'+
         (measured.side===1?'positive':'negative')+'-z') as WheelId;
       showroomWheelMaskByStation.value[index]=inspecting?1:
         accessibleAssemblyFraction(
           originalPartAssemblyAtStation('P2_TYRE_SLICK_BODY',p,station),
           reducedMotion);
     }
   }else showroomWheelMaskByStation.value.fill(0);
   for(const item of shellVisuals){
     const meshSeparation=sourceBodyVisualDisplacement(
       p,item.sourceKey,showCad,reducedMotion,separation);
     item.mesh.position.copy(item.origin).addScaledVector(item.offset,meshSeparation);
     item.materials.forEach((material,index)=>{
       const state=sourceMaterialFrame(item.materialStates[index],shellOpacity);
       material.opacity=state.opacity;
       material.depthWrite=state.depthWrite;
     });
   }
   // Reveal original source vertices incrementally. BufferGeometry.drawRange
   // exposes already-sampled native GLB positions; no new points are ever
   // allocated while scrolling forward, backward or entering X-ray focus.
   let sourceDotsDrawn=0;
   let sourceDotsVisible=0;
   for(const item of buildSourceDots.current){
     const authored=originalPartAssemblyAtStation(
       item.name,p,item.station);
     const desiredOpacity=inspecting?0:
       sourceCadAssemblyDotOpacity(authored,reducedMotion);
     const frame=sourceCadDotFrame(
       item.layer.sampleCount,authored,desiredOpacity);
     updateSourceCadDotRange(item.layer.points.geometry,frame.drawCount);
     item.layer.points.material.opacity=frame.opacity;
     item.layer.points.visible=frame.visible;
     sourceDotsDrawn+=frame.drawCount;
     if(frame.visible)sourceDotsVisible+=frame.drawCount;
   }
   let sourceInspectionDotsVisible=0;
   if(selectedSourceDots.current){
     const opacity=sourceCadInspectionDotOpacity(
       inspecting,reducedMotion);
     selectedSourceDots.current.points.material.opacity=opacity;
     selectedSourceDots.current.points.visible=opacity>.005;
     if(opacity>.005)
       sourceInspectionDotsVisible=selectedSourceDots.current.sampleCount;
   }
   // DEV-only source viewer QA: instrument the actual GPU draw ranges on the
   // WebGL canvas, not DOM labels or theoretical source asset counts.
   // No React state update, source buffer modification or extra render pass.
   const auditCanvas=gl.domElement;
   const counts=[
     ['pedsModelBDrawnCadDots',sourceDotsDrawn],
     ['pedsModelBVisibleCadDots',sourceDotsVisible],
     ['pedsModelBInspectionCadDots',sourceInspectionDotsVisible],
   ] as const;
   for(const [key,count] of counts){
     const serialized=String(count);
     if(auditCanvas.dataset[key]!==serialized)
       auditCanvas.dataset[key]=serialized;
   }
   if(visual){
     for(const item of visual.meshes){
       const authoredFraction=item.kind==='p28'?
         originalPartAssemblyAtStation(item.name,p,item.station):
         rearSourceAssembly(p,item.kind==='rear-toe'?'toe':'joint',item.name);
       const nativeFraction=accessibleAssemblyFraction(
         authoredFraction,reducedMotion);
       const selected=selectedVisual===item;
       const fraction=cadInspectionAssemblyFraction(
         nativeFraction,inspecting,selected);
       item.target.position.copy(item.originalPosition)
         .addScaledVector(item.offset,1-fraction);
       if(item.spin)applyVisualScrewSpin(item.spin,fraction,1.5);
       // Focus does not create replacement parts: cloned original CAD
       // materials for nonselected neighbours are merely transparent.
       const appearance=cadInspectionVisualFrame(
         fraction,inspecting,selected);
       for(let index=0;index<item.materials.length;index++){
         const material=item.materials[index];
         const layer=sourceCadXrayRenderLayer(inspecting,selected,
           item.originalDepthTests[index],item.originalRenderOrder);
         material.opacity=appearance.opacity;
         material.depthWrite=appearance.depthWrite;
         material.depthTest=layer.depthTest;
         // Source overlays only when THIS authentic CAD mesh is inspected.
         // Normal timeline immediately restores the authored draw queue.
         item.mesh.renderOrder=layer.renderOrder;
       }
       item.mesh.visible=appearance.visible;
     }
   }
   // Do not publish an X-ray PASS merely because the requested original
   // CAD part exists: the actual renderer must have applied its late draw
   // order and disabled depth testing on every viewer-owned material.
   const xrayRendered=Boolean(selectedVisual&&selectedPart&&
     sourceCadXrayFrameVerified(
       selectedVisual.mesh.visible,selectedVisual.mesh.renderOrder,
       selectedVisual.materials));
   const renderedPart=xrayRendered?selectedPart:null;
   const renderedKey=renderedPart?
     [renderedPart.origin,renderedPart.wheelStation,renderedPart.partId]
       .join('|'):'';
   if(lastReportedXray.current!==renderedKey){
     lastReportedXray.current=renderedKey;
     onXrayRenderVerified(renderedPart);
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
   // Focus the selected native CAD geometry at ANY scroll chapter.
   // The old p>.24 condition left early-source selections unframed while
   // the page incorrectly indicated successful X-ray inspection.
   if(selectedVisual){
     try{
       const bound=sourceMeshWorldFocusBounds(selectedVisual.mesh);
       const hardware=selectedVisual.kind==='p28'&&
         classifyP28Part(selectedVisual.name)==='hardware';
       cameraTarget.set(...bound.center);
       distance=sourceCadFocusDistance(bound.size,aspect,35,hardware);
       orbit=.14;
     }catch{
       // Invalid original source geometry cannot supply a fake focus target.
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
