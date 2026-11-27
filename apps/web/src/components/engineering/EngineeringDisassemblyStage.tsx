import { OrbitControls } from "@react-three/drei";
import {
  Canvas,
  useFrame,
  useThree,
  type ThreeEvent,
} from "@react-three/fiber";
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  ENGINEERING_FP04RB_GLB_URL,
  ENGINEERING_PARTS,
  type EngineeringPartSnapshot,
  type EngineeringTrackId,
} from "./engineeringDisassemblyData";
import {
  ENGINEERING_AERO_STREAMLINES,
  ENGINEERING_CFD_ZONES,
  resolveCfdZoneOpacities,
  type EngineeringAeroStreamlineSpec,
  type EngineeringCfdZoneId,
  type EngineeringCfdZoneOpacities,
} from "./engineeringAeroStreamlines";
import {
  applyMaterialXrayVisibility,
  disposeEngineeringInstanceMaterials,
  loadEngineeringGlbTemplate,
  resolveEngineeringMaterialSide,
  snapshotAuthoredMaterialState,
} from "./engineeringGlbLoader";
import { computeGlbLoadPercent } from "./engineeringCockpitTelemetry";
import {
  beginTimelineHandoff,
  createInitialSceneControlState,
  enterIsolatedControl,
  enterOrbitControl,
  resolvePlinthRetraction,
  stepSceneControlFrame,
  type EngineeringAnnotationProjection,
  type EngineeringControlMode,
  type EngineeringSceneControlState,
} from "./engineeringInteractionState";
import {
  applyLightRigStateToMutable,
  createMutableLightRigState,
  resolveMaterialClassEnvIntensity,
} from "./engineeringLightingRig";
import {
  evaluateEngineeringMotionDirector,
  resolveDirectorPartTransform,
  type EngineeringMotionCueSheet,
} from "./engineeringMotionDirector";
import {
  createMutableCameraFrame,
  evaluateCameraEasing,
  fitEngineeringCameraToBounds,
  fitEngineeringCameraToBoundsInto,
  interpolateEngineeringCameraFramesInto,
  shouldEnterEngineeringOrbitFromDrag,
  type EngineeringSafeViewRegion,
} from "./engineeringShotCamera";
import {
  evaluateEngineeringStoryTimeline,
  getEngineeringStoryShot,
  type EngineeringStoryEvaluation,
} from "./engineeringStoryTimeline";

export interface EngineeringLiveTimelineBridge {
  targetProgress: number;
  smoothedProgress: number;
  controlMode: EngineeringControlMode;
  handoffRequested: boolean;
  handoffClearSelection: boolean;
  stageActive: boolean;
  latestEvaluation?: EngineeringStoryEvaluation;
  /** Optional direct scene-to-scene camera arc for curated 12-scene show transitions. */
  cameraArc?: {
    readonly fromProgress: number;
    readonly toProgress: number;
    readonly progress: number;
  } | null;
  onControlModeChange?: (mode: EngineeringControlMode) => void;
  onEffectiveProgressSync?: (progress: number) => void;
  onStageActiveChange?: (active: boolean) => void;
  onAnnotationProject?: (projection: EngineeringAnnotationProjection) => void;
  requestRender?: () => void;
}

function consumeBridgeHandoff(
  bridge: EngineeringLiveTimelineBridge | undefined,
): { requested: boolean; clearSelection: boolean; targetProgress: number } {
  if (!bridge || !bridge.handoffRequested) {
    return { requested: false, clearSelection: false, targetProgress: 0 };
  }
  const clearSelection = bridge.handoffClearSelection;
  const targetProgress = bridge.targetProgress;
  bridge.handoffRequested = false;
  bridge.handoffClearSelection = false;
  return { requested: true, clearSelection, targetProgress };
}

function setBridgeStageActive(
  bridge: EngineeringLiveTimelineBridge | undefined,
  active: boolean,
): void {
  if (!bridge) return;
  bridge.stageActive = active;
  bridge.onStageActiveChange?.(active);
}

function bindBridgeRequestRender(
  bridge: EngineeringLiveTimelineBridge | undefined,
  fn: (() => void) | undefined,
  onlyIfCurrent?: () => void,
): void {
  if (!bridge) return;
  if (onlyIfCurrent && bridge.requestRender !== onlyIfCurrent) return;
  bridge.requestRender = fn;
}

function syncBridgeAfterStep(
  bridge: EngineeringLiveTimelineBridge | undefined,
  prevMode: EngineeringControlMode,
  nextMode: EngineeringControlMode,
  effectiveProgress: number,
): void {
  if (!bridge) return;
  bridge.controlMode = nextMode;
  if (prevMode !== nextMode) {
    bridge.onControlModeChange?.(nextMode);
  }
  if (nextMode === "handoff") {
    bridge.onEffectiveProgressSync?.(effectiveProgress);
  }
}

export interface EngineeringDisassemblyStageProps {
  readonly evaluation: EngineeringStoryEvaluation;
  readonly liveBridgeRef?: MutableRefObject<EngineeringLiveTimelineBridge>;
  /** Desktop side-rail position of the story card; shifts 3D camera safe framing to the opposite side. */
  readonly storySide?: "left" | "right";
  /** True when a secondary left-side panel (e.g. Cockpit Inspector) is visible on Desktop. */
  readonly hasLeftPanel?: boolean;
  readonly xray: boolean;
  readonly cfdFlow?: boolean;
  readonly reducedMotion: boolean;
  readonly orbitMode: boolean;
  readonly selectedPartId: string | null;
  readonly isolatedPartId: string | null;
  readonly onSelectPart: (id: string | null) => void;
  readonly onEnterOrbit: () => void;
  readonly onLoadProgress?: (percent: number) => void;
  readonly onLoaded?: () => void;
  readonly onUnavailable?: (reason: string) => void;
}

interface PedsEngMetricsWindow extends Window {
  __PEDS_ENG_METRICS__?: {
    reactCommits: number;
    frameCount: number;
    isPaused: boolean;
    controlMode: EngineeringControlMode;
    effectiveProgress: number;
    drawCalls: number;
    geometries: number;
    textures: number;
    programs: number;
    contextRestoredCount: number;
  };
}

function getMetricsBucket() {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname;
  const enabled =
    import.meta.env.DEV ||
    host === "127.0.0.1" ||
    host === "localhost" ||
    window.location.search.includes("perfProbe=1");
  if (!enabled) return null;
  const w = window as PedsEngMetricsWindow;
  if (!w.__PEDS_ENG_METRICS__) {
    w.__PEDS_ENG_METRICS__ = {
      reactCommits: 0,
      frameCount: 0,
      isPaused: false,
      controlMode: "timeline",
      effectiveProgress: 0,
      drawCalls: 0,
      geometries: 0,
      textures: 0,
      programs: 0,
      contextRestoredCount: 0,
    };
  }
  return w.__PEDS_ENG_METRICS__;
}

const TRACK_ACCENT_HEX: Readonly<Record<EngineeringTrackId, string>> = {
  aero: "#ff5a36",
  body: "#4ad8e8",
  corners: "#d8ff48",
  core: "#ffa23a",
};

let cachedWebglSupport: boolean | null = null;

function canCreateWebGLContext(): boolean {
  if (typeof document === "undefined") return false;
  if (cachedWebglSupport !== null) return cachedWebglSupport;
  try {
    const probe = document.createElement("canvas");
    const gl =
      probe.getContext("webgl2", { failIfMajorPerformanceCaveat: false }) ??
      probe.getContext("webgl", { failIfMajorPerformanceCaveat: false });
    const supported = Boolean(gl);
    if (gl) {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
    cachedWebglSupport = supported;
    return supported;
  } catch {
    cachedWebglSupport = false;
    return false;
  }
}

function buildStudioEnvironmentTexture(
  gl: THREE.WebGLRenderer,
): THREE.WebGLRenderTarget {
  const pmrem = new THREE.PMREMGenerator(gl);
  pmrem.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color("#06080d");

  const addPanel = (
    pos: [number, number, number],
    look: [number, number, number],
    size: [number, number],
    hex: string,
    intensity: number,
  ) => {
    const geo = new THREE.PlaneGeometry(size[0], size[1]);
    const col = new THREE.Color(hex).multiplyScalar(intensity);
    const mat = new THREE.MeshBasicMaterial({
      color: col,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.lookAt(look[0], look[1], look[2]);
    envScene.add(mesh);
    return { geo, mat };
  };

  // Architectural motorsport exhibition softboxes: overhead gallery key blade,
  // brushed-titanium side contour strips, and controlled Racing Crimson / warm tungsten rim kicker
  const panels = [
    addPanel([0, 9.8, -0.2], [0, 0, 0], [17.0, 3.0], "#f8fbff", 4.35),
    addPanel([-9.2, 4.2, -5.8], [0, 0.35, 0], [11.0, 2.3], "#dbeafe", 2.75),
    addPanel([8.6, 4.4, 5.6], [0, 0.35, 0], [10.2, 2.3], "#ffe6d0", 2.15),
    addPanel([-10.2, 1.4, 2.2], [0, 0.35, 0], [8.8, 1.1], "#9be7ff", 1.45),
    addPanel([0.4, 2.6, 9.8], [0, 0.4, 0], [11.5, 1.4], "#ff7252", 1.85),
    addPanel([0.0, 1.1, -10.2], [0, 0.25, 0], [9.5, 0.9], "#c7dbff", 1.25),
    addPanel([0, -5.6, 0], [0, 0, 0], [18, 18], "#141b28", 0.88),
  ];

  const rt = pmrem.fromScene(envScene, 0.024);
  for (const p of panels) {
    p.geo.dispose();
    p.mat.dispose();
  }
  pmrem.dispose();
  return rt;
}

function buildContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    // 1. Luminous brushed-titanium & slate-blue exhibition turntable platform glow
    const deck = ctx.createRadialGradient(256, 256, 24, 256, 256, 252);
    deck.addColorStop(0, "rgba(110, 142, 186, 0.46)");
    deck.addColorStop(0.38, "rgba(72, 98, 136, 0.34)");
    deck.addColorStop(0.68, "rgba(38, 54, 82, 0.2)");
    deck.addColorStop(0.88, "rgba(225, 37, 27, 0.08)");
    deck.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = deck;
    ctx.fillRect(0, 0, 512, 512);

    // 2. Tight grounded chassis & tire contact shadow directly under the car footprint
    ctx.save();
    ctx.translate(256, 256);
    ctx.scale(0.32, 0.72);
    const ao = ctx.createRadialGradient(0, 0, 10, 0, 0, 138);
    ao.addColorStop(0, "rgba(3, 6, 12, 0.84)");
    ao.addColorStop(0.52, "rgba(5, 9, 18, 0.46)");
    ao.addColorStop(0.85, "rgba(10, 16, 28, 0.12)");
    ao.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = ao;
    ctx.beginPath();
    ctx.arc(0, 0, 138, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function StudioEnvironmentBinder({
  onContextLost,
  onContextRestored,
}: {
  onContextLost: () => void;
  onContextRestored?: () => void;
}) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const invalidate = useThree((s) => s.invalidate);
  const onContextLostRef = useRef(onContextLost);
  const onContextRestoredRef = useRef(onContextRestored);
  const [envTex, setEnvTex] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    onContextLostRef.current = onContextLost;
  }, [onContextLost]);

  useEffect(() => {
    onContextRestoredRef.current = onContextRestored;
  }, [onContextRestored]);

  useEffect(() => {
    let rt: THREE.WebGLRenderTarget | null = buildStudioEnvironmentTexture(gl);
    setEnvTex(rt.texture);
    invalidate();
    const canvas = gl.domElement;
    let lostFallbackTimer: number | null = null;
    let isUnmounting = false;

    const handleLost = (event: Event) => {
      event.preventDefault();
      if (isUnmounting) return;
      if (lostFallbackTimer !== null) window.clearTimeout(lostFallbackTimer);
      // Give the browser a clean window to restore context before switching to static SVG fallback
      lostFallbackTimer = window.setTimeout(() => {
        lostFallbackTimer = null;
        if (!isUnmounting) onContextLostRef.current();
      }, 2200);
    };

    const handleRestored = () => {
      if (isUnmounting) return;
      if (lostFallbackTimer !== null) {
        window.clearTimeout(lostFallbackTimer);
        lostFallbackTimer = null;
      }
      rt?.dispose();
      rt = buildStudioEnvironmentTexture(gl);
      setEnvTex(rt.texture);
      const metrics = getMetricsBucket();
      if (metrics) metrics.contextRestoredCount += 1;
      onContextRestoredRef.current?.();
      invalidate();
    };

    canvas.addEventListener("webglcontextlost", handleLost, false);
    canvas.addEventListener("webglcontextrestored", handleRestored, false);
    return () => {
      isUnmounting = true;
      if (lostFallbackTimer !== null) window.clearTimeout(lostFallbackTimer);
      canvas.removeEventListener("webglcontextlost", handleLost, false);
      canvas.removeEventListener("webglcontextrestored", handleRestored, false);
      scene.environment = null;
      rt?.dispose();
      rt = null;
      gl.renderLists.dispose();
    };
  }, [gl, invalidate, scene]);

  return envTex ? <primitive attach="environment" object={envTex} /> : null;
}

const MinimalStudioPlinth = memo(function MinimalStudioPlinth({
  explodeRatioRef,
  venturiFloorPhaseRef,
  datumGridOpacityRef,
}: {
  explodeRatioRef: MutableRefObject<number>;
  venturiFloorPhaseRef: MutableRefObject<number>;
  datumGridOpacityRef: MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group | null>(null);
  const shadowMeshRef = useRef<THREE.Mesh | null>(null);
  const shadowMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const ringMatRef = useRef<THREE.LineBasicMaterial | null>(null);
  const ticksMatRef = useRef<THREE.LineBasicMaterial | null>(null);
  const lastRatioRef = useRef<number>(-1);
  const lastFloorRef = useRef<number>(-1);
  const lastGridRef = useRef<number>(-1);
  const shadowTex = useMemo(() => buildContactShadowTexture(), []);
  const { ringGeo, ticksGeo } = useMemo(() => {
    const pts: number[] = [];
    const tickPts: number[] = [];
    const outerRadius = 3.62;
    const midRadius = 3.34;
    const innerRadius = 2.08;
    const segs = 144;
    for (let i = 0; i < segs; i += 1) {
      const a0 = (i / segs) * Math.PI * 2;
      const a1 = ((i + 1) / segs) * Math.PI * 2;
      pts.push(
        Math.cos(a0) * outerRadius,
        0,
        Math.sin(a0) * outerRadius,
        Math.cos(a1) * outerRadius,
        0,
        Math.sin(a1) * outerRadius,
      );
      if (i % 2 === 0) {
        pts.push(
          Math.cos(a0) * innerRadius,
          0,
          Math.sin(a0) * innerRadius,
          Math.cos(a1) * innerRadius,
          0,
          Math.sin(a1) * innerRadius,
        );
      }
      if (i % 3 === 0) {
        const major = i % 18 === 0;
        const rIn = major ? midRadius - 0.18 : midRadius;
        tickPts.push(
          Math.cos(a0) * rIn,
          0,
          Math.sin(a0) * rIn,
          Math.cos(a0) * outerRadius,
          0,
          Math.sin(a0) * outerRadius,
        );
      }
    }
    // Longitudinal centerline + front/rear axle scrutineering datum bars
    tickPts.push(
      -3.8,
      0,
      0,
      3.8,
      0,
      0,
      0,
      0,
      -3.8,
      0,
      0,
      3.8,
      -1.35,
      0,
      -1.78,
      1.35,
      0,
      -1.78,
      -1.35,
      0,
      1.78,
      1.35,
      0,
      1.78,
    );

    const ring = new THREE.BufferGeometry();
    ring.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    const ticks = new THREE.BufferGeometry();
    ticks.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(tickPts, 3),
    );
    return { ringGeo: ring, ticksGeo: ticks };
  }, []);

  useEffect(
    () => () => {
      shadowTex.dispose();
      ringGeo.dispose();
      ticksGeo.dispose();
    },
    [shadowTex, ringGeo, ticksGeo],
  );

  useFrame(() => {
    const r = explodeRatioRef.current;
    const floorPhase = venturiFloorPhaseRef.current;
    const gridAlpha = datumGridOpacityRef.current;
    if (
      Math.abs(r - lastRatioRef.current) < 1e-4 &&
      Math.abs(floorPhase - lastFloorRef.current) < 1e-4 &&
      Math.abs(gridAlpha - lastGridRef.current) < 1e-3
    ) {
      return;
    }
    lastRatioRef.current = r;
    lastFloorRef.current = floorPhase;
    lastGridRef.current = gridAlpha;
    const retraction = resolvePlinthRetraction(floorPhase);
    if (groupRef.current) {
      groupRef.current.position.y = retraction.y;
      groupRef.current.visible = retraction.opacityScale > 0.01;
    }
    if (shadowMeshRef.current) {
      shadowMeshRef.current.scale.set(6.8 + r * 0.65, 7.6 + r * 0.55, 1);
    }
    if (shadowMatRef.current) {
      shadowMatRef.current.opacity =
        Math.max(0.38, 0.92 - r * 0.34) * retraction.opacityScale;
    }
    if (ringMatRef.current) {
      ringMatRef.current.opacity =
        (0.22 + gridAlpha * 0.42) * retraction.opacityScale;
    }
    if (ticksMatRef.current) {
      ticksMatRef.current.opacity =
        (0.16 + gridAlpha * 0.38) * retraction.opacityScale;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.004, 0]}>
      <mesh
        ref={shadowMeshRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.002, 0.04]}
        scale={[7.4, 8.2, 1]}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          ref={shadowMatRef}
          map={shadowTex}
          transparent
          opacity={0.95}
          depthWrite={false}
        />
      </mesh>
      <lineSegments geometry={ringGeo} position={[0, 0.003, 0]}>
        <lineBasicMaterial
          ref={ringMatRef}
          color="#cbd5e1"
          transparent
          opacity={0.32}
          depthWrite={false}
        />
      </lineSegments>
      <lineSegments geometry={ticksGeo} position={[0, 0.004, 0]}>
        <lineBasicMaterial
          ref={ticksMatRef}
          color="#ff4d2e"
          transparent
          opacity={0.24}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
});

const STREAMLINE_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const STREAMLINE_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uSpeed;
  uniform float uPhaseOffset;
  uniform float uReducedMotion;
  uniform float uOpacity;
  varying vec2 vUv;

  void main() {
    float edgeFade = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.88, vUv.x);
    float pulse = 0.82;
    if (uReducedMotion < 0.5) {
      float travel = fract(vUv.x * 2.2 - uTime * uSpeed + uPhaseOffset);
      float packet = smoothstep(0.0, 0.22, travel) * smoothstep(0.72, 0.22, travel);
      pulse = 0.46 + packet * 0.54;
    }
    float alpha = edgeFade * pulse * uOpacity;
    vec3 finalColor = mix(uColor * 1.35, vec3(1.0, 0.99, 0.96), pulse * 0.42);
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

interface CompiledStreamlineRibbon {
  readonly spec: EngineeringAeroStreamlineSpec;
  readonly curve: THREE.CatmullRomCurve3;
  readonly geometry: THREE.TubeGeometry;
  readonly material: THREE.ShaderMaterial;
  readonly mesh: THREE.Mesh;
}

interface CompiledZoneParticles {
  readonly zone: EngineeringCfdZoneId;
  readonly lineIndices: readonly number[];
  readonly positions: Float32Array;
  readonly geometry: THREE.BufferGeometry;
  readonly material: THREE.PointsMaterial;
  readonly points: THREE.Points;
}

const CFD_PARTICLES_PER_LINE = 10;
const _cfdSamplePoint = new THREE.Vector3();

function stepStreamlineUniforms(
  ribbons: readonly CompiledStreamlineRibbon[],
  zoneParticles: readonly CompiledZoneParticles[],
  delta: number,
  zoneOpacities: EngineeringCfdZoneOpacities,
  reducedMotion: boolean,
): void {
  const dt = Math.min(delta, 0.064);

  for (let lineIdx = 0; lineIdx < ribbons.length; lineIdx += 1) {
    const r = ribbons[lineIdx];
    const zoneAlpha = zoneOpacities[r.spec.zone] ?? 0;
    const isLineVisible = zoneAlpha >= 0.01;
    r.mesh.visible = isLineVisible;
    const uniforms = r.material.uniforms;
    uniforms.uReducedMotion.value = reducedMotion ? 1.0 : 0.0;
    uniforms.uOpacity.value = 0.94 * zoneAlpha;
    if (isLineVisible) {
      uniforms.uTime.value = reducedMotion
        ? 0.35
        : (uniforms.uTime.value + dt * 0.65) % 1000;
    }
  }

  for (const zp of zoneParticles) {
    const zoneAlpha = zoneOpacities[zp.zone] ?? 0;
    const isZoneVisible = zoneAlpha >= 0.01;
    zp.points.visible = isZoneVisible;
    zp.material.opacity = 0.95 * zoneAlpha;
    if (!isZoneVisible) continue;

    let cursor = 0;
    for (const lineIdx of zp.lineIndices) {
      const r = ribbons[lineIdx];
      const baseTime = r.material.uniforms.uTime.value * r.spec.speed * 0.38;
      for (let p = 0; p < CFD_PARTICLES_PER_LINE; p += 1) {
        const t =
          (p / CFD_PARTICLES_PER_LINE + baseTime + r.spec.phaseOffset) % 1;
        r.curve.getPointAt(t, _cfdSamplePoint);
        zp.positions[cursor] = _cfdSamplePoint.x;
        zp.positions[cursor + 1] = _cfdSamplePoint.y;
        zp.positions[cursor + 2] = _cfdSamplePoint.z;
        cursor += 3;
      }
    }
    const attr = zp.geometry.getAttribute("position");
    if (attr) attr.needsUpdate = true;
  }
}

const EngineeringAeroStreamlines = memo(function EngineeringAeroStreamlines({
  visible,
  cfdZoneOpacitiesRef,
  reducedMotion,
}: {
  readonly visible: boolean;
  readonly cfdZoneOpacitiesRef: MutableRefObject<EngineeringCfdZoneOpacities>;
  readonly reducedMotion: boolean;
}) {
  const groupRef = useRef<THREE.Group | null>(null);
  const ribbonsRef = useRef<CompiledStreamlineRibbon[]>([]);
  const zoneParticlesRef = useRef<CompiledZoneParticles[]>([]);

  useFrame((state, delta) => {
    if (!visible) return;
    stepStreamlineUniforms(
      ribbonsRef.current,
      zoneParticlesRef.current,
      delta,
      cfdZoneOpacitiesRef.current,
      reducedMotion,
    );
    if (!reducedMotion) {
      state.invalidate();
    }
  });

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    const compiled: CompiledStreamlineRibbon[] =
      ENGINEERING_AERO_STREAMLINES.map((spec) => {
        const vectors = spec.points.map(
          ([x, y, z]) => new THREE.Vector3(x, y, z),
        );
        const curve = new THREE.CatmullRomCurve3(vectors, false, "centripetal");
        const geometry = new THREE.TubeGeometry(
          curve,
          64,
          spec.radius,
          8,
          false,
        );
        const material = new THREE.ShaderMaterial({
          vertexShader: STREAMLINE_VERTEX_SHADER,
          fragmentShader: STREAMLINE_FRAGMENT_SHADER,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          uniforms: {
            uColor: { value: new THREE.Color(spec.colorHex) },
            uTime: { value: 0.35 },
            uSpeed: { value: spec.speed },
            uPhaseOffset: { value: spec.phaseOffset },
            uReducedMotion: { value: 0.0 },
            uOpacity: { value: 0.94 },
          },
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = spec.id;
        mesh.renderOrder = 4;
        group.add(mesh);
        return { spec, curve, geometry, material, mesh };
      });

    const tmpColor = new THREE.Color();
    const tmpPt = new THREE.Vector3();
    const compiledZones: CompiledZoneParticles[] = ENGINEERING_CFD_ZONES.map(
      (zoneSpec) => {
        const lineIndices: number[] = [];
        for (let i = 0; i < compiled.length; i += 1) {
          if (compiled[i].spec.zone === zoneSpec.id) lineIndices.push(i);
        }
        const totalParticles = lineIndices.length * CFD_PARTICLES_PER_LINE;
        const positions = new Float32Array(totalParticles * 3);
        const colors = new Float32Array(totalParticles * 3);
        tmpColor.set(zoneSpec.colorHex);
        let cursor = 0;
        for (const lineIdx of lineIndices) {
          const item = compiled[lineIdx];
          for (let p = 0; p < CFD_PARTICLES_PER_LINE; p += 1) {
            const t = (p / CFD_PARTICLES_PER_LINE + item.spec.phaseOffset) % 1;
            item.curve.getPointAt(t, tmpPt);
            positions[cursor] = tmpPt.x;
            positions[cursor + 1] = tmpPt.y;
            positions[cursor + 2] = tmpPt.z;
            colors[cursor] = tmpColor.r;
            colors[cursor + 1] = tmpColor.g;
            colors[cursor + 2] = tmpColor.b;
            cursor += 3;
          }
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(positions, 3),
        );
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        const material = new THREE.PointsMaterial({
          size: 0.085,
          vertexColors: true,
          transparent: true,
          opacity: 0.95,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          sizeAttenuation: true,
        });
        const points = new THREE.Points(geometry, material);
        points.name = `CFD_TRACER_PARTICLES_${zoneSpec.id}`;
        points.renderOrder = 5;
        group.add(points);
        return {
          zone: zoneSpec.id,
          lineIndices,
          positions,
          geometry,
          material,
          points,
        };
      },
    );

    ribbonsRef.current = compiled;
    zoneParticlesRef.current = compiledZones;

    return () => {
      for (const item of compiled) {
        item.geometry.dispose();
        item.material.dispose();
      }
      for (const zp of compiledZones) {
        zp.geometry.dispose();
        zp.material.dispose();
      }
      group.clear();
      ribbonsRef.current = [];
      zoneParticlesRef.current = [];
    };
  }, []);

  return (
    <group
      ref={groupRef}
      name="ENGINEERING_CFD_STREAMLINES"
      visible={visible}
    />
  );
});

function updateExplodedTrajectoryLines(
  bindings: ReadonlyMap<string, NodeBinding>,
  parts: Readonly<Record<string, EngineeringPartSnapshot>>,
  positions: Float32Array,
  geometry: THREE.BufferGeometry,
  lineObj: THREE.LineSegments,
): void {
  let cursor = 0;
  for (const [partId, b] of bindings.entries()) {
    const snap = parts[partId];
    if (
      snap &&
      snap.phase > 0.03 &&
      b.object.visible &&
      (Math.abs(snap.tx) > 0.01 ||
        Math.abs(snap.ty) > 0.01 ||
        Math.abs(snap.tz) > 0.01)
    ) {
      positions[cursor] = b.basePosition.x;
      positions[cursor + 1] = b.basePosition.y;
      positions[cursor + 2] = b.basePosition.z;
      positions[cursor + 3] = b.basePosition.x + snap.tx;
      positions[cursor + 4] = b.basePosition.y + snap.ty;
      positions[cursor + 5] = b.basePosition.z + snap.tz;
    } else {
      positions[cursor] = 0;
      positions[cursor + 1] = 0;
      positions[cursor + 2] = 0;
      positions[cursor + 3] = 0;
      positions[cursor + 4] = 0;
      positions[cursor + 5] = 0;
    }
    cursor += 6;
  }
  const attr = geometry.getAttribute("position");
  if (attr) attr.needsUpdate = true;
  lineObj.computeLineDistances();
}

interface NodeBinding {
  readonly id: string;
  readonly object: THREE.Object3D;
  /** Node bounds stored in that node's local coordinate space. */
  readonly localBounds: THREE.Box3;
  readonly basePosition: THREE.Vector3;
  readonly baseEuler: THREE.Euler;
  readonly meshes: readonly THREE.Mesh[];
  readonly explodeOffset: readonly [number, number, number];
  readonly explodeEuler: readonly [number, number, number];
  readonly originalMaterials: ReadonlyMap<
    THREE.Mesh,
    THREE.Material | THREE.Material[]
  >;
  readonly accentColor: THREE.Color;
  readonly outerShell: boolean;
  readonly internalSystem: boolean;
}

const DEFAULT_SAFE_VIEW_REGION: EngineeringSafeViewRegion = {
  left: 0.06,
  top: 0.19,
  width: 0.88,
  height: 0.67,
};

function captureObjectLocalBounds(object: THREE.Object3D): THREE.Box3 {
  object.updateWorldMatrix(true, true);
  const inverseObjectWorld = object.matrixWorld.clone().invert();
  const bounds = new THREE.Box3().makeEmpty();
  const meshToObject = new THREE.Matrix4();

  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    if (!mesh.geometry.boundingBox) return;
    mesh.updateWorldMatrix(true, false);
    meshToObject.multiplyMatrices(inverseObjectWorld, mesh.matrixWorld);
    bounds.union(mesh.geometry.boundingBox.clone().applyMatrix4(meshToObject));
  });

  return bounds;
}

const _worldBoxScratch = new THREE.Box3();
const _targetBoundsScratch = new THREE.Box3();
const _framingBoundsScratch = new THREE.Box3();
const _sceneBoundsScratch = new THREE.Box3();
const _sceneSphereScratch = new THREE.Sphere();
const _anchorPosScratch = new THREE.Vector3();
const _projCornerScratch = new THREE.Vector3();
const _fromFrameScratch = createMutableCameraFrame();
const _toFrameScratch = createMutableCameraFrame();
const _interpFrameScratch = createMutableCameraFrame();

function writeWorldBoundsInto(
  binding: NodeBinding,
  out: THREE.Box3,
): THREE.Box3 {
  binding.object.updateWorldMatrix(true, false);
  return out.copy(binding.localBounds).applyMatrix4(binding.object.matrixWorld);
}

function getWorldBounds(binding: NodeBinding): THREE.Box3 {
  return writeWorldBoundsInto(binding, new THREE.Box3());
}

function writeCurrentSceneBoundsInto(
  bindings: ReadonlyMap<string, NodeBinding>,
  out: THREE.Box3,
): THREE.Box3 {
  out.makeEmpty();
  for (const binding of bindings.values()) {
    if (!binding.object.visible) continue;
    binding.object.updateWorldMatrix(true, false);
    _worldBoxScratch
      .copy(binding.localBounds)
      .applyMatrix4(binding.object.matrixWorld);
    out.union(_worldBoxScratch);
  }
  return out;
}

function DisassemblySceneRig({
  evaluation,
  liveBridgeRef,
  xray,
  cfdFlow = false,
  reducedMotion,
  orbitMode,
  selectedPartId,
  isolatedPartId,
  onSelectPart,
  onLoadProgress,
  onLoaded,
  onLoadError,
  safeRegion,
  stageActive,
}: Omit<EngineeringDisassemblyStageProps, "onEnterOrbit" | "onUnavailable"> & {
  onLoadError: (reason: string) => void;
  safeRegion: EngineeringSafeViewRegion;
  stageActive: boolean;
}) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const lastCameraTargetRef = useRef<THREE.Vector3>(
    new THREE.Vector3(0, 0.4, 0),
  );
  const sceneRootRef = useRef<THREE.Group | null>(null);
  const ownedMaterialsRef = useRef<THREE.Material[]>([]);
  const bindingsRef = useRef<Map<string, NodeBinding>>(new Map());
  const trajectoryRef = useRef<{
    positions: Float32Array;
    geometry: THREE.BufferGeometry;
    material: THREE.LineDashedMaterial;
    lineObj: THREE.LineSegments;
  } | null>(null);
  const trajectoryHostRef = useRef<THREE.Group | null>(null);
  const sceneControlRef = useRef<EngineeringSceneControlState>(
    createInitialSceneControlState(evaluation.progress),
  );
  const cachedEvalProgressRef = useRef<number>(-1);
  const cachedEvalRef = useRef<EngineeringStoryEvaluation>(evaluation);
  const cachedCueKeyRef = useRef<string>("");
  const cachedCueSheetRef = useRef<EngineeringMotionCueSheet>(
    evaluateEngineeringMotionDirector({
      effectiveProgress: evaluation.progress,
      controlMode: "timeline",
      selectedPartId,
      isolatedPartId,
      isolationBlend: 0,
      reducedMotion,
      xray,
      precomputedStory: evaluation,
    }),
  );
  const explodeRatioRef = useRef<number>(evaluation.explodeRatio);
  const venturiFloorPhaseRef = useRef<number>(
    evaluation.parts.VENTURI_FLOOR_TITANIUM?.phase ?? 0,
  );
  const datumGridOpacityRef = useRef<number>(0.14);
  const cfdZoneOpacitiesRef = useRef<EngineeringCfdZoneOpacities>(
    resolveCfdZoneOpacities(evaluation.parts),
  );
  const lastAnnotationKeyRef = useRef<string>("");
  const lastLightKeyRef = useRef<string>("");
  const lastTrajectoryProgressRef = useRef<number>(-1);
  const lastCameraKeyRef = useRef<string>("");
  const cameraInitializedRef = useRef<boolean>(false);
  const prevMaterialStateRef = useRef<{
    xray: boolean;
    selectedPartId: string | null;
    highlightedPartId: string | null;
    sceneReady: THREE.Group | null;
  }>({
    xray: false,
    selectedPartId: null,
    highlightedPartId: null,
    sceneReady: null,
  });
  const previousIsolatedIdRef = useRef<string | null>(null);
  const transitionPartIdRef = useRef<string | null>(null);
  const isolationCameraGoalRef = useRef<{
    readonly position: THREE.Vector3;
    readonly target: THREE.Vector3;
  } | null>(null);
  const isolationCameraAnimatingRef = useRef(false);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const fillLightRef = useRef<THREE.DirectionalLight | null>(null);
  const rimLightRef = useRef<THREE.DirectionalLight | null>(null);
  const accentPointLightRef = useRef<THREE.PointLight | null>(null);
  const lightRigStateRef = useRef(createMutableLightRigState());
  const accentLightColorRef = useRef(new THREE.Color("#eef6ff"));
  const [sceneReady, setSceneReady] = useState<THREE.Group | null>(null);

  const getEvaluationForProgress = useCallback(
    (progress: number): EngineeringStoryEvaluation => {
      if (Math.abs(progress - cachedEvalProgressRef.current) > 1e-6) {
        const shared = liveBridgeRef?.current.latestEvaluation;
        cachedEvalProgressRef.current = progress;
        cachedEvalRef.current =
          shared && Math.abs(shared.progress - progress) < 1e-6
            ? shared
            : evaluateEngineeringStoryTimeline(progress);
      }
      return cachedEvalRef.current;
    },
    [liveBridgeRef],
  );

  const getCueSheetForProgress = useCallback(
    (progress: number): EngineeringMotionCueSheet => {
      const ctrl = sceneControlRef.current;
      const cacheKey = `${progress.toFixed(6)}:${ctrl.mode}:${selectedPartId ?? ""}:${isolatedPartId ?? ""}:${ctrl.isolationBlend.toFixed(3)}:${reducedMotion ? 1 : 0}:${xray ? 1 : 0}`;
      if (cacheKey !== cachedCueKeyRef.current) {
        const story = getEvaluationForProgress(progress);
        cachedCueKeyRef.current = cacheKey;
        cachedCueSheetRef.current = evaluateEngineeringMotionDirector({
          effectiveProgress: progress,
          controlMode: ctrl.mode,
          selectedPartId,
          isolatedPartId,
          isolationBlend: ctrl.isolationBlend,
          reducedMotion,
          xray,
          precomputedStory: story,
        });
      }
      return cachedCueSheetRef.current;
    },
    [
      getEvaluationForProgress,
      isolatedPartId,
      reducedMotion,
      selectedPartId,
      xray,
    ],
  );

  // Sync explicit React mode transitions into the authoritative scene control ref
  useEffect(() => {
    const cur = sceneControlRef.current;
    const liveProgress =
      liveBridgeRef?.current.smoothedProgress ?? evaluation.progress;

    if (previousIsolatedIdRef.current !== isolatedPartId) {
      previousIsolatedIdRef.current = isolatedPartId;
      if (isolatedPartId) {
        transitionPartIdRef.current = isolatedPartId;
        isolationCameraAnimatingRef.current = true;
        sceneControlRef.current = enterIsolatedControl(
          cur,
          isolatedPartId,
          liveProgress,
        );
      } else {
        isolationCameraAnimatingRef.current = false;
        isolationCameraGoalRef.current = null;
        if (cur.mode === "isolated") {
          const targetVec =
            controlsRef.current?.target ?? lastCameraTargetRef.current;
          const snapCam = {
            position: [
              camera.position.x,
              camera.position.y,
              camera.position.z,
            ] as const,
            target: [targetVec.x, targetVec.y, targetVec.z] as const,
            fov: camera instanceof THREE.PerspectiveCamera ? camera.fov : 35,
          };
          sceneControlRef.current = beginTimelineHandoff(
            cur,
            snapCam,
            liveBridgeRef?.current.targetProgress ?? evaluation.progress,
            reducedMotion,
          );
        }
      }
    }
  }, [
    camera,
    evaluation.progress,
    isolatedPartId,
    liveBridgeRef,
    reducedMotion,
  ]);

  useEffect(() => {
    const cur = sceneControlRef.current;
    const liveProgress =
      liveBridgeRef?.current.smoothedProgress ?? evaluation.progress;
    if (orbitMode && !isolatedPartId && cur.mode !== "orbit") {
      sceneControlRef.current = enterOrbitControl(cur, liveProgress);
    } else if (!orbitMode && !isolatedPartId && cur.mode === "orbit") {
      const targetVec =
        controlsRef.current?.target ?? lastCameraTargetRef.current;
      const snapCam = {
        position: [
          camera.position.x,
          camera.position.y,
          camera.position.z,
        ] as const,
        target: [targetVec.x, targetVec.y, targetVec.z] as const,
        fov: camera instanceof THREE.PerspectiveCamera ? camera.fov : 35,
      };
      sceneControlRef.current = beginTimelineHandoff(
        cur,
        snapCam,
        liveBridgeRef?.current.targetProgress ?? evaluation.progress,
        reducedMotion,
      );
    }
  }, [
    camera,
    evaluation.progress,
    isolatedPartId,
    liveBridgeRef,
    orbitMode,
    reducedMotion,
  ]);

  // Bind demand-mode frame invalidation onto the shared timeline bridge
  useEffect(() => {
    const bridge = liveBridgeRef?.current;
    bindBridgeRequestRender(bridge, invalidate);
    return () => {
      bindBridgeRequestRender(bridge, undefined, invalidate);
    };
  }, [invalidate, liveBridgeRef]);

  // Trigger a fresh frame whenever reactive props or viewport framing change
  useEffect(() => {
    if (stageActive) {
      invalidate();
    }
  }, [
    cfdFlow,
    evaluation,
    invalidate,
    isolatedPartId,
    orbitMode,
    reducedMotion,
    safeRegion,
    sceneReady,
    selectedPartId,
    size.height,
    size.width,
    stageActive,
    xray,
  ]);

  // Synchronously restore exact scene & force one crisp frame on stage resume
  useLayoutEffect(() => {
    const metrics = getMetricsBucket();
    if (metrics) metrics.isPaused = !stageActive;
    if (stageActive) {
      lastCameraKeyRef.current = "";
      lastLightKeyRef.current = "";
      invalidate();
    }
  }, [invalidate, stageActive]);

  // Seed OrbitControls look-at target synchronously when Orbit mounts
  useLayoutEffect(() => {
    if (orbitMode && controlsRef.current) {
      controlsRef.current.target.copy(lastCameraTargetRef.current);
      controlsRef.current.update();
    }
  }, [orbitMode]);

  useEffect(() => {
    let cancelled = false;
    const abortController = new AbortController();

    async function loadScene() {
      try {
        let lastPct = -1;
        const asset = await loadEngineeringGlbTemplate(
          ENGINEERING_FP04RB_GLB_URL,
          {
            signal: abortController.signal,
            onPhase: (phase) => {
              if (cancelled) return;
              if (phase === "init") {
                onLoadProgress?.(computeGlbLoadPercent(0, 0, "init"));
              } else if (phase === "parsing") {
                onLoadProgress?.(computeGlbLoadPercent(1, 1, "parsing"));
              } else if (phase === "ready") {
                onLoadProgress?.(computeGlbLoadPercent(1, 1, "ready"));
              }
            },
            onDownloadProgress: (loadedBytes, totalBytes) => {
              if (cancelled) return;
              const pct = computeGlbLoadPercent(
                loadedBytes,
                totalBytes,
                "downloading",
              );
              if (pct !== lastPct) {
                lastPct = pct;
                onLoadProgress?.(pct);
              }
            },
          },
        );
        if (cancelled) return;

        // Clone scene graph from warm template while sharing geometries & textures
        const root = asset.template.clone(true);
        root.updateWorldMatrix(true, true);
        const nextMap = new Map<string, NodeBinding>();
        const ownedMaterials: THREE.Material[] = [];
        const maxAniso = Math.min(8, gl.capabilities.getMaxAnisotropy());

        for (const spec of ENGINEERING_PARTS) {
          const obj = root.getObjectByName(spec.node);
          if (!obj) continue;

          const meshes: THREE.Mesh[] = [];
          const originalMaterials = new Map<
            THREE.Mesh,
            THREE.Material | THREE.Material[]
          >();
          // Deduplicate cloned materials within each part while keeping every part
          // isolated for independent highlight/X-ray/emissive transitions.
          const partClonedMaterials = new Map<THREE.Material, THREE.Material>();

          obj.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.userData.explodePartId = spec.id;

              const sourceMats = Array.isArray(mesh.material)
                ? mesh.material
                : [mesh.material];

              const cloneForPart = (sourceMat: THREE.Material): THREE.Material => {
                const hit = partClonedMaterials.get(sourceMat);
                if (hit) return hit;

                const cloned = sourceMat.clone();
                partClonedMaterials.set(sourceMat, cloned);
                ownedMaterials.push(cloned);

                const std = cloned as THREE.MeshStandardMaterial;
                if (std.isMeshStandardMaterial) {
                  const authored = snapshotAuthoredMaterialState(std);
                  const baseEnv = resolveMaterialClassEnvIntensity(
                    std.name,
                    authored.baseTransparent,
                    authored.hasEmissiveMap,
                  );
                  std.envMapIntensity = baseEnv;
                  std.userData.__pedsBaseEnvIntensity = baseEnv;
                  std.side = resolveEngineeringMaterialSide(
                    Boolean(spec.outerShell),
                    std.side,
                  );
                  if (std.map) {
                    std.map.anisotropy = maxAniso;
                    std.map.needsUpdate = true;
                  }
                  if (std.emissiveMap) {
                    std.emissiveMap.anisotropy = maxAniso;
                  }
                }
                return cloned;
              };

              const mats = sourceMats.map(cloneForPart);
              const clonedMat = Array.isArray(mesh.material) ? mats : mats[0];
              mesh.material = clonedMat;
              originalMaterials.set(mesh, clonedMat);
              meshes.push(mesh);
            }
          });

          nextMap.set(spec.id, {
            id: spec.id,
            object: obj,
            localBounds: captureObjectLocalBounds(obj),
            basePosition: obj.position.clone(),
            baseEuler: obj.rotation.clone(),
            meshes,
            explodeOffset: spec.explodeOffset,
            explodeEuler: spec.explodeEuler,
            originalMaterials,
            accentColor: new THREE.Color(TRACK_ACCENT_HEX[spec.track]),
            outerShell: Boolean(spec.outerShell),
            internalSystem: Boolean(spec.internalSystem),
          });
        }

        ownedMaterialsRef.current = ownedMaterials;
        bindingsRef.current = nextMap;
        sceneRootRef.current = root;
        setSceneReady(root);
        onLoadProgress?.(computeGlbLoadPercent(1, 1, "ready"));
      } catch (err) {
        if (!cancelled) {
          onLoadError(err instanceof Error ? err.message : "Failed to load 3D");
        }
      }
    }

    void loadScene();

    return () => {
      cancelled = true;
      abortController.abort();
      if (ownedMaterialsRef.current.length > 0) {
        disposeEngineeringInstanceMaterials(ownedMaterialsRef.current);
        ownedMaterialsRef.current = [];
      }
      sceneRootRef.current = null;
      bindingsRef.current = new Map();
    };
  }, [gl, onLoadProgress, onLoadError]);

  // Pre-compile all shaders asynchronously (using KHR_parallel_shader_compile when
  // available) so first paint never stalls the main thread and mid-scroll reveals
  // never trigger synchronous shader compilation hiccups.
  useEffect(() => {
    if (!sceneReady) return;
    let cancelled = false;

    async function precompileShaders() {
      const savedVisibility: Array<{ obj: THREE.Object3D; visible: boolean }> =
        [];
      const temporarilyReveal = (obj: THREE.Object3D | null | undefined) => {
        if (!obj || obj.visible) return;
        savedVisibility.push({ obj, visible: obj.visible });
        obj.visible = true;
      };

      for (const b of bindingsRef.current.values()) {
        temporarilyReveal(b.object);
      }
      temporarilyReveal(trajectoryRef.current?.lineObj);
      temporarilyReveal(scene.getObjectByName("ENGINEERING_CFD_STREAMLINES"));

      try {
        if (typeof gl.compileAsync === "function") {
          await gl.compileAsync(scene, camera);
        } else {
          gl.compile(scene, camera);
        }
      } finally {
        for (const entry of savedVisibility) {
          entry.obj.visible = entry.visible;
        }
      }

      if (cancelled) return;
      lastCameraKeyRef.current = "";
      invalidate();
      onLoaded?.();
    }

    void precompileShaders();

    return () => {
      cancelled = true;
    };
  }, [camera, gl, invalidate, onLoaded, scene, sceneReady]);

  const handleContextRestored = useCallback(() => {
    if (!sceneRootRef.current) return;
    sceneRootRef.current.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      for (const mat of mats) {
        if (!mat) continue;
        for (const val of Object.values(mat)) {
          if (val instanceof THREE.Texture) val.needsUpdate = true;
        }
        mat.needsUpdate = true;
      }
    });
    lastCameraKeyRef.current = "";
    lastLightKeyRef.current = "";
    invalidate();
  }, [invalidate]);

  useFrame((state, delta) => {
    if (!stageActive) return;

    const cam = state.camera;
    const bridge = liveBridgeRef?.current;
    const incomingProgress = bridge
      ? bridge.smoothedProgress
      : evaluation.progress;

    // Handle atomic external handoff request (e.g., scrollbar/PageDown while in Orbit)
    const pendingHandoff = consumeBridgeHandoff(bridge);
    if (pendingHandoff.requested) {
      const curMode = sceneControlRef.current.mode;
      if (curMode === "orbit" || curMode === "isolated") {
        const targetVec =
          controlsRef.current?.target ?? lastCameraTargetRef.current;
        sceneControlRef.current = beginTimelineHandoff(
          sceneControlRef.current,
          {
            position: [cam.position.x, cam.position.y, cam.position.z],
            target: [targetVec.x, targetVec.y, targetVec.z],
            fov: cam instanceof THREE.PerspectiveCamera ? cam.fov : 35,
          },
          pendingHandoff.targetProgress,
          reducedMotion,
          { clearSelection: pendingHandoff.clearSelection },
        );
      }
    }

    const bindings = bindingsRef.current;
    const applyDirectorParts = (
      cueSheet: EngineeringMotionCueSheet,
      mode: EngineeringControlMode,
      isolationBlend: number,
    ) => {
      for (const [partId, b] of bindings.entries()) {
        const resolved = resolveDirectorPartTransform({
          partId,
          cueSheet,
          explodeOffset: b.explodeOffset,
          explodeEuler: b.explodeEuler,
          internalSystem: b.internalSystem,
          controlMode: mode,
          isolatedPartId,
          transitionPartId: transitionPartIdRef.current,
          isolationBlend,
          xray,
        });
        if (!resolved) continue;
        b.object.visible = resolved.visible;
        if (!resolved.visible) continue;
        b.object.position.set(
          b.basePosition.x + resolved.tx,
          b.basePosition.y + resolved.ty,
          b.basePosition.z + resolved.tz,
        );
        b.object.rotation.set(
          b.baseEuler.x + resolved.rx,
          b.baseEuler.y + resolved.ry,
          b.baseEuler.z + resolved.rz,
        );
      }
    };

    const resolveTimelineCamForProgress = (p: number) => {
      const cueAtP = getCueSheetForProgress(p);
      // Apply deterministic Motion Director part poses for p before measuring scene bounds
      applyDirectorParts(
        cueAtP,
        sceneControlRef.current.mode,
        sceneControlRef.current.isolationBlend,
      );

      if (!(cam instanceof THREE.PerspectiveCamera) || bindings.size === 0) {
        return null;
      }

      let sceneBoundsComputed = false;
      const getSceneBounds = () => {
        if (!sceneBoundsComputed) {
          writeCurrentSceneBoundsInto(bindings, _sceneBoundsScratch);
          sceneBoundsComputed = true;
        }
        return _sceneBoundsScratch;
      };

      const fitAnchor = (
        anchor: EngineeringStoryEvaluation["cameraRoute"]["from"],
        outFrame: ReturnType<typeof createMutableCameraFrame>,
      ): boolean => {
        const targetBinding = anchor.subjectPartId
          ? bindings.get(anchor.subjectPartId)
          : null;
        const framingBinding = anchor.framingPartId
          ? bindings.get(anchor.framingPartId)
          : null;
        const targetBounds = targetBinding
          ? writeWorldBoundsInto(targetBinding, _targetBoundsScratch)
          : getSceneBounds();
        const framingBounds = framingBinding
          ? writeWorldBoundsInto(framingBinding, _framingBoundsScratch)
          : getSceneBounds();
        return fitEngineeringCameraToBoundsInto(
          framingBounds,
          {
            viewportWidth: size.width,
            viewportHeight: size.height,
            safeRegion,
            direction: anchor.direction,
            fov: anchor.fov,
            framing: anchor.framing,
            lookTargetBias: anchor.lookTargetBias,
            targetBounds,
          },
          outFrame,
        );
      };

      const showArc = bridge?.cameraArc;
      if (
        showArc &&
        !reducedMotion &&
        Math.abs(showArc.toProgress - showArc.fromProgress) > 1e-5
      ) {
        const fromEval = evaluateEngineeringStoryTimeline(showArc.fromProgress);
        const toEval = evaluateEngineeringStoryTimeline(showArc.toProgress);
        const fromAnchor = fromEval.cameraRoute.from;
        const toAnchor = toEval.cameraRoute.from;
        const fromOk = fitAnchor(fromAnchor, _fromFrameScratch);
        const toOk = fitAnchor(toAnchor, _toFrameScratch);
        if (fromOk && toOk) {
          getSceneBounds().getBoundingSphere(_sceneSphereScratch);
          interpolateEngineeringCameraFramesInto(
            _fromFrameScratch,
            _toFrameScratch,
            showArc.progress,
            _sceneSphereScratch.radius * 0.08,
            _interpFrameScratch,
            {
              lateralArc: _sceneSphereScratch.radius * 0.1,
              easing: "cinematic-dolly",
            },
          );
          const arcEased = evaluateCameraEasing(
            showArc.progress,
            "cinematic-dolly",
          );
          return {
            position: _interpFrameScratch.position,
            target: _interpFrameScratch.target,
            distance: _interpFrameScratch.distance,
            fov: THREE.MathUtils.lerp(fromAnchor.fov, toAnchor.fov, arcEased),
          };
        }
      }

      const { route, arcLiftMultiplier, lateralArcMultiplier, easingProfile } =
        cueAtP.cameraCue;
      // Fast single-anchor path during hold windows and exact anchor boundaries
      if (
        route.from.id === route.to.id ||
        route.progress <= 1e-6 ||
        (reducedMotion && route.progress <= 0)
      ) {
        if (!fitAnchor(route.from, _interpFrameScratch)) return null;
        return {
          position: _interpFrameScratch.position,
          target: _interpFrameScratch.target,
          distance: _interpFrameScratch.distance,
          fov: route.from.fov,
        };
      }
      if (route.progress >= 1 - 1e-6 || reducedMotion) {
        if (!fitAnchor(route.to, _interpFrameScratch)) return null;
        return {
          position: _interpFrameScratch.position,
          target: _interpFrameScratch.target,
          distance: _interpFrameScratch.distance,
          fov: route.to.fov,
        };
      }

      const fromOk = fitAnchor(route.from, _fromFrameScratch);
      const toOk = fitAnchor(route.to, _toFrameScratch);
      if (!fromOk || !toOk) return null;

      getSceneBounds().getBoundingSphere(_sceneSphereScratch);
      interpolateEngineeringCameraFramesInto(
        _fromFrameScratch,
        _toFrameScratch,
        route.progress,
        _sceneSphereScratch.radius * arcLiftMultiplier,
        _interpFrameScratch,
        {
          lateralArc: _sceneSphereScratch.radius * lateralArcMultiplier,
          easing: easingProfile,
        },
      );
      const cameraProgress = evaluateCameraEasing(
        route.progress,
        easingProfile,
      );
      const nextFov = THREE.MathUtils.lerp(
        route.from.fov,
        route.to.fov,
        cameraProgress,
      );

      return {
        position: _interpFrameScratch.position,
        target: _interpFrameScratch.target,
        distance: _interpFrameScratch.distance,
        fov: nextFov,
      };
    };

    const prevMode = sceneControlRef.current.mode;
    const arcKey = bridge?.cameraArc
      ? `${bridge.cameraArc.fromProgress.toFixed(4)}:${bridge.cameraArc.toProgress.toFixed(4)}:${bridge.cameraArc.progress.toFixed(4)}`
      : "none";
    const expectedCameraKey = `${incomingProgress.toFixed(5)}:${arcKey}:${size.width}x${size.height}:${safeRegion.left.toFixed(3)}:${safeRegion.top.toFixed(3)}:${safeRegion.width.toFixed(3)}:${safeRegion.height.toFixed(3)}:${xray ? 1 : 0}:${sceneReady ? 1 : 0}`;
    const isTimelineSteady =
      prevMode === "timeline" &&
      Math.abs(incomingProgress - sceneControlRef.current.effectiveProgress) <
      1e-6 &&
      lastCameraKeyRef.current === expectedCameraKey;

    if (!isTimelineSteady) {
      const clearanceBox =
        prevMode === "handoff" && bindings.size > 0
          ? writeCurrentSceneBoundsInto(bindings, _sceneBoundsScratch)
          : null;
      const stepOut = stepSceneControlFrame(
        sceneControlRef.current,
        incomingProgress,
        delta * 1000,
        reducedMotion,
        resolveTimelineCamForProgress,
        clearanceBox,
      );
      sceneControlRef.current = stepOut.state;
      const activeCue = getCueSheetForProgress(stepOut.effectiveProgress);
      const activeEval = activeCue.story;
      explodeRatioRef.current = activeEval.explodeRatio;
      venturiFloorPhaseRef.current =
        activeCue.parts.VENTURI_FLOOR_TITANIUM?.phase ?? 0;
      datumGridOpacityRef.current = activeCue.environmentCue.datumGridOpacity;
      cfdZoneOpacitiesRef.current = resolveCfdZoneOpacities(activeCue.parts);

      let cameraStillDamping = false;
      if (stepOut.cameraOwnedByTimeline && stepOut.camera) {
        // Ensure part poses strictly reflect stepOut.effectiveProgress (especially during handoff)
        if (stepOut.state.mode === "handoff" || prevMode === "handoff") {
          applyDirectorParts(
            activeCue,
            stepOut.state.mode,
            stepOut.isolationBlend,
          );
        }
        const snapCamera =
          reducedMotion ||
          !cameraInitializedRef.current ||
          stepOut.state.mode === "handoff";
        if (snapCamera) {
          cam.position.copy(stepOut.camera.position);
          lastCameraTargetRef.current.copy(stepOut.camera.target);
          if (
            cam instanceof THREE.PerspectiveCamera &&
            Math.abs(cam.fov - stepOut.camera.fov) > 0.01
          ) {
            cam.fov = stepOut.camera.fov;
            cam.updateProjectionMatrix();
          }
          cameraInitializedRef.current = true;
        } else {
          const camAlpha = 1 - Math.exp(-6.5 * Math.min(delta, 0.064));
          cam.position.lerp(stepOut.camera.position, camAlpha);
          lastCameraTargetRef.current.lerp(stepOut.camera.target, camAlpha);
          if (cam instanceof THREE.PerspectiveCamera) {
            const nextFov = THREE.MathUtils.lerp(
              cam.fov,
              stepOut.camera.fov,
              camAlpha,
            );
            if (Math.abs(cam.fov - nextFov) > 0.005) {
              cam.fov = nextFov;
              cam.updateProjectionMatrix();
            }
          }
          const posDistSq = cam.position.distanceToSquared(
            stepOut.camera.position,
          );
          const tgtDistSq = lastCameraTargetRef.current.distanceToSquared(
            stepOut.camera.target,
          );
          const fovDiff =
            cam instanceof THREE.PerspectiveCamera
              ? Math.abs(cam.fov - stepOut.camera.fov)
              : 0;
          if (posDistSq < 1e-5 && tgtDistSq < 1e-5 && fovDiff < 0.02) {
            cam.position.copy(stepOut.camera.position);
            lastCameraTargetRef.current.copy(stepOut.camera.target);
            if (
              cam instanceof THREE.PerspectiveCamera &&
              Math.abs(cam.fov - stepOut.camera.fov) > 0.001
            ) {
              cam.fov = stepOut.camera.fov;
              cam.updateProjectionMatrix();
            }
          } else {
            cameraStillDamping = true;
          }
        }
        if (controlsRef.current) {
          controlsRef.current.target.copy(lastCameraTargetRef.current);
        }
        cam.lookAt(lastCameraTargetRef.current);
        if (stepOut.state.mode === "timeline" && !cameraStillDamping) {
          lastCameraKeyRef.current = `${stepOut.effectiveProgress.toFixed(5)}:${arcKey}:${size.width}x${size.height}:${safeRegion.left.toFixed(3)}:${safeRegion.top.toFixed(3)}:${safeRegion.width.toFixed(3)}:${safeRegion.height.toFixed(3)}:${xray ? 1 : 0}:${sceneReady ? 1 : 0}`;
        } else {
          lastCameraKeyRef.current = "";
        }
      } else {
        // Apply frozen part poses while in orbit or isolated mode
        applyDirectorParts(
          activeCue,
          stepOut.state.mode,
          stepOut.isolationBlend,
        );

        if (controlsRef.current) {
          const goal = isolationCameraGoalRef.current;
          if (goal && isolationCameraAnimatingRef.current) {
            const cameraStep = reducedMotion
              ? 1
              : 1 - Math.exp(-10 * Math.min(delta, 0.064));
            cam.position.lerp(goal.position, cameraStep);
            controlsRef.current.target.lerp(goal.target, cameraStep);
            if (
              cam.position.distanceToSquared(goal.position) < 0.0004 &&
              controlsRef.current.target.distanceToSquared(goal.target) < 0.0004
            ) {
              cam.position.copy(goal.position);
              controlsRef.current.target.copy(goal.target);
              isolationCameraAnimatingRef.current = false;
            }
          }
          controlsRef.current.update();
          lastCameraTargetRef.current.copy(controlsRef.current.target);
        }
        lastCameraKeyRef.current = "";
      }

      syncBridgeAfterStep(
        bridge,
        prevMode,
        stepOut.state.mode,
        stepOut.effectiveProgress,
      );

      // Keep advancing frames under frameloop="demand" only while an active
      // transition (handoff glide, isolation camera lerp, camera damping, or
      // residual timeline delta) is still in motion; once settled, GPU drops to 0 idle frames.
      if (
        stepOut.state.mode === "handoff" ||
        isolationCameraAnimatingRef.current ||
        cameraStillDamping ||
        Math.abs(incomingProgress - stepOut.effectiveProgress) > 1e-6
      ) {
        invalidate();
      }

      if (stepOut.state.mode !== "isolated" && stepOut.isolationBlend === 0) {
        transitionPartIdRef.current = null;
      }

      if (trajectoryRef.current) {
        const trajOpacity = activeCue.environmentCue.trajectoryOpacity;
        const showVectors =
          stepOut.state.mode !== "isolated" &&
          activeEval.explodeRatio > 0.03 &&
          trajOpacity > 0.01;
        trajectoryRef.current.lineObj.visible = showVectors;
        if (showVectors) {
          trajectoryRef.current.material.opacity = trajOpacity;
          if (
            Math.abs(activeEval.progress - lastTrajectoryProgressRef.current) >
            1e-5
          ) {
            lastTrajectoryProgressRef.current = activeEval.progress;
            updateExplodedTrajectoryLines(
              bindings,
              activeCue.parts,
              trajectoryRef.current.positions,
              trajectoryRef.current.geometry,
              trajectoryRef.current.lineObj,
            );
          }
        }
      }
    }

    // Project exact 3D component surface reticle + 2D screen bounds driven by Motion Director (zero React commits)
    const liveCueSheet = getCueSheetForProgress(
      sceneControlRef.current.effectiveProgress,
    );
    if (bridge?.onAnnotationProject && bindings.size > 0) {
      const annCue = liveCueSheet.annotationCue;
      const focusPartId = annCue.visible ? annCue.partId : null;
      const focusBinding = focusPartId ? bindings.get(focusPartId) : null;
      if (focusBinding && focusBinding.object.visible) {
        cam.updateMatrixWorld();
        focusBinding.object.updateWorldMatrix(true, false);
        const lb = focusBinding.localBounds;
        let minNx = 1;
        let maxNx = 0;
        let minNy = 1;
        let maxNy = 0;
        for (let ix = 0; ix < 2; ix += 1) {
          const cx = ix === 0 ? lb.min.x : lb.max.x;
          for (let iy = 0; iy < 2; iy += 1) {
            const cy = iy === 0 ? lb.min.y : lb.max.y;
            for (let iz = 0; iz < 2; iz += 1) {
              const cz = iz === 0 ? lb.min.z : lb.max.z;
              _projCornerScratch
                .set(cx, cy, cz)
                .applyMatrix4(focusBinding.object.matrixWorld)
                .project(cam);
              const px = (_projCornerScratch.x + 1) * 0.5;
              const py = (1 - _projCornerScratch.y) * 0.5;
              if (px < minNx) minNx = px;
              if (px > maxNx) maxNx = px;
              if (py < minNy) minNy = py;
              if (py > maxNy) maxNy = py;
            }
          }
        }
        // Project exact upper-contour 3D surface anchor on the component's local bounds
        _anchorPosScratch
          .set(
            (lb.min.x + lb.max.x) * 0.5,
            lb.min.y + (lb.max.y - lb.min.y) * 0.72,
            (lb.min.z + lb.max.z) * 0.5,
          )
          .applyMatrix4(focusBinding.object.matrixWorld)
          .project(cam);
        const nx = (_anchorPosScratch.x + 1) * 0.5;
        const ny = (1 - _anchorPosScratch.y) * 0.5;
        const onScreen =
          _anchorPosScratch.z >= -1 &&
          _anchorPosScratch.z <= 1 &&
          nx >= 0.04 &&
          nx <= 0.96 &&
          ny >= 0.06 &&
          ny <= 0.92;
        const partPhase = annCue.phase;
        const nextKey = onScreen
          ? `1:${focusPartId}:${nx.toFixed(3)}:${ny.toFixed(3)}:${minNx.toFixed(2)}:${maxNx.toFixed(2)}:${minNy.toFixed(2)}:${maxNy.toFixed(2)}:${partPhase.toFixed(2)}:${annCue.opacity.toFixed(2)}:${annCue.leaderScale.toFixed(2)}:${annCue.motionPhaseId ?? ""}`
          : "0";
        if (nextKey !== lastAnnotationKeyRef.current) {
          lastAnnotationKeyRef.current = nextKey;
          bridge.onAnnotationProject({
            visible: onScreen,
            x: nx,
            y: ny,
            boundsMinX: minNx,
            boundsMaxX: maxNx,
            boundsMinY: minNy,
            boundsMaxY: maxNy,
            partId: focusPartId,
            phase: partPhase,
            opacity: annCue.opacity,
            leaderScale: annCue.leaderScale,
            motionPhaseId: annCue.motionPhaseId,
          });
        }
      } else if (lastAnnotationKeyRef.current !== "0") {
        lastAnnotationKeyRef.current = "0";
        bridge.onAnnotationProject({
          visible: false,
          x: 0.5,
          y: 0.5,
          partId: null,
          phase: 0,
          opacity: 0,
          leaderScale: 0,
          motionPhaseId: annCue.motionPhaseId,
        });
      }
    }

    // Apply 100% deterministic studio lighting from Motion Director (zero history drift, zero React commits)
    const lightKey = `${liveCueSheet.progress.toFixed(5)}:${liveCueSheet.story.chapter.id}:${liveCueSheet.activePhaseCue?.phaseId ?? ""}:${liveCueSheet.story.storyBeat.partId ?? ""}`;
    if (lightKey !== lastLightKeyRef.current) {
      lastLightKeyRef.current = lightKey;
      const rig = lightRigStateRef.current;
      applyLightRigStateToMutable(rig, liveCueSheet.lightingCue);
      if (ambientLightRef.current) {
        ambientLightRef.current.intensity = rig.ambientIntensity;
      }
      if (keyLightRef.current) {
        keyLightRef.current.intensity = rig.keyIntensity;
        keyLightRef.current.position.set(
          rig.keyPosition[0],
          rig.keyPosition[1],
          rig.keyPosition[2],
        );
      }
      if (fillLightRef.current) {
        fillLightRef.current.intensity = rig.fillIntensity;
        fillLightRef.current.position.set(
          rig.fillPosition[0],
          rig.fillPosition[1],
          rig.fillPosition[2],
        );
      }
      if (rimLightRef.current) {
        rimLightRef.current.intensity = rig.rimIntensity;
        rimLightRef.current.position.set(
          rig.rimPosition[0],
          rig.rimPosition[1],
          rig.rimPosition[2],
        );
      }
      if (accentPointLightRef.current) {
        accentPointLightRef.current.intensity = rig.accentPointIntensity;
        accentPointLightRef.current.position.set(
          rig.accentPointPosition[0],
          rig.accentPointPosition[1],
          rig.accentPointPosition[2],
        );
        accentLightColorRef.current.set(rig.accentPointColor);
        accentPointLightRef.current.color.copy(accentLightColorRef.current);
      }
    }

    const metrics = getMetricsBucket();
    if (metrics) {
      metrics.frameCount += 1;
      metrics.isPaused = false;
      metrics.controlMode = sceneControlRef.current.mode;
      metrics.effectiveProgress = sceneControlRef.current.effectiveProgress;
      metrics.drawCalls = gl.info.render.calls;
      metrics.geometries = gl.info.memory.geometries;
      metrics.textures = gl.info.memory.textures;
      metrics.programs = gl.info.programs?.length ?? 0;
    }
  });

  useEffect(() => {
    const host = trajectoryHostRef.current;
    if (!host) return;
    const positions = new Float32Array(ENGINEERING_PARTS.length * 6);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.LineDashedMaterial({
      color: "#94a3b8",
      dashSize: 0.07,
      gapSize: 0.07,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    });
    const lineObj = new THREE.LineSegments(geometry, material);
    lineObj.name = "EXPLODED_TRAJECTORY_VECTORS";
    lineObj.visible = false;
    host.add(lineObj);
    trajectoryRef.current = { positions, geometry, material, lineObj };
    return () => {
      geometry.dispose();
      material.dispose();
      host.clear();
      trajectoryRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isolatedPartId || !sceneReady || !orbitMode) return;
    const binding = bindingsRef.current.get(isolatedPartId);
    const controls = controlsRef.current;
    if (!binding || !controls || !(camera instanceof THREE.PerspectiveCamera)) {
      return;
    }

    const previousPosition = binding.object.position.clone();
    const previousRotation = binding.object.rotation.clone();
    const wasVisible = binding.object.visible;
    binding.object.position.set(
      binding.basePosition.x + binding.explodeOffset[0],
      binding.basePosition.y + binding.explodeOffset[1],
      binding.basePosition.z + binding.explodeOffset[2],
    );
    binding.object.rotation.set(
      binding.baseEuler.x + binding.explodeEuler[0],
      binding.baseEuler.y + binding.explodeEuler[1],
      binding.baseEuler.z + binding.explodeEuler[2],
    );
    binding.object.visible = true;
    binding.object.updateWorldMatrix(true, true);

    const bounds = getWorldBounds(binding);
    binding.object.position.copy(previousPosition);
    binding.object.rotation.copy(previousRotation);
    binding.object.visible = wasVisible;
    binding.object.updateWorldMatrix(true, true);
    const shot = getEngineeringStoryShot(isolatedPartId);
    const frame = fitEngineeringCameraToBounds(bounds, {
      viewportWidth: size.width,
      viewportHeight: size.height,
      safeRegion,
      direction: shot?.camera.direction ?? [-0.74, 0.28, -0.62],
      fov: camera.fov,
      framing: shot?.camera.framing ?? 1.2,
      lookTargetBias: shot?.camera.lookTargetBias ?? [0, 0, 0],
      targetBounds: bounds,
    });
    if (!frame) return;

    isolationCameraGoalRef.current = {
      target: frame.target,
      position: frame.position,
    };
    if (reducedMotion) {
      controls.target.copy(isolationCameraGoalRef.current.target);
      camera.position.copy(isolationCameraGoalRef.current.position);
      camera.lookAt(controls.target);
      controls.update();
      isolationCameraAnimatingRef.current = false;
    } else {
      isolationCameraAnimatingRef.current = true;
    }
  }, [
    camera,
    isolatedPartId,
    orbitMode,
    reducedMotion,
    safeRegion,
    sceneReady,
    size.height,
    size.width,
  ]);

  const highlightedPartId =
    evaluation.progress > 0.04 && evaluation.progress < 0.96
      ? evaluation.storyBeat.partId
      : null;

  useEffect(() => {
    const isMatrixOrOrigin =
      evaluation.chapter.id === "matrix" ||
      evaluation.chapter.id === "origin" ||
      evaluation.chapter.id === "reassembly";

    const updateBindingMaterials = (b: NodeBinding) => {
      const isSelected = selectedPartId === b.id;
      const isHeroFocus = !isMatrixOrOrigin && highlightedPartId === b.id;
      const isContextWhileFocused =
        !isMatrixOrOrigin &&
        highlightedPartId !== null &&
        highlightedPartId !== b.id &&
        !isSelected;
      const envScale =
        isSelected || isHeroFocus ? 1.22 : isContextWhileFocused ? 0.84 : 1.0;

      for (const mesh of b.meshes) {
        const orig = b.originalMaterials.get(mesh);
        if (!orig) continue;
        const mats = Array.isArray(orig) ? orig : [orig];
        for (const m of mats) {
          const std = m as THREE.MeshStandardMaterial;
          if (!std.isMeshStandardMaterial) continue;
          const authored = applyMaterialXrayVisibility(
            std,
            Boolean(xray && b.outerShell && !isSelected),
          );
          const baseEnv =
            (std.userData.__pedsBaseEnvIntensity as number | undefined) ?? 1.18;
          std.envMapIntensity = baseEnv * envScale;

          const baseHex = authored.baseEmissiveHex;
          const baseInt = authored.baseEmissiveIntensity;
          const hasEmissiveMap = authored.hasEmissiveMap;
          const isAuthoredEmissive = hasEmissiveMap || baseHex > 0;

          if (isAuthoredEmissive) {
            std.emissive.setHex(
              hasEmissiveMap && baseHex === 0 ? 0xffffff : baseHex,
            );
            std.emissiveIntensity = isSelected ? baseInt * 1.18 : baseInt;
          } else if (isSelected) {
            std.emissive.copy(b.accentColor);
            std.emissiveIntensity = 0.14;
          } else {
            // Preserve authentic PBR carbon/titanium/clearcoat appearance
            std.emissive.setHex(baseHex);
            std.emissiveIntensity = baseInt;
          }
        }
      }
    };

    for (const b of bindingsRef.current.values()) {
      updateBindingMaterials(b);
    }

    prevMaterialStateRef.current = {
      xray,
      selectedPartId,
      highlightedPartId,
      sceneReady,
    };
    invalidate();
  }, [
    evaluation.chapter.id,
    invalidate,
    xray,
    selectedPartId,
    highlightedPartId,
    sceneReady,
  ]);

  const handlePointerClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (e.delta > 6) return;
      const partId = (e.object.userData?.explodePartId as string) ?? null;
      if (partId) {
        onSelectPart(selectedPartId === partId ? null : partId);
      }
    },
    [onSelectPart, selectedPartId],
  );

  return (
    <>
      <StudioEnvironmentBinder
        onContextLost={() => onLoadError("WebGL context lost")}
        onContextRestored={handleContextRestored}
      />
      <ambientLight ref={ambientLightRef} intensity={0.42} color="#dce8f8" />
      <directionalLight
        ref={keyLightRef}
        position={[-6.4, 9.2, -5.8]}
        intensity={2.45}
        color="#fffaf2"
      />
      <directionalLight
        ref={fillLightRef}
        position={[7.6, 4.8, 5.4]}
        intensity={1.32}
        color="#a6d6ff"
      />
      <directionalLight
        ref={rimLightRef}
        position={[0.4, 3.4, 8.4]}
        intensity={1.24}
        color="#ff8566"
      />
      <pointLight
        ref={accentPointLightRef}
        position={[-1.4, 1.3, -1.6]}
        intensity={0.45}
        distance={4.8}
        color="#eef6ff"
      />

      <MinimalStudioPlinth
        explodeRatioRef={explodeRatioRef}
        venturiFloorPhaseRef={venturiFloorPhaseRef}
        datumGridOpacityRef={datumGridOpacityRef}
      />

      <group ref={trajectoryHostRef} />

      <EngineeringAeroStreamlines
        visible={Boolean(cfdFlow) && !isolatedPartId}
        cfdZoneOpacitiesRef={cfdZoneOpacitiesRef}
        reducedMotion={reducedMotion}
      />

      {sceneReady && (
        <primitive object={sceneReady} onClick={handlePointerClick} />
      )}

      {/* Mount OrbitControls only when Orbit/Isolation is active so three-stdlib's
          non-passive wheel listener on the full-screen canvas never blocks
          compositor-threaded page scrolling in timeline mode. */}
      {orbitMode && (
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enabled={orbitMode}
          enableDamping={orbitMode}
          dampingFactor={0.07}
          enablePan={orbitMode}
          enableZoom={orbitMode}
          onStart={() => {
            isolationCameraAnimatingRef.current = false;
            invalidate();
          }}
          onChange={() => {
            invalidate();
          }}
          minDistance={0.28}
          maxDistance={24}
          maxPolarAngle={Math.PI}
        />
      )}
    </>
  );
}

function EngineeringDisassemblyStageImpl(
  props: EngineeringDisassemblyStageProps,
) {
  const stageRef = useRef<HTMLDivElement>(null);
  const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const { onEnterOrbit, onSelectPart, onUnavailable, storySide, hasLeftPanel } = props;
  const [webglSupported] = useState(() => canCreateWebGLContext());
  const [safeRegion, setSafeRegion] = useState(DEFAULT_SAFE_VIEW_REGION);
  const [stageInViewport, setStageInViewport] = useState(true);
  const [tabVisible, setTabVisible] = useState(
    () => typeof document === "undefined" || !document.hidden,
  );
  const stageActive = stageInViewport && tabVisible;
  const handleLoadError = useCallback(
    (reason: string) => onUnavailable?.(reason),
    [onUnavailable],
  );

  useEffect(() => {
    setBridgeStageActive(props.liveBridgeRef?.current, stageActive);
    const metrics = getMetricsBucket();
    if (metrics) metrics.isPaused = !stageActive;
  }, [props.liveBridgeRef, stageActive]);

  useEffect(() => {
    const surface = stageRef.current?.closest<HTMLElement>(".peds-eng-sticky");
    if (!surface || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setStageInViewport(entry.isIntersecting);
      },
      { rootMargin: "0px 0px", threshold: 0.01 },
    );
    io.observe(surface);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const surface = stage?.closest<HTMLElement>(".peds-eng-sticky");
    if (!stage || !surface) return;

    const measure = () => {
      const stageRect = stage.getBoundingClientRect();
      if (stageRect.width <= 0 || stageRect.height <= 0) return;
      const copy = surface.querySelector<HTMLElement>(".peds-eng-copy");
      const dock = surface.querySelector<HTMLElement>(".peds-eng-bottom");
      const copyRect = copy?.getBoundingClientRect();
      const dockRect = dock?.getBoundingClientRect();
      const mobile = window.matchMedia("(max-width: 860px)").matches;
      const bottom = THREE.MathUtils.clamp(
        (stageRect.bottom -
          (dockRect?.top ?? stageRect.bottom - stageRect.height * 0.14) +
          16) /
        stageRect.height,
        mobile ? 0.17 : 0.13,
        mobile ? 0.32 : 0.2,
      );

      let next: EngineeringSafeViewRegion;
      if (!mobile && storySide) {
        // Desktop side-rail editorial layout: full vertical height for the 3D F1 car,
        // framed smoothly on the opposite horizontal side of the active story card.
        const top = 0.09;
        const left =
          storySide === "left"
            ? 0.31
            : hasLeftPanel
              ? 0.23
              : 0.05;
        const rightMargin = storySide === "right" ? 0.33 : 0.06;
        next = {
          left,
          top,
          width: Math.max(0.42, 1 - left - rightMargin),
          height: Math.max(0.55, 1 - top - bottom),
        };
      } else {
        const marginX = 0.06;
        const top = THREE.MathUtils.clamp(
          ((copyRect?.bottom ?? stageRect.top + stageRect.height * 0.2) -
            stageRect.top +
            14) /
          stageRect.height,
          mobile ? 0.25 : 0.2,
          mobile ? 0.38 : 0.29,
        );
        next = {
          left: marginX,
          top,
          width: 1 - marginX * 2,
          height: Math.max(0.36, 1 - top - bottom),
        };
      }
      setSafeRegion((current) =>
        Math.abs(current.left - next.left) < 0.015 &&
          Math.abs(current.top - next.top) < 0.015 &&
          Math.abs(current.width - next.width) < 0.015 &&
          Math.abs(current.height - next.height) < 0.015
          ? current
          : next,
      );
    };

    let measureRaf = 0;
    const scheduleMeasure = () => {
      if (measureRaf) return;
      measureRaf = window.requestAnimationFrame(() => {
        measureRaf = 0;
        measure();
      });
    };

    measure();
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(scheduleMeasure);
    observer?.observe(stage);
    const dock = surface.querySelector<HTMLElement>(".peds-eng-bottom");
    if (dock) observer?.observe(dock);
    window.addEventListener("resize", scheduleMeasure, { passive: true });
    return () => {
      if (measureRaf) window.cancelAnimationFrame(measureRaf);
      observer?.disconnect();
      window.removeEventListener("resize", scheduleMeasure);
    };
  }, [storySide, hasLeftPanel]);

  useEffect(() => {
    if (!webglSupported) {
      onUnavailable?.("WebGL unavailable");
    }
  }, [webglSupported, onUnavailable]);

  if (!webglSupported) {
    return null;
  }

  return (
    <div
      ref={stageRef}
      className={`peds-eng-stage__canvas${props.orbitMode ? " peds-eng-stage__canvas--orbit" : ""}`}
      data-testid="engineering-3d-canvas"
      onPointerDown={(e) => {
        pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerMove={(e) => {
        const start = pointerDownPosRef.current;
        if (!start || e.buttons === 0 || props.orbitMode) return;
        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;
        if (shouldEnterEngineeringOrbitFromDrag(e.pointerType, dx, dy)) {
          onEnterOrbit();
        }
      }}
      onPointerUp={() => {
        pointerDownPosRef.current = null;
      }}
      onPointerCancel={() => {
        pointerDownPosRef.current = null;
      }}
    >
      <Canvas
        frameloop="demand"
        resize={{ offsetSize: true }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
        camera={{
          position: [-4.45, 1.56, -4.1],
          fov: 35,
          near: 0.02,
          far: 250,
        }}
        onPointerMissed={() => onSelectPart(null)}
      >
        <DisassemblySceneRig
          evaluation={props.evaluation}
          liveBridgeRef={props.liveBridgeRef}
          xray={props.xray}
          cfdFlow={props.cfdFlow}
          reducedMotion={props.reducedMotion}
          orbitMode={props.orbitMode}
          selectedPartId={props.selectedPartId}
          isolatedPartId={props.isolatedPartId}
          onSelectPart={props.onSelectPart}
          onLoadProgress={props.onLoadProgress}
          onLoaded={props.onLoaded}
          onLoadError={handleLoadError}
          safeRegion={safeRegion}
          stageActive={stageActive}
        />
      </Canvas>
    </div>
  );
}

export const EngineeringDisassemblyStage = memo(
  EngineeringDisassemblyStageImpl,
);
EngineeringDisassemblyStage.displayName = "EngineeringDisassemblyStage";
