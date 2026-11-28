import {
  Suspense,
  lazy,
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { getRaceResults } from "../../data/championship/results";
import { getStandings } from "../../data/championship/standings";
import { getCompleteRaceClassification } from "../../data/championship/raceClassificationHelper";
import { DRIVERS_DATA } from "../../data/drivers";
import { getEngineeringArticle } from "../../data/engineeringArticles";
import { TEAMS_DATA } from "../../data/teams";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useChampionshipStore } from "../../store/useChampionshipStore";
import { useNavigationStore } from "../../store/useNavigationStore";
import { isSeasonYear, type SeasonYear, type TeamId } from "../../types";
import { GlobalLiquidNav } from "../layout/navigation/GlobalLiquidNav";
import {
  buildNavHref,
  isPlainPrimaryClick,
  resolveActiveNavId,
  resolveEffectiveSeason,
  type NavAdapter,
} from "../layout/navigation/navRouting";
import { prefetchStormRoute } from "./routePrefetch";
import { StormHeroBackdrop } from "./StormHeroBackdrop";
import { StormSlimFooter } from "./StormSlimFooter";

const StormDossierDrawer = lazy(() =>
  import("./StormDossierDrawer").then((m) => ({
    default: m.StormDossierDrawer,
  })),
);
import {
  StormShellContext,
  resolveDesignPrototypeRedirectTarget,
} from "./stormShellContext";
import type { StormInspectionTarget } from "./types";
import { RouteTransitionVeil } from "./motion/RouteTransitionVeil";
import { useLenisSmoothScroll } from "./motion/useLenisSmoothScroll";
import { useStormSurfaceMotion } from "./motion/useStormSurfaceMotion";
import "./motion/stormMotion.css";
import "./stormShell.css";
import "./stormVisualCraft.css";

function isEntityNotFoundPath(pathname: string): boolean {
  const raceMatch = pathname.match(
    /^\/season\/(2024|2025|2026)\/race\/(\d+)\/?$/,
  );
  if (raceMatch) {
    const season = Number(raceMatch[1]) as SeasonYear;
    const round = Number(raceMatch[2]);
    const hasSummary = getRaceResults(season).some((r) => r.round === round);
    const hasDetailed = Boolean(getCompleteRaceClassification(season, round));
    return !hasSummary && !hasDetailed;
  }

  const teamMatch = pathname.match(/^\/teams\/([^/]+)\/?$/);
  if (teamMatch) {
    return !TEAMS_DATA[teamMatch[1] as TeamId];
  }

  const driverMatch = pathname.match(/^\/drivers\/([^/]+)\/?$/);
  if (driverMatch) {
    const id = driverMatch[1];
    if (DRIVERS_DATA[id]) return false;
    const inAnySeason = ([2024, 2025, 2026] as const).some((yr) =>
      getStandings(yr).drivers.some((d) => d.driverId === id),
    );
    return !inAnySeason;
  }

  const engMatch = pathname.match(/^\/engineering\/([^/]+)\/?$/);
  if (engMatch) {
    const slug = engMatch[1];
    if (slug === "car-anatomy") return false;
    return !getEngineeringArticle(slug);
  }

  return false;
}

export function DesignPrototypeRedirect() {
  const [searchParams] = useSearchParams();
  const target = resolveDesignPrototypeRedirectTarget(
    searchParams.toString() ? `?${searchParams.toString()}` : "",
  );
  return <Navigate to={target} replace />;
}

export interface StormAppShellProps {
  readonly children: ReactNode;
}

export function StormAppShell({ children }: StormAppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const lang = useNavigationStore((s) => s.lang);
  const setLang = useNavigationStore((s) => s.setLang);
  const storeSeason = useChampionshipStore((s) => s.selectedSeason);
  const reducedMotion = useReducedMotion();

  const [inspecting, setInspecting] = useState<StormInspectionTarget | null>(
    null,
  );
  const [showroomStageReady, setShowroomStageReady] = useState(false);

  const openInspection = useCallback((target: StormInspectionTarget) => {
    setInspecting(target);
  }, []);

  const closeInspection = useCallback(() => {
    setInspecting(null);
  }, []);

  const mainRef = useRef<HTMLElement | null>(null);

  const pathname = location.pathname || "/";
  const routeKey = `${pathname}${location.search}`;
  const routeMotionKey = `${routeKey}|${lang}`;
  const isOverviewRoute = pathname === "/";
  const isShowroomRoute = pathname === "/showroom";
  const isEngineering3DShow =
    pathname === "/engineering" ||
    pathname === "/engineering/" ||
    pathname === "/engineering/car-anatomy" ||
    pathname === "/engineering/car-anatomy/";

  useLenisSmoothScroll({
    enabled: true,
    reducedMotion,
    pathname,
  });

  useStormSurfaceMotion({
    containerRef: mainRef,
    routeKey: routeMotionKey,
    reducedMotion,
    disabled: isShowroomRoute || isEngineering3DShow,
  });

  const activeNavId = useMemo(() => {
    if (isEntityNotFoundPath(pathname)) return null;
    if (
      pathname.startsWith("/season/") &&
      !isSeasonYear(pathname.split("/")[2])
    ) {
      return null;
    }
    return resolveActiveNavId({
      pathname,
      search: location.search,
      hash: location.hash,
      mobileHub: false,
    });
  }, [location.hash, location.search, pathname]);

  const effectiveSeason = useMemo(
    () => resolveEffectiveSeason(pathname, storeSeason),
    [pathname, storeSeason],
  );

  const navAdapter: NavAdapter = useMemo(
    () => ({
      mode: "router",
      activeId: activeNavId,
      season: effectiveSeason,
      lang,
      surfaceTone: "dark",
      isImmersiveSurface:
        isOverviewRoute || isShowroomRoute || isEngineering3DShow,
      getHref: (id) =>
        buildNavHref({
          targetId: id,
          currentPathname: pathname,
          currentSearch: location.search,
          activeId: activeNavId,
          storeSeason: effectiveSeason,
          mobileHub: false,
        }),
      onNavigate: (id, event) => {
        if (!isPlainPrimaryClick(event)) return;
        event.preventDefault();
        setInspecting(null);
        const href = buildNavHref({
          targetId: id,
          currentPathname: pathname,
          currentSearch: location.search,
          activeId: activeNavId,
          storeSeason: effectiveSeason,
          mobileHub: false,
        });
        navigate(href);
      },
      onSelectLang: setLang,
      onPrefetchNav: (id) => {
        prefetchStormRoute(id);
      },
    }),
    [
      activeNavId,
      effectiveSeason,
      isEngineering3DShow,
      isOverviewRoute,
      isShowroomRoute,
      lang,
      location.search,
      navigate,
      pathname,
      setLang,
    ],
  );

  const showFixedTabsBackdrop =
    !isOverviewRoute &&
    !isEngineering3DShow &&
    (!isShowroomRoute || !showroomStageReady);

  const showSlimFooter =
    !isOverviewRoute && !isShowroomRoute && !isEngineering3DShow;

  const contextValue = useMemo(
    () => ({
      openInspection,
      closeInspection,
      setShowroomStageReady,
    }),
    [closeInspection, openInspection],
  );

  const tabDataAttr =
    activeNavId ?? (pathname === "/about" ? "about" : "route");

  return (
    <StormShellContext.Provider value={contextValue}>
      <div
        className="sp-root"
        lang={lang}
        data-tab={tabDataAttr}
        data-motion={reducedMotion ? "reduced" : "active"}
      >
        <div
          className={`sp-stage-backdrop ${isShowroomRoute ? "is-showroom-stage" : ""}`}
          aria-hidden="true"
        >
          <div className="sp-stage-radial" />
          <div className="sp-stage-fallback-grid" />
          {showFixedTabsBackdrop ? (
            <StormHeroBackdrop
              reducedMotion={reducedMotion}
              variant="tabs"
              calmParticles={!isShowroomRoute}
            />
          ) : null}
          {isShowroomRoute ? <div className="sp-storm-showroom-scrim" /> : null}
          <div id="storm-3d-stage-slot" className="sp-canvas" />
          <div className="sp-stage-vignette" />
        </div>

        <GlobalLiquidNav adapter={navAdapter} />

        <RouteTransitionVeil
          triggerKey={isShowroomRoute || isEngineering3DShow ? "3d" : routeKey}
          reducedMotion={reducedMotion}
        />

        <main
          ref={mainRef}
          tabIndex={-1}
          className={`sp-stage-content outline-none ${reducedMotion || isEngineering3DShow ? "" : "sp-depth-enter"
            } ${isShowroomRoute ? "is-showroom-hud" : ""} ${isEngineering3DShow ? "is-engineering-studio" : ""
            } ${isOverviewRoute ? "is-overview-editorial" : ""} ${!isOverviewRoute && !isEngineering3DShow ? "is-storm-glass-tab" : ""
            }`}
        >
          {children}
        </main>

        {showSlimFooter ? <StormSlimFooter lang={lang} /> : null}

        {inspecting ? (
          <Suspense fallback={null}>
            <StormDossierDrawer
              inspecting={inspecting}
              defaultSeason={effectiveSeason}
              lang={lang}
              onClose={closeInspection}
            />
          </Suspense>
        ) : null}
      </div>
    </StormShellContext.Provider>
  );
}
