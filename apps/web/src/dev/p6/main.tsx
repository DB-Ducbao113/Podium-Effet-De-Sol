import React from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { CameraPreset } from '../../components/showroom/CameraController';
import { StudioCameraController } from './StudioCameraController';
import { shouldStartDecalPlacement } from './authorPointerIntent';
import { loadModelB, disposeModelB } from '../commercial-b/modelBLoader';
import { createLiveryRuntime, supportsReviewBranding, type LiveryVariant } from './liveryRuntime';
import { teamLiveries, type TeamLivery } from './teamLiveries';
import { CURRENT_2026_REVIEW, CURRENT_VARIANT_ID } from './seasonCurrent2026';
import type { PrecisionTeam } from './paintAtlas';
import { MERCEDES_MEXICO_BODY } from './standard2026Paint';
import { resolveGraphicsQuality, type GraphicsMode } from './graphicsQuality';
import { ModelBPaintLayoutInspector } from './ModelBPaintLayoutInspector';
import { AuthorPanel } from './AuthorPanel';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource-variable/manrope/index.css';

type LightMode = 'Studio' | 'Team' | 'Presentation' | 'Night';
type Panel = 'paint' | 'advanced' | null;
type RenderMetrics = { fps: number | null; frameP95Ms: number | null; drawCalls: number; triangles: number; textures: number };
type PlacementSummary = { placed: number; adapted: number; provisional: number; unplaced: number; blocked: number };
const authorMode = new URLSearchParams(window.location.search).get('author') === '1';
type AuthorApi = ReturnType<typeof createLiveryRuntime>['author'];
function setSceneReflections(scene: THREE.Scene, texture: THREE.Texture | null) {
  scene.environment = texture;
  scene.environmentIntensity = texture ? .4 : 1;
}
const cameraOptions: { id: CameraPreset; label: string }[] = [
  { id: 'overview', label: 'Orbit' }, { id: 'front', label: 'Front' },
  { id: 'side', label: 'Side' }, { id: 'rear', label: 'Rear' }, { id: 'top', label: 'Top' },
];

function EnvironmentReflections() {
  const { gl, scene } = useThree();
  React.useEffect(() => {
    const generator = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const target = generator.fromScene(room);
    setSceneReflections(scene, target.texture);
    return () => { setSceneReflections(scene, null); target.dispose(); room.dispose(); generator.dispose(); };
  }, [gl, scene]);
  return null;
}

function ModelB({ team, variant, surface, reduced, showBranding, onLoad, onFailure, onTeamReady, onAuthorReady }: { team: TeamLivery; variant: LiveryVariant; surface: number; reduced: boolean; showBranding: boolean; onLoad: (bytes: number) => void; onFailure: (message: string) => void; onTeamReady: (id: string) => void; onAuthorReady: (api: AuthorApi | null) => void }) {
  const { scene, camera, gl, invalidate } = useThree();
  const [model, setModel] = React.useState<THREE.Group | null>(null);
  const runtime = React.useRef<ReturnType<typeof createLiveryRuntime> | null>(null);
  React.useEffect(() => {
    const controller = new AbortController();
    let owned: THREE.Group | null = null;
    void loadModelB(controller.signal).then((result) => {
      if (controller.signal.aborted) { disposeModelB(result.scene); return; }
      owned = result.scene;
      owned.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.castShadow = true;
        object.receiveShadow = true;
      });
      runtime.current = createLiveryRuntime(owned, scene);
      if (authorMode) {
        onAuthorReady(runtime.current.author);
        (window as Window & { __P6_AUTHOR__?: typeof runtime.current.author }).__P6_AUTHOR__ = runtime.current.author;
      }
      (window as Window & { __P6_MODEL__?: THREE.Group }).__P6_MODEL__ = owned;
      (window as Window & { __P6_THREE__?: typeof THREE }).__P6_THREE__ = THREE;
      (window as Window & { __P6_LIVERY_DEBUG__?: () => unknown }).__P6_LIVERY_DEBUG__ = runtime.current.getDebug;
      setModel(owned);
      onLoad(result.bytes);
    }).catch((error: unknown) => { if (!controller.signal.aborted) onFailure(String(error)); });
    return () => { controller.abort(); runtime.current?.dispose(); runtime.current = null; if (authorMode) { onAuthorReady(null); delete (window as Window & { __P6_AUTHOR__?: unknown }).__P6_AUTHOR__; } if (owned) disposeModelB(owned); };
  }, [onLoad, onFailure, onTeamReady, onAuthorReady, scene]);
  React.useEffect(() => {
    if (runtime.current) void runtime.current.setTeam(team, variant, reduced, showBranding && supportsReviewBranding(team.id, variant))
      .then((applied) => { if (applied) { onTeamReady(team.id); invalidate(); } })
      .catch((cause) => onFailure(`Livery artwork unavailable: ${String(cause)}`));
  }, [team, variant, reduced, showBranding, model, onTeamReady, onFailure, invalidate]);
  React.useEffect(() => {
    if (!runtime.current) return;
    // Current review uses launch decal proxies where later placements are unverified.
    void runtime.current.setBrandingVisible(showBranding && supportsReviewBranding(team.id, variant))
      .then((applied) => {
        if (applied) {
          if (showBranding) onTeamReady(team.id);
          invalidate();
        }
      })
      .catch((cause: unknown) => onFailure(`Livery artwork unavailable: ${String(cause)}`));
  }, [showBranding, variant, model, onTeamReady, onFailure, invalidate, team.id]);
  React.useEffect(() => {
    if (!authorMode || !model) return;
    const canvas = gl.domElement;
    let dragging = false;
    const down = (event: PointerEvent) => {
      const api = runtime.current?.author;
      const selected = api?.selected();
      // Shift is an explicit authoring gesture. Ordinary pointer drags must
      // reach OrbitControls, even when a logo is selected in DEV mode.
      if (shouldStartDecalPlacement(event) && selected
        && api?.placeAt(selected, event.clientX, event.clientY, camera, canvas)) {
        dragging = true;
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    };
    const move = (event: PointerEvent) => { if (dragging) { const api = runtime.current?.author; const selected = api?.selected(); if (selected) api?.placeAt(selected, event.clientX, event.clientY, camera, canvas, false); event.stopImmediatePropagation(); event.preventDefault(); } };
    const up = () => { dragging = false; };
    canvas.addEventListener('pointerdown', down, true); window.addEventListener('pointermove', move, true); window.addEventListener('pointerup', up, true);
    return () => { canvas.removeEventListener('pointerdown', down, true); window.removeEventListener('pointermove', move, true); window.removeEventListener('pointerup', up, true); };
  }, [model, camera, gl]);
  useFrame((_, delta) => {
    if (runtime.current?.frame(delta, surface, team, reduced)) invalidate();
  });
  return model ? <primitive object={model} /> : null;
}

function PerformanceProbe({ onMetrics }: { onMetrics: (metrics: RenderMetrics) => void }) {
  const samples = React.useRef<number[]>([]);
  const lastPublish = React.useRef(0);
  const lastGeometry = React.useRef('');
  useFrame(({ gl, scene, camera }, delta) => {
    gl.render(scene, camera);
    if (document.visibilityState !== 'visible') return;
    const now = performance.now();
    const drawCalls = gl.info.render.calls;
    const triangles = gl.info.render.triangles;
    const textures = gl.info.memory.textures;
    const geometry = `${drawCalls}:${triangles}:${textures}`;
    if (geometry !== lastGeometry.current) {
      lastGeometry.current = geometry;
      onMetrics({ fps: null, frameP95Ms: null, drawCalls, triangles, textures });
    }
    if (delta > 0 && delta < 1) samples.current.push(delta * 1000);
    if (now - lastPublish.current < 500 || samples.current.length < 2) return;
    lastPublish.current = now;
    const sorted = [...samples.current].sort((a, b) => a - b);
    const mean = samples.current.reduce((sum, value) => sum + value, 0) / samples.current.length;
    onMetrics({
      fps: 1000 / mean,
      frameP95Ms: sorted[Math.ceil(sorted.length * .95) - 1],
      drawCalls,
      triangles,
      textures,
    });
    samples.current = [];
  }, 1);
  return null;
}

function Turntable() {
  return <group>
    <mesh position={[0, -.25, 0]} receiveShadow castShadow><cylinderGeometry args={[3.55, 3.62, .46, 96]} /><meshStandardMaterial color="#080b0d" metalness={.18} roughness={.72} /></mesh>
    <mesh position={[0, -.008, 0]} receiveShadow><cylinderGeometry args={[3.5, 3.5, .025, 96]} /><meshStandardMaterial color="#030507" metalness={.12} roughness={.9} envMapIntensity={.08} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.045, 0]}><ringGeometry args={[3.45, 3.54, 96]} /><meshBasicMaterial color="#e85b26" toneMapped={false} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .009, 0]}><ringGeometry args={[3.35, 3.38, 96]} /><meshStandardMaterial color="#899398" metalness={.8} roughness={.35} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.47, 0]}><ringGeometry args={[3.62, 3.68, 96]} /><meshBasicMaterial color="#dd5a2c" toneMapped={false} /></mesh>
  </group>;
}

function Studio({ mode, team, reduced, lowPower }: { mode: LightMode; team: TeamLivery; reduced: boolean; lowPower: boolean }) {
  const invalidate = useThree((state) => state.invalidate);
  const night = mode === 'Night';
  const presentation = mode === 'Presentation';
  const teamAccent = mode === 'Team';
  // Neutral Studio is the color-reference mode: warm/cyan theatrical lights
  // must not recolor the paint while comparing 2026 source photographs.
  const rim = teamAccent ? .90 : night ? .48 : presentation ? .52 : .30;
  const cool = presentation ? .92 : night ? .34 : teamAccent ? .72 : .58;
  const rimColor = React.useMemo(() => new THREE.Color(teamAccent ? team.accent : '#e9edf0'), [teamAccent, team.accent]);
  const keyRef = React.useRef<THREE.DirectionalLight>(null);
  const coolRef = React.useRef<THREE.DirectionalLight>(null);
  const rimRef = React.useRef<THREE.DirectionalLight>(null);
  useFrame((_, delta) => {
    const factor = reduced ? 1 : 1 - Math.exp(-delta * 5);
    if (keyRef.current) keyRef.current.intensity = THREE.MathUtils.lerp(keyRef.current.intensity, night ? .85 : presentation ? 1.65 : teamAccent ? 1.42 : 1.30, factor);
    if (coolRef.current) coolRef.current.intensity = THREE.MathUtils.lerp(coolRef.current.intensity, cool, factor);
    if (rimRef.current) { rimRef.current.intensity = THREE.MathUtils.lerp(rimRef.current.intensity, rim, factor); rimRef.current.color.lerp(rimColor, factor); }
    if (!reduced && (
      Math.abs((keyRef.current?.intensity ?? 0) - (night ? .85 : presentation ? 1.65 : teamAccent ? 1.42 : 1.30)) > .003 ||
      Math.abs((coolRef.current?.intensity ?? 0) - cool) > .003 ||
      Math.abs((rimRef.current?.intensity ?? 0) - rim) > .003 ||
      Math.abs((rimRef.current?.color.r ?? 0) - rimColor.r) > .003 ||
      Math.abs((rimRef.current?.color.g ?? 0) - rimColor.g) > .003 ||
      Math.abs((rimRef.current?.color.b ?? 0) - rimColor.b) > .003
    )) invalidate();
  });
  return <>
    {!lowPower && <EnvironmentReflections />}
    <color attach="background" args={['#080c10']} />
    <hemisphereLight intensity={night ? .38 : presentation ? 1 : .68} color="#dbe5eb" groundColor="#07090b" />
    <ambientLight intensity={.16} />
    <directionalLight ref={keyRef} position={[-4, 9, -5]} intensity={1.30} color="#f6f7f5" />
    <directionalLight ref={coolRef} position={[5, 5, 4]} intensity={.58} color="#e9edf0" />
    <directionalLight ref={rimRef} position={[-5, 3, 5]} intensity={.30} color="#e9edf0" />
    <spotLight position={[0, 6, -3.2]} angle={.65} penumbra={.85} intensity={1.25} distance={12} color="#e9edf0" />
    <spotLight position={[4, 5, 2.8]} angle={.65} penumbra={.85} intensity={teamAccent ? 1.05 : 0} distance={11} color={team.accent} />
    <Turntable />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.52, 0]} receiveShadow><planeGeometry args={[80, 80]} /><meshStandardMaterial color="#080d11" metalness={.24} roughness={.68} envMapIntensity={.35} /></mesh>
    {[4.35, 5.15, 6.45].map((radius) => <mesh key={radius} rotation={[-Math.PI / 2, 0, 0]} position={[0, -.5, 0]}><ringGeometry args={[radius, radius + .018, 96]} /><meshStandardMaterial color="#3e4b52" metalness={.75} roughness={.42} /></mesh>)}
    {Array.from({ length: 24 }, (_, index) => { const a = index * Math.PI / 12; return <mesh key={index} rotation={[-Math.PI / 2, 0, a]} position={[0, -.497, 0]}><planeGeometry args={[.012, 12]} /><meshStandardMaterial color="#253039" metalness={.74} roughness={.4} /></mesh>; })}
    {!lowPower && <ContactShadows position={[0, .014, 0]} opacity={.55} scale={6.9} blur={1.35} far={2.2} frames={1} resolution={128} color="#040404" />}
    <mesh position={[0, 3.8, 0]}><cylinderGeometry args={[8.3, 8.3, 8, 72, 1, true]} /><meshStandardMaterial color="#0a1117" side={THREE.BackSide} metalness={.38} roughness={.62} /></mesh>
    <mesh position={[0, 7.75, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[8.3, 72]} /><meshStandardMaterial color="#0b1116" side={THREE.DoubleSide} /></mesh>
    {[5.8, 7.3, 8.1].map((radius) => <mesh key={radius} position={[0, 7.2, 0]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[radius, .045, 8, 96]} /><meshStandardMaterial color="#57636b" metalness={.8} roughness={.32} /></mesh>)}
    {[[-3.5,4],[0,4.4],[3.5,4]].map(([x,z], index) => <group key={index} position={[x,4.65,z]} rotation={[-.32,0,0]}>
      <mesh><boxGeometry args={[2.5,.14,.95]} /><meshStandardMaterial color="#1e2a31" metalness={.6} roughness={.35} /></mesh>
      <mesh position={[0,-.085,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[2.3,.76]} /><meshBasicMaterial color="#e3edf0" toneMapped={false} side={THREE.DoubleSide} /></mesh>
    </group>)}
    {[-5, 0, 5].map((x) => <group key={x} position={[x, 5.9, 7.3]}>
      <mesh><boxGeometry args={[2.8, .75, .2]} /><meshStandardMaterial color="#30383d" metalness={.55} roughness={.4} /></mesh>
      <mesh position={[0, 0, -.13]}><planeGeometry args={[2.54, .53]} /><meshBasicMaterial color="#d7e1e3" toneMapped={false} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, -1.15, .1]}><boxGeometry args={[.08, 1.4, .08]} /><meshStandardMaterial color="#4a4e50" metalness={.7} /></mesh>
    </group>)}
    {[-5.5, -1.8, 1.8, 5.5].map((x, index) => <group key={`wall-light-${x}`} position={[x, 3.5, 6.7]}>
      <mesh><boxGeometry args={[2.3, .16, .18]} /><meshStandardMaterial color="#263039" metalness={.68} roughness={.35} /></mesh>
      <mesh position={[0, 0, -.11]}><boxGeometry args={[2.08, .075, .025]} /><meshBasicMaterial color={index % 2 ? '#e9ebdf' : '#eb6834'} toneMapped={false} /></mesh>
      <pointLight position={[0, -.3, -.5]} color={index % 2 ? '#dce7eb' : '#f07944'} intensity={index % 2 ? .8 : .4} distance={3.5} />
    </group>)}
    {[-5.4, 5.4].map((x) => <group key={x} position={[x, .65, 6.5]}>
      <mesh><boxGeometry args={[2.8, 1.3, .8]} /><meshStandardMaterial color="#1c262c" metalness={.48} roughness={.55} /></mesh>
      <mesh position={[0, .12, -.43]}><planeGeometry args={[2.3, .65]} /><meshBasicMaterial color="#405361" toneMapped={false} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, -.5, -.45]}><boxGeometry args={[2.4, .05, .06]} /><meshBasicMaterial color="#b04e29" toneMapped={false} /></mesh>
    </group>)}
    {Array.from({ length: 12 }, (_, index) => {
      const a = index * Math.PI / 6;
      return <group key={index} position={[Math.sin(a) * 7.8, 6.8, Math.cos(a) * 7.8]} rotation={[0, a, 0]}>
        <mesh><boxGeometry args={[1.65, .16, .9]} /><meshStandardMaterial color="#333b40" metalness={.7} roughness={.4} /></mesh>
        <mesh position={[0, -.105, 0]}><planeGeometry args={[1.48, .74]} /><meshBasicMaterial color={index % 3 === 0 ? '#ffe0be' : '#dbe6ed'} toneMapped={false} side={THREE.DoubleSide} /></mesh>
      </group>;
    })}
    {[1.9, 5.6].map((height) => <mesh key={height} position={[0, height, 0]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[9.55, .022, 7, 96]} /><meshBasicMaterial color="#4d2e27" toneMapped={false} /></mesh>)}
    {Array.from({ length: 16 }, (_, index) => {
      const a = index * Math.PI / 8;
      return <group key={index} position={[Math.sin(a) * 8.05, 0, Math.cos(a) * 8.05]} rotation={[0, a, 0]}>
        <mesh position={[0, 2.1, 0]}><boxGeometry args={[.11, 4.2, .13]} /><meshStandardMaterial color="#42494a" metalness={.8} roughness={.42} /></mesh>
        <mesh position={[0, 4.45, 0]}><boxGeometry args={[1.15, .055, .12]} /><meshBasicMaterial color="#9b3e24" toneMapped={false} /></mesh>
        {index % 2 === 0 && <mesh position={[1.5, .7, -.4]}><boxGeometry args={[1.4, 1.15, .7]} /><meshStandardMaterial color="#22282b" metalness={.65} roughness={.52} /></mesh>}
      </group>;
    })}
    {[-3.25, 3.25].map((x) => <group key={x} position={[x, 1.9, 7.9]}>
      <mesh><boxGeometry args={[3.1, 2.1, .16]} /><meshStandardMaterial color="#222b31" metalness={.58} roughness={.54} /></mesh>
      <mesh position={[0, 0, -.09]}><planeGeometry args={[2.72, 1.68]} /><meshStandardMaterial color="#17222a" metalness={.45} roughness={.46} /></mesh>
      {[-.58, -.21, .16, .53].map((y) => <mesh key={y} position={[0, y, -.1]}><boxGeometry args={[2.35, .025, .018]} /><meshBasicMaterial color={y === .53 ? '#d56835' : '#52636a'} toneMapped={false} /></mesh>)}
      <mesh position={[-1.42, 0, -.12]}><boxGeometry args={[.045, 1.68, .025]} /><meshBasicMaterial color="#d56835" toneMapped={false} /></mesh>
    </group>)}
  </>;
}

export function App({ embedded = false }: { embedded?: boolean }) {
  const [team, setTeam] = React.useState(teamLiveries[0]);
  const variant: LiveryVariant = CURRENT_VARIANT_ID;
  const [light, setLight] = React.useState<LightMode>('Studio');
  const [graphicsMode, setGraphicsMode] = React.useState<GraphicsMode>('auto');
  const [camera, setCamera] = React.useState<CameraPreset>('overview');
  const [cameraTrigger, setCameraTrigger] = React.useState(0);
  const [zoomTrigger, setZoomTrigger] = React.useState(0);
  const [zoomDirection, setZoomDirection] = React.useState<'in' | 'out' | null>(null);
  const [panel, setPanel] = React.useState<Panel>(null);
  const [tab, setTab] = React.useState<'paint' | 'advanced' | 'lighting'>('paint');
  const [surface, setSurface] = React.useState(.38);
  const [metrics, setMetrics] = React.useState<RenderMetrics | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState('');
  const [bytes, setBytes] = React.useState(0);
  const [readyTeam, setReadyTeam] = React.useState('');
  const [showBranding, setShowBranding] = React.useState(false);
  const [placementSummary, setPlacementSummary] = React.useState<PlacementSummary | null>(null);
  const [authorApi, setAuthorApi] = React.useState<AuthorApi | null>(null);
  const [reduced, setReduced] = React.useState(matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [softwareRenderer, setSoftwareRenderer] = React.useState(false);
  const graphics = React.useMemo(() => resolveGraphicsQuality(graphicsMode, softwareRenderer), [graphicsMode, softwareRenderer]);
  const lowPower = graphics.lowPower;
  const [stageActive, setStageActive] = React.useState(document.visibilityState === 'visible');
  const stageRef = React.useRef<HTMLElement>(null);
  const paintButton = React.useRef<HTMLButtonElement>(null);
  const mobileAdvancedButton = React.useRef<HTMLButtonElement>(null);
  const onLoad = React.useCallback((count: number) => { setBytes(count); setLoaded(true); }, []);
  const onFailure = React.useCallback((message: string) => setError(message), []);
  const onTeamReady = React.useCallback((id: string) => {
    setReadyTeam(id);
    setError('');
    const debug = (window as Window & {
      __P6_LIVERY_DEBUG__?: () => { placementAudit?: Array<{ state: keyof PlacementSummary }> };
    }).__P6_LIVERY_DEBUG__?.();
    const rows = debug?.placementAudit ?? [];
    setPlacementSummary({
      placed: rows.filter((item) => item.state === 'placed').length,
      adapted: rows.filter((item) => item.state === 'adapted').length,
      provisional: rows.filter((item) => item.state === 'provisional').length,
      unplaced: rows.filter((item) => item.state === 'unplaced').length,
      blocked: rows.filter((item) => item.state === 'blocked').length,
    });
  }, []);
  const onAuthorReady = React.useCallback((api: AuthorApi | null) => setAuthorApi(api), []);
  React.useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const listener = () => setReduced(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);
  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let inViewport = true;
    const update = () => setStageActive(inViewport && document.visibilityState === 'visible');
    const observer = new IntersectionObserver(([entry]) => {
      inViewport = entry.isIntersecting;
      update();
    });
    observer.observe(stage);
    document.addEventListener('visibilitychange', update);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
    };
  }, []);
  React.useEffect(() => {
    if (!panel) return;
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setPanel(null); (panel === 'paint' ? paintButton : mobileAdvancedButton).current?.focus(); } };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [panel]);
  const chooseCamera = (preset: CameraPreset) => { setCamera(preset); setCameraTrigger((value) => value + 1); };
  const zoom = (direction: 'in' | 'out') => { setZoomDirection(direction); setZoomTrigger((value) => value + 1); };
  const reset = () => chooseCamera('overview');
  React.useEffect(() => {
    (window as Window & { __P6_LIVE__?: unknown }).__P6_LIVE__ = { getState: () => ({ loaded, error, bytes, team: team.name, teamId: team.id, variant, readyTeam, camera, light, graphicsMode, graphics: graphics.effective, panel, surface, reduced, lowPower }), setTeam: (id: string) => { const next = teamLiveries.find((item) => item.id === id); if (next) { setTeam(next); setShowBranding(next.id !== 'cadillac'); } }, setCamera: chooseCamera, setLight, setGraphicsMode };
  }, [loaded, error, bytes, team, variant, readyTeam, camera, light, graphicsMode, graphics.effective, panel, surface, reduced, lowPower]);
  const swatches = <div className="swatches team-swatches">{teamLiveries.map((item) => <button key={item.id} type="button" className={`swatch ${item.id === team.id ? 'selected' : ''}`} style={{ '--swatch': item.id === 'mercedes' ? MERCEDES_MEXICO_BODY : item.primary, '--second': item.secondary } as React.CSSProperties} aria-label={`${item.name} 2026 livery`} aria-pressed={item.id === team.id} onClick={() => { setTeam(item); setShowBranding(item.id !== 'cadillac'); setSurface(item.finish === 'gloss' ? .27 : .41); }}><span className="swatch-color" /><span className="swatch-name">{item.name}</span></button>)}</div>;
  const mainReference = CURRENT_2026_REVIEW[team.id as PrecisionTeam].variantEvidenceUrl;
  const lights = <div className="light-options studio-light-options" role="group" aria-label="Lighting presets">{(['Studio', 'Team', 'Presentation', 'Night'] as const).map((item) => <button key={item} type="button" className={light === item ? 'selected' : ''} aria-pressed={light === item} onClick={() => setLight(item)}><span className={`light-sample ${item.toLowerCase()}`} />{item}</button>)}</div>;
  const advancedControls = <>
    <div className="advanced-group"><h3>Performance</h3><div className="graphics-options" role="group" aria-label="Graphics quality">{(['auto', 'high', 'balanced', 'performance'] as const).map((mode) => <button key={mode} type="button" aria-pressed={graphicsMode === mode} className={graphicsMode === mode ? 'selected' : ''} onClick={() => setGraphicsMode(mode)}>{mode === 'auto' ? 'Auto' : mode === 'high' ? 'High' : mode === 'balanced' ? 'Balanced' : 'Performance'}</button>)}</div>{softwareRenderer && <p className="graphics-note">Software renderer · Performance</p>}</div>
    <div className="advanced-group">
      <div className="advanced-heading"><h3>Renderer</h3><small>Recent frames</small></div>
      <dl className="render-metrics" aria-label="Live rendering measurements">
        <div><dt>FPS</dt><dd>{metrics?.fps != null ? metrics.fps.toFixed(0) : '—'}</dd></div>
        <div><dt>Frame P95</dt><dd>{metrics?.frameP95Ms != null ? `${metrics.frameP95Ms.toFixed(1)} ms` : '—'}</dd></div>
        <div><dt>Draw calls</dt><dd>{metrics ? metrics.drawCalls.toLocaleString() : '—'}</dd></div>
        <div><dt>Triangles</dt><dd>{metrics ? metrics.triangles.toLocaleString() : '—'}</dd></div>
        <div><dt>Textures</dt><dd>{metrics ? metrics.textures.toLocaleString() : '—'}</dd></div>
      </dl>
    </div>
    <div className="advanced-group"><h3>Finish</h3><label className="surface-control">Gloss <output>{`${Math.round((1 - surface) * 100)}%`}</output><input type="range" min="0.18" max="0.72" step="0.01" value={surface} onChange={(event) => setSurface(Number(event.target.value))} /></label></div>
    {supportsReviewBranding(team.id, variant) && <div className="advanced-group"><h3>Logos</h3><label className="component-review-branding"><input type="checkbox" checked={showBranding} onChange={(event) => setShowBranding(event.target.checked)} />Show logos</label></div>}
    {authorMode && <><div className="advanced-group"><h3>Decal QA</h3>
      {!showBranding
        ? <p>Sponsor preview off.</p>
        : placementSummary && readyTeam === team.id
          ? <p>{placementSummary.provisional} fast preview · {placementSummary.placed} geometry passed · {placementSummary.adapted} adapted · {placementSummary.unplaced} unplaced · {placementSummary.blocked} blocked</p>
          : <p>Loading optional sponsor preview…</p>}
      <p>Geometry scan: ?surfaceQa=1</p>
    </div>
    <ModelBPaintLayoutInspector
      teamId={team.id as PrecisionTeam}
      referenceUrl={mainReference}
      belgiumStudy={team.id === 'cadillac' && variant === CURRENT_VARIANT_ID}
      showBranding={showBranding && supportsReviewBranding(team.id, variant)}
      onShowBranding={(show) => { if (supportsReviewBranding(team.id, variant)) setShowBranding(show); }}
      onCamera={chooseCamera}
    />
    </>}
  </>;
  return <div className={`app ${panel ? `panel-${panel}` : ''}`} style={{ '--team-accent': team.accent, '--team-primary': team.primary } as React.CSSProperties}>
    {!embedded && <header className="topbar"><img src="/logo.png" alt="PODIUM EDS" /><nav aria-label="Prototype navigation"><span>OVERVIEW</span><span>RACES</span><span>STANDINGS</span><span>ENGINEERING</span><strong>3D SHOWROOM</strong></nav><div className="top-actions"><span>EN</span><button type="button" aria-label="Menu" disabled>☰</button></div></header>}
    <main className="layout"><section ref={stageRef} className="stage" aria-label="Interactive Model B 3D studio"><Canvas frameloop={stageActive && loaded ? 'demand' : 'never'} dpr={graphics.dpr} resize={{ offsetSize: true }} camera={{ position: [4.2, 2.1, -5.7], fov: 39, near: .05, far: 80 }} gl={{ antialias: true, powerPreference: 'high-performance' }} onCreated={({ gl }) => { gl.outputColorSpace = THREE.SRGBColorSpace; gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1; const context = gl.getContext(); const info = context.getExtension('WEBGL_debug_renderer_info'); const renderer = String(context.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : context.RENDERER)); setSoftwareRenderer(/swiftshader|llvmpipe|softpipe|software rasterizer/i.test(renderer)); }}>
      <Studio mode={light} team={team} reduced={reduced} lowPower={lowPower} />
      <ModelB team={team} variant={variant} surface={surface} reduced={reduced} showBranding={showBranding} onLoad={onLoad} onFailure={onFailure} onTeamReady={onTeamReady} onAuthorReady={onAuthorReady} />
      <StudioCameraController preset={camera} trigger={cameraTrigger} zoomTrigger={zoomTrigger} zoomDirection={zoomDirection} reduced={reduced} />
      <PerformanceProbe onMetrics={setMetrics} />
    </Canvas><div className="stage-ui"><h1>SHOWROOM 3D</h1></div><div className="model-note"><strong>{team.name.toUpperCase()}</strong> · {team.car}<br/><small>MODEL B · DEV PREVIEW</small></div>{(!loaded || error) && <div className="load-status" role="status">{error || 'LOADING MODEL B…'}</div>}<div className="camera-dock" aria-label="Camera controls"><span>VIEW</span>{cameraOptions.map((item) => <button type="button" key={item.id} aria-label={`${item.label} camera`} aria-pressed={camera === item.id} className={camera === item.id ? 'selected' : ''} onClick={() => chooseCamera(item.id)}>{item.label}</button>)}<i/><button type="button" aria-label="Zoom in" onClick={() => zoom('in')}>＋</button><button type="button" aria-label="Zoom out" onClick={() => zoom('out')}>−</button><button type="button" onClick={reset}>Reset</button></div>
    </section><aside className="config">
      <div className="config-head"><h2>Car setup</h2></div>
      <div className="config-tabs" role="tablist" aria-label="Configuration groups">{(['paint','lighting','advanced'] as const).map((item) => <button type="button" role="tab" aria-selected={tab === item} className={tab === item ? 'selected' : ''} key={item} onClick={() => setTab(item)}>{item === 'paint' ? 'Team' : item === 'lighting' ? 'Light' : 'Advanced'}</button>)}</div>
      <div className="config-content" role="tabpanel">
        {tab === 'paint' && <><div className="section-heading"><h3>Teams</h3><span>{teamLiveries.indexOf(team) + 1} / 11</span></div>{swatches}{readyTeam !== team.id && <p className="artwork-progress" role="status">Applying paint…</p>}<a className="team-reference" href={mainReference} target="_blank" rel="noopener noreferrer">Photo source ↗</a></>}
        {tab === 'lighting' && lights}
        {tab === 'advanced' && advancedControls}
      </div>
    </aside></main>
    <div className="mobile-actions"><button ref={paintButton} type="button" aria-expanded={panel === 'paint'} onClick={() => setPanel(panel === 'paint' ? null : 'paint')}>TEAM LIVERY <span>{team.name}</span></button><button ref={mobileAdvancedButton} type="button" aria-expanded={panel === 'advanced'} onClick={() => setPanel(panel === 'advanced' ? null : 'advanced')}>ADVANCED <span>⌄</span></button></div>
    {panel === 'paint' && <section className="sheet paint-sheet" aria-label="Team livery selection"><div className="sheet-head"><h2>Teams</h2><button type="button" onClick={() => { setPanel(null); paintButton.current?.focus(); }}>Close ×</button></div>{swatches}</section>}
    {panel === 'advanced' && <section className="sheet advanced-sheet" aria-label="Advanced settings"><div className="sheet-head"><h2>Advanced</h2><button type="button" onClick={() => { setPanel(null); mobileAdvancedButton.current?.focus(); }}>Close ×</button></div>{advancedControls}</section>}
    {authorMode && <AuthorPanel api={authorApi} team={team} onTeam={(id) => { const next = teamLiveries.find((item) => item.id === id); if (next) { setTeam(next); setShowBranding(next.id !== 'cadillac'); } }} onCamera={chooseCamera} />}
  </div>;
}

