import { describe, expect, it } from "vitest";
import {
  CURRENT_2026_REVIEW,
  CURRENT_VARIANT_ID,
  REQUIRED_VIEWS,
  defaultStudyVariant,
} from "./seasonCurrent2026";
import { getLiveryDecals, liveryDefinitions } from "./liveryDefinitions";
import { MODEL_B_PHYSICAL_SURFACES } from "./modelBComponentMap";
import { STANDARD_2026_REFERENCE_SETS } from "./standard2026References";
import photos from "./official2026PhotoIndex.json";

describe("current 2026 DEV review ledger", () => {
  it("opens all eleven teams on the current review target", () => {
    for (const teamId of Object.keys(STANDARD_2026_REFERENCE_SETS) as Array<keyof typeof STANDARD_2026_REFERENCE_SETS>) {
      expect(defaultStudyVariant(teamId)).toBe(CURRENT_VARIANT_ID);
    }
  });
  it("keeps a separate current and launch variant for every team", () => {
    expect(Object.keys(CURRENT_2026_REVIEW).sort()).toEqual(
      Object.keys(STANDARD_2026_REFERENCE_SETS).sort(),
    );
    for (const record of Object.values(CURRENT_2026_REVIEW)) {
      expect(record.variantId).toBe(CURRENT_VARIANT_ID);
      expect(record.launchVariantId).toBe("season-default-2026");
      expect(record.views.map((view) => view.angle)).toEqual(REQUIRED_VIEWS);
      expect(record.paintRegions).toHaveLength(
        MODEL_B_PHYSICAL_SURFACES.length,
      );
      expect(
        record.paintRegions.every((region) => region.status === "unverified"),
      ).toBe(true);
      if (record.teamId !== "cadillac") {
        expect(record.logoInstances).toHaveLength(
          liveryDefinitions[record.teamId].decals.length,
        );
        expect(
          record.logoInstances.every((logo) => Boolean(logo.artworkSource)),
        ).toBe(true);
      }
      expect(
        record.logoInstances.every(
          (logo) =>
            logo.placement === "unplaced" &&
            logo.rights === "owner-authorized-dev",
        ),
      ).toBe(true);
      expect(record.renderStatus).toBe("pending-photo-and-owner-review");
      expect(record.currentPhotoIds.length).toBeGreaterThan(0);
    }
  });

  it("records the Cadillac revision without treating launch decals as current", () => {
    const cadillac = CURRENT_2026_REVIEW.cadillac;
    expect(cadillac.variantEvidenceUrl).toContain("switch-up-their-livery");
    expect(cadillac.variantNote).toContain("non-split");
    expect(cadillac.currentPhotoIds).toEqual([
      "cadillac-current-01",
      "cadillac-current-02",
      "cadillac-current-03",
      "cadillac-current-belgium-rear",
      "cadillac-current-belgium-rear-quarter",
      "cadillac-current-belgium-front-quarter",
      "cadillac-current-belgium-pit",
      "cadillac-current-belgium-front",
      "cadillac-current-belgium-high-front-quarter",
      "cadillac-current-belgium-side",
    ]);
    expect(cadillac.corroboratingPhotoIds).toHaveLength(4);
    expect(
      cadillac.currentPhotoIds
        .slice(0, 3)
        .every(
          (id) =>
            photos.find((photo) => photo.id === id)?.photoDate === "2026-07-17",
        ),
    ).toBe(true);
    expect(cadillac.logoInstances).toHaveLength(12);
    expect(
      cadillac.logoInstances.every((logo) => Boolean(logo.sourcePhotoUrl)),
    ).toBe(true);
    expect(
      cadillac.logoInstances.every((logo) =>
        cadillac.currentPhotoIds.some(
          (id) =>
            photos.find((photo) => photo.id === id)?.imageUrl ===
            logo.sourcePhotoUrl,
        ),
      ),
    ).toBe(true);
    expect(
      cadillac.logoInstances.every((logo) => logo.artworkSource === null),
    ).toBe(true);
    for (const angle of ["left", "right", "front", "rear"] as const) {
      expect(cadillac.views.find((view) => view.angle === angle)?.status).toBe(
        "source-verified",
      );
    }
    expect(cadillac.views.find((view) => view.angle === "top")?.status).toBe(
      "unverified",
    );
    expect(cadillac.views.find((view) => view.angle === "under")?.status).toBe(
      "unverified",
    );
  });

  it("keeps Mexico's regular Mercedes W17 separate from launch renders and one-off paint", () => {
    const mercedes = CURRENT_2026_REVIEW.mercedes;
    expect(mercedes.currentPhotoIds).toEqual([
      "mercedes-current-01",
      "mercedes-current-mexico-side",
    ]);
    expect(mercedes.variantNote).toContain("Mexico City");
    expect(mercedes.variantEvidenceUrl).toContain(
      "best-images-from-mexico-city-2026",
    );
    expect(mercedes.views.find((view) => view.angle === "right")?.status).toBe(
      "source-verified",
    );
    expect(mercedes.views.find((view) => view.angle === "under")?.status).toBe(
      "unverified",
    );
  });

  it("uses Mexico-only Mercedes anchors and preserves the January launch decals", () => {
    const launch = getLiveryDecals("mercedes", "season-default-2026");
    const mexico = getLiveryDecals("mercedes", CURRENT_VARIANT_ID);
    expect(launch).toEqual(liveryDefinitions.mercedes.decals);
    expect(mexico.map((entry) => entry.id)).toEqual(launch.map((entry) => entry.id));
    for (const side of ["left", "right"] as const) {
      const byId = (id: string) => mexico.find((entry) => entry.id === id)?.anchor;
      expect(byId(`mercedes-petronas-${side}`)).toMatchObject({
        side, z: 0.26, y: 0.42, width: 0.72, height: 0.2,
      });
      expect(byId(`mercedes-microsoft-${side}`)).toMatchObject({
        side, z: 0.88, y: 0.6, width: 0.32, height: 0.11,
      });
      expect(byId(`mercedes-team-${side}`)?.visible).toBe(false);
      expect(launch.find((entry) => entry.id === `mercedes-team-${side}`)?.anchor.visible).toBeUndefined();
    }
    expect(getLiveryDecals("ferrari", CURRENT_VARIANT_ID)).toEqual(liveryDefinitions.ferrari.decals);
  });
});
