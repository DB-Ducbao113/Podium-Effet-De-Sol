import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { ChampionshipStandings } from "./ChampionshipStandings";
import { getStandings } from "../../data/championship";
import { useChampionshipStore } from "../../store/useChampionshipStore";
import { useNavigationStore } from "../../store/useNavigationStore";

const render = (
  category: "drivers" | "constructors",
  season: 2024 | 2025 | 2026 = 2026,
) => {
  useChampionshipStore.setState({ standingsCategory: category });
  const url = "/season/" + season + "?tab=standings&category=" + category;
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[url]}>
      <ChampionshipStandings season={season} />
    </MemoryRouter>,
  );
};

describe("Standings V5 — source, motion and usability", () => {
  beforeEach(() => {
    useNavigationStore.setState({ lang: "en" });
    useChampionshipStore.setState({ standingsCategory: "drivers" });
  });

  it("keeps sourced driver ranks and leader values, never invented scores", () => {
    const source =
      useChampionshipStore.getState().calculatedStandings[2026] ||
      getStandings(2026);
    const points = source.drivers[0]?.points;
    const gap =
      source.drivers.length > 1
        ? Math.max(0, (points ?? 0) - source.drivers[1].points)
        : null;
    const html = render("drivers");
    expect(html).toContain('class="p5-standings p5-standings-v5"');
    expect(html).toContain('data-standings-category="drivers"');
    expect(html).toContain("STANDINGS P1");
    expect(html).toContain("standings-v5__snapshot");
    expect(html).toContain("standings-v5__facts");
    expect(html).toContain(source.drivers[0]?.driverName ?? "Unavailable");
    expect(html).toContain("<dd>" + (points ?? "—") + "</dd>");
    if (gap !== null) expect(html).toContain("<dd>" + gap + "</dd>");
    expect(html).toContain("mini-race__lanes");
    expect(html).toContain("P1 POINTS");
    expect(html).toContain("Selected entry details");
    expect(html).toContain("Check F1.com");
    expect(html).toContain("Race results");
    expect(html).toContain("/images/mini-race/");
  });

  it("switches to constructors and preserves ranks, team names and profile action", () => {
    const source =
      useChampionshipStore.getState().calculatedStandings[2025] ||
      getStandings(2025);
    const standingsSource = readFileSync(
      "src/components/championship/ChampionshipStandings.tsx",
      "utf8",
    );
    const leaderboardSource = readFileSync(
      "src/components/championship/mini-race/MiniRaceLeaderboard.tsx",
      "utf8",
    );
    expect(standingsSource).toContain(
      "const rows = isDrivers ? current.drivers : current.constructors;",
    );
    expect(standingsSource).toContain(
      "data-standings-category={standingsCategory}",
    );
    expect(leaderboardSource).toContain('category === "drivers"');
    expect(leaderboardSource).toContain("row.teamName");
    expect(leaderboardSource).toContain("mini-race__identity--${category}");
    expect(leaderboardSource).toContain("View profile");
    expect(source.constructors[0]?.rank).toBe(1);
    expect(source.constructors[0]?.teamName).toBeTruthy();
  });

  it("preserves sourced media, reversible timeline, reduced-motion and mobile labels", () => {
    const source = readFileSync(
      "src/components/championship/ChampionshipStandings.tsx",
      "utf8",
    );
    const css = readFileSync(
      "src/components/championship/standingsCinematicV5.css",
      "utf8",
    );
    const compactCss = css.replace(/\s+/g, "");
    expect(source).toContain("venueHeroSrcSet");
    expect(source).toContain("reviewHero");
    expect(source).toContain("roundsWithResults");
    expect(source).toContain("useMotionGate");
    expect(source).not.toContain("useDirectoryReveal");
    expect(compactCss).toContain("@supports(animation-timeline:view())");
    expect(compactCss).toContain("animation-range:cover0%cover100%");
    expect(compactCss).toContain("standings-v5-enter-exit");
    expect(compactCss).toContain("prefers-reduced-motion:reduce");
    expect(compactCss).toContain(".mini-race__identity--driversstrong");
    expect(compactCss).toContain("transform:none!important");
    expect(compactCss).toContain("object-fit:contain");
    expect(compactCss).not.toContain("scale(1.2");
  });
});
