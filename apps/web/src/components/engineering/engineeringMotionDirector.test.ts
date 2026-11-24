import { readFileSync } from "node:fs";
import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { ENGINEERING_PARTS } from "./engineeringDisassemblyData";
import {
  beginTimelineHandoff,
  createInitialSceneControlState,
  enterIsolatedControl,
  enterOrbitControl,
  resolveEngineeringUiCommitKey,
  resolvePlinthRetraction,
  stepSceneControlFrame,
} from "./engineeringInteractionState";
import { ENGINEERING_CHAPTER_LIGHT_PRESETS } from "./engineeringLightingRig";
import {
  FRONT_WING_MOTION_PHASES,
  ORCHESTRATED_SIGNATURE_PART_IDS,
  SIGNATURE_SHOT_ORCHESTRATIONS,
  classifyMechanicalChoreography,
  evaluateEngineeringMotionDirector,
  getSignatureShotPhases,
  resolveDirectorPartTransform,
  type EngineeringMotionPhaseId,
} from "./engineeringMotionDirector";
import {
  fitEngineeringCameraToBounds,
  interpolateEngineeringCameraFrames,
  type EngineeringSafeViewRegion,
} from "./engineeringShotCamera";
import {
  ENGINEERING_STORY_CHAPTERS,
  ENGINEERING_STORY_SCROLL_VH,
  ENGINEERING_STORY_SHOTS,
  getEngineeringStoryShot,
  resolveEngineeringStoryDeepLinkProgress,
} from "./engineeringStoryTimeline";

const TEST_SAFE_REGION: EngineeringSafeViewRegion = {
  left: 0.24,
  top: 0.04,
  width: 0.73,
  height: 0.84,
};

function solveCameraAtUnits(units: number) {
  const p = units / ENGINEERING_STORY_SCROLL_VH;
  const cue = evaluateEngineeringMotionDirector({ effectiveProgress: p });

  const carBounds = new THREE.Box3(
    new THREE.Vector3(-0.98, 0.0, -2.75),
    new THREE.Vector3(0.98, 1.05, 2.75),
  );

  // Representative world bounds per part family with live director offset
  const baseBoundsFor = (partId: string): THREE.Box3 => {
    const snap = cue.parts[partId] ?? {
      tx: 0,
      ty: 0,
      tz: 0,
      rx: 0,
      ry: 0,
      rz: 0,
      phase: 0,
    };
    const shift = (
      min: [number, number, number],
      max: [number, number, number],
    ) =>
      new THREE.Box3(
        new THREE.Vector3(min[0] + snap.tx, min[1] + snap.ty, min[2] + snap.tz),
        new THREE.Vector3(max[0] + snap.tx, max[1] + snap.ty, max[2] + snap.tz),
      );
    if (partId === "FRONT_WING_ASSEMBLY")
      return shift([-0.96, 0.04, -2.75], [0.96, 0.34, -1.85]);
    if (partId === "REAR_DRS_FLAP_ACTUATOR")
      return shift([-0.52, 0.72, 2.15], [0.52, 0.96, 2.58]);
    if (partId === "COCKPIT_HALO")
      return shift([-0.28, 0.62, -0.58], [0.28, 0.98, 0.24]);
    if (partId === "STEERING_WHEEL_LCD")
      return shift([-0.15, 0.48, -0.45], [0.15, 0.68, -0.32]);
    if (partId === "FL_BRAKE_SUSPENSION")
      return shift([-0.85, 0.16, -1.65], [-0.42, 0.56, -1.15]);
    if (partId === "VENTURI_FLOOR_TITANIUM")
      return shift([-0.84, 0.02, -1.85], [0.84, 0.28, 2.15]);
    if (partId === "POWERTRAIN_V6_HYBRID")
      return shift([-0.38, 0.18, 0.25], [0.38, 0.78, 1.45]);
    if (partId === "NOSECONE_SHELL")
      return shift([-0.32, 0.24, -2.1], [0.32, 0.62, -1.05]);
    return shift([-0.45, 0.2, -0.45], [0.45, 0.75, 0.45]);
  };

  const sceneBounds = carBounds
    .clone()
    .union(baseBoundsFor("FRONT_WING_ASSEMBLY"))
    .union(baseBoundsFor("VENTURI_FLOOR_TITANIUM"));

  const boundsFor = (partId: string | null) =>
    partId ? baseBoundsFor(partId) : sceneBounds;

  const { route, arcLiftMultiplier } = cue.cameraCue;
  const fit = (anchor: typeof route.from) =>
    fitEngineeringCameraToBounds(boundsFor(anchor.framingPartId), {
      viewportWidth: 1440,
      viewportHeight: 900,
      safeRegion: TEST_SAFE_REGION,
      direction: anchor.direction,
      fov: anchor.fov,
      framing: anchor.framing,
      lookTargetBias: anchor.lookTargetBias,
      targetBounds: boundsFor(anchor.subjectPartId),
    })!;

  if (route.from.id === route.to.id || route.progress <= 1e-6) {
    return { frame: fit(route.from), fov: route.from.fov, carBounds };
  }
  if (route.progress >= 1 - 1e-6) {
    return { frame: fit(route.to), fov: route.to.fov, carBounds };
  }
  const fromFrame = fit(route.from);
  const toFrame = fit(route.to);
  const sphere = sceneBounds.getBoundingSphere(new THREE.Sphere());
  const frame = interpolateEngineeringCameraFrames(
    fromFrame,
    toFrame,
    route.progress,
    sphere.radius * arcLiftMultiplier,
  );
  const smooth = route.progress * route.progress * (3 - 2 * route.progress);
  return {
    frame,
    fov: THREE.MathUtils.lerp(route.from.fov, route.to.fov, smooth),
    carBounds,
  };
}

describe("engineeringMotionDirector — Full 8-Chapter / 47-Node Orchestration (P1–P5)", () => {
  it("orchestrates all 8 signature hero sequences with 6 contiguous half-open bilingual phases", () => {
    expect(ORCHESTRATED_SIGNATURE_PART_IDS).toEqual([
      "FRONT_WING_ASSEMBLY",
      "REAR_DRS_FLAP_ACTUATOR",
      "COCKPIT_HALO",
      "STEERING_WHEEL_LCD",
      "FL_BRAKE_SUSPENSION",
      "VENTURI_FLOOR_TITANIUM",
      "POWERTRAIN_V6_HYBRID",
      "MONOCOQUE_CHASSIS",
    ]);
    expect(FRONT_WING_MOTION_PHASES).toHaveLength(6);

    for (const partId of ORCHESTRATED_SIGNATURE_PART_IDS) {
      const phases = getSignatureShotPhases(partId)!;
      const shot = getEngineeringStoryShot(partId)!;
      expect(phases.map((p) => p.id)).toEqual([
        "establish",
        "approach",
        "detach",
        "inspect",
        "explain",
        "transition",
      ]);
      expect(phases[0].startUnits).toBe(shot.startUnits);
      expect(phases.at(-1)!.endUnits).toBe(shot.endUnits);

      for (let i = 0; i < phases.length; i += 1) {
        const phase = phases[i];
        expect(phase.index).toBe(i + 1);
        expect(phase.endUnits).toBeGreaterThan(phase.startUnits);
        expect(phase.label.en.length).toBeGreaterThan(0);
        expect(phase.label.vi.length).toBeGreaterThan(0);
        expect(phase.caption.en.length).toBeGreaterThan(0);
        expect(phase.caption.vi.length).toBeGreaterThan(0);

        if (i > 0) {
          const prev = phases[i - 1];
          expect(prev.endUnits).toBe(phase.startUnits);
          const before = evaluateEngineeringMotionDirector({
            effectiveProgress: phase.startProgress - 1e-5,
          });
          expect(before.activePhaseCue?.phaseId).toBe(prev.id);
        }

        const mid = (phase.startProgress + phase.endProgress) / 2;
        const evalMid = evaluateEngineeringMotionDirector({
          effectiveProgress: mid,
        });
        expect(evalMid.activePhaseCue?.partId).toBe(partId);
        expect(evalMid.activePhaseCue?.phaseId).toBe(phase.id);
        expect(evalMid.editorialCue.phaseId).toBe(phase.id);
      }
    }
  });

  it("is strictly deterministic and symmetric across full 0..1 forward, reverse, and arbitrary scrubber seeks", () => {
    const sampleCount = 320;
    const forward = Array.from({ length: sampleCount + 1 }, (_, i) =>
      evaluateEngineeringMotionDirector({
        effectiveProgress: i / sampleCount,
      }),
    );

    for (let i = sampleCount; i >= 0; i -= 1) {
      const reverse = evaluateEngineeringMotionDirector({
        effectiveProgress: i / sampleCount,
      });
      expect(reverse).toEqual(forward[i]);
    }

    const scrubberJumps = [
      0.99, 0.052, 0.89, 0.275, 0.071, 0.445, 0.785, 0.185, 0.0, 1.0,
    ];
    for (const p of scrubberJumps) {
      const a = evaluateEngineeringMotionDirector({ effectiveProgress: p });
      const b = evaluateEngineeringMotionDirector({ effectiveProgress: p });
      expect(b).toEqual(a);
    }
  });

  it("applies distinct mechanical choreography per subsystem with zero transform drift and exact 47-part reassembly", () => {
    // 1. Front Wing: axial Z releases early while pitch RX delays until u >= 0.18
    const fwShot = getEngineeringStoryShot("FRONT_WING_ASSEMBLY")!;
    const fwEarly = evaluateEngineeringMotionDirector({
      effectiveProgress:
        (fwShot.approachEndUnits + 0.9) / ENGINEERING_STORY_SCROLL_VH,
    });
    expect(fwEarly.parts.FRONT_WING_ASSEMBLY.tz).toBeLessThan(-0.3);
    expect(fwEarly.parts.FRONT_WING_ASSEMBLY.rx).toBe(0);

    // 2. Rear DRS Flap: hinge opens first (rx > 0) before lift/aft completes
    const drsShot = getEngineeringStoryShot("REAR_DRS_FLAP_ACTUATOR")!;
    const drsEarly = evaluateEngineeringMotionDirector({
      effectiveProgress:
        (drsShot.approachEndUnits + 0.9) / ENGINEERING_STORY_SCROLL_VH,
    });
    expect(drsEarly.parts.REAR_DRS_FLAP_ACTUATOR.rx).toBeGreaterThan(0.05);
    expect(drsEarly.parts.REAR_DRS_FLAP_ACTUATOR.ty).toBe(0);

    // 3. Titanium Halo: vertical hoist leads before aft/pitch
    const haloShot = getEngineeringStoryShot("COCKPIT_HALO")!;
    const haloEarly = evaluateEngineeringMotionDirector({
      effectiveProgress:
        (haloShot.approachEndUnits + 1.1) / ENGINEERING_STORY_SCROLL_VH,
    });
    expect(haloEarly.parts.COCKPIT_HALO.ty).toBeGreaterThan(0.2);
    expect(haloEarly.parts.COCKPIT_HALO.rx).toBe(0);

    // 4. Centerlock Nuts: authentic helical 720° spin leads ahead of lateral slide
    const nutShot = getEngineeringStoryShot("FL_CENTERLOCK_NUT")!;
    const nutEarly = evaluateEngineeringMotionDirector({
      effectiveProgress:
        (nutShot.approachEndUnits + 0.4) / ENGINEERING_STORY_SCROLL_VH,
    });
    expect(Math.abs(nutEarly.parts.FL_CENTERLOCK_NUT.rx)).toBeGreaterThan(1.0);
    expect(nutEarly.parts.FL_CENTERLOCK_NUT.tx).toBe(0);

    // 5. Powertrain V6: vertical extraction clears bulkhead before sliding aft
    const puShot = getEngineeringStoryShot("POWERTRAIN_V6_HYBRID")!;
    const puEarly = evaluateEngineeringMotionDirector({
      effectiveProgress:
        (puShot.approachEndUnits + 1.2) / ENGINEERING_STORY_SCROLL_VH,
    });
    expect(puEarly.parts.POWERTRAIN_V6_HYBRID.ty).toBeGreaterThan(0.1);
    expect(puEarly.parts.POWERTRAIN_V6_HYBRID.tz).toBe(0);

    // 6. Venturi Floor retraction synchronization
    const floorShot = getEngineeringStoryShot("VENTURI_FLOOR_TITANIUM")!;
    const floorMid = evaluateEngineeringMotionDirector({
      effectiveProgress: floorShot.holdProgress,
    });
    expect(floorMid.parts.VENTURI_FLOOR_TITANIUM.ty).toBeCloseTo(-0.72, 10);
    expect(
      resolvePlinthRetraction(floorMid.parts.VENTURI_FLOOR_TITANIUM.phase)
        .opacityScale,
    ).toBe(0);

    // 7. Zero transform drift for EVERY SINGLE ONE of the 47 parts at boundaries & matrix
    const matrixShot = getEngineeringStoryShot("MONOCOQUE_CHASSIS")!;
    const matrixCue = evaluateEngineeringMotionDirector({
      effectiveProgress: matrixShot.holdProgress,
    });
    expect(matrixCue.story.explodeRatio).toBe(1);
    for (const part of ENGINEERING_PARTS) {
      const snap = matrixCue.parts[part.id];
      if (part.id === "MONOCOQUE_CHASSIS") {
        expect(snap.phase).toBe(0);
      } else {
        expect(snap.phase).toBe(1);
        expect(snap.tx).toBeCloseTo(part.explodeOffset[0], 10);
        expect(snap.ty).toBeCloseTo(part.explodeOffset[1], 10);
        expect(snap.tz).toBeCloseTo(part.explodeOffset[2], 10);
        expect(snap.rx).toBeCloseTo(part.explodeEuler[0], 10);
        expect(snap.ry).toBeCloseTo(part.explodeEuler[1], 10);
        expect(snap.rz).toBeCloseTo(part.explodeEuler[2], 10);
      }
      expect(classifyMechanicalChoreography(part.id)).toBeTruthy();
    }

    // 8. Exact datum restoration at p = 0 and p = 1 across ALL 47 parts
    const start = evaluateEngineeringMotionDirector({ effectiveProgress: 0 });
    const end = evaluateEngineeringMotionDirector({ effectiveProgress: 1 });
    expect(start.story.explodeRatio).toBe(0);
    expect(end.story.explodeRatio).toBe(0);
    expect(end.parts).toEqual(start.parts);
    expect(end.lightingCue).toEqual(ENGINEERING_CHAPTER_LIGHT_PRESETS.origin);
  });

  it("maintains continuous non-teleporting camera trajectories and active Inspect sweeps across all signature shots", () => {
    for (const sig of SIGNATURE_SHOT_ORCHESTRATIONS) {
      const startU = Math.max(0, sig.shot.startUnits - 4);
      const endU = Math.min(ENGINEERING_STORY_SCROLL_VH, sig.shot.endUnits + 4);
      let prevPos: THREE.Vector3 | null = null;
      let maxStep = 0;

      for (let u = startU; u <= endU; u += 0.5) {
        const { frame } = solveCameraAtUnits(u);
        expect(Number.isFinite(frame.position.x)).toBe(true);
        expect(Number.isFinite(frame.position.y)).toBe(true);
        expect(Number.isFinite(frame.position.z)).toBe(true);
        if (prevPos) {
          const step = frame.position.distanceTo(prevPos);
          if (step > maxStep) maxStep = step;
        }
        prevPos = frame.position.clone();
      }
      // Smooth continuous motion per 0.5vh (no discontinuity / teleport spike)
      expect(maxStep).toBeLessThan(1.35);

      // Every signature shot performs an active Inspect camera sweep (never frozen statically)
      const inspectPhase = sig.phases[3];
      const inspectStart = solveCameraAtUnits(inspectPhase.startUnits + 0.2)
        .frame.position;
      const inspectEnd = solveCameraAtUnits(inspectPhase.endUnits - 0.2).frame
        .position;
      expect(inspectStart.distanceTo(inspectEnd)).toBeGreaterThan(0.12);
    }

    // Front Wing sweep specifically keeps camera outside car body bounds
    for (let u = 60; u <= 132; u += 0.5) {
      const { frame, carBounds } = solveCameraAtUnits(u);
      expect(carBounds.containsPoint(frame.position)).toBe(false);
    }
  });

  it("produces deterministic calibrated lighting across all 8 chapters without OLED glare or boundary spikes", () => {
    let prevKey = evaluateEngineeringMotionDirector({ effectiveProgress: 0 })
      .lightingCue.keyIntensity;

    for (let u = 0; u <= ENGINEERING_STORY_SCROLL_VH; u += 2) {
      const cue = evaluateEngineeringMotionDirector({
        effectiveProgress: u / ENGINEERING_STORY_SCROLL_VH,
      });
      const L = cue.lightingCue;
      expect(L.ambientIntensity).toBeGreaterThanOrEqual(0.35);
      expect(L.ambientIntensity).toBeLessThanOrEqual(0.58);
      expect(L.keyIntensity).toBeGreaterThanOrEqual(1.8);
      expect(L.keyIntensity).toBeLessThanOrEqual(2.85);
      expect(L.accentPointIntensity).toBeLessThanOrEqual(1.65);
      // Bounded lighting slope (no abrupt flash across chapter transitions)
      expect(Math.abs(L.keyIntensity - prevKey)).toBeLessThan(0.35);
      prevKey = L.keyIntensity;
    }

    // Steering wheel OLED keeps off-axis lighting (|accentX| > 0.7) to prevent screen glare
    const wheelCue = evaluateEngineeringMotionDirector({
      effectiveProgress:
        getEngineeringStoryShot("STEERING_WHEEL_LCD")!.holdProgress,
    });
    expect(
      Math.abs(wheelCue.lightingCue.accentPointPosition[0]),
    ).toBeGreaterThan(0.7);

    // Venturi floor uses upward cool bounce below chassis
    const floorCue = evaluateEngineeringMotionDirector({
      effectiveProgress: getEngineeringStoryShot("VENTURI_FLOOR_TITANIUM")!
        .holdProgress,
    });
    expect(floorCue.lightingCue.accentPointPosition[1]).toBeLessThan(-0.8);

    // Cockpit interior seat/liner smoothly lifts tub fill lighting
    const seatCue = evaluateEngineeringMotionDirector({
      effectiveProgress: getEngineeringStoryShot("COCKPIT_SEAT_CARBON")!
        .holdProgress,
    });
    expect(seatCue.lightingCue.accentPointIntensity).toBeGreaterThan(1.2);
  });

  it("handles rapid chapter switching, deep links, UI commit coalescing, and Orbit/Isolation handoff without conflicts", () => {
    // 1. Every signature shot coalesces into exactly 6 discrete UI commit keys
    for (const sig of SIGNATURE_SHOT_ORCHESTRATIONS) {
      const keys = new Set<string>();
      const seen = new Set<EngineeringMotionPhaseId>();
      for (let u = sig.shot.startUnits; u < sig.shot.endUnits; u += 0.5) {
        const cue = evaluateEngineeringMotionDirector({
          effectiveProgress: u / ENGINEERING_STORY_SCROLL_VH,
        });
        if (cue.activePhaseCue) seen.add(cue.activePhaseCue.phaseId);
        keys.add(
          resolveEngineeringUiCommitKey({
            chapterId: cue.story.chapter.id,
            storyBeatId: cue.story.storyBeat.id,
            showChapterTitle: cue.editorialCue.showChapterTitle,
            progress: cue.progress,
            motionPhaseId: cue.activePhaseCue?.phaseId ?? null,
          }),
        );
      }
      expect(seen.size).toBe(6);
      expect(keys.size).toBe(6);
    }

    // 2. Rapid chapter switching & deep links across all 8 chapters
    const rapidSequence = [
      "front-wing",
      "matrix",
      "cockpit",
      "core",
      "corners",
      "bodywork",
      "reassembly",
      "origin",
      "rear-wing",
      "suspension",
      "floor",
    ];
    for (const key of rapidSequence) {
      const p = resolveEngineeringStoryDeepLinkProgress(key);
      expect(p).not.toBeNull();
      const cue = evaluateEngineeringMotionDirector({ effectiveProgress: p! });
      expect(cue.progress).toBeCloseTo(p!, 9);
    }
    expect(ENGINEERING_STORY_CHAPTERS).toHaveLength(8);
    expect(ENGINEERING_STORY_SHOTS).toHaveLength(47);

    // 3. Orbit -> Isolation -> Handoff cycle with Motion Director camera resolver
    const carBounds = new THREE.Box3(
      new THREE.Vector3(-1, 0, -2.75),
      new THREE.Vector3(1, 1.05, 2.75),
    );
    let ctrl = createInitialSceneControlState(0.065);
    ctrl = enterOrbitControl(ctrl, 0.065);
    ctrl = enterIsolatedControl(ctrl, "POWERTRAIN_V6_HYBRID", 0.065);
    const puSpec = ENGINEERING_PARTS.find(
      (p) => p.id === "POWERTRAIN_V6_HYBRID",
    )!;
    const isolatedCue = evaluateEngineeringMotionDirector({
      effectiveProgress: ctrl.effectiveProgress,
      controlMode: ctrl.mode,
      isolatedPartId: ctrl.isolatedPartId,
      isolationBlend: 1,
    });
    const puPose = resolveDirectorPartTransform({
      partId: puSpec.id,
      cueSheet: isolatedCue,
      explodeOffset: puSpec.explodeOffset,
      explodeEuler: puSpec.explodeEuler,
      internalSystem: true,
      controlMode: "isolated",
      isolatedPartId: puSpec.id,
      transitionPartId: puSpec.id,
      isolationBlend: 1,
      xray: false,
    });
    expect(puPose?.visible).toBe(true);
    expect(puPose?.ty).toBeCloseTo(puSpec.explodeOffset[1], 6);

    ctrl = beginTimelineHandoff(
      ctrl,
      { position: [-3.5, 1.4, 2.8], target: [0, 0.4, 0.4], fov: 31 },
      0.8,
      false,
    );
    for (let i = 0; i < 40; i += 1) {
      const out = stepSceneControlFrame(
        ctrl,
        0.8,
        16,
        false,
        (p) => {
          const solved = solveCameraAtUnits(p * ENGINEERING_STORY_SCROLL_VH);
          return {
            position: solved.frame.position,
            target: solved.frame.target,
            distance: solved.frame.distance,
            fov: solved.fov,
          };
        },
        carBounds,
      );
      ctrl = out.state;
      if (out.camera) {
        expect(carBounds.containsPoint(out.camera.position)).toBe(false);
      }
    }
    expect(ctrl.mode).toBe("timeline");
    expect(ctrl.effectiveProgress).toBeCloseTo(0.8, 5);
  });

  it("coordinates studio environment cues, quiet-transit HUD flags, and C1 zero-jerk fastener breakaway", () => {
    const originCue = evaluateEngineeringMotionDirector({
      effectiveProgress: 0,
    });
    expect(originCue.environmentCue.studioMode).toBe("cinematic");
    expect(originCue.environmentCue.trajectoryOpacity).toBe(0);
    expect(originCue.environmentCue.datumGridOpacity).toBeLessThan(0.2);

    const fwApproach = evaluateEngineeringMotionDirector({
      effectiveProgress: 87 / ENGINEERING_STORY_SCROLL_VH,
    });
    expect(fwApproach.activePhaseCue?.phaseId).toBe("approach");
    expect(fwApproach.editorialCue.isCameraTransit).toBe(true);
    expect(fwApproach.environmentCue.trajectoryOpacity).toBe(0);

    const fwExplain = evaluateEngineeringMotionDirector({
      effectiveProgress: 113.6 / ENGINEERING_STORY_SCROLL_VH,
    });
    expect(fwExplain.activePhaseCue?.phaseId).toBe("explain");
    expect(fwExplain.editorialCue.isCameraTransit).toBe(false);
    expect(fwExplain.environmentCue.datumGridOpacity).toBeGreaterThan(
      fwApproach.environmentCue.datumGridOpacity,
    );
    expect(fwExplain.environmentCue.focalSpecularBoost).toBeGreaterThan(1.15);

    // Verify C1 zero-jerk mechanical breakaway at detach start (initial velocity ~ 0, no pop)
    const fwShot = getEngineeringStoryShot("FRONT_WING_ASSEMBLY")!;
    const epsVh = 0.05;
    const atStart = evaluateEngineeringMotionDirector({
      effectiveProgress: fwShot.approachEndUnits / ENGINEERING_STORY_SCROLL_VH,
    });
    const justAfterStart = evaluateEngineeringMotionDirector({
      effectiveProgress:
        (fwShot.approachEndUnits + epsVh) / ENGINEERING_STORY_SCROLL_VH,
    });
    expect(atStart.parts.FRONT_WING_ASSEMBLY.tz).toBeCloseTo(0, 12);
    expect(Math.abs(justAfterStart.parts.FRONT_WING_ASSEMBLY.tz)).toBeLessThan(
      0.005,
    );
  });

  it("preserves deterministic unmount cleanup contracts in Stage and IndexPage", () => {
    const stageSrc = readFileSync(
      "src/components/engineering/EngineeringDisassemblyStage.tsx",
      "utf8",
    );
    const pageSrc = readFileSync(
      "src/components/engineering/EngineeringIndexPage.tsx",
      "utf8",
    );
    expect(stageSrc).toContain("disposeThreeSceneResources");
    expect(stageSrc).toContain("abortController.abort()");
    expect(stageSrc).toContain("gl.renderLists.dispose()");
    expect(stageSrc).toContain('frameloop={stageActive ? "always" : "demand"}');
    expect(pageSrc).toContain("window.cancelAnimationFrame");
    expect(pageSrc).toContain("observer.disconnect()");
    expect(pageSrc).toContain("removeEventListener");
  });
});
