import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import type { GrandPrixRound, SeasonYear, WeekendSession } from "../../types";
import { getSeasonCircuit } from "../../utils/seasonalVisuals";
import {
  formatLatitude,
  formatLongitude,
  resolveCircuit,
} from "./journeyCoordinates";

type Props = {
  season: SeasonYear;
  race: GrandPrixRound;
  tab: "results" | "calendar";
  lang: "vi" | "en";
  reveal: number;
};

const SESSION_ORDER = [
  "fp1",
  "fp2",
  "fp3",
  "sprintQualifying",
  "sprint",
  "qualifying",
  "race",
] as const;

const SESSION_LABELS: Record<
  (typeof SESSION_ORDER)[number],
  { en: string; vi: string }
> = {
  fp1: { en: "Practice 1", vi: "Thử nghiệm 1" },
  fp2: { en: "Practice 2", vi: "Thử nghiệm 2" },
  fp3: { en: "Practice 3", vi: "Thử nghiệm 3" },
  sprintQualifying: { en: "Sprint Qualifying", vi: "Phân hạng Sprint" },
  sprint: { en: "Sprint", vi: "Sprint" },
  qualifying: { en: "Qualifying", vi: "Phân hạng" },
  race: { en: "Race", vi: "Đua chính" },
};

const formatKm = (value: number, vi: boolean): string =>
  value.toFixed(3).replace(".", vi ? "," : ".");

const utcLabel = (hours: number): string =>
  `UTC${hours >= 0 ? "+" : "−"}${Math.abs(hours)}`;

/** Uses the season's existing circuit outline; no remote map imagery or invented geometry. */
export function JourneyCircuitOverlay({
  season,
  race,
  tab,
  lang,
  reveal,
}: Props) {
  const circuit = getSeasonCircuit(season, race.round);
  const geo = resolveCircuit(race);
  const visible = reveal > 0.55;
  const vi = lang === "vi";
  const sessions = SESSION_ORDER.flatMap((key) => {
    const session: WeekendSession | undefined = race.sessions[key];
    return session ? [{ key, session }] : [];
  });
  const scheduleId = `rcj-schedule-${race.round}`;

  return (
    <section
      className="rcj-circuit-overlay"
      data-visible={visible}
      data-circuit={circuit?.id ?? "unavailable"}
      style={{ opacity: reveal }}
      aria-hidden={!visible}
    >
      <div className="rcj-circuit-inner">
        <div className="rcj-circuit-art">
          {circuit ? (
            <svg
              viewBox={circuit.viewBox}
              role="img"
              aria-label={
                vi
                  ? `Bản đồ vector đường đua ${circuit.circuitName}`
                  : `Vector circuit map of ${circuit.circuitName}`
              }
            >
              <path
                d={circuit.svgPath}
                fill="none"
                className="rcj-circuit-bed"
              />
              <path
                d={circuit.svgPath}
                fill="none"
                className="rcj-circuit-line"
              />
              <path
                d={circuit.svgPath}
                fill="none"
                className="rcj-circuit-draw"
                pathLength={1}
                style={{ strokeDashoffset: 1 - reveal }}
              />
              <circle
                cx={circuit.startFinish.x}
                cy={circuit.startFinish.y}
                r={9}
                className="rcj-circuit-start"
              />
            </svg>
          ) : (
            <p role="status">
              {vi
                ? "Chưa có dữ liệu bản đồ đường đua."
                : "Circuit outline is unavailable."}
            </p>
          )}
          <span className="rcj-circuit-vector-label">
            {vi ? "BẢN ĐỒ VECTOR" : "VECTOR CIRCUIT"}
          </span>
        </div>
        <div className="rcj-circuit-copy" tabIndex={visible ? 0 : -1}>
          <span className="rcj-circuit-round">
            R{String(race.round).padStart(2, "0")} / {season}
          </span>
          <h3>{circuit?.circuitName ?? race.circuit}</h3>
          <p className="rcj-circuit-place">
            {race.name} &middot; <strong>{race.location}</strong>,{" "}
            {race.country}
          </p>
          {geo && (
            <p className="rcj-circuit-coords">
              <span className="rcj-circuit-coords-label">
                {vi ? "TỌA ĐỘ" : "COORDINATES"}
              </span>
              <span className="rcj-circuit-coords-value">
                {formatLatitude(geo.latitude)} &middot;{" "}
                {formatLongitude(geo.longitude)}
              </span>
            </p>
          )}
          <dl className="rcj-circuit-rows">
            <div>
              <dt>{vi ? "Quãng đường đua" : "Race distance"}</dt>
              <dd>{formatKm(race.raceDistanceKm, vi)} km</dd>
            </div>
            <div>
              <dt>{vi ? "Số vòng" : "Laps"}</dt>
              <dd>
                {race.laps} &times; {formatKm(race.circuitLengthKm, vi)} km
              </dd>
            </div>
            <div>
              <dt>{vi ? "Ngày đua" : "Race weekend"}</dt>
              <dd>{race.dates}</dd>
            </div>
          </dl>
          <div className="rcj-circuit-schedule">
            <span className="rcj-circuit-schedule-head" id={scheduleId}>
              {vi ? "Lịch các phiên" : "Session schedule"}
            </span>
            <ul className="rcj-circuit-sessions" aria-labelledby={scheduleId}>
              {sessions.map(({ key, session }, index) => (
                <li
                  key={key}
                  data-session={key}
                  style={{ "--rcj-sess-order": index } as CSSProperties}
                >
                  <span>{SESSION_LABELS[key][lang]}</span>
                  <b>
                    {session.dateStr} &middot; {session.timeStr}
                  </b>
                </li>
              ))}
            </ul>
            <small className="rcj-circuit-tz">
              {vi ? "Giờ tại địa điểm đua" : "Venue local time"}
              {race.venueUtcOffset !== undefined
                ? ` · ${utcLabel(race.venueUtcOffset)}`
                : ""}
            </small>
          </div>
          <Link
            to={`/season/${season}?tab=${tab}&round=${race.round}`}
            tabIndex={visible ? 0 : -1}
          >
            {tab === "results"
              ? vi
                ? "Xem kết quả"
                : "View results"
              : vi
                ? "Xem lịch chặng"
                : "View weekend"}
          </Link>
        </div>
      </div>
    </section>
  );
}
