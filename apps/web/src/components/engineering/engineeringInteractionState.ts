import * as THREE from "three";
import {
  blendEngineeringCameraWithClearance,
  type EngineeringCameraFrame,
} from "./engineeringShotCamera";

export type EngineeringControlMode =
  "timeline" | "orbit" | "isolated" | "handoff";

export interface EngineeringCameraSnapshot {
  readonly position: readonly [number, number, number];
  readonly target: readonly [number, number, number];
  readonly fov: number;
}

export interface EngineeringHandoffState {
  readonly startProgress: number;
  readonly startCamera: EngineeringCameraSnapshot;
  readonly startIsolationBlend: number;
  readonly elapsedMs: number;
  readonly durationMs: number;
}

export interface EngineeringSceneControlState {
  readonly mode: EngineeringControlMode;
  readonly effectiveProgress: number;
  readonly lockedProgress: number | null;
  readonly selectedPartId: string | null;
  readonly isolatedPartId: string | null;
  readonly isolationBlend: number;
  readonly handoff: EngineeringHandoffState | null;
}

export interface EngineeringSceneStepOutput {
  readonly state: EngineeringSceneControlState;
  readonly effectiveProgress: number;
  readonly isolationBlend: number;
  readonly cameraOwnedByTimeline: boolean;
  readonly camera: {
    readonly position: THREE.Vector3;
    readonly target: THREE.Vector3;
    readonly fov: number;
  } | null;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function smoothstep(t: number): number {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

export function createInitialSceneControlState(
  initialProgress = 0,
): EngineeringSceneControlState {
  const p = clamp01(initialProgress);
  return {
    mode: "timeline",
    effectiveProgress: p,
    lockedProgress: null,
    selectedPartId: null,
    isolatedPartId: null,
    isolationBlend: 0,
    handoff: null,
  };
}

export function selectScenePart(
  state: EngineeringSceneControlState,
  partId: string | null,
): EngineeringSceneControlState {
  if (!partId) {
    if (state.mode === "isolated") {
      return { ...state, selectedPartId: null };
    }
    if (state.selectedPartId === null) return state;
    return { ...state, selectedPartId: null };
  }
  return {
    ...state,
    selectedPartId: partId,
    isolatedPartId: state.mode === "isolated" ? partId : state.isolatedPartId,
  };
}

export function enterOrbitControl(
  state: EngineeringSceneControlState,
  liveProgress = state.effectiveProgress,
): EngineeringSceneControlState {
  if (state.mode === "orbit") return state;
  // Mid-handoff interruption captures the exact interpolated effectiveProgress
  const locked = clamp01(
    state.mode === "handoff" ? state.effectiveProgress : liveProgress,
  );
  return {
    ...state,
    mode: "orbit",
    effectiveProgress: locked,
    lockedProgress: locked,
    isolatedPartId: null,
    isolationBlend: 0,
    handoff: null,
  };
}

export function enterIsolatedControl(
  state: EngineeringSceneControlState,
  partId: string,
  liveProgress = state.effectiveProgress,
): EngineeringSceneControlState {
  const locked =
    state.lockedProgress !== null
      ? state.lockedProgress
      : clamp01(
        state.mode === "handoff" ? state.effectiveProgress : liveProgress,
      );
  return {
    ...state,
    mode: "isolated",
    effectiveProgress: locked,
    lockedProgress: locked,
    selectedPartId: partId,
    isolatedPartId: partId,
    handoff: null,
  };
}

export function beginTimelineHandoff(
  state: EngineeringSceneControlState,
  currentCamera: EngineeringCameraSnapshot,
  incomingTargetProgress: number,
  reducedMotion: boolean,
  options?: { readonly clearSelection?: boolean },
): EngineeringSceneControlState {
  const target = clamp01(incomingTargetProgress);
  const nextSelected = options?.clearSelection ? null : state.selectedPartId;

  if (state.mode === "timeline") {
    return nextSelected === state.selectedPartId
      ? state
      : { ...state, selectedPartId: nextSelected };
  }

  const startProgress = clamp01(
    state.mode === "handoff"
      ? state.effectiveProgress
      : (state.lockedProgress ?? state.effectiveProgress),
  );

  if (reducedMotion) {
    return {
      mode: "timeline",
      effectiveProgress: target,
      lockedProgress: null,
      selectedPartId: nextSelected,
      isolatedPartId: null,
      isolationBlend: 0,
      handoff: null,
    };
  }

  const travelDelta = Math.abs(target - startProgress);
  const durationMs = Math.min(480, Math.max(320, 320 + travelDelta * 240));

  return {
    mode: "handoff",
    effectiveProgress: startProgress,
    lockedProgress: null,
    selectedPartId: nextSelected,
    isolatedPartId: null,
    isolationBlend: state.isolationBlend,
    handoff: {
      startProgress,
      startCamera: currentCamera,
      startIsolationBlend: state.isolationBlend,
      elapsedMs: 0,
      durationMs,
    },
  };
}

export function stepSceneControlFrame(
  state: EngineeringSceneControlState,
  liveTargetProgress: number,
  deltaMs: number,
  reducedMotion: boolean,
  resolveTimelineCamera: (
    progress: number,
  ) => (EngineeringCameraFrame & { readonly fov: number }) | null,
  clearanceBounds?: THREE.Box3 | null,
): EngineeringSceneStepOutput {
  const targetProgress = clamp01(liveTargetProgress);
  const dt = Math.max(0, Math.min(64, Number.isFinite(deltaMs) ? deltaMs : 16));

  if (state.mode === "orbit") {
    const locked = state.lockedProgress ?? state.effectiveProgress;
    return {
      state:
        state.effectiveProgress === locked
          ? state
          : { ...state, effectiveProgress: locked },
      effectiveProgress: locked,
      isolationBlend: 0,
      cameraOwnedByTimeline: false,
      camera: null,
    };
  }

  if (state.mode === "isolated") {
    const locked = state.lockedProgress ?? state.effectiveProgress;
    const step = reducedMotion ? 1 : 1 - Math.exp(-12 * (dt / 1000));
    let nextBlend = state.isolationBlend + (1 - state.isolationBlend) * step;
    if (Math.abs(1 - nextBlend) < 0.001) nextBlend = 1;
    const nextState =
      nextBlend === state.isolationBlend && state.effectiveProgress === locked
        ? state
        : { ...state, effectiveProgress: locked, isolationBlend: nextBlend };
    return {
      state: nextState,
      effectiveProgress: locked,
      isolationBlend: nextBlend,
      cameraOwnedByTimeline: false,
      camera: null,
    };
  }

  if (state.mode === "handoff" && state.handoff) {
    const h = state.handoff;
    const nextElapsed = h.elapsedMs + dt;
    const rawU =
      reducedMotion || h.durationMs <= 0
        ? 1
        : clamp01(nextElapsed / h.durationMs);
    const u = smoothstep(rawU);

    // Single-order coordinated lockstep evaluation: progress, isolation blend,
    // and camera converge smoothly along the exact same smoothstep `u` (1.5x peak slope)
    // (avoiding double-eased velocity spikes when targetCam varies with progress).
    const effectiveProgress =
      h.startProgress + (targetProgress - h.startProgress) * u;
    const isolationBlend = h.startIsolationBlend * (1 - u);
    const targetCam = resolveTimelineCamera(targetProgress);

    let blendedCamera: {
      position: THREE.Vector3;
      target: THREE.Vector3;
      fov: number;
    } | null = null;
    if (targetCam) {
      const startPos = new THREE.Vector3(...h.startCamera.position);
      const startTarget = new THREE.Vector3(...h.startCamera.target);
      const blended = blendEngineeringCameraWithClearance(
        {
          position: startPos,
          target: startTarget,
          distance: startPos.distanceTo(startTarget),
        },
        targetCam,
        u,
        clearanceBounds ?? null,
      );
      blendedCamera = {
        position: blended.position,
        target: blended.target,
        fov: h.startCamera.fov + (targetCam.fov - h.startCamera.fov) * u,
      };
    }

    if (rawU >= 1 - 1e-6) {
      const completed: EngineeringSceneControlState = {
        mode: "timeline",
        effectiveProgress: targetProgress,
        lockedProgress: null,
        selectedPartId: state.selectedPartId,
        isolatedPartId: null,
        isolationBlend: 0,
        handoff: null,
      };
      return {
        state: completed,
        effectiveProgress: targetProgress,
        isolationBlend: 0,
        cameraOwnedByTimeline: true,
        camera: blendedCamera,
      };
    }

    const advancing: EngineeringSceneControlState = {
      ...state,
      effectiveProgress,
      isolationBlend,
      handoff: { ...h, elapsedMs: nextElapsed },
    };
    return {
      state: advancing,
      effectiveProgress,
      isolationBlend,
      cameraOwnedByTimeline: true,
      camera: blendedCamera,
    };
  }

  // Default: mode === "timeline"
  const cam = resolveTimelineCamera(targetProgress);
  const nextState =
    state.effectiveProgress === targetProgress && state.isolationBlend === 0
      ? state
      : {
        ...state,
        effectiveProgress: targetProgress,
        isolationBlend: 0,
        handoff: null,
      };
  return {
    state: nextState,
    effectiveProgress: targetProgress,
    isolationBlend: 0,
    cameraOwnedByTimeline: true,
    camera: cam
      ? { position: cam.position, target: cam.target, fov: cam.fov }
      : null,
  };
}

/**
 * Coalesces discrete UI state keys so continuous 46-part reverse reassembly
 * renders meaningful chapter/system milestones without triggering ~28 React
 * commits/sec while all 46 3D part transforms remain deterministic per frame.
 */
export function resolveEngineeringUiCommitKey(params: {
  readonly chapterId: string;
  readonly storyBeatId: string;
  readonly showChapterTitle: boolean;
  readonly progress: number;
  readonly returningSystemChapterId?: string | null;
  readonly motionPhaseId?: string | null;
}): string {
  const {
    chapterId,
    storyBeatId,
    showChapterTitle,
    progress,
    returningSystemChapterId,
    motionPhaseId,
  } = params;
  if (chapterId === "reassembly") {
    if (showChapterTitle) return "reassembly|chapter-title";
    if (progress >= 0.998) return "reassembly|locked";
    return `reassembly|group|${returningSystemChapterId ?? "core"}`;
  }
  const base = `${chapterId}|${storyBeatId}|${showChapterTitle ? 1 : 0}`;
  return motionPhaseId ? `${base}|${motionPhaseId}` : base;
}

export const ENGINEERING_SCROLL_UI_MIN_INTERVAL_MS = 180;

export type EngineeringHudMode = "contextual" | "pinned" | "minimized";

export interface EngineeringAnnotationProjection {
  readonly visible: boolean;
  /** Viewport-relative 3D surface reticle X position in [0, 1]. */
  readonly x: number;
  /** Viewport-relative 3D surface reticle Y position in [0, 1]. */
  readonly y: number;
  /** Projected 2D screen bounds of the focal assembly for non-occluding callout placement. */
  readonly boundsMinX?: number;
  readonly boundsMaxX?: number;
  readonly boundsMinY?: number;
  readonly boundsMaxY?: number;
  readonly partId: string | null;
  readonly phase: number;
  readonly opacity?: number;
  readonly leaderScale?: number;
  readonly motionPhaseId?: string | null;
  readonly phaseText?: string | null;
}

export interface EngineeringLeaderCalloutLayout {
  readonly anchorPxX: number;
  readonly anchorPxY: number;
  readonly elbowPxX: number;
  readonly elbowPxY: number;
  readonly cardConnectPxX: number;
  readonly cardConnectPxY: number;
  readonly cardLeftPx: number;
  readonly cardTopPx: number;
  readonly align: "left" | "right" | "center";
}

export interface EngineeringPartPoseOffset {
  readonly tx: number;
  readonly ty: number;
  readonly tz: number;
  readonly rx: number;
  readonly ry: number;
  readonly rz: number;
  readonly phase: number;
}

/**
 * Keeps STEERING_ENCODERS_LEDS mechanically coupled to STEERING_WHEEL_LCD
 * while the wheel detaches for the Chapter 03 Driver-Eye OLED macro (Shot #12),
 * then smoothly separates the encoders layer during Shot #13 and re-docks in
 * reverse order during Chapter 08 Reassembly.
 */
export function resolveCoupledPartOffset(
  partId: string,
  snap: EngineeringPartPoseOffset,
  parts: Readonly<Record<string, EngineeringPartPoseOffset>>,
  partExplodeOffset: readonly [number, number, number],
  partExplodeEuler: readonly [number, number, number],
): EngineeringPartPoseOffset {
  if (partId !== "STEERING_ENCODERS_LEDS") return snap;
  const wheelSnap = parts.STEERING_WHEEL_LCD;
  if (!wheelSnap || wheelSnap.phase <= 1e-4) return snap;

  // Interpolate smoothly from the wheel's live pose (when encoders phase=0)
  // to the encoders' final exploded pose (when encoders phase=1).
  const t = clamp01(snap.phase);
  const targetTx = partExplodeOffset[0];
  const targetTy = partExplodeOffset[1];
  const targetTz = partExplodeOffset[2];
  const targetRx = partExplodeEuler[0];
  const targetRy = partExplodeEuler[1];
  const targetRz = partExplodeEuler[2];

  return {
    tx: wheelSnap.tx + (targetTx - wheelSnap.tx) * t,
    ty: wheelSnap.ty + (targetTy - wheelSnap.ty) * t,
    tz: wheelSnap.tz + (targetTz - wheelSnap.tz) * t,
    rx: wheelSnap.rx + (targetRx - wheelSnap.rx) * t,
    ry: wheelSnap.ry + (targetRy - wheelSnap.ry) * t,
    rz: wheelSnap.rz + (targetRz - wheelSnap.rz) * t,
    phase: snap.phase,
  };
}

/**
 * Retracts and fades the studio datum plinth smoothly before VENTURI_FLOOR_TITANIUM
 * drops (-0.72m) in Chapter 06 so the underfloor never clips through the plinth,
 * then restores the plinth as the floor re-locks in Chapter 08.
 */
export function resolvePlinthRetraction(venturiFloorPhase: number): {
  readonly y: number;
  readonly opacityScale: number;
} {
  const t = smoothstep(clamp01((venturiFloorPhase - 0.01) / 0.35));
  return {
    y: -0.004 - t * 0.82,
    opacityScale: 1 - t,
  };
}

/**
 * Clamps a projected 3D component anchor into the unobscured viewport region
 * so the 3D annotation badge never overlaps top-left editorial copy or bottom dock.
 */
export function clampAnnotationScreenPosition(
  rawX: number,
  rawY: number,
  isMobile: boolean,
): { readonly x: number; readonly y: number } {
  const minX = isMobile ? 0.08 : 0.3;
  const maxX = isMobile ? 0.66 : 0.78;
  const minY = isMobile ? 0.28 : 0.14;
  const maxY = isMobile ? 0.56 : 0.78;
  return {
    x: Math.max(minX, Math.min(maxX, rawX)),
    y: Math.max(minY, Math.min(maxY, rawY)),
  };
}

/**
 * Computes a two-point architectural elbow leader line from the exact projected
 * 3D component reticle `(anchorPxX, anchorPxY)` to a non-occluding callout card
 * placed in clean studio margin space away from both HUD copy and 3D geometry.
 */
export function resolveLeaderCalloutLayout(params: {
  readonly stageWidth: number;
  readonly stageHeight: number;
  readonly anchorX: number;
  readonly anchorY: number;
  readonly boundsMinX?: number;
  readonly boundsMaxX?: number;
  readonly boundsMinY?: number;
  readonly boundsMaxY?: number;
  readonly isMobile: boolean;
  readonly cardWidth?: number;
}): EngineeringLeaderCalloutLayout {
  const w = Math.max(320, params.stageWidth);
  const h = Math.max(420, params.stageHeight);
  const ax = Math.round(clamp01(params.anchorX) * w);
  const ay = Math.round(clamp01(params.anchorY) * h);
  const estCardW =
    params.cardWidth ?? (params.isMobile ? Math.min(310, w - 32) : 284);

  if (params.isMobile) {
    // On mobile, park the callout cleanly in the upper-mid studio shelf above the 3D model
    // (or lower-mid shelf above the dock if the part sits high) so it NEVER covers the car.
    const placeBelow = params.anchorY < 0.42;
    const shelfY = placeBelow
      ? Math.round(
        Math.min(
          h * 0.71,
          Math.max(ay + 54, (params.boundsMaxY ?? params.anchorY) * h + 24),
        ),
      )
      : Math.round(
        Math.max(
          h * 0.31,
          Math.min(ay - 56, (params.boundsMinY ?? params.anchorY) * h - 28),
        ),
      );
    const cardCenterX = Math.round(
      Math.max(estCardW * 0.5 + 16, Math.min(w - estCardW * 0.5 - 16, ax)),
    );
    const dy = shelfY - ay;
    const signY = dy >= 0 ? 1 : -1;
    const diag = Math.min(26, Math.abs(dy) * 0.65);
    const dirX = cardCenterX >= ax ? 1 : -1;
    const elbowX = Math.round(
      ax + dirX * Math.min(diag, Math.abs(cardCenterX - ax)),
    );
    const elbowY = Math.round(ay + signY * diag);
    const connectY = shelfY + (placeBelow ? -14 : 14);
    return {
      anchorPxX: ax,
      anchorPxY: ay,
      elbowPxX: elbowX,
      elbowPxY: elbowY,
      cardConnectPxX: elbowX,
      cardConnectPxY: connectY,
      cardLeftPx: cardCenterX,
      cardTopPx: shelfY,
      align: "center",
    };
  }

  // Desktop: editorial masthead is centered at the top (y < 0.22); dock is at bottom (y > 0.84).
  // Route callout to the upper-right specification margin (or upper-left margin if anchor is far right),
  // clear of both the centered top masthead and the centered 3D assembly.
  const bMinY = params.boundsMinY ?? params.anchorY - 0.08;
  const bMaxX = params.boundsMaxX ?? params.anchorX + 0.08;
  const routeLeft = params.anchorX > 0.72;

  if (routeLeft) {
    const targetRightX = Math.round(
      Math.max(w * 0.22 + estCardW, Math.min(ax - 58, w * 0.36)),
    );
    const targetY = Math.round(
      Math.max(h * 0.23, Math.min(h * 0.34, Math.min(ay - 48, bMinY * h - 18))),
    );
    const diag = Math.min(36, Math.max(16, Math.abs(ay - targetY) * 0.7));
    const elbowX = ax - diag;
    return {
      anchorPxX: ax,
      anchorPxY: ay,
      elbowPxX: Math.max(targetRightX + 10, elbowX),
      elbowPxY: targetY,
      cardConnectPxX: targetRightX,
      cardConnectPxY: targetY,
      cardLeftPx: targetRightX,
      cardTopPx: targetY,
      align: "right",
    };
  }

  const desiredLeftX = Math.max(
    ax + 56,
    Math.min(
      Math.round(bMaxX * w * 0.55 + ax * 0.45 + 52),
      Math.round(w - estCardW - 36),
    ),
  );
  const cardLeftX = Math.round(
    Math.max(w * 0.62, Math.min(w - estCardW - 32, desiredLeftX)),
  );
  const preferUpper = params.anchorY > 0.22;
  // Park the horizontal leader shelf in the open upper-right studio sky (0.15..0.19h)
  // above the centered 3D car (and to the right of the centered top masthead) for standard assemblies.
  // For dropped underfloor assemblies (bMinY >= 0.5, e.g. Venturi Floor), hold in the open mid-gap.
  const rawCardY = preferUpper
    ? bMinY < 0.47
      ? Math.min(Math.round(h * 0.19), ay - 60, Math.round(bMinY * h - 24))
      : Math.min(ay - 44, Math.round(bMinY * h - 14))
    : ay + 54;
  const cardY = Math.round(Math.max(h * 0.15, Math.min(h * 0.74, rawCardY)));
  const dy = cardY - ay;
  const diag = Math.min(42, Math.max(18, Math.abs(dy) * 0.42));
  const elbowX = Math.min(cardLeftX - 12, ax + diag);
  return {
    anchorPxX: ax,
    anchorPxY: ay,
    elbowPxX: Math.max(ax + 8, elbowX),
    elbowPxY: cardY,
    cardConnectPxX: cardLeftX,
    cardConnectPxY: cardY,
    cardLeftPx: cardLeftX,
    cardTopPx: cardY,
    align: "left",
  };
}
