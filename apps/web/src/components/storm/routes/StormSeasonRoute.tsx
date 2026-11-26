import { useEffect, useMemo, useState } from "react";
import {
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useNextRace } from "../../home/useNextRace";
import {
  getCalendarBySeason,
  getRaceResults,
  getStandings,
} from "../../../data/championship";
import { getCompleteRaceClassification } from "../../../data/championship/raceClassificationHelper";
import { useReducedMotion } from "../../../hooks/useReducedMotion";
import { useChampionshipStore } from "../../../store/useChampionshipStore";
import { useNavigationStore } from "../../../store/useNavigationStore";
import { isSeasonYear, type SeasonYear } from "../../../types";
import { useStormShell } from "../stormShellContext";
import { StormNotFound } from "../StormNotFound";
import {
  StormCalendarView,
  StormDriversView,
  StormResultsView,
  StormStandingsView,
  StormTeamsView,
} from "../StormViews";

type SeasonTab = "standings" | "calendar" | "results" | "teams" | "drivers";

const VALID_TABS = new Set<SeasonTab>([
  "standings",
  "calendar",
  "results",
  "teams",
  "drivers",
]);

export function StormSeasonRoute() {
  const { year } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const lang = useNavigationStore((s) => s.lang);
  const reducedMotion = useReducedMotion();
  const nextRace = useNextRace();
  const { openInspection } = useStormShell();

  const setSelectedSeason = useChampionshipStore((s) => s.setSelectedSeason);
  const setActiveSubTab = useChampionshipStore((s) => s.setActiveSubTab);

  const valid = isSeasonYear(year);
  const season = (valid ? Number(year) : 2026) as SeasonYear;

  const rawTab = searchParams.get("tab");
  const activeTab: SeasonTab =
    rawTab && VALID_TABS.has(rawTab as SeasonTab)
      ? (rawTab as SeasonTab)
      : "standings";

  const calendar = useMemo(() => getCalendarBySeason(season), [season]);
  const results = useMemo(() => getRaceResults(season), [season]);
  const standings = useMemo(() => getStandings(season), [season]);

  const rawRound = Number(searchParams.get("round") ?? "");
  const defaultRound = useMemo(() => {
    if (
      Number.isInteger(rawRound) &&
      calendar.some((r) => r.round === rawRound)
    ) {
      return rawRound;
    }
    if (activeTab === "calendar" && season === 2026 && nextRace) {
      return nextRace.round;
    }
    return results[results.length - 1]?.round ?? calendar[0]?.round ?? 1;
  }, [activeTab, calendar, nextRace, rawRound, results, season]);

  const [selectedRound, setSelectedRound] = useState<number>(defaultRound);
  const [hoveredStandingsId, setHoveredStandingsId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setSelectedRound(defaultRound);
  }, [defaultRound]);

  useEffect(() => {
    if (!valid) return;
    setSelectedSeason(season);
    setActiveSubTab(activeTab);
  }, [activeTab, season, setActiveSubTab, setSelectedSeason, valid]);

  if (!valid) {
    return <StormNotFound kicker="404 · UNRECOGNIZED SEASON" />;
  }

  if (rawTab === "overview") {
    return <Navigate to="/" replace />;
  }

  const handleSelectSeason = (nextSeason: SeasonYear) => {
    const qs = searchParams.toString();
    navigate(`/season/${nextSeason}${qs ? `?${qs}` : ""}`);
  };

  const handleSelectRound = (round: number) => {
    setSelectedRound(round);
    const next = new URLSearchParams(searchParams);
    next.set("round", String(round));
    setSearchParams(next, { replace: true });
  };

  if (activeTab === "results") {
    return (
      <StormResultsView
        lang={lang}
        season={season}
        calendar={calendar}
        results={results}
        selectedRound={selectedRound}
        reducedMotion={reducedMotion}
        onSelectSeason={handleSelectSeason}
        onSelectRound={handleSelectRound}
        onInspect={openInspection}
      />
    );
  }

  if (activeTab === "calendar") {
    return (
      <StormCalendarView
        lang={lang}
        season={season}
        calendar={calendar}
        results={results}
        standingsDrivers={standings.drivers}
        nextRace={season === 2026 ? nextRace : undefined}
        selectedRound={selectedRound}
        reducedMotion={reducedMotion}
        onSelectSeason={handleSelectSeason}
        onSelectRound={(round) => {
          setSelectedRound(round);
          if (results.some((r) => r.round === round)) {
            navigate(`/season/${season}?tab=results&round=${round}`);
          }
        }}
      />
    );
  }

  if (activeTab === "teams") {
    return (
      <StormTeamsView
        lang={lang}
        season={season}
        constructors={standings.constructors}
        drivers={standings.drivers}
        reducedMotion={reducedMotion}
        onSelectSeason={handleSelectSeason}
        onInspect={openInspection}
      />
    );
  }

  if (activeTab === "drivers") {
    return (
      <StormDriversView
        lang={lang}
        season={season}
        drivers={standings.drivers}
        reducedMotion={reducedMotion}
        onSelectSeason={handleSelectSeason}
        onInspect={openInspection}
      />
    );
  }

  return (
    <StormStandingsView
      lang={lang}
      season={season}
      drivers={standings.drivers}
      constructors={standings.constructors}
      hoveredStandingsId={hoveredStandingsId}
      reducedMotion={reducedMotion}
      onSelectSeason={handleSelectSeason}
      onHoverStandingsId={setHoveredStandingsId}
      onInspect={openInspection}
    />
  );
}

export function StormRaceRoute() {
  const { year, round } = useParams();
  const navigate = useNavigate();
  const lang = useNavigationStore((s) => s.lang);
  const reducedMotion = useReducedMotion();
  const detailedResults = useChampionshipStore((s) => s.detailedResults);
  const setSelectedSeason = useChampionshipStore((s) => s.setSelectedSeason);
  const setActiveSubTab = useChampionshipStore((s) => s.setActiveSubTab);
  const { openInspection } = useStormShell();

  const valid = isSeasonYear(year) && /^\d+$/.test(round ?? "");
  const season = (isSeasonYear(year) ? Number(year) : 2026) as SeasonYear;
  const raceRound = Number(round);

  useEffect(() => {
    if (!valid) return;
    setSelectedSeason(season);
    setActiveSubTab("results");
  }, [season, setActiveSubTab, setSelectedSeason, valid]);

  const calendar = useMemo(() => getCalendarBySeason(season), [season]);
  const results = useMemo(() => getRaceResults(season), [season]);

  if (!valid) {
    return <StormNotFound kicker="404 · INVALID RACE ROUND" />;
  }

  const classification = getCompleteRaceClassification(
    season,
    raceRound,
    detailedResults[season],
  );
  const hasSummary = results.some((r) => r.round === raceRound);
  if (!classification && !hasSummary) {
    return <StormNotFound kicker="404 · RACE CLASSIFICATION NOT FOUND" />;
  }

  return (
    <StormResultsView
      lang={lang}
      season={season}
      calendar={calendar}
      results={results}
      selectedRound={raceRound}
      reducedMotion={reducedMotion}
      onSelectSeason={(next) => navigate(`/season/${next}?tab=results`)}
      onSelectRound={(nextRound) =>
        navigate(`/season/${season}/race/${nextRound}`)
      }
      onInspect={openInspection}
    />
  );
}

export default StormSeasonRoute;
