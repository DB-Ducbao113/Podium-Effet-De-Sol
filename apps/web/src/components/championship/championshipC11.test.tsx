import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { useNavigationStore } from "../../store/useNavigationStore";
import { getSeasonDriverNumber } from "../../data/championship/raceClassificationHelper";
import { RaceResults } from "./RaceResults";
import { ChampionshipDirectory } from "./ChampionshipDirectory";
import { TeamDetailPage } from "../pages/TeamDetailPage";
import { DriverDetailPage } from "../pages/DriverDetailPage";

const render = (path: string, element: React.ReactNode) =>
  renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/season/:season" element={element} />
        <Route path="/teams/:teamId" element={element} />
        <Route path="/drivers/:driverId" element={element} />
      </Routes>
    </MemoryRouter>,
  );

describe("C1.1 simplified profiles and results", () => {
  beforeEach(() => useNavigationStore.setState({ lang: "en" }));

  it("renders the round rail, round hero and classification in one Race Center", () => {
    const html = render(
      "/season/2026?tab=results&round=1&session=race",
      <RaceResults season={2026} />,
    );
    expect(html).toContain("c11-table");
    expect(html).toContain("Australian Grand Prix");
    expect(html.match(/class="rc-round-rail"/g)).toHaveLength(1);
    expect(html.match(/class="c11-pinned-controls rc-pinned-controls"/g)).toHaveLength(1);
    expect(html.match(/class="rc-round-hero"/g)).toHaveLength(1);
    expect(html.match(/class="rc-round-chip"/g)).toHaveLength(23);
    expect(html).toContain('class="results-v5__venue-context"');
    expect(html).not.toContain('class="results-simple-head"');
    expect(html).not.toContain('class="rc-hero-stats"');
    expect(html).not.toContain("Open classification");
    expect(html).not.toContain("All teams");
    expect(html).not.toContain("Grid</span>");
  });

  it("marks the selected round and states results truthfully", () => {
    const withResults = render(
      "/season/2026?tab=results&round=17&session=race",
      <RaceResults season={2026} />,
    );
    const awaiting = render(
      "/season/2026?tab=results&round=18&session=race",
      <RaceResults season={2026} />,
    );
    expect(withResults).toContain('aria-current="true"');
    expect(withResults).toContain('class="rc-chip-round">R17');
    expect(withResults).toContain('class="sr-only"');
    expect(withResults).toContain("rounds with results");
    expect(awaiting).toContain("Session schedule has ended");
    expect(awaiting).not.toContain("Session scheduled");
    expect(withResults).toContain('class="rc-team-chip"');
    expect(withResults).not.toContain("Team tint is supplementary");
  });

  it("keeps Sprint separate and does not invent a session on a regular weekend", () => {
    const sprint = render(
      "/season/2026?tab=results&round=17&session=sprint",
      <RaceResults season={2026} />,
    );
    const regular = render(
      "/season/2026?tab=results&round=1&session=race",
      <RaceResults season={2026} />,
    );
    expect(sprint).toContain('id="c11-tab-sprint"');
    expect(regular).not.toContain('id="c11-tab-sprint"');
  });

  it("keeps the session order and explains an unverified scheduled round", () => {
    const html = render(
      "/season/2026?tab=results&round=23&session=race",
      <RaceResults season={2026} />,
    );
    expect(html).toContain('class="c11-results-empty"');
    expect(html).toContain("Session scheduled");
    expect(html).toContain("Results appear after the source is verified");
    expect(html.indexOf('id="c11-tab-race"')).toBeLessThan(
      html.indexOf('id="c11-tab-qualifying"'),
    );
    expect(html.indexOf('id="c11-tab-qualifying"')).toBeLessThan(
      html.indexOf('id="c11-tab-fp3"'),
    );
  });

  it("keeps circuit specifications out of the Results header", () => {
    const html = render(
      "/season/2026?tab=results&round=17&session=race",
      <RaceResults season={2026} />,
    );
    expect(html).toContain('class="rc-round-hero"');
    expect(html).not.toContain('class="rc-round-facts rc-spec-rail"');
    expect(html).not.toContain('class="rc-round-visual"');
  });

  it("uses one column for the compact Results header", () => {
    const css = readFileSync(
      "src/components/championship/championshipC11.css",
      "utf8",
    );
    expect(css).toMatch(/\.rc-race-center \.rc-round-hero\s*\{[^}]*grid-template-columns: minmax\(0, 1fr\)/s);
  });

  it("uses the season grid for racing numbers", () => {
    expect(getSeasonDriverNumber(2025, "norris")).toBe(4);
    expect(getSeasonDriverNumber(2026, "norris")).toBe(1);
    expect(getSeasonDriverNumber(2026, "verstappen")).toBe(3);
  });

  it("renders licensed P5 portraits and sourced standings in directories and profiles", () => {
    const teams = render(
      "/season/2026?tab=teams",
      <ChampionshipDirectory season={2026} kind="teams" />,
    );
    const drivers = render(
      "/season/2026?tab=drivers",
      <ChampionshipDirectory season={2026} kind="drivers" />,
    );
    for (const html of [teams, drivers]) {
      expect(html).toContain("<picture");
      expect(html).toContain("owner-provided concepts");
      expect(html).toContain("PTS");
      expect(html).not.toContain("c1-points-track");
    }
    expect(teams).toContain("/images/concepts-2026/headshots/");
    expect(drivers).toContain("/images/concepts-2026/drivers/");

    for (const html of [
      render("/teams/ferrari?season=2026", <TeamDetailPage />),
      render("/drivers/leclerc?season=2026", <DriverDetailPage />),
    ]) {
      expect(html).toContain("/images/concepts-2026/headshots/");
      expect(html).toContain("PTS");
      expect(html).not.toContain("c1-points-track");
    }

    expect(render("/drivers/leclerc?season=2026", <DriverDetailPage />)).toContain("2026 AI illustration");
    expect(render("/season/2025?tab=drivers", <ChampionshipDirectory season={2025} kind="drivers" />)).toContain("/images/driver-portraits-ai/");
  });
});
