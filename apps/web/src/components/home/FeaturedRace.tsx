import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowUpRight, BadgeCheck, ChevronRight, RefreshCw } from 'lucide-react';
import { CALENDAR_2026 } from '../../data/championship';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useChampionshipStore } from '../../store/useChampionshipStore';
import type { DetailedRaceResultEntry } from '../../types';

type Session = 'race' | 'sprint';

function formatRaceDate(value: string, lang: 'vi' | 'en') {
  const dayFirst = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!dayFirst) return value;
  const date = new Date(Number(dayFirst[1]), Number(dayFirst[2]) - 1, Number(dayFirst[3]));
  return new Intl.DateTimeFormat(lang === 'vi' ? 'vi-VN' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function finishedRows(entries: DetailedRaceResultEntry[] | undefined) {
  return (Array.isArray(entries) ? entries : [])
    .filter((entry) => entry && typeof entry.position === 'number' && entry.position > 0)
    .sort((a, b) => a.position - b.position);
}

export function FeaturedRace() {
  const lang = useNavigationStore((state) => state.lang);
  const races = useChampionshipStore((state) => state.detailedResults[2026]);
  const syncStatus = useChampionshipStore((state) => state.syncMeta.syncStatus);
  const [session, setSession] = useState<Session>('race');
  const latest = races?.filter((race) =>
    race.status === 'completed' &&
    !race.isSynthesized &&
    Array.isArray(race.entries) &&
    race.entries.length > 0,
  ).sort((a, b) => b.round - a.round)[0];

  const raceRows = finishedRows(latest?.entries);
  const sprintRows = finishedRows(latest?.sprintEntries);
  const activeSession: Session = session === 'sprint' && sprintRows.length > 0 ? 'sprint' : 'race';
  const rows = activeSession === 'sprint' ? sprintRows : raceRows;
  const calendarRound = latest ? CALENDAR_2026.find((race) => race.round === latest.round) : undefined;
  const runnerUp = rows[1];
  const fastest = rows.find((entry) => entry.fastestLap && entry.fastestLapTime);
  const biggestGain = rows.reduce<{ entry: DetailedRaceResultEntry; delta: number } | null>((best, entry) => {
    if (typeof entry.gridPosition !== 'number' || entry.position <= 0) return best;
    if (entry.status !== 'Finished' && !entry.status?.startsWith('+')) return best;
    const delta = entry.gridPosition - entry.position;
    if (delta <= 0) return best;
    return !best || delta > best.delta ? { entry, delta } : best;
  }, null);
  const margin = runnerUp?.timeOrGap?.startsWith('+') ? runnerUp.timeOrGap : null;
  const awaitingFreshData = syncStatus === 'syncing';
  const latestUnverified = syncStatus === 'error';
  const savedSnapshotCopy = latest
    ? lang === 'vi'
      ? `Bản lưu R${latest.round} · ${latest.dataSource || 'Dữ liệu giải đấu'}`
      : `Saved R${latest.round} snapshot · ${latest.dataSource || 'Championship data'}`
    : '';

  return (
    <section className="page-container home-latest-gp" aria-labelledby="home-latest-gp-title">
      <div className="home-latest-gp__identity">
        <p className="home-section-index">01 / {lang === 'vi' ? 'Chặng gần nhất' : 'Latest Grand Prix'}</p>
        {latest ? (
          <>
            <div className="home-latest-gp__round">
              <span>{lang === 'vi' ? 'Chặng' : 'Round'}</span>
              <strong>{String(latest.round).padStart(2, '0')}</strong>
            </div>
            <h2 id="home-latest-gp-title" className="home-latest-gp__title">{latest.grandPrix}</h2>
            <p className="home-latest-gp__meta">
              {latest.circuit}<span aria-hidden="true"> / </span>{latest.country || latest.location}
            </p>
            <p className="home-latest-gp__date">{formatRaceDate(latest.date, lang)}</p>
            <div
              className={`home-latest-gp__verified${awaitingFreshData ? ' is-syncing' : latestUnverified ? ' is-stale' : ''}`}
              role="status"
            >
              {awaitingFreshData ? (
                <RefreshCw className="animate-spin motion-reduce:animate-none" size={16} aria-hidden="true" />
              ) : latestUnverified ? (
                <AlertTriangle size={16} aria-hidden="true" />
              ) : (
                <BadgeCheck size={16} aria-hidden="true" />
              )}
              <span>
                {awaitingFreshData
                  ? (lang === 'vi' ? 'Đang kiểm tra chặng mới nhất' : 'Checking latest round')
                  : latestUnverified
                    ? (lang === 'vi' ? 'Chặng mới nhất chưa xác minh' : 'Latest round unverified')
                    : (lang === 'vi' ? 'Phân loại đã xác minh' : 'Verified classification')}
              </span>
              <small>
                {awaitingFreshData || latestUnverified
                  ? savedSnapshotCopy
                  : latest.dataSource || (lang === 'vi' ? 'Dữ liệu giải đấu' : 'Championship data')}
              </small>
            </div>
            <Link className="home-text-link home-latest-gp__identity-link" to={`/season/2026/race/${latest.round}`}>
              {lang === 'vi' ? 'Xem chặng đua' : 'View race result'} <ArrowUpRight aria-hidden="true" size={17} />
            </Link>
          </>
        ) : (
          <div className="home-latest-gp__empty" role="status" aria-live="polite">
            <span className="home-latest-gp__status">
              {syncStatus === 'syncing'
                ? (lang === 'vi' ? 'DỮ LIỆU / ĐANG ĐỒNG BỘ' : 'DATA / SYNCING')
                : syncStatus === 'error'
                  ? (lang === 'vi' ? 'DỮ LIỆU / KHÔNG KHẢ DỤNG' : 'DATA / UNAVAILABLE')
                  : (lang === 'vi' ? 'DỮ LIỆU / CHƯA XÁC MINH' : 'DATA / UNVERIFIED')}
            </span>
            <h2 id="home-latest-gp-title" className="home-latest-gp__title">
              {syncStatus === 'syncing'
                ? (lang === 'vi' ? 'Đang đồng bộ kết quả đã xác minh.' : 'Syncing verified results.')
                : syncStatus === 'error'
                  ? (lang === 'vi' ? 'Kết quả đã xác minh tạm thời không khả dụng.' : 'Verified results are temporarily unavailable.')
                  : (lang === 'vi' ? 'Chưa có phân loại được xác minh.' : 'No verified classification yet.')}
            </h2>
            <p className="home-latest-gp__empty-copy">
              {syncStatus === 'syncing'
                ? (lang === 'vi' ? 'Chặng hoàn thành gần nhất sẽ xuất hiện sau khi quá trình đồng bộ hoàn tất.' : 'The latest completed round will appear when the data sync finishes.')
                : syncStatus === 'error'
                  ? (lang === 'vi' ? 'Lịch đua và bảng xếp hạng vẫn có sẵn trong Giải đấu.' : 'The calendar and standings remain available in Championship.')
                  : (lang === 'vi' ? 'Kết quả hoàn thành sẽ xuất hiện tại đây sau khi được xác minh.' : 'Completed rounds will appear here once verified.')}
            </p>
            <div className="home-latest-gp__empty-links">
              <Link className="home-text-link" to="/season/2026?tab=results">
                {lang === 'vi' ? 'Xem giải đấu' : 'Explore Championship'} <ArrowUpRight aria-hidden="true" size={17} />
              </Link>
              <Link className="home-text-link" to="/season/2026?tab=calendar">
                {lang === 'vi' ? 'Xem lịch đua' : 'View calendar'} <ChevronRight aria-hidden="true" size={17} />
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="home-latest-gp__panel" aria-live="polite">
        <div className="home-latest-gp__panel-head">
          <div>
            <p className="home-latest-gp__panel-index">{lang === 'vi' ? 'PHÂN TÍCH CHẶNG ĐUA' : 'RACE INTELLIGENCE'}</p>
            <p className="home-latest-gp__panel-copy">
              {lang === 'vi' ? 'Phân loại từ dữ liệu chặng đã xác minh.' : 'Classification from verified round data.'}
            </p>
          </div>
          {latest && (
            <div className="home-latest-gp__sessions" role="group" aria-label={lang === 'vi' ? 'Phiên đua' : 'Session'}>
              {sprintRows.length > 0 ? (
                <>
                  <button
                    type="button"
                    aria-pressed={activeSession === 'sprint'}
                    className={activeSession === 'sprint' ? 'is-active' : undefined}
                    onClick={() => setSession('sprint')}
                  >
                    Sprint
                  </button>
                  <button
                    type="button"
                    aria-pressed={activeSession === 'race'}
                    className={activeSession === 'race' ? 'is-active' : undefined}
                    onClick={() => setSession('race')}
                  >
                    {lang === 'vi' ? 'Đua' : 'Race'}
                  </button>
                </>
              ) : (
                <span className="home-latest-gp__session-label">{lang === 'vi' ? 'Đua' : 'Race'}</span>
              )}
            </div>
          )}
        </div>

        {latest ? (
          <>
            <div className="home-latest-gp__classification">
              <table className="home-latest-gp__table home-latest-gp__table--podium">
                <caption className="sr-only">
                  {activeSession === 'sprint'
                    ? (lang === 'vi' ? 'Podium Sprint' : 'Sprint podium')
                    : (lang === 'vi' ? 'Podium chặng đua' : 'Race podium')}
                </caption>
                <thead className="sr-only">
                  <tr>
                    <th scope="col">{lang === 'vi' ? 'Hạng' : 'Pos'}</th>
                    <th scope="col">{lang === 'vi' ? 'Tay đua' : 'Driver'}</th>
                    <th scope="col">{lang === 'vi' ? 'Đội' : 'Team'}</th>
                    <th scope="col">{lang === 'vi' ? 'Thời gian / Cách biệt' : 'Time / Gap'}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 3).map((entry) => (
                    <tr key={`${activeSession}-${entry.position}-${entry.driverId}`} className="home-latest-gp__row" data-position={entry.position}>
                      <td className="home-latest-gp__pos">{String(entry.position).padStart(2, '0')}</td>
                      <td className="home-latest-gp__driver">
                        <strong>
                          {entry.driverName}
                          {entry.fastestLap && <abbr className="home-latest-gp__fl" title={lang === 'vi' ? 'Vòng nhanh nhất' : 'Fastest lap'}>FL</abbr>}
                        </strong>
                        <small>{entry.driverCode}<span className="home-latest-gp__driver-team"> · {entry.teamName}</span></small>
                      </td>
                      <td className="home-latest-gp__team">{entry.teamName}</td>
                      <td className="home-latest-gp__time">{entry.timeOrGap || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <table className="home-latest-gp__table home-latest-gp__table--rest">
                <caption className="sr-only">
                  {activeSession === 'sprint'
                    ? (lang === 'vi' ? 'Phân loại Sprint từ hạng 4' : 'Sprint classification from P4')
                    : (lang === 'vi' ? 'Phân loại chặng từ hạng 4' : 'Race classification from P4')}
                </caption>
                <thead className="sr-only">
                  <tr>
                    <th scope="col">{lang === 'vi' ? 'Hạng' : 'Pos'}</th>
                    <th scope="col">{lang === 'vi' ? 'Tay đua' : 'Driver'}</th>
                    <th scope="col">{lang === 'vi' ? 'Thời gian / Cách biệt' : 'Time / Gap'}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(3, 8).map((entry) => (
                    <tr key={`${activeSession}-${entry.position}-${entry.driverId}`} className="home-latest-gp__row" data-position={entry.position}>
                      <td className="home-latest-gp__pos">{String(entry.position).padStart(2, '0')}</td>
                      <td className="home-latest-gp__driver">
                        <strong>{entry.driverName}</strong>
                        <small>{entry.driverCode} · {entry.teamName}</small>
                      </td>
                      <td className="home-latest-gp__time">{entry.timeOrGap || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 8 && (
                <p className="home-latest-gp__more">
                  +{rows.length - 8} {lang === 'vi' ? 'tay đua khác' : 'more drivers'}
                </p>
              )}
            </div>

            <div className="home-latest-gp__intel">
              <div>
                <span>{lang === 'vi' ? 'Cách biệt dẫn đầu' : 'Winning margin'}</span>
                <strong>{margin || '—'}</strong>
                <small>{margin ? (lang === 'vi' ? 'So với P2' : 'To P2') : (lang === 'vi' ? 'Không có dữ liệu' : 'Not reported')}</small>
              </div>
              <div>
                <span>{lang === 'vi' ? 'Vòng nhanh nhất' : 'Fastest lap'}</span>
                <strong>{fastest?.fastestLapTime || '—'}</strong>
                <small>{fastest ? `${fastest.driverCode} · ${fastest.teamName}` : (lang === 'vi' ? 'Không có dữ liệu' : 'Not reported')}</small>
              </div>
              <div>
                <span>{lang === 'vi' ? 'Vượt nhiều nhất' : 'Biggest gain'}</span>
                <strong>{biggestGain ? `+${biggestGain.delta}` : '—'}</strong>
                <small>{biggestGain ? `${biggestGain.entry.driverCode} · P${biggestGain.entry.gridPosition} → P${biggestGain.entry.position}` : (lang === 'vi' ? 'Không có dữ liệu' : 'Not reported')}</small>
              </div>
            </div>

            <div className="home-latest-gp__panel-foot">
              <span>
                {calendarRound?.hasSprint && sprintRows.length === 0
                  ? (lang === 'vi' ? 'Dữ liệu Sprint không khả dụng cho chặng này.' : 'Sprint classification unavailable for this round.')
                  : (lang === 'vi' ? 'Top 8 phân loại đã xác minh.' : 'Top 8 verified classification.')}
              </span>
              <Link className="home-text-link" to={`/season/2026/race/${latest.round}`}>
                {lang === 'vi' ? 'Xem toàn bộ phân loại' : 'View full classification'} <ArrowUpRight aria-hidden="true" size={17} />
              </Link>
            </div>
          </>
        ) : (
          <div className="home-latest-gp__panel-empty" role="status">
            <span className="home-latest-gp__panel-line" aria-hidden="true" />
            <p>
              {syncStatus === 'syncing'
                ? (lang === 'vi' ? 'Đang chờ phân loại đã xác minh.' : 'Waiting for verified classification.')
                : (lang === 'vi' ? 'Không có phân loại để hiển thị.' : 'No classification to display.')}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
