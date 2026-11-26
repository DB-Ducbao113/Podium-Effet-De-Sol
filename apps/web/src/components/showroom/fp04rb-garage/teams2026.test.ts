import { describe, expect, it } from "vitest";
import {
  FP04RB_CHASSIS_DISCLAIMER,
  TEAMS_2026,
  getTeam2026ById,
  type TeamId,
} from "./teams2026";
import { LOGO_ASSET_SPECS } from "./teamLogos2026";
import {
  PRD_2026_LIVERY_MANIFEST,
  PRD_ZONES_Z01_Z11,
  getPrdTeamManifest,
} from "./liveryPrdManifest2026";

const SDD_PALETTE: Record<TeamId, [string, string, string]> = {
  mclaren: ["#F48220", "#161A20", "#30A4A8"],
  ferrari: ["#D9182B", "#F2F0EB", "#FFE045"],
  mercedes: ["#0D1114", "#181E24", "#00D2BE"],
  "red-bull": ["#172857", "#F1F2EE", "#E32C31"],
  "racing-bulls": ["#E9EDEF", "#2149A0", "#D93439"],
  "aston-martin": ["#075544", "#12241E", "#C9DF43"],
  alpine: ["#1959C6", "#EF80B4", "#F4F1F3"],
  williams: ["#1559BD", "#F0F2F3", "#D32E37"],
  haas: ["#E8E9E6", "#16181A", "#D52A32"],
  audi: ["#A8AAA6", "#111315", "#DA3035"],
  cadillac: ["#EDECE8", "#111315", "#BCC0BF"],
};

const FIA_2026_DRIVER_NUMBERS: Record<TeamId, [string, string]> = {
  mclaren: ["1", "81"],
  ferrari: ["16", "44"],
  mercedes: ["63", "12"],
  "red-bull": ["3", "6"],
  "racing-bulls": ["30", "41"],
  "aston-martin": ["14", "18"],
  alpine: ["10", "43"],
  williams: ["23", "55"],
  haas: ["31", "87"],
  audi: ["27", "5"],
  cadillac: ["11", "77"],
};

describe("teams2026 registry & PRD v1.0 Z01-Z11 manifest", () => {
  it("registers exactly 11 independent 2026 teams and 22 FIA driver number configurations", () => {
    expect(TEAMS_2026).toHaveLength(11);
    const ids = new Set(TEAMS_2026.map((t) => t.id));
    expect(ids.size).toBe(11);

    for (const team of TEAMS_2026) {
      const [primary, secondary, accent] = SDD_PALETTE[team.id];
      expect(team.primaryColor).toBe(primary);
      expect(team.secondaryColor).toBe(secondary);
      expect(team.accentColor).toBe(accent);
      expect(team.conceptNote).toEqual(FP04RB_CHASSIS_DISCLAIMER);

      const [bay1Num, bay2Num] = FIA_2026_DRIVER_NUMBERS[team.id];
      expect(team.carNumbers.bay1).toBe(bay1Num);
      expect(team.carNumbers.bay2).toBe(bay2Num);
    }
  });

  it("defines complete Z01-Z11 zone audits and Cadillac Belgian GP (Spa) default + Debut variants in PRD manifest", () => {
    expect(PRD_ZONES_Z01_Z11).toHaveLength(11);
    for (const team of TEAMS_2026) {
      const manifest = getPrdTeamManifest(team.id);
      expect(manifest.teamId).toBe(team.id);
      expect(manifest.zones).toHaveLength(11);
      expect(manifest.drivers[0].carNumber).toBe(team.carNumbers.bay1);
      expect(manifest.drivers[1].carNumber).toBe(team.carNumbers.bay2);
      expect(manifest.decals.length).toBeGreaterThan(0);
    }

    const cadillacManifest = PRD_2026_LIVERY_MANIFEST.cadillac;
    expect(cadillacManifest.defaultVariantId).toBe("cadillac-spa-2026");
    expect(cadillacManifest.availableVariants.map((v) => v.id)).toEqual([
      "cadillac-spa-2026",
      "cadillac-debut-2026",
    ]);
    expect(getTeam2026ById("unknown-team").id).toBe("mclaren");
  });

  it("defines authentic 2026 zone paint and constructor/partner logo keys for all 11 teams", () => {
    for (const team of TEAMS_2026) {
      expect(team.zonePaint.nose).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(team.zonePaint.sidepod).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(team.zonePaint.engineCover).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(team.zonePaint.crewSuitPrimary).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(LOGO_ASSET_SPECS[team.logos.constructorBadge.key]).toBeDefined();
      expect(LOGO_ASSET_SPECS[team.logos.sidepodPrimary.key]).toBeDefined();
      expect(LOGO_ASSET_SPECS[team.logos.engineCoverMark.key]).toBeDefined();
      expect(LOGO_ASSET_SPECS[team.logos.rearWingMark.key]).toBeDefined();
    }
  });
});
