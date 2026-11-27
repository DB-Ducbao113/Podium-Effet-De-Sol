import { describe, expect, it } from "vitest";
import { ENGINEERING_PARTS } from "../engineering/engineeringDisassemblyData";
import {
  ENGINEERING_SHOW_SCENES,
  ENGINEERING_SHOW_TOTAL_VH,
  SHOW_AUTOPLAY_DWELL_SEC,
  SHOW_AUTOPLAY_TRANSITION_SEC,
  SHOW_SCENE_SCROLL_VH,
  SHOW_TRANSITION_RATIO,
  evaluateEngineeringShowScroll,
  getShowScrollForScene,
  stepShowTimelineProgress,
} from "./engineeringShowScript";

describe("engineeringShowScript · 12-scene story & rhythmic resting dwell plateaus", () => {
  it("defines 12 chronologically ordered bilingual scenes with calm pacing and studio moods", () => {
    expect(ENGINEERING_SHOW_SCENES).toHaveLength(12);
    expect(SHOW_SCENE_SCROLL_VH).toBeGreaterThanOrEqual(140);
    expect(ENGINEERING_SHOW_TOTAL_VH).toBeGreaterThanOrEqual(1680);
    expect(SHOW_AUTOPLAY_TRANSITION_SEC).toBeGreaterThanOrEqual(2.0);
    expect(SHOW_AUTOPLAY_TRANSITION_SEC).toBeLessThanOrEqual(2.6);
    expect(SHOW_AUTOPLAY_DWELL_SEC).toBeGreaterThanOrEqual(3.8);
    expect(SHOW_AUTOPLAY_DWELL_SEC).toBeLessThanOrEqual(4.8);
    const validPartIds = new Set(ENGINEERING_PARTS.map((p) => p.id));

    let prevAnchor = -1;
    for (const [idx, scene] of ENGINEERING_SHOW_SCENES.entries()) {
      expect(scene.index).toBe(idx);
      expect(scene.anchorProgress).toBeGreaterThan(prevAnchor);
      expect(scene.anchorProgress).toBeLessThanOrEqual(1);
      prevAnchor = scene.anchorProgress;

      if (scene.partId !== null) {
        expect(validPartIds.has(scene.partId)).toBe(true);
      }
      expect(scene.mood.length).toBeGreaterThan(0);
      expect(["left", "right"]).toContain(scene.storySide);
      if (scene.chapterId === "cockpit") {
        expect(scene.storySide).toBe("right");
      }
      expect(scene.title.vi.length).toBeGreaterThan(4);
      expect(scene.title.en.length).toBeGreaterThan(4);
      expect(scene.narrative.vi.length).toBeGreaterThan(40);
      expect(scene.narrative.en.length).toBeGreaterThan(40);
    }

    expect(ENGINEERING_SHOW_SCENES[0].anchorProgress).toBe(0);
    expect(ENGINEERING_SHOW_SCENES[11].anchorProgress).toBe(1);
  });

  it("choreographs exiting -> hidden -> entering -> visible text stages with direct cameraArc during glides", () => {
    const total = ENGINEERING_SHOW_SCENES.length;
    for (let i = 1; i < total; i += 1) {
      const segStart = i / total;
      const segSize = 1 / total;
      const glideExit = evaluateEngineeringShowScroll(
        segStart + segSize * (SHOW_TRANSITION_RATIO * 0.08),
      );
      expect(glideExit.phase).toBe("transition");
      expect(glideExit.storyStage).toBe("exiting");
      expect(glideExit.displayScene.id).toBe(ENGINEERING_SHOW_SCENES[i - 1].id);
      expect(glideExit.cameraArc).not.toBeNull();

      const glideMid = evaluateEngineeringShowScroll(
        segStart + segSize * (SHOW_TRANSITION_RATIO * 0.45),
      );
      expect(glideMid.phase).toBe("transition");
      expect(glideMid.isResting).toBe(false);
      expect(glideMid.storyStage).toBe("hidden");
      expect(glideMid.displayScene.id).toBe(ENGINEERING_SHOW_SCENES[i].id);
      expect(glideMid.cameraArc?.fromProgress).toBe(
        ENGINEERING_SHOW_SCENES[i - 1].anchorProgress,
      );
      expect(glideMid.cameraArc?.toProgress).toBe(
        ENGINEERING_SHOW_SCENES[i].anchorProgress,
      );

      const glideEnter = evaluateEngineeringShowScroll(
        segStart + segSize * (SHOW_TRANSITION_RATIO * 0.90),
      );
      expect(glideEnter.storyStage).toBe("entering");
      expect(glideEnter.displayScene.id).toBe(ENGINEERING_SHOW_SCENES[i].id);

      const restEarly = evaluateEngineeringShowScroll(
        segStart + segSize * (SHOW_TRANSITION_RATIO + 0.06),
      );
      const restMid = evaluateEngineeringShowScroll(
        segStart + segSize * (SHOW_TRANSITION_RATIO + 0.25),
      );
      const restLate = evaluateEngineeringShowScroll(segStart + segSize * 0.97);

      expect(restEarly.isResting).toBe(true);
      expect(restEarly.storyStage).toBe("visible");
      expect(restEarly.cameraArc).toBeNull();
      expect(restMid.isResting).toBe(true);
      expect(restLate.isResting).toBe(true);
      if (i < total - 1) {
        expect(restLate.storyStage).toBe("exiting");
      }

      expect(restEarly.timelineProgress).toBe(
        ENGINEERING_SHOW_SCENES[i].anchorProgress,
      );
      expect(restMid.timelineProgress).toBe(restEarly.timelineProgress);
      expect(restLate.timelineProgress).toBe(restEarly.timelineProgress);
      expect(restLate.dwellProgress).toBeGreaterThan(restEarly.dwellProgress);
    }
  });

  it("caps rapid scroll/jump velocity smoothly via stepShowTimelineProgress", () => {
    const step1 = stepShowTimelineProgress(0, 1, 16, false);
    expect(step1).toBeGreaterThan(0);
    expect(step1).toBeLessThan(0.01);

    const immediate = stepShowTimelineProgress(0, 0.75, 16, true);
    expect(immediate).toBe(0.75);
  });

  it("lands directly inside the target scene's resting dwell plateau via getShowScrollForScene", () => {
    for (let i = 0; i < ENGINEERING_SHOW_SCENES.length; i += 1) {
      const scrollRatio = getShowScrollForScene(i);
      const state = evaluateEngineeringShowScroll(scrollRatio);
      expect(state.sceneIndex).toBe(i);
      expect(state.isResting).toBe(true);
      expect(state.storyStage).toBe("visible");
      expect(state.timelineProgress).toBe(
        ENGINEERING_SHOW_SCENES[i].anchorProgress,
      );
    }
  });
});
