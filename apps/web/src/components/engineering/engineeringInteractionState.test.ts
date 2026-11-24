import * as THREE from "three";
import { describe, expect, it } from "vitest";
import {
  beginTimelineHandoff,
  clampAnnotationScreenPosition,
  createInitialSceneControlState,
  enterIsolatedControl,
  enterOrbitControl,
  resolveCoupledPartOffset,
  resolveEngineeringUiCommitKey,
  resolveLeaderCalloutLayout,
  resolvePlinthRetraction,
  selectScenePart,
  stepSceneControlFrame,
  type EngineeringCameraSnapshot,
} from "./engineeringInteractionState";
import {
  ENGINEERING_REASSEMBLY_SHOTS,
  evaluateEngineeringStoryTimeline,
  getEngineeringStoryShot,
} from "./engineeringStoryTimeline";

function mockTimelineCamera(progress: number) {
  const angle = -Math.PI * 0.75 + progress * Math.PI * 1.5;
  const radius = 5.2;
  const position = new THREE.Vector3(
    Math.cos(angle) * radius,
    1.5 + progress * 0.8,
    Math.sin(angle) * radius,
  );
  const target = new THREE.Vector3(0, 0.4, (progress - 0.5) * 1.4);
  return {
    position,
    target,
    distance: position.distanceTo(target),
    fov: 33 + progress * 4,
  };
}

describe("Authoritative Engineering Scene Control (timeline | orbit | isolated | handoff)", () => {
  it("freezes effectiveProgress strictly while in orbit mode even when external scroll target changes", () => {
    let state = createInitialSceneControlState(0.12);
    state = enterOrbitControl(state, 0.12);
    expect(state.mode).toBe("orbit");
    expect(state.lockedProgress).toBe(0.12);

    // Even if an external target advances, parts never move while mode === 'orbit'
    const out = stepSceneControlFrame(
      state,
      0.65,
      16,
      false,
      mockTimelineCamera,
    );
    expect(out.effectiveProgress).toBe(0.12);
    expect(out.cameraOwnedByTimeline).toBe(false);
    expect(out.camera).toBeNull();
  });

  it("preserves selectedPartId across orbit entry and handoff exit", () => {
    let state = createInitialSceneControlState(0.0676);
    state = selectScenePart(state, "FRONT_WING_ASSEMBLY");
    state = enterOrbitControl(state, 0.0676);
    expect(state.selectedPartId).toBe("FRONT_WING_ASSEMBLY");

    const camSnap: EngineeringCameraSnapshot = {
      position: [3.2, 2.1, -3.5],
      target: [0, 0.4, -1.2],
      fov: 31,
    };
    state = beginTimelineHandoff(state, camSnap, 0.25, false);
    expect(state.mode).toBe("handoff");
    expect(state.selectedPartId).toBe("FRONT_WING_ASSEMBLY");

    // Advance handoff to completion
    for (let i = 0; i < 40; i += 1) {
      const step = stepSceneControlFrame(
        state,
        0.25,
        16,
        false,
        mockTimelineCamera,
      );
      state = step.state;
    }
    expect(state.mode).toBe("timeline");
    expect(state.selectedPartId).toBe("FRONT_WING_ASSEMBLY");
    expect(state.effectiveProgress).toBeCloseTo(0.25, 6);
  });

  it("coordinates progress and camera continuously in lockstep during large-jump handoff (zero discontinuity)", () => {
    let state = createInitialSceneControlState(0.0676);
    state = enterOrbitControl(state, 0.0676);
    const orbitCam: EngineeringCameraSnapshot = {
      position: [-4.1, 1.4, -3.8],
      target: [0, 0.4, -0.6],
      fov: 32,
    };
    state = beginTimelineHandoff(state, orbitCam, 0.55, false);
    expect(state.handoff).not.toBeNull();

    const samples: { p: number; pos: THREE.Vector3 }[] = [];
    const totalMs = state.handoff!.durationMs;
    const stepMs = totalMs / 20;

    for (let i = 0; i < 20; i += 1) {
      const out = stepSceneControlFrame(
        state,
        0.55,
        stepMs,
        false,
        mockTimelineCamera,
      );
      state = out.state;
      expect(out.camera).not.toBeNull();
      samples.push({
        p: out.effectiveProgress,
        pos: out.camera!.position.clone(),
      });
    }

    expect(state.mode).toBe("timeline");
    expect(samples.at(-1)!.p).toBeCloseTo(0.55, 6);

    // Verify monotonic progress and smooth bounded camera step sizes
    const deltas: number[] = [];
    for (let i = 1; i < samples.length; i += 1) {
      expect(samples[i].p).toBeGreaterThanOrEqual(samples[i - 1].p - 1e-9);
      deltas.push(samples[i].pos.distanceTo(samples[i - 1].pos));
    }
    const meanDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
    const maxDelta = Math.max(...deltas);
    // EaseInOutCubic peak slope is 1.5x average, allow small margin for curved clearance
    expect(maxDelta).toBeLessThan(meanDelta * 1.9);
  });

  it("handles mid-handoff Orbit interruption and live reverse scroll without snapping", () => {
    let state = createInitialSceneControlState(0.1);
    state = enterOrbitControl(state, 0.1);
    state = beginTimelineHandoff(
      state,
      { position: [-4, 1.5, -4], target: [0, 0.4, 0], fov: 33 },
      0.6,
      false,
    );

    // Advance ~45% into handoff while target reverses mid-flight
    let midProgress = 0.1;
    for (let i = 0; i < 10; i += 1) {
      const liveTarget = i < 5 ? 0.6 : 0.25;
      const out = stepSceneControlFrame(
        state,
        liveTarget,
        16,
        false,
        mockTimelineCamera,
      );
      state = out.state;
      midProgress = out.effectiveProgress;
    }
    expect(state.mode).toBe("handoff");

    // User grabs canvas to re-enter Orbit mid-blend
    state = enterOrbitControl(state);
    expect(state.mode).toBe("orbit");
    expect(state.lockedProgress).toBeCloseTo(midProgress, 6);
    expect(state.handoff).toBeNull();
  });

  it("lifts camera path clear of car chassis geometry during cross-car handoff", () => {
    const carBounds = new THREE.Box3(
      new THREE.Vector3(-1.0, 0.0, -2.5),
      new THREE.Vector3(1.0, 1.05, 2.5),
    );
    let state = createInitialSceneControlState(0.05);
    state = enterOrbitControl(state, 0.05);
    // Start directly on -X side, target directly on +X side so naive linear chord passes straight through car!
    state = beginTimelineHandoff(
      state,
      { position: [-2.6, 0.5, 0], target: [0, 0.5, 0], fov: 33 },
      0.5,
      false,
    );

    const rightSideCam = () => ({
      position: new THREE.Vector3(2.6, 0.5, 0),
      target: new THREE.Vector3(0, 0.5, 0),
      distance: 2.6,
      fov: 33,
    });

    for (let i = 0; i < 20; i += 1) {
      const out = stepSceneControlFrame(
        state,
        0.5,
        20,
        false,
        rightSideCam,
        carBounds,
      );
      state = out.state;
      if (out.camera) {
        // Camera position must NEVER penetrate carBounds!
        expect(carBounds.containsPoint(out.camera.position)).toBe(false);
      }
    }
  });

  it("handles isolation entry, retargeting, smooth blend-out on handoff, and instant snap under reducedMotion", () => {
    let state = createInitialSceneControlState(0.3);
    state = enterIsolatedControl(state, "FRONT_WING_ASSEMBLY", 0.3);
    expect(state.mode).toBe("isolated");
    expect(state.lockedProgress).toBe(0.3);

    // Step isolation blend toward 1
    for (let i = 0; i < 20; i += 1) {
      state = stepSceneControlFrame(
        state,
        0.9,
        16,
        false,
        mockTimelineCamera,
      ).state;
    }
    expect(state.effectiveProgress).toBe(0.3);
    expect(state.isolationBlend).toBeGreaterThan(0.95);

    // Retarget to another part while isolated keeps lockedProgress
    state = selectScenePart(state, "POWERTRAIN_V6_HYBRID");
    expect(state.isolatedPartId).toBe("POWERTRAIN_V6_HYBRID");
    expect(state.lockedProgress).toBe(0.3);

    // Reduced motion handoff completes immediately with 0 blend duration
    const instant = beginTimelineHandoff(
      state,
      { position: [-3, 1.5, -3], target: [0, 0.4, 0], fov: 33 },
      0.7,
      true,
    );
    expect(instant.mode).toBe("timeline");
    expect(instant.effectiveProgress).toBe(0.7);
    expect(instant.isolationBlend).toBe(0);
    expect(instant.handoff).toBeNull();
  });

  it("coalesces 46 reverse-staggered reassembly beats into <= 7 semantic UI states while keeping 3D transforms deterministic", () => {
    const distinctKeys = new Set<string>();
    const samples = 200;
    for (let i = 0; i <= samples; i += 1) {
      const p = 0.925 + (0.075 * i) / samples;
      const ev = evaluateEngineeringStoryTimeline(p);
      const returningSystemChapterId = ev.storyBeat.partId
        ? (getEngineeringStoryShot(ev.storyBeat.partId)?.chapterId ?? null)
        : null;
      distinctKeys.add(
        resolveEngineeringUiCommitKey({
          chapterId: ev.chapter.id,
          storyBeatId: ev.storyBeat.id,
          showChapterTitle: ev.showChapterTitle,
          progress: ev.progress,
          returningSystemChapterId,
        }),
      );
    }

    expect(distinctKeys.size).toBeGreaterThanOrEqual(5);
    expect(distinctKeys.size).toBeLessThanOrEqual(7);
    expect(distinctKeys.has("reassembly|chapter-title")).toBe(true);
    expect(distinctKeys.has("reassembly|locked")).toBe(true);

    // Every single one of the 46 reverse-staggered 3D parts still transitions 1 -> 0 deterministically
    expect(ENGINEERING_REASSEMBLY_SHOTS).toHaveLength(46);
    for (const item of ENGINEERING_REASSEMBLY_SHOTS) {
      const mid = (item.startProgress + item.endProgress) / 2;
      const evMid = evaluateEngineeringStoryTimeline(mid);
      const evMidRepeat = evaluateEngineeringStoryTimeline(mid);
      expect(evMid.parts[item.shot.partId].phase).toBeGreaterThan(0);
      expect(evMid.parts[item.shot.partId].phase).toBeLessThan(1);
      expect(evMid.parts[item.shot.partId]).toEqual(
        evMidRepeat.parts[item.shot.partId],
      );
    }
  });

  it("keeps STEERING_ENCODERS_LEDS mechanically coupled to STEERING_WHEEL_LCD during Shot #12 macro and separates smoothly on Shot #13", () => {
    const encOffset = [0, 0.56, -0.06] as const;
    const encEuler = [-0.08, 0, 0] as const;
    const wheelDetached = {
      tx: 0,
      ty: 0.44,
      tz: -0.14,
      rx: -0.08,
      ry: 0,
      rz: 0,
      phase: 1,
    };
    const encAttached = {
      tx: 0,
      ty: 0,
      tz: 0,
      rx: 0,
      ry: 0,
      rz: 0,
      phase: 0,
    };

    // During Shot #12 hold: encoders phase=0 rides cleanly with the detached wheel
    const coupled = resolveCoupledPartOffset(
      "STEERING_ENCODERS_LEDS",
      encAttached,
      {
        STEERING_WHEEL_LCD: wheelDetached,
        STEERING_ENCODERS_LEDS: encAttached,
      },
      encOffset,
      encEuler,
    );
    expect(coupled.ty).toBeCloseTo(0.44, 5);
    expect(coupled.tz).toBeCloseTo(-0.14, 5);
    expect(coupled.rx).toBeCloseTo(-0.08, 5);

    // During Shot #13 full separation (phase=1): reaches encoders' exact exploded offset
    const separated = resolveCoupledPartOffset(
      "STEERING_ENCODERS_LEDS",
      { ...encAttached, phase: 1 },
      { STEERING_WHEEL_LCD: wheelDetached },
      encOffset,
      encEuler,
    );
    expect(separated.ty).toBeCloseTo(0.56, 5);
    expect(separated.tz).toBeCloseTo(-0.06, 5);
  });

  it("retracts studio plinth cleanly before VENTURI_FLOOR_TITANIUM drops in Chapter 06 and clamps 3D annotations inside safe viewport bounds", () => {
    const resting = resolvePlinthRetraction(0);
    expect(resting.y).toBeCloseTo(-0.004, 4);
    expect(resting.opacityScale).toBe(1);

    const retracted = resolvePlinthRetraction(0.5);
    expect(retracted.y).toBeCloseTo(-0.824, 4);
    expect(retracted.opacityScale).toBe(0);

    const clampedDesktop = clampAnnotationScreenPosition(0.05, 0.95, false);
    expect(clampedDesktop.x).toBeGreaterThanOrEqual(0.3);
    expect(clampedDesktop.y).toBeLessThanOrEqual(0.78);

    const clampedMobile = clampAnnotationScreenPosition(0.02, 0.9, true);
    expect(clampedMobile.x).toBeGreaterThanOrEqual(0.08);
    expect(clampedMobile.y).toBeLessThanOrEqual(0.56);

    // Two-point architectural SVG leader layout places callout card clear of HUD copy and 3D bounds
    const desktopCallout = resolveLeaderCalloutLayout({
      stageWidth: 1440,
      stageHeight: 836,
      anchorX: 0.48,
      anchorY: 0.52,
      boundsMinX: 0.32,
      boundsMaxX: 0.66,
      boundsMinY: 0.36,
      boundsMaxY: 0.72,
      isMobile: false,
      cardWidth: 280,
    });
    expect(desktopCallout.anchorPxX).toBe(Math.round(0.48 * 1440));
    expect(desktopCallout.cardLeftPx).toBeGreaterThanOrEqual(1440 * 0.62);
    expect(desktopCallout.cardTopPx).toBeLessThanOrEqual(
      Math.round(0.26 * 836),
    );

    const mobileCallout = resolveLeaderCalloutLayout({
      stageWidth: 390,
      stageHeight: 780,
      anchorX: 0.52,
      anchorY: 0.54,
      boundsMinX: 0.16,
      boundsMaxX: 0.86,
      boundsMinY: 0.44,
      boundsMaxY: 0.68,
      isMobile: true,
      cardWidth: 280,
    });
    expect(mobileCallout.align).toBe("center");
    // Placed in the clean upper studio shelf above boundsMinY (never covering center of car)
    expect(mobileCallout.cardTopPx).toBeLessThan(0.44 * 780);
    expect(mobileCallout.cardTopPx).toBeGreaterThanOrEqual(
      Math.round(780 * 0.31),
    );
  });
});
