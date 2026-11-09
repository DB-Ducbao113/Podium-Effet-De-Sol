import { describe, expect, it } from "vitest";
import { liveryDefinitions } from "./liveryDefinitions";
import {
  needsRearWingTeamName,
  shouldShowEndplateTeamName,
  WHEEL_MEDIUM_MARKING,
  WHEEL_SIDEWALL_CENTERS,
} from "./liveryRuntime";
import type { PrecisionTeam } from "./paintAtlas";

describe("Model B wheel and rear endplate review", () => {
  it("locates a medium-compound sidewall on each physical wheel", () => {
    expect(WHEEL_SIDEWALL_CENTERS).toHaveLength(4);
    expect(
      new Set(
        WHEEL_SIDEWALL_CENTERS.map(
          ({ side, z }) => `${side}:${z < 0 ? "front" : "rear"}`,
        ),
      ).size,
    ).toBe(4);
    expect(WHEEL_MEDIUM_MARKING).toBe("#e8bd25");
  });

  it("keeps rear endplate lettering inside a narrow flat review area", () => {
    for (const team of [
      "mclaren",
      "racingbulls",
      "alpine",
      "williams",
    ] as const) {
      const mark = liveryDefinitions[team].decals.find(
        (entry) =>
          entry.id === "mclaren-dropbox-right" ||
          entry.id.endsWith("-wing-endplate-right"),
      );
      expect(mark, team).toBeDefined();
      expect(mark?.anchor.meshName).toBe("PEDS_Model_B_Mesh_4");
      expect(mark?.anchor.side).toBe("right");
      expect(mark?.anchor.width).toBeLessThanOrEqual(0.27);
      expect(mark?.anchor.height).toBeLessThanOrEqual(0.07);
    }
  });

  it("provides a team-name fallback on both sides without covering an existing right sponsor", () => {
    const teams = Object.keys(liveryDefinitions) as PrecisionTeam[];
    expect(teams).toHaveLength(11);
    for (const team of teams) {
      expect(
        shouldShowEndplateTeamName(
          team,
          "season-current-2026-11-06",
          "left",
          true,
        ),
      ).toBe(true);
      expect(
        shouldShowEndplateTeamName(
          team,
          "season-current-2026-11-06",
          "right",
          false,
        ),
      ).toBe(true);
      const hasRightSponsor = liveryDefinitions[team].decals.some(
        (entry) =>
          entry.id === "mclaren-dropbox-right" ||
          entry.id.endsWith("-wing-endplate-right"),
      );
      expect(
        shouldShowEndplateTeamName(
          team,
          "season-current-2026-11-06",
          "right",
          true,
        ),
      ).toBe(!hasRightSponsor);
    }
  });

  it("uses a central team-name fallback only when the rear wing has no existing wordmark", () => {
    for (const team of Object.keys(liveryDefinitions) as PrecisionTeam[]) {
      const hasRearWingArtwork = liveryDefinitions[team].decals.some(
        (entry) =>
          entry.id.endsWith("-rear-wing-main") ||
          entry.id === "mclaren-wordmark-wing-rear",
      );
      expect(needsRearWingTeamName(team, "season-current-2026-11-06")).toBe(
        !hasRearWingArtwork,
      );
    }
  });
});
