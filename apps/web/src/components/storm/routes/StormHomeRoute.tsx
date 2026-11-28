import { useMemo } from "react";
import { useNextRace } from "../../home/useNextRace";
import { getRaceResults } from "../../../data/championship/results";
import { getStandings } from "../../../data/championship/standings";
import { useReducedMotion } from "../../../hooks/useReducedMotion";
import { useChampionshipStore } from "../../../store/useChampionshipStore";
import { useNavigationStore } from "../../../store/useNavigationStore";
import type { RaceResult } from "../../../types";
import { prefetchStormRoute } from "../routePrefetch";
import { useStormShell } from "../stormShellContext";
import { StormOverview } from "../StormOverview";

export function StormHomeRoute() {
  const lang = useNavigationStore((s) => s.lang);
  const reducedMotion = useReducedMotion();
  const nextRace = useNextRace();
  const { openInspection } = useStormShell();
  const liveStandings2026 = useChampionshipStore(
    (s) => s.calculatedStandings[2026],
  );
  const liveDetailed2026 = useChampionshipStore(
    (s) => s.detailedResults[2026],
  );

  const standings = useMemo(() => {
    const base = getStandings(2026);
    if (!liveStandings2026?.drivers?.length) return base;
    return {
      ...base,
      drivers: liveStandings2026.drivers,
      constructors: liveStandings2026.constructors,
    };
  }, [liveStandings2026]);

  const latestResult = useMemo<RaceResult>(() => {
    const staticResults = getRaceResults(2026);
    const staticLatest = staticResults[staticResults.length - 1];
    const liveCompleted = (liveDetailed2026 || [])
      .filter((r) => r.status === "completed" && r.entries.length >= 3)
      .sort((a, b) => b.round - a.round)[0];

    if (liveCompleted && liveCompleted.round > staticLatest.round) {
      const [p1, p2, p3] = liveCompleted.entries;
      return {
        round: liveCompleted.round,
        grandPrix: liveCompleted.grandPrix,
        circuit: liveCompleted.circuit,
        season: 2026,
        date: liveCompleted.date,
        dataSource: liveCompleted.dataSource,
        dataUpdatedAt: liveCompleted.dataUpdatedAt,
        podium: {
          p1: {
            driver: p1.driverName,
            team: p1.teamName,
            time: p1.timeOrGap,
            points: p1.points,
          },
          p2: {
            driver: p2.driverName,
            team: p2.teamName,
            gap: p2.timeOrGap,
            points: p2.points,
          },
          p3: {
            driver: p3.driverName,
            team: p3.teamName,
            gap: p3.timeOrGap,
            points: p3.points,
          },
        },
        fastestLap: liveCompleted.fastestLap ?? {
          driver: p1.driverName,
          team: p1.teamName,
          time: "—",
        },
      };
    }
    return staticLatest;
  }, [liveDetailed2026]);

  return (
    <StormOverview
      lang={lang}
      season={2026}
      reducedMotion={reducedMotion}
      nextRace={nextRace}
      latestResult={latestResult}
      standings={standings}
      onInspect={openInspection}
      onPrefetchRoute={(target) => {
        prefetchStormRoute(target);
      }}
    />
  );
}

export default StormHomeRoute;
