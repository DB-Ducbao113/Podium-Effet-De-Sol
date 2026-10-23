import React from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Flag, Trophy, Box, Award, Medal } from 'lucide-react';
import { DRIVERS_DATA, getDriverCareerStats } from '../../data/drivers';
import { getOriginalDriverVisualAsset } from '../../config/originalVisualAssets';
import { TEAMS_DATA } from '../../data/teams';
import { STANDINGS_DATA } from '../../data/championship';
import { useNavigationStore } from '../../store/useNavigationStore';
import { SeasonYear, TeamId } from '../../types';
import { ConstructorLogo } from '../common/ConstructorLogo';
import { getTeamTextColor } from '../../utils/teamColors';

const SEASONS: SeasonYear[] = [2026, 2025, 2024];

export const DriverDetailPage: React.FC = () => {
  const { driverId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const lang = useNavigationStore((state) => state.lang);
  const driver = driverId ? DRIVERS_DATA[driverId] : undefined;
  const career = getDriverCareerStats(driverId);
  const seasonEntries = driverId
    ? SEASONS.flatMap((season) =>
        STANDINGS_DATA[season].drivers
          .filter((entry) => entry.driverId === driverId)
          .map((entry) => ({ ...entry, season })),
      )
    : [];
  const requestedSeason = Number(searchParams.get('season')) as SeasonYear;
  const entry = seasonEntries.find((item) => item.season === requestedSeason) ?? seasonEntries[0];

  if (!driver && !entry) {
    return (
      <div className="page-container py-24 min-h-[60vh] text-center">
        <p className="text-f1red font-black text-5xl">404</p>
        <h1 className="mt-4 text-xl font-bold">
          {lang === 'vi' ? 'Không tìm thấy tay đua' : 'Driver not found'}
        </h1>
        <Link className="inline-block mt-6 text-f1red font-bold" to="/drivers">
          {lang === 'vi' ? 'Về danh sách tay đua' : 'Back to driver directory'}
        </Link>
      </div>
    );
  }

  const season = entry?.season ?? 2026;
  const careerUpToSeason = getDriverCareerStats(driverId, season);
  const teamId = entry?.teamId ?? driver?.teamId ?? 'ferrari';
  const team = TEAMS_DATA[teamId] ?? {
    id: (teamId as TeamId) || 'ferrari',
    name: entry?.teamName || 'Formula 1 Team',
    fullName: entry?.teamName || 'Formula 1 Team',
    base: 'Formula 1',
    teamPrincipal: 'Team Principal',
    powerUnit: 'F1 V6 Turbo Hybrid',
    primaryColor: '#e10600',
    accentColor: '#ffffff',
    highlightColor: '#18181b',
    drivers: [],
  };
  const teamColor = getTeamTextColor(teamId, true);
  const name = driver?.name ?? entry?.driverName ?? 'Driver';
  const code = driver?.code ?? entry?.driverCode ?? 'DRV';
  const flag = driver?.flagEmoji ?? entry?.countryFlag ?? '';
  const country = driver?.country ?? '';
  const resolvedImageUrl =
    driver?.imageUrl || (driverId ? getOriginalDriverVisualAsset(driverId) : undefined);

  return (
    <div className="min-h-[70vh] bg-studio-100 py-10 sm:py-16">
      <div className="page-container max-w-5xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (window.history.length > 2) {
                  navigate(-1);
                } else {
                  navigate(`/season/${season}?tab=drivers`);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-studio-200 text-xs font-bold uppercase tracking-wider text-studio-700 hover:text-f1red hover:border-f1red transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{lang === 'vi' ? 'Quay lại' : 'Back'}</span>
            </button>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-studio-400">
              <Link
                to={`/season/${season}?tab=drivers`}
                className="hover:text-f1red transition-colors text-studio-500"
              >
                {lang === 'vi' ? `Tay đua (${season})` : `Drivers (${season})`}
              </Link>
              <span>/</span>
              <span className="text-studio-900">{name}</span>
            </div>
          </div>
          {seasonEntries.length > 0 && (
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-studio-500">
              {lang === 'vi' ? 'Mùa giải' : 'Season'}
              <select
                value={season}
                onChange={(event) => setSearchParams({ season: event.target.value })}
                className="rounded-lg border border-studio-200 bg-white px-3 py-2 text-sm font-bold text-studio-900"
              >
                {seasonEntries.map((item) => (
                  <option key={item.season} value={item.season}>
                    {item.season}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <header className="relative overflow-hidden rounded-3xl bg-studio-950 p-6 sm:p-10 text-white shadow-2xl border border-studio-800">
          {/* Team Primary Color Left Accent Bar */}
          <div
            className="absolute inset-y-0 left-0 w-2.5 rounded-l-3xl"
            style={{ backgroundColor: teamColor }}
          />

          {/* Ambient Glows from Team Color */}
          <div
            className="absolute -right-16 -top-20 h-72 w-72 rounded-full opacity-25 blur-3xl pointer-events-none"
            style={{ backgroundColor: teamColor }}
          />
          <div
            className="absolute -left-16 -bottom-20 h-72 w-72 rounded-full opacity-10 blur-3xl pointer-events-none"
            style={{ backgroundColor: teamColor }}
          />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 sm:gap-8">
            {/* Left Content */}
            <div className="space-y-4 max-w-xl">
              {/* Overline with season, code, flag, car number */}
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="text-xs font-black uppercase tracking-[0.25em]"
                  style={{ color: teamColor }}
                >
                  {season} · {code} · {flag}
                  {country ? ` ${country}` : ''}
                </span>
                {driver && (
                  <span
                    className="px-2 py-0.5 rounded-md text-[11px] font-black font-mono uppercase text-white shadow-xs"
                    style={{ backgroundColor: teamColor }}
                  >
                    #{driver.number}
                  </span>
                )}
              </div>

              {/* Driver Headline Name */}
              <h1 className="font-display text-[clamp(1.75rem,8vw,2.25rem)] sm:text-5xl lg:text-6xl font-bold uppercase tracking-normal text-white leading-[1.2] [overflow-wrap:anywhere]">
                {name}
              </h1>

              {/* Team and Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to={`/teams/${teamId}?season=${season}`}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md transition-all border border-white/10"
                >
                  <ConstructorLogo teamId={teamId} size="sm" />
                  <span>{team.fullName}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-studio-400" />
                </Link>

                <Link
                  to={`/showroom?team=${teamId}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-f1red/90 hover:bg-f1red text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-f1red/20 hover:scale-105"
                  title={lang === 'vi' ? 'Xem cỗ máy trong Showroom 3D' : 'View car in 3D Showroom'}
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>{lang === 'vi' ? 'Xem Xe 3D' : '3D Showroom'}</span>
                </Link>
              </div>

              {/* Quick Season & Career Badges */}
              <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-studio-300 font-mono">
                {entry && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 border border-white/10">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {lang === 'vi' ? `Mùa ${season}` : `Season ${season}`}:{' '}
                      <strong className="text-white">P{entry.rank}</strong> ({entry.points} PTS)
                    </span>
                  </div>
                )}
                {(driver || career.careerWins > 0 || career.podiums > 0) && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 border border-white/10">
                    <Award className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      {lang === 'vi' ? 'Sự nghiệp' : 'Career'}:{' '}
                      <strong className="text-white">{career.careerWins}</strong>{' '}
                      {lang === 'vi' ? 'thắng' : 'wins'} ·{' '}
                      <strong className="text-white">{career.podiums}</strong> podium
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Driver 16:9 Celebration Poster */}
            <div className="relative shrink-0 self-center md:self-auto w-full sm:w-[360px] md:w-[420px] lg:w-[460px]">
              <div
                className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/20 shadow-2xl shadow-black/80 bg-studio-950 flex flex-col items-center justify-center text-center group transition-all duration-300 hover:border-white/40"
                style={{
                  boxShadow: `0 20px 45px -10px ${teamColor}40`,
                }}
              >
                {resolvedImageUrl ? (
                  <>
                    <img
                      src={resolvedImageUrl}
                      alt={`${name} abstract editorial data profile`}
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/15 text-[10px] font-mono font-bold tracking-wider text-white uppercase opacity-75 group-hover:opacity-100 transition-opacity">
                      16:9 POSTER
                    </div>
                  </>
                ) : (
                  <>
                    {/* Top Team Logo */}
                    <div className="pt-2">
                      <ConstructorLogo teamId={teamId} size="md" />
                    </div>

                    {/* Middle Giant Car Number */}
                    <div className="my-auto space-y-1">
                      <span
                        className="block font-display text-5xl sm:text-6xl font-black tracking-tight"
                        style={{ color: teamColor }}
                      >
                        #{driver?.number ?? entry?.rank}
                      </span>
                      <span className="block font-mono text-sm font-bold tracking-widest text-white/90">
                        {code}
                      </span>
                    </div>

                    {/* Bottom Flag & Nation */}
                    <div className="pb-1 text-xs font-mono text-studio-400 flex items-center gap-1.5">
                      <span className="text-base">{flag}</span>
                      <span className="font-bold text-white">{country}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {entry ? (
          <div className="space-y-6">
            {/* Section 1: Season Performance */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-studio-600 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-f1red" />
                  <span>
                    {lang === 'vi'
                      ? `Thành tích Mùa giải ${season}`
                      : `${season} Season Performance`}
                  </span>
                </h3>
                <span className="text-[11px] font-mono text-studio-400">
                  {lang === 'vi' ? `Xếp hạng chính thức ${season}` : `Official ${season} Standings`}
                </span>
              </div>
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                <Stat
                  icon={<Trophy className="h-4 w-4 text-amber-500" />}
                  label={lang === 'vi' ? `Thứ hạng mùa ${season}` : `Season ${season} Rank`}
                  value={`P${entry.rank}`}
                  subValue={lang === 'vi' ? 'Bảng xếp hạng cá nhân' : 'Drivers Championship'}
                />
                <Stat
                  icon={<Flag className="h-4 w-4 text-sky-500" />}
                  label={lang === 'vi' ? `Điểm số mùa ${season}` : `Season ${season} Points`}
                  value={`${entry.points} PTS`}
                  subValue={lang === 'vi' ? 'Điểm tích lũy mùa giải' : 'Total points earned'}
                />
                <Stat
                  icon={<Award className="h-4 w-4 text-emerald-500" />}
                  label={lang === 'vi' ? `Chiến thắng mùa ${season}` : `Season ${season} Wins`}
                  value={`${entry.wins} ${lang === 'vi' ? 'chặng' : 'wins'}`}
                  subValue={lang === 'vi' ? 'Về nhất Grand Prix mùa này' : 'Grand Prix victories'}
                />
                <Stat
                  icon={<Medal className="h-4 w-4 text-amber-400" />}
                  label={lang === 'vi' ? `Podium mùa ${season}` : `Season ${season} Podiums`}
                  value={`${entry.podiums} ${lang === 'vi' ? 'chặng' : 'podiums'}`}
                  subValue={lang === 'vi' ? 'Top 3 về đích mùa này' : 'Top 3 finishes'}
                />
              </div>
            </div>

            {/* Section 2: Career Records */}
            {(driver || career.careerWins > 0 || career.podiums > 0) && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-studio-600 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>
                      {lang === 'vi'
                        ? 'Kỷ lục trọn sự nghiệp F1 (All-Time Career)'
                        : 'All-Time F1 Career Records'}
                    </span>
                  </h3>
                  <span className="text-[11px] font-mono text-studio-400">
                    {code} {driver?.number ? `· #${driver.number}` : ''}
                  </span>
                </div>
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                  <Stat
                    icon={<Trophy className="h-4 w-4 text-amber-500" />}
                    label={lang === 'vi' ? 'Tổng chiến thắng Grand Prix' : 'Career Grand Prix Wins'}
                    value={`${career.careerWins}`}
                    subValue={
                      season < 2026
                        ? lang === 'vi'
                          ? `Tính đến hết mùa ${season}: ${careerUpToSeason.careerWins} chiến thắng`
                          : `Through ${season}: ${careerUpToSeason.careerWins} wins`
                        : lang === 'vi'
                          ? 'Số lần về nhất sự nghiệp F1'
                          : 'All-time F1 victories'
                    }
                  />
                  <Stat
                    icon={<Medal className="h-4 w-4 text-emerald-500" />}
                    label={lang === 'vi' ? 'Tổng số lần lên bục Podium' : 'Career Total Podiums'}
                    value={`${career.podiums}`}
                    subValue={
                      season < 2026
                        ? lang === 'vi'
                          ? `Tính đến hết mùa ${season}: ${careerUpToSeason.podiums} podium`
                          : `Through ${season}: ${careerUpToSeason.podiums} podiums`
                        : lang === 'vi'
                          ? 'Top 3 trọn sự nghiệp F1'
                          : 'All-time Top 3 finishes'
                    }
                  />
                  <Stat
                    icon={<Flag className="h-4 w-4 text-sky-500" />}
                    label={lang === 'vi' ? 'Số xe & Quốc tịch' : 'Car Number & Nation'}
                    value={`${driver?.number ? `#${driver.number} · ` : ''}${country || flag}`}
                    subValue={driver?.shortName || name}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <Stat
            icon={<Trophy className="h-4 w-4 text-amber-500" />}
            label={lang === 'vi' ? 'Thành tích toàn sự nghiệp F1' : 'All-time F1 career record'}
            value={`${career.careerWins} wins · ${career.podiums} podiums`}
          />
        )}
        <p className="text-[11px] text-studio-500">
          {lang === 'vi'
            ? 'Thứ hạng, điểm và kết quả mùa giải được trích xuất từ dữ liệu xếp hạng chính thức. Kỷ lục sự nghiệp thể hiện toàn bộ chiến thắng và podium của tay đua trong lịch sử F1.'
            : 'Season rank, points, and results are sourced from official standings. Career records reflect all-time F1 victories and podium finishes.'}
        </p>
        <Link
          to={`/showroom?team=${teamId}`}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-black uppercase tracking-wider text-studio-800 shadow-subtle hover:text-f1red"
        >
          <Box className="h-4 w-4 text-f1red" />
          <span>
            {lang === 'vi'
              ? `Khám phá Showroom 3D xe ${team.name}`
              : `Explore ${team.name} in 3D Showroom`}
          </span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

const Stat: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
}> = ({ icon, label, value, subValue }) => (
  <div className="rounded-2xl border border-studio-200 bg-white p-4 sm:p-5 shadow-subtle hover:border-studio-300 transition-colors flex flex-col justify-between">
    <div>
      <div className="flex items-center justify-between">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-studio-100">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-studio-400">
        {label}
      </p>
      <p className="mt-1 font-display text-xl sm:text-2xl font-black text-studio-950 tabular-nums">
        {value}
      </p>
    </div>
    {subValue && (
      <p className="mt-2 text-[11px] text-studio-500 font-medium border-t border-studio-100 pt-2">
        {subValue}
      </p>
    )}
  </div>
);
