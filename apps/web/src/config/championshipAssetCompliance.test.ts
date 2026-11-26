import { existsSync, readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { VENUE_HERO_BY_CIRCUIT } from "../utils/venueHeroes";

describe("Championship asset compliance — EDS-G01 cinematic artwork removal", () => {
  it("keeps every EDS-G01-derived plate out of the production public tree", () => {
    expect(existsSync("public/images/championship/cinematic")).toBe(false);
    expect(readdirSync("public/images/championship").sort()).toEqual([
      "template",
      "venues",
    ]);
  });

  it("serves only registered venue photography with recorded provenance", () => {
    const venues = Object.values(VENUE_HERO_BY_CIRCUIT);
    expect(venues).toHaveLength(23);
    for (const venue of venues) {
      expect(venue.credit, venue.venue).toBeTruthy();
      expect(venue.license, venue.venue).toBeTruthy();
      expect(
        venue.license === "Public domain" || Boolean(venue.licenseUrl),
        venue.venue,
      ).toBe(true);
      expect(venue.sourcePage, venue.venue).toMatch(
        /^https:\/\/commons\.wikimedia\.org\/wiki\/File/,
      );
    }
  });

  it("serves only the registered model-free template artwork", () => {
    const registry = JSON.parse(
      readFileSync(
        "../../docs/asset-manifests/championship-template-artwork.json",
        "utf8",
      ),
    ) as { items: { outputs: { file: string; sha256: string }[] }[] };
    const registered = registry.items
      .flatMap((item) => item.outputs.map((output) => output.file))
      .sort();
    expect(readdirSync("public/images/championship/template").sort()).toEqual(
      registered,
    );
    for (const file of registered) {
      expect(file).not.toContain("cinematic");
      expect(file).not.toContain("eds-g01");
    }
  });

  it("keeps active Storm Results and Calendar views free of EDS-G01 cinematic plates", () => {
    expect(existsSync("src/components/championship/CinematicPlate.tsx")).toBe(
      false,
    );
    const stormViews = readFileSync(
      "src/components/storm/StormViews.tsx",
      "utf8",
    );
    for (const forbidden of [
      "CinematicPlate",
      "cinematicPlates",
      "/images/championship/cinematic",
      "EDS-G01",
    ]) {
      expect(stormViews).not.toContain(forbidden);
    }
  });

  it("retains the withdrawal record after owner-approved disposal", () => {
    const manifest = JSON.parse(
      readFileSync(
        "../../docs/asset-manifests/p4-eds-g01-withdrawn.json",
        "utf8",
      ),
    ) as {
      fileCount: number;
      files: { path: string; bytes: number; sha256: string }[];
    };
    expect(manifest.fileCount).toBe(52);
    expect(manifest.files).toHaveLength(52);
  });
});
