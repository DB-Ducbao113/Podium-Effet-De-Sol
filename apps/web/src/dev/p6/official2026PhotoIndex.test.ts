import { describe, expect, it } from "vitest";
import photos from "./official2026PhotoIndex.json";
import { STANDARD_2026_REFERENCE_SETS } from "./standard2026References";

describe("official 2026 photo discovery index", () => {
  it("records individual official images for all launch galleries", () => {
    const launch = photos.filter(
      (photo) => photo.variantId === "season-default-2026",
    );
    expect(launch).toHaveLength(67);
    expect(new Set(launch.map((photo) => photo.teamId))).toEqual(
      new Set(Object.keys(STANDARD_2026_REFERENCE_SETS)),
    );
    expect(new Set(photos.map((photo) => photo.id)).size).toBe(photos.length);
    for (const photo of launch) {
      expect(photo.sourceUrl).toBe(
        STANDARD_2026_REFERENCE_SETS[
          photo.teamId as keyof typeof STANDARD_2026_REFERENCE_SETS
        ].galleryUrl,
      );
      expect(photo.articlePublished).toMatch(/^2026-\d\d-\d\d$/);
      expect(photo.photoDate).toBeNull();
      expect(photo.imageUrl).toMatch(/^https:\/\/media\.formula1\.com\//);
    }
  });

  it("separates race images for all teams from launch galleries", () => {
    const current = photos.filter(
      (photo) => photo.variantId === "season-current-2026-11-06",
    );
    expect(current).toHaveLength(25);
    expect(new Set(current.map((photo) => photo.teamId))).toEqual(
      new Set(Object.keys(STANDARD_2026_REFERENCE_SETS)),
    );
    expect(current.filter((photo) => photo.teamId === "cadillac")).toHaveLength(
      14,
    );
    const austinSpecial = photos.filter(
      (photo) => photo.variantId === "event-special-2026-us-gp",
    );
    expect(austinSpecial).toHaveLength(2);
    expect(
      austinSpecial.every(
        (photo) =>
          typeof photo.variantEvidenceUrl === "string" &&
          photo.variantEvidenceUrl.includes("news.cadillac.com"),
      ),
    ).toBe(true);
    expect(
      current.every(
        (photo) =>
          (photo.photoDate !== null && photo.photoDate <= "2026-11-06") ||
          (photo.photoDate === null &&
            ((photo.teamId === "cadillac" &&
              photo.sourceUrl.includes("cadillacf1team.com")) ||
              (photo.teamId === "mercedes" &&
                photo.sourceUrl.includes("mercedesamgf1.com")))),
      ),
    ).toBe(true);
    expect(
      current.filter((photo) =>
        photo.id.startsWith("cadillac-current-belgium-"),
      ),
    ).toHaveLength(7);
    expect(
      current.find((photo) => photo.id === "cadillac-current-02")?.angleHint,
    ).toBe("side-right");
    expect(current.some((photo) => photo.angleHint === "under")).toBe(false);
  });
});
