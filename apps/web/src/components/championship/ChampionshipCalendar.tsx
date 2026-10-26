import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { getCalendarBySeason } from '../../data/championship';
import { useChampionshipStore } from '../../store/useChampionshipStore';
import { useTimezoneStore } from '../../store/useTimezoneStore';
import type { SeasonYear } from '../../types';
import { formatRaceSessionTime } from '../../utils/championshipTimezone';
import { formatSessionName } from '../../utils/dateUtils';
import { getCalendarRaceState, getSessionTimeRange, type RaceSessionKey } from '../../utils/raceSchedule';
import { useNavigationStore } from '../../store/useNavigationStore';
import { TimezoneSelector } from './TimezoneSelector';
import { relevantRound } from '../../utils/relevantRace';

const ORDER: RaceSessionKey[] = ['fp1', 'fp2', 'fp3', 'sprintQualifying', 'sprint', 'qualifying', 'race'];

export function ChampionshipCalendar({ season }: { season: SeasonYear }) {
  const lang = useNavigationStore((state) => state.lang);
  const preference = useTimezoneStore((state) => state.preference);
  const setSelectedRaceRound = useChampionshipStore((state) => state.setSelectedRaceRound);
  const location = useLocation();
  const calendar = getCalendarBySeason(season);
  const [now, setNow] = useState(() => Date.now());
  const explicitRound = Number(new URLSearchParams(location.search).get('round'));
  const requestedRound = calendar.some((race) => race.round === explicitRound) ? explicitRound : null;
  const targetRound = requestedRound ?? relevantRound(calendar, now);
  const [expandedRound, setExpandedRound] = useState<number | null>(targetRound);
  const focusKey = `${season}:${requestedRound ?? 'relevant'}`;
  const focusedKey = useRef<string | null>(null);
  const userScrolled = useRef(false);
  const completedCount = calendar.filter((race) => getCalendarRaceState(race, now) === 'completed').length;

  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const timer = window.setInterval(refresh, 30_000);
    document.addEventListener('visibilitychange', refresh);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, []);

  useEffect(() => {
    if (focusedKey.current === focusKey || targetRound === null) return;
    userScrolled.current = false;
    setExpandedRound(targetRound);
    const cancel = () => { userScrolled.current = true; };
    window.addEventListener('wheel', cancel, { passive: true });
    window.addEventListener('touchstart', cancel, { passive: true });
    const timer = window.setTimeout(() => {
      if (!userScrolled.current) {
        document.getElementById(`calendar-round-${targetRound}`)?.scrollIntoView({
          block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        });
        focusedKey.current = focusKey;
      }
      window.removeEventListener('wheel', cancel);
      window.removeEventListener('touchstart', cancel);
    }, 120);
    return () => { window.clearTimeout(timer); window.removeEventListener('wheel', cancel); window.removeEventListener('touchstart', cancel); };
  }, [focusKey, targetRound]);

  const selectedRace = useMemo(() => calendar.find((race) => race.round === targetRound), [calendar, targetRound]);
  const jumpToRelevant = () => {
    if (targetRound === null) return;
    setExpandedRound(targetRound);
    document.getElementById(`calendar-round-${targetRound}`)?.scrollIntoView({
      block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  };

  return <section className="c1-calendar" aria-label={lang === 'vi' ? 'Lịch thi đấu' : 'Race calendar'}>
    <header className="c1-section-head">
      <div><p className="c1-eyebrow">{season} / {lang === 'vi' ? 'LỊCH ĐUA' : 'CALENDAR'}</p>
        <h2>{lang === 'vi' ? 'Cuối tuần đua' : 'Race weekends'}</h2>
        <p>{completedCount} / {calendar.length} {lang === 'vi' ? 'chặng đã qua theo lịch' : 'rounds elapsed by schedule'}</p>
      </div>
      <div className="c1-calendar-actions"><TimezoneSelector lang={lang} /><button type="button" onClick={jumpToRelevant} disabled={targetRound === null}>{lang === 'vi' ? 'Về chặng liên quan' : 'Relevant round'}{selectedRace ? ` · R${selectedRace.round}` : ''}</button></div>
    </header>
    <div className="c1-rounds">
      {calendar.map((race) => {
        const state = getCalendarRaceState(race, now);
        const expanded = expandedRound === race.round;
        const sessions = ORDER.filter((key) => Boolean(race.sessions[key]));
        const elapsed = sessions.filter((key) => (getSessionTimeRange(race, key)?.end.getTime() ?? Infinity) <= now).length;
        return <article key={race.round} id={`calendar-round-${race.round}`} className="c1-round" data-relevant={race.round === targetRound}>
          <button type="button" className="c1-round-toggle" aria-expanded={expanded} aria-controls={`schedule-${race.round}`} onClick={() => setExpandedRound(expanded ? null : race.round)}>
            <span className="c1-round-number">R{String(race.round).padStart(2, '0')}</span>
            <span className="c1-round-identity"><strong>{race.name}</strong><small>{race.country} · {race.circuit}{race.hasSprint ? ' · Sprint' : ''}</small></span>
            <span className="c1-round-state">{state === 'completed' ? (lang === 'vi' ? 'Đã qua' : 'Elapsed') : state === 'current' ? (lang === 'vi' ? 'Cuối tuần hiện tại' : 'Current weekend') : (lang === 'vi' ? 'Sắp tới' : 'Upcoming')}</span>
            {expanded ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
          </button>
          {expanded && <div id={`schedule-${race.round}`} className="c1-round-detail">
            <p className="c1-circuit"><MapPin size={15} aria-hidden="true" />{race.circuit}, {race.location}</p>
            <div className="c1-weekend-progress"><span>{lang === 'vi' ? 'Tiến độ lịch' : 'Weekend schedule'} · {elapsed}/{sessions.length}</span><progress value={elapsed} max={sessions.length} /></div>
            <div className="c1-session-list">{sessions.map((key) => {
              const session = race.sessions[key]!;
              const range = getSessionTimeRange(race, key);
              const status = range && now >= range.end.getTime() ? 'elapsed' : range && now >= range.start.getTime() ? 'scheduled-current' : 'upcoming';
              return <div key={key} className="c1-session">
                <strong>{formatSessionName(session.name, lang)}</strong>
                <time dateTime={range?.start.toISOString()}>{formatRaceSessionTime(race, key, preference, lang) ?? `${session.dateStr} · ${session.timeStr} ${lang === 'vi' ? '(giờ địa phương)' : '(venue time)'}`}</time>
                <span>{status === 'elapsed' ? (lang === 'vi' ? 'Đã qua theo lịch' : 'Scheduled time passed') : status === 'scheduled-current' ? (lang === 'vi' ? 'Đang trong khung giờ' : 'Within scheduled time') : (lang === 'vi' ? 'Sắp tới' : 'Upcoming')}</span>
              </div>;
            })}</div>
            <Link to={`/season/${season}?tab=results&round=${race.round}`} onClick={() => setSelectedRaceRound(null)}>{lang === 'vi' ? 'Xem kết quả chặng' : 'View round results'} →</Link>
          </div>}
        </article>;
      })}
    </div>
  </section>;
}
