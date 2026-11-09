import { describe, expect, it } from "vitest";
import { ANATOMY_CHAPTERS, getAnatomyChapter } from "./anatomyChapters";
import { MODEL_B_HOTSPOTS } from "../../dev/commercial-b/modelBExperience";

describe("engineering anatomy chapter contract", () => {
  it("covers each verified approximate Model B hotspot exactly once", () => {
    expect(ANATOMY_CHAPTERS.map((chapter) => chapter.id)).toEqual([
      "front-wing",
      "sidepods",
      "floor",
      "diffuser",
      "rear-wing",
      "suspension",
      "halo",
    ]);
    expect(new Set(ANATOMY_CHAPTERS.map((chapter) => chapter.id)).size).toBe(7);
    for (const chapter of ANATOMY_CHAPTERS) {
      expect(chapter.hotspot.id).toBe(
        MODEL_B_HOTSPOTS.find((spot) => spot.id === chapter.id)?.id,
      );
      expect(chapter.hotspot.position).toHaveLength(3);
      expect(chapter.hotspot.cameraPos).toHaveLength(3);
      expect(chapter.explanation.vi.length).toBeGreaterThan(60);
      expect(chapter.explanation.en.length).toBeGreaterThan(60);
      expect(chapter.caveat.vi.length).toBeGreaterThan(20);
      expect(chapter.caveat.en.length).toBeGreaterThan(20);
    }
  });

  it("falls back to the first chapter for an invalid deep link", () => {
    expect(getAnatomyChapter("invalid").id).toBe("front-wing");
    expect(getAnatomyChapter(null).id).toBe("front-wing");
    expect(getAnatomyChapter("halo").id).toBe("halo");
  });
});
