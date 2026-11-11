import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { animate, createScope } from 'animejs';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  MapPin,
  Timer,
} from 'lucide-react';
import { getCalendarBySeason } from '../../data/championship';
import { getRaceResults } from '../../data/championship/results';
import { useChampionshipStore } from '../../store/useChampionshipStore';
import { useTimezoneStore } from '../../store/useTimezoneStore';
import type { SeasonYear } from '../../types';
import {
  effectiveTimeZone,
  browserTimeZone,
  formatRaceSessionTime,
  venueOffsetLabel,
  zoneOffsetLabel,
} from '../../utils/championshipTimezone';
import { formatSessionName } from '../../utils/dateUtils';
import {
  getCalendarRaceState,
  getSessionTimeRange,
  type RaceSessionKey,
} from '../../utils/raceSchedule';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useMotionGate } from '../../hooks/useMotionGate';
import { afterIntro } from '../../utils/afterIntro';
import { getTeamIdentityStyle } from '../../utils/teamColors';
import { VENUE_PLATE_LABEL, venuePlateFor } from '../../utils/venueArtwork';
import { CircuitTrace } from './CircuitTrace';
import { CircuitPhoto } from './CircuitPhoto';
import { SeasonalCircuitPhoto } from './SeasonalCircuitPhoto';
import { circuitVisual2026For } from '../../utils/circuitVisualAssets2026';
import { getSeasonCircuit, SEASONAL_ART_ENABLED, resolveCircuitVisual, circuitPreviewUrl } from '../../utils/seasonalVisuals';
import { TimezoneSelector } from './TimezoneSelector';
import { relevantRound } from '../../utils/relevantRace';
import { resolveCalendarEntry } from './calendarNavigation';
import './championshipC1.css';
import { BackToJourney, RaceCalendarJourney } from './RaceCalendarJourney';

const ORDER: RaceSessionKey[] = [
  'fp1',
  'fp2',
  'fp3',
  'sprintQualifying',
  'sprint',
  'qualifying',
  'race',
];

function renderSelectedDetail(host: HTMLDivElement | null, detail: ReactNode) {
  return host ? createPortal(detail, host) : detail;
}

const SESSION_CODE: Record<RaceSessionKey, string> = {
  fp1: 'FP1',
  fp2: 'FP2',
  fp3: 'FP3',
  sprintQualifying: 'SQ',
  sprint: 'SPRINT',
  qualifying: 'QUALI',
  race: 'RACE',
};

type CalendarFilter = 'all' | 'completed' | 'upcoming';

const FILTERS: { key: CalendarFilter; vi: string; en: string }[] = [
  { key: 'all', vi: 'Tất cả', en: 'All' },
  { key: 'completed', vi: 'Đã qua', en: 'Completed' },
  { key: 'upcoming', vi: 'Sắp tới', en: 'Upcoming' },
];

const readFilter = (search: string): CalendarFilter => {
  const value = new URLSearchParams(search).get('view');
  return value === 'completed' || value === 'upcoming' ? value : 'all';
};

const compactDates = (dates: string) =>
  dates
    .replace(/\s*\d{4}\s*$/, '')
    .replace(/\s*[–-]\s*/g, '–')
    .trim();

export function ChampionshipCalendar({ season }: { season: SeasonYear }) {
  const lang = useNavigationStore((state) => state.lang);
  const preference = useTimezoneStore((state) => state.preference);
  const setSelectedRaceRound = useChampionshipStore(
    (state) => state.setSelectedRaceRound,
  );
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const journeyMode = !query.has('round') && !['classic', 'completed', 'upcoming'].includes(query.get('view') ?? '');
  const navigate = useNavigate();
  const calendar = getCalendarBySeason(season);
  const [now, setNow] = useState(() => Date.now());
  const filter = readFilter(location.search);
  const explicitRound = Number(
    new URLSearchParams(location.search).get('round'),
  );
  const requestedRound = calendar.some((race) => race.round === explicitRound)
    ? explicitRound
    : null;
  const { expandedRound: deepLinkedRound, autoScrollRound } =
    resolveCalendarEntry(requestedRound);
  const targetRound = requestedRound ?? relevantRound(calendar, now);
  const [expandedRound, setExpandedRound] = useState<number | null>(
    deepLinkedRound,
  );
  const [detailHost, setDetailHost] = useState<HTMLDivElement | null>(null);
  const deepLinkKey =
    autoScrollRound === null ? null : `${season}:${autoScrollRound}`;
  const scrolledDeepLinkKey = useRef<string | null>(null);
  const rootRef = useRef<HTMLElement | null>(null);
  const roundsRef = useRef<HTMLDivElement | null>(null);
  const motionEnabled = useMotionGate();
  const completedCount = calendar.filter(
    (race) => getCalendarRaceState(race, now) === 'completed',
  ).length;
  const upcomingCount = calendar.length - completedCount;
  const states = new Map(
    calendar.map((race) => [race.round, getCalendarRaceState(race, now)]),
  );

  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const timer = window.setInterval(refresh, 30_000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  useEffect(() => {
    setExpandedRound(requestedRound);
  }, [requestedRound, season]);

  useEffect(() => {
    const scroller = roundsRef.current;
    if (!scroller || expandedRound === null) return;
    if (scroller.scrollHeight <= scroller.clientHeight + 4) return;
    const row = scroller.querySelector<HTMLElement>(
      `#calendar-round-${expandedRound}`,
    );
    if (!row) return;
    const frame = window.requestAnimationFrame(() => {
      const viewport = scroller.getBoundingClientRect();
      const box = row.getBoundingClientRect();
      const detail = row.querySelector<HTMLElement>('.c1-round-detail');
      const bottom = (detail ?? row).getBoundingClientRect().bottom;
      if (bottom <= viewport.bottom - 4) return;
      const stack = bottom - box.top;
      scroller.scrollTo({
        top:
          stack <= viewport.height
            ? scroller.scrollTop + box.top - viewport.top - 4
            : scroller.scrollTop + bottom - viewport.bottom + 12,
        behavior: 'auto',
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [expandedRound, journeyMode]);

  useEffect(() => {
    if (expandedRound === null || requestedRound !== null || !detailHost ||
      !window.matchMedia('(max-width: 760px)').matches) return;
    const frame = window.requestAnimationFrame(() => {
      detailHost.scrollIntoView({
        block: 'start',
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant' : 'smooth',
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [expandedRound, requestedRound, detailHost]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !motionEnabled) return;

    const scope = createScope({ root });
    let observer: IntersectionObserver | null = null;
    let cancelled = false;
    let started = false;

    const reveal = (group: Element) => {
      if (cancelled) return;
      const kind = group.getAttribute('data-cal-group');
      scope.add(() => {
        if (kind === 'hero') {
          animate(group.querySelectorAll('.cal-hero-copy > *, .cal-hero-visual'), {
            opacity: [0.35, 1],
            translateY: [18, 0],
            duration: 560,
            ease: 'out(4)',
            delay: (_: unknown, index = 0) => index * 60,
          });
          const media = group.querySelector('.cal-hero-media');
          if (media) {
            animate(media, {
              opacity: [0.55, 1],
              scale: [1.04, 1],
              duration: 700,
              ease: 'out(3)',
            });
          }
        } else if (kind === 'next') {
          animate(group.querySelectorAll('.cal-next-copy > *, .cal-next-side > *'), {
            opacity: [0.35, 1],
            translateY: [16, 0],
            duration: 520,
            ease: 'out(4)',
            delay: (_: unknown, index = 0) => 80 + index * 55,
          });
        } else if (kind === 'rail') {
          animate(Array.from(group.querySelectorAll('.c1-round')).slice(0, 12), {
            opacity: [0.4, 1],
            translateY: [10, 0],
            duration: 380,
            ease: 'out(4)',
            delay: (_: unknown, index = 0) => index * 26,
          });
        }
      });
    };

    const start = () => {
      if (cancelled || started) return;
      started = true;
      const groups = Array.from(root.querySelectorAll('[data-cal-group]'));
      const hero = groups.find((group) => group.getAttribute('data-cal-group') === 'hero');
      if (hero) reveal(hero);
      const rest = groups.filter((group) => group !== hero);
      if (!('IntersectionObserver' in window)) {
        rest.forEach(reveal);
        return;
      }
      observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          reveal(entry.target);
          observer?.unobserve(entry.target);
        }
      }, { threshold: 0.18 });
      rest.forEach((group) => observer?.observe(group));
    };

    const cancelIntroGate = afterIntro(start);

    return () => {
      cancelled = true;
      cancelIntroGate();
      observer?.disconnect();
      scope.revert();
    };
  }, [motionEnabled, journeyMode]);

  useEffect(() => {
    if (
      deepLinkKey === null ||
      autoScrollRound === null ||
      scrolledDeepLinkKey.current === deepLinkKey
    )
      return;
    let userScrolled = false;
    const cancel = () => {
      userScrolled = true;
    };
    window.addEventListener('wheel', cancel, { passive: true });
    window.addEventListener('touchstart', cancel, { passive: true });
    const timer = window.setTimeout(() => {
      if (!userScrolled) {
        const destination = window.matchMedia('(max-width: 760px)').matches
          ? detailHost
          : document.getElementById(`calendar-round-${autoScrollRound}`);
        destination?.scrollIntoView({
            block: 'start',
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)')
              .matches
              ? 'instant'
              : 'smooth',
          });
        scrolledDeepLinkKey.current = deepLinkKey;
      }
      window.removeEventListener('wheel', cancel);
      window.removeEventListener('touchstart', cancel);
    }, 120);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('wheel', cancel);
      window.removeEventListener('touchstart', cancel);
    };
  }, [autoScrollRound, deepLinkKey, detailHost]);

  const nextRace = useMemo(
    () =>
      calendar.find((race) => getCalendarRaceState(race, now) === 'current') ??
      calendar.find((race) => getCalendarRaceState(race, now) === 'upcoming') ??
      null,
    [calendar, now],
  );
  const lastRace = calendar[calendar.length - 1] ?? null;
  const previousRace = useMemo(() => {
    const completed = calendar.filter(
      (race) => getCalendarRaceState(race, now) === 'completed',
    );
    return completed[completed.length - 1] ?? null;
  }, [calendar, now]);
  const upcomingRace = useMemo(
    () =>
      nextRace
        ? (calendar.find((race) => race.round > nextRace.round) ?? null)
        : null,
    [calendar, nextRace],
  );
  const previousResult = useMemo(
    () =>
      previousRace
        ? (getRaceResults(season).find(
            (result) => result.round === previousRace.round,
          ) ?? null)
        : null,
    [previousRace, season],
  );
  const visibleRounds = calendar.filter(
    (race) =>
      filter === 'all' ||
      (filter === 'completed'
        ? states.get(race.round) === 'completed'
        : states.get(race.round) !== 'completed') ||
      race.round === requestedRound,
  );

  const changeFilter = (next: CalendarFilter) => {
    setExpandedRound(null);
    const params = new URLSearchParams(location.search);
    if (next === 'all') params.delete('view');
    else params.set('view', next);
    const query = params.toString();
    navigate(`${location.pathname}${query ? `?${query}` : ''}${location.hash}`);
  };
  const jumpToRound = (round: number | null) => {
    if (round === null) return;
    if (filter !== 'all') changeFilter('all');
    setExpandedRound(round);
    window.setTimeout(() => {
      document.getElementById(`calendar-round-${round}`)?.scrollIntoView({
        block: 'start',
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)')
          .matches
          ? 'instant'
          : 'smooth',
      });
    }, 80);
  };
  const jumpToRelevant = () => jumpToRound(targetRound);

  const nextRaceState = nextRace
    ? getCalendarRaceState(nextRace, now)
    : null;
  const nextSessions = nextRace
    ? ORDER.filter((key) => Boolean(nextRace.sessions[key]))
    : [];
  const nextSession = nextRace
    ? nextSessions
        .map((key) => ({ key, range: getSessionTimeRange(nextRace, key) }))
        .filter(
          (entry): entry is { key: RaceSessionKey; range: NonNullable<ReturnType<typeof getSessionTimeRange>> } =>
            entry.range !== null && entry.range.start.getTime() > now,
        )
        .sort((a, b) => a.range.start.getTime() - b.range.start.getTime())[0]
    : undefined;
  const raceRange = nextRace ? getSessionTimeRange(nextRace, 'race') : null;
  const countdownTarget = raceRange?.start.getTime() ?? null;
  const venueHours = preference === 'venue' ? nextRace?.venueUtcOffset : undefined;
  const timeZone = venueHours === undefined ? effectiveTimeZone(preference) : 'UTC';
  const displayInstant = (date: Date) => venueHours === undefined ? date : new Date(date.getTime() + venueHours * 60 * 60 * 1000);
  const scheduleOffset = raceRange
    ? venueHours === undefined ? zoneOffsetLabel(raceRange.start, preference) : venueOffsetLabel(venueHours)
    : 'UTC';
  const clockFormat = useMemo(
    () =>
      new Intl.DateTimeFormat('en-GB', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }),
    [timeZone],
  );
  const dayFormat = useMemo(
    () =>
      new Intl.DateTimeFormat(lang === 'vi' ? 'vi-VN' : 'en-GB', {
        timeZone,
        weekday: 'short',
        day: '2-digit',
        month: 'short',
      }),
    [lang, timeZone],
  );
  const nextCircuit = nextRace ? getSeasonCircuit(season, nextRace.round) : undefined;
  const nextVisual = circuitVisual2026For(season, nextCircuit?.id);
  const reviewNext = nextRace && SEASONAL_ART_ENABLED && !!resolveCircuitVisual(season, nextRace.round);
  const previousCircuit = previousRace
    ? getSeasonCircuit(season, previousRace.round)
    : undefined;
  const upcomingCircuit = upcomingRace
    ? getSeasonCircuit(season, upcomingRace.round)
    : undefined;
  const previousPlate = venuePlateFor(previousCircuit?.id);
  const upcomingPlate = venuePlateFor(upcomingCircuit?.id);
  const stateLabel = (state: string) =>
    state === 'completed'
      ? lang === 'vi'
        ? 'Đã qua'
        : 'Completed'
      : state === 'current'
        ? lang === 'vi'
          ? 'Cuối tuần hiện tại'
          : 'Current weekend'
        : lang === 'vi'
          ? 'Sắp tới'
          : 'Upcoming';

  return (
    <>
      {!journeyMode && <BackToJourney season={season} tab="calendar" round={requestedRound} />}
      {journeyMode ? <RaceCalendarJourney season={season} /> : (
    <section
      ref={rootRef}
      className="c1-calendar"
      data-motion-engine={motionEnabled ? 'animejs' : 'static'}
      aria-label={lang === 'vi' ? 'Lịch thi đấu' : 'Race calendar'}
    >
      <header className="results-simple-head">
        <div>
          <h2>{lang === 'vi' ? 'Lịch thi đấu' : 'Race calendar'}</h2>
          <p>{completedCount}/{calendar.length} {lang === 'vi' ? 'chặng đã qua' : 'rounds completed'}</p>
        </div>
        <div className="c1-calendar-actions">
          <details className="cal-timezone-more">
            <summary>{lang === 'vi' ? 'Giờ hiển thị' : 'Displayed time'} · {venueHours !== undefined
              ? `${nextRace?.location} ${venueOffsetLabel(venueHours)}`
              : preference === 'local'
                ? `${lang === 'vi' ? 'Thiết bị' : 'Your device'} · ${browserTimeZone()} ${zoneOffsetLabel(raceRange?.start ?? new Date(), preference)}`
                : zoneOffsetLabel(raceRange?.start ?? new Date(), preference)}</summary>
            <TimezoneSelector lang={lang} venue={nextRace ?? undefined} />
          </details>
          <button type="button" onClick={jumpToRelevant} disabled={targetRound === null}>
            {lang === 'vi' ? 'Đến chặng liên quan' : 'Go to relevant round'}
          </button>
        </div>
      </header>
      <div className="cal-layout" data-selected-round={expandedRound ?? undefined}>
        <div className="cal-stream" data-selected-round={expandedRound ?? undefined}>
        <section
          className="cal-feature"
          aria-labelledby={nextRace ? 'cal-next-title' : undefined}
        >
          {nextRace ? (
            <article
              className="cal-next"
              data-next-round={nextRace.round}
              data-state={nextRaceState ?? 'upcoming'}
              data-cal-group="next"
            >
              <figure className="cal-next-visual">
                {reviewNext ? (
                  <SeasonalCircuitPhoto key={`${season}-${nextRace.round}`} season={season} round={nextRace.round} sizes="(max-width: 760px) 100vw, 760px" fallback="/images/championship/template/cal-next-1200.webp" />
                ) : nextVisual ? (
                  <CircuitPhoto key={nextVisual.circuitId} visual={nextVisual} sizes="(max-width: 760px) 100vw, 760px" fallback="/images/championship/template/cal-next-1200.webp" />
                ) : <picture>
                  <source
                    type="image/avif"
                    srcSet="/images/championship/template/cal-next-800.avif 800w, /images/championship/template/cal-next-1200.avif 1200w"
                    sizes="(max-width: 760px) 100vw, 760px"
                  />
                  <source
                    type="image/webp"
                    srcSet="/images/championship/template/cal-next-800.webp 800w, /images/championship/template/cal-next-1200.webp 1200w"
                    sizes="(max-width: 760px) 100vw, 760px"
                  />
                  <img
                    src="/images/championship/template/cal-next-1200.webp"
                    alt=""
                    width={1200}
                    height={800}
                    loading="lazy"
                    decoding="async"
                  />
                </picture>}
                <figcaption>
                  {reviewNext
                    ? (lang === 'vi' ? 'Ảnh minh họa AI' : 'AI illustration')
                    : nextVisual
                    ? <><a href={nextVisual.sourcePage} target="_blank" rel="noreferrer">{nextVisual.credit}</a> · <a href={nextVisual.licenseUrl} target="_blank" rel="noreferrer">{nextVisual.license}</a> · {lang === 'vi' ? 'đã cắt' : 'cropped'}</>
                    : lang === 'vi'
                      ? 'Ảnh minh họa · không phải địa điểm thật'
                      : 'Editorial artwork · illustrative, not the venue'}
                </figcaption>
              </figure>
              <div className="cal-next-copy">
                <p className="cal-next-eyebrow">
                  {nextRaceState === 'current'
                    ? lang === 'vi'
                      ? 'CUỐI TUẦN NÀY'
                      : 'THIS WEEKEND'
                    : lang === 'vi'
                      ? 'CHẶNG TIẾP THEO'
                      : 'NEXT RACE'}
                </p>
                <p className="cal-next-round">
                  <span>R{String(nextRace.round).padStart(2, '0')}</span>
                  <span aria-hidden="true">{nextRace.flag}</span>
                  {nextRace.country}
                </p>
                <h3 id="cal-next-title">{nextRace.name}</h3>
                <p className="cal-next-meta">
                  <MapPin size={14} aria-hidden="true" />
                  {nextRace.circuit} · {nextRace.location}
                </p>
                <p className="cal-next-dates">{nextRace.dates}</p>
                <div className="cal-next-actions">
                  <Link
                    className="cal-next-cta"
                    to={`/season/${season}?tab=results&round=${nextRace.round}`}
                    onClick={() => setSelectedRaceRound(null)}
                  >
                    {lang === 'vi' ? 'Mở trung tâm kết quả' : 'Open Race Center'}
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    className="cal-next-secondary"
                    onClick={() => jumpToRound(nextRace.round)}
                  >
                    {lang === 'vi' ? 'Chi tiết chặng' : 'Race details'}
                  </button>
                </div>
              </div>
              <div className="cal-next-side">
                {countdownTarget !== null && (
                  <Countdown
                    target={countdownTarget}
                    now={now}
                    lang={lang}
                    label={
                      lang === 'vi'
                        ? 'Đếm ngược tới giờ xuất phát'
                        : 'Lights out in'
                    }
                  />
                )}
                {nextSession && (
                  <div className="cal-next-session">
                    <p>
                      <Clock3 size={14} aria-hidden="true" />
                      {lang === 'vi' ? 'Phiên kế tiếp' : 'Next session'}
                    </p>
                    <strong>
                      {formatSessionName(
                        nextRace.sessions[nextSession.key]?.name,
                        lang,
                      )}
                    </strong>
                    <span>
                      {formatRaceSessionTime(
                        nextRace,
                        nextSession.key,
                        preference,
                        lang,
                      ) ?? '—'}
                    </span>
                  </div>
                )}
              </div>
            </article>
          ) : (
            <div className="cal-next cal-season-complete">
              <header className="cal-next-head">
                <p className="cal-next-eyebrow">
                  {lang === 'vi' ? 'Mùa giải đã kết thúc' : 'Season complete'}
                </p>
                <h3>{lang === 'vi' ? 'Không còn chặng nào' : 'No races remaining'}</h3>
                <p className="cal-next-meta">
                  {lang === 'vi'
                    ? 'Mọi chặng trong lịch đã qua theo giờ thi đấu.'
                    : 'Every scheduled round has passed by session time.'}
                </p>
              </header>
              {lastRace && (
                <div className="cal-next-session">
                  <p>
                    <CheckCircle2 size={14} aria-hidden="true" />
                    {lang === 'vi' ? 'Chặng cuối' : 'Final round'}
                  </p>
                  <strong>
                    R{String(lastRace.round).padStart(2, '0')} · {lastRace.name}
                  </strong>
                  <span>{lastRace.dates}</span>
                  <Link
                    to={`/season/${season}?tab=results&round=${lastRace.round}`}
                    onClick={() => setSelectedRaceRound(null)}
                  >
                    {lang === 'vi' ? 'Xem kết quả chặng cuối' : 'View final round results'} →
                  </Link>
                </div>
              )}
            </div>
          )}
        </section>
        <div className="cal-main">
          {nextRace && nextSessions.length > 0 && (
            <section
              className="cal-weekend"
              id="calendar-weekend"
              aria-labelledby="cal-weekend-title"
            >
              <header className="cal-section-head">
                <div>
                  <p className="cal-section-eyebrow">
                    R{String(nextRace.round).padStart(2, '0')} ·{' '}
                    {compactDates(nextRace.dates)}
                  </p>
                  <h3 id="cal-weekend-title">
                    {lang === 'vi'
                      ? 'Lịch cuối tuần thi đấu'
                      : 'Race weekend schedule'}
                  </h3>
                </div>
                <p className="cal-weekend-note">
                  {lang === 'vi' ? 'Giờ · ' : 'All times · '}
                  {scheduleOffset}
                </p>
              </header>
              <div className="cal-weekend-grid">
                {nextSessions.map((key) => {
                  const range = getSessionTimeRange(nextRace, key);
                  const partialLabel = [
                    nextRace.sessions[key]?.dateStr,
                    nextRace.sessions[key]?.timeStr,
                  ]
                    .map((part) => part?.trim())
                    .filter(Boolean)
                    .join(' · ');
                  const state = range
                    ? now >= range.end.getTime()
                      ? 'elapsed'
                      : now >= range.start.getTime()
                        ? 'live'
                        : 'upcoming'
                    : 'upcoming';
                  return (
                    <article
                      key={key}
                      className="cal-session-card"
                      data-session={key}
                      data-state={state}
                    >
                      <header>
                        <strong>{SESSION_CODE[key]}</strong>
                        <small>
                          {formatSessionName(nextRace.sessions[key]?.name, lang)}
                        </small>
                      </header>
                      {range ? (
                        <>
                          <p className="cal-session-day">
                            {dayFormat.format(displayInstant(range.start))}
                          </p>
                          <p className="cal-session-time">
                            {clockFormat.format(displayInstant(range.start))}–
                            {clockFormat.format(displayInstant(range.end))}
                          </p>
                          <p className="cal-session-state">
                            {state === 'elapsed'
                              ? lang === 'vi'
                                ? 'Đã qua theo lịch'
                                : 'Completed'
                              : state === 'live'
                                ? lang === 'vi'
                                  ? 'Trong khung giờ'
                                  : 'Live window'
                                : lang === 'vi'
                                  ? 'Sắp tới'
                                  : 'Upcoming'}
                          </p>
                        </>
                      ) : (
                        <p className="cal-session-state">
                          {partialLabel ||
                            (lang === 'vi'
                              ? 'Chưa có giờ xác nhận'
                              : 'Time to be confirmed')}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          )}
          {nextRace && (
            <details className="cal-more">
              <summary>{lang === 'vi' ? 'Thông tin đường đua' : 'Circuit details'}</summary>
            <section
              className="cal-band"
              aria-label={
                lang === 'vi'
                  ? 'Thông số đường đua và ghi chú'
                  : 'Circuit specifications and notes'
              }
            >
              <figure className="cal-band-outline" id="calendar-circuit">
                <CircuitTrace
                  circuit={nextCircuit}
                  variant="detail"
                  className="cal-band-trace"
                />
                <figcaption>
                  <strong>{nextCircuit?.circuitName ?? nextRace.circuit}</strong>
                  <span>
                    {lang === 'vi'
                      ? 'Sơ đồ từ kho dữ liệu · minh họa, không phải bản đồ FIA chính thức.'
                      : 'Repository schematic · illustrative, not an official FIA map.'}
                  </span>
                </figcaption>
                <button
                  type="button"
                  className="cal-band-signal"
                  onClick={() => jumpToRound(nextRace.round)}
                >
                  {lang === 'vi' ? 'Chi tiết chặng' : 'Race details'}
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
              </figure>
              <dl className="cal-band-specs">
                <div>
                  <dt>{lang === 'vi' ? 'Chiều dài vòng' : 'Circuit length'}</dt>
                  <dd>
                    {nextRace.circuitLengthKm.toFixed(3)}
                    <span> km</span>
                  </dd>
                </div>
                <div>
                  <dt>{lang === 'vi' ? 'Khúc cua' : 'Turns'}</dt>
                  <dd>
                    {nextCircuit?.telemetry.turns.total ?? '—'}
                    {nextCircuit && (
                      <span>
                        {' '}
                        {nextCircuit.telemetry.direction === 'clockwise'
                          ? '↻'
                          : '↺'}
                      </span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>{lang === 'vi' ? 'Cự ly đua' : 'Race distance'}</dt>
                  <dd>
                    {nextRace.raceDistanceKm.toFixed(3)}
                    <span> km</span>
                  </dd>
                </div>
                <div>
                  <dt>{lang === 'vi' ? 'Kỷ lục vòng' : 'Lap record'}</dt>
                  <dd>
                    {nextRace.lapRecord ? (
                      <>
                        {nextRace.lapRecord.time}
                        <span>
                          {nextRace.lapRecord.driver} · {nextRace.lapRecord.year}
                        </span>
                      </>
                    ) : (
                      '—'
                    )}
                  </dd>
                </div>
              </dl>
              <article className="cal-band-editorial">
                <picture aria-hidden="true">
                  <source
                    type="image/avif"
                    srcSet="/images/championship/template/cal-editorial-640.avif 640w, /images/championship/template/cal-editorial-1000.avif 1000w"
                    sizes="(max-width: 760px) 100vw, 420px"
                  />
                  <source
                    type="image/webp"
                    srcSet="/images/championship/template/cal-editorial-640.webp 640w, /images/championship/template/cal-editorial-1000.webp 1000w"
                    sizes="(max-width: 760px) 100vw, 420px"
                  />
                  <img
                    src="/images/championship/template/cal-editorial-1000.webp"
                    alt=""
                    width={1000}
                    height={750}
                    loading="lazy"
                    decoding="async"
                  />
                </picture>
                <div className="cal-band-editorial-copy">
                  <p className="cal-section-eyebrow">
                    {lang === 'vi' ? 'Đua đêm' : 'Night racing'}
                  </p>
                  <h3>
                    {lang === 'vi'
                      ? 'Khi đèn pha bật sáng'
                      : 'When the lights come on'}
                  </h3>
                  <p>
                    {lang === 'vi'
                      ? 'Không khí mát hơn, đĩa phanh rực sáng và mặt đường thay đổi từng vòng. Mỗi phiên đêm là một bài kiểm tra bản lĩnh.'
                      : 'Cooler air, glowing brake discs and a track that changes lap by lap. Every night session is a test of nerve.'}
                  </p>
                  <button type="button" onClick={() => jumpToRound(nextRace.round)}>
                    {lang === 'vi' ? 'Chi tiết chặng' : 'Race weekend'}
                    <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </div>
              </article>
            </section>
            </details>
          )}
          {(previousRace || upcomingRace) && (
            <section
              className="cal-cards"
              aria-label={
                lang === 'vi'
                  ? 'Chặng trước và chặng sắp tới'
                  : 'Previous and upcoming rounds'
              }
            >
              {previousRace && (
                <article className="cal-racecard" data-kind="previous">
                  <figure className="cal-racecard-media" aria-hidden="true">
                    {SEASONAL_ART_ENABLED ? <SeasonalCircuitPhoto season={season} round={previousRace.round} fallback={`/images/championship/template/venue-${previousPlate}-1024.webp`} sizes="(max-width: 760px) 100vw, 260px" /> : <picture>
                      <source
                        type="image/avif"
                        srcSet={`/images/championship/template/venue-${previousPlate}-640.avif 640w, /images/championship/template/venue-${previousPlate}-1024.avif 1024w`}
                        sizes="(max-width: 760px) 100vw, 260px"
                      />
                      <img
                        src={`/images/championship/template/venue-${previousPlate}-1024.webp`}
                        alt=""
                        width={1024}
                        height={585}
                        loading="lazy"
                        decoding="async"
                      />
                    </picture>}
                  </figure>
                  <div className="cal-racecard-body">
                    <p className="cal-section-eyebrow">
                      {lang === 'vi' ? 'Chặng vừa qua' : 'Previous race'}
                    </p>
                    <p className="cal-racecard-round">
                      <span>R{String(previousRace.round).padStart(2, '0')}</span>
                      <span aria-hidden="true">{previousRace.flag}</span>
                      {previousRace.country}
                    </p>
                    <h3>{previousRace.name}</h3>
                    <p className="cal-racecard-meta">
                      {previousRace.circuit} · {compactDates(previousRace.dates)}
                    </p>
                    {previousResult ? (
                      <ol className="cal-podium">
                        {[
                          { pos: 1, row: previousResult.podium.p1 },
                          { pos: 2, row: previousResult.podium.p2 },
                          { pos: 3, row: previousResult.podium.p3 },
                        ].map(({ pos, row }) => (
                          <li
                            key={pos}
                            style={getTeamIdentityStyle(row.team)}
                          >
                            <span>{pos}</span>
                            <span className="cal-podium-driver">
                              {row.driver}
                              <small>{row.team}</small>
                            </span>
                            <span className="cal-podium-time">
                              {'time' in row ? row.time : row.gap}
                            </span>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="cal-racecard-empty">
                        {lang === 'vi'
                          ? 'Chưa có kết quả podium đã xác minh cho chặng này.'
                          : 'Verified podium not published for this round yet.'}
                      </p>
                    )}
                    <Link
                      className="cal-racecard-link"
                      to={`/season/${season}?tab=results&round=${previousRace.round}`}
                      onClick={() => setSelectedRaceRound(null)}
                    >
                      {lang === 'vi' ? 'Xem toàn bộ kết quả' : 'View full results'}
                      <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              )}
              {upcomingRace && (
                <article className="cal-racecard" data-kind="upcoming">
                  <figure className="cal-racecard-media" aria-hidden="true">
                    {SEASONAL_ART_ENABLED ? <SeasonalCircuitPhoto season={season} round={upcomingRace.round} fallback={`/images/championship/template/venue-${upcomingPlate}-1024.webp`} sizes="(max-width: 760px) 100vw, 260px" /> : <picture>
                      <source
                        type="image/avif"
                        srcSet={`/images/championship/template/venue-${upcomingPlate}-640.avif 640w, /images/championship/template/venue-${upcomingPlate}-1024.avif 1024w`}
                        sizes="(max-width: 760px) 100vw, 260px"
                      />
                      <img
                        src={`/images/championship/template/venue-${upcomingPlate}-1024.webp`}
                        alt=""
                        width={1024}
                        height={585}
                        loading="lazy"
                        decoding="async"
                      />
                    </picture>}
                  </figure>
                  <div className="cal-racecard-body">
                    <p className="cal-section-eyebrow">
                      {lang === 'vi' ? 'Chặng sắp tới' : 'Upcoming race'}
                    </p>
                    <p className="cal-racecard-round">
                      <span>R{String(upcomingRace.round).padStart(2, '0')}</span>
                      <span aria-hidden="true">{upcomingRace.flag}</span>
                      {upcomingRace.country}
                    </p>
                    <h3>{upcomingRace.name}</h3>
                    <p className="cal-racecard-meta">
                      {upcomingRace.circuit} · {compactDates(upcomingRace.dates)}
                    </p>
                    <p className="cal-racecard-status">
                      <CalendarDays size={14} aria-hidden="true" />
                      {lang === 'vi' ? 'Sắp tới' : 'Upcoming'}
                    </p>
                    <p className="cal-racecard-credit">
                      {lang === 'vi'
                        ? VENUE_PLATE_LABEL[upcomingPlate].vi
                        : VENUE_PLATE_LABEL[upcomingPlate].en}
                    </p>
                    <button
                      type="button"
                      className="cal-racecard-link"
                      onClick={() => jumpToRound(upcomingRace.round)}
                    >
                      {lang === 'vi' ? 'Lịch cuối tuần' : 'Race weekend'}
                      <ArrowRight size={14} aria-hidden="true" />
                    </button>
                  </div>
                </article>
              )}
            </section>
          )}
        </div>
          <div className="cal-selected-host" ref={setDetailHost} />
        </div>
        <aside
          className="cal-rail"
          data-cal-group="rail"
          aria-label={lang === 'vi' ? 'Danh sách chặng' : 'Round list'}
        >
          <div
            className="cal-filters"
            role="group"
            aria-label={
              lang === 'vi' ? 'Lọc chặng theo trạng thái' : 'Filter rounds'
            }
          >
            {FILTERS.map((item) => {
              const count =
                item.key === 'all'
                  ? calendar.length
                  : item.key === 'completed'
                    ? completedCount
                    : upcomingCount;
              return (
                <button
                  key={item.key}
                  type="button"
                  className="cal-filter"
                  data-filter={item.key}
                  aria-pressed={filter === item.key}
                  onClick={() => changeFilter(item.key)}
                >
                  {lang === 'vi' ? item.vi : item.en}
                  <span>{count}</span>
                </button>
              );
            })}
          </div>
          <div className="c1-rounds" ref={roundsRef}>
            {visibleRounds.length === 0 && (
              <p className="cal-empty" role="status">
                {lang === 'vi'
                  ? 'Không có chặng nào trong bộ lọc này.'
                  : 'No rounds match this filter.'}
              </p>
            )}
            {visibleRounds.map((race) => {
              const state = states.get(race.round) ?? 'upcoming';
              const expanded = expandedRound === race.round;
              const circuit = getSeasonCircuit(season, race.round);
              const detailVisual = circuitVisual2026For(season, circuit?.id);
              const reviewVisual = SEASONAL_ART_ENABLED ? resolveCircuitVisual(season, race.round) : undefined;
              const sessions = ORDER.filter((key) =>
                Boolean(race.sessions[key]),
              );
              const elapsed = sessions.filter(
                (key) =>
                  (getSessionTimeRange(race, key)?.end.getTime() ?? Infinity) <=
                  now,
              ).length;
              return (
                <article
                  key={race.round}
                  id={`calendar-round-${race.round}`}
                  className="c1-round"
                  data-relevant={race.round === targetRound}
                  data-state={state}
                >
                  <button
                    type="button"
                    className="c1-round-toggle"
                    aria-expanded={expanded}
                    aria-controls={`schedule-${race.round}`}
                    onClick={() =>
                      setExpandedRound(expanded ? null : race.round)
                    }
                  >
                    <span
                      className="cal-round-dot"
                      data-state={state}
                      aria-hidden="true"
                    />
                    <span className="c1-round-number">
                      R{String(race.round).padStart(2, '0')}
                    </span>
                    <span className="cal-round-flag" aria-hidden="true">
                      {race.flag}
                    </span>
                    {(reviewVisual || detailVisual) && (
                      <img className="cal-round-thumb" src={reviewVisual ? circuitPreviewUrl(reviewVisual, 'thumbnail') : detailVisual?.thumbnail} alt="" width={64} height={48} loading="lazy" decoding="async" />
                    )}
                    <span className="c1-round-identity">
                      <strong>{race.name}</strong>
                      {race.hasSprint && (
                        <small>{lang === 'vi' ? 'Có Sprint' : 'Sprint'}</small>
                      )}
                      <span className="cal-sr">{stateLabel(state)}</span>
                    </span>
                    <span className="cal-round-date">
                      {compactDates(race.dates)}
                    </span>
                    {expanded ? (
                      <ChevronUp size={16} aria-hidden="true" />
                    ) : (
                      <ChevronDown size={16} aria-hidden="true" />
                    )}
                  </button>
                  {expanded && renderSelectedDetail(detailHost,
                    <div id={`schedule-${race.round}`} className="c1-round-detail">
                      <div className="cal-selected-heading">
                        <span>R{String(race.round).padStart(2, '0')} / {season}</span>
                        <h3>{race.name}</h3>
                        <button type="button" onClick={() => setExpandedRound(null)}>
                          {lang === 'vi' ? 'Đóng chi tiết' : 'Close details'}
                        </button>
                      </div>
                      {(reviewVisual || detailVisual) && (
                        <figure className="cal-detail-photo">
                          {reviewVisual
                            ? <SeasonalCircuitPhoto season={season} round={race.round} fallback="/images/championship/template/cal-hero-1344.webp" sizes="(max-width: 760px) 100vw, 900px" />
                            : <CircuitPhoto visual={detailVisual} fallback="/images/championship/template/cal-hero-1344.webp" sizes="(max-width: 760px) 100vw, 900px" />}
                          <figcaption>{reviewVisual ? (lang === 'vi' ? 'Ảnh minh họa AI' : 'AI illustration') : detailVisual && <>{lang === 'vi' ? 'Ảnh đường đua' : 'Circuit photo'} · <a href={detailVisual.sourcePage} target="_blank" rel="noreferrer">{detailVisual.credit}</a> · <a href={detailVisual.licenseUrl} target="_blank" rel="noreferrer">{detailVisual.license}</a> · {lang === 'vi' ? 'đã cắt' : 'cropped'}</>}</figcaption>
                        </figure>
                      )}
                      <div className="cal-detail-top">
                        <figure className="cal-detail-circuit">
                          <CircuitTrace
                            circuit={circuit}
                            variant="detail"
                            className="cal-detail-trace"
                          />
                          <figcaption>
                            <strong>
                              {circuit?.circuitName ?? race.circuit}
                            </strong>
                            <span>
                              {lang === 'vi'
                                ? 'Sơ đồ từ kho dữ liệu · hình minh họa, không phải bản đồ FIA chính thức.'
                                : 'Repository schematic · illustrative, not an official FIA map.'}
                            </span>
                          </figcaption>
                        </figure>
                        <div className="cal-detail-meta">
                          <p className="c1-circuit">
                            <MapPin size={15} aria-hidden="true" />
                            {race.circuit}, {race.location}
                          </p>
                          <div className="c1-weekend-progress">
                            <span>
                              {lang === 'vi' ? 'Tiến độ lịch' : 'Weekend schedule'} ·{' '}
                              {elapsed}/{sessions.length}
                            </span>
                            <progress value={elapsed} max={sessions.length} />
                          </div>
                        </div>
                      </div>
                      <div className="c1-session-list">
                        {sessions.map((key) => {
                          const session = race.sessions[key]!;
                          const range = getSessionTimeRange(race, key);
                          const fallbackTime = [session.dateStr, session.timeStr]
                            .map((part) => part?.trim())
                            .filter(Boolean)
                            .join(' · ');
                          const status =
                            range && now >= range.end.getTime()
                              ? 'elapsed'
                              : range && now >= range.start.getTime()
                                ? 'scheduled-current'
                                : 'upcoming';
                          return (
                            <div key={key} className="c1-session" data-state={status}>
                              <strong>
                                {formatSessionName(session.name, lang)}
                              </strong>
                              <time dateTime={range?.start.toISOString()}>
                                {formatRaceSessionTime(
                                  race,
                                  key,
                                  preference,
                                  lang,
                                ) ??
                                  (fallbackTime
                                    ? `${fallbackTime} ${
                                        lang === 'vi'
                                          ? '(giờ địa phương)'
                                          : '(venue time)'
                                      }`
                                    : lang === 'vi'
                                      ? 'Chưa có giờ xác nhận'
                                      : 'Time to be confirmed')}
                              </time>
                              <span>
                                {status === 'elapsed'
                                  ? lang === 'vi'
                                    ? 'Đã qua theo lịch'
                                    : 'Scheduled time passed'
                                  : status === 'scheduled-current'
                                    ? lang === 'vi'
                                      ? 'Đang trong khung giờ'
                                      : 'Within scheduled time'
                                    : lang === 'vi'
                                      ? 'Sắp tới'
                                      : 'Upcoming'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <Link
                        to={`/season/${season}?tab=results&round=${race.round}`}
                        onClick={() => setSelectedRaceRound(null)}
                      >
                        {lang === 'vi'
                          ? 'Xem kết quả chặng'
                          : 'View round results'}{' '}
                        →
                      </Link>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </aside>
      </div>
    </section>
      )}
    </>
  );
}

function Countdown({
  target,
  now,
  lang,
  label,
}: {
  target: number;
  now: number;
  lang: 'vi' | 'en';
  label: string;
}) {
  const [clock, setClock] = useState(now);

  useEffect(() => {
    const tick = () => setClock(Date.now());
    tick();
    const timer = window.setInterval(() => {
      if (!document.hidden) tick();
    }, 1_000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [target]);

  const remaining = target - clock;
  if (remaining <= 0) {
    return (
      <p className="cal-next-live" role="status">
        <Timer size={15} aria-hidden="true" />
        {lang === 'vi' ? 'Cuộc đua đang diễn ra' : 'Race in progress'}
      </p>
    );
  }
  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor(remaining / 3_600_000) % 24;
  const minutes = Math.floor(remaining / 60_000) % 60;
  const seconds = Math.floor(remaining / 1_000) % 60;
  const units = [
    { value: days, vi: 'ngày', en: 'days' },
    { value: hours, vi: 'giờ', en: 'hrs' },
    { value: minutes, vi: 'phút', en: 'mins' },
    { value: seconds, vi: 'giây', en: 'secs' },
  ];
  return (
    <div className="cal-countdown" role="timer" aria-label={label}>
      <p className="cal-countdown-label">{label}</p>
      <div className="cal-countdown-units">
        {units.map((unit) => (
          <div key={unit.en}>
            <strong>{String(unit.value).padStart(2, '0')}</strong>
            <span>{lang === 'vi' ? unit.vi : unit.en}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
