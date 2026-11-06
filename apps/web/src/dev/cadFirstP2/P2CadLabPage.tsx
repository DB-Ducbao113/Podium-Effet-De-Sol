import { Suspense, lazy, useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'meshoptimizer';
import type { P2CadScene } from './P2CadViewer';
import type { P2DisplayQuality } from './P2StudioEnvironment';
import type { P2RenderMetrics } from './P2PerformanceTelemetry';
import sourceRegistry from './sourceRegistry.json';
import { p2SteeringMate } from './P2SteeringMate';
import { p2FilmFrame, P2_CINEMA_SHOTS, P2_CINEMA_DURATION_SECONDS } from './P2CinemaTimeline';
import { P2_MACRO_PARTS } from './P2MacroTargets';
import './p2CadLab.css';

const P2CadViewer = lazy(() => import('./P2CadViewer'));
const MAX_FILE_BYTES = 150 * 1024 * 1024;

type VerifiedManifest = {
  schema: string;
  profiles?: Record<string, { file: string; sha256: string; bytes: number; totalTriangles?: number }>;
  masterSTEP?: string;
  mechanicalTruth?: Record<string, boolean>;
  totalCadSolids?: number;
  partIds?: string[];
  parts?: string[];
  sourcePartCount?: number;
  geometryProof?: Record<string, number>;
  p23SourcePrecisionEvidence?: Record<string, number>;
  staticCollisionAudit?: {
    file: string; sha256: string; totalPairs: number; candidatePairs: number;
    unresolvedPairs: number; volumeThresholdMm3: number;
  } | null;
};

type DynamicSpinEvidence = {
  schema: string;
  sourceSTEPsha256: string;
  sourceManifestSha256: string;
  baselineAuditSha256: string;
  wheelDegrees: number[];
  passedSampledWheelSpin: boolean;
  totalExactBrepOperations: number;
  intersectionThresholdMm3: number;
  unresolvedCollisions: Array<{ angle?: number; a?: string; b?: string; volumeMm3?: number }>;
  booleanErrors: Array<{ angle?: number; a?: string; b?: string; error?: string }>;
  poses: Array<{ wheelAngleDeg: number; collisionCount: number; booleanErrorCount?: number; status: string }>;
};

type P26SteeringAudit = {
  schema: string;
  sourceSTEPsha256: string;
  sourceManifestSha256: string;
  validCadSolids: number;
  sampledSteeringPass: boolean;
  thresholdMm3: number;
  exactPairs: number;
  poses: Array<{
    steerDeg: number;
    exactBrepPairs: number;
    collisionCount: number;
    booleanErrorCount: number;
    status: string;
  }>;
};

type StaticFitEvidence = {
  schema: string; sourcePartCount: number; sourceSTEPsha256: string;
  roundtripCadSolids: number; roundtripCadFaces: number; totalPairs: number;
  candidatePairs: number; broadphaseRejectedPairs: number;
  unresolvedPairs: Array<{ a?: string; b?: string; error?: string }>;
  volumeThresholdMm3: number; allStaticPairsPass: boolean;
};


function assertSelfContainedGLB(bytes: ArrayBuffer) {
  if (bytes.byteLength < 20) throw new Error('GLB file too short.');
  const data = new DataView(bytes);
  if (data.getUint32(0, true) !== 0x46546c67 ||
      data.getUint32(4, true) !== 2 ||
      data.getUint32(8, true) !== bytes.byteLength ||
      data.getUint32(16, true) !== 0x4e4f534a) {
    throw new Error('Expected a valid, self-contained glTF v2 binary (.glb).');
  }
  const jsonLength = data.getUint32(12, true);
  if (jsonLength + 20 > bytes.byteLength) throw new Error('Invalid embedded GLB JSON chunk.');
  const header = JSON.parse(new TextDecoder().decode(bytes.slice(20, 20 + jsonLength))) as {
    images?: { uri?: string }[];
    buffers?: { uri?: string }[];
  };
  const externals = [...(header.images ?? []), ...(header.buffers ?? [])]
    .filter((resource) => resource.uri && !resource.uri.startsWith('data:'));
  if (externals.length > 0) {
    throw new Error('External texture/buffer URLs are blocked. Export a self-contained GLB.');
  }
}

async function verifyLocalManifest(file: File, data: ArrayBuffer, manifest: VerifiedManifest | null) {
  if (!manifest) return 'UNVERIFIED SOURCE — LOCAL ONLY';
  const proof = Object.values(manifest.profiles ?? {}).find((entry) => entry.file === file.name);
  if (!proof) return 'MANIFEST DOES NOT MATCH SELECTED FILE';
  if (data.byteLength !== proof.bytes) return 'FILE LENGTH MISMATCH';
  if (!crypto.subtle) return 'SHA-256 UNAVAILABLE';
  const digest = await crypto.subtle.digest('SHA-256', data);
  const actual = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  return actual.toLowerCase() === proof.sha256.toLowerCase()
    ? 'SHA-256 MATCH — LICENSING SEPARATE'
    : 'SHA-256 MISMATCH';
}

function inspectGlb(model: THREE.Group, filename: string): P2CadScene {
  const usedNames = new Map<string, number>();
  const components: { id: string; name: string; triangles: number }[] = [];
  let triangles = 0;
  let meshCount = 0;
  model.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    meshCount += 1;
    const geometry = node.geometry;
    const perMesh = geometry.index?.count
      ? Math.floor(geometry.index.count / 3)
      : Math.floor((geometry.getAttribute('position')?.count ?? 0) / 3);
    triangles += perMesh;
    const base = node.name.trim() || `CAD_MESH_${meshCount}`;
    const seen = usedNames.get(base) ?? 0;
    usedNames.set(base, seen + 1);
    node.name = seen ? `${base}__${seen + 1}` : base;
    components.push({ id: node.name, name: base, triangles: perMesh });
  });
  if (meshCount === 0) throw new Error('No mesh objects found in the selected GLB.');
  return { model, name: filename, meshCount, triangles, components };
}

export default function P2CadLabPage() {
  const [scene, setScene] = useState<P2CadScene | null>(null);
  const [sourceQuality, setSourceQuality] = useState<P2DisplayQuality>('BALANCED');
  const [renderMetrics, setRenderMetrics] = useState<P2RenderMetrics | null>(null);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [isolate, setIsolate] = useState(false);
  const [explode, setExplode] = useState(0);
  const [section, setSection] = useState(false);
  const [sectionOffsetMm, setSectionOffsetMm] = useState(0);
  const [partFilter, setPartFilter] = useState('');
  const [loadState, setLoadState] = useState('NO CAD LOADED');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [manifest, setManifest] = useState<VerifiedManifest | null>(null);
  const [manifestName, setManifestName] = useState('');
  const [fitAudit, setFitAudit] = useState<StaticFitEvidence | null>(null);
  const [fitAuditName, setFitAuditName] = useState('');
  const [fitAuditSha, setFitAuditSha] = useState('');
  const [manifestSha, setManifestSha] = useState('');
  const [wheelAngleDeg, setWheelAngleDeg] = useState(0);
  const [steerAngleDeg, setSteerAngleDeg] = useState(0);
  const [steeringAudit, setSteeringAudit] = useState<P26SteeringAudit | null>(null);
  const [cinematic, setCinematic] = useState(false);
  const [filmProgress, setFilmProgress] = useState(0);
  const [filmPlaying, setFilmPlaying] = useState(false);
  const [cinemaFocusPart, setCinemaFocusPart] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [dynamicAudit, setDynamicAudit] = useState<DynamicSpinEvidence | null>(null);
  const [dynamicAuditName, setDynamicAuditName] = useState('');
  const request = useRef(0);

  const onModel = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const id = ++request.current;
    setError('');
    setBusy(true);
    setScene(null);
    setSourceQuality('BALANCED');
    setRenderMetrics(null);
    setSelectedPart(null);
    setIsolate(false);
    setExplode(0);
    setWheelAngleDeg(0);
    setSteerAngleDeg(0);
    setSteeringAudit(null);
    setCinematic(false);
    setFilmPlaying(false);
    setFilmProgress(0);
    setCinemaFocusPart(null);
    setSection(false);
    setSectionOffsetMm(0);
    setPartFilter('');
    setLoadState('READING SOURCE CAD MESH');
    try {
      if (!file.name.toLowerCase().endsWith('.glb')) {
        throw new Error('STEP is the editable CAD master. Select its converted .glb preview here.');
      }
      if (file.size > MAX_FILE_BYTES) throw new Error('Local preview limit: 150 MB per GLB.');
      const bytes = await file.arrayBuffer();
      assertSelfContainedGLB(bytes);
      const identity = await verifyLocalManifest(file, bytes, manifest);
      if (manifest && identity !== 'SHA-256 MATCH — LICENSING SEPARATE') {
        throw new Error(`${identity}. Refusing unverified CAD preview.`);
      }
      await MeshoptDecoder.ready;
      const loader = new GLTFLoader();
      loader.setMeshoptDecoder(MeshoptDecoder);
      const result = await loader.parseAsync(bytes, '');
      if (id !== request.current) {
        result.scene.traverse((node) => {
          if (node instanceof THREE.Mesh) {
            node.geometry.dispose();
          }
        });
        return;
      }
      const inspected = inspectGlb(result.scene, file.name);
      const sourceParts = manifest?.partIds ?? manifest?.parts;
      if (sourceParts) {
        const expected = new Set(sourceParts);
        const found = new Set(inspected.components.map((part) => part.name));
        if (expected.size !== found.size ||
            inspected.components.length !== sourceParts.length ||
            [...expected].some((part) => !found.has(part))) {
          throw new Error('P2.3 named CAD solid hierarchy mismatch. Refusing preview.');
        }
      }
      const tier = Object.entries(manifest?.profiles ?? {}).find(([, entry]) => entry.file === file.name)?.[0];
      setSourceQuality(tier === 'HIGH' || tier === 'BALANCED' || tier === 'PERFORMANCE' ? tier : 'BALANCED');
      setScene(inspected);
      setLoadState(identity);
    } catch (caught) {
      if (id === request.current) {
        setError(caught instanceof Error ? caught.message : 'Unknown CAD preview failure.');
        setLoadState('SOURCE NOT LOADED');
      }
    } finally {
      if (id === request.current) setBusy(false);
      event.target.value = '';
    }
  }, [manifest]);

  const onManifest = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const bytes = await file.arrayBuffer();
      if (bytes.byteLength > 5 * 1024 * 1024) throw new Error('Manifest is too large.');
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      const hash = Array.from(new Uint8Array(digest), (v) => v.toString(16).padStart(2, '0')).join('');
      const candidate = JSON.parse(new TextDecoder().decode(bytes)) as VerifiedManifest;
      if (!candidate.schema?.startsWith('podium-eds.p2.cad-first.')) {
        throw new Error('Manifest is not a recognized P2 CAD-first source record.');
      }
      // A newly selected manifest invalidates the previous source preview,
      // even when both CAD sources happen to contain exactly 53 meshes.
      request.current += 1;
      setBusy(false);
      setScene(null);
      setSelectedPart(null);
      setSourceQuality('BALANCED');
      setRenderMetrics(null);
      setExplode(0);
      setIsolate(false);
      setSection(false);
      setSteerAngleDeg(0);
      setSteeringAudit(null);
      setManifest(candidate);
      setManifestName(file.name);
      setManifestSha(hash);
      setFitAudit(null);
      setFitAuditName('');
      setFitAuditSha('');
      setDynamicAudit(null);
      setDynamicAuditName('');
      setWheelAngleDeg(0);
      setSteerAngleDeg(0);
      setCinematic(false);
      setFilmPlaying(false);
      setFilmProgress(0);
      setCinemaFocusPart(null);
      setLoadState('MANIFEST LOADED — RESELECT GLB TO VERIFY');
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Manifest parse error.');
    } finally {
      event.target.value = '';
    }
  }, []);

  const onFitAudit = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFitAudit(null);
    setFitAuditName('');
    setFitAuditSha('');
    setDynamicAudit(null);
    setDynamicAuditName('');
    try {
      const expected = manifest?.staticCollisionAudit;
      if (!expected) throw new Error('Select the P2.4 source manifest before loading its fit audit.');
      if (file.name !== expected.file) throw new Error('Audit filename differs from the manifest.');
      const bytes = await file.arrayBuffer();
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      const actual = Array.from(new Uint8Array(digest), (x) => x.toString(16).padStart(2, '0')).join('');
      if (actual !== expected.sha256.toLowerCase()) throw new Error('Static fit audit SHA-256 mismatch.');
      const proof = JSON.parse(new TextDecoder().decode(bytes)) as StaticFitEvidence;
      const n = manifest?.totalCadSolids ?? 0;
      if (proof.schema !== 'podium-eds.p2.cad-first.static-fit-audit.v1' ||
          proof.sourcePartCount !== n || proof.roundtripCadSolids !== n ||
          proof.sourceSTEPsha256 !== manifest?.masterSTEPsha256 ||
          proof.totalPairs !== n * (n - 1) / 2 ||
          proof.totalPairs !== proof.candidatePairs + proof.broadphaseRejectedPairs ||
          proof.totalPairs !== expected.totalPairs ||
          proof.candidatePairs !== expected.candidatePairs ||
          proof.volumeThresholdMm3 !== expected.volumeThresholdMm3 ||
          proof.unresolvedPairs.length !== 0 || expected.unresolvedPairs !== 0 ||
          !proof.allStaticPairsPass) {
        throw new Error('Audit values are inconsistent with the selected CAD source.');
      }
      setFitAudit(proof);
      setFitAuditName(file.name);
      setFitAuditSha(actual);
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Local static audit rejected.');
    } finally {
      event.target.value = '';
    }
  }, [manifest]);

  const onDynamicAudit = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setDynamicAudit(null);
    setDynamicAuditName('');
    try {
      if (!manifestSha || !fitAuditSha || !fitAudit) {
        throw new Error('Verify the P2.4 manifest and static audit before loading P2.5 motion evidence.');
      }
      if (file.size > 2 * 1024 * 1024) throw new Error('Dynamic audit exceeds 2 MB.');
      const proof = JSON.parse(await file.text()) as DynamicSpinEvidence;
      const angles = proof.wheelDegrees;
      if (proof.schema !== 'podium-eds.p2.cad-first.dynamic-spin.v1' ||
          proof.sourceSTEPsha256 !== manifest?.masterSTEPsha256 ||
          proof.sourceManifestSha256 !== manifestSha ||
          proof.baselineAuditSha256 !== fitAuditSha ||
          !Array.isArray(angles) || !Array.isArray(proof.poses) ||
          angles.length < 2 || angles.length > 360 ||
          proof.poses.length !== angles.length ||
          new Set(angles).size !== angles.length ||
          angles.some((a) => !Number.isInteger(a) || a < 0 || a >= 360) ||
          !angles.every((a, index) => proof.poses[index].wheelAngleDeg === a) ||
          !Number.isFinite(proof.totalExactBrepOperations) ||
          proof.totalExactBrepOperations < 1 ||
          !Array.isArray(proof.unresolvedCollisions) ||
          !Array.isArray(proof.booleanErrors)) {
        throw new Error('Dynamic CAD report does not match the selected STEP/manifest/static audit.');
      }
      setDynamicAudit(proof);
      setDynamicAuditName(file.name);
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Dynamic CAD report rejected.');
    } finally {
      event.target.value = '';
    }
  }, [manifest, manifestSha, fitAuditSha, fitAudit]);

  const canSpinP24 = Boolean(
    scene && manifest?.schema === 'podium-eds.p2.cad-first.front-corner.fit.v1' &&
    manifest.partIds?.length === 53 && scene.meshCount === 53
  );
  const onP26Audit = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSteeringAudit(null);
    try {
      if (manifest?.schema !== 'podium-eds.p2.cad-first.steer-machined.v1' ||
          !manifestSha || !manifest.sourceSTEPsha256) {
        throw new Error('Select the original P2.6 source manifest first.');
      }
      if (file.size > 2 * 1024 * 1024) throw new Error('P2.6 audit exceeds 2 MB.');
      const audit = JSON.parse(await file.text()) as P26SteeringAudit;
      const angles = [-8,-6,-4,-2,0,2,4,6,8];
      if (audit.schema !== 'podium-eds.p2.cad-first.steering-audit.v1' ||
          audit.sourceSTEPsha256 !== manifest.sourceSTEPsha256 ||
          audit.sourceManifestSha256 !== manifestSha ||
          audit.validCadSolids !== 53 ||
          audit.poses?.length !== angles.length ||
          !angles.every((angle,i) =>
            audit.poses[i]?.steerDeg === angle &&
            audit.poses[i].collisionCount === 0 &&
            audit.poses[i].booleanErrorCount === 0 &&
            audit.poses[i].exactBrepPairs >= 0
          ) ||
          audit.exactPairs !== audit.poses.reduce((sum,pose)=>sum+pose.exactBrepPairs,0) ||
          !Number.isFinite(audit.exactPairs) || audit.exactPairs < 1 ||
          !audit.sampledSteeringPass || audit.thresholdMm3 !== 0.05) {
        throw new Error('P2.6 steering evidence is incomplete or mismatched with the source STEP.');
      }
      setSteeringAudit(audit);
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'P2.6 audit rejected.');
    } finally {
      event.target.value = '';
    }
  },[manifest,manifestSha]);

  const canSteerP26 = Boolean(
    scene && manifest?.schema === 'podium-eds.p2.cad-first.steer-machined.v1' &&
    manifest.parts?.length === 53 && scene.meshCount === 53
  );
  const canCinematic = Boolean(scene && manifest &&
    (canSpinP24 || canSteerP26) && !busy);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const set = () => { setReducedMotion(media.matches); if(media.matches) setFilmPlaying(false); };
    set();
    media.addEventListener('change', set);
    return () => media.removeEventListener('change', set);
  }, []);

  useEffect(() => {
    if(!filmPlaying || !cinematic || reducedMotion) return;
    let raf=0;
    let previous:number|null=null;
    const tick=(now:number)=>{
      const delta=previous===null?0:Math.min((now-previous)/1000,.10);
      previous=now;
      setFilmProgress((t)=>Math.min(1,t+delta/P2_CINEMA_DURATION_SECONDS));
      raf=window.requestAnimationFrame(tick);
    };
    raf=window.requestAnimationFrame(tick);
    return ()=>window.cancelAnimationFrame(raf);
  },[filmPlaying,cinematic,reducedMotion]);

  useEffect(()=>{
    if(filmProgress>=1 && filmPlaying)setFilmPlaying(false);
  },[filmProgress,filmPlaying]);

  const filmFrame=p2FilmFrame(filmProgress);
  const steeringMate=p2SteeringMate(steerAngleDeg);
  const precisionProof = manifest?.geometryProof ?? manifest?.p23SourcePrecisionEvidence;

  return (
    <main className="p2-cad-lab">
      <header className="p2-cad-lab__header">
        <Link to="/">PODIUM EDS</Link>
        <span>ENGINEERING / P2 CAD-FIRST LAB</span>
        <span>LOCAL DESIGN REVIEW · NO PUBLIC DEPLOYMENT</span>
      </header>

      <section className="p2-cad-lab__intro">
        <span className="p2-cad-lab__eyebrow">ORIGINAL STATIC FIT / P2.4</span>
        <h1>GEOMETRY FIRST<span>.</span></h1>
        <p>
          Replace low-poly cosmetic details with inspectable CAD bodies, mechanical
          part hierarchy and controlled levels of detail. Import a local GLB generated
          from an authorized STEP assembly. No upload or third-party model substitution.
        </p>
      </section>

      <section className={cinematic ? 'p2-cad-lab__layout p2-cad-lab__layout--cinema' : 'p2-cad-lab__layout'}>
        <div className={cinematic
            ? ['p2-cad-lab__viewport','p2-cad-lab__viewport--cinema',filmFrame.blueprint>.5&&'p2-cad-lab__viewport--blueprint'].filter(Boolean).join(' ')
            : 'p2-cad-lab__viewport'} aria-label="CAD source preview">
          {scene ? (
            <Suspense fallback={<div className="p2-cad-lab__empty">INITIALIZING LOCAL CAD VIEWER</div>}>
              <P2CadViewer
                key={scene.name} scene={scene} selectedPart={cinematic ? null : selectedPart}
                isolate={!cinematic && isolate} explode={cinematic ? 0 : explode}
                wheelAngleDeg={!cinematic && canSpinP24 ? wheelAngleDeg : 0}
                steerAngleDeg={!cinematic && canSteerP26 ? steerAngleDeg : 0}
                cinematic={cinematic} filmProgress={filmProgress} playing={filmPlaying}
                cinemaFocusPart={cinemaFocusPart} reducedMotion={reducedMotion}
                quality={sourceQuality}
                onMetrics={setRenderMetrics}
                onContextLost={()=>{
                  setFilmPlaying(false);
                  setError('WebGL context lost. Graphics resources must be reloaded before further visual review.');
                }}
                section={!cinematic && section} sectionOffsetMm={sectionOffsetMm}
              />
            </Suspense>
          ) : (
            <div className="p2-cad-lab__empty">
              <span>NO MODEL B / NO FAKED CAD</span>
              <strong>OPEN REAL CAD GEOMETRY</strong>
              <p>STEP / B-Rep remains the engineering master. Only a generated GLB is rendered here.</p>
            </div>
          )}
          {cinematic && scene && (
            <div className="p2-cad-lab__film">
              <div className="p2-cad-lab__film-vignette" style={{opacity:filmFrame.blueprint>.5?0:0.65}} aria-hidden="true"/>
              <div className="p2-cad-lab__film-heading" aria-live="off">
                <span>CAD-FIRST FILM / {Math.floor(filmProgress*100).toString().padStart(2,'0')}%</span>
                <strong>{cinemaFocusPart ? P2_MACRO_PARTS.find((x)=>x.id===cinemaFocusPart)?.label ?? 'CAD MACRO' : filmFrame.shot.title}</strong>
                <small>{cinemaFocusPart ? P2_MACRO_PARTS.find((x)=>x.id===cinemaFocusPart)?.detail ?? 'SOURCE MESH' : filmFrame.shot.detail}</small>
              </div>
              <div className="p2-cad-lab__film-controls">
                <button type="button" onClick={()=>{setFilmPlaying(false);setCinemaFocusPart(null);setCinematic(false);}}
                  aria-label="Exit cinematic view">EXIT FILM</button>
                <button type="button" onClick={()=>{
                  if(filmProgress>=1)setFilmProgress(0);
                  setCinemaFocusPart(null);
                  setFilmPlaying((value)=>!value);
                }} disabled={reducedMotion} aria-label={filmPlaying?'Pause film':'Play film'}>
                  {filmPlaying?'PAUSE':'PLAY'} 
                </button>
                <input aria-label="Cinematic timeline" type="range" min={0} max={1000}
                  value={Math.round(filmProgress*1000)}
                  onChange={(e)=>{setFilmPlaying(false);setCinemaFocusPart(null);setFilmProgress(Number(e.target.value)/1000);}}/>
                <span>{Math.round(filmProgress*P2_CINEMA_DURATION_SECONDS)}s / {P2_CINEMA_DURATION_SECONDS}s</span>
              </div>
              <div className="p2-cad-lab__macro-selector" role="group" aria-label="Inspect genuine CAD components">
                <button type="button" aria-pressed={cinemaFocusPart === null}
                  onClick={()=>setCinemaFocusPart(null)}>RETURN TO FILM</button>
                {P2_MACRO_PARTS.filter((part)=>scene.components.some((mesh)=>mesh.name===part.id)).map((part)=>(
                  <button type="button" key={part.id} aria-pressed={cinemaFocusPart===part.id}
                    title={part.detail} onClick={()=>{
                      setFilmPlaying(false);
                      setFilmProgress((p)=>Math.max(p,.51));
                      setCinemaFocusPart(part.id);
                    }}>{part.label}</button>
                ))}
              </div>
              {filmPlaying && renderMetrics && (
                <div className="p2-cad-lab__film-metrics" aria-label="Actual WebGL browser metrics">
                  <span>LIVE / {sourceQuality}</span>
                  <span>{renderMetrics.fps.toFixed(1)} FPS</span>
                  <span>{renderMetrics.calls} DRAWS</span>
                  <span>{renderMetrics.triangles.toLocaleString()} TRIS</span>
                  <span>DPR {renderMetrics.dpr.toFixed(2)}</span>
                </div>
              )}
              <div className="p2-cad-lab__film-chapters" aria-label="Cinema chapters">
                {P2_CINEMA_SHOTS.slice(0,-1).map((shot,i)=>(
                  <button type="button" key={shot.at} aria-pressed={filmFrame.shotIndex===i}
                    onClick={()=>{setFilmPlaying(false);setCinemaFocusPart(null);setFilmProgress(shot.at);}}>
                    {String(i+1).padStart(2,'0')}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="p2-cad-lab__stage-tag">{loadState}</div>
          {error && <div className="p2-cad-lab__error" role="alert">{error}</div>}
        </div>

        <aside className="p2-cad-lab__inspector">
          <div className="p2-cad-lab__eyebrow">01 / SOURCE IMPORT</div>
          <h2>CAD INTAKE</h2>
          <p>Files stay in browser memory. For the project-authored P2.4/P2.6 front corner, load its manifest and any matching HIGH / BALANCED / PERFORMANCE GLB. The B-Rep master is the separate STEP file.</p>
          <label className="p2-cad-lab__upload">
            LOAD SOURCE MANIFEST (.JSON)
            <input type="file" accept=".json,application/json" onChange={onManifest}/>
          </label>
          <span className="p2-cad-lab__filename">{manifestName || 'No identity manifest selected'}</span>
          <label className="p2-cad-lab__upload p2-cad-lab__upload--primary">
            {busy ? 'IMPORTING…' : 'OPEN LOCAL CAD PREVIEW (.GLB)'}
            <input type="file" accept=".glb,model/gltf-binary" onChange={onModel} disabled={busy}/>
          </label>
          <button type="button" className="p2-cad-lab__launch-film"
            disabled={!canCinematic}
            aria-pressed={cinematic}
            onClick={()=>{
              setCinematic(true);setFilmPlaying(false);setFilmProgress(0);setCinemaFocusPart(null);
              setSteerAngleDeg(0);setWheelAngleDeg(0);setExplode(0);
              setSelectedPart(null);setIsolate(false);setSection(false);
            }}>
            CINEMATIC SOURCE FILM / P3
          </button>
          <div className="p2-cad-lab__stats">
            <div><span>CAD OBJECTS</span><strong>{scene?.meshCount ?? '—'}</strong></div>
            <div><span>TRIANGLES</span><strong>{scene?.triangles.toLocaleString() ?? '—'}</strong></div>
            <div><span>SOURCE RIGHTS</span><strong>{(manifest?.schema === 'podium-eds.p2.cad-first.front-corner.fit.v1' || manifest?.schema === 'podium-eds.p2.cad-first.steer-machined.v1') ? 'PROJECT-AUTHORED / RELEASE REVIEW' : 'NOT CLEARED'}</strong></div>
          </div>
          {manifest?.staticCollisionAudit && (
            <div className="p2-cad-lab__fit-audit" aria-label="P2.4 static collision evidence">
              <div className="p2-cad-lab__eyebrow">P2.4 / STATIC ASSEMBLY FIT</div>
              <label className="p2-cad-lab__upload">
                VERIFY LOCAL STATIC AUDIT (.JSON)
                <input type="file" accept=".json,application/json" onChange={onFitAudit}/>
              </label>
              {fitAudit ? (
                <>
                  <strong>{fitAudit.totalPairs.toLocaleString()} SOURCE PAIRS ACCOUNTED FOR</strong>
                  <span>{fitAudit.candidatePairs} exact B-Rep intersections · {fitAudit.broadphaseRejectedPairs} AABB exclusions</span>
                  <span>Zero unresolved overlap above {fitAudit.volumeThresholdMm3} mm³ at the neutral assembled pose</span>
                  <small>{fitAuditName} · SHA-256 matched to local manifest. Dynamic clearance, tolerances and stresses are NOT certified.</small>
                </>
              ) : (
                <p>Load the matching audit file to verify its SHA-256 and complete pair coverage. A manifest alone is not enough.</p>
              )}
            </div>
          )}
          <div className="p2-cad-lab__wheel-spin">
            <label htmlFor="p2-wheel-angle">
              <span>P2.5 / SAMPLED WHEEL SPIN</span>
              <strong>{wheelAngleDeg}°</strong>
            </label>
            <input id="p2-wheel-angle" type="range" min={0} max={359} step={1}
              value={wheelAngleDeg}
              disabled={!canSpinP24 || explode !== 0}
              onChange={(event) => setWheelAngleDeg(Number(event.target.value))}/>
            <p>Rotate the rigid wheel/rotor/fastener source solids about +Z. Bearing balls and cage use an illustrative half-angle orbit. Exploded view must be at 0% for this study.</p>
            <label className="p2-cad-lab__upload">
              LOAD P2.5 SAMPLED MOTION AUDIT (.JSON)
              <input type="file" accept=".json,application/json" onChange={onDynamicAudit}
                disabled={!fitAudit || !canSpinP24}/>
            </label>
            {dynamicAudit ? (
              <div className="p2-cad-lab__motion-evidence">
                <strong>{dynamicAudit.passedSampledWheelSpin &&
                  dynamicAudit.unresolvedCollisions.length === 0 &&
                  dynamicAudit.booleanErrors.length === 0
                    ? 'SAMPLED SPIN: PASS'
                    : 'SAMPLED SPIN: COLLISION / FAILURE'}</strong>
                <span>{dynamicAudit.wheelDegrees.length} discrete angular poses · {dynamicAudit.totalExactBrepOperations} exact B-Rep checks</span>
                <span>{dynamicAudit.unresolvedCollisions.length} reported collisions · {dynamicAudit.booleanErrors.length} Boolean errors</span>
                <small>{dynamicAuditName} · exact original manifest/static audit linked by SHA-256. Continuous motion, steer and suspension NOT certified.</small>
              </div>
            ) : (
              <p className="p2-cad-lab__motion-pending">No source-matched motion evidence loaded. Slider is a visual study, not a clearance PASS.</p>
            )}
          </div>
          {canSteerP26 && (
            <div className="p2-cad-lab__steer-control">
              <label className="p2-cad-lab__upload">
                LOAD P2.6 SOURCE-MATCHED STEERING AUDIT (.JSON)
                <input type="file" accept=".json,application/json" onChange={onP26Audit}/>
              </label>
              {steeringAudit ? (
                <div className="p2-cad-lab__motion-evidence" role="status">
                  <strong>9 SAMPLED STEERING POSES — NO REPORTED OVERLAP</strong>
                  <span>{steeringAudit.exactPairs} source B-Rep intersections · 53 original solids</span>
                  <small>Source/master manifest hashes match. Only sampled link-to-corner pairs checked; not a continuous, loaded, or certified mechanism.</small>
                </div>
              ) : (
                <small>Steering visualization is not a clearance certificate. Load its source-linked local audit to review sampled results.</small>
              )}
              <label htmlFor="p2-steer-angle">
                <span>P2.6 / STEERING LINKAGE</span>
                <strong>{steerAngleDeg.toFixed(1)}°</strong>
              </label>
              <input id="p2-steer-angle" type="range" min={-8} max={8} step={0.5}
                value={steerAngleDeg} disabled={explode!==0 || cinematic}
                onChange={(event)=>setSteerAngleDeg(Number(event.target.value))}/>
              <p>Length-conserving one-DOF kingpin study. Rack Z: {steeringMate.rackTravelZMm.toFixed(2)} mm. Tie-rod residual: {steeringMate.tieLengthErrorMm.toExponential(1)} mm.</p>
              <small>Source steering-relief CAD only. No suspension bump/rebound, true tie joints, continuous sweep or manufacturing signoff.</small>
            </div>
          )}
          <div className="p2-cad-lab__eyebrow">02 / REAL GEOMETRY</div>
          <div className="p2-cad-lab__section-control">
            <button type="button" aria-pressed={section} disabled={!scene}
              onClick={() => setSection((current) => !current)}>
              {section ? 'EXIT AXIAL SECTION VIEW' : 'INSPECT INTERNAL SECTION'}
            </button>
            {section && (
              <label htmlFor="p2-cad-section-offset">
                SECTION PLANE Y / {sectionOffsetMm} mm
                <input id="p2-cad-section-offset" type="range" min={-100} max={100} step={1}
                  value={sectionOffsetMm}
                  onChange={(event) => setSectionOffsetMm(Number(event.target.value))}/>
                <span>GPU clipping; not a filled CAD cross-section or a collision certificate.</span>
              </label>
            )}
          </div>
          {precisionProof && (
            <div className="p2-cad-lab__precision-evidence" aria-label="P2.3 CAD proof">
              <strong>PRECISION B-REP / P2.3</strong>
              <span>SOURCE SOLIDS: {manifest.totalCadSolids ?? '—'}</span>
              <span>HELICAL GROOVE: {precisionProof.nutHelicalGrooveVolumeMm3?.toFixed(1) ?? '—'} mm³ REMOVED</span>
              <span>BEARING BALL / GROOVE GAP: {precisionProof.nominalBearingBallGrooveClearanceMm ?? '—'} mm</span>
              <span>PISTON / CYLINDER GAP: {precisionProof.pistonBoreRadialClearanceMm ?? '—'} mm</span>
              <span>CHECKED PAIR MAX OVERLAP: {Math.max(
                precisionProof.studNutIntersectionMm3 ?? 0,
                precisionProof.maxBallRaceIntersectionMm3 ?? 0,
                precisionProof.maxBallRetainerIntersectionMm3 ?? 0,
                precisionProof.largestPistonHousingIntersectionMm3 ?? 0
              ).toFixed(4)} mm³</span>
              <small>Evidence comes from a selected local manifest. Not an independent browser CAD test; neither physical fit nor full assembly is certified.</small>
            </div>
          )}
          <div className="p2-cad-lab__explode-control">
            <label htmlFor="p2-cad-explode">
              <span>EXPLODED CAD STUDY</span>
              <strong>{Math.round(explode * 100)}%</strong>
            </label>
            <input
              id="p2-cad-explode"
              type="range" min={0} max={100} step={1}
              disabled={!scene}
              value={Math.round(explode * 100)}
              onChange={(event) => {
                const next = Number(event.target.value) / 100;
                setExplode(next);
                if (next > 0) setWheelAngleDeg(0);
              }}
            />
            <p>Illustrative editorial separation of original CAD solids, not a verified servicing sequence.</p>
          </div>
          <label className="p2-cad-lab__search">
            FILTER COMPONENTS
            <input
              type="search" value={partFilter}
              placeholder="hub / brake / ball / fastener"
              onChange={(event) => setPartFilter(event.target.value)}
            />
          </label>
          <button
            type="button"
            className="p2-cad-lab__isolate"
            aria-pressed={isolate}
            disabled={!scene || !selectedPart}
            onClick={() => setIsolate((value) => !value)}
          >
            {isolate ? 'SHOW ALL CAD SOLIDS' : 'ISOLATE SELECTED SOLID'}
          </button>
          <div className="p2-cad-lab__parts" role="group" aria-label="CAD part selection">
            <button type="button" aria-pressed={!selectedPart} onClick={() => setSelectedPart(null)}>
              ALL COMPONENTS
            </button>
            {scene?.components.filter((part) => part.name.toLowerCase().includes(partFilter.toLowerCase())).map((part) => (
              <button type="button" key={part.id}
                aria-pressed={selectedPart === part.id}
                onClick={() => setSelectedPart(part.id)}>
                <span>{part.name}</span><small>{part.triangles.toLocaleString()} Δ</small>
              </button>
            ))}
          </div>
        </aside>
      </section>

      <section className="p2-cad-lab__candidates">
        <div>
          <span className="p2-cad-lab__eyebrow">03 / CANDIDATE SOURCE REGISTRY</span>
          <h2>REAL CAD. VERIFIED RIGHTS.</h2>
          <p>Registry reviewed 06 Nov 2026. CAD existence, part detail and publication rights are separate gates. None of these external models is approved for public use.</p>
        </div>
        <div className="p2-cad-lab__candidate-grid">
          {sourceRegistry.candidates.map((candidate) => (
            <article key={candidate.id}>
              <small>{candidate.type}</small>
              <h3>{candidate.name}</h3>
              <strong>{candidate.rightsStatus}</strong>
              <p>{candidate.geometryStatus}</p>
              <p>{candidate.geometryEvidence}</p>
              <p>{candidate.rightsReason}</p>
              <a href={candidate.source} target="_blank" rel="noopener noreferrer">SOURCE / CAD REPOSITORY</a>
              <a href={candidate.licenseUrl} target="_blank" rel="noopener noreferrer">SOURCE LICENSING</a>
            </article>
          ))}
        </div>
        <p className="p2-cad-lab__disclaimer">
          P2.2 now includes a project-authored 49-solid formula-style front-left wheel assembly with real B-Rep source geometry, a swept external thread, and drilled rotor geometry. It does not reproduce certified Formula 1 components, proven female-thread engagement, OEM dimensions, or a validated physical wheel-bearing mechanism.
        </p>
      </section>
    </main>
  );
}
