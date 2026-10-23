import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Radio, Play, Pause } from 'lucide-react';
import { CALENDAR_2026, getStandings } from '../../data/championship';
import { useChampionshipStore } from '../../store/useChampionshipStore';
import { useNavigationStore } from '../../store/useNavigationStore';
import { getCalendarRaceState } from '../../utils/raceSchedule';
import { isPrimaryPath, useMobileHub } from '../../hooks/useMobileHub';

export function F1NewsTicker() {
  const lang = useNavigationStore((state) => state.lang);
  const calculatedStandings = useChampionshipStore((state) => state.calculatedStandings);
  const setActiveSubTab = useChampionshipStore((state) => state.setActiveSubTab);
  const detailedResults = useChampionshipStore((state) => state.detailedResults[2026]);
  const mobile = useMobileHub();
  const location = useLocation();
  const navigate = useNavigate();
  const [playing, setPlaying] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, []);
  const nextRace =
    CALENDAR_2026.find((race) => getCalendarRaceState(race, now) === 'current') ??
    CALENDAR_2026.find((race) => getCalendarRaceState(race, now) === 'upcoming');
  const latestResult = [...(detailedResults ?? [])]
    .filter((race) => race.status === 'completed')
    .sort((a, b) => b.round - a.round)[0];
  const leader = (calculatedStandings[2026]?.drivers ?? getStandings(2026).drivers)[0];
  const items = [
    {
      badge: lang === 'vi' ? 'LỊCH ĐUA' : 'CALENDAR',
      text: nextRace
        ? `${lang === 'vi' ? 'Chặng' : 'Round'} ${nextRace.round} · ${nextRace.name} · ${nextRace.dates}`
        : lang === 'vi'
          ? 'Chưa có chặng đua sắp tới trong lịch hiện có'
          : 'No upcoming race in the available calendar',
      tab: 'calendar' as const,
    },
    {
      badge: lang === 'vi' ? 'KẾT QUẢ' : 'RESULTS',
      text: latestResult
        ? `${lang === 'vi' ? 'Chặng' : 'Round'} ${latestResult.round} · ${latestResult.grandPrix}`
        : lang === 'vi'
          ? 'Chưa có kết quả hoàn tất trong dữ liệu hiện có'
          : 'No completed result in the available data',
      tab: 'results' as const,
    },
    {
      badge: lang === 'vi' ? 'XẾP HẠNG' : 'STANDINGS',
      text: leader
        ? `${leader.driverName} · ${leader.points} ${lang === 'vi' ? 'điểm' : 'pts'}`
        : lang === 'vi'
          ? 'Chưa có bảng xếp hạng'
          : 'Standings unavailable',
      tab: 'standings' as const,
    },
  ];

  const open = (tab: 'calendar' | 'results' | 'standings') => {
    setActiveSubTab(tab);
    if (mobile && isPrimaryPath(location.pathname)) {
      navigate(`${location.pathname}${location.search}#giai-dau`);
      document.getElementById('giai-dau')?.scrollIntoView({
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      });
    } else navigate(`/season/2026?tab=${tab}`);
  };

  return (
    <div className="relative z-20 flex h-10 w-full items-center overflow-hidden border-y border-white/10 bg-[#08080b] text-white">
      <div className="z-10 flex h-full shrink-0 items-center gap-2 bg-f1red px-3 text-[11px] font-black tracking-widest">
        <Radio className="h-3.5 w-3.5" aria-hidden="true" />
        <span>EDS FEED</span>
        <button
          type="button"
          onClick={() => setPlaying((value) => !value)}
          aria-pressed={!playing}
          className="rounded p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white motion-reduce:hidden"
          aria-label={
            playing
              ? lang === 'vi'
                ? 'Tạm dừng dòng tin'
                : 'Pause ticker'
              : lang === 'vi'
                ? 'Tiếp tục dòng tin'
                : 'Resume ticker'
          }
        >
          {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
        </button>
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div
          className="flex w-max animate-ticker-marquee items-center motion-reduce:animate-none hover:[animation-play-state:paused]"
          data-paused={!playing}
        >
          {[...items, ...items, ...items, ...items].map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => open(item.tab)}
              className="flex shrink-0 items-center px-3 text-left text-[11px] font-semibold tracking-wide text-white/75 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-f1red"
            >
              <span className="mr-2 rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
                {item.badge}
              </span>
              {item.text}
              <span aria-hidden="true" className="px-4 font-black text-f1red">
                ///
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
