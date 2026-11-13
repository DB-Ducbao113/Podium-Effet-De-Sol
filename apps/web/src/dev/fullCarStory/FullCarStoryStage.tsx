import {useEffect,useMemo,useState} from 'react';
import {Canvas,useThree} from '@react-three/fiber';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'meshoptimizer';
import * as THREE from 'three';
import type {CadSource} from '../cadFirstScroll/cadSource';
import {presentationForP28Part,classifyP28Part} from '../assemblyPreview/cadPresentation';
import {probeOriginalGeometry,type SourceGeometryProbe} from '../assemblyPreview/geometryProbe';
import type {OwnerMeasuredFit} from '../assemblyPreview/ownerMeasuredFit';
import {STORY_CHAPTERS,storyAtProgress,type StoryChapter} from './storyChapters';

type Props={
  source:CadSource|null;
  measuredFit:OwnerMeasuredFit|null;
  progress:number;
  onBodyProbe:(probe:SourceGeometryProbe)=>void;
  onCornerProbe:(probe:SourceGeometryProbe)=>void;
  onError:(message:string)=>void;
  onBodyReady:()=>void;
};
const disposeTree=(root:THREE.Object3D)=>{
  const geometries=new Set<THREE.BufferGeometry>();
  const materials=new Set<THREE.Material>();
  const textures=new Set<THREE.Texture>();
  root.traverse(o=>{
    if(!(o instanceof THREE.Mesh))return;
    geometries.add(o.geometry);
    for(const m of Array.isArray(o.material)?o.material:[o.material]){
      materials.add(m);
      Object.values(m).forEach(v=>{if(v instanceof THREE.Texture)textures.add(v);});
    }
  });
  geometries.forEach(g=>g.dispose());
  materials.forEach(m=>m.dispose());
  textures.forEach(t=>t.dispose());
};
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;

/**
 * Camera depends only on the normalized scroll value and current decoded
 * source bounds. No guessed chassis hardpoints or camera-history drift.
 */
function CameraRig({bounds,progress}:{
  bounds:THREE.Box3|null;progress:number;
}){
  const {camera,invalidate,size}=useThree();
  useEffect(()=>{
    if(!bounds)return;
    const {index,nextIndex,blend}=storyAtProgress(progress);
    const a:StoryChapter=STORY_CHAPTERS[index],b:StoryChapter=STORY_CHAPTERS[nextIndex];
    const center=bounds.getCenter(new THREE.Vector3());
    const dims=bounds.getSize(new THREE.Vector3());
    const focal=new THREE.Vector3(
      center.x+dims.x*lerp(a.focus[0],b.focus[0],blend),
      center.y+dims.y*lerp(a.focus[1],b.focus[1],blend),
      center.z+dims.z*lerp(a.focus[2],b.focus[2],blend),
    );
    const azimuth=lerp(a.azimuth,b.azimuth,blend);
    const elevation=lerp(a.elevation,b.elevation,blend);
    const aspect=Math.max(.45,size.width/Math.max(1,size.height));
    const viewportCompensation=aspect<.8?1.35:1;
    const radius=Math.max(.5,dims.length()*lerp(a.distance,b.distance,blend)*viewportCompensation);
    const orbit=new THREE.Vector3(
      Math.cos(azimuth)*Math.cos(elevation),
      Math.sin(elevation),
      Math.sin(azimuth)*Math.cos(elevation)
    );
    camera.position.copy(focal).addScaledVector(orbit,radius);
    camera.lookAt(focal);
    if(camera instanceof THREE.PerspectiveCamera||camera instanceof THREE.OrthographicCamera){
      // Rendering camera is mutable by Three.js contract after React commit.
      // eslint-disable-next-line react-hooks/immutability
      camera.near=Math.max(.001,radius/1000);
      // eslint-disable-next-line react-hooks/immutability
      camera.far=Math.max(100,radius*100);
      camera.updateProjectionMatrix();
    }
    invalidate();
  },[bounds,progress,camera,invalidate,size.width,size.height]);
  return null;
}
function SourceAssembly({model,progress,fit}:{
  model:THREE.Group;progress:number;fit:OwnerMeasuredFit;
}){
  const {invalidate}=useThree();
  const state=storyAtProgress(progress);
  const chapter=STORY_CHAPTERS[state.index];
  const location=useMemo(()=>{
    return fit.frontPositiveZCenterM.map((x,i)=>x-fit.originalP28WheelCenterM[i]) as [number,number,number];
  },[fit]);
  const restPositions=useMemo(()=>{
    const originals=new Map<THREE.Mesh,THREE.Vector3>();
    model.traverse(object=>{
      if(object instanceof THREE.Mesh)originals.set(object,object.position.clone());
    });
    return originals;
  },[model]);
  // Only clone materials when the semantic focus CHANGES, never on every
  // scroll tick. 59 material copies per pointer/scroll frame caused GC jank.
  useEffect(()=>{
    const originals=new Map<THREE.Mesh,THREE.Material|THREE.Material[]>();
    const clones:THREE.Material[]=[];
    model.traverse(object=>{
      if(!(object instanceof THREE.Mesh))return;
      const type=classifyP28Part(object.name);
      const target=chapter.partSystem;
      const visibleSystem=target==='all'||
        (target==='wheel'&&['tyre','rim','hub','hardware'].includes(type))||
        (target==='brake'&&['carbon-brake','caliper','friction-pad','hub'].includes(type))||
        (target==='suspension'&&['suspension','upright'].includes(type))||
        (target==='hardware'&&['hardware','suspension','upright'].includes(type));
      const dimmed=chapter.coverage==='front-corner'&&!visibleSystem;
      originals.set(object,object.material);
      const mats=Array.isArray(object.material)?object.material:[object.material];
      const updated=mats.map(m=>{
        const copy=m.clone();clones.push(copy);
        copy.transparent=m.transparent||dimmed;
        copy.opacity=dimmed ? .13 : m.opacity;
        copy.depthWrite=!dimmed&&m.depthWrite;
        return copy;
      });
      object.material=Array.isArray(object.material)?updated:updated[0];
    });
    invalidate();
    return ()=>{
      originals.forEach((prior,mesh)=>{mesh.material=prior;});
      clones.forEach(m=>m.dispose());
      invalidate();
    };
  },[model,chapter.partSystem,chapter.coverage,invalidate]);
  useEffect(()=>{
    const strength=state.index===16?Math.sin(Math.PI*state.blend):0;
    restPositions.forEach((original,mesh)=>{
      mesh.position.copy(original);
      if(strength>0){
        const offset=presentationForP28Part(mesh.name,'exploded').offsetM;
        mesh.position.addScaledVector(new THREE.Vector3(...offset),strength);
      }
    });
    invalidate();
    return ()=>{
      restPositions.forEach((original,mesh)=>mesh.position.copy(original));
      invalidate();
    };
  },[restPositions,state.index,state.blend,invalidate]);
  return <group position={location} scale={1}><primitive object={model}/></group>;
}
function Scene({source,measuredFit,progress,onBodyProbe,onCornerProbe,onError,onBodyReady}:Props){
  const {invalidate}=useThree();
  const [body,setBody]=useState<THREE.Group|null>(null);
  const [corner,setCorner]=useState<THREE.Group|null>(null);
  useEffect(()=>{
    let live=true,instance:THREE.Group|null=null;
    const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    loader.load(import.meta.env.BASE_URL+'models/model-b-eds-optimized-v1.glb',gltf=>{
      instance=gltf.scene;
      if(!live){disposeTree(instance);return;}
      try{
        const profile=probeOriginalGeometry(instance,'model-b');
        onBodyProbe(profile);setBody(instance);onBodyReady();invalidate();
      }catch(e){onError('Model B geometry: '+String(e));disposeTree(instance);instance=null;}
    },undefined,e=>{if(live)onError('Model B load failed: '+String(e));});
    return()=>{live=false;setBody(null);if(instance)disposeTree(instance);};
  },[onBodyProbe,onBodyReady,onError,invalidate]);
  useEffect(()=>{
    let live=true,instance:THREE.Group|null=null;
    setCorner(null);
    if(!source)return;
    const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    void MeshoptDecoder.ready.then(()=>loader.parseAsync(source.glbBytes.slice(0),'')).then(gltf=>{
      instance=gltf.scene;
      if(!live){disposeTree(instance);return;}
      let meshCount=0;
      const names=new Set<string>();
      instance.traverse(o=>{if(o instanceof THREE.Mesh){meshCount++;names.add(o.name);}});
      if(source.scope!=='front-corner'||source.parts.length!==59||meshCount!==59||
         names.size!==59||source.parts.some(p=>!names.has(p.node))){
        onError('P2.8 source identity mismatch: exactly 59 named CAD meshes required');
        disposeTree(instance);instance=null;return;
      }
      try{
        onCornerProbe(probeOriginalGeometry(instance,'p28'));setCorner(instance);invalidate();
      }catch(e){onError('P2.8 source geometry: '+String(e));disposeTree(instance);instance=null;}
    }).catch(e=>{if(live)onError('P2.8 GLB parse failed: '+String(e));});
    return()=>{live=false;setCorner(null);if(instance)disposeTree(instance);};
  },[source,onCornerProbe,onError,invalidate]);
  const displayScale=measuredFit?.normalizedShellScale??1;
  const bounds=useMemo(()=>{
    if(!body)return null;
    const box=new THREE.Box3().setFromObject(body);
    box.min.multiplyScalar(displayScale);
    box.max.multiplyScalar(displayScale);
    return box;
  },[body,displayScale]);
  const chapter=STORY_CHAPTERS[storyAtProgress(progress).index];
  const light=chapter.light;
  return <>
    <color attach="background" args={[light?'#e8edf1':'#0b1019']}/>
    <ambientLight intensity={light?1.8:1.3}/>
    <hemisphereLight args={['#f3f7ff','#293349',2]}/>
    <directionalLight intensity={light?2.7:3.3} color="#f5f7ff" position={[5,9,6]}/>
    <directionalLight intensity={2.1} color="#db895a" position={[-5,3,-5]}/>
    {body&&<group scale={displayScale}><primitive object={body}/></group>}
    {corner&&measuredFit&&<SourceAssembly model={corner} progress={progress} fit={measuredFit}/>}
    <CameraRig bounds={bounds} progress={progress}/>
  </>;
}
export default function FullCarStoryStage(props:Props){
  return <Canvas
    aria-label="Model B full-car visual walkthrough, optional source-verified P2.8 front corner"
    frameloop="demand"
    dpr={[1,1.5]}
    camera={{fov:38,near:.001,far:500,position:[6,3,8]}}
    gl={{antialias:true,powerPreference:'high-performance'}}
    onCreated={({gl})=>{
      gl.outputColorSpace=THREE.SRGBColorSpace;
      gl.toneMapping=THREE.ACESFilmicToneMapping;
      gl.toneMappingExposure=1.08;
    }}
  ><Scene {...props}/></Canvas>;
}
