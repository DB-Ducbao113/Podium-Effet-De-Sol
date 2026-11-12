import { useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { TEAMS_DATA } from "../../../data/teams";
import type {
  ConstructorStanding,
  DriverStanding,
  SeasonYear,
} from "../../../types";
import { MiniRaceCar } from "./MiniRaceCar";
import "./mini-race.css";

type Props = {
  season: SeasonYear;
  category: "drivers" | "constructors";
  rows: DriverStanding[] | ConstructorStanding[];
  lang: "vi" | "en";
};

export function MiniRaceLeaderboard({ season, category, rows, lang }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const isDrivers = category === "drivers";
  const idOf = (row: DriverStanding | ConstructorStanding) =>
    isDrivers ? (row as DriverStanding).driverId : row.teamId;
  const selected = rows.find((row) => idOf(row) === selectedId) ?? rows[0];
  const leaderPoints = Math.max(0, rows[0]?.points ?? 0);
  const hasReviewCarPack =
    import.meta.env.DEV && [2024, 2025, 2026].includes(season);

  return (
    <section
      className="mini-race"
      aria-label={
        lang === "vi"
          ? "Cuộc đua vô địch theo điểm"
          : "Championship points race"
      }
    >
      <div className="mini-race__heading">
        <div>
          <span className="mini-race__eyebrow">
            {season} / {isDrivers
              ? (lang === "vi" ? "TAY ĐUA" : "DRIVERS")
              : (lang === "vi" ? "ĐỘI ĐUA" : "CONSTRUCTORS")}
          </span>
          <h2>{lang === "vi"
            ? <>Cuộc đua <em>điểm số.</em></>
            : <>The <em>points race.</em></>}</h2>
          <p>
            {lang === "vi"
              ? "Mỗi làn là một hạng; vị trí xe theo điểm so với P1."
              : "Each lane is a rank; car position shows points relative to P1."}
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="mini-race__empty">
          {lang === "vi"
            ? "Chưa có dữ liệu xếp hạng cho mùa này."
            : "No standings available for this season."}
        </p>
      ) : (
        <div className="mini-race__layout">
          <div className="mini-race__arena">
            <div className="mini-race__scale" aria-hidden="true">
              <span>0 PTS</span>
              <span>P1 POINTS</span>
            </div>
            <ol className="mini-race__lanes" data-show-all={showAll}>
              {rows.map((row, index) => {
                const id = idOf(row);
                const name = isDrivers
                  ? (row as DriverStanding).driverName
                  : row.teamName;
                const secondary = isDrivers
                  ? `${(row as DriverStanding).driverCode} · ${row.teamName}`
                  : (row as ConstructorStanding).engine.trim().toLowerCase() ===
                      name.trim().toLowerCase()
                    ? null
                    : (row as ConstructorStanding).engine;
                const progress =
                  leaderPoints > 0
                    ? Math.min(
                        100,
                        Math.max(0, (row.points / leaderPoints) * 100),
                      )
                    : 0;
                const gap = Math.max(0, leaderPoints - row.points);
                const style = {
                  "--mini-race-progress": `${progress}%`,
                  "--mini-race-team":
                    TEAMS_DATA[row.teamId]?.primaryColor ?? "#aab2bd",
                } as CSSProperties;
                return (
                  <li
                    className="mini-race__lane"
                    key={id}
                    style={style}
                    data-mobile-extra={index >= 5}
                  >
                    <button
                      type="button"
                      className="mini-race__select"
                      aria-pressed={idOf(selected) === id}
                      onClick={() => setSelectedId(id)}
                      aria-label={`${name}, P${row.rank}, ${row.points} ${lang === "vi" ? "điểm" : "points"}, ${gap} ${lang === "vi" ? "điểm sau người dẫn đầu" : "points behind leader"}`}
                    >
                      <span className="mini-race__rank">P{row.rank}</span>
                      <span
                        className={`mini-race__identity mini-race__identity--${category}`}
                      >
                        <strong>{name}</strong>
                        {secondary && <small>{secondary}</small>}
                      </span>
                      <span className="mini-race__track" aria-hidden="true">
                        <span className="mini-race__travel" />
                        <MiniRaceCar
                          key={`${season}-${row.teamId}`}
                          season={season}
                          teamId={row.teamId}
                          eager={index < 5}
                        />
                      </span>
                      <span className="mini-race__points">
                        <strong>{row.points}</strong>
                        <small>PTS</small>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
            {rows.length > 5 && (
              <button
                type="button"
                className="mini-race__expand"
                onClick={() => setShowAll(!showAll)}
                aria-expanded={showAll}
              >
                {showAll
                  ? "Top 5"
                  : lang === "vi"
                    ? `Xem đủ ${rows.length} xe`
                    : `Show all ${rows.length}`}
              </button>
            )}
            <p className="mini-race__note">
              {lang === "vi"
                ? hasReviewCarPack
                  ? `Theo điểm vô địch, không phải vị trí GP. Xe ${season} minh họa; số và logo có thể khác.`
                  : "Theo điểm vô địch, không phải vị trí GP."
                : hasReviewCarPack
                  ? `Championship points, not GP positions. ${season} cars are illustrations; numbers and logos may differ.`
                  : "Championship points, not GP positions."}
            </p>
          </div>
          {selected && (
            <aside
              className="mini-race__inspector"
              aria-label={
                lang === "vi"
                  ? "Thông tin xe đã chọn"
                  : "Selected entry details"
              }
            >
              <strong className="mini-race__inspector-rank">
                P{selected.rank}
              </strong>
              <h3>
                {isDrivers
                  ? (selected as DriverStanding).driverName
                  : selected.teamName}
              </h3>
              {isDrivers && <p>{selected.teamName}</p>}
              <dl>
                <div>
                  <dt>{lang === "vi" ? "Điểm" : "Points"}</dt>
                  <dd>{selected.points}</dd>
                </div>
                <div>
                  <dt>{lang === "vi" ? "Kém P1" : "Gap to P1"}</dt>
                  <dd>{Math.max(0, leaderPoints - selected.points)}</dd>
                </div>
                <div>
                  <dt>{lang === "vi" ? "Chiến thắng" : "Wins"}</dt>
                  <dd>{selected.wins}</dd>
                </div>
                <div>
                  <dt>Podiums</dt>
                  <dd>{selected.podiums}</dd>
                </div>
              </dl>
              <Link
                to={
                  isDrivers
                    ? `/drivers/${(selected as DriverStanding).driverId}`
                    : `/teams/${selected.teamId}`
                }
              >
                {lang === "vi" ? "Xem hồ sơ" : "View profile"} →
              </Link>
            </aside>
          )}
        </div>
      )}
    </section>
  );
}
