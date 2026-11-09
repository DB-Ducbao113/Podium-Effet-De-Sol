import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { getStandings } from "../../data/championship/standings";
import { P5TeamCard } from "./P5DirectorySurfaces";
import { P5Portrait } from "./P5Portrait";

const render = (element: ReactNode) =>
  renderToStaticMarkup(<MemoryRouter>{element}</MemoryRouter>);
const manifest = JSON.parse(
  readFileSync(
    join(
      process.cwd(),
      "../../docs/asset-manifests/p5-generated-portraits.json",
    ),
    "utf8",
  ),
) as {
  expected: number;
  files: {
    season: number;
    driverId: string;
    delivery: { file: string; sha256: string };
  }[];
};

describe("P5 generated historical portraits", () => {
  it.each([2024, 2025] as const)(
    "covers every ranked driver and the team cards in %i",
    (season) => {
      const standings = getStandings(season);
      expect(manifest.expected).toBe(45);
      expect(manifest.files).toHaveLength(45);
      for (const driver of standings.drivers) {
        const source = `/images/p5/generated-portraits/${season}-${driver.driverId}.webp`;
        const html = render(
          <P5Portrait
            driverId={driver.driverId}
            season={season}
            alt={driver.driverName}
          />,
        );
        expect(html).toContain('data-p5-image-source="ai-generated-portrait"');
        expect(html).toContain(source);
        expect(
          manifest.files.find(
            (file) =>
              file.season === season && file.driverId === driver.driverId,
          )?.delivery.file,
        ).toBe(source);
      }
      for (const team of standings.constructors) {
        const html = render(
          <P5TeamCard
            row={team}
            season={season}
            lang="en"
            drivers={standings.drivers}
          />,
        );
        expect(html).toContain("p5-team-card-media");
        expect(html).toContain('data-p5-image-source="ai-generated-portrait"');
        expect(html).not.toContain("/images/p5/historical-cars/");
      }
    },
  );
});
