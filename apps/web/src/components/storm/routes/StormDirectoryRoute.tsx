import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { getStandings } from "../../../data/championship";
import { useReducedMotion } from "../../../hooks/useReducedMotion";
import { useChampionshipStore } from "../../../store/useChampionshipStore";
import { useNavigationStore } from "../../../store/useNavigationStore";
import { isSeasonYear, type SeasonYear } from "../../../types";
import { useStormShell } from "../stormShellContext";
import { StormDriversView, StormTeamsView } from "../StormViews";

function useDirectorySeason(): [SeasonYear, (next: SeasonYear) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const storeSeason = useChampionshipStore((s) => s.selectedSeason);
  const setStoreSeason = useChampionshipStore((s) => s.setSelectedSeason);

  const raw = searchParams.get("season");
  const season: SeasonYear = isSeasonYear(raw ?? undefined)
    ? (Number(raw) as SeasonYear)
    : isSeasonYear(storeSeason)
      ? storeSeason
      : 2026;

  const selectSeason = (next: SeasonYear) => {
    setStoreSeason(next);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("season", String(next));
    setSearchParams(nextParams);
  };

  return [season, selectSeason];
}

export function StormTeamsRoute() {
  const lang = useNavigationStore((s) => s.lang);
  const reducedMotion = useReducedMotion();
  const { openInspection } = useStormShell();
  const [season, selectSeason] = useDirectorySeason();
  const standings = useMemo(() => getStandings(season), [season]);

  return (
    <StormTeamsView
      lang={lang}
      season={season}
      constructors={standings.constructors}
      drivers={standings.drivers}
      reducedMotion={reducedMotion}
      onSelectSeason={selectSeason}
      onInspect={openInspection}
    />
  );
}

export function StormDriversRoute() {
  const lang = useNavigationStore((s) => s.lang);
  const reducedMotion = useReducedMotion();
  const { openInspection } = useStormShell();
  const [season, selectSeason] = useDirectorySeason();
  const standings = useMemo(() => getStandings(season), [season]);

  return (
    <StormDriversView
      lang={lang}
      season={season}
      drivers={standings.drivers}
      reducedMotion={reducedMotion}
      onSelectSeason={selectSeason}
      onInspect={openInspection}
    />
  );
}

export default StormTeamsRoute;
