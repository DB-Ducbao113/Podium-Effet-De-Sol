import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Search, Trophy, Users, Box } from 'lucide-react';
import { TEAMS_DATA } from '../../data/teams';
import { STANDINGS_DATA } from '../../data/championship';
import { getTeamSeasonProfile } from '../../data/teamSeasons';
import { SeasonYear, TeamId } from '../../types';
import { useNavigationStore } from '../../store/useNavigationStore';
import { ConstructorLogo } from '../common/ConstructorLogo';
import { getTeamTextColor } from '../../utils/teamColors';

const SEASONS: SeasonYear[] = [2026, 2025, 2024];

interface TeamsDirectoryPageProps {
  initialSeason?: SeasonYear;
  hideHeader?: boolean;
}

export const TeamsDirectoryPage: React.FC<TeamsDirectoryPageProps> = React.memo(
  ({ initialSeason = 2026, hideHeader = false }) => {
    const lang = useNavigationStore((state) => state.lang);
    const [prevInitialSeason, setPrevInitialSeason] = useState(initialSeason);
    const [season, setSeason] = useState<SeasonYear>(initialSeason);
    if (prevInitialSeason !== initialSeason) {
      setPrevInitialSeason(initialSeason);
      setSeason(initialSeason);
    }
    const [query, setQuery] = useState('');
    const standings = STANDINGS_DATA[season].constructors;
    const teams = useMemo(() => {
      const normalized = query.trim().toLowerCase();
      return (Object.values(TEAMS_DATA) as (typeof TEAMS_DATA)[TeamId][])
        .filter((team) => Boolean(getTeamSeasonProfile(team.id, season)))
        .filter((team) => {
          if (!normalized) return true;
          const profile = getTeamSeasonProfile(team.id, season)!;
          return [
            team.name,
            profile.fullName,
            profile.base,
            profile.teamLead,
            profile.powerUnit,
          ].some((value) => value.toLowerCase().includes(normalized));
        })
        .sort((a, b) => {
          const rankA = standings.find((row) => row.teamId === a.id)?.rank ?? 99;
          const rankB = standings.find((row) => row.teamId === b.id)?.rank ?? 99;
          return rankA - rankB || a.name.localeCompare(b.name);
        });
    }, [query, standings, season]);

    return (
      <div className={hideHeader ? 'space-y-6' : 'min-h-[70vh] bg-studio-100 py-10 sm:py-16'}>
        <div className={hideHeader ? 'space-y-6' : 'page-container space-y-8'}>
          {!hideHeader && (
            <header className="max-w-3xl space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-f1red">
                F1 Grid Directory
              </span>
              <h1 className="font-display text-4xl font-black uppercase tracking-tight text-studio-950 sm:text-5xl">
                {lang === 'vi' ? 'Các đội đua' : 'The teams'}
              </h1>
              <p className="text-sm leading-relaxed text-studio-600">
                {lang === 'vi'
                  ? 'Tìm kiếm đội đua theo tên, trụ sở, team principal hoặc đơn vị động lực; xem thứ hạng theo mùa giải.'
                  : 'Search constructors by name, base, team principal, or power unit, then compare their season standings.'}
              </p>
              <p className="text-[11px] leading-relaxed text-studio-500">
                {lang === 'vi'
                  ? 'Tên đăng ký, cơ sở, người phụ trách, đơn vị động lực, roster và thứ hạng đều theo mùa đã chọn.'
                  : 'Entry name, base, leadership, power unit, line-up, and standings follow the selected season.'}
              </p>
            </header>
          )}

          <div className="flex flex-col gap-3 rounded-2xl border border-studio-200 bg-white p-4 shadow-subtle sm:flex-row">
            <label className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-studio-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={
                  lang === 'vi' ? 'Tìm đội đua, trụ sở, động cơ…' : 'Search team, base, power unit…'
                }
                className="w-full rounded-xl border border-studio-200 bg-studio-50 py-3 pl-10 pr-3 text-sm outline-none focus:border-f1red"
              />
            </label>
            {!hideHeader && (
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-studio-500">
                {lang === 'vi' ? 'Mùa giải' : 'Season'}
                <select
                  value={season}
                  onChange={(event) => setSeason(Number(event.target.value) as SeasonYear)}
                  className="rounded-xl border border-studio-200 bg-studio-50 px-3 py-3 text-sm font-bold text-studio-900 outline-none focus:border-f1red"
                >
                  {SEASONS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-studio-500">
            <span>
              {lang === 'vi' ? `Tìm thấy ${teams.length} đội` : `${teams.length} teams found`}
            </span>
            <Link
              to={hideHeader ? `/season/${season}?tab=drivers` : '/drivers'}
              className="inline-flex items-center gap-1 font-bold text-f1red hover:underline"
            >
              {lang === 'vi' ? 'Danh sách tay đua' : 'Driver directory'}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {teams.length ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {teams.map((team) => {
                const profile = getTeamSeasonProfile(team.id, season)!;
                const result = standings.find((row) => row.teamId === team.id);
                const roster = STANDINGS_DATA[season].drivers.filter(
                  (driver) => driver.teamId === team.id,
                );
                const teamColor = getTeamTextColor(team.id, false);
                return (
                  <article
                    key={team.id}
                    className="overflow-hidden rounded-2xl border bg-white shadow-subtle transition hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between"
                    style={{ borderColor: `${teamColor}40` }}
                  >
                    <div>
                      <div className="h-2" style={{ backgroundColor: teamColor }} />

                      {/* Team Car Showcase Banner */}
                      {team.imageUrl && (
                        <div className="relative aspect-[16/7] overflow-hidden bg-studio-950">
                          <img
                            src={team.imageUrl}
                            alt={`Podium EDS-G01 independent engineering study for ${profile.fullName}`}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover object-center transition-transform duration-500 hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                          <div className="absolute bottom-2 left-4 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-black uppercase text-white border border-white/10">
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: teamColor }}
                            />
                            <span>
                              {team.name} · {season}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="space-y-5 p-5 sm:p-6">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <ConstructorLogo teamId={team.id} size="md" />
                            <div className="min-w-0">
                              <p className="text-[10px] font-black uppercase tracking-widest text-studio-400">
                                {team.name}
                              </p>
                              <h2 className="mt-0.5 font-display text-lg sm:text-xl font-black uppercase text-studio-950 truncate">
                                {profile.fullName}
                              </h2>
                            </div>
                          </div>
                          {result && (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-studio-100 px-2.5 py-1 text-[11px] font-black text-studio-700">
                              <Trophy className="h-3 w-3 text-amber-500" />P{result.rank}
                            </span>
                          )}
                        </div>
                        <div className="space-y-2 text-xs text-studio-600">
                          <p className="flex items-start gap-2">
                            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-f1red" />
                            {profile.base}
                          </p>
                          <p className="pl-5 text-[11px] text-studio-500">
                            {profile.teamLeadTitle}: {profile.teamLead} · {profile.powerUnit}
                          </p>
                          <p className="flex items-start gap-2">
                            <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-f1red" />
                            {roster.length
                              ? roster.map((driver) => driver.driverName).join(' · ')
                              : lang === 'vi'
                                ? 'Chưa có roster trong dữ liệu mùa này'
                                : 'No season roster in the available data'}
                          </p>
                        </div>
                        {result && (
                          <p className="border-t border-studio-100 pt-3 text-xs font-bold text-studio-500">
                            {result.points} PTS <span className="mx-1 text-studio-300">·</span>{' '}
                            {result.wins} {lang === 'vi' ? 'chiến thắng' : 'wins'}{' '}
                            <span className="mx-1 text-studio-300">·</span> {season}
                          </p>
                        )}
                        <div className="flex items-center justify-between pt-3 border-t border-studio-100">
                          <Link
                            to={`/teams/${team.id}?season=${season}`}
                            className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-studio-700 hover:text-f1red transition-colors"
                          >
                            <span>{lang === 'vi' ? 'Hồ sơ đội' : 'Team profile'}</span>
                            <ArrowRight className="h-3.5 w-3.5 text-f1red" />
                          </Link>
                          <Link
                            to={`/showroom?team=${team.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-studio-950 hover:bg-f1red text-white text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm hover:scale-105 active:scale-95"
                            title={
                              lang === 'vi'
                                ? 'Xem cỗ máy F1 trong Showroom 3D'
                                : 'Inspect 3D machine in Showroom'
                            }
                          >
                            <Box className="w-3.5 h-3.5 text-f1red" />
                            <span>{lang === 'vi' ? 'Xem Xe 3D' : '3D Showroom'}</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState lang={lang} />
          )}
        </div>
      </div>
    );
  },
);

const EmptyState: React.FC<{ lang: 'vi' | 'en' }> = ({ lang }) => (
  <div className="rounded-2xl border border-dashed border-studio-300 bg-white p-12 text-center text-sm text-studio-500">
    {lang === 'vi' ? 'Không tìm thấy đội đua phù hợp.' : 'No matching teams found.'}
  </div>
);
