import React, { Suspense, lazy, useEffect, useLayoutEffect, useState } from 'react';
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { useChampionshipStore } from './store/useChampionshipStore';
import { useNavigationStore } from './store/useNavigationStore';
import { SeasonYear, isSeasonYear } from './types';
import { RaceClassificationModal } from './components/championship/RaceClassificationModal';
import { getCompleteRaceClassification } from './data/championship/raceClassificationHelper';

import { F1PageTransition } from './components/common/F1PageTransition';
import { RouteSeo } from './components/seo/RouteSeo';
import { useMobileHub, isPrimaryPath } from './hooks/useMobileHub';
import { MobileAllInOne } from './components/mobile/MobileAllInOne';
import { Container } from './components/ui/Container';
import { buttonClassName } from './components/ui/buttonStyles';
import { StatePanel } from './components/ui/StatePanel';

const HomeView = lazy(() =>
  import('./components/home/HomeView').then((m) => ({ default: m.HomeView })),
);
const ChampionshipView = lazy(() =>
  import('./components/championship/ChampionshipView').then((m) => ({
    default: m.ChampionshipView,
  })),
);

const ShowroomView = lazy(() =>
  import('./components/showroom/ShowroomView').then((m) => ({
    default: m.ShowroomView,
  })),
);
const TeamDetailPage = lazy(() =>
  import('./components/pages/TeamDetailPage').then((m) => ({
    default: m.TeamDetailPage,
  })),
);
const DriverDetailPage = lazy(() =>
  import('./components/pages/DriverDetailPage').then((m) => ({
    default: m.DriverDetailPage,
  })),
);
const CarDetailPage = lazy(() =>
  import('./components/pages/CarDetailPage').then((m) => ({
    default: m.CarDetailPage,
  })),
);
const TeamsDirectoryPage = lazy(() =>
  import('./components/pages/TeamsDirectoryPage').then((m) => ({
    default: m.TeamsDirectoryPage,
  })),
);
const DriversDirectoryPage = lazy(() =>
  import('./components/pages/DriversDirectoryPage').then((m) => ({
    default: m.DriversDirectoryPage,
  })),
);
const AboutPage = lazy(() =>
  import('./components/pages/AboutPage').then((m) => ({
    default: m.AboutPage,
  })),
);
const EngineeringIndexPage = lazy(() =>
  import('./components/engineering/EngineeringIndexPage').then((m) => ({
    default: m.EngineeringIndexPage,
  })),
);
const EngineeringArticlePage = lazy(() =>
  import('./components/engineering/EngineeringArticlePage').then((m) => ({
    default: m.EngineeringArticlePage,
  })),
);
const EngineeringAnatomyPage = lazy(() => import('./components/engineering/EngineeringAnatomyPage'));

let lastAutoRaceSyncAt = 0;

const validSeason = (value?: string): value is `${SeasonYear}` => isSeasonYear(value);

function SeasonRoute() {
  const { year } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setSelectedSeason = useChampionshipStore((state) => state.setSelectedSeason);
  const setActiveSubTab = useChampionshipStore((state) => state.setActiveSubTab);
  const setStandingsCategory = useChampionshipStore((state) => state.setStandingsCategory);
  const season = (validSeason(year) ? Number(year) : 2026) as SeasonYear;
  const mobileHub = useMobileHub();

  useEffect(() => {
    if (validSeason(year)) setSelectedSeason(season);
    const tab = searchParams.get('tab');
    if (tab && ['standings', 'calendar', 'results', 'teams', 'drivers'].includes(tab)) {
      setActiveSubTab(tab as 'standings' | 'calendar' | 'results' | 'teams' | 'drivers');
    } else if (!tab) setActiveSubTab('standings');
    const category = searchParams.get('category');
    if (category === 'drivers' || category === 'constructors') setStandingsCategory(category);
  }, [year, season, setSelectedSeason, searchParams, setActiveSubTab, setStandingsCategory]);

  if (!validSeason(year)) return <NotFound />;
  if (searchParams.get('tab') === 'overview') return <Navigate to="/#championship-overview" replace />;
  if (mobileHub) return <MobileAllInOne season={season} />;
  return (
    <ChampionshipView season={season} onSeasonChange={(next) => navigate(`/season/${next}`)} />
  );
}

function RaceRoute() {
  const { year, round } = useParams();
  const navigate = useNavigate();
  const detailedResults = useChampionshipStore((state) => state.detailedResults);
  const setSelectedSeason = useChampionshipStore((state) => state.setSelectedSeason);
  const setActiveSubTab = useChampionshipStore((state) => state.setActiveSubTab);
  const validRoute = validSeason(year) && /^\d+$/.test(round || '');
  const season = (validSeason(year) ? Number(year) : 2026) as SeasonYear;
  const raceRound = Number(round);

  useLayoutEffect(() => {
    if (validRoute) {
      setSelectedSeason(season);
      setActiveSubTab('results');
    }
  }, [validRoute, season, setSelectedSeason, setActiveSubTab]);

  if (!validRoute) return <NotFound />;
  const race = getCompleteRaceClassification(season, raceRound, detailedResults[season]);
  if (!race) return <NotFound />;

  return (
    <>
      <ChampionshipView season={season} onSeasonChange={(next) => navigate(`/season/${next}`)} />
      <RaceClassificationModal
        race={race}
        onClose={() => navigate(`/season/${season}?tab=results`)}
      />
    </>
  );
}

function NotFound() {
  const lang = useNavigationStore((state) => state.lang);
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="font-mono text-sm font-bold uppercase tracking-[0.28em] text-peds-accent-soft">
        Route error · 404
      </p>
      <h1 className="mt-4 font-display text-4xl font-black uppercase text-peds-text">
        {lang === 'vi' ? 'Không tìm thấy trang' : 'Page not found'}
      </h1>
      <Link className={buttonClassName({ className: 'mt-7' })} to="/">
        {lang === 'vi' ? 'Về trang chủ' : 'Go home'}
      </Link>
    </Container>
  );
}

export const App: React.FC = () => {
  const location = useLocation();
  const mobileHub = useMobileHub();
  const isHubRoute = mobileHub && isPrimaryPath(location.pathname);
  const syncSeasonData = useChampionshipStore((state) => state.syncSeasonData);

  useEffect(() => {
    const refreshIfDue = () => {
      if (document.visibilityState !== 'visible' || Date.now() - lastAutoRaceSyncAt < 15 * 60_000)
        return;
      lastAutoRaceSyncAt = Date.now();
      void syncSeasonData(2026);
    };

    refreshIfDue();
    const interval = window.setInterval(refreshIfDue, 15 * 60_000);
    document.addEventListener('visibilitychange', refreshIfDue);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshIfDue);
    };
  }, [syncSeasonData]);

  const [scrollProgress, setScrollProgress] = useState<number>(0);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const currentScroll = window.scrollY;
          const progress = docHeight > 0 ? Math.min(1, Math.max(0, currentScroll / docHeight)) : 0;
          setScrollProgress(progress);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileHub && isPrimaryPath(location.pathname)) return;
    if (location.pathname.startsWith('/season/') && new URLSearchParams(location.search).get('tab') === 'calendar') return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname, location.search, mobileHub]);


  return (
    <div className={`relative flex min-h-screen flex-col bg-peds-canvas font-sans text-peds-text selection:bg-peds-accent selection:text-white ${location.pathname === '/' ? 'h25-home-route' : ''}`}>
      <RouteSeo />
      {/* ── D2. Film Grain Overlay (Cinematic Texture) ── */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-[45] opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <Navbar />

      {/* ── D1. Scroll Progress Speed Strip ── */}
      <div className="fixed top-0 left-0 right-0 h-[2.5px] z-[70] pointer-events-none bg-black/20 overflow-hidden">
        <div
          style={{
            transform: `scaleX(${scrollProgress})`,
            transformOrigin: 'left',
          }}
          className="w-full h-full bg-gradient-to-r from-f1red via-amber-400 to-yellow-300 transition-transform duration-75 ease-out"
        />
      </div>

      <main className="flex-1 pt-16">
        <F1PageTransition
          pathname={isHubRoute ? '/mobile-hub' : location.pathname}
          noTransform={isHubRoute}
        >
          <Suspense
            fallback={
              <Container className="min-h-[calc(100svh-64px)] py-16">
                <StatePanel state="loading" title="Loading interface" />
              </Container>
            }
          >
            <Routes>
              <Route
                path="/"
                element={mobileHub ? <MobileAllInOne season={2026} /> : <HomeView />}
              />
              {['/live', '/archive', '/timing'].map((path) => (
                <Route
                  key={path}
                  path={path}
                  element={<Navigate to="/season/2026?tab=results" replace />}
                />
              ))}
              <Route path="/season" element={<Navigate to="/season/2026" replace />} />
              <Route path="/championship" element={<Navigate to="/season/2026" replace />} />
              <Route path="/season/:year" element={<SeasonRoute />} />
              <Route path="/season/:year/race/:round" element={<RaceRoute />} />
              <Route
                path="/showroom"
                element={mobileHub ? <MobileAllInOne season={2026} /> : <ShowroomView />}
              />
              <Route path="/gallery" element={<Navigate to="/showroom" replace />} />
              <Route path="/teams/:teamId" element={<TeamDetailPage />} />
              <Route path="/drivers/:driverId" element={<DriverDetailPage />} />
              <Route path="/cars/:carId" element={<CarDetailPage />} />
              <Route path="/teams" element={<TeamsDirectoryPage />} />
              <Route path="/drivers" element={<DriversDirectoryPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/engineering" element={<EngineeringIndexPage />} />
              <Route path="/engineering/car-anatomy" element={<EngineeringAnatomyPage />} />
              <Route path="/engineering/:slug" element={<EngineeringArticlePage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </F1PageTransition>
      </main>
      <Footer />
    </div>
  );
};

export default App;
