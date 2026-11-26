import { describe, expect, it } from "vitest";
import { ENGINEERING_PARTS } from "../engineering/engineeringDisassemblyData";
import {
  ENGINEERING_SHOW_SCENES,
  SHOW_SCENE_SCROLL_VH,
  SHOW_TRANSITION_RATIO,
  evaluateEngineeringShowScroll,
  getShowScrollForScene,
} from "./engineeringShowScript";

describe("engineeringShowScript · 12-scene story & rhythmic resting dwell plateaus", () => {
  it("defines 12 chronologically ordered bilingual scenes with snappy pacing and studio moods", () => {
    expect(ENGINEERING_SHOW_SCENES).toHaveLength(12);
    expect(SHOW_SCENE_SCROLL_VH).toBeLessThanOrEqual(90);
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
      expect(scene.title.vi.length).toBeGreaterThan(4);
      expect(scene.title.en.length).toBeGreaterThan(4);
      expect(scene.narrative.vi.length).toBeGreaterThan(40);
      expect(scene.narrative.en.length).toBeGreaterThan(40);
    }

    expect(ENGINEERING_SHOW_SCENES[0].anchorProgress).toBe(0);
    expect(ENGINEERING_SHOW_SCENES[11].anchorProgress).toBe(1);
  });

  it("veils text mid-glide and holds timelineProgress strictly steady across every scene's resting beat", () => {
    const total = ENGINEERING_SHOW_SCENES.length;
    for (let i = 1; i < total; i += 1) {
      const segStart = i / total;
      const segSize = 1 / total;
      const glideMid = evaluateEngineeringShowScroll(
        segStart + segSize * (SHOW_TRANSITION_RATIO * 0.45),
      );
      expect(glideMid.phase).toBe("transition");
      expect(glideMid.isResting).toBe(false);
      expect(glideMid.storyStage).toBe("hidden");

      const restEarly = evaluateEngineeringShowScroll(
        segStart + segSize * (SHOW_TRANSITION_RATIO + 0.06),
      );
      const restMid = evaluateEngineeringShowScroll(
        segStart + segSize * (SHOW_TRANSITION_RATIO + 0.25),
      );
      const restLate = evaluateEngineeringShowScroll(segStart + segSize * 0.96);

      expect(restEarly.isResting).toBe(true);
      expect(restEarly.storyStage).toBe("visible");
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
