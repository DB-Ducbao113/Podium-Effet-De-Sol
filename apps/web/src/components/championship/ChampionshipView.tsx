import React, { useEffect, useState } from 'react';
import { useChampionshipStore } from '../../store/useChampionshipStore';
import { useNavigationStore } from '../../store/useNavigationStore';
import { SeasonYear } from '../../types';
import { t } from '../../i18n/translations';
import { StandingsTable } from './StandingsTable';
import { RaceCalendar } from './RaceCalendar';
import { RaceResults } from './RaceResults';
import { TeamsDirectoryPage } from '../pages/TeamsDirectoryPage';
import { DriversDirectoryPage } from '../pages/DriversDirectoryPage';
import { Trophy, Calendar, CheckCircle2, RefreshCw, Users, UserRound } from 'lucide-react';
import { CALENDAR_2026 } from '../../data/championship';
import { getCalendarRaceState } from '../../utils/raceSchedule';
import { RaceWeekendWidget } from '../home/RaceWeekendWidget';
import { useMobileHub } from '../../hooks/useMobileHub';

interface ChampionshipViewProps {
  season: SeasonYear;
  onSeasonChange: (season: SeasonYear) => void;
}

export const ChampionshipView: React.FC<ChampionshipViewProps> = ({ season, onSeasonChange }) => {
  const { lang } = useNavigationStore();
  const { setSelectedSeason, activeSubTab, setActiveSubTab, syncMeta, syncSeasonData } =
    useChampionshipStore();

  const strings = t[lang].championship;
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const mobileHub = useMobileHub();
  const [scheduleNow, setScheduleNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setScheduleNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, []);
  const nextRace =
    season === 2026
      ? CALENDAR_2026.find((race) =>
          ['current', 'upcoming'].includes(getCalendarRaceState(race, scheduleNow)),
        )
      : undefined;

  const SEASONS: SeasonYear[] = [2026, 2025, 2024];
  useEffect(() => {
    setSelectedSeason(season);
  }, [season, setSelectedSeason]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleManualSync = async () => {
    await syncSeasonData(season);
    showToast(
      useChampionshipStore.getState().syncMeta.message ||
        (lang === 'vi' ? 'Đồng bộ hoàn tất.' : 'Sync complete.'),
    );
  };

  return (
    <div className="r1-primary r1-championship bg-studio-100 min-h-screen py-12 animate-fade-in relative">
      <div className="page-container space-y-8">
        {/* Header */}
        <div className="max-w-3xl space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-f1red block">
            {strings.badge}
          </span>
          <h1
            className={`text-3xl uppercase text-studio-950 sm:text-5xl ${
              lang === 'vi'
                ? 'font-body font-bold leading-[1.2] tracking-normal'
                : 'font-display font-black leading-[1.08] tracking-tight'
            }`}
          >
            {strings.title}
          </h1>
          <p className="text-sm sm:text-base text-studio-600 font-light leading-relaxed">
            {strings.desc}
          </p>
        </div>

        {nextRace && !mobileHub && <RaceWeekendWidget race={nextRace} />}

        {/* Top Control Bar: Season Selector & Subtabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-studio-200 shadow-xs overflow-hidden">
          {/* Subtabs (Standings, Calendar, Results, Teams, Drivers) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 sm:pb-0 custom-scrollbar max-w-full -mx-1 px-1 sm:mx-0 sm:px-0">
            <button
              data-championship-tab="standings"
              onClick={() => setActiveSubTab('standings')}
              className={`flex min-h-11 min-[861px]:min-h-0 items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
                activeSubTab === 'standings'
                  ? 'bg-f1red text-white shadow-sm'
                  : 'bg-studio-100 text-studio-700 hover:bg-studio-200'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>{strings.tabStandings}</span>
            </button>
            <button
              data-championship-tab="calendar"
              onClick={() => setActiveSubTab('calendar')}
              className={`flex min-h-11 min-[861px]:min-h-0 items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
                activeSubTab === 'calendar'
                  ? 'bg-f1red text-white shadow-sm'
                  : 'bg-studio-100 text-studio-700 hover:bg-studio-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{strings.tabCalendar}</span>
            </button>
            <button
              data-championship-tab="results"
              onClick={() => setActiveSubTab('results')}
              className={`flex min-h-11 min-[861px]:min-h-0 items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
                activeSubTab === 'results'
                  ? 'bg-f1red text-white shadow-sm'
                  : 'bg-studio-100 text-studio-700 hover:bg-studio-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{strings.tabResults}</span>
            </button>
            <button
              data-championship-tab="teams"
              onClick={() => setActiveSubTab('teams')}
              className={`flex min-h-11 min-[861px]:min-h-0 items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
                activeSubTab === 'teams'
                  ? 'bg-f1red text-white shadow-sm'
                  : 'bg-studio-100 text-studio-700 hover:bg-studio-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{strings.tabTeams}</span>
            </button>
            <button
              data-championship-tab="drivers"
              onClick={() => setActiveSubTab('drivers')}
              className={`flex min-h-11 min-[861px]:min-h-0 items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
                activeSubTab === 'drivers'
                  ? 'bg-f1red text-white shadow-sm'
                  : 'bg-studio-100 text-studio-700 hover:bg-studio-200'
              }`}
            >
              <UserRound className="w-3.5 h-3.5" />
              <span>{strings.tabDrivers}</span>
            </button>
          </div>

          {/* Season Switcher & Refresh */}
          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-studio-100">
            <button
              data-championship-refresh
              onClick={handleManualSync}
              disabled={syncMeta.syncStatus === 'syncing'}
              className="p-2 rounded-lg bg-studio-100 hover:bg-studio-200 text-studio-600 hover:text-studio-900 border border-studio-200 transition-all disabled:opacity-50 cursor-pointer min-w-11 min-h-11 min-[861px]:min-w-[36px] min-[861px]:min-h-[36px] flex items-center justify-center"
              title={lang === 'vi' ? 'Làm mới dữ liệu kết quả' : 'Refresh season data'}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${syncMeta.syncStatus === 'syncing' ? 'animate-spin text-f1red' : ''}`}
              />
            </button>

            <div className="flex items-center gap-1 bg-studio-100 p-1 rounded-lg border border-studio-200">
              {SEASONS.map((seasonOption) => (
                <button
                  key={seasonOption}
                  data-season-option={seasonOption}
                  onClick={() => onSeasonChange(seasonOption)}
                  className={`min-h-11 min-[861px]:min-h-0 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    season === seasonOption
                      ? 'bg-white text-f1red shadow-xs font-black'
                      : 'text-studio-600 hover:text-studio-950'
                  }`}
                >
                  <span>{seasonOption}</span>
                  {seasonOption === 2026 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Render based on Subtab with 3D Depth Entrance */}
        <div key={activeSubTab} className="animate-f1-depth-enter">
          {activeSubTab === 'standings' && <StandingsTable season={season} />}
          {activeSubTab === 'calendar' && <RaceCalendar season={season} />}
          {activeSubTab === 'results' && <RaceResults season={season} />}
          {activeSubTab === 'teams' && <TeamsDirectoryPage initialSeason={season} hideHeader />}
          {activeSubTab === 'drivers' && <DriversDirectoryPage initialSeason={season} hideHeader />}
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className="bg-studio-950 text-white px-5 py-3 rounded-xl shadow-2xl border border-studio-700 flex items-center gap-3 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};
