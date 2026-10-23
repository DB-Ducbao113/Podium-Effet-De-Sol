import React, { useMemo, useState } from 'react';
import { getRaceResults, STANDINGS_DATA } from '../../data/championship';
import { useChampionshipStore } from '../../store/useChampionshipStore';
import { useNavigationStore } from '../../store/useNavigationStore';
import { getCompleteRaceClassification } from '../../data/championship/raceClassificationHelper';
import { RaceClassificationModal } from './RaceClassificationModal';
import { formatDateStr } from '../../utils/dateUtils';
import { getTeamTextColor } from '../../utils/teamColors';
import {
  Trophy,
  Zap,
  ChevronRight,
  Search,
  LayoutGrid,
  Table as TableIcon,
  X,
  MapPin,
  Flag,
  CheckCircle2,
} from 'lucide-react';
import { RaceResult, SeasonYear } from '../../types';
import { Card3DTilt } from '../common/Card3DTilt';

interface RaceResultsProps {
  season: SeasonYear;
}

export const RaceResults: React.FC<RaceResultsProps> = React.memo(({ season }) => {
  const { lang } = useNavigationStore();
  const { detailedResults, selectedRaceRound, setSelectedRaceRound } = useChampionshipStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const allRaces = useMemo(() => {
    const detailedRaces = detailedResults[season] || [];
    const fallbackResults = getRaceResults(season);
    const fallbackRounds = new Set(fallbackResults.map((race) => race.round));

    const syncedSummaries: RaceResult[] = detailedRaces.flatMap((race) => {
      if (fallbackRounds.has(race.round)) return [];
      const p1 = race.entries.find((entry) => entry.position === 1);
      const p2 = race.entries.find((entry) => entry.position === 2);
      const p3 = race.entries.find((entry) => entry.position === 3);
      if (!p1 || !p2 || !p3) return [];
      const fastestLap = race.fastestLap;
      return [
        {
          round: race.round,
          grandPrix: race.grandPrix,
          circuit: race.circuit,
          season: race.season,
          date: race.date,
          podium: {
            p1: { driver: p1.driverName, team: p1.teamName, time: p1.timeOrGap, points: p1.points },
            p2: { driver: p2.driverName, team: p2.teamName, gap: p2.timeOrGap, points: p2.points },
            p3: { driver: p3.driverName, team: p3.teamName, gap: p3.timeOrGap, points: p3.points },
          },
          ...(fastestLap ? { fastestLap } : {}),
        },
      ];
    });

    return [...fallbackResults, ...syncedSummaries].sort((a, b) => a.round - b.round);
  }, [detailedResults, season]);

  // All constructors competing in this season
  const gridTeams = useMemo(() => {
    return STANDINGS_DATA[season]?.constructors || [];
  }, [season]);

  const teamMatchesRace = (filterName: string, race: RaceResult): boolean => {
    const q = filterName.toLowerCase();
    const podiumTeams = [
      race.podium.p1.team.toLowerCase(),
      race.podium.p2.team.toLowerCase(),
      race.podium.p3.team.toLowerCase(),
    ];

    return podiumTeams.some((pt) => {
      if (pt.includes(q)) return true;
      if (q.includes('red bull') && pt.includes('red bull')) return true;
      if (q === 'redbull' && pt.includes('red bull')) return true;
      if (
        (q.includes('audi') || q.includes('sauber')) &&
        (pt.includes('audi') || pt.includes('sauber'))
      )
        return true;
      if (
        (q.includes('racing bulls') || q.includes('rb')) &&
        (pt.includes('racing bulls') || pt.includes('rb'))
      )
        return true;
      if (q.includes('aston') && pt.includes('aston')) return true;
      if (q.includes('mercedes') && pt.includes('mercedes')) return true;
      if (q.includes('ferrari') && pt.includes('ferrari')) return true;
      if (q.includes('mclaren') && pt.includes('mclaren')) return true;
      if (q.includes('williams') && pt.includes('williams')) return true;
      if (q.includes('haas') && pt.includes('haas')) return true;
      if (q.includes('alpine') && pt.includes('alpine')) return true;
      if (q.includes('cadillac') && pt.includes('cadillac')) return true;
      return false;
    });
  };

  const filteredResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allRaces.filter((race) => {
      const matchesSearch =
        !q ||
        race.grandPrix.toLowerCase().includes(q) ||
        race.circuit.toLowerCase().includes(q) ||
        race.podium.p1.driver.toLowerCase().includes(q) ||
        race.podium.p2.driver.toLowerCase().includes(q) ||
        race.podium.p3.driver.toLowerCase().includes(q) ||
        race.podium.p1.team.toLowerCase().includes(q) ||
        race.podium.p2.team.toLowerCase().includes(q) ||
        race.podium.p3.team.toLowerCase().includes(q);

      const matchesTeam = selectedTeamFilter === 'all' || teamMatchesRace(selectedTeamFilter, race);

      return matchesSearch && matchesTeam;
    });
  }, [allRaces, searchQuery, selectedTeamFilter]);

  // Selected race detailed classification modal
  const activeClassification = useMemo(() => {
    if (!selectedRaceRound) return null;
    return getCompleteRaceClassification(season, selectedRaceRound, detailedResults[season]);
  }, [season, selectedRaceRound, detailedResults]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header Bar */}
      <div className="p-5 bg-white rounded-2xl border border-studio-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-display text-xl font-bold uppercase tracking-wider text-studio-950">
              {lang === 'vi'
                ? `Kết Quả Các Chặng Đua (${season})`
                : `Grand Prix Results (${season})`}
            </h3>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {lang === 'vi'
                ? `${allRaces.length} chặng hoàn thành`
                : `${allRaces.length} completed rounds`}
            </span>
          </div>
          <p className="text-xs text-studio-500 font-medium">
            {lang === 'vi'
              ? 'Chi tiết bảng xếp hạng, tay đua về nhất, bục vinh quang và vòng chạy nhanh nhất cho từng chặng.'
              : 'Official race results, podium finishes, and fastest laps for each Grand Prix of the championship.'}
          </p>
        </div>

        {/* View Switcher: Grid vs Table */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="flex items-center bg-studio-100 p-1 rounded-xl border border-studio-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-f1red shadow-xs'
                  : 'text-studio-600 hover:text-studio-950'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{lang === 'vi' ? 'Thẻ' : 'Grid'}</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-f1red shadow-xs'
                  : 'text-studio-600 hover:text-studio-950'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>{lang === 'vi' ? 'Bảng' : 'Table'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3.5 bg-white p-4 rounded-2xl border border-studio-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-studio-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                lang === 'vi'
                  ? 'Tìm chặng đua, trường đua hoặc tay đua...'
                  : 'Search Grand Prix, circuit or driver...'
              }
              className="w-full pl-9 pr-8 py-2 text-xs font-medium bg-studio-50 border border-studio-200 rounded-xl focus:outline-none focus:border-f1red focus:bg-white transition-all text-studio-900 placeholder:text-studio-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-studio-400 hover:text-studio-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-xs text-studio-500 font-medium">
            {lang === 'vi' ? (
              <>
                Hiển thị <strong>{filteredResults.length}</strong> / {allRaces.length} chặng
              </>
            ) : (
              <>
                Showing <strong>{filteredResults.length}</strong> of {allRaces.length} rounds
              </>
            )}
          </div>
        </div>

        {/* Team Filter Pills (All Grid Constructors) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setSelectedTeamFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedTeamFilter === 'all'
                ? 'bg-studio-950 text-white shadow-xs'
                : 'bg-studio-100 text-studio-600 hover:bg-studio-200 hover:text-studio-950'
            }`}
          >
            {lang === 'vi' ? 'Tất cả đội' : 'All teams'}
          </button>
          {gridTeams.map((team) => {
            const isSelected = selectedTeamFilter === team.teamName;
            return (
              <button
                key={team.teamId}
                onClick={() => setSelectedTeamFilter(isSelected ? 'all' : team.teamName)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-f1red text-white shadow-xs'
                    : 'bg-studio-100 text-studio-600 hover:bg-studio-200 hover:text-studio-950'
                }`}
              >
                <span>{team.teamName}</span>
                {team.podiums > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-studio-200/80 text-studio-700'
                    }`}
                  >
                    {team.podiums}P
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Zero State if filter has no match */}
      {filteredResults.length === 0 && (
        <div className="p-12 text-center bg-white rounded-2xl border border-studio-200">
          <Flag className="w-8 h-8 text-studio-300 mx-auto mb-2" />
          <p className="font-bold text-studio-700 text-sm">
            {lang === 'vi'
              ? `Không tìm thấy chặng đua phù hợp với "${selectedTeamFilter !== 'all' ? selectedTeamFilter : searchQuery}"`
              : 'No matching Grand Prix found'}
          </p>
          {selectedTeamFilter !== 'all' && (
            <p className="text-xs text-studio-500 mt-1 max-w-md mx-auto">
              {lang === 'vi'
                ? `Đội ${selectedTeamFilter} chưa có chặng nào kết thúc trên bục Podium trong mùa giải ${season}. Hãy bấm vào "Xem kết quả chi tiết" ở các chặng để xem thứ hạng hoàn thành của đội.`
                : `Team ${selectedTeamFilter} has not achieved podium finishes in season ${season}.`}
            </p>
          )}
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedTeamFilter('all');
            }}
            className="mt-4 px-4 py-1.5 rounded-lg bg-studio-100 hover:bg-studio-200 text-xs font-bold text-studio-800 transition cursor-pointer"
          >
            {lang === 'vi' ? 'Đặt lại bộ lọc' : 'Reset filters'}
          </button>
        </div>
      )}

      {/* Grid Mode */}
      {viewMode === 'grid' && filteredResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredResults.map((res) => (
            <Card3DTilt
              key={res.round}
              maxTilt={3}
              glareOpacity={0.12}
              className="bg-white rounded-2xl border border-studio-200 shadow-subtle p-5 sm:p-6 space-y-4 hover:border-studio-300 hover:shadow-md transition-all flex flex-col h-full"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between pb-3 border-b border-studio-100 gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[11px] font-mono font-black uppercase tracking-wider text-f1red bg-f1red/10 px-2 py-0.5 rounded-md">
                      ROUND {res.round < 10 ? `0${res.round}` : res.round}
                    </span>
                    <span className="text-xs font-bold text-studio-400">·</span>
                    <span className="text-xs font-medium text-studio-500">
                      {formatDateStr(res.date, lang)}
                    </span>
                  </div>
                  <h4 className="font-display text-lg sm:text-xl font-black text-studio-950 truncate">
                    {res.grandPrix}
                  </h4>
                  <p className="text-xs text-studio-500 font-medium truncate flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-studio-400 shrink-0" />
                    <span>{res.circuit}</span>
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                  <Trophy className="w-5 h-5 text-amber-500" />
                </div>
              </div>

              {/* Podium Finishers */}
              <div className="space-y-2">
                {/* 1st Place */}
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-amber-400 text-black font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                      1
                    </span>
                    <div className="min-w-0">
                      <span
                        className="font-black text-sm block truncate"
                        style={{
                          color: getTeamTextColor(
                            res.podium.p1.team || res.podium.p1.driver,
                            false,
                          ),
                        }}
                      >
                        {res.podium.p1.driver}
                      </span>
                      <span
                        className="text-[11px] font-bold block truncate"
                        style={{
                          color: getTeamTextColor(
                            res.podium.p1.team || res.podium.p1.driver,
                            false,
                          ),
                        }}
                      >
                        {res.podium.p1.team}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="text-xs font-mono font-bold text-studio-900 block">
                      {res.podium.p1.time}
                    </span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-200/60 px-1.5 py-0.5 rounded">
                      +{res.podium.p1.points} PTS
                    </span>
                  </div>
                </div>

                {/* 2nd Place */}
                <div className="p-2.5 rounded-xl bg-studio-50/80 border border-studio-200 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-studio-300 text-studio-900 font-black text-[11px] flex items-center justify-center shrink-0">
                      2
                    </span>
                    <div className="min-w-0">
                      <span
                        className="font-bold text-xs block truncate"
                        style={{
                          color: getTeamTextColor(
                            res.podium.p2.team || res.podium.p2.driver,
                            false,
                          ),
                        }}
                      >
                        {res.podium.p2.driver}
                      </span>
                      <span
                        className="text-[10px] font-bold block truncate"
                        style={{
                          color: getTeamTextColor(
                            res.podium.p2.team || res.podium.p2.driver,
                            false,
                          ),
                        }}
                      >
                        {res.podium.p2.team}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="text-xs font-mono text-studio-700 block">
                      {res.podium.p2.gap}
                    </span>
                    <span className="text-[10px] font-bold text-studio-700">
                      +{res.podium.p2.points} PTS
                    </span>
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="p-2.5 rounded-xl bg-studio-50/80 border border-studio-200 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-amber-700 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                      3
                    </span>
                    <div className="min-w-0">
                      <span
                        className="font-bold text-xs block truncate"
                        style={{
                          color: getTeamTextColor(
                            res.podium.p3.team || res.podium.p3.driver,
                            false,
                          ),
                        }}
                      >
                        {res.podium.p3.driver}
                      </span>
                      <span
                        className="text-[10px] font-bold block truncate"
                        style={{
                          color: getTeamTextColor(
                            res.podium.p3.team || res.podium.p3.driver,
                            false,
                          ),
                        }}
                      >
                        {res.podium.p3.team}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="text-xs font-mono text-studio-700 block">
                      {res.podium.p3.gap}
                    </span>
                    <span className="text-[10px] font-bold text-studio-700">
                      +{res.podium.p3.points} PTS
                    </span>
                  </div>
                </div>
              </div>

              {/* Fastest Lap Banner */}
              {res.fastestLap && (
                <div className="pt-2 border-t border-studio-100 flex items-center justify-between text-xs text-studio-600">
                  <span className="flex items-center gap-1.5 font-medium min-w-0 truncate">
                    <Zap className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span>{lang === 'vi' ? 'Vòng nhanh nhất:' : 'Fastest Lap:'}</span>
                    <strong
                      className="truncate font-black"
                      style={{
                        color: getTeamTextColor(
                          res.fastestLap.team || res.fastestLap.driver,
                          false,
                        ),
                      }}
                    >
                      {res.fastestLap.driver}
                    </strong>
                  </span>
                  <span className="font-mono font-bold text-purple-700 shrink-0 ml-2">
                    {res.fastestLap.time}
                  </span>
                </div>
              )}

              {/* Classification Action */}
              <button
                onClick={() => setSelectedRaceRound(res.round)}
                className="w-full mt-auto py-2.5 px-4 rounded-xl bg-studio-950 hover:bg-f1red text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.99]"
              >
                <span>{lang === 'vi' ? 'Xem kết quả chi tiết' : 'View full classification'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </Card3DTilt>
          ))}
        </div>
      )}

      {/* Table Mode */}
      {viewMode === 'table' && filteredResults.length > 0 && (
        <div className="bg-white rounded-2xl border border-studio-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-studio-50 border-b border-studio-200 text-studio-600 uppercase tracking-wider text-[11px] font-black">
                  <th className="py-3.5 px-4 text-center w-14">Round</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Grand Prix / Circuit</th>
                  <th className="py-3.5 px-4 min-w-[100px]">Ngày</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Về Nhất (P1)</th>
                  <th className="py-3.5 px-4 min-w-[150px]">Hạng 2 (P2)</th>
                  <th className="py-3.5 px-4 min-w-[150px]">Hạng 3 (P3)</th>
                  <th className="py-3.5 px-4 min-w-[140px]">Fastest Lap</th>
                  <th className="py-3.5 px-4 text-right w-24">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-studio-100 font-medium">
                {filteredResults.map((res) => (
                  <tr
                    key={res.round}
                    className="hover:bg-studio-50/80 transition-colors cursor-pointer"
                    onClick={() => setSelectedRaceRound(res.round)}
                  >
                    {/* Round */}
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-f1red">
                      R{res.round < 10 ? `0${res.round}` : res.round}
                    </td>

                    {/* Grand Prix & Circuit */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-studio-950 block text-sm">
                        {res.grandPrix}
                      </span>
                      <span className="text-[11px] text-studio-500">{res.circuit}</span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 font-mono text-studio-600 text-[11px]">
                      {formatDateStr(res.date, lang)}
                    </td>

                    {/* P1 Winner */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-400 text-black font-black text-[10px] flex items-center justify-center shrink-0">
                          1
                        </span>
                        <div>
                          <span
                            className="font-extrabold block"
                            style={{
                              color: getTeamTextColor(
                                res.podium.p1.team || res.podium.p1.driver,
                                false,
                              ),
                            }}
                          >
                            {res.podium.p1.driver}
                          </span>
                          <span className="text-[10px] font-mono">
                            <span
                              className="font-bold"
                              style={{
                                color: getTeamTextColor(
                                  res.podium.p1.team || res.podium.p1.driver,
                                  false,
                                ),
                              }}
                            >
                              {res.podium.p1.team}
                            </span>
                            <span className="text-studio-500"> · {res.podium.p1.time}</span>
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* P2 */}
                    <td className="py-3.5 px-4">
                      <span
                        className="font-extrabold block"
                        style={{
                          color: getTeamTextColor(
                            res.podium.p2.team || res.podium.p2.driver,
                            false,
                          ),
                        }}
                      >
                        {res.podium.p2.driver}
                      </span>
                      <span className="text-[10px] font-mono">
                        <span
                          className="font-bold"
                          style={{
                            color: getTeamTextColor(
                              res.podium.p2.team || res.podium.p2.driver,
                              false,
                            ),
                          }}
                        >
                          {res.podium.p2.team}
                        </span>
                        <span className="text-studio-500"> ({res.podium.p2.gap})</span>
                      </span>
                    </td>

                    {/* P3 */}
                    <td className="py-3.5 px-4">
                      <span
                        className="font-extrabold block"
                        style={{
                          color: getTeamTextColor(
                            res.podium.p3.team || res.podium.p3.driver,
                            false,
                          ),
                        }}
                      >
                        {res.podium.p3.driver}
                      </span>
                      <span className="text-[10px] font-mono">
                        <span
                          className="font-bold"
                          style={{
                            color: getTeamTextColor(
                              res.podium.p3.team || res.podium.p3.driver,
                              false,
                            ),
                          }}
                        >
                          {res.podium.p3.team}
                        </span>
                        <span className="text-studio-500"> ({res.podium.p3.gap})</span>
                      </span>
                    </td>

                    {/* Fastest Lap */}
                    <td className="py-3.5 px-4">
                      {res.fastestLap ? (
                        <div className="flex items-center gap-1.5">
                          <Zap className="w-3 h-3 text-purple-600 shrink-0" />
                          <div>
                            <span
                              className="font-extrabold block"
                              style={{
                                color: getTeamTextColor(
                                  res.fastestLap.team || res.fastestLap.driver,
                                  false,
                                ),
                              }}
                            >
                              {res.fastestLap.driver}
                            </span>
                            <span className="font-mono text-[10px] text-purple-700">
                              {res.fastestLap.time}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-studio-400 font-mono">-</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRaceRound(res.round);
                        }}
                        className="p-2 rounded-lg bg-studio-100 hover:bg-f1red hover:text-white text-studio-700 transition cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Render Official Classification Modal when a round is chosen */}
      {activeClassification && (
        <RaceClassificationModal
          race={activeClassification}
          onClose={() => setSelectedRaceRound(null)}
        />
      )}
    </div>
  );
});
