import { useMemo } from "react";
import { useNextRace } from "../../home/useNextRace";
import { getRaceResults, getStandings } from "../../../data/championship";
import { useReducedMotion } from "../../../hooks/useReducedMotion";
import { useNavigationStore } from "../../../store/useNavigationStore";
import { prefetchStormRoute } from "../routePrefetch";
import { useStormShell } from "../stormShellContext";
import { StormOverview } from "../StormOverview";

export function StormHomeRoute() {
  const lang = useNavigationStore((s) => s.lang);
  const reducedMotion = useReducedMotion();
  const nextRace = useNextRace();
  const { openInspection } = useStormShell();

  const standings = useMemo(() => getStandings(2026), []);
  const latestResult = useMemo(() => {
    const res = getRaceResults(2026);
    return res[res.length - 1];
  }, []);

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
