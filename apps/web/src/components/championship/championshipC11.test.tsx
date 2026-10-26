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

  it("renders the selected race classification inline with one round selector", () => {
    const html = render(
      "/season/2026?tab=results&round=1&session=race",
      <RaceResults season={2026} />,
    );
    expect(html).toContain("c11-table");
    expect(html).toContain("Australian Grand Prix");
    expect(html.match(/class="c11-race-controls"/g)).toHaveLength(1);
    expect(html.match(/class="c11-race-head"/g)).toHaveLength(1);
    expect(html).not.toContain("Open classification");
    expect(html).not.toContain("All teams");
    expect(html).not.toContain("Grid</span>");
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

  it("uses the season grid for racing numbers", () => {
    expect(getSeasonDriverNumber(2025, "norris")).toBe(4);
    expect(getSeasonDriverNumber(2026, "norris")).toBe(1);
    expect(getSeasonDriverNumber(2026, "verstappen")).toBe(3);
  });

  it("keeps directory and detail profiles free of imagery and points", () => {
    for (const html of [
      render(
        "/season/2026?tab=teams",
        <ChampionshipDirectory season={2026} kind="teams" />,
      ),
      render(
        "/season/2026?tab=drivers",
        <ChampionshipDirectory season={2026} kind="drivers" />,
      ),
      render("/teams/ferrari?season=2026", <TeamDetailPage />),
      render("/drivers/leclerc?season=2026", <DriverDetailPage />),
    ]) {
      expect(html).not.toContain("<img");
      expect(html).not.toContain("PTS");
      expect(html).not.toContain("c1-points-track");
    }
  });
});
