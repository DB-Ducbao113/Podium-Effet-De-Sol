import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Calendar, CheckCircle2, Clock, Timer } from "lucide-react";
import { getCalendarBySeason } from "../../data/championship";
import { getSeasonCircuit, SEASONAL_ART_ENABLED, resolveCircuitVisual } from "../../utils/seasonalVisuals";
import { SeasonalCircuitPhoto } from "./SeasonalCircuitPhoto";
import { DriverIcon } from "../directory/DriverIcon";
import openF1SessionResults from "../../data/championship/openF1SessionResults2026.json";
import { getRaceResults } from "../../data/championship/results";
import {
  getAvailableSessions,
  getLatestAvailableResultRound,
  getSessionClassification,
  type ClassificationRow,
  type ResultDataSources,
  type ResultSessionKey,
} from "../../results-engine/availability";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useChampionshipStore } from "../../store/useChampionshipStore";
import { useNavigationStore } from "../../store/useNavigationStore";
import { useTimezoneStore } from "../../store/useTimezoneStore";
import type { GrandPrixPracticeData } from "../../types/practice";
import type { GrandPrixQualifyingData } from "../../types/qualifying";
import { UNKNOWN_TEAM_ID, type SeasonYear } from "../../types";
import { formatRaceSessionTime, venueOffsetLabel } from "../../utils/championshipTimezone";
import { formatSessionName } from "../../utils/dateUtils";
import {
  getCalendarRaceState,
  getSessionTimeRange,
} from "../../utils/raceSchedule";
import { getTeamIdentityStyle } from "../../utils/teamColors";
import { VENUE_PLATE_LABEL, venuePlateFor } from "../../utils/venueArtwork";
import { venueHeroFor, venueHeroSrcSet } from "../../utils/venueHeroes";
import { circuitVisual2026For } from "../../utils/circuitVisualAssets2026";
import { TimezoneSelector } from "./TimezoneSelector";
import {
  getClassificationPresentation,
  resolveResultRound,
  resolveResultSession,
} from "./resultSelection";
import "./championshipC11.css";
import "./resultsV5.css";
import { ResultsV5Podium } from "./ResultsV5Podium";

const SHORT: Record<ResultSessionKey, string> = {
  fp1: "FP1",
  fp2: "FP2",
  fp3: "FP3",
  sprintQualifying: "SQ",
  sprint: "Sprint",
  qualifying: "Q",
  race: "Race",
};
const STANDARD_SESSIONS: ResultSessionKey[] = [
  "race",
  "qualifying",
  "fp3",
  "fp2",
  "fp1",
];
const SPRINT_SESSIONS: ResultSessionKey[] = [
  "race",
  "qualifying",
  "sprint",
  "sprintQualifying",
  "fp1",
];
const EMPTY_PRACTICE: Record<number, GrandPrixPracticeData> = {};
const EMPTY_QUALIFYING: Record<number, GrandPrixQualifyingData> = {};
const OPEN = openF1SessionResults as {
  practice: Record<number, GrandPrixPracticeData>;
  qualifying: Record<number, GrandPrixQualifyingData>;
};
type RoundDisplayState = "results" | "awaiting" | "current" | "upcoming";
const ROUND_STATE_COPY: Record<
  RoundDisplayState,
  { vi: string; en: string; descriptionVi: string; descriptionEn: string }
> = {
  results: {
    vi: "Có kết quả",
    en: "Results",
    descriptionVi: "Đã có phân hạng xác minh",
    descriptionEn: "Verified classification available",
  },
  awaiting: {
    vi: "Chờ kết quả",
    en: "Awaiting",
    descriptionVi: "Lịch đã kết thúc, chưa có phân hạng xác minh",
    descriptionEn: "Schedule ended, no verified classification yet",
  },
  current: {
    vi: "Đang diễn ra",
    en: "Current",
    descriptionVi: "Cuối tuần đang diễn ra",
    descriptionEn: "Weekend in progress",
  },
  upcoming: {
    vi: "Sắp tới",
    en: "Upcoming",
    descriptionVi: "Theo lịch đã công bố",
    descriptionEn: "Scheduled",
  },
};
const RoundStateIcon = ({
  state,
  size = 14,
}: {
  state: RoundDisplayState;
  size?: number;
}) => {
  if (state === "results")
    return <CheckCircle2 size={size} aria-hidden="true" />;
  if (state === "awaiting") return <Clock size={size} aria-hidden="true" />;
  if (state === "current") return <Timer size={size} aria-hidden="true" />;
  return <Calendar size={size} aria-hidden="true" />;
};
const value = (input: string | number | undefined) =>
  input === undefined || input === "" ? "—" : input;

const shortGrandPrixName = (name: string) =>
  name.replace(/ Grand Prix$/i, " GP");
const compoundKind = (compound?: string) => {
  const value = (compound ?? "").toLowerCase();
  if (value.includes("soft")) return "soft";
  if (value.includes("medium")) return "medium";
  if (value.includes("hard")) return "hard";
  if (value.includes("inter")) return "inter";
  if (value.includes("wet")) return "wet";
  return "unknown";
};
const templateSrcSet = (
  stem: string,
  widths: readonly number[],
  format: "avif" | "webp",
) =>
  widths
    .map((width) => `/images/championship/template/${stem}-${width}.${format} ${width}w`)
    .join(", ");
const PLATE_WIDTHS = [640, 1024, 1600] as const;

function DriverCell({
  row,
  season,
}: {
  row: ClassificationRow;
  season: SeasonYear;
}) {
  const name = (
    <>
      {SEASONAL_ART_ENABLED
        ? <DriverIcon season={season} driverId={row.driverId} code={row.driverCode} teamId={row.teamId} size={28} />
        : <span className="rc-driver-mark" aria-hidden="true">{(row.driverCode || row.driverName).slice(0, 3).toUpperCase()}</span>}
      <span className="rc-driver-text">
        <strong>{row.driverCode || row.driverName}</strong>
        <span>{row.driverName}</span>
      </span>
    </>
  );
  return row.driverId && row.driverId !== "unknown" ? (
    <Link to={`/drivers/${row.driverId}?season=${season}`}>{name}</Link>
  ) : (
    name
  );
}

export function WeekendResults({ season }: { season: SeasonYear }) {
  const lang = useNavigationStore((state) => state.lang);
  const preference = useTimezoneStore((state) => state.preference);
  const detailedResults = useChampionshipStore(
    (state) => state.detailedResults,
  );
  const syncMeta = useChampionshipStore((state) => state.syncMeta);
  const location = useLocation();
  const navigate = useNavigate();
  const calendar = getCalendarBySeason(season);
  const sources: ResultDataSources = {
    season,
    calendar,
    detailedResults: detailedResults[season],
    raceSummaries: getRaceResults(season),
    // Legacy Practice/Qualifying modules contain generated rows. R2 only accepts captured snapshots.
    practice: season === 2026 ? OPEN.practice : EMPTY_PRACTICE,
    qualifying: season === 2026 ? OPEN.qualifying : EMPTY_QUALIFYING,
  };
  const availableRounds = calendar
    .map((item) => item.round)
    .sort((a, b) => a - b);
  const latestRound = getLatestAvailableResultRound(sources);
  const params = new URLSearchParams(location.search);
  const requestedRound = Number(params.get("round"));
  const round = resolveResultRound(
    availableRounds,
    latestRound,
    requestedRound,
  );
  const railRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLElement | null>(null);
  const reducedMotion = useReducedMotion();
  const [now, setNow] = useState(() => Date.now());
  const [tableWrap, setTableWrap] = useState<HTMLDivElement | null>(null);
  const [tableScrollable, setTableScrollable] = useState(false);
  const [railEdges, setRailEdges] = useState({ start: false, end: false });

  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const timer = window.setInterval(refresh, 60_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  useEffect(() => {
    if (round === null) return;
    const rail = railRef.current;
    const chip = rail?.querySelector<HTMLElement>(`[data-round="${round}"]`);
    if (!rail || !chip) return;
    const center = chip.offsetLeft - (rail.clientWidth - chip.offsetWidth) / 2;
    rail.scrollTo({
      left: Math.max(0, center),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, [round, season]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const update = () => {
      const maxLeft = rail.scrollWidth - rail.clientWidth;
      setRailEdges({
        start: rail.scrollLeft > 4,
        end: maxLeft > 4 && rail.scrollLeft < maxLeft - 4,
      });
    };
    const observer = new ResizeObserver(update);
    observer.observe(rail);
    rail.addEventListener("scroll", update, { passive: true });
    update();
    return () => {
      observer.disconnect();
      rail.removeEventListener("scroll", update);
    };
  }, [season]);

  useEffect(() => {
    if (!tableWrap) return;
    const update = () =>
      setTableScrollable(tableWrap.scrollWidth - tableWrap.clientWidth > 2);
    const observer = new ResizeObserver(update);
    observer.observe(tableWrap);
    update();
    return () => observer.disconnect();
  }, [tableWrap, location.search]);

  const roundCards = calendar.map((raceItem) => {
    const verifiedSessions = getAvailableSessions(sources, raceItem.round);
    const scheduleState = getCalendarRaceState(raceItem, now);
    const displayState: RoundDisplayState =
      scheduleState === "current"
        ? "current"
        : verifiedSessions.length > 0
          ? "results"
          : scheduleState === "completed"
            ? "awaiting"
            : "upcoming";
    return {
      race: raceItem,
      availableCount: verifiedSessions.length,
      scheduleState,
      displayState,
    };
  });
  const resultsRoundCount = roundCards.filter(
    (card) => card.availableCount > 0,
  ).length;

  if (round === null) {
    return (
      <section className="c11-results">
        <div className="c11-empty" role="status">
          {lang === "vi"
            ? "Chưa có vòng đua nào có phân hạng đã xác minh."
            : "No round has a verified classification yet."}
        </div>
      </section>
    );
  }

  const race = calendar.find((item) => item.round === round);
  const sessions = (
    race?.hasSprint ? SPRINT_SESSIONS : STANDARD_SESSIONS
  ).filter((key) => Boolean(race?.sessions[key]));
  const requestedSession = params.get("session");
  const selectedSession = resolveResultSession(
    sessions,
    getAvailableSessions(sources, round),
    requestedSession,
  );
  const classification = selectedSession
    ? getSessionClassification(sources, round, selectedSession)
    : null;
  if (!race || !selectedSession) return null;
  const selectedCircuit = getSeasonCircuit(season, round);
  const seasonalReview = SEASONAL_ART_ENABLED && !!resolveCircuitVisual(season, round);
  const venuePlate = venuePlateFor(selectedCircuit?.id);
  const venueHero = !seasonalReview && (season !== 2026 || circuitVisual2026For(season, selectedCircuit?.id))
    ? venueHeroFor(selectedCircuit?.id)
    : undefined;
  const venuePlateLabel =
    lang === "vi"
      ? VENUE_PLATE_LABEL[venuePlate].vi
      : VENUE_PLATE_LABEL[venuePlate].en;
  const roundHasResults = getAvailableSessions(sources, round).length > 0;
  const selectedRoundCard = roundCards.find(
    (card) => card.race.round === round,
  );
  const selectedSessionRange = getSessionTimeRange(race, selectedSession);
  const sessionEnded = selectedSessionRange
    ? now >= selectedSessionRange.end.getTime()
    : selectedRoundCard?.scheduleState === "completed";
  const isScheduledSession = !sessionEnded;
  const isAwaitingSession = sessionEnded && !classification;
  const classificationPresentation = getClassificationPresentation(
    classification,
    isScheduledSession,
  );
  const presentationLabel =
    classificationPresentation === "final"
      ? lang === "vi"
        ? "Cuối cùng"
        : "Final"
      : classificationPresentation === "provisional"
        ? lang === "vi"
          ? "Tạm thời"
          : "Provisional"
        : classificationPresentation === "summary"
          ? lang === "vi"
            ? "Bản tóm tắt"
            : "Summary"
          : classificationPresentation === "scheduled"
            ? lang === "vi"
              ? "Sắp diễn ra"
              : "Scheduled"
            : lang === "vi"
              ? "Chờ dữ liệu xác minh"
              : "Awaiting verified data";

  const change = (nextRound: number, nextSession?: ResultSessionKey) => {
    const next = new URLSearchParams(location.search);
    const targetRace = calendar.find((item) => item.round === nextRound);
    const targetSessions = (
      targetRace?.hasSprint ? SPRINT_SESSIONS : STANDARD_SESSIONS
    ).filter((key) => Boolean(targetRace?.sessions[key]));
    next.set("tab", "results");
    next.set("round", String(nextRound));
    next.set(
      "session",
      nextSession && targetSessions.includes(nextSession)
        ? nextSession
        : (getAvailableSessions(sources, nextRound)[0] ?? targetSessions[0]),
    );
    navigate(`${location.pathname}?${next.toString()}`);
  };
  const isPractice =
    selectedSession === "fp1" ||
    selectedSession === "fp2" ||
    selectedSession === "fp3";
  const isQualifying =
    selectedSession === "qualifying" || selectedSession === "sprintQualifying";
  const isRace = selectedSession === "race";
  const isSprint = selectedSession === "sprint";
  const phaseLabels =
    selectedSession === "sprintQualifying"
      ? ["SQ1", "SQ2", "SQ3"]
      : ["Q1", "Q2", "Q3"];
  const sourceUpdated = classification?.lastUpdated
    ? new Date(classification.lastUpdated).toLocaleString(
        lang === "vi" ? "vi-VN" : "en-GB",
        {
          timeZone: preference === "vietnam" ? "Asia/Ho_Chi_Minh" : undefined,
          dateStyle: "medium",
          timeStyle: "short",
        },
      )
    : null;

  const selectedState =
    ROUND_STATE_COPY[selectedRoundCard?.displayState ?? "upcoming"];
  const selectedStateLabel =
    lang === "vi" ? selectedState.vi : selectedState.en;
  const selectedStateDescription =
    lang === "vi" ? selectedState.descriptionVi : selectedState.descriptionEn;

  return (
    <section
      ref={shellRef}
      className="c11-results rc-race-center results-v5"
      data-motion-engine={reducedMotion ? "static" : "css-scroll"}
      aria-label={lang === "vi" ? "Trung tâm kết quả đua" : "Race Center"}
    >
      <header className="results-simple-head">
        <div className="results-v5__intro">
          <span className="results-v5__eyebrow">{lang === "vi" ? "LƯU TRỮ GIẢI ĐUA" : "RACE ARCHIVE"} / {season}</span>
          <h2>{lang === "vi" ? <>Kết quả <em>chặng đua.</em></> : <>Race <em>results.</em></>}</h2>
          <p className="results-v5__lede">{lang === "vi" ? "Chọn chặng và phiên để xem bảng phân hạng từ nguồn dữ liệu đã xác minh." : "Explore sourced classifications by round and session."}</p>
          <a className="results-v5__jump" href="#c11-classification">{lang === "vi" ? "Đến bảng phân hạng" : "View classification"} <span aria-hidden="true">↘</span></a>
        </div>
        <div className="results-v5__total" aria-label={lang === "vi" ? `${resultsRoundCount} trên ${calendar.length} chặng có kết quả` : `${resultsRoundCount} of ${calendar.length} rounds with results`}>
          <strong>{String(resultsRoundCount).padStart(2,"0")}</strong>
          <span>/{String(calendar.length).padStart(2,"0")}</span>
          <small>{lang === "vi" ? "chặng có kết quả" : "rounds with results"}</small>
        </div>
      </header>
      <div className="c11-pinned-controls rc-pinned-controls">
        <div
          className="rc-round-rail"
          data-scroll-start={railEdges.start ? "true" : undefined}
          data-scroll-end={railEdges.end ? "true" : undefined}
        >
          <span className="rc-rail-season" aria-hidden="true">
            <b>{season}</b>
            <span>{lang === "vi" ? "MÙA GIẢI" : "SEASON"}</span>
          </span>
          <div className="rc-round-rail-track" ref={railRef}>
            {roundCards.map((card) => {
              const copy = ROUND_STATE_COPY[card.displayState];
              const chipState = lang === "vi" ? copy.vi : copy.en;
              const description =
                lang === "vi" ? copy.descriptionVi : copy.descriptionEn;
              const accessibleLabel = `${lang === "vi" ? "Vòng" : "Round"} ${card.race.round} · ${card.race.name} · ${chipState}${
                card.availableCount > 0
                  ? ` · ${card.availableCount} ${
                      lang === "vi" ? "phiên có kết quả" : "verified sessions"
                    }`
                  : ""
              }`;
              return (
                <button
                  key={card.race.round}
                  type="button"
                  className="rc-round-chip"
                  data-state={card.displayState}
                  data-round={card.race.round}
                  aria-current={card.race.round === round ? "true" : undefined}
                  title={`${accessibleLabel}. ${description}`}
                  onClick={() => change(card.race.round)}
                >
                  <span className="rc-chip-top">
                    <span className="rc-chip-round">
                      R{String(card.race.round).padStart(2, "0")}
                    </span>
                    <RoundStateIcon state={card.displayState} size={13} />
                  </span>
                  <span className="rc-chip-name">
                    {shortGrandPrixName(card.race.name)}
                  </span>
                  <span className="sr-only">
                    {` · ${chipState}${
                      card.availableCount > 0
                        ? ` · ${card.availableCount} ${
                            lang === "vi"
                              ? "phiên có kết quả"
                              : "verified sessions"
                          }`
                        : ""
                    }`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div
          className="c11-session-tabs"
          role="tablist"
          aria-label={
            lang === "vi" ? "Chọn phiên có kết quả" : "Select a session"
          }
        >
          {sessions.map((key, index) => {
            const short = SHORT[key];
            const fullName = formatSessionName(race.sessions[key]?.name, lang);
            // Visible code must stay inside the accessible name; a separator
            // keeps assistive tech from reading the session twice.
            const accessibleName =
              fullName.toLowerCase() === short.toLowerCase()
                ? fullName
                : `${short} — ${fullName}`;
            return (
              <button
                key={key}
                id={`c11-tab-${key}`}
                role="tab"
                type="button"
                aria-label={accessibleName}
                aria-selected={selectedSession === key}
                aria-controls="c11-classification"
                tabIndex={selectedSession === key ? 0 : -1}
                title={fullName}
                onClick={() => change(round, key)}
                onKeyDown={(event) => {
                  if (
                    !["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                      event.key,
                    )
                  )
                    return;
                  event.preventDefault();
                  const nextIndex =
                    event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? sessions.length - 1
                        : (index +
                            (event.key === "ArrowRight" ? 1 : -1) +
                            sessions.length) %
                          sessions.length;
                  change(round, sessions[nextIndex]);
                  (
                    event.currentTarget.parentElement?.children[
                      nextIndex
                    ] as HTMLElement
                  )?.focus();
                }}
              >
                <span className="c11-session-short">{short}</span>
                <span className="c11-session-long">{fullName}</span>
              </button>
            );
          })}
        </div>
      </div>
      <header
        className="rc-round-hero"
        data-venue={venueHero ? venueHero.venue : venuePlate}
        data-venue-photo={venueHero ? "true" : "false"}
        key={`${season}-${round}`}
      >
        {seasonalReview ? (
          <SeasonalCircuitPhoto key={`${season}-${round}`} season={season} round={round} wrapperClassName="rc-round-media" className="rc-round-img" eager fallback={`/images/championship/template/venue-${venuePlate}-1024.webp`} sizes="(min-width: 90rem) 90rem, 100vw" />
        ) : <picture className="rc-round-media" aria-hidden="true">
          {venueHero ? (
            <>
              <source
                media="(max-width: 46em)"
                type="image/avif"
                srcSet={venueHeroSrcSet(venueHero.venue, "port", "avif")}
                sizes="100vw"
              />
              <source
                media="(max-width: 46em)"
                type="image/webp"
                srcSet={venueHeroSrcSet(venueHero.venue, "port", "webp")}
                sizes="100vw"
              />
              <source
                type="image/avif"
                srcSet={venueHeroSrcSet(venueHero.venue, "land", "avif")}
                sizes="(min-width: 90rem) 90rem, 100vw"
              />
              <source
                type="image/webp"
                srcSet={venueHeroSrcSet(venueHero.venue, "land", "webp")}
                sizes="(min-width: 90rem) 90rem, 100vw"
              />
              <img
                className="rc-round-img"
                src={`/images/championship/venues/${venueHero.venue}-land-1600.webp`}
                alt=""
                width={1600}
                height={900}
                loading="eager"
                decoding="async"
              />
            </>
          ) : (
            <>
              <source
                type="image/avif"
                srcSet={templateSrcSet(`venue-${venuePlate}`, PLATE_WIDTHS, "avif")}
                sizes="(min-width: 90rem) 90rem, 100vw"
              />
              <source
                type="image/webp"
                srcSet={templateSrcSet(`venue-${venuePlate}`, PLATE_WIDTHS, "webp")}
                sizes="(min-width: 90rem) 90rem, 100vw"
              />
              <img
                className="rc-round-img"
                src={`/images/championship/template/venue-${venuePlate}-1024.webp`}
                alt=""
                width={1024}
                height={585}
                loading="lazy"
                decoding="async"
              />
            </>
          )}
        </picture>}
        <div className="rc-round-scrim" aria-hidden="true" />
        <div className="rc-round-copy" data-rc-reveal>
          <p className="rc-round-kicker">
            <span className="rc-round-number">
              ROUND {String(round).padStart(2, "0")}
            </span>
            <span aria-hidden="true">{race.flag}</span>
            <span>{race.country}</span>
            {race.hasSprint && (
              <span className="rc-badge">
                {lang === "vi" ? "Có Sprint" : "Sprint weekend"}
              </span>
            )}
          </p>
          <h3>{race.name}</h3>
          <p className="rc-round-meta">
            {race.circuit} · {race.location} · {race.dates}
          </p>
          <p
            className="rc-round-availability"
            data-state={selectedRoundCard?.displayState ?? "upcoming"}
          >
            <RoundStateIcon
              state={selectedRoundCard?.displayState ?? "upcoming"}
              size={15}
            />
            <strong>{selectedStateLabel}</strong>
            <span aria-hidden="true">·</span>
            <span>
              {roundHasResults
                ? lang === "vi"
                  ? `${selectedRoundCard?.availableCount ?? 0} phiên có phân hạng đã xác minh`
                  : `${selectedRoundCard?.availableCount ?? 0} sessions with verified classification`
                : selectedStateDescription}
            </span>
          </p>
          {seasonalReview ? (
            <p className="rc-round-art-note">{lang === 'vi' ? 'Ảnh minh họa AI' : 'AI illustration'}</p>
          ) : venueHero ? (
            <p className="rc-round-art-note">
              <span className="rc-round-place">{venueHero.place}</span>
              <span className="rc-round-credit">
                {lang === "vi" ? "Ảnh" : "Photo"}:{" "}
                <a href={venueHero.sourcePage} target="_blank" rel="noreferrer">
                  {venueHero.credit}
                </a>
                {" · "}
                {venueHero.licenseUrl ? (
                  <a
                    href={venueHero.licenseUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {venueHero.license}
                  </a>
                ) : (
                  <span>{venueHero.license}</span>
                )}
                {" · Wikimedia Commons"}
                {" · "}{lang === "vi" ? "đã cắt và chỉnh màu" : "cropped and color adjusted"}
              </span>
            </p>
          ) : (
            <p className="rc-round-art-note">{venuePlateLabel}</p>
          )}
        </div>
      </header>
      {(isRace || isSprint) && classification && !classification.partial && classificationPresentation === "final" && (
        <ResultsV5Podium rows={classification.rows} season={season} lang={lang} sprint={isSprint}/>
      )}
      <div
        id="c11-classification"
        role="tabpanel"
        aria-labelledby={`c11-tab-${selectedSession}`}
        className="c11-classification"
        key={`${season}-${round}-${selectedSession}`}
        data-presentation={classificationPresentation}
      >
        <div className="c11-classification-meta">
          <div>
            <h3>
              {formatSessionName(race.sessions[selectedSession]?.name, lang)}
            </h3>
            <p>
              {formatRaceSessionTime(race, selectedSession, preference, lang) ??
                (lang === "vi"
                  ? "Giờ chưa được xác minh"
                  : "Session time unavailable")}
            </p>
            <p className="c11-provenance">
              {classification && (
                <span>
                  {lang === "vi" ? "Nguồn" : "Source"}: {classification.source}
                </span>
              )}
              {sourceUpdated && (
                <span>
                  {lang === "vi" ? "Cập nhật" : "Updated"}: {sourceUpdated}
                </span>
              )}
              <span
                className={`c11-result-state c11-result-state--${classificationPresentation}`}
              >
                {presentationLabel}
              </span>
            </p>
          </div>
          <details className="c11-timezone">
            <summary>{lang === "vi" ? "Giờ hiển thị" : "Displayed time"} · {preference === 'venue' && race?.venueUtcOffset !== undefined ? `${race.location} ${venueOffsetLabel(race.venueUtcOffset)}` : preference === 'local' ? (lang === 'vi' ? 'Thiết bị' : 'Device') : preference}</summary>
            <TimezoneSelector lang={lang} venue={race} />
          </details>
        </div>
        {classification?.status === "provisional" && (
          <p className="c11-notice" role="status">
            {lang === "vi"
              ? "Phân hạng tạm thời; dữ liệu có thể được hiệu chỉnh."
              : "Provisional classification; the source may still revise it."}
          </p>
        )}
        {classification?.partial && (
          <p className="c11-notice c11-notice--summary" role="status">
            {lang === "vi"
              ? "Nguồn hiện chỉ cung cấp bản tóm tắt đã xác minh; đây chưa phải phân hạng đầy đủ."
              : "The source currently provides a verified summary only; this is not a complete classification."}
          </p>
        )}
        {syncMeta.syncStatus === "error" && (isRace || isSprint) && (
          <p className="c11-notice c11-notice--stale" role="status">
            {lang === "vi"
              ? "Không thể làm mới nguồn. Đang giữ bản dữ liệu hợp lệ gần nhất."
              : "The source refresh failed. Showing the last valid snapshot."}
          </p>
        )}
        {!classification ? (
          <div className="c11-results-empty" role="status">
            <strong>
              {isAwaitingSession
                ? lang === "vi"
                  ? "Lịch phiên đã kết thúc"
                  : "Session schedule has ended"
                : lang === "vi"
                  ? "Phiên đua đã lên lịch"
                  : "Session scheduled"}
            </strong>
            <p>
              {isAwaitingSession
                ? lang === "vi"
                  ? "Chưa có phân hạng được xác minh cho phiên này. Kết quả chỉ xuất hiện sau khi nguồn dữ liệu được xác minh."
                  : "No verified classification is available for this session yet. Results appear only after the source is verified."
                : lang === "vi"
                  ? "Kết quả sẽ xuất hiện khi nguồn dữ liệu được xác minh. Bạn có thể chọn phiên hoặc chặng khác ở phía trên."
                  : "Results appear after the source is verified. Choose another session or round above."}
            </p>
          </div>
        ) : (
          <>
            {tableScrollable && (
              <p
                className="c11-table-scroll-hint"
                id="rc-table-scroll-hint"
                role="note"
              >
                {lang === "vi"
                  ? "Vuốt ngang hoặc dùng phím mũi tên để xem đủ cột."
                  : "Scroll horizontally or use the arrow keys to see every column."}
              </p>
            )}
            <div
              className="c11-table-wrap"
              ref={setTableWrap}
              role="region"
              aria-label={
                lang === "vi"
                  ? `Bảng phân hạng ${formatSessionName(race.sessions[selectedSession]?.name, lang)}`
                  : `${formatSessionName(race.sessions[selectedSession]?.name, lang)} classification`
              }
              aria-describedby={
                tableScrollable ? "rc-table-scroll-hint" : undefined
              }
              data-scrollable={tableScrollable ? "true" : undefined}
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.target !== event.currentTarget) return;
                if (
                  !["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                    event.key,
                  )
                )
                  return;
                event.preventDefault();
                const node = event.currentTarget;
                const behavior = reducedMotion ? "auto" : "smooth";
                const amount = Math.max(160, node.clientWidth * 0.6);
                if (event.key === "Home") node.scrollTo({ left: 0, behavior });
                else if (event.key === "End")
                  node.scrollTo({ left: node.scrollWidth, behavior });
                else
                  node.scrollBy({
                    left: event.key === "ArrowRight" ? amount : -amount,
                    behavior,
                  });
              }}
            >
              <table className="c11-table">
                <thead>
                  <tr>
                    <th scope="col">{lang === "vi" ? "Vị trí" : "Pos"}</th>
                    <th scope="col">#</th>
                    <th scope="col">{lang === "vi" ? "Tay đua" : "Driver"}</th>
                    <th scope="col">{lang === "vi" ? "Đội" : "Team"}</th>
                    {isQualifying && (
                      <>
                        <th scope="col">{phaseLabels[0]}</th>
                        <th scope="col">{phaseLabels[1]}</th>
                        <th scope="col">{phaseLabels[2]}</th>
                      </>
                    )}
                    {isPractice && (
                      <th scope="col">{lang === "vi" ? "Lốp" : "Tyre"}</th>
                    )}
                    {isRace && (
                      <th scope="col">
                        {lang === "vi" ? "Xuất phát" : "Grid"}
                      </th>
                    )}
                    <th scope="col">
                      {isQualifying || isPractice
                        ? lang === "vi"
                          ? "Vòng tốt nhất"
                          : "Best lap"
                        : lang === "vi"
                          ? "Thời gian / cách biệt"
                          : "Time / gap"}
                    </th>
                    {(isQualifying || isPractice) && (
                      <th scope="col">{lang === "vi" ? "Cách biệt" : "Gap"}</th>
                    )}
                    {(isPractice || isRace || isSprint) && (
                      <th scope="col">{lang === "vi" ? "Vòng" : "Laps"}</th>
                    )}
                    {(isRace || isSprint) && (
                      <th scope="col">{lang === "vi" ? "Điểm" : "Pts"}</th>
                    )}
                    {isRace && (
                      <th scope="col">
                        {lang === "vi" ? "Vòng nhanh" : "Fastest"}
                      </th>
                    )}
                    {(isRace || isSprint) && (
                      <th scope="col">
                        {lang === "vi" ? "Trạng thái" : "Status"}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {classification.rows.map((row) => (
                    <tr
                      key={`${row.position}-${row.driverId}-${row.driverName}`}
                      style={getTeamIdentityStyle(row.teamId)}
                      data-team={row.teamId}
                      data-podium={
                        row.position >= 1 && row.position <= 3
                          ? row.position
                          : undefined
                      }
                    >
                      <td
                        data-label={lang === "vi" ? "Vị trí" : "Pos"}
                        className="c11-position"
                      >
                        {row.position > 0 ? (
                          <span className="rc-rank">
                            {String(row.position).padStart(2, "0")}
                          </span>
                        ) : (
                          "—"
                        )}
                        {row.compound && (
                          <span
                            className="rc-tyre-badge"
                            data-compound={compoundKind(row.compound)}
                            title={row.compound}
                            aria-label={row.compound}
                          >
                            {row.compound.slice(0, 1).toUpperCase()}
                          </span>
                        )}
                      </td>
                      <td data-label="#" className="c11-secondary c11-number">
                        {value(row.driverNumber)}
                      </td>
                      <td
                        data-label={lang === "vi" ? "Tay đua" : "Driver"}
                        className="c11-driver"
                      >
                        <DriverCell row={row} season={season} />
                      </td>
                      <td
                        data-label={lang === "vi" ? "Đội" : "Team"}
                        className="c11-team"
                      >
                        {row.teamId !== UNKNOWN_TEAM_ID ? (
                          <Link to={`/teams/${row.teamId}?season=${season}`}>
                            <span className="rc-team-chip">{row.teamName}</span>
                          </Link>
                        ) : (
                          <span className="rc-team-chip">{row.teamName}</span>
                        )}
                      </td>
                      {isQualifying && (
                        <>
                          <td
                            data-label={phaseLabels[0]}
                            className="c11-secondary c11-time"
                          >
                            {value(row.q1)}
                          </td>
                          <td
                            data-label={phaseLabels[1]}
                            className="c11-secondary c11-time"
                          >
                            {value(row.q2)}
                          </td>
                          <td
                            data-label={phaseLabels[2]}
                            className="c11-secondary c11-time"
                          >
                            {value(row.q3)}
                          </td>
                        </>
                      )}
                      {isPractice && (
                        <td
                          data-label={lang === "vi" ? "Lốp" : "Tyre"}
                          className="c11-secondary"
                        >
                          {value(row.compound)}
                        </td>
                      )}
                      {isRace && (
                        <td
                          data-label={lang === "vi" ? "Xuất phát" : "Grid"}
                          className="c11-secondary c11-number"
                        >
                          {value(row.grid)}
                        </td>
                      )}
                      <td
                        data-label={
                          isQualifying || isPractice
                            ? lang === "vi"
                              ? "Vòng tốt nhất"
                              : "Best lap"
                            : lang === "vi"
                              ? "Thời gian / cách biệt"
                              : "Time / gap"
                        }
                        className="c11-time"
                      >
                        {value(row.bestLap)}
                      </td>
                      {(isQualifying || isPractice) && (
                        <td
                          data-label={lang === "vi" ? "Cách biệt" : "Gap"}
                          className="c11-time c11-secondary"
                        >
                          {value(row.gap)}
                        </td>
                      )}
                      {(isPractice || isRace || isSprint) && (
                        <td
                          data-label={lang === "vi" ? "Vòng" : "Laps"}
                          className="c11-number c11-secondary"
                        >
                          {value(row.laps)}
                        </td>
                      )}
                      {(isRace || isSprint) && (
                        <td
                          data-label={lang === "vi" ? "Điểm" : "Pts"}
                          className="c11-points"
                        >
                          {value(row.points)}
                        </td>
                      )}
                      {isRace && (
                        <td
                          data-label={lang === "vi" ? "Vòng nhanh" : "Fastest"}
                          className="c11-secondary c11-time"
                        >
                          {value(row.fastestLap)}
                        </td>
                      )}
                      {(isRace || isSprint) && (
                        <td
                          data-label={lang === "vi" ? "Trạng thái" : "Status"}
                        >
                          {row.status ? (
                            <span className="c11-row-status">{row.status}</span>
                          ) : null}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
