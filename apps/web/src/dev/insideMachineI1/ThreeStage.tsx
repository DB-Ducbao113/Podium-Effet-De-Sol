import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MeshoptDecoder } from 'meshoptimizer';
import { POSTER_URL } from './assetPaths';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { AssemblyManifest, Lang, LifecycleEvent, QualityProfile, RuntimeMetrics, StageEvidence } from './types';
import { assemblyDetachmentAt, componentDetachmentAt, offstageProgressAt, offstageSpecFor, type CameraPose, type OffstageDirection } from './storyboard';
import { installResourceProbe, noteRender, setResourcePhase, trackGeometry, trackMaterial, trackModelGeometries } from './resourceProbe';

const PROFILE = { HIGH: { dpr: [1, 1.5] as [number, number], shadows: true, aa: true }, BALANCED: { dpr: [1, 1.35] as [number, number], shadows: true, aa: true }, PERFORMANCE: { dpr: [.8, .8] as [number, number], shadows: false, aa: false } };
const DIAGNOSTIC_MODE=import.meta.env.DEV?new URLSearchParams(location.search).get('f3Mode'):null;
const L1_FRAMELOOP=import.meta.env.DEV?new URLSearchParams(location.search).get('l1FrameLoop'):null;
const focusMaterialByBase = new WeakMap<THREE.Material, THREE.Material>();
const baseMaterialsByMesh = new WeakMap<THREE.Mesh, THREE.Material | THREE.Material[]>();
const convert = ([x, y, z]: [number, number, number]) => new THREE.Vector3(x, z, -y);
const resolveNode=(root:THREE.Object3D,name:string)=>root.getObjectByName(name)??root.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(name));
const l1Mark=(name:string,detail?:Record<string,unknown>)=>{if(import.meta.env.DEV)(window as Window & {__ITM_L1_MARK__?:(name:string,detail?:Record<string,unknown>)=>void}).__ITM_L1_MARK__?.(name,detail);};
const MOBILE_FOCUS_BIAS:Record<string,number>={FRONT_LEFT_WHEEL:-.62,FRONT_WING:.58,LEFT_SIDEPOD:.42,COOLING_LEFT:.56,POWERTRAIN:.28};
const offstageDirection=(kind:OffstageDirection,right:THREE.Vector3,up:THREE.Vector3,back:THREE.Vector3)=>kind==='left'?right.clone().negate():kind==='right'?right.clone():kind==='up'?up.clone():kind==='depth-left'?back.clone().multiplyScalar(.72).addScaledVector(right,-.7).normalize():back.clone().multiplyScalar(.72).addScaledVector(right,.7).normalize();
const smooth01=(value:number)=>{const t=Math.min(1,Math.max(0,value));return t*t*(3-2*t);};
const FINALE_OFFSTAGE_DIRECTION=new THREE.Vector3(-8.5,4.83,-10.2).normalize();

function Metrics({ onMetrics,onSample }: { onMetrics: (metrics: RuntimeMetrics) => void;onSample:(time:number,ms:number)=>void }) {
  const { gl } = useThree(); const frames = useRef<number[]>([]); const last = useRef(0);
  useFrame((_, delta) => {
    l1Mark('r3f-frame-callback',{deltaMs:delta*1000});
    const ms = delta * 1000; if (ms > 0 && ms < 1000) {frames.current.push(ms);onSample(performance.now(),ms);} if (frames.current.length > 400) frames.current.shift();
    const now = performance.now(); if (now - last.current < 1000 || frames.current.length < 30) return; last.current = now;
    const values = [...frames.current].sort((a, b) => a - b); const p = (n: number) => values[Math.min(values.length - 1, Math.floor(values.length * n))];
    onMetrics({ loadMs: 0, fps: 1000 / p(.5), onePercentLowFps: 1000 / p(.99), p95FrameMs: p(.95), drawCalls: gl.info.render.calls, triangles: gl.info.render.triangles, geometries: gl.info.memory.geometries, textures: gl.info.memory.textures, samples: values.length });
  }); return null;
}

function ContextGuard({ onContextLost }: { onContextLost: (lost: boolean) => void }) {
  const { gl, invalidate } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => { event.preventDefault(); onContextLost(true); };
    const restored = () => { onContextLost(false); requestAnimationFrame(() => invalidate()); };
    canvas.addEventListener('webglcontextlost', lost);
    canvas.addEventListener('webglcontextrestored', restored);
    return () => { canvas.removeEventListener('webglcontextlost', lost); canvas.removeEventListener('webglcontextrestored', restored); };
  }, [gl, invalidate, onContextLost]);
  return null;
}

function Model({ model, manifest, scrollProgress, cutaway, selectedAssembly, selectedComponent, isolation, isolationScope, ghost, storyFocusStrength, cameraPose }: { model: THREE.Group; manifest: AssemblyManifest; scrollProgress: number; cutaway: boolean; selectedAssembly: string; selectedComponent: string; isolation: boolean; isolationScope: 'assembly'|'component'; ghost: boolean; storyFocusStrength:number;cameraPose:CameraPose }) {
  const {invalidate,size}=useThree();
  const baselines = useRef(new Map<string, { p: THREE.Vector3; q: THREE.Quaternion; s: THREE.Vector3 }>());
  const nodes = useRef(new Map<string,THREE.Object3D>());
  const offsets = useRef(new Map<string,THREE.Vector3>());
  const localCounts = useRef(new Map<string,number>());
  const materials = useRef(new WeakMap<THREE.Mesh, THREE.Material | THREE.Material[]>());
  const materialStates=useRef(new WeakMap<THREE.Material,{opacity:number;transparent:boolean;depthWrite:boolean}>());
  const ghostMaterial = useMemo(() => new THREE.MeshBasicMaterial({color:'#9ba9b3',transparent:true,opacity:.075,depthWrite:false}), []);
  useEffect(() => () => ghostMaterial.dispose(), [ghostMaterial]);
  useEffect(() => {
    baselines.current.clear();nodes.current.clear();offsets.current.clear();localCounts.current.clear();
    for (const item of [...manifest.assemblies, ...manifest.components]) { const node = resolveNode(model,item.node); if (node) {nodes.current.set(item.node,node);baselines.current.set(item.node, { p: node.position.clone(), q: node.quaternion.clone(), s: node.scale.clone() });offsets.current.set(item.node,convert('globalExplodedOffset' in item?item.globalExplodedOffset:item.explodedOffset));} }
    for (const item of manifest.components) localCounts.current.set(item.parentAssemblyId,(localCounts.current.get(item.parentAssemblyId)??0)+1);
    const skin=model.getObjectByName('CHASSIS_CORE');if(skin)nodes.current.set('CHASSIS_CORE',skin);
  }, [manifest, model]);
  const offstageOffset=useCallback((node:THREE.Object3D,id:string)=>{
    const spec=offstageSpecFor(id);const phase=offstageProgressAt(scrollProgress,id);if(!spec||phase<=0||!node.parent)return null;
    const back=scrollProgress>=.87?FINALE_OFFSTAGE_DIRECTION.clone():new THREE.Vector3(...cameraPose.direction).normalize();
    const up=new THREE.Vector3(0,1,0);const right=new THREE.Vector3().crossVectors(up,back).normalize();
    const direction=offstageDirection(spec.direction,right,up,back);
    const aspect=Math.max(.4,size.width/Math.max(1,size.height));
    const systemReveal=smooth01((scrollProgress-.81)/.035);
    const viewportDistance=cameraPose.distance*(aspect<.8?1.7:1.35)+5;
    const coordinatedDistance=THREE.MathUtils.lerp(viewportDistance,1.8,systemReveal);
    const distance=coordinatedDistance*spec.distance;
    const world=direction.multiplyScalar(distance*phase).addScaledVector(up,distance*spec.arc*4*phase*(1-phase));
    node.parent.updateWorldMatrix(true,false);
    return world.applyMatrix3(new THREE.Matrix3().setFromMatrix4(node.parent.matrixWorld).invert());
  },[cameraPose.direction,cameraPose.distance,scrollProgress,size.height,size.width]);
  const applyProgress = useCallback((progress: number) => {
    l1Mark('scene-transform-start',{scrollProgress:progress});
    manifest.assemblies.forEach((item) => { const node = nodes.current.get(item.node); const base = baselines.current.get(item.node); const offset=offsets.current.get(item.node); if (!node || !base||!offset) return; const phase = assemblyDetachmentAt(progress,item.id); node.position.copy(base.p).addScaledVector(offset, phase);const stageOffset=offstageOffset(node,item.id);if(stageOffset)node.position.add(stageOffset); node.quaternion.copy(base.q); node.scale.copy(base.s); });
    const assemblyIds=new Set(manifest.assemblies.map(item=>item.id));
    for (const item of manifest.components) { const node = nodes.current.get(item.node); const base = baselines.current.get(item.node);const offset=offsets.current.get(item.node); if (!node || !base||!offset) continue; const phase=componentDetachmentAt(progress,item.parentAssemblyId,item.animationOrder,localCounts.current.get(item.parentAssemblyId)??1); node.position.copy(base.p).addScaledVector(offset, phase);if(!assemblyIds.has(item.parentAssemblyId)){const stageOffset=offstageOffset(node,item.parentAssemblyId);if(stageOffset)node.position.add(stageOffset);} node.quaternion.copy(base.q); if (item.explodedRotationEuler[1]) node.rotateZ(-item.explodedRotationEuler[1] * phase); node.scale.copy(base.s); }
    const sourceSkin = nodes.current.get('CHASSIS_CORE'); if (sourceSkin) sourceSkin.visible = !cutaway;
    l1Mark('scene-transform-applied',{scrollProgress:progress});
  }, [cutaway, manifest,offstageOffset]);
  useEffect(() => {
    applyProgress(scrollProgress);
    invalidate();
    l1Mark('r3f-invalidate-model',{scrollProgress});
  }, [applyProgress, invalidate, scrollProgress]);
  useEffect(() => {
    for (const item of manifest.components) resolveNode(model,item.node)?.traverse((object) => { if (!(object instanceof THREE.Mesh)) return; const list = Array.isArray(object.material) ? object.material : [object.material]; for (const material of list) if (material instanceof THREE.MeshStandardMaterial) { const active = item.id === selectedComponent; material.emissive.set(active ? '#7f0f20' : '#000'); material.emissiveIntensity = active ? .25 : 0; } });
  }, [manifest, model, selectedComponent]);
  useEffect(() => {
    const targetNodes = storyFocusStrength>0&&!isolation
      ? [...manifest.assemblies.filter(item=>item.id===selectedAssembly).map(item=>item.node),...manifest.components.filter(item=>item.id===selectedComponent||item.parentAssemblyId===selectedAssembly).map(item=>item.node)]
      : isolationScope === 'component'
      ? [manifest.components.find(item => item.id === selectedComponent)?.node]
      : [...manifest.assemblies.filter(item => item.id === selectedAssembly).map(item => item.node), ...manifest.components.filter(item => item.parentAssemblyId === selectedAssembly).map(item => item.node)];
    const targets = new Set(targetNodes.filter((name): name is string => Boolean(name)).map(name => resolveNode(model,name)).filter((object): object is THREE.Object3D => Boolean(object)));
    const belongs = (mesh: THREE.Object3D) => { let cursor: THREE.Object3D | null = mesh; while(cursor && cursor !== model) { if(targets.has(cursor)) return true; cursor=cursor.parent; } return false; };
    model.traverse(object => {
      if (!(object instanceof THREE.Mesh)) { object.visible = true; return; }
      if (!materials.current.has(object)) materials.current.set(object,object.material);
      const selected = belongs(object);
      const original=materials.current.get(object)!;
      for(const material of Array.isArray(original)?original:[original]){
        if(!materialStates.current.has(material))materialStates.current.set(material,{opacity:material.opacity,transparent:material.transparent,depthWrite:material.depthWrite});
        const base=materialStates.current.get(material)!;
        const focus=focusMaterialByBase.get(material);
        if(focus)focus.opacity=base.opacity*(1-storyFocusStrength);
      }
      const focused=storyFocusStrength>0&&!isolation&&!selected;
      const focusMaterials=(Array.isArray(original)?original:[original]).map(material=>focusMaterialByBase.get(material)??material);
      object.material = isolation&&ghost&&!selected ? ghostMaterial : focused&&DIAGNOSTIC_MODE!=='no-transparency' ? Array.isArray(original)?focusMaterials:focusMaterials[0] : original;
      object.visible = storyFocusStrength>.98&&!isolation ? selected : !isolation || selected || ghost;
    });
    const skin=model.getObjectByName('CHASSIS_CORE');
    if(skin && !isolation) skin.visible=!cutaway;
    invalidate();
  }, [model,manifest,selectedAssembly,selectedComponent,isolation,isolationScope,ghost,storyFocusStrength,cutaway,ghostMaterial,invalidate]);
  return <primitive object={model} />;
}

function AttachmentConnectors({ manifest, progress, cue }: { manifest: AssemblyManifest; progress: number; cue:boolean }) {
  const connectors=useMemo(()=>(manifest.reviewConnectors??[]).map(item=>({id:item.assemblyId,start:convert(item.from),offset:convert(item.offset)})),[manifest]);
  const geometry=useMemo(()=>{const result=new THREE.BufferGeometry();result.setAttribute('position',new THREE.BufferAttribute(new Float32Array(connectors.length*6),3));result.boundingSphere=new THREE.Sphere(new THREE.Vector3(),100);trackGeometry(result,'attachment-lines','connector');return result;},[connectors]);
  const markerGeometry=useMemo(()=>{const result=new THREE.BufferGeometry();result.setAttribute('position',new THREE.Float32BufferAttribute((manifest.reviewConnectors??[]).flatMap(item=>convert(item.from).toArray()),3));trackGeometry(result,'attachment-markers','connector');return result;},[manifest]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => markerGeometry.dispose(), [markerGeometry]);
  useEffect(() => {
    const attribute=geometry.getAttribute('position') as THREE.BufferAttribute;
    const values=attribute.array as Float32Array;
    connectors.forEach((connector, index) => {
      const phase=assemblyDetachmentAt(progress,connector.id);
      const {start,offset}=connector;
      values.set([start.x,start.y,start.z,start.x+offset.x*phase,start.y+offset.y*phase,start.z+offset.z*phase],index*6);
    });
    attribute.needsUpdate=true;
  }, [geometry,connectors,progress]);
  return <><points geometry={markerGeometry} visible={cue||(progress>.025&&progress<.98)}><pointsMaterial color="#e34055" size={8} sizeAttenuation={false} depthTest={false}/></points><lineSegments geometry={geometry} visible={progress > .08&&progress<.98}>
    <lineBasicMaterial color="#e04a5d" transparent opacity={Math.min(.72, progress * 1.2)} depthTest={false} />
  </lineSegments></>;
}

function MechanicalConnectors({ manifest, selectedAssembly, progress }: { manifest: AssemblyManifest; selectedAssembly: string; progress: number }) {
  const parts=useMemo(()=>manifest.components.filter(item=>item.parentAssemblyId===selectedAssembly&&(item.id.includes('HUB')||item.id.includes('BRAKE')||item.id.includes('RADIATOR')||item.id.includes('COOLANT')||item.id.includes('ENGINE')||item.id.includes('GEARBOX'))).map(item=>({order:item.animationOrder,start:convert(item.pivotWorld),offset:convert(item.explodedOffset)})),[manifest,selectedAssembly]);
  const geometry=useMemo(()=>{const result=new THREE.BufferGeometry();result.setAttribute('position',new THREE.BufferAttribute(new Float32Array(parts.length*6),3));result.boundingSphere=new THREE.Sphere(new THREE.Vector3(),100);trackGeometry(result,`mechanical-lines:${selectedAssembly}`,'connector');return result;},[parts,selectedAssembly]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => {
    const attribute=geometry.getAttribute('position') as THREE.BufferAttribute;
    const values=attribute.array as Float32Array;
    parts.forEach((item, index) => {
      const phase=componentDetachmentAt(progress,selectedAssembly,item.order,parts.length);
      const {start,offset}=item;
      values.set([start.x,start.y,start.z,start.x+offset.x*phase,start.y+offset.y*phase,start.z+offset.z*phase],index*6);
    });
    attribute.needsUpdate=true;
   }, [geometry,parts,progress,selectedAssembly]);
  return <lineSegments geometry={geometry} visible={progress > .01&&progress<.98}>
    <lineBasicMaterial color="#d3a66b" transparent opacity={Math.min(.75, progress)} depthTest={false} />
  </lineSegments>;
}

function assemblyNodeNames(manifest:AssemblyManifest,assemblyId:string){
  const assembly=[...manifest.assemblies,...(manifest.internalSystems??[])].find(item=>item.id===assemblyId);
  const rootNode=assembly&&'node' in assembly?assembly.node:undefined;
  const names=[rootNode,...(assembly?.componentIds??[]).map(id=>manifest.components.find(component=>component.id===id)?.node)].filter((name):name is string=>Boolean(name));
  if(assemblyId==='COOLING_LEFT')names.push(...manifest.components.filter(component=>component.id==='LEFT_SIDEPOD.EXTERIOR_SHELL').map(component=>component.node));
  if(assemblyId==='COOLING_RIGHT')names.push(...manifest.components.filter(component=>component.id==='RIGHT_SIDEPOD.EXTERIOR_SHELL').map(component=>component.node));
  return [...new Set(names)];
}

function sphereForNodes(model:THREE.Group,names:string[]){
  model.updateMatrixWorld(true);
  const box=new THREE.Box3();
  let found=false;
  for(const name of names){const node=resolveNode(model,name);if(!node)continue;box.union(new THREE.Box3().setFromObject(node));found=true;}
  return found?box.getBoundingSphere(new THREE.Sphere()):null;
}

function Camera({model,pose,mode,controls,inspectFocusNodes,storyFocusNodes,selectedAssembly,scrollProgress}:{model:THREE.Group;pose:CameraPose;mode:'story'|'inspect';controls:React.RefObject<OrbitControlsImpl|null>;inspectFocusNodes:string[];storyFocusNodes:string[];selectedAssembly:string;scrollProgress:number}){
   const {camera:cameraSignal,get,size,invalidate}=useThree();
  const baselineSphere=useMemo(()=>new THREE.Box3().setFromObject(model).getBoundingSphere(new THREE.Sphere()),[model]);
  const destination=useRef(new THREE.Vector3());
  const destinationTarget=useRef(new THREE.Vector3());
   useEffect(()=>{
     const camera=get().camera;
    const apply=()=>{camera.position.copy(destination.current);camera.lookAt(destinationTarget.current);camera.userData.itmTarget=destinationTarget.current.toArray();if(controls.current){controls.current.target.copy(destinationTarget.current);controls.current.update();}l1Mark('camera-transform-applied',{scrollProgress,mode});invalidate();};
    if(mode==='inspect'&&!inspectFocusNodes.length)return;
    if(mode==='inspect'&&inspectFocusNodes.length){
      const sphere=sphereForNodes(model,inspectFocusNodes);
      if(!sphere)return;
      const direction=camera.position.clone().sub(controls.current?.target??new THREE.Vector3()).normalize();
      destinationTarget.current.copy(sphere.center);
      const vfov=THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov);
      const aspect=size.width/Math.max(1,size.height);
      const hfov=2*Math.atan(Math.tan(vfov/2)*aspect);
      const fitDistance=sphere.radius/Math.sin(Math.min(vfov,hfov)/2)*1.48;
      destinationTarget.current.copy(sphere.center);
      destination.current.copy(destinationTarget.current).addScaledVector(direction,Math.max(.9,Math.min(8,fitDistance)));
      apply();return;
    }
    const direction=new THREE.Vector3(...pose.direction).normalize();
    destinationTarget.current.set(...pose.target);
    if(pose.fit&&size.width<600)destinationTarget.current.copy(baselineSphere.center);
    if(pose.focusAssembly){
      if(size.width<600){const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),direction).normalize();destinationTarget.current.addScaledVector(right,MOBILE_FOCUS_BIAS[selectedAssembly]??0);}
      const focusDistance=pose.distance*(size.width<600?2.3:size.width<900?1.5:1);
      destination.current.copy(destinationTarget.current).addScaledVector(direction,focusDistance);
      l1Mark('r3f-invalidate-camera',{scrollProgress,focus:'story-pose'});apply();return;
    }
    if(size.width>=600&&size.width<900&&pose.fit)destinationTarget.current.y-=1.05;
    let distance=pose.distance;
    if(pose.fit&&size.width<900&&scrollProgress>=.73&&scrollProgress<.98){
      const settle=THREE.MathUtils.smoothstep(scrollProgress,.9,.98);
      const portraitExpansion=size.width<600?1.6:.75;
      distance*=1+portraitExpansion*(1-settle);
    }
    if(pose.fit){
      const aspect=Math.max(.35,size.width/Math.max(1,size.height));
      const vertical=THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov);
      const horizontal=2*Math.atan(Math.tan(vertical/2)*aspect);
      const radius=baselineSphere.radius;
      distance=Math.max(distance,radius/Math.sin(Math.min(vertical,horizontal)/2)*(size.width<600?1.03:size.width<900?1.08:size.width<1100?.9:.8));
    }
    destination.current.copy(destinationTarget.current).addScaledVector(direction,distance);
    l1Mark('r3f-invalidate-camera',{scrollProgress});apply();
   },[cameraSignal,get,controls,model,mode,pose,size.height,size.width,invalidate,inspectFocusNodes,storyFocusNodes,selectedAssembly,baselineSphere,scrollProgress]);
  return null;
}

function Scene(props: { model: THREE.Group; manifest: AssemblyManifest; scrollProgress: number; cutaway: boolean; selectedAssembly: string; selectedComponent: string; isolation:boolean; isolationScope:'assembly'|'component';ghost:boolean;storyFocusStrength:number;attachmentCue:boolean;cameraPose:CameraPose;cameraMode:'story'|'inspect';lightIntensity:number;profile: QualityProfile;onMetrics: (m: RuntimeMetrics) => void;onRenderSample:(time:number,ms:number)=>void;onContextLost: (lost: boolean) => void;onUserOrbit:()=>void }) {
  const controls = useRef<OrbitControlsImpl>(null);
  const storyFocusNodes=useMemo(()=>{const selected=props.manifest.components.find(item=>item.id===props.selectedComponent)?.node;return props.storyFocusStrength>0&&selected?[selected]:assemblyNodeNames(props.manifest,props.selectedAssembly);},[props.manifest,props.selectedAssembly,props.selectedComponent,props.storyFocusStrength]);
  const inspectFocusNodes=useMemo(()=>!props.isolation?[]:props.isolationScope==='component'?[props.manifest.components.find(item=>item.id===props.selectedComponent)?.node].filter((name):name is string=>Boolean(name)):assemblyNodeNames(props.manifest,props.selectedAssembly),[props.isolation,props.isolationScope,props.manifest,props.selectedAssembly,props.selectedComponent]);
  return <><color attach="background" args={['#08090b']} /><ambientLight intensity={.38*props.lightIntensity} /><hemisphereLight args={['#e5edf5', '#0b0d11', 1.16*props.lightIntensity]} /><directionalLight color="#fff3e8" intensity={3.15*props.lightIntensity} position={[4.5, 7, 4]} castShadow={PROFILE[props.profile].shadows} /><directionalLight color="#d32642" intensity={(props.isolation?.18:.78)*props.lightIntensity} position={[0, 2.4, -6]} /><directionalLight color="#bfd8ef" intensity={1.28*props.lightIntensity} position={[-4, 4.5, -2.5]} /><Model {...props} />{DIAGNOSTIC_MODE!=='no-connectors'&&<><AttachmentConnectors manifest={props.manifest} progress={props.isolation||props.storyFocusStrength>0?0:props.scrollProgress} cue={props.attachmentCue&&!props.isolation}/><MechanicalConnectors manifest={props.manifest} selectedAssembly={props.selectedAssembly} progress={props.isolation?0:props.scrollProgress} /></>}<OrbitControls ref={controls} makeDefault enabled={props.cameraMode==='inspect'} minDistance={.7} maxDistance={30} enablePan={false} onStart={props.onUserOrbit} /><Camera model={props.model} pose={props.cameraPose} mode={props.cameraMode} controls={controls} inspectFocusNodes={inspectFocusNodes} storyFocusNodes={storyFocusNodes} selectedAssembly={props.selectedAssembly} scrollProgress={props.scrollProgress} /><Metrics onMetrics={props.onMetrics} onSample={props.onRenderSample} /><ContextGuard onContextLost={props.onContextLost} /></>;
}

function info(gl: THREE.WebGLRenderer): import('./types').RendererInfo { const c = gl.getContext(); const e = c.getExtension('WEBGL_debug_renderer_info'); const vendor = String(c.getParameter(c.VENDOR)); const renderer = String(c.getParameter(c.RENDERER)); const unmaskedVendor = e ? String(c.getParameter(e.UNMASKED_VENDOR_WEBGL)) : vendor; const unmaskedRenderer = e ? String(c.getParameter(e.UNMASKED_RENDERER_WEBGL)) : renderer; return { vendor, renderer, unmaskedVendor, unmaskedRenderer, hardwareAccelerated: !/swiftshader|software|llvmpipe/i.test(unmaskedRenderer) }; }

function disposeModel(model: THREE.Object3D, reason = 'model-dispose') {
  setResourcePhase(reason);
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry?.dispose();
    const original=baseMaterialsByMesh.get(object)??object.material;
    const materials = Array.isArray(original) ? original : [original];
    for (const material of materials) {
      focusMaterialByBase.get(material)?.dispose();
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) value.dispose();
      material.dispose();
    }
  });
  setResourcePhase('idle');
}

function prepareFocusVariants(render: (scene: THREE.Object3D, camera: THREE.Camera) => void, scene: THREE.Object3D, camera: THREE.Camera, model: THREE.Group) {
  const originals=new Map<THREE.Mesh,THREE.Material|THREE.Material[]>();
  const connectorVisibility=new Map<THREE.Object3D,boolean>();
  model.traverse(object=>{
    if(!(object instanceof THREE.Mesh))return;
    originals.set(object,object.material);
    const list=Array.isArray(object.material)?object.material:[object.material];
    const variants=list.map(material=>focusMaterialByBase.get(material)??material);
    object.material=Array.isArray(object.material)?variants:variants[0];
  });
  scene.traverse(object=>{
    if(!(object instanceof THREE.Points||object instanceof THREE.LineSegments))return;
    connectorVisibility.set(object,object.visible);
    object.visible=true;
  });
  const started=performance.now();
  setResourcePhase('focus-first-render-preparation');
  try{render(scene,camera);}
  finally{
    for(const [mesh,original] of originals)mesh.material=original;
    for(const [object,visible] of connectorVisibility)object.visible=visible;
    setResourcePhase('idle');
    render(scene,camera);
  }
  return performance.now()-started;
}

export default function ThreeStage(props: { modelUrl: string; manifest: AssemblyManifest; scrollProgress:number;cutaway: boolean; selectedAssembly: string; selectedComponent: string;isolation:boolean;isolationScope:'assembly'|'component';ghost:boolean;storyFocusStrength:number;attachmentCue:boolean;cameraPose:CameraPose;cameraMode:'story'|'inspect';lightIntensity:number; profile: QualityProfile;lang:Lang;restarting:boolean;onReady: (ms: number) => void; onMetrics: (m: RuntimeMetrics) => void; onEvidence: (e: StageEvidence) => void; onContextLost: (lost: boolean) => void; onProfileDisplayed: (profile: QualityProfile) => void; onLoadError: () => void; onRetryStart: () => void;onUserOrbit:()=>void }) {
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [visualReady, setVisualReady] = useState(false);
  const needsFocusPreparation = useRef(false);
  const [error, setError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [retryInFlight, setRetryInFlight] = useState(false);
  const retryPending = useRef(false);
  const modelRef = useRef<THREE.Group | null>(null);
  const committedModel = useRef<THREE.Group | null>(null);
  const activeController = useRef<AbortController | null>(null);
  const loadSequence = useRef(0);
  const lifecycle = useRef<LifecycleEvent[]>([]);
  const displayedProfile = useRef<QualityProfile | null>(null);
  const requestedProfile = useRef(props.profile);
  const loading = useRef(false);
  const stageRenders = useRef(0);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraPoseRef = useRef(props.cameraPose);
  const selectionRef = useRef({ assembly: props.selectedAssembly, component: props.selectedComponent });
  const rendererInfo = useRef<import('./types').RendererInfo>({ vendor: '', renderer: '', unmaskedVendor: '', unmaskedRenderer: '', hardwareAccelerated: false });
  const renderSamples=useRef<{time:number;ms:number}[]>([]);
  const screenBounds = useRef({ minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0, viewportWidth: 0, viewportHeight: 0, clipped: true });
  const canvasStats = useRef({ width: 0, height: 0, dpr: 1, shadowEnabled: PROFILE[props.profile].shadows });
  const manifestRef = useRef(props.manifest);
  const projectBounds=(nodes:THREE.Object3D[])=>{
    const camera=cameraRef.current;const gl=rendererRef.current;if(!camera||!gl||nodes.length===0)return {...screenBounds.current,outside:false};
    const box=new THREE.Box3();for(const node of nodes)box.union(new THREE.Box3().setFromObject(node));if(box.isEmpty())return {...screenBounds.current,outside:false};
    const points=[];for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])points.push(new THREE.Vector3(x,y,z).project(camera));
    const viewportWidth=gl.domElement.clientWidth,viewportHeight=gl.domElement.clientHeight;
    const xs=points.map(point=>(point.x+1)*.5*viewportWidth),ys=points.map(point=>(1-point.y)*.5*viewportHeight);
    const minX=Math.min(...xs),minY=Math.min(...ys),maxX=Math.max(...xs),maxY=Math.max(...ys);
    const frustum=new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
    return {minX,minY,maxX,maxY,width:maxX-minX,height:maxY-minY,viewportWidth,viewportHeight,clipped:minX<2||minY<2||maxX>viewportWidth-2||maxY>viewportHeight-2,outside:!frustum.intersectsBox(box)};
  };
  const [evidence] = useState<StageEvidence>(() => ({
    getTransforms: () => {
      const current = modelRef.current;
      if (!current) return {};
      return Object.fromEntries([...manifestRef.current.assemblies, ...manifestRef.current.components].map((item) => {
        const node = resolveNode(current,item.node);
        const values = [...(node?.position.toArray() ?? []), ...(node?.quaternion.toArray() ?? []), ...(node?.scale.toArray() ?? [])];
        return [item.id, { position: node?.position.toArray() ?? [], quaternion: node?.quaternion.toArray() ?? [], scale: node?.scale.toArray() ?? [], finite: values.every(Number.isFinite) }];
      }));
    },
    getRendererInfo: () => rendererInfo.current,
    getScreenBounds: (scope='model') => {
      const current = modelRef.current;
      const camera = cameraRef.current;
      const gl = rendererRef.current;
      if (!current || !camera || !gl) return screenBounds.current;
      let targetNodes:THREE.Object3D[]=[];
      if(scope==='model')targetNodes=[current];
      else if(scope==='active-component'){
        const nodeName=manifestRef.current.components.find(item=>item.id===selectionRef.current.component)?.node;
        const node=nodeName?resolveNode(current,nodeName):null;
        if(node)targetNodes=[node];
      }else{
        targetNodes=assemblyNodeNames(manifestRef.current,selectionRef.current.assembly).map(name=>resolveNode(current,name)).filter((node):node is THREE.Object3D=>Boolean(node));
      }
      const {outside:_,...bounds}=projectBounds(targetNodes);
      if(scope==='model')screenBounds.current=bounds;
      return bounds;
    },
    getSemanticBounds:(id:string)=>{
      const current=modelRef.current;if(!current)return {...screenBounds.current,outside:false};
      const assembly=[...manifestRef.current.assemblies,...(manifestRef.current.internalSystems??[])].find(item=>item.id===id);
      const names=assembly?assemblyNodeNames(manifestRef.current,id):[manifestRef.current.components.find(item=>item.id===id)?.node].filter((name):name is string=>Boolean(name));
      return projectBounds(names.map(name=>resolveNode(current,name)).filter((node):node is THREE.Object3D=>Boolean(node)));
    },
    getLifecycle: () => [...lifecycle.current],
    getStageState: () => ({ displayedProfile: displayedProfile.current, requestedProfile: requestedProfile.current, loading: loading.current, hasVisibleModel: Boolean(modelRef.current), stageRenders: stageRenders.current }),
    getCanvasStats: () => rendererRef.current ? { width: rendererRef.current.domElement.width, height: rendererRef.current.domElement.height, dpr: rendererRef.current.getPixelRatio(), shadowEnabled: PROFILE[requestedProfile.current].shadows } : ({ ...canvasStats.current }),
    getRuntimeDetails: () => rendererRef.current ? { programs: rendererRef.current.info.programs?.length ?? 0, drawCalls: rendererRef.current.info.render.calls, triangles: rendererRef.current.info.render.triangles, geometries: rendererRef.current.info.memory.geometries, textures: rendererRef.current.info.memory.textures, dpr: rendererRef.current.getPixelRatio(), shadowMapEnabled: rendererRef.current.shadowMap.enabled } : { programs: 0, drawCalls: 0, triangles: 0, geometries: 0, textures: 0, dpr: 1, shadowMapEnabled: false },
    getRenderSamples:()=>[...renderSamples.current],
    getCamera: () => cameraRef.current ? {position:cameraRef.current.position.toArray(),target:Array.isArray(cameraRef.current.userData.itmTarget)?cameraRef.current.userData.itmTarget:cameraPoseRef.current.target} : null,
  }));
  useEffect(() => {
    manifestRef.current = props.manifest;
    requestedProfile.current = props.profile;
    cameraPoseRef.current = props.cameraPose;
    selectionRef.current={assembly:props.selectedAssembly,component:props.selectedComponent};
  }, [props.manifest, props.profile, props.cameraPose,props.selectedAssembly,props.selectedComponent]);
  useEffect(() => { stageRenders.current += 1; });

  const record = (event: LifecycleEvent) => {
    lifecycle.current.push(event);
    if (lifecycle.current.length > 600) lifecycle.current.shift();
  };


  const { modelUrl, profile, onReady, onEvidence, onLoadError } = props;
  useEffect(() => {
    const sequence = ++loadSequence.current;
    const controller = new AbortController();
    activeController.current?.abort();
    activeController.current = controller;
    loading.current = true;
    retryPending.current = false;
    setRetryInFlight(false);
    setVisualReady(false);
    setError('');
    const started = performance.now();
    record({ at: started, type: 'profile-request', profile });
    record({ at: performance.now(), type: 'fetch-start', profile });
    fetch(modelUrl, { signal: controller.signal, cache: 'default' })
      .then(async (response) => {
        if (!response.ok) throw new Error(`GLB HTTP ${response.status}`);
        const buffer = await response.arrayBuffer();
        record({ at: performance.now(), type: 'fetch-ready', profile, detail: `${buffer.byteLength} bytes` });
        await MeshoptDecoder.ready;
        record({ at: performance.now(), type: 'decode-start', profile });
        setResourcePhase(`parse:${profile}`);
        return new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(buffer, '');
      })
      .then(async (gltf) => {
        record({ at: performance.now(), type: 'parse-ready', profile });
        trackModelGeometries(gltf.scene, `model:${profile}:${sequence}`);
        setResourcePhase('idle');
        if (controller.signal.aborted || sequence !== loadSequence.current) {
          disposeModel(gltf.scene, `stale-dispose:${profile}`);
          record({ at: performance.now(), type: 'stale-dispose', profile });
          return;
        }
        record({ at: performance.now(), type: 'material-prep-start', profile });
        gltf.scene.traverse((object) => {
          object.visible = true;
          if (!(object instanceof THREE.Mesh)) return;
          object.castShadow = true;
          object.receiveShadow = true;
          const list = Array.isArray(object.material) ? object.material : [object.material];
          const cloned = list.map((material) => material.clone());
          for(const material of cloned){const focus=material.clone();focus.transparent=true;focus.depthWrite=false;focusMaterialByBase.set(material,focus);trackMaterial(focus);}
          object.material = Array.isArray(object.material) ? cloned : cloned[0];
          baseMaterialsByMesh.set(object,object.material);
        });
        record({ at: performance.now(), type: 'material-prep-ready', profile });
        record({ at: performance.now(), type: 'decode-ready', profile });
        const renderer = rendererRef.current;
        const camera = cameraRef.current;
        const targetScene = sceneRef.current;
        if (renderer && camera && targetScene) {
          const precompileAt = performance.now();
          record({ at: precompileAt, type: 'shader-precompile-start', profile });
          await renderer.compileAsync(gltf.scene, camera, targetScene);
          record({ at: performance.now(), type: 'shader-precompile-ready', profile, detail: `${(performance.now() - precompileAt).toFixed(2)} ms` });
          if (controller.signal.aborted || sequence !== loadSequence.current) {
            disposeModel(gltf.scene, `stale-after-precompile:${profile}`);
            record({ at: performance.now(), type: 'stale-dispose', profile });
            return;
          }
        }
        displayedProfile.current = profile;
        loading.current = false;
        setError('');
        setModel(gltf.scene);
        record({ at: performance.now(), type: 'swap', profile });
        onReady(performance.now() - started);
        onEvidence(evidence);
      })
      .catch((reason) => {
        if (controller.signal.aborted) return;
        loading.current = false;
        setRetryInFlight(false);
        setError(String(reason));
        onLoadError();
        record({ at: performance.now(), type: 'load-error', profile, detail: String(reason) });
      });
    return () => controller.abort();
  }, [modelUrl, onEvidence, onLoadError, onReady, profile, loadAttempt, evidence]);

  useEffect(() => {
    const previous = committedModel.current;
    committedModel.current = model;
    modelRef.current = model;
    if (!previous || previous === model) return;
    requestAnimationFrame(() => {
      const disposingAt=performance.now();
      record({ at: disposingAt, type: 'previous-dispose-start', profile: displayedProfile.current ?? undefined });
      disposeModel(previous, `previous-dispose:${displayedProfile.current ?? 'unknown'}`);
      record({ at: performance.now(), type: 'previous-dispose', profile: displayedProfile.current ?? undefined, detail: `${(performance.now()-disposingAt).toFixed(2)} ms` });
    });
  }, [model]);

  useEffect(() => () => {
    activeController.current?.abort();
    if (committedModel.current) disposeModel(committedModel.current, 'unmount-dispose');
  }, []);

  const config = PROFILE[props.profile];
  if (!model) return <div className="loading-state" role={error?'alert':'status'}><img src={POSTER_URL} alt={props.lang==='vi'?'Ảnh xem trước Model B; mô hình tương tác chưa sẵn sàng':'Model B still preview; interactive model is not ready'}/><div><strong>{error || (props.restarting?(props.lang==='vi'?`Đang khởi động lại với ${props.profile}…`:`Restarting with ${props.profile}…`):(props.lang==='vi'?'Đang tải mô hình tương tác…':'Loading semantic assembly…'))}</strong><span>{error?(props.lang==='vi'?'Mô hình 3D chưa khả dụng; các chương vẫn đọc được.':'The 3D model is unavailable; chapters remain readable.'):(props.lang==='vi'?'Ảnh xem trước · mô hình tương tác đang được giải mã':'Preview image · interactive geometry is still decoding')}</span>{error&&<button type="button" disabled={retryInFlight} onClick={()=>{if(loading.current||retryPending.current)return;retryPending.current=true;setRetryInFlight(true);props.onRetryStart();setLoadAttempt(value=>value+1);}}>{props.lang==='vi'?'Thử tải lại mô hình':'Retry model load'}</button>}</div></div>;
  return <><Canvas camera={{ position: [5, 2.5, 5], fov: 36, near: .05, far: 100 }} dpr={config.dpr} resize={{ offsetSize: true }} shadows={config.shadows} frameloop={L1_FRAMELOOP==='always' ? 'always' : 'demand'} gl={{ antialias: config.aa, powerPreference: 'high-performance' }} onCreated={({ gl, camera, scene }) => {
    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.1;
    rendererInfo.current = info(gl);
    rendererRef.current = gl;
    cameraRef.current = camera;
    sceneRef.current = scene;
    installResourceProbe(gl);
    if (import.meta.env.DEV) {
      const context = gl.getContext() as WebGL2RenderingContext;
      const enabled = new URLSearchParams(location.search).get('gpuTiming') === '1';
      const timer = enabled ? context.getExtension('EXT_disjoint_timer_query_webgl2') : null;
      const pending: { query: WebGLQuery; startedAt: number }[] = [];
      let disjointEvents = 0;
      let wasDisjoint = false;
      const cpuSamples: { at: number; ms: number }[] = [];
      const gpuSamples: { at: number; ms: number }[] = [];
      let lastDrawnProfile: QualityProfile | null = null;
      const collect = () => {
        if (!timer) return;
        const disjoint = Boolean(context.getParameter(timer.GPU_DISJOINT_EXT));
        if (disjoint && !wasDisjoint) disjointEvents++;
        wasDisjoint = disjoint;
        for (let index = pending.length - 1; index >= 0; index--) {
          const { query, startedAt } = pending[index];
          if (!disjoint && !context.getQueryParameter(query, context.QUERY_RESULT_AVAILABLE)) continue;
          if (!disjoint) gpuSamples.push({ at: startedAt, ms: Number(context.getQueryParameter(query, context.QUERY_RESULT)) / 1e6 });
          context.deleteQuery(query);
          pending.splice(index, 1);
        }
        if (gpuSamples.length > 2000) gpuSamples.splice(0, gpuSamples.length - 2000);
      };
      const originalRender = gl.render.bind(gl);
      gl.render = (scene, viewCamera) => {
        collect();
        const query = timer && pending.length < 32 ? context.createQuery() : null;
        if (query && timer) context.beginQuery(timer.TIME_ELAPSED_EXT, query);
        const started = performance.now();l1Mark('webgl-render-start',{profile:displayedProfile.current??'loading'});
        try { noteRender(scene, displayedProfile.current ?? 'loading', () => originalRender(scene, viewCamera)); }
        finally {
          const ended = performance.now();
          l1Mark('webgl-render-end',{profile:displayedProfile.current??'loading',cpuMs:ended-started});
          cpuSamples.push({ at: ended, ms: ended - started });
          if (cpuSamples.length > 2000) cpuSamples.splice(0, cpuSamples.length - 2000);
          if (query && timer) { context.endQuery(timer.TIME_ELAPSED_EXT); pending.push({ query, startedAt: ended }); }
          if (displayedProfile.current && (displayedProfile.current !== lastDrawnProfile || needsFocusPreparation.current)) {
            lastDrawnProfile = displayedProfile.current;
            const prepMs=prepareFocusVariants(originalRender,scene,viewCamera,model);
            needsFocusPreparation.current=false;
            record({at:performance.now(),type:'focus-first-render-prepared',profile:lastDrawnProfile,detail:`${prepMs.toFixed(2)} ms`});
            record({ at: ended, type: 'first-render', profile: displayedProfile.current });
            requestAnimationFrame(() => { setVisualReady(true); props.onProfileDisplayed(lastDrawnProfile!); });
          }
        }
      };
      (window as Window & { __ITM_R45_GPU__?: { supported: boolean; read: () => { cpu: typeof cpuSamples; gpu: typeof gpuSamples; pending: number; disjointEvents: number } } }).__ITM_R45_GPU__ = {
        supported: Boolean(timer), read: () => { collect(); return { cpu: [...cpuSamples], gpu: [...gpuSamples], pending: pending.length, disjointEvents }; },
      };
    }
    if (!import.meta.env.DEV) {
      const originalRender = gl.render.bind(gl);
      let firstRender = true;
      gl.render = (scene, viewCamera) => {
        originalRender(scene, viewCamera);
        if (firstRender || needsFocusPreparation.current) {
          firstRender = false;
          const prepMs=prepareFocusVariants(originalRender,scene,viewCamera,model);
          needsFocusPreparation.current=false;
          record({at:performance.now(),type:'focus-first-render-prepared',profile:props.profile,detail:`${prepMs.toFixed(2)} ms`});
          requestAnimationFrame(() => { setVisualReady(true); props.onProfileDisplayed(props.profile); });
        }
      };
    }
    canvasStats.current = { width: gl.domElement.width, height: gl.domElement.height, dpr: gl.getPixelRatio(), shadowEnabled: config.shadows };
    props.onEvidence(evidence);
  }}><Scene model={model} manifest={props.manifest} scrollProgress={props.scrollProgress} cutaway={props.cutaway} storyFocusStrength={props.storyFocusStrength} selectedAssembly={props.selectedAssembly} selectedComponent={props.selectedComponent} isolation={props.isolation} isolationScope={props.isolationScope} ghost={props.ghost} attachmentCue={props.attachmentCue} cameraPose={props.cameraPose} cameraMode={props.cameraMode} lightIntensity={props.lightIntensity} profile={props.profile} onMetrics={props.onMetrics} onRenderSample={(time,ms)=>{renderSamples.current.push({time,ms});if(renderSamples.current.length>5000)renderSamples.current.shift();}} onUserOrbit={props.onUserOrbit} onContextLost={(lost) => { record({ at: performance.now(), type: lost ? 'context-lost' : 'context-restored', profile: displayedProfile.current ?? undefined }); if(lost)setVisualReady(false);else needsFocusPreparation.current=true; props.onContextLost(lost); }} /></Canvas>{!visualReady&&<div className="loading-state" role="status"><img src={POSTER_URL} alt={props.lang==='vi'?'Ảnh xem trước Model B; mô hình tương tác đang được chuẩn bị':'Model B still preview; interactive model is being prepared'}/><div><strong>{props.lang==='vi'?`Đang chuẩn bị ${props.profile}…`:`Preparing ${props.profile}...`}</strong><span>{props.lang==='vi'?'Mô hình tương tác sẽ hiện sau khung hình đầu tiên':'The interactive model appears after its first rendered frame'}</span></div></div>}</>;
}
