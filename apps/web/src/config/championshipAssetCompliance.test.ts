import { existsSync, readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { VENUE_HERO_BY_CIRCUIT } from "../utils/venueHeroes";

const CHAMPIONSHIP = "src/components/championship";

function source(file: string) {
  return readFileSync(`${CHAMPIONSHIP}/${file}`, "utf8");
}

describe("Championship asset compliance — EDS-G01 cinematic artwork removal", () => {
  it("keeps every EDS-G01-derived plate out of the production public tree", () => {
    expect(existsSync("public/images/championship/cinematic")).toBe(false);
    expect(readdirSync("public/images/championship").sort()).toEqual(["template", "venues"]);
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
    const expected = venues
      .flatMap(({ venue }) =>
        ["land-1600", "land-960", "port-600", "port-900"].flatMap((size) =>
          ["avif", "webp"].map((format) => `${venue}-${size}.${format}`),
        ),
      )
      .sort();
    expect(readdirSync("public/images/championship/venues").sort()).toEqual(expected);
    for (const file of expected) {
      expect(file).not.toContain("eds-g01");
      expect(file).not.toContain("cinematic");
    }
  });

  it("serves only the registered model-free template artwork", () => {
    const registry = JSON.parse(
      readFileSync("../../docs/asset-manifests/championship-template-artwork.json", "utf8"),
    ) as { items: { outputs: { file: string; sha256: string }[] }[] };
    const registered = registry.items
      .flatMap((item) => item.outputs.map((output) => output.file))
      .sort();
    expect(readdirSync("public/images/championship/template").sort()).toEqual(registered);
    for (const file of registered) {
      expect(file).not.toContain("cinematic");
      expect(file).not.toContain("eds-g01");
    }
  });

  it("removes the cinematic plate modules from source", () => {
    expect(existsSync(`${CHAMPIONSHIP}/CinematicPlate.tsx`)).toBe(false);
    expect(existsSync(`${CHAMPIONSHIP}/cinematicPlates.ts`)).toBe(false);
  });

  it("does not reference cinematic plates or palettes from Race Center and Calendar", () => {
    for (const file of ["WeekendResults.tsx", "ChampionshipCalendar.tsx"]) {
      const text = source(file);
      for (const forbidden of [
        "CinematicPlate",
        "cinematicPlates",
        "paletteForRound",
        "posterForRound",
        "/images/championship/cinematic",
        "/images/championship/cinematic",
        "data-palette",
      ]) {
        expect(text, `${file} must not contain ${forbidden}`).not.toContain(
          forbidden,
        );
      }
    }
  });

  it("does not caption any P4 surface as an EDS-G01 render", () => {
    for (const file of ["WeekendResults.tsx", "ChampionshipCalendar.tsx"]) {
      expect(source(file)).not.toContain("EDS-G01 ·");
      expect(source(file)).not.toContain("livery study");
    }
  });

  it("keeps the compliant venue imagery, attribution, and circuit schematic", () => {
    const results = source("WeekendResults.tsx");
    const calendar = source("ChampionshipCalendar.tsx");
    expect(results).toContain('data-venue-photo={venueHero ? "true" : "false"}');
    expect(results).toContain('className="rc-round-media"');
    expect(results).toContain('className="rc-round-img"');
    expect(results).toContain("venueHero.sourcePage");
    expect(results).toContain("venueHero.license");
    expect(results).toContain("/images/championship/template/venue-");
    expect(calendar).toContain('className="cal-next-visual"');
    expect(calendar).toContain("<CircuitTrace");
  });

  it("retains the withdrawal record after owner-approved disposal", () => {
    const manifest = JSON.parse(
      readFileSync("../../docs/asset-manifests/p4-eds-g01-withdrawn.json", "utf8"),
    ) as { fileCount: number; files: { path: string; bytes: number; sha256: string }[] };
    expect(manifest.fileCount).toBe(52);
    expect(manifest.files).toHaveLength(52);
    for (const entry of manifest.files) {
      expect(entry.path).toMatch(/^scratch\/ignition\/p4\/quarantine\/eds-g01-artwork\//);
      expect(entry.bytes).toBeGreaterThan(0);
      expect(entry.sha256).toMatch(/^[a-f0-9]{64}$/i);
    }
  });
});
