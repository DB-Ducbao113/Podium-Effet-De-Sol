import { useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { CALENDAR_2026 } from '../../data/championship';
import { useChampionshipStore } from '../../store/useChampionshipStore';
import { getCalendarRaceState } from '../../utils/raceSchedule';
import { useReveal } from '../../hooks/useReveal';
import { AdSlot } from '../ui/AdSlot';
import { F1NewsTicker } from '../common/F1NewsTicker';
import { FeaturedRace } from './FeaturedRace';
import { HomeRaceCountdown } from './HomeRaceCountdown';
import { HomeSeasonOverview } from './HomeSeasonOverview';
import { HomeStoryLinks } from './HomeStoryLinks';
import { PodiumBrandHero } from './PodiumBrandHero';
import './homepageH1.css';

export function HomeView() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const detailedResultsRaw = useChampionshipStore((state) => state.detailedResults?.[2026]);
  const [scheduleNow, setScheduleNow] = useState(() => Date.now());
  const { ref: latestRef, isRevealed: latestRevealed } = useReveal(0.1);
  const { ref: countdownRef, isRevealed: countdownRevealed } = useReveal(0.1);

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

  // Retain the existing calendar and verified-results selection contract.
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
    <div className="r1-primary r1-home h1-home min-h-screen bg-studio-100">
      <PodiumBrandHero />
      <F1NewsTicker variant="hero" />
      <div className="home-story">
        <div id="r1-first-content" ref={latestRef} data-revealed={latestRevealed} className="h25-reveal scroll-mt-20">
          <FeaturedRace />
        </div>
        <div ref={countdownRef} data-revealed={countdownRevealed} className="h25-reveal">
          <HomeRaceCountdown race={nextRace} />
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
