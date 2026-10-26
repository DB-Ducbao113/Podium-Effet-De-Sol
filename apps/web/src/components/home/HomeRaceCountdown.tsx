import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Clock3 } from 'lucide-react';
import type { GrandPrixRound } from '../../types';
import { useNavigationStore } from '../../store/useNavigationStore';
import { scheduleWallClockSecondTick } from '../../lib/live/tabSync';
import { getSessionTimeRange, type RaceSessionKey } from '../../utils/raceSchedule';
import { RollingDigits } from './RollingDigits';
import { useTimezoneStore } from '../../store/useTimezoneStore';
import { effectiveTimeZone, zoneOffsetLabel } from '../../utils/championshipTimezone';

const SESSION_LABELS: Partial<Record<RaceSessionKey, { vi: string; en: string }>> = {
  fp1: { vi: 'Luyện tập 1', en: 'Practice 1' },
  fp2: { vi: 'Luyện tập 2', en: 'Practice 2' },
  fp3: { vi: 'Luyện tập 3', en: 'Practice 3' },
  sprintQualifying: { vi: 'Phân hạng Sprint', en: 'Sprint qualifying' },
  sprint: { vi: 'Sprint', en: 'Sprint' },
  qualifying: { vi: 'Phân hạng', en: 'Qualifying' },
  race: { vi: 'Đua chính', en: 'Grand Prix' },
};

export function HomeRaceCountdown({ race }: { race?: GrandPrixRound }) {
  const lang = useNavigationStore((state) => state.lang);
  const timezone = useTimezoneStore((state) => state.preference);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const stop = scheduleWallClockSecondTick(refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  const sessions = useMemo(() => race
    ? (Object.keys(race.sessions) as RaceSessionKey[])
      .flatMap((id) => {
        const range = getSessionTimeRange(race, id);
        return range ? [{ id, ...range }] : [];
      })
      .sort((a, b) => a.start.getTime() - b.start.getTime())
    : [], [race]);
  const live = sessions.find(({ start, end }) => start.getTime() <= now && now < end.getTime());
  const next = sessions.find(({ start }) => start.getTime() > now);
  const completedCount = sessions.filter(({ end }) => end.getTime() <= now).length;
  const remaining = next ? Math.max(0, Math.floor((next.start.getTime() - now) / 1000)) : 0;
  const parts = [
    Math.floor(remaining / 86400),
    Math.floor((remaining % 86400) / 3600),
    Math.floor((remaining % 3600) / 60),
    remaining % 60,
  ];
  const labels = lang === 'vi' ? ['Ngày', 'Giờ', 'Phút', 'Giây'] : ['Days', 'Hours', 'Minutes', 'Seconds'];
  const formatter = new Intl.DateTimeFormat(lang === 'vi' ? 'vi-VN' : 'en-GB', {
    timeZone: effectiveTimeZone(timezone), dateStyle: 'medium', timeStyle: 'short',
  });

  return (
    <section className="h1-countdown page-container" aria-labelledby="h1-countdown-title">
      <div className="h1-countdown__identity">
        <p className="home-section-index"><Clock3 size={16} aria-hidden="true" /> {lang === 'vi' ? 'Chặng tiếp theo / 2026' : 'Next round / 2026'}</p>
        <h2 id="h1-countdown-title">{race ? race.name : lang === 'vi' ? 'Lịch chặng tiếp theo' : 'Next race calendar'}</h2>
        <p>{race ? `${race.circuit} · ${race.location} · R${String(race.round).padStart(2, '0')}` : lang === 'vi' ? 'Chưa có chặng đua sắp tới trong lịch hiện có.' : 'No upcoming race in the available calendar.'}</p>
        <Link className="home-text-link" to="/season/2026?tab=calendar">
          {lang === 'vi' ? 'Xem lịch đua' : 'View calendar'} <ArrowUpRight aria-hidden="true" size={18} />
        </Link>
      </div>
      <div className="h1-countdown__timing">
        {live && <p className="h1-countdown__status" role="status">{lang === 'vi' ? 'Phiên đang diễn ra theo lịch' : 'Session in progress by schedule'} · {SESSION_LABELS[live.id]?.[lang]}</p>}
        {next ? (
          <>
            <p className="h1-countdown__status">{lang === 'vi' ? 'Đếm tới' : 'Counting down to'} {SESSION_LABELS[next.id]?.[lang]}</p>
            <div className="h1-countdown__digits" role="timer" aria-label={`${labels.map((label, index) => `${parts[index]} ${label}`).join(', ')}`}>
              {parts.map((value, index) => <div key={labels[index]}><strong><RollingDigits value={value} /></strong><span>{labels[index]}</span></div>)}
            </div>
            <p className="h1-countdown__date">{formatter.format(next.start)} {zoneOffsetLabel(next.start, timezone)}</p>
          </>
        ) : !live && (
          <p className="h1-countdown__status" role="status">{lang === 'vi' ? 'Chưa có phiên sắp tới trong lịch hiện có.' : 'No upcoming session in the available calendar.'}</p>
        )}
      </div>
      {sessions.length > 0 && <div className="h1-countdown__schedule">
        <div className="h1-countdown__schedule-heading">
          <strong>{lang === 'vi' ? 'Lịch cuối tuần đua' : 'Race weekend schedule'}</strong>
          <span>{lang === 'vi' ? `${completedCount} / ${sessions.length} phiên đã qua theo lịch` : `${completedCount} / ${sessions.length} scheduled sessions elapsed`}</span>
        </div>
        <progress className="h1-countdown__progress" value={completedCount} max={sessions.length} aria-label={lang === 'vi' ? 'Tiến độ lịch cuối tuần đua' : 'Race weekend schedule progress'} />
        <div className="h1-countdown__sessions">
          {sessions.map(({ id, start, end }) => {
            const state = end.getTime() <= now ? 'completed' : start.getTime() <= now ? 'current' : 'upcoming';
            return <div key={id} className="h1-countdown__session" data-state={state}>
              <small>{state === 'current' ? (lang === 'vi' ? 'Theo lịch · đang diễn ra' : 'Scheduled · in progress') : state === 'completed' ? (lang === 'vi' ? 'Đã qua theo lịch' : 'Scheduled time passed') : (lang === 'vi' ? 'Sắp tới' : 'Upcoming')}</small>
              <strong>{SESSION_LABELS[id]?.[lang] ?? id}</strong>
              <time dateTime={start.toISOString()}>{formatter.format(start)} {zoneOffsetLabel(start, timezone)}</time>
            </div>;
          })}
        </div>
      </div>}
    </section>
  );
}
