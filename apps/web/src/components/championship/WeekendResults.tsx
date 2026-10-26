import { Link, useLocation, useNavigate } from "react-router-dom";
import { getCalendarBySeason } from "../../data/championship";
import openF1SessionResults from "../../data/championship/openF1SessionResults2026.json";
import { getRaceResults } from "../../data/championship/results";
import {
  getAvailableResultRounds,
  getAvailableSessions,
  getLatestAvailableResultRound,
  getSessionClassification,
  type ClassificationRow,
  type ResultDataSources,
  type ResultSessionKey,
} from "../../results-engine/availability";
import { useChampionshipStore } from "../../store/useChampionshipStore";
import { useNavigationStore } from "../../store/useNavigationStore";
import { useTimezoneStore } from "../../store/useTimezoneStore";
import type { GrandPrixPracticeData } from "../../types/practice";
import type { GrandPrixQualifyingData } from "../../types/qualifying";
import { UNKNOWN_TEAM_ID, type SeasonYear } from "../../types";
import { formatRaceSessionTime } from "../../utils/championshipTimezone";
import { formatSessionName } from "../../utils/dateUtils";
import { getTeamTextColor } from "../../utils/teamColors";
import { TimezoneSelector } from "./TimezoneSelector";
import "./championshipC11.css";

const SHORT: Record<ResultSessionKey, string> = {
  fp1: "FP1",
  fp2: "FP2",
  fp3: "FP3",
  sprintQualifying: "SQ",
  sprint: "Sprint",
  qualifying: "Q",
  race: "Race",
};
const EMPTY_PRACTICE: Record<number, GrandPrixPracticeData> = {};
const EMPTY_QUALIFYING: Record<number, GrandPrixQualifyingData> = {};
const OPEN = openF1SessionResults as {
  practice: Record<number, GrandPrixPracticeData>;
  qualifying: Record<number, GrandPrixQualifyingData>;
};
const value = (input: string | number | undefined) =>
  input === undefined || input === "" ? "—" : input;

function DriverCell({
  row,
  season,
}: {
  row: ClassificationRow;
  season: SeasonYear;
}) {
  const name = (
    <>
      <strong>{row.driverCode || row.driverName}</strong>
      <span>{row.driverName}</span>
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
  const availableRounds = getAvailableResultRounds(sources);
  const latestRound = getLatestAvailableResultRound(sources);
  const params = new URLSearchParams(location.search);
  const requestedRound = Number(params.get("round"));
  const round = availableRounds.includes(requestedRound)
    ? requestedRound
    : latestRound;

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
  const sessions = getAvailableSessions(sources, round);
  const requestedSession = params.get("session") as ResultSessionKey | null;
  const selectedSession =
    requestedSession && sessions.includes(requestedSession)
      ? requestedSession
      : sessions[0];
  const classification = selectedSession
    ? getSessionClassification(sources, round, selectedSession)
    : null;
  if (!race || !selectedSession || !classification) return null;

  const roundIndex = availableRounds.indexOf(round);
  const change = (nextRound: number, nextSession?: ResultSessionKey) => {
    const next = new URLSearchParams(location.search);
    const targetSessions = getAvailableSessions(sources, nextRound);
    next.set("tab", "results");
    next.set("round", String(nextRound));
    next.set(
      "session",
      nextSession && targetSessions.includes(nextSession)
        ? nextSession
        : targetSessions[0],
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
  const sourceUpdated = classification.lastUpdated
    ? new Date(classification.lastUpdated).toLocaleString(
        lang === "vi" ? "vi-VN" : "en-GB",
        {
          timeZone: preference === "vietnam" ? "Asia/Ho_Chi_Minh" : undefined,
          dateStyle: "medium",
          timeStyle: "short",
        },
      )
    : null;

  return (
    <section
      className="c11-results"
      aria-label={lang === "vi" ? "Kết quả từng phiên" : "Session results"}
    >
      <header className="c11-race-head" key={`${season}-${round}`}>
        <div className="c11-race-identity">
          <span className="c11-round">
            R{String(round).padStart(2, "0")} · {season}
          </span>
          <h2>{race.name}</h2>
          <p>{race.circuit}</p>
        </div>
        <div className="c11-race-controls">
          <label>
            {lang === "vi" ? "Chặng có kết quả" : "Rounds with results"}
            <select
              aria-label={
                lang === "vi"
                  ? "Chọn chặng có kết quả"
                  : "Select a round with results"
              }
              value={round}
              onChange={(event) => change(Number(event.target.value))}
            >
              {availableRounds.map((itemRound) => {
                const item = calendar.find(
                  (candidate) => candidate.round === itemRound,
                );
                return (
                  <option key={itemRound} value={itemRound}>
                    R{String(itemRound).padStart(2, "0")} · {item?.name}
                  </option>
                );
              })}
            </select>
          </label>
          <div className="c11-adjacent">
            <button
              type="button"
              disabled={roundIndex <= 0}
              onClick={() => change(availableRounds[roundIndex - 1])}
              aria-label={
                lang === "vi"
                  ? "Chặng trước có kết quả"
                  : "Previous available round"
              }
            >
              ←
            </button>
            <button
              type="button"
              disabled={roundIndex >= availableRounds.length - 1}
              onClick={() => change(availableRounds[roundIndex + 1])}
              aria-label={
                lang === "vi" ? "Chặng sau có kết quả" : "Next available round"
              }
            >
              →
            </button>
          </div>
        </div>
      </header>
      <div
        className="c11-session-tabs"
        role="tablist"
        aria-label={
          lang === "vi"
            ? "Chọn phiên có kết quả"
            : "Select an available session"
        }
      >
        {sessions.map((key, index) => (
          <button
            key={key}
            id={`c11-tab-${key}`}
            role="tab"
            type="button"
            aria-selected={selectedSession === key}
            aria-controls="c11-classification"
            tabIndex={selectedSession === key ? 0 : -1}
            title={formatSessionName(race.sessions[key]?.name, lang)}
            aria-label={formatSessionName(race.sessions[key]?.name, lang)}
            onClick={() => change(round, key)}
            onKeyDown={(event) => {
              if (
                !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
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
            <span className="c11-session-short">{SHORT[key]}</span>
            <span className="c11-session-long">
              {formatSessionName(race.sessions[key]?.name, lang)}
            </span>
          </button>
        ))}
      </div>
      <div
        id="c11-classification"
        role="tabpanel"
        aria-labelledby={`c11-tab-${selectedSession}`}
        className="c11-classification"
        key={`${season}-${round}-${selectedSession}`}
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
              <span>
                {lang === "vi" ? "Nguồn" : "Source"}: {classification.source}
              </span>
              {sourceUpdated && (
                <span>
                  {lang === "vi" ? "Cập nhật" : "Updated"}: {sourceUpdated}
                </span>
              )}
              <span
                className={`c11-result-state c11-result-state--${classification.status}`}
              >
                {classification.status === "final"
                  ? lang === "vi"
                    ? "Cuối cùng"
                    : "Final"
                  : lang === "vi"
                    ? "Tạm thời"
                    : "Provisional"}
              </span>
            </p>
          </div>
          <details className="c11-timezone">
            <summary>{lang === "vi" ? "Múi giờ" : "Time zone"}</summary>
            <TimezoneSelector lang={lang} />
          </details>
        </div>
        {classification.status === "provisional" && (
          <p className="c11-notice" role="status">
            {lang === "vi"
              ? "Phân hạng tạm thời; dữ liệu có thể được hiệu chỉnh."
              : "Provisional classification; the source may still revise it."}
          </p>
        )}
        {classification.partial && (
          <p className="c11-notice" role="status">
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
        <div className="c11-table-wrap">
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
                  <th scope="col">{lang === "vi" ? "Xuất phát" : "Grid"}</th>
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
                  <th scope="col">{lang === "vi" ? "Trạng thái" : "Status"}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {classification.rows.map((row) => (
                <tr
                  key={`${row.position}-${row.driverId}-${row.driverName}`}
                  style={
                    {
                      "--team-color": getTeamTextColor(row.teamId, true),
                    } as React.CSSProperties
                  }
                >
                  <td
                    data-label={lang === "vi" ? "Vị trí" : "Pos"}
                    className="c11-position"
                  >
                    {row.position > 0
                      ? String(row.position).padStart(2, "0")
                      : "—"}
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
                        {row.teamName}
                      </Link>
                    ) : (
                      row.teamName
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
                    <td data-label={lang === "vi" ? "Trạng thái" : "Status"}>
                      {row.status ? (
                        <span className="c11-row-status">{row.status}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
