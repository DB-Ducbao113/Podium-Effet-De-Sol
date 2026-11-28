import React, { Suspense, lazy, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { LiquidGlassFilterDefs } from "./components/common/LiquidGlassFilterDefs";
import { RouteSeo } from "./components/seo/RouteSeo";
import {
  DesignPrototypeRedirect,
  StormAppShell,
} from "./components/storm/StormAppShell";
import StormHomeRoute from "./components/storm/routes/StormHomeRoute";
import { StormNotFound } from "./components/storm/StormNotFound";
import { isEngineeringLabSandboxPath } from "./components/engineering-lab/engineeringLabRoutes";
import { useTextZoomAttribute } from "./hooks/useTextZoomAttribute";
import { useChampionshipStore } from "./store/useChampionshipStore";
import { useTimezoneStore } from "./store/useTimezoneStore";

const StormSeasonRoute = lazy(() =>
  import("./components/storm/routes/StormSeasonRoute").then((m) => ({
    default: m.StormSeasonRoute,
  })),
);
const StormRaceRoute = lazy(() =>
  import("./components/storm/routes/StormSeasonRoute").then((m) => ({
    default: m.StormRaceRoute,
  })),
);
const StormTeamsRoute = lazy(() =>
  import("./components/storm/routes/StormDirectoryRoute").then((m) => ({
    default: m.StormTeamsRoute,
  })),
);
const StormDriversRoute = lazy(() =>
  import("./components/storm/routes/StormDirectoryRoute").then((m) => ({
    default: m.StormDriversRoute,
  })),
);
const StormTeamDetailRoute = lazy(() =>
  import("./components/storm/routes/StormEntityRoute").then((m) => ({
    default: m.StormTeamDetailRoute,
  })),
);
const StormDriverDetailRoute = lazy(() =>
  import("./components/storm/routes/StormEntityRoute").then((m) => ({
    default: m.StormDriverDetailRoute,
  })),
);
const StormCarDetailRoute = lazy(() =>
  import("./components/storm/routes/StormEntityRoute").then((m) => ({
    default: m.StormCarDetailRoute,
  })),
);
const StormShowroomRoute = lazy(
  () => import("./components/storm/routes/StormShowroomRoute"),
);
const StormEngineeringRoute = lazy(
  () => import("./components/storm/routes/StormEngineeringRoute"),
);
const StormEngineeringArticleRoute = lazy(
  () => import("./components/storm/routes/StormEngineeringArticleRoute"),
);
const StormAboutRoute = lazy(
  () => import("./components/storm/routes/StormAboutRoute"),
);
const EngineeringLabSandboxRoutes = lazy(
  () => import("./components/engineering-lab/EngineeringLabSandboxRoutes"),
);

let lastAutoRaceSyncAt = 0;

function StormSuspenseFallback() {
  return (
    <div
      className="sp-lg-wrap"
      role="status"
      aria-live="polite"
      data-testid="storm-route-loading"
    >
      <div className="sp-lg-panel sp-state-panel">
        <span className="sp-mono-tag">LOADING · STORM SURFACE</span>
      </div>
    </div>
  );
}

export const App: React.FC = () => {
  useTextZoomAttribute();
  const location = useLocation();
  const syncSeasonData = useChampionshipStore((state) => state.syncSeasonData);

  useEffect(() => {
    void useTimezoneStore.getState().bootstrapAutoTimezone();
  }, []);

  useEffect(() => {
    const onSeasonPage = location.pathname.startsWith("/season/");
    if (!onSeasonPage) return;

    const refreshIfDue = () => {
      if (
        document.visibilityState !== "visible" ||
        Date.now() - lastAutoRaceSyncAt < 15 * 60_000
      ) {
        return;
      }
      lastAutoRaceSyncAt = Date.now();
      void syncSeasonData(2026);
    };

    refreshIfDue();
    const interval = window.setInterval(refreshIfDue, 15 * 60_000);
    document.addEventListener("visibilitychange", refreshIfDue);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshIfDue);
    };
  }, [location.pathname, syncSeasonData]);

  useEffect(() => {
    if (
      isEngineeringLabSandboxPath(location.pathname) &&
      (Boolean(location.hash) || location.search.includes("lab="))
    ) {
      return;
    }
    if (window.scrollY > 0) {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  }, [location.hash, location.pathname, location.search]);

  if (isEngineeringLabSandboxPath(location.pathname)) {
    return (
      <>
        <LiquidGlassFilterDefs />
        <Suspense fallback={<StormSuspenseFallback />}>
          <Routes>
            <Route
              path="/__engineering-lab/*"
              element={<EngineeringLabSandboxRoutes />}
            />
          </Routes>
        </Suspense>
      </>
    );
  }

  return (
    <>
      <LiquidGlassFilterDefs />
      <RouteSeo />
      <StormAppShell>
        <Suspense fallback={<StormSuspenseFallback />}>
          <Routes>
            <Route path="/" element={<StormHomeRoute />} />
            {["/live", "/archive", "/timing"].map((path) => (
              <Route
                key={path}
                path={path}
                element={<Navigate to="/season/2026?tab=results" replace />}
              />
            ))}
            <Route
              path="/season"
              element={<Navigate to="/season/2026" replace />}
            />
            <Route
              path="/championship"
              element={<Navigate to="/season/2026" replace />}
            />
            <Route path="/season/:year" element={<StormSeasonRoute />} />
            <Route
              path="/season/:year/race/:round"
              element={<StormRaceRoute />}
            />
            <Route path="/showroom" element={<StormShowroomRoute />} />
            <Route
              path="/gallery"
              element={<Navigate to="/showroom" replace />}
            />
            <Route path="/teams" element={<StormTeamsRoute />} />
            <Route path="/teams/:teamId" element={<StormTeamDetailRoute />} />
            <Route path="/drivers" element={<StormDriversRoute />} />
            <Route
              path="/drivers/:driverId"
              element={<StormDriverDetailRoute />}
            />
            <Route path="/cars/:carId" element={<StormCarDetailRoute />} />
            <Route path="/about" element={<StormAboutRoute />} />
            <Route path="/engineering" element={<StormEngineeringRoute />} />
            <Route
              path="/engineering/car-anatomy"
              element={<StormEngineeringRoute />}
            />
            <Route
              path="/engineering/:slug"
              element={<StormEngineeringArticleRoute />}
            />
            <Route
              path="/__design-prototype"
              element={<DesignPrototypeRedirect />}
            />
            <Route path="*" element={<StormNotFound />} />
          </Routes>
        </Suspense>
      </StormAppShell>
    </>
  );
};

export default App;
