import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ENGINEERING_PARTS } from "./engineeringDisassemblyData";
import {
  ENGINEERING_REASSEMBLY_SHOTS,
  ENGINEERING_STORY_BEATS,
  ENGINEERING_STORY_CHAPTERS,
  ENGINEERING_STORY_COCKPIT_PROGRESS,
  ENGINEERING_STORY_SHOTS,
  ENGINEERING_STORY_SCROLL_VH,
  evaluateEngineeringStoryTimeline,
  getEngineeringStoryShot,
  resolveEngineeringStoryDeepLinkProgress,
  resolveEngineeringStoryShotProgress,
  validateEngineeringStoryRegister,
} from "./engineeringStoryTimeline";

describe("FP-04 RB cinematic story register", () => {
  it("orders 47 unique story shots against all 47 named GLB nodes", () => {
    const glb = readFileSync("public/models/fp04rb-engineering-v1.glb");
    expect(glb.toString("ascii", 0, 4)).toBe("glTF");
    const jsonLength = glb.readUInt32LE(12);
    const document = JSON.parse(glb.toString("utf8", 20, 20 + jsonLength)) as {
      nodes: Array<{ mesh?: number; name?: string }>;
    };
    const meshNames = document.nodes
      .filter((node) => node.mesh !== undefined)
      .map((node) => node.name)
      .filter((name): name is string => Boolean(name));

    expect(meshNames).toHaveLength(47);
    expect(new Set(ENGINEERING_STORY_SHOTS.map((shot) => shot.partId))).toEqual(
      new Set(meshNames),
    );
    expect(
      new Set(ENGINEERING_STORY_SHOTS.map((shot) => shot.partId)).size,
    ).toBe(47);
    expect(ENGINEERING_STORY_SHOTS.map((shot) => shot.index)).toEqual(
      Array.from({ length: 47 }, (_, index) => index + 1),
    );
    expect(validateEngineeringStoryRegister()).toEqual([]);
    expect(ENGINEERING_STORY_SCROLL_VH).toBe(1600);
    expect(ENGINEERING_PARTS).toHaveLength(47);
  });

  it("follows the requested chapter and corner order with distinct framing metadata", () => {
    expect(ENGINEERING_STORY_CHAPTERS.map((chapter) => chapter.id)).toEqual([
      "origin",
      "aero",
      "cockpit",
      "corners",
      "bodywork",
      "core",
      "matrix",
      "reassembly",
    ]);
    expect(
      ENGINEERING_STORY_SHOTS.filter(
        (shot) => shot.chapterId === "corners",
      ).map((shot) => shot.partId.slice(0, 2)),
    ).toEqual([
      "FL",
      "FL",
      "FL",
      "FL",
      "FL",
      "FR",
      "FR",
      "FR",
      "FR",
      "FR",
      "RR",
      "RR",
      "RR",
      "RR",
      "RR",
      "RL",
      "RL",
      "RL",
      "RL",
      "RL",
    ]);
    expect(
      ENGINEERING_STORY_SHOTS.every((shot) => shot.title.vi && shot.title.en),
    ).toBe(true);
    expect(
      ENGINEERING_STORY_SHOTS.every(
        (shot) => shot.location.vi && shot.location.en,
      ),
    ).toBe(true);
    expect(
      ENGINEERING_STORY_SHOTS.every(
        (shot) => shot.caption.vi && shot.caption.en,
      ),
    ).toBe(true);
    expect(
      ENGINEERING_STORY_SHOTS.filter((shot) => shot.durationVh === 45).map(
        (shot) => shot.partId,
      ),
    ).toEqual([
      "FRONT_WING_ASSEMBLY",
      "REAR_DRS_FLAP_ACTUATOR",
      "COCKPIT_HALO",
      "STEERING_WHEEL_LCD",
      "FL_BRAKE_SUSPENSION",
      "VENTURI_FLOOR_TITANIUM",
      "POWERTRAIN_V6_HYBRID",
    ]);
    expect(ENGINEERING_STORY_SHOTS.at(-1)?.partId).toBe("MONOCOQUE_CHASSIS");
    expect(ENGINEERING_STORY_SHOTS.at(-1)?.durationVh).toBe(110);

    // Driver-eye POV: steering wheel OLED and rotary encoders face +Z toward the driver
    const wheelShot = getEngineeringStoryShot("STEERING_WHEEL_LCD");
    const encodersShot = getEngineeringStoryShot("STEERING_ENCODERS_LEDS");
    expect(wheelShot?.camera.direction[2]).toBeGreaterThan(0.8);
    expect(encodersShot?.camera.direction[2]).toBeGreaterThan(0.8);
  });

  it("uses half-open chapter boundaries and deterministic approach, detach and hold phases", () => {
    for (let index = 0; index < ENGINEERING_STORY_CHAPTERS.length; index += 1) {
      const chapter = ENGINEERING_STORY_CHAPTERS[index];
      expect(
        evaluateEngineeringStoryTimeline(chapter.range[0]).chapter.id,
      ).toBe(chapter.id);
      if (index > 0) {
        const previous = ENGINEERING_STORY_CHAPTERS[index - 1];
        expect(previous.range[1]).toBe(chapter.range[0]);
        expect(
          evaluateEngineeringStoryTimeline(chapter.range[0] - 1e-7).chapter.id,
        ).toBe(previous.id);
      }
    }

    for (const shot of ENGINEERING_STORY_SHOTS) {
      const approach = evaluateEngineeringStoryTimeline(shot.approachProgress);
      expect(approach.storyBeat.partId).toBe(shot.partId);
      expect(approach.parts[shot.partId].phase).toBe(0);
      expect(approach.cameraRoute.to.id).toBe(`focus-${shot.id}`);
      expect(approach.cameraRoute.progress).toBeGreaterThanOrEqual(0);

      if (shot.partId !== "MONOCOQUE_CHASSIS") {
        const detaching = evaluateEngineeringStoryTimeline(
          (shot.approachProgress + shot.detachEndProgress) / 2,
        );
        expect(detaching.parts[shot.partId].phase).toBeGreaterThan(0);
        expect(detaching.parts[shot.partId].phase).toBeLessThan(1);
        expect(
          evaluateEngineeringStoryTimeline(shot.detachEndProgress).parts[
            shot.partId
          ].phase,
        ).toBe(1);
        expect(
          evaluateEngineeringStoryTimeline(shot.holdProgress).parts[shot.partId]
            .phase,
        ).toBe(1);
      }
    }
  });

  it("reaches the complete exploded tableau and restores the exact original pose and camera", () => {
    const matrix = getEngineeringStoryShot("MONOCOQUE_CHASSIS");
    expect(matrix).not.toBeNull();
    const tableau = evaluateEngineeringStoryTimeline(matrix!.holdProgress);
    expect(tableau.chapter.id).toBe("matrix");
    expect(tableau.explodeRatio).toBe(1);
    expect(tableau.parts.MONOCOQUE_CHASSIS.phase).toBe(0);

    const start = evaluateEngineeringStoryTimeline(0);
    const finish = evaluateEngineeringStoryTimeline(1);
    expect(finish.explodeRatio).toBe(0);
    expect(finish.parts).toEqual(start.parts);
    expect(finish.cameraRoute.from.id).toBe(start.cameraRoute.from.id);
    expect(finish.cameraRoute.to.id).toBe(start.cameraRoute.to.id);
    expect(finish.cameraRoute.progress).toBe(start.cameraRoute.progress);
  });

  it("returns components in reverse order and preserves the cockpit/deep-link destinations", () => {
    expect(
      ENGINEERING_REASSEMBLY_SHOTS.map((item) => item.shot.partId),
    ).toEqual(
      ENGINEERING_STORY_SHOTS.filter(
        (shot) => shot.partId !== "MONOCOQUE_CHASSIS",
      )
        .map((shot) => shot.partId)
        .reverse(),
    );
    for (const item of ENGINEERING_REASSEMBLY_SHOTS) {
      const start = evaluateEngineeringStoryTimeline(item.startProgress);
      const end = evaluateEngineeringStoryTimeline(item.endProgress);
      expect(start.storyBeat.id).toBe(`return-${item.shot.id}`);
      expect(start.parts[item.shot.partId].phase).toBe(1);
      expect(end.parts[item.shot.partId].phase).toBe(0);
    }

    expect(resolveEngineeringStoryDeepLinkProgress("cockpit")).toBe(
      ENGINEERING_STORY_COCKPIT_PROGRESS,
    );
    expect(resolveEngineeringStoryDeepLinkProgress("halo")).toBe(
      ENGINEERING_STORY_COCKPIT_PROGRESS,
    );
    expect(ENGINEERING_STORY_CHAPTERS[0].focusProgress).toBe(0);
    expect(
      evaluateEngineeringStoryTimeline(
        ENGINEERING_STORY_CHAPTERS[0].focusProgress,
      ).showChapterTitle,
    ).toBe(true);
    expect(resolveEngineeringStoryDeepLinkProgress("cockpit-halo")).toBe(
      getEngineeringStoryShot("COCKPIT_HALO")?.holdProgress,
    );
    expect(resolveEngineeringStoryDeepLinkProgress("front-wing")).toBe(
      getEngineeringStoryShot("FRONT_WING_ASSEMBLY")?.holdProgress,
    );
    expect(resolveEngineeringStoryDeepLinkProgress("unknown")).toBeNull();
    expect(resolveEngineeringStoryShotProgress(1)).toBe(
      ENGINEERING_STORY_SHOTS[0].holdProgress,
    );
    expect(resolveEngineeringStoryShotProgress(48)).toBeNull();
    expect(ENGINEERING_STORY_BEATS.filter((beat) => beat.partId).length).toBe(
      47,
    );
  });
});
