import * as THREE from 'three';

type GeometryRecord = {
  uuid: string;
  name: string;
  owner: string;
  registeredAt: number;
  disposedAt: number | null;
  disposeCalls: number;
};

type ProbeEvent = {
  index: number;
  at: number;
  type: string;
  detail?: Record<string, string | number | boolean | null>;
};

const enabled = import.meta.env.DEV && new URLSearchParams(location.search).get('resourceTiming') === '1';
const geometries = new Map<string, GeometryRecord>();
const materials = new Map<string, { uuid: string; name: string; registeredAt: number; disposedAt: number | null; disposeCalls: number }>();
const events: ProbeEvent[] = [];
const liveBuffers = new Map<WebGLBuffer, { id: number; at: number; phase: string }>();
let eventIndex = 0;
let bufferIndex = 0;
let buffersCreated = 0;
let buffersDeleted = 0;
let buffersInvalidated = 0;
let contextEpoch = 0;
let phase = 'startup';
let installed = false;
let memory: (() => { geometries: number; textures: number; programs: number }) | null = null;
let rendererPrograms: (() => {id:number;usedTimes:number;cacheKey:string}[]) | null = null;
const everVisible = new Set<string>();

function record(type: string, detail?: ProbeEvent['detail']) {
  if (!enabled) return;
  events.push({ index: ++eventIndex, at: performance.now(), type, detail });
  if (events.length > 60000) events.splice(0, 10000);
}

export function setResourcePhase(value: string) {
  if (enabled) phase = value;
}

export function trackGeometry(geometry: THREE.BufferGeometry, name: string, owner: string) {
  if (!enabled || geometries.has(geometry.uuid)) return;
  const item: GeometryRecord = { uuid: geometry.uuid, name, owner, registeredAt: performance.now(), disposedAt: null, disposeCalls: 0 };
  geometries.set(geometry.uuid, item);
  record('geometry-register', { uuid: item.uuid, name, owner });
  geometry.addEventListener('dispose', () => {
    item.disposeCalls++;
    item.disposedAt = performance.now();
    record('geometry-dispose', { uuid: item.uuid, owner, calls: item.disposeCalls });
  });
}

export function trackModelGeometries(model: THREE.Object3D, owner: string) {
  if (!enabled) return;
  model.traverse(object => {
    if (object instanceof THREE.Mesh) trackGeometry(object.geometry, object.name, owner);
  });
}

export function trackMaterial(material: THREE.Material) {
  if (!enabled || materials.has(material.uuid)) return;
  const item = { uuid: material.uuid, name: material.name || material.type, registeredAt: performance.now(), disposedAt: null as number | null, disposeCalls: 0 };
  materials.set(item.uuid, item);
  record('material-register', { uuid: item.uuid, name: item.name });
  material.addEventListener('dispose', () => {
    item.disposeCalls++;
    item.disposedAt = performance.now();
    record('material-dispose', { uuid: item.uuid, calls: item.disposeCalls });
  });
}

export function installResourceProbe(renderer: THREE.WebGLRenderer) {
  if (!enabled || installed) return;
  installed = true;
  const gl = renderer.getContext() as WebGL2RenderingContext;
  memory = () => ({
    geometries: renderer.info.memory.geometries,
    textures: renderer.info.memory.textures,
    programs: renderer.info.programs?.length ?? 0,
  });
  rendererPrograms = () => (renderer.info.programs ?? []).map(program => ({ id: program.id, usedTimes: program.usedTimes, cacheKey: program.cacheKey }));
  const nativeCreate = gl.createBuffer.bind(gl);
  const nativeDelete = gl.deleteBuffer.bind(gl);
  gl.createBuffer = () => {
    const buffer = nativeCreate();
    if (buffer) {
      const id = ++bufferIndex;
      buffersCreated++;
      liveBuffers.set(buffer, { id, at: performance.now(), phase });
      record('buffer-create', { id, phase });
    }
    return buffer;
  };
  gl.deleteBuffer = (buffer: WebGLBuffer | null) => {
    if (buffer) {
      const item = liveBuffers.get(buffer);
      if (item) {
        buffersDeleted++;
        liveBuffers.delete(buffer);
        record('buffer-delete', { id: item.id, origin: item.phase, phase });
      } else record('buffer-delete-untracked', { phase });
    }
    nativeDelete(buffer);
  };
  renderer.domElement.addEventListener('webglcontextlost', () => {
    const count = liveBuffers.size;
    buffersInvalidated += count;
    liveBuffers.clear();
    contextEpoch++;
    record('context-buffers-invalidated', { count, contextEpoch });
  });
  renderer.domElement.addEventListener('webglcontextrestored', () => record('context-buffer-recreated', { contextEpoch }));
  record('probe-install', { renderer: renderer.info.render.calls });
  (window as Window & { __ITM_F1_RESOURCES__?: { read: typeof readResourceProbe } }).__ITM_F1_RESOURCES__ = { read: readResourceProbe };
}

export function noteRender(scene: THREE.Object3D, profile: string, render: () => void) {
  if (!enabled) { render(); return; }
  scene.traverseVisible(object => {
    if (!(object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points)) return;
    trackGeometry(object.geometry, object.name, `scene:${profile}`);
    const list = Array.isArray(object.material) ? object.material : [object.material];
    list.forEach(trackMaterial);
  });
  const before = memory?.();
  const beforeBuffer = liveBuffers.size;
  const priorPhase = phase;
  phase = `render:${profile}`;
  try { render(); }
  finally {
    phase = priorPhase;
    const after = memory?.();
    if (after && before && (after.geometries !== before.geometries || after.programs !== before.programs || liveBuffers.size !== beforeBuffer)) {
      const firstVisible: string[] = [];
      scene.traverseVisible(object => {
        const geometry = (object as THREE.Object3D & {geometry?: THREE.BufferGeometry}).geometry;
        if (!(geometry instanceof THREE.BufferGeometry)) return;
        if (!everVisible.has(geometry.uuid)) firstVisible.push(`${object.type}:${geometry.uuid}:${geometries.get(geometry.uuid)?.name??'untracked'}`);
        everVisible.add(geometry.uuid);
      });
      record('render-resource-change', {
        profile,
        geometriesBefore: before.geometries,
        geometriesAfter: after.geometries,
        programsBefore: before.programs,
        programsAfter: after.programs,
        buffersBefore: beforeBuffer,
        buffersAfter: liveBuffers.size,
        firstVisible: firstVisible.slice(0, 12).join(','),
      });
    }
  }
}

export function readResourceProbe(since = 0) {
  const active = [...geometries.values()].filter(item => item.disposedAt === null);
  const activeMaterials = [...materials.values()].filter(item => item.disposedAt === null);
  return {
    enabled,
    at: performance.now(),
    lastEventIndex: eventIndex,
    memory: memory?.() ?? null,
    geometry: { registered: geometries.size, live: active.length, disposed: geometries.size - active.length, active: active.map(item => ({ uuid: item.uuid, name: item.name, owner: item.owner })) },
    materials: { registered: materials.size, live: activeMaterials.length, disposed: materials.size - activeMaterials.length, active: activeMaterials.map(item => ({ uuid: item.uuid, name: item.name })) },
    programs: rendererPrograms?.() ?? [],
    buffers: { created: buffersCreated, deleted: buffersDeleted, invalidated: buffersInvalidated, contextEpoch, live: liveBuffers.size, active: [...liveBuffers.values()].map(item => ({ id: item.id, phase: item.phase, ageMs: performance.now() - item.at })) },
    events: events.filter(item => item.index > since),
  };
}
