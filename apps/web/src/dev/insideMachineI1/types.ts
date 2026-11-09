export type Lang = 'vi' | 'en';
export type QualityProfile = 'HIGH' | 'BALANCED' | 'PERFORMANCE';

export interface SemanticBase {
  id: string;
  node: string;
  originalLocalMatrix: number[][];
  originalWorldMatrix: number[][];
  pivotWorld: [number, number, number];
  label: Record<Lang, string>;
  description: Record<Lang, string>;
  provenance: string;
}

export interface AssemblyRecord extends SemanticBase {
  type: 'wheel' | 'wing' | 'bodywork' | 'underbody';
  globalExplodedOffset: [number, number, number];
  globalExplodedRotationEuler: [number, number, number];
  componentIds: string[];
}

export interface AssemblyComponent extends SemanticBase {
  parentAssemblyId: string;
  explodedOffset: [number, number, number];
  explodedRotationEuler: [number, number, number];
  animationOrder: number;
  materialReferences: string[];
}

export interface AssemblyManifest {
  schema: string;
  version: string;
  source: { path: string; sha256: string; bytes: number };
  assemblies: AssemblyRecord[];
  components: AssemblyComponent[];
  internalSystems?: Array<{
    id: string;
    parent: 'CHASSIS_CORE';
    pivotWorld: [number, number, number];
    componentIds: string[];
    label: Record<Lang, string>;
    description: Record<Lang, string>;
    provenance: string;
  }>;
  geometry: { triangles: number; meshObjects: number; dimensions: number[] };
  animation: { deterministic: boolean; reassemblyPass: boolean };
  reviewConnectors?: Array<{
    assemblyId: string;
    from: [number, number, number];
    offset: [number, number, number];
  }>;
}

export interface RuntimeMetrics {
  loadMs: number; fps: number; onePercentLowFps: number; p95FrameMs: number;
  drawCalls: number; triangles: number; geometries: number; textures: number; samples: number;
}

export interface LifecycleEvent {
  at: number;
  type: 'profile-request' | 'fetch-start' | 'fetch-ready' | 'decode-start' | 'parse-ready' | 'material-prep-start' | 'material-prep-ready' | 'decode-ready' | 'shader-precompile-start' | 'shader-precompile-ready' | 'focus-first-render-prepared' | 'swap' | 'first-render' | 'stale-dispose' | 'previous-dispose-start' | 'previous-dispose' | 'load-error' | 'context-lost' | 'context-restored';
  profile?: QualityProfile;
  detail?: string;
}

export interface RendererInfo {
  vendor: string; renderer: string; unmaskedVendor: string; unmaskedRenderer: string; hardwareAccelerated: boolean;
}

export interface StageEvidence {
  getTransforms: () => Record<string, { position: number[]; quaternion: number[]; scale: number[]; finite: boolean }>;
  getRendererInfo: () => RendererInfo;
  getScreenBounds: (scope?: 'model' | 'active-assembly' | 'active-component') => { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number; viewportWidth: number; viewportHeight: number; clipped: boolean };
  getSemanticBounds?: (id:string) => { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number; viewportWidth: number; viewportHeight: number; clipped: boolean;outside:boolean };
  getLifecycle: () => LifecycleEvent[];
  getStageState: () => { displayedProfile: QualityProfile | null; requestedProfile: QualityProfile; loading: boolean; hasVisibleModel: boolean; stageRenders: number };
  getCanvasStats: () => { width: number; height: number; dpr: number; shadowEnabled: boolean };
  getRuntimeDetails: () => { programs: number; drawCalls: number; triangles: number; geometries: number; textures: number; dpr: number; shadowMapEnabled: boolean };
  getRenderSamples?: () => { time: number; ms: number }[];
  getCamera?: () => { position: number[]; target: number[] } | null;
}
