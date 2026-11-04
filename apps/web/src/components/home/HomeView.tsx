import { useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { CALENDAR_2026 } from '../../data/championship';
import { useChampionshipStore } from '../../store/useChampionshipStore';
import { getCalendarRaceState } from '../../utils/raceSchedule';
import { AdSlot } from '../ui/AdSlot';
import { HomeRaceControl } from './HomeRaceControl';
import { HomeSeasonOverview } from './HomeSeasonOverview';
import { HomeStoryLinks } from './HomeStoryLinks';
import { PodiumBrandHero } from './PodiumBrandHero';
import { HomeCinematicBackground } from './HomeCinematicBackground';
import './homepageH1.css';
import './homeLandingV3.css';
import './homeV83Interactions.css';

export function HomeView() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const detailedResultsRaw = useChampionshipStore((state) => state.detailedResults?.[2026]);
  const [scheduleNow, setScheduleNow] = useState(() => Date.now());

  useEffect(() => {
    if (location.hash !== '#championship-overview') return;
    const frame = requestAnimationFrame(() => document.getElementById('championship-overview')?.scrollIntoView({ block: 'start', behavior: 'instant' }));
    return () => cancelAnimationFrame(frame);
  }, [location.hash]);

  useEffect(() => {
    const refresh = () => setScheduleNow(Date.now());
    const interval = window.setInterval(refresh, 30_000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  // Keep calendar and validated-results selection contracts unchanged.
  const nextRace = useMemo(() => {
    const completed = new Set(
      (Array.isArray(detailedResultsRaw) ? detailedResultsRaw : [])
        .filter((race) => race && race.status === 'completed')
        .map((race) => race.round),
    );
    const remaining = CALENDAR_2026.filter((race) =>
      race && !completed.has(race.round) && getCalendarRaceState(race, scheduleNow) !== 'completed',
    );
    return remaining.find((race) => getCalendarRaceState(race, scheduleNow) === 'current') ||
      remaining.find((race) => getCalendarRaceState(race, scheduleNow) === 'upcoming');
  }, [detailedResultsRaw, scheduleNow]);

  const showAdReview = import.meta.env.DEV && searchParams.get('design-review') === 'ads';

  return (
    <div className="r1-primary r1-home h1-home home-v3 min-h-screen bg-studio-100">
      <HomeCinematicBackground />
      <PodiumBrandHero />
      <div className="home-v3__content">
        <div id="r1-first-content" className="scroll-mt-20">
          <HomeRaceControl race={nextRace} />
        </div>
        {showAdReview && (
          <section className="page-container h1-ad-band" aria-label="Advertising placement review">
            <AdSlot variant="leaderboard" reviewMode placement="homepage-after-race-countdown" />
          </section>
        )}
        <HomeSeasonOverview />
        <HomeStoryLinks />
        {showAdReview && (
          <section className="page-container h1-ad-band h1-ad-band--lower" aria-label="Advertising placement review">
            <AdSlot variant="in-content" reviewMode placement="homepage-after-editorial" />
          </section>
        )}
      </div>
    </div>
  );
}
