import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavigationStore } from '../../store/useNavigationStore';
import { GrandPrixRound } from '../../types';
import { MapPin, Calendar, ArrowRight, Radio, Trophy, CheckCircle2 } from 'lucide-react';
import { formatDateStr } from '../../utils/dateUtils';
import { scheduleWallClockSecondTick, tabSync } from '../../lib/live/tabSync';
import { getSessionTimeRange, RaceSessionKey } from '../../utils/raceSchedule';
import { Card3DTilt } from '../common/Card3DTilt';
import { getCalendarBySeason } from '../../data/championship';

interface RaceWeekendWidgetProps {
  race: GrandPrixRound;
}

interface SessionTiming {
  id: RaceSessionKey;
  nameVi: string;
  nameEn: string;
  startIso: string;
  endIso: string;
}

const SESSION_NAMES: Record<RaceSessionKey, { vi: string; en: string }> = {
  fp1: { vi: 'Luyện Tập 1 (FP1)', en: 'Practice 1 (FP1)' },
  fp2: { vi: 'Luyện Tập 2 (FP2)', en: 'Practice 2 (FP2)' },
  fp3: { vi: 'Luyện Tập 3 (FP3)', en: 'Practice 3 (FP3)' },
  sprintQualifying: { vi: 'Phân Hạng Sprint', en: 'Sprint Qualifying' },
  sprint: { vi: 'Đua Sprint', en: 'Sprint Race' },
  qualifying: { vi: 'Phân Hạng', en: 'Qualifying' },
  race: { vi: 'Chặng Đua Chính', en: 'Grand Prix Race' },
};

const SESSION_CARD_LABELS: Record<RaceSessionKey, { vi: string; en: string }> = {
  fp1: { vi: 'Luyện Tập 1', en: 'FP1' },
  fp2: { vi: 'Luyện Tập 2', en: 'FP2' },
  fp3: { vi: 'Luyện Tập 3', en: 'FP3' },
  sprintQualifying: { vi: 'Phân Hạng Sprint', en: 'Sprint Quali' },
  sprint: { vi: 'Sprint', en: 'Sprint' },
  qualifying: { vi: 'Phân Hạng', en: 'Qualifying' },
  race: { vi: 'Đua Chính', en: 'Grand Prix' },
};

function formatIctSession(start: Date, lang: 'vi' | 'en') {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok',
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(start);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value || '';
  const ictDate = new Date(start.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));

  return {
    day:
      lang === 'vi'
        ? ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][ictDate.getDay()]
        : value('weekday'),
    date: `${value('day')}/${value('month')}`,
    time: `${value('hour')}:${value('minute')}`,
  };
}

// Single sliding digit component with zero layout shift
const AnimatedDigit: React.FC<{ digit: string }> = ({ digit }) => {
  return (
    <span className="relative inline-block overflow-hidden h-[1.15em] w-[0.62em] tabular-nums text-center">
      <span key={digit} className="inline-block animate-digit-slide motion-reduce:animate-none">
        {digit}
      </span>
    </span>
  );
};

// 2-digit cluster (e.g. "02", "14") with label underneath
const TimeCluster: React.FC<{ value: number; label: string }> = ({ value, label }) => {
  const formatted = Math.max(0, value).toString().padStart(2, '0');
  const d1 = formatted[0];
  const d2 = formatted[1];

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center text-3xl sm:text-4xl lg:text-[42px] font-mono font-bold text-studio-950 tracking-tight leading-none tabular-nums">
        <AnimatedDigit digit={d1} />
        <AnimatedDigit digit={d2} />
      </div>
      <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-studio-500 mt-1">
        {label}
      </span>
    </div>
  );
};

export const RaceWeekendWidget: React.FC<RaceWeekendWidgetProps> = ({ race }) => {
  const { lang } = useNavigationStore();
  const navigate = useNavigate();
  const [now, setNow] = useState<number>(() => Date.now());

  // Convert each session from venue-local time for countdown and live-state checks.
  const sessions: SessionTiming[] = useMemo(
    () =>
      (Object.keys(race.sessions) as RaceSessionKey[])
        .flatMap((id) => {
          const range = getSessionTimeRange(race, id);
          if (!range) return [];
          return [
            {
              id,
              nameVi: SESSION_NAMES[id].vi,
              nameEn: SESSION_NAMES[id].en,
              startIso: range.start.toISOString(),
              endIso: range.end.toISOString(),
            },
          ];
        })
        .sort((a, b) => a.startIso.localeCompare(b.startIso)),
    [race],
  );

  // Wall-clock synchronized tick (aligned strictly to :00.000 whole second boundary)
  useEffect(() => {
    const cleanupTick = scheduleWallClockSecondTick(() => {
      setNow(Date.now());
    });

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        setNow(Date.now());
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const unsub = tabSync.subscribe('countdown_sync', () => {
      setNow(Date.now());
    });

    return () => {
      cleanupTick();
      document.removeEventListener('visibilitychange', handleVisibility);
      unsub();
    };
  }, []);

  // State Machine Evaluation: 'upcoming' | 'live' | 'finished'
  let state: 'live' | 'upcoming' | 'finished' = 'finished';
  let activeSession: SessionTiming | null = null;
  let nextSession: SessionTiming | null = null;
  let timeDiffMs: number;

  // Calendar status only; this widget does not consume a live data feed.
  {
    const liveSessionFound = sessions.find((s) => {
      const startMs = new Date(s.startIso).getTime();
      const endMs = new Date(s.endIso).getTime();
      return now >= startMs && now <= endMs;
    });

    if (liveSessionFound) {
      state = 'live';
      activeSession = liveSessionFound;
      nextSession = null;
      timeDiffMs = 0;
    } else {
      const upcoming = sessions.find((s) => now < new Date(s.startIso).getTime());
      if (upcoming) {
        const targetStartMs = new Date(upcoming.startIso).getTime();
        const diff = targetStartMs - now;
        state = 'upcoming';
        activeSession = null;
        nextSession = upcoming;
        timeDiffMs = Math.max(0, diff);
      } else {
        state = 'finished';
        activeSession = null;
        nextSession = null;
        timeDiffMs = 0;
      }
    }
  }

  // Compute Days, Hours, Minutes, Seconds for countdown
  const totalSecs = Math.floor(timeDiffMs / 1000);
  const days = Math.floor(totalSecs / (3600 * 24));
  const hours = Math.floor((totalSecs % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  const isLive = state === 'live';
  const sessionCards = sessions.map((session) => ({
    ...session,
    local: formatIctSession(new Date(session.startIso), lang),
  }));
  const isMainRaceInProgress =
    activeSession?.id === 'race' && now < new Date(activeSession.endIso).getTime();

  return (
    <section className="page-container select-none">
      <Card3DTilt
        maxTilt={3}
        glareOpacity={0.12}
        className="p-6 sm:p-8 rounded-3xl bg-white border border-studio-200 transition-all duration-500 relative overflow-hidden flex flex-col gap-8 shadow-subtle"
      >
        {/* ── B2. Scanline Sweep Telemetry Beam ── */}
        <div
          aria-hidden="true"
          className="absolute inset-y-0 w-32 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none animate-scanline-sweep z-20"
        />

        {/* Left Color Accent Bar */}
        <div className="absolute top-0 left-0 w-2.5 h-full bg-f1red transition-colors duration-500" />

        {/* ── TOP ROW: Grand Prix Identity & Live Action / Countdown ── */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 pl-2 relative z-10">
          {/* Race Header Info */}
          <div className="space-y-2.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all duration-500 ${
                  isLive
                    ? 'bg-f1red text-white animate-live-glow scale-105 shadow-md shadow-f1red/30'
                    : 'bg-f1red/10 text-f1red'
                }`}
              >
                {isLive
                  ? isMainRaceInProgress
                    ? lang === 'vi'
                      ? '● ĐUA CHÍNH ĐANG DIỄN RA'
                      : '● MAIN RACE IN PROGRESS'
                    : lang === 'vi'
                      ? '● ĐANG DIỄN RA'
                      : '● SESSION IN PROGRESS'
                  : lang === 'vi'
                    ? `Chặng ${race.round} · Tuần Lễ Thi Đấu`
                    : `Round ${race.round} · Active Race Weekend`}
              </span>
              <span className="text-xs text-studio-500 font-semibold">{race.country}</span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black uppercase text-studio-950 tracking-tight leading-tight">
              {race.name}
            </h2>

            <div className="flex flex-wrap items-center gap-4 text-xs text-studio-600 font-medium pt-0.5">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-f1red" /> {race.circuit}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-f1red" /> {formatDateStr(race.dates, lang)}
              </span>
              <span className="text-studio-300">|</span>
              <span>
                {race.laps} {lang === 'vi' ? 'Vòng' : 'Laps'} ({race.raceDistanceKm} km)
              </span>
              <span className="text-studio-300">|</span>
              <span className="text-studio-500 font-mono text-[11px]">
                {lang === 'vi' ? 'Giờ Việt Nam (UTC+7)' : 'Vietnam time (UTC+7)'}
              </span>
            </div>

            {/* ── B1. Weekend Progress Bar (5 Sessions) ── */}
            <div className="pt-2 max-w-md space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-studio-400">
                <span>{lang === 'vi' ? 'Tiến trình tuần đua' : 'Weekend Progress'}</span>
                <span className="text-f1red font-semibold">
                  {sessions.filter((s) => now > new Date(s.endIso).getTime()).length} /{' '}
                  {sessions.length}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5 h-1.5 w-full">
                {sessions.map((s) => {
                  const isFinished = now > new Date(s.endIso).getTime();
                  const isCurrent =
                    (state === 'live' && activeSession?.id === s.id) ||
                    (state === 'upcoming' && nextSession?.id === s.id);

                  return (
                    <div
                      key={s.id}
                      title={`${s.nameVi} · ${s.startIso}`}
                      className={`h-full rounded-full transition-all duration-300 ${
                        isFinished
                          ? 'bg-f1red shadow-xs'
                          : isCurrent
                            ? 'bg-f1red animate-pulse ring-2 ring-f1red/30'
                            : 'bg-studio-200'
                      }`}
                    />
                  );
                })}
              </div>
              <div className="grid grid-cols-5 text-[9px] text-center font-bold text-studio-400">
                {sessionCards.map((session) => (
                  <span key={session.id}>
                    {lang === 'vi'
                      ? SESSION_CARD_LABELS[session.id].vi
                      : SESSION_CARD_LABELS[session.id].en}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── STATE 1: LIVE STATE WIDGET ── */}
          {isLive && activeSession && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-studio-50 border border-studio-200 p-4 sm:p-5 rounded-2xl animate-fade-in">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-f1red animate-ping" />
                  <span className="font-display text-base sm:text-lg font-black uppercase text-f1red tracking-wide">
                    {lang === 'vi' ? activeSession.nameVi : activeSession.nameEn}
                  </span>
                </div>
                <p className="text-xs text-studio-600 font-medium">
                  {isMainRaceInProgress
                    ? lang === 'vi'
                      ? 'Cuộc đua chính đang diễn ra · Kết quả sẽ được cập nhật sau phiên'
                      : 'Main race in progress · Results update after the session'
                    : lang === 'vi'
                      ? 'Phiên đang diễn ra theo lịch · Kết quả cập nhật sau phiên'
                      : 'Scheduled session in progress · Results available after the session'}
                </p>
              </div>

              <button
                onClick={() => navigate(`/season/${race.season}?tab=results`)}
                className="group flex items-center gap-2 px-5 py-3 rounded-full bg-studio-950 hover:bg-f1red text-white text-xs font-bold uppercase tracking-wider transition-all duration-300 hover:scale-105 shadow-md cursor-pointer shrink-0"
              >
                <Radio className="w-4 h-4 text-white animate-pulse" />
                <span>{lang === 'vi' ? 'Xem kết quả' : 'View results'}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {/* ── STATE 2: UPCOMING COUNTDOWN WIDGET (4 Clusters) ── */}
          {state === 'upcoming' && nextSession && (
            <div className="r1-countdown flex flex-col items-start lg:items-end gap-2 bg-studio-50/80 border border-studio-200/80 p-4 sm:p-5 rounded-2xl">
              {/* Overline next session indicator */}
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-f1red">
                <span className="w-2 h-2 rounded-full bg-f1red animate-pulse" />
                <span>
                  {lang === 'vi'
                    ? `${nextSession.nameVi} Bắt Đầu Sau:`
                    : `${nextSession.nameEn} Starts In:`}
                </span>
              </div>

              {/* 4 Number Clusters (Days : Hours : Mins : Secs) */}
              <div className="grid grid-cols-4 sm:flex items-center gap-2 sm:gap-3 mt-1">
                <TimeCluster value={days} label={lang === 'vi' ? 'Ngày' : 'Days'} />

                <span className="text-2xl sm:text-3xl font-mono font-bold text-studio-400 self-start mt-1 animate-colon-pulse">
                  :
                </span>

                <TimeCluster value={hours} label={lang === 'vi' ? 'Giờ' : 'Hours'} />

                <span className="text-2xl sm:text-3xl font-mono font-bold text-studio-400 self-start mt-1 animate-colon-pulse">
                  :
                </span>

                <TimeCluster value={minutes} label={lang === 'vi' ? 'Phút' : 'Mins'} />

                <span className="text-2xl sm:text-3xl font-mono font-bold text-studio-400 self-start mt-1 animate-colon-pulse">
                  :
                </span>

                <TimeCluster value={seconds} label={lang === 'vi' ? 'Giây' : 'Secs'} />
              </div>
            </div>
          )}

          {/* ── STATE 3: FINISHED STATE WIDGET ── */}
          {state === 'finished' && (
            <div className="flex items-center gap-4 bg-studio-50 border border-studio-200 p-4 sm:p-5 rounded-2xl">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <span className="font-display text-sm font-bold uppercase text-studio-950 block">
                    {lang === 'vi' ? 'Chặng Đua Đã Kết Thúc' : 'Grand Prix Concluded'}
                  </span>
                  <span className="text-xs text-studio-500">
                    {lang === 'vi'
                      ? 'Đầy đủ kết quả đã được ghi nhận'
                      : 'All race results archived'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate(`/season/${race.season}?tab=results`)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-studio-900 hover:bg-f1red text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>{lang === 'vi' ? 'Xem Kết Quả' : 'View Results'}</span>
              </button>
            </div>
          )}
        </div>

        {/* ── BOTTOM ROW: Weekend Sessions Cards (FP1, Sprint Qualifying, Sprint, Quali, Race) ── */}
        <div className="pt-4 border-t border-studio-100 flex flex-wrap items-center justify-between gap-3 pl-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            {sessionCards.map((session) => {
              const label =
                lang === 'vi'
                  ? SESSION_CARD_LABELS[session.id].vi
                  : SESSION_CARD_LABELS[session.id].en;
              const isRace = session.id === 'race';
              const isSprint = session.id === 'sprint';
              return (
                <div
                  key={session.id}
                  className={`p-2.5 sm:p-3 rounded-xl border text-center min-w-[95px] sm:min-w-[105px] ${
                    isRace
                      ? 'bg-studio-900 border-studio-900 text-white shadow-sm'
                      : 'bg-studio-50 border-studio-200'
                  }`}
                >
                  <span
                    className={`text-[10px] uppercase font-bold block ${
                      isRace ? 'text-amber-400' : isSprint ? 'text-amber-600' : 'text-studio-400'
                    }`}
                  >
                    {label}
                  </span>
                  <span
                    className={`text-xs font-bold block ${isRace ? 'text-white' : 'text-studio-900'}`}
                  >
                    {session.local.day} · {session.local.date}
                  </span>
                  <span
                    className={`text-[10px] font-mono ${isRace ? 'text-studio-300' : 'text-studio-500'}`}
                  >
                    {session.local.time} {lang === 'vi' ? 'giờ VN' : 'UTC+7'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Full Schedule Link */}
          <button
            onClick={() => navigate(`/season/${race.season}?tab=calendar`)}
            className="px-4 py-2.5 rounded-xl border border-studio-300 hover:border-f1red text-studio-700 hover:text-f1red transition-colors text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer ml-auto"
          >
            <span>
              {lang === 'vi'
                ? `Lịch ${getCalendarBySeason(race.season).length} Chặng Chi Tiết`
                : `${getCalendarBySeason(race.season).length}-Race Calendar`}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </Card3DTilt>
    </section>
  );
};
