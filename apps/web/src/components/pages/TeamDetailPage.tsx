import React from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, MapPin, Users, Wrench, Trophy, Car, Box } from 'lucide-react';
import { TEAMS_DATA } from '../../data/teams';
import { getCarsBySeason } from '../../data/cars';
import { STANDINGS_DATA } from '../../data/championship';
import { getTeamSeasonProfile } from '../../data/teamSeasons';
import { useNavigationStore } from '../../store/useNavigationStore';
import { SeasonYear, TeamId } from '../../types';
import { ConstructorLogo } from '../common/ConstructorLogo';
import { getTeamTextColor } from '../../utils/teamColors';

export const TeamDetailPage: React.FC = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const lang = useNavigationStore((state) => state.lang);
  const seasonValue = Number(searchParams.get('season'));
  const season = ([2024, 2025, 2026] as number[]).includes(seasonValue)
    ? (seasonValue as SeasonYear)
    : 2026;
  const team = teamId && teamId in TEAMS_DATA ? TEAMS_DATA[teamId as TeamId] : undefined;
  if (!team) {
    return (
      <div className="page-container py-24 min-h-[60vh] text-center">
        <p className="text-f1red font-black text-5xl">404</p>
        <h1 className="mt-4 text-xl font-bold">
          {lang === 'vi' ? 'Không tìm thấy đội đua' : 'Team not found'}
        </h1>
        <Link className="inline-block mt-6 text-f1red font-bold" to="/season/2026">
          {lang === 'vi' ? 'Về mùa giải' : 'Back to season'}
        </Link>
      </div>
    );
  }

  const seasonProfile = getTeamSeasonProfile(team.id, season);
  const drivers = STANDINGS_DATA[season].drivers.filter((entry) => entry.teamId === team.id);
  const cars = getCarsBySeason(season).filter((entry) => entry.teamId === team.id);
  const standings = STANDINGS_DATA[season].constructors.find((entry) => entry.teamId === team.id);
  const seasonCar = cars[0];
  const darkTeamColor = getTeamTextColor(team.id, true);
  const lightTeamColor = getTeamTextColor(team.id, false);

  return (
    <div className="min-h-[70vh] bg-studio-100 py-10 sm:py-16">
      <div className="page-container space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (window.history.length > 2) {
                  navigate(-1);
                } else {
                  navigate(`/season/${season}?tab=teams`);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-studio-200 text-xs font-bold uppercase tracking-wider text-studio-700 hover:text-f1red hover:border-f1red transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{lang === 'vi' ? 'Quay lại' : 'Back'}</span>
            </button>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-studio-400">
              <Link
                to={`/season/${season}?tab=teams`}
                className="hover:text-f1red transition-colors text-studio-500"
              >
                {lang === 'vi' ? `Đội đua (${season})` : `Teams (${season})`}
              </Link>
              <span>/</span>
              <span className="text-studio-900">{team.name}</span>
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-studio-500">
            {lang === 'vi' ? 'Mùa giải' : 'Season'}
            <select
              value={season}
              onChange={(event) => setSearchParams({ season: event.target.value })}
              className="rounded-lg border border-studio-200 bg-white px-3 py-2 text-sm font-bold text-studio-900"
            >
              {([2026, 2025, 2024] as SeasonYear[]).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        </div>
        {!seasonProfile ? (
          <section className="rounded-3xl border border-studio-200 bg-white p-8 text-center shadow-subtle">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-f1red">{season}</p>
            <h1 className="mt-3 font-display text-3xl font-black uppercase text-studio-950">
              {team.name}
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-studio-600">
              {lang === 'vi'
                ? 'Đội này chưa tham gia mùa giải đã chọn nên không có hồ sơ mùa, roster hay đơn vị động lực.'
                : 'This team did not compete in the selected season, so no seasonal profile, line-up, or power unit is available.'}
            </p>
          </section>
        ) : (
          <>
            <header className="relative overflow-hidden rounded-3xl bg-studio-950 p-6 sm:p-10 text-white shadow-2xl border border-studio-800">
              <div
                className="absolute inset-y-0 left-0 w-2.5 rounded-l-3xl"
                style={{ backgroundColor: darkTeamColor }}
              />
              <div
                className="absolute -right-20 -top-24 h-80 w-80 rounded-full opacity-25 blur-3xl pointer-events-none"
                style={{ backgroundColor: darkTeamColor }}
              />
              <div
                className="absolute -left-20 -bottom-24 h-80 w-80 rounded-full opacity-10 blur-3xl pointer-events-none"
                style={{ backgroundColor: darkTeamColor }}
              />

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                {/* Left Content */}
                <div className="max-w-2xl space-y-4">
                  <div className="flex items-center gap-3">
                    <ConstructorLogo teamId={team.id} size="md" />
                    <span
                      className="text-xs font-black uppercase tracking-[0.25em]"
                      style={{ color: darkTeamColor }}
                    >
                      {team.name} · {season}
                    </span>
                  </div>
                  <h1 className="font-display text-4xl sm:text-6xl font-black uppercase tracking-tight">
                    {seasonProfile.fullName}
                  </h1>
                  <p className="max-w-2xl text-sm sm:text-base text-studio-300">
                    {lang === 'vi'
                      ? `Đội hình, thứ hạng và xe đua theo dữ liệu mùa giải ${season}.`
                      : `Driver line-up, standings, and car data for the ${season} season.`}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    {standings ? (
                      <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold">
                        <Trophy className="w-4 h-4 text-amber-400" />P{standings.rank} ·{' '}
                        {standings.points} PTS
                      </div>
                    ) : (
                      <span className="inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-studio-300">
                        {lang === 'vi'
                          ? 'Không có thứ hạng đội trong dữ liệu mùa này'
                          : 'No constructor standings for this season'}
                      </span>
                    )}

                    <Link
                      to={`/showroom?team=${team.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-f1red hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider shadow-lg hover:shadow-f1red/30 transition-all hover:scale-105"
                    >
                      <Box className="w-4 h-4" />
                      <span>
                        {lang === 'vi' ? 'Xem Xe Trong Showroom 3D' : 'View in 3D Showroom'}
                      </span>
                    </Link>
                  </div>
                </div>

                {/* Right Team Machine Poster Showcase */}
                {team.imageUrl && (
                  <div className="relative shrink-0 self-center lg:self-auto w-full max-w-sm sm:max-w-md lg:w-96">
                    <div
                      className="group relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-white/10 via-studio-900 to-studio-950 shadow-2xl transition hover:-translate-y-1"
                      style={{
                        boxShadow: `0 20px 40px -15px ${darkTeamColor}30`,
                      }}
                    >
                      <div className="relative aspect-[16/10] overflow-hidden bg-black/60">
                        <img
                          src={team.imageUrl}
                          alt={`Podium EDS-G01 independent engineering study for ${seasonProfile.fullName}`}
                          decoding="async"
                          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-studio-950 via-studio-950/20 to-transparent" />

                        <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[11px] font-black uppercase text-white border border-white/10">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: darkTeamColor }}
                          />
                          <span>{seasonCar?.shortName || team.name}</span>
                        </div>
                      </div>

                      <div className="p-4 space-y-1.5 border-t border-white/10">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black uppercase tracking-widest text-studio-400">
                            F1 {season} Challenger
                          </p>
                          <span className="text-[10px] font-mono text-studio-400">
                            {seasonProfile.powerUnit}
                          </span>
                        </div>
                        <h4 className="font-display text-sm font-black text-white truncate">
                          {seasonCar?.name || seasonProfile.fullName}
                        </h4>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </header>

            <section className="grid gap-4 sm:grid-cols-3">
              <Fact
                icon={<MapPin />}
                label={lang === 'vi' ? 'Cơ sở' : 'Base'}
                value={seasonProfile.base}
              />
              <Fact
                icon={<Users />}
                label={seasonProfile.teamLeadTitle}
                value={seasonProfile.teamLead}
              />
              <Fact
                icon={<Wrench />}
                label={lang === 'vi' ? `Động cơ · ${season}` : `Power unit · ${season}`}
                value={
                  seasonProfile.powerUnit ||
                  seasonCar?.powerUnit ||
                  standings?.engine ||
                  (lang === 'vi'
                    ? 'Chưa có dữ liệu động cơ theo mùa'
                    : 'No seasonal power unit data')
                }
              />
            </section>
            <p className="-mt-5 text-[11px] text-studio-500">
              {lang === 'vi'
                ? `Hồ sơ đội phản ánh tên đăng ký, cơ sở, người phụ trách và nhà cung cấp động lực ở cuối mùa ${season}.`
                : `Team identity, base, leadership, and power unit reflect the end-of-season profile for ${season}.`}
            </p>

            <section className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-f1red">
                    {season} Grid
                  </p>
                  <h2 className="font-display text-2xl sm:text-3xl font-black uppercase">
                    {lang === 'vi' ? 'Đội hình tay đua' : 'Driver line-up'}
                  </h2>
                </div>
                <Link
                  to={`/showroom?team=${team.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-f1red hover:underline"
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>{lang === 'vi' ? 'Xem xe 3D trong Showroom' : 'View in 3D Showroom'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {drivers.map((driver) => (
                  <Link
                    key={driver.driverId}
                    to={`/drivers/${driver.driverId}?season=${season}`}
                    className="group flex items-center gap-4 rounded-2xl border bg-white p-5 shadow-subtle transition hover:-translate-y-0.5 hover:shadow-md"
                    style={{ borderColor: `${lightTeamColor}40` }}
                  >
                    <span
                      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-2xl font-black text-white"
                      style={{ backgroundColor: lightTeamColor }}
                    >
                      P{driver.rank}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[10px] font-black uppercase tracking-widest text-studio-400">
                        {driver.driverCode} · {driver.countryFlag}
                      </span>
                      <span className="mt-1 block font-display text-xl font-bold text-studio-950 group-hover:text-f1red">
                        {driver.driverName}
                      </span>
                      <span className="mt-1 block text-xs text-studio-500">
                        {driver.points} PTS · {driver.wins} {lang === 'vi' ? 'chiến thắng' : 'wins'}{' '}
                        · {driver.podiums} {lang === 'vi' ? 'podium' : 'podiums'}
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-studio-300 group-hover:text-f1red" />
                  </Link>
                ))}
                {!drivers.length && (
                  <p className="rounded-xl border border-dashed border-studio-300 bg-white p-6 text-sm text-studio-500">
                    {lang === 'vi'
                      ? 'Không có roster cho đội này trong dữ liệu mùa giải đã chọn.'
                      : 'No driver line-up is available for this team in the selected season dataset.'}
                  </p>
                )}
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-f1red">
                  {season} Car
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-black uppercase">
                  {lang === 'vi' ? `Mẫu xe mùa ${season}` : `${season} car model`}
                </h2>
              </div>
              {cars.length ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {cars.map((car) => (
                    <Link
                      key={car.id}
                      to={`/cars/${car.id}`}
                      className="group flex items-center gap-4 rounded-2xl border border-studio-200 bg-white p-5 shadow-subtle transition hover:-translate-y-0.5 hover:border-studio-400 hover:shadow-md"
                    >
                      <span
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
                        style={{ backgroundColor: car.primaryColor }}
                      >
                        <Car className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[10px] font-black uppercase tracking-widest text-studio-400">
                          {car.season} · {car.shortName}
                        </span>
                        <span className="mt-1 block font-bold text-studio-950 group-hover:text-f1red">
                          {car.name}
                        </span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-studio-300 group-hover:text-f1red" />
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-studio-500">
                  {lang === 'vi'
                    ? 'Chưa có dữ liệu xe cho đội này.'
                    : 'No car data for this team yet.'}
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

const Fact: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <div className="rounded-2xl border border-studio-200 bg-white p-5 shadow-subtle">
    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-f1red/10 text-f1red">
      {React.cloneElement(icon as React.ReactElement, { className: 'h-4 w-4' })}
    </span>
    <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-studio-400">{label}</p>
    <p className="mt-1 text-sm font-bold leading-relaxed text-studio-900">{value}</p>
  </div>
);
