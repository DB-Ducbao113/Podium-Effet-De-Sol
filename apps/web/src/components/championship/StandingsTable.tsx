import React from 'react';
import { Link } from 'react-router-dom';
import { getStandings } from '../../data/championship';
import { DRIVERS_DATA } from '../../data/drivers';
import { SeasonYear } from '../../types';
import { t } from '../../i18n/translations';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useChampionshipStore } from '../../store/useChampionshipStore';
import { Trophy, Award, ExternalLink, ShieldCheck, Clock } from 'lucide-react';
import { getTeamTextColor } from '../../utils/teamColors';
import { Card3DTilt } from '../common/Card3DTilt';

interface StandingsTableProps {
  season: SeasonYear;
}

export const StandingsTable: React.FC<StandingsTableProps> = React.memo(({ season }) => {
  const { lang } = useNavigationStore();
  const { standingsCategory, setStandingsCategory, calculatedStandings } = useChampionshipStore();
  const strings = t[lang].championship;

  const rawStandings = getStandings(season);
  const activeDrivers = calculatedStandings[season]?.drivers || rawStandings.drivers;
  const activeConstructors = calculatedStandings[season]?.constructors || rawStandings.constructors;
  const isOngoing = rawStandings.status === 'ongoing';

  const f1SourceUrl =
    standingsCategory === 'drivers'
      ? `https://www.formula1.com/en/results/${season}/drivers`
      : `https://www.formula1.com/en/results/${season}/team`;

  const leaderDriver = activeDrivers[0];
  const leaderConstructor = activeConstructors[0];

  const leaderDriverColor = leaderDriver ? getTeamTextColor(leaderDriver.teamId, false) : '#18181b';
  const leaderConstructorColor = leaderConstructor
    ? getTeamTextColor(leaderConstructor.teamId, false)
    : '#18181b';

  return (
    <div className="space-y-6">
      {/* ── Status Banner (Ongoing vs Completed) ── */}
      <Card3DTilt
        maxTilt={2}
        glareOpacity={0.08}
        className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          isOngoing
            ? 'bg-gradient-to-r from-emerald-50/60 via-white to-white border-emerald-200/80 shadow-xs border-l-4 border-l-emerald-500'
            : 'bg-white border-studio-200 text-studio-900 shadow-xs border-l-4 border-l-studio-300'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {isOngoing ? (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider border border-emerald-200">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                  </span>
                  <span>{lang === 'vi' ? 'Mùa giải đang diễn ra' : 'Ongoing Season'}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-studio-100 text-studio-700 text-xs font-bold uppercase tracking-wider border border-studio-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {lang === 'vi' ? 'Kết quả chung cuộc chính thức' : 'Official Final Standings'}
                  </span>
                </span>
              )}

              {rawStandings.lastUpdated && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-studio-600 bg-studio-100 px-2.5 py-1 rounded-full border border-studio-200">
                  <Clock className="w-3 h-3 text-studio-400" />
                  <span>
                    {lang === 'vi' ? 'Cập nhật:' : 'Updated:'} {rawStandings.lastUpdated}
                  </span>
                </span>
              )}
            </div>

            {isOngoing && leaderDriver && leaderConstructor ? (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-0.5">
                <span className="text-xs font-bold uppercase tracking-wider text-studio-500">
                  {lang === 'vi' ? 'Dẫn đầu BXH:' : 'Championship Leaders:'}
                </span>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Driver Leader */}
                  <span className="inline-flex items-center gap-1.5 font-bold text-sm sm:text-base text-studio-950">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                      style={{ backgroundColor: leaderDriverColor }}
                    />
                    <span style={{ color: leaderDriverColor }}>{leaderDriver.driverName}</span>
                    <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {leaderDriver.points || 0} {lang === 'vi' ? 'ĐIỂM' : 'PTS'}
                    </span>
                  </span>

                  <span className="text-studio-300 hidden sm:inline">·</span>

                  {/* Constructor Leader */}
                  <span className="inline-flex items-center gap-1.5 font-bold text-sm sm:text-base text-studio-950">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                      style={{ backgroundColor: leaderConstructorColor }}
                    />
                    <span style={{ color: leaderConstructorColor }}>
                      {leaderConstructor.teamName}
                    </span>
                    <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {leaderConstructor.points || 0} {lang === 'vi' ? 'ĐIỂM' : 'PTS'}
                    </span>
                  </span>
                </div>
              </div>
            ) : (
              <h3 className="font-display text-lg sm:text-xl font-bold uppercase tracking-tight text-studio-950">
                {rawStandings.leaderTitle || `${strings.title} ${season}`}
              </h3>
            )}
          </div>

          <a
            href={f1SourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all self-start sm:self-center shrink-0 bg-studio-100 hover:bg-studio-200 text-studio-800 border border-studio-200 hover:border-studio-300 shadow-2xs"
          >
            <span>F1.com Official Source</span>
            <ExternalLink className="w-3.5 h-3.5 text-studio-500" />
          </a>
        </div>
      </Card3DTilt>

      {/* Category Toggle (Drivers vs Constructors) */}
      <div className="flex w-full max-w-md min-w-0 items-center gap-2 rounded-xl border border-studio-200 bg-white p-1 shadow-xs">
        <button
          onClick={() => setStandingsCategory('drivers')}
          className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-2 py-2 text-center text-[11px] font-bold uppercase leading-tight tracking-normal transition-all sm:px-4 sm:text-xs sm:tracking-wider ${
            standingsCategory === 'drivers'
              ? 'bg-f1red text-white shadow-sm'
              : 'text-studio-600 hover:text-studio-950'
          }`}
        >
          <Award className="h-4 w-4 shrink-0" />
          <span className="min-w-0 break-words">{strings.driversTab}</span>
        </button>
        <button
          onClick={() => setStandingsCategory('constructors')}
          className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-2 py-2 text-center text-[11px] font-bold uppercase leading-tight tracking-normal transition-all sm:px-4 sm:text-xs sm:tracking-wider ${
            standingsCategory === 'constructors'
              ? 'bg-f1red text-white shadow-sm'
              : 'text-studio-600 hover:text-studio-950'
          }`}
        >
          <Trophy className="h-4 w-4 shrink-0" />
          <span className="min-w-0 break-words">{strings.constructorsTab}</span>
        </button>
      </div>

      {/* Drivers Classification Table */}
      {standingsCategory === 'drivers' && (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-studio-200 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs min-w-[600px]">
              <thead className="bg-studio-100/80 border-b border-studio-200 text-studio-600 uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3 sm:py-3.5 px-3 sm:px-4 w-12 sm:w-16 text-center">
                    {strings.pos}
                  </th>
                  <th className="py-3 sm:py-3.5 px-3 sm:px-4">{strings.driver}</th>
                  <th className="py-3 sm:py-3.5 px-3 sm:px-4">{strings.team}</th>
                  <th className="py-3 sm:py-3.5 px-3 sm:px-4 text-center">{strings.wins}</th>
                  <th className="py-3 sm:py-3.5 px-3 sm:px-4 text-center">{strings.podiums}</th>
                  <th className="py-3 sm:py-3.5 px-4 sm:px-6 text-right font-black text-studio-950">
                    {strings.points}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-studio-100">
                {activeDrivers.map((driver) => {
                  const driverColor = getTeamTextColor(driver.teamId, false);
                  return (
                    <tr
                      key={`${driver.driverId}-${driver.teamId}`}
                      className="hover:bg-studio-50 transition-colors"
                    >
                      <td className="py-3 sm:py-3.5 px-3 sm:px-4 text-center font-display font-black text-xs sm:text-sm">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full ${
                            driver.rank === 1
                              ? 'bg-amber-400 text-black shadow-xs'
                              : driver.rank === 2
                                ? 'bg-studio-300 text-studio-900'
                                : driver.rank === 3
                                  ? 'bg-amber-700 text-white'
                                  : 'text-studio-700'
                          }`}
                        >
                          {driver.rank}
                        </span>
                      </td>
                      <td className="py-3 sm:py-3.5 px-3 sm:px-4">
                        <div className="flex items-center gap-2 sm:gap-2.5">
                          <span
                            className="text-sm sm:text-base shrink-0"
                            title={driver.countryFlag}
                          >
                            {driver.countryFlag}
                          </span>
                          <div>
                            {DRIVERS_DATA[driver.driverId] ? (
                              <Link
                                to={`/drivers/${driver.driverId}?season=${season}`}
                                className="font-extrabold block text-xs sm:text-sm hover:underline leading-tight"
                                style={{ color: driverColor }}
                              >
                                {driver.driverName}
                              </Link>
                            ) : (
                              <span
                                className="font-extrabold block text-xs sm:text-sm leading-tight"
                                style={{ color: driverColor }}
                              >
                                {driver.driverName}
                              </span>
                            )}
                            <span className="text-[9px] sm:text-[10px] text-studio-400 font-mono">
                              {driver.driverCode}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 sm:py-3.5 px-3 sm:px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: driverColor }}
                          />
                          <Link
                            to={`/teams/${driver.teamId}`}
                            className="font-bold hover:underline truncate max-w-[140px] sm:max-w-none block text-xs"
                            style={{ color: driverColor }}
                          >
                            {driver.teamName}
                          </Link>
                        </div>
                      </td>
                      <td className="py-3 sm:py-3.5 px-3 sm:px-4 text-center font-semibold text-studio-700">
                        {driver.wins}
                      </td>
                      <td className="py-3 sm:py-3.5 px-3 sm:px-4 text-center font-semibold text-studio-700">
                        {driver.podiums}
                      </td>
                      <td className="py-3 sm:py-3.5 px-4 sm:px-6 text-right font-display font-black text-sm sm:text-base text-f1red">
                        {driver.points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Constructors Classification Table */}
      {standingsCategory === 'constructors' && (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-studio-200 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs min-w-[600px]">
              <thead className="bg-studio-100/80 border-b border-studio-200 text-studio-600 uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3 sm:py-3.5 px-3 sm:px-4 w-12 sm:w-16 text-center">
                    {strings.pos}
                  </th>
                  <th className="py-3 sm:py-3.5 px-3 sm:px-4">{strings.team}</th>
                  <th className="py-3 sm:py-3.5 px-3 sm:px-4">{strings.engine}</th>
                  <th className="py-3 sm:py-3.5 px-3 sm:px-4 text-center">{strings.wins}</th>
                  <th className="py-3 sm:py-3.5 px-3 sm:px-4 text-center">{strings.podiums}</th>
                  <th className="py-3 sm:py-3.5 px-4 sm:px-6 text-right font-black text-studio-950">
                    {strings.points}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-studio-100">
                {activeConstructors.map((c) => {
                  const teamColor = getTeamTextColor(c.teamId, false);
                  return (
                    <tr
                      key={`${c.teamId}-${c.rank}`}
                      className="hover:bg-studio-50 transition-colors"
                    >
                      <td className="py-3 sm:py-3.5 px-3 sm:px-4 text-center font-display font-black text-xs sm:text-sm">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full ${
                            c.rank === 1
                              ? 'bg-amber-400 text-black shadow-xs'
                              : c.rank === 2
                                ? 'bg-studio-300 text-studio-900'
                                : c.rank === 3
                                  ? 'bg-amber-700 text-white'
                                  : 'text-studio-700'
                          }`}
                        >
                          {c.rank}
                        </span>
                      </td>
                      <td className="py-3 sm:py-3.5 px-3 sm:px-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0"
                            style={{ backgroundColor: teamColor }}
                          />
                          <Link
                            to={`/teams/${c.teamId}`}
                            className="font-extrabold text-xs sm:text-sm hover:underline"
                            style={{ color: teamColor }}
                          >
                            {c.teamName}
                          </Link>
                        </div>
                      </td>
                      <td className="py-3 sm:py-3.5 px-3 sm:px-4 font-medium text-studio-600 text-xs">
                        {c.engine}
                      </td>
                      <td className="py-3 sm:py-3.5 px-3 sm:px-4 text-center font-semibold text-studio-700">
                        {c.wins}
                      </td>
                      <td className="py-3 sm:py-3.5 px-3 sm:px-4 text-center font-semibold text-studio-700">
                        {c.podiums}
                      </td>
                      <td className="py-3 sm:py-3.5 px-4 sm:px-6 text-right font-display font-black text-sm sm:text-base text-f1red">
                        {c.points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
});
