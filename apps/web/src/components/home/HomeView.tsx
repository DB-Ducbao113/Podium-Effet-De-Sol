import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavigationStore } from '../../store/useNavigationStore';
import { STANDINGS_DATA, CALENDAR_2026 } from '../../data/championship';
import { FullscreenCarStage } from './FullscreenCarStage';
import { RaceWeekendWidget } from './RaceWeekendWidget';
import { F1NewsTicker } from '../common/F1NewsTicker';
import { AnimatedStandingsRow } from './AnimatedStandingsRow';
import { useReveal } from '../../hooks/useReveal';
import { SeasonYear } from '../../types';
import { useChampionshipStore } from '../../store/useChampionshipStore';
import { ArrowRight, Trophy, ShieldCheck, Box } from 'lucide-react';
import { getTeamTextColor } from '../../utils/teamColors';
import { Card3DTilt } from '../common/Card3DTilt';
import { PodiumBrandHero } from './PodiumBrandHero';
import { getCalendarRaceState } from '../../utils/raceSchedule';

export const HomeView: React.FC = () => {
  const { lang } = useNavigationStore();
  const navigate = useNavigate();
  const { selectedSeason, calculatedStandings } = useChampionshipStore();

  // Standings Season selector on Homepage (syncs with store, defaults to 2026)
  const [standingsSeason, setStandingsSeason] = useState<SeasonYear>(selectedSeason || 2026);
  const { ref: standingsRef, isRevealed: standingsRevealed } = useReveal(0.15);

  // Show the active race weekend, or the next scheduled round.
  const detailedResultsRaw = useChampionshipStore((state) => state.detailedResults?.[2026]);
  const [scheduleNow, setScheduleNow] = useState(() => Date.now());

  useEffect(() => {
    const refreshSchedule = () => setScheduleNow(Date.now());
    const interval = window.setInterval(refreshSchedule, 30_000);
    document.addEventListener('visibilitychange', refreshSchedule);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshSchedule);
    };
  }, []);

  const nextRace = useMemo(() => {
    const detailedResults = detailedResultsRaw || [];
    const completedResults = new Set(
      (Array.isArray(detailedResults) ? detailedResults : [])
        .filter((race) => race && race.status === 'completed')
        .map((race) => race.round),
    );
    const upcomingRounds = CALENDAR_2026.filter(
      (gp) =>
        gp &&
        !completedResults.has(gp.round) &&
        getCalendarRaceState(gp, scheduleNow) !== 'completed',
    );
    return (
      upcomingRounds.find((gp) => getCalendarRaceState(gp, scheduleNow) === 'current') ||
      upcomingRounds.find((gp) => getCalendarRaceState(gp, scheduleNow) === 'upcoming') ||
      undefined
    );
  }, [detailedResultsRaw, scheduleNow]);

  // Standings for current selected season (synchronized with championship store)
  const currentStandings = useMemo(
    () => STANDINGS_DATA[standingsSeason] || STANDINGS_DATA[2026],
    [standingsSeason],
  );
  const topDrivers = useMemo(() => {
    const drivers =
      calculatedStandings[standingsSeason]?.drivers || currentStandings?.drivers || [];
    return drivers.slice(0, 3);
  }, [calculatedStandings, currentStandings, standingsSeason]);

  const topConstructors = useMemo(() => {
    const constructors =
      calculatedStandings[standingsSeason]?.constructors || currentStandings?.constructors || [];
    return constructors.slice(0, 3);
  }, [calculatedStandings, currentStandings, standingsSeason]);

  return (
    <div className="r1-primary r1-home bg-studio-100 min-h-screen pb-20 animate-fade-in">
      {/* ── 0. PODIUM brand statement ── */}
      <PodiumBrandHero />

      {/* ── 0b. F1 News Ticker: 36px Broadcast Marquee ── */}
      <F1NewsTicker />

      <div className="space-y-16">
        {/* ── 1. Hero: Fullscreen Aerodynamic Car Stage (11 Teams) ── */}
        <div id="official-grid" className="scroll-mt-16">
          <FullscreenCarStage />
        </div>

        {/* ── 2. Race weekend countdown ── */}
        {nextRace ? (
          <RaceWeekendWidget race={nextRace} />
        ) : (
          <p className="page-container text-sm text-white/65">
            {lang === 'vi'
              ? 'Chưa có chặng đua sắp tới trong lịch hiện có.'
              : 'No upcoming race in the available calendar.'}
          </p>
        )}

        {/* ── 3. Championship Standings (Official Verified Data) ── */}
        <section ref={standingsRef} className="page-container space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-f1red block mb-1">
                FIA Formula 1 World Championship
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-wide text-studio-950">
                {lang === 'vi'
                  ? `Bảng Xếp Hạng Điểm Số (${standingsSeason})`
                  : `Championship Standings (${standingsSeason})`}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {/* Season Switcher on Home with Sliding Pill Indicator */}
              <div className="relative flex items-center bg-white p-1 rounded-xl border border-studio-200 shadow-xs w-48 sm:w-56">
                <div
                  className="absolute top-1 bottom-1 rounded-lg bg-f1red shadow-xs transition-all duration-300 ease-out pointer-events-none"
                  style={{
                    width: 'calc((100% - 8px) / 3)',
                    left: `calc(4px + ${[2026, 2025, 2024].indexOf(standingsSeason)} * ((100% - 8px) / 3))`,
                  }}
                />
                {([2026, 2025, 2024] as SeasonYear[]).map((season) => (
                  <button
                    key={season}
                    onClick={() => setStandingsSeason(season)}
                    className={`relative z-10 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 flex-1 ${
                      standingsSeason === season
                        ? 'text-white font-black'
                        : 'text-studio-600 hover:text-studio-950'
                    }`}
                  >
                    <span>{season}</span>
                    {season === 2026 && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          standingsSeason === 2026 ? 'bg-white' : 'bg-emerald-400'
                        } animate-pulse`}
                      />
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  navigate(`/season/${standingsSeason}`);
                }}
                className="text-xs font-bold uppercase tracking-wider text-f1red hover:underline flex items-center gap-1 shrink-0"
              >
                <span>{lang === 'vi' ? 'Xem đầy đủ BXH' : 'View Full Standings'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top 3 Drivers */}
            <Card3DTilt
              maxTilt={3}
              glareOpacity={0.12}
              className="bg-white rounded-xl border border-studio-200 shadow-subtle p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-studio-100">
                <h3 className="font-display text-base font-bold uppercase tracking-wider text-studio-900 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />{' '}
                  {lang === 'vi' ? 'Bảng Điểm Tay Đua (Top 3)' : 'Drivers Championship (Top 3)'}
                </h3>
                <span className="text-xs font-semibold text-studio-500">
                  {lang === 'vi' ? `Mùa giải ${standingsSeason}` : `${standingsSeason} Season`}
                </span>
              </div>

              <div key={`drivers-${standingsSeason}`} className="space-y-3 animate-fade-in">
                {topDrivers.map((driver, idx) => {
                  const driverColor = getTeamTextColor(driver.teamId, false);
                  return (
                    <div
                      key={driver.driverId}
                      style={{
                        transitionDelay: `${idx * 80}ms`,
                        opacity: standingsRevealed ? 1 : 0,
                        transform: standingsRevealed ? 'translateY(0)' : 'translateY(16px)',
                        transitionProperty: 'opacity, transform',
                        transitionDuration: '500ms',
                      }}
                    >
                      <AnimatedStandingsRow
                        rank={driver.rank}
                        name={driver.driverName}
                        subName={driver.teamName}
                        flag={driver.countryFlag}
                        teamId={driver.teamId}
                        teamColor={driverColor}
                        points={driver.points}
                        wins={driver.wins}
                        podiums={driver.podiums}
                        inView={standingsRevealed}
                        lang={lang}
                        onClick={() =>
                          navigate(`/drivers/${driver.driverId}?season=${standingsSeason}`)
                        }
                        actionButton={
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/drivers/${driver.driverId}?season=${standingsSeason}`);
                            }}
                            className="p-1.5 rounded-lg bg-studio-100 hover:bg-studio-950 text-studio-600 hover:text-white border border-studio-200 text-[10px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
                            title={lang === 'vi' ? 'Xem hồ sơ tay đua' : 'View Driver Profile'}
                          >
                            <ArrowRight className="w-3.5 h-3.5 text-f1red" />
                          </button>
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </Card3DTilt>

            {/* Top 3 Constructors */}
            <Card3DTilt
              maxTilt={3}
              glareOpacity={0.12}
              className="bg-white rounded-xl border border-studio-200 shadow-subtle p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-studio-100">
                <h3 className="font-display text-base font-bold uppercase tracking-wider text-studio-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-f1red" />{' '}
                  {lang === 'vi'
                    ? 'Bảng Điểm Đội Đua (Top 3)'
                    : 'Constructors Championship (Top 3)'}
                </h3>
                <span className="text-xs font-semibold text-studio-500">
                  {lang === 'vi' ? `Mùa giải ${standingsSeason}` : `${standingsSeason} Season`}
                </span>
              </div>

              <div key={`constructors-${standingsSeason}`} className="space-y-3 animate-fade-in">
                {topConstructors.map((c, idx) => {
                  const teamColor = getTeamTextColor(c.teamId, false);
                  return (
                    <div
                      key={c.teamId}
                      style={{
                        transitionDelay: `${idx * 80}ms`,
                        opacity: standingsRevealed ? 1 : 0,
                        transform: standingsRevealed ? 'translateY(0)' : 'translateY(16px)',
                        transitionProperty: 'opacity, transform',
                        transitionDuration: '500ms',
                      }}
                    >
                      <AnimatedStandingsRow
                        rank={c.rank}
                        name={c.teamName}
                        teamId={c.teamId}
                        teamColor={teamColor}
                        points={c.points}
                        wins={c.wins}
                        podiums={c.podiums}
                        inView={standingsRevealed}
                        lang={lang}
                        onClick={() => navigate(`/teams/${c.teamId}`)}
                        actionButton={
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/showroom?team=${c.teamId}`);
                            }}
                            className="p-1.5 rounded-lg bg-studio-100 hover:bg-studio-950 text-studio-600 hover:text-white border border-studio-200 text-[10px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
                            title={
                              lang === 'vi' ? 'Xem xe trong Showroom 3D' : 'View in 3D Showroom'
                            }
                          >
                            <Box className="w-3.5 h-3.5 text-f1red" />
                            <span className="hidden sm:inline">3D</span>
                          </button>
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </Card3DTilt>
          </div>
        </section>

        <section className="page-container pb-16 md:pb-24">
          <div className="relative overflow-hidden rounded-3xl border border-studio-800 bg-[#090c13] p-7 text-white shadow-2xl sm:p-10 lg:p-14">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(82,229,255,0.15),transparent_35%)]" />
            <div className="relative max-w-3xl">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200">
                Engineering Insights · EDS-G01
              </p>
              <h2 className="mt-4 font-display text-3xl font-black uppercase leading-tight sm:text-5xl">
                {lang === 'vi'
                  ? 'Hiểu chiếc xe từ nguyên lý kỹ thuật'
                  : 'Understand the car from engineering principles'}
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/65 sm:text-base">
                {lang === 'vi'
                  ? 'Đọc bốn chuyên đề song ngữ về hiệu ứng mặt đất, khí động chủ động, hệ hybrid và động lực học xe — minh họa bằng tài sản EDS-G01 nguyên bản.'
                  : 'Read four bilingual features on ground effect, active aerodynamics, hybrid systems and vehicle dynamics, illustrated with original EDS-G01 assets.'}
              </p>
              <button
                type="button"
                onClick={() => navigate('/engineering')}
                className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-cyan-300 px-5 text-xs font-black uppercase tracking-widest text-studio-950 hover:bg-white"
              >
                {lang === 'vi' ? 'Mở Engineering Insights' : 'Open Engineering Insights'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
