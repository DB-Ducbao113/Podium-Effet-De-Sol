import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import type { ConstructorStanding, DriverStanding } from "../../../types";
import { MiniRaceLeaderboard } from "./MiniRaceLeaderboard";

const row = (rank: number, points: number): DriverStanding => ({
  rank,
  driverId: `driver-${rank}`,
  driverName: `Driver ${rank}`,
  driverCode: `D${rank}`,
  teamId: "mclaren",
  teamName: "McLaren",
  points,
  wins: 0,
  podiums: 0,
  countryFlag: "",
});

describe("MiniRaceLeaderboard", () => {
  it("keeps constructor identity readable without repeating the team name", () => {
    const team: ConstructorStanding = {
      rank: 1,
      teamId: "mclaren",
      teamName: "McLaren",
      engine: "Mercedes",
      points: 30,
      wins: 1,
      podiums: 2,
    };
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <MiniRaceLeaderboard
          season={2026}
          category="constructors"
          rows={[team]}
          lang="en"
        />
      </MemoryRouter>,
    );
    expect(html).toContain("mini-race__identity--constructors");
    expect(html).toContain("<strong>McLaren</strong><small>Mercedes</small>");
    expect(html).not.toContain("STANDINGS INSPECTOR");
    expect(html).toContain(
      "Each lane is a rank; car position shows points relative to P1.",
    );
    const sameEngine = renderToStaticMarkup(
      <MemoryRouter>
        <MiniRaceLeaderboard
          season={2026}
          category="constructors"
          rows={[{ ...team, teamName: "Mercedes", engine: "Mercedes" }]}
          lang="en"
        />
      </MemoryRouter>,
    );
    expect(sameEngine).toContain("<strong>Mercedes</strong></span>");
  });

  it("selects the 2026 team GIF and reduced-motion poster by canonical team ID", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <MiniRaceLeaderboard
          season={2026}
          category="drivers"
          rows={[{ ...row(1, 25), teamId: "redbull" }]}
          lang="en"
        />
      </MemoryRouter>,
    );
    expect(html).toContain("/images/mini-race/gifs/red-bull-2026-side.gif");
    expect(html).toContain(
      "/images/mini-race/posters/red-bull-2026-side.webp",
    );
    expect(html).toContain("prefers-reduced-motion: reduce");
    expect(html).not.toContain("Mini car asset reserved");
  });

  it("selects the local 2025 pack and its reduced-motion poster", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <MiniRaceLeaderboard
          season={2025}
          category="drivers"
          rows={[row(1, 25)]}
          lang="en"
        />
      </MemoryRouter>,
    );
    expect(html).toContain("/images/mini-race/2025/mclaren-2025.gif");
    expect(html).toContain(
      "/images/mini-race/posters/2025/mclaren-2025.webp",
    );
    expect(html).toContain(
      "Championship points, not GP positions. 2025 cars are illustrations; numbers and logos may differ.",
    );
  });
  it("uses official row order and handles a zero-point leader without dividing by zero", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <MiniRaceLeaderboard
          season={2026}
          category="drivers"
          rows={[row(1, 0), row(2, 0)]}
          lang="en"
        />
      </MemoryRouter>,
    );
    expect(html.indexOf("Driver 1")).toBeLessThan(html.indexOf("Driver 2"));
    expect(html).toContain("--mini-race-progress:0%");
    expect(html).not.toContain("NaN");
    expect(html).toContain(
      'aria-label="Driver 2, P2, 0 points, 0 points behind leader"',
    );
  });
});
