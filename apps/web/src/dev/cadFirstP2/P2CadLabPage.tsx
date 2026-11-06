import { Suspense, lazy, useCallback, useRef, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'meshoptimizer';
import type { P2CadScene } from './P2CadViewer';
import sourceRegistry from './sourceRegistry.json';
import './p2CadLab.css';

const P2CadViewer = lazy(() => import('./P2CadViewer'));
const MAX_FILE_BYTES = 150 * 1024 * 1024;

type VerifiedManifest = {
  schema: string;
  profiles?: Record<string, { file: string; sha256: string; bytes: number; totalTriangles?: number }>;
  masterSTEP?: string;
  mechanicalTruth?: Record<string, boolean>;
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
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [isolate, setIsolate] = useState(false);
  const [loadState, setLoadState] = useState('NO CAD LOADED');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [manifest, setManifest] = useState<VerifiedManifest | null>(null);
  const [manifestName, setManifestName] = useState('');
  const request = useRef(0);

  const onModel = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const id = ++request.current;
    setError('');
    setBusy(true);
    setScene(null);
    setSelectedPart(null);
    setIsolate(false);
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
      setScene(inspectGlb(result.scene, file.name));
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
      const candidate = JSON.parse(await file.text()) as VerifiedManifest;
      if (!candidate.schema?.startsWith('podium-eds.p2.cad-first.')) {
        throw new Error('Manifest is not a recognized P2 CAD-first source record.');
      }
      setManifest(candidate);
      setManifestName(file.name);
      setLoadState('MANIFEST LOADED — RESELECT GLB TO VERIFY');
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Manifest parse error.');
    } finally {
      event.target.value = '';
    }
  }, []);

  return (
    <main className="p2-cad-lab">
      <header className="p2-cad-lab__header">
        <Link to="/">PODIUM EDS</Link>
        <span>ENGINEERING / P2 CAD-FIRST LAB</span>
        <span>LOCAL DESIGN REVIEW · NO PUBLIC DEPLOYMENT</span>
      </header>

      <section className="p2-cad-lab__intro">
        <span className="p2-cad-lab__eyebrow">SOURCE QUALIFICATION / P2.1</span>
        <h1>GEOMETRY FIRST<span>.</span></h1>
        <p>
          Replace low-poly cosmetic details with inspectable CAD bodies, mechanical
          part hierarchy and controlled levels of detail. Import a local GLB generated
          from an authorized STEP assembly. No upload or third-party model substitution.
        </p>
      </section>

      <section className="p2-cad-lab__layout">
        <div className="p2-cad-lab__viewport" aria-label="CAD source preview">
          {scene ? (
            <Suspense fallback={<div className="p2-cad-lab__empty">INITIALIZING LOCAL CAD VIEWER</div>}>
              <P2CadViewer key={scene.name} scene={scene} selectedPart={selectedPart} isolate={isolate}/>
            </Suspense>
          ) : (
            <div className="p2-cad-lab__empty">
              <span>NO MODEL B / NO FAKED CAD</span>
              <strong>OPEN REAL CAD GEOMETRY</strong>
              <p>STEP / B-Rep remains the engineering master. Only a generated GLB is rendered here.</p>
            </div>
          )}
          <div className="p2-cad-lab__stage-tag">{loadState}</div>
          {error && <div className="p2-cad-lab__error" role="alert">{error}</div>}
        </div>

        <aside className="p2-cad-lab__inspector">
          <div className="p2-cad-lab__eyebrow">01 / SOURCE IMPORT</div>
          <h2>CAD INTAKE</h2>
          <p>Files stay in browser memory. Loading a model is not proof of rights to publish it.</p>
          <label className="p2-cad-lab__upload">
            LOAD SOURCE MANIFEST (.JSON)
            <input type="file" accept=".json,application/json" onChange={onManifest}/>
          </label>
          <span className="p2-cad-lab__filename">{manifestName || 'No identity manifest selected'}</span>
          <label className="p2-cad-lab__upload p2-cad-lab__upload--primary">
            {busy ? 'IMPORTING…' : 'OPEN LOCAL CAD PREVIEW (.GLB)'}
            <input type="file" accept=".glb,model/gltf-binary" onChange={onModel} disabled={busy}/>
          </label>
          <div className="p2-cad-lab__stats">
            <div><span>CAD OBJECTS</span><strong>{scene?.meshCount ?? '—'}</strong></div>
            <div><span>TRIANGLES</span><strong>{scene?.triangles.toLocaleString() ?? '—'}</strong></div>
            <div><span>SOURCE RIGHTS</span><strong>NOT CLEARED</strong></div>
          </div>
          <div className="p2-cad-lab__eyebrow">02 / REAL GEOMETRY</div>
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
            {scene?.components.map((part) => (
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
          The local fastener demonstrator is independently authored educational CAD.
          It does not reproduce a certified Formula 1 center lock, licensed team design,
          manufacturing tolerance stack or verified wheel-bearing mechanism.
        </p>
      </section>
    </main>
  );
}
