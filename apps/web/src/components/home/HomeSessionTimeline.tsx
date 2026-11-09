import { useEffect, useMemo, useRef } from 'react';
import type { GrandPrixRound } from '../../types';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useTimezoneStore } from '../../store/useTimezoneStore';
import { getSessionTimeRange, type RaceSessionKey } from '../../utils/raceSchedule';
import { effectiveTimeZone } from '../../utils/championshipTimezone';
import { subscribeHomeScrub } from './journey/homeScrubRegistry';

const SESSION_ORDER: RaceSessionKey[] = [
  'fp1', 'fp2', 'fp3', 'sprintQualifying', 'sprint', 'qualifying', 'race',
];

const SESSION_LABELS: Record<RaceSessionKey, { en: string; vi: string }> = {
  fp1: { en: 'Practice 1', vi: 'Thử nghiệm 1' },
  fp2: { en: 'Practice 2', vi: 'Thử nghiệm 2' },
  fp3: { en: 'Practice 3', vi: 'Thử nghiệm 3' },
  sprintQualifying: { en: 'Sprint Qual.', vi: 'Phân hạng Sprint' },
  sprint: { en: 'Sprint', vi: 'Sprint' },
  qualifying: { en: 'Qualifying', vi: 'Phân hạng' },
  race: { en: 'Race', vi: 'Đua chính' },
};

const STATE_LABELS = {
  done: { en: 'Done', vi: 'Xong' },
  live: { en: 'Live', vi: 'Đang chạy' },
  upcoming: { en: 'Soon', vi: 'Sắp tới' },
} as const;

/**
 * Compact weekend schedule for the next round. Rows light up in sequence with
 * the pinned floor's scroll progress; live/done/upcoming state tracks the wall
 * clock already ticking in HomeRaceControl. Times honor the shared timezone
 * preference. Renders nothing when the round has no parseable session times.
 */
export function HomeSessionTimeline({ race, now }: { race?: GrandPrixRound; now: number }) {
  const lang = useNavigationStore((state) => state.lang);
  const preference = useTimezoneStore((state) => state.preference);
  const listRef = useRef<HTMLUListElement>(null);

  const sessions = useMemo(() => {
    if (!race) return [];
    return SESSION_ORDER.flatMap((key) => {
      const range = getSessionTimeRange(race, key);
      return range ? [{ key, range }] : [];
    });
  }, [race]);

  const formatter = useMemo(() => new Intl.DateTimeFormat(lang === 'vi' ? 'vi-VN' : 'en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    timeZone: effectiveTimeZone(preference), hourCycle: 'h23',
  }), [lang, preference]);

  const sessionKey = sessions.map((entry) => entry.key).join(',');

  useEffect(() => {
    const list = listRef.current;
    if (!list || sessions.length === 0) return;
    const rows = Array.from(list.querySelectorAll<HTMLElement>('[data-session-row]'));
    const step = .72 / Math.max(1, rows.length - 1);
    return subscribeHomeScrub('race-control', (progress) => {
      rows.forEach((row, index) => {
        row.dataset.scrubActive = String(progress > .16 + index * step);
      });
    });
  }, [sessionKey, sessions.length]);

  if (sessions.length === 0) return null;
  const vi = lang === 'vi';

  return (
    <div className="home-rc__sessions">
      <span className="home-rc__sessions-head">{vi ? 'LỊCH CUỐI TUẦN' : 'WEEKEND SESSIONS'}</span>
      <ul className="home-rc__session-list" ref={listRef} role="list">
        {sessions.map(({ key, range }) => {
          const state = now >= range.end.getTime() ? 'done' : now >= range.start.getTime() ? 'live' : 'upcoming';
          return (
            <li
              key={key}
              className="home-rc__session"
              data-session-row
              data-state={state}
              data-scrub-active="false"
            >
              <span className="home-rc__session-name">{SESSION_LABELS[key][lang]}</span>
              <time className="home-rc__session-time" dateTime={range.start.toISOString()}>{formatter.format(range.start)}</time>
              <span className="home-rc__session-state">{STATE_LABELS[state][lang]}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}