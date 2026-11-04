import { beforeEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { getCalendarBySeason } from "../../data/championship";
import openF1SessionResults from "../../data/championship/openF1SessionResults2026.json";
import { getRaceResults } from "../../data/championship/results";
import { useChampionshipStore } from "../../store/useChampionshipStore";
import { useNavigationStore } from "../../store/useNavigationStore";
import {
  getAvailableSessions,
  getLatestAvailableResultRound,
  getSessionClassification,
  type ResultDataSources,
} from "../../results-engine/availability";
import type { SeasonYear } from "../../types";
import { getClassificationPresentation } from "./resultSelection";
import { RaceResults } from "./RaceResults";

const OPEN = openF1SessionResults as unknown as {
  practice: ResultDataSources["practice"];
  qualifying: ResultDataSources["qualifying"];
};
const EMPTY_PRACTICE = {};
const EMPTY_QUALIFYING = {};

function seasonSources(season: SeasonYear): ResultDataSources {
  return {
    season,
    calendar: getCalendarBySeason(season),
    detailedResults: useChampionshipStore.getState().detailedResults[season],
    raceSummaries: getRaceResults(season),
    practice: season === 2026 ? OPEN.practice : EMPTY_PRACTICE,
    qualifying: season === 2026 ? OPEN.qualifying : EMPTY_QUALIFYING,
  };
}

const render = (path: string) =>
  renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/season/:season" element={<RaceResults season={2026} />} />
      </Routes>
    </MemoryRouter>,
  );

describe("Results data selection against the live season data", () => {
  const sources = seasonSources(2026);
  const latest = getLatestAvailableResultRound(sources);

  beforeEach(() => useNavigationStore.setState({ lang: "en" }));

  it("resolves a link without a round to the latest verified round", () => {
    expect(latest).not.toBeNull();
    const html = render("/season/2026?tab=results&view=classic");
    expect(html).toContain(`ROUND ${String(latest).padStart(2, "0")}`);
  });

  it("presents the season map and scroll route by default", () => {
    const html = render("/season/2026?tab=results");
    expect(html).toContain('THE GRAND PRIX WORLD TOUR');
    expect(html).toContain('rcj-map-pin');
    expect(html).toContain('data-experience="world-tour-v4"');
    expect(html).toContain('R23');
  });
  it("keeps a deep link to a verified round and session", () => {
    const round = latest as number;
    const [session] = getAvailableSessions(sources, round);
    expect(session).toBeDefined();
    const html = render(
      `/season/2026?tab=results&round=${round}&session=${session}`,
    );
    expect(html).toContain(`id="c11-tab-${session}"`);
    expect(html).toMatch(
      new RegExp(`id="c11-tab-${session}"[^>]*aria-selected="true"`),
    );
    expect(html).toContain('class="c11-table');
  });

  it("does not fabricate a classification for a future round with no results", () => {
    const future = getCalendarBySeason(2026)
      .map((race) => race.round)
      .filter((round) => round > (latest as number))
      .find((round) => getAvailableSessions(sources, round).length === 0);
    expect(future).toBeDefined();
    const html = render(
      `/season/2026?tab=results&round=${future}&session=race`,
    );
    expect(html).toContain('class="c11-results-empty"');
    expect(html).not.toContain('class="c11-table');
  });

  it("rejects a sprint request on a standard weekend instead of inventing a session", () => {
    const standard = getCalendarBySeason(2026)
      .filter((race) => !race.hasSprint)
      .find((race) =>
        getAvailableSessions(sources, race.round).includes("race"),
      );
    expect(standard).toBeDefined();
    const html = render(
      `/season/2026?tab=results&round=${standard?.round}&session=sprint`,
    );
    expect(html).not.toContain('id="c11-tab-sprint"');
    expect(html).not.toContain('id="c11-tab-sprintQualifying"');
    expect(html).toContain('class="c11-table');
  });

  it("keeps sprint classifications on the sprint weekend that ran them", () => {
    const sprintRound = getCalendarBySeason(2026)
      .filter((race) => race.hasSprint)
      .find((race) => getAvailableSessions(sources, race.round).includes("sprint"));
    expect(sprintRound).toBeDefined();
    const html = render(
      `/season/2026?tab=results&round=${sprintRound?.round}&session=sprint`,
    );
    expect(html).toContain('id="c11-tab-sprint"');
    expect(html).toMatch(/id="c11-tab-sprint"[^>]*aria-selected="true"/);
    expect(html).toContain('class="c11-table');
  });

  it("labels a hydration-level race summary as a summary, never as final", () => {
    const summarySources: ResultDataSources = { ...sources, detailedResults: [] };
    const summaryRound = getCalendarBySeason(2026)
      .map((race) => race.round)
      .find(
        (round) =>
          getSessionClassification(summarySources, round, "race")?.partial ===
          true,
      );
    expect(summaryRound).toBeDefined();
    const classification = getSessionClassification(
      summarySources,
      summaryRound as number,
      "race",
    );
    expect(getClassificationPresentation(classification, false)).toBe("summary");
  });
});
