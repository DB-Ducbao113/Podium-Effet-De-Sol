import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { DRIVERS_DATA } from "../../data/drivers";
import { getTeamSeasonProfile } from "../../data/teamSeasons";
import { useNavigationStore } from "../../store/useNavigationStore";
import { isSeasonYear, type SeasonYear } from "../../types";
import {
  DriverGrid,
  DriversHero,
  GalleryHero,
  PortraitCredits,
  TeamGrid,
} from "../directory/DirectorySurfaces";
import { useSeasonDirectoryData } from "../directory/useSeasonDirectoryData";
import { useDirectoryReveal } from "../directory/useDirectoryReveal";
import "../directory/directory.css";
import "../directory/directoryLayout.css";
import "../directory/teamGarage.css";
import { DriverIcon } from '../directory/DriverIcon';
import { SEASONAL_ART_ENABLED, packageOnlyDriverVisuals } from '../../utils/seasonalVisuals';

const SEASONS: SeasonYear[] = [2026, 2025, 2024];

export function StandaloneProfileDirectory({
  kind,
  initialSeason = 2026,
  hideHeader = false,
}: {
  kind: "teams" | "drivers";
  initialSeason?: SeasonYear;
  hideHeader?: boolean;
}) {
  const lang = useNavigationStore((state) => state.lang);
  const isDrivers = kind === "drivers";
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSeason = searchParams.get("season");
  const resolvedSeason = isSeasonYear(urlSeason) ? (Number(urlSeason) as SeasonYear) : initialSeason;
  const [season, setSeason] = useState<SeasonYear>(resolvedSeason);
  const [query, setQuery] = useState("");
  useEffect(() => setSeason(resolvedSeason), [resolvedSeason]);

  const changeSeason = (next: SeasonYear) => {
    setSeason(next);
    const params = new URLSearchParams(searchParams);
    params.set("season", String(next));
    setSearchParams(params, { replace: true });
  };

  const normalized = query.trim().toLocaleLowerCase();
  const { standings } = useSeasonDirectoryData(season);
  const drivers = [...standings.drivers]
    .sort((a, b) => a.rank - b.rank)
    .filter((driver) => {
      const profile = DRIVERS_DATA[driver.driverId];
      return (
        !normalized ||
        [
          driver.driverName,
          driver.driverCode,
          driver.teamName,
          profile?.country,
        ].some((value) => value?.toLocaleLowerCase().includes(normalized))
      );
    });
  const teams = [...standings.constructors]
    .sort((a, b) => a.rank - b.rank)
    .filter((team) => {
      const profile = getTeamSeasonProfile(team.teamId, season);
      return (
        !normalized ||
        [
          team.teamName,
          team.engine,
          profile?.fullName,
          profile?.base,
          profile?.powerUnit,
        ].some((value) => value?.toLocaleLowerCase().includes(normalized))
      );
    });

  const count = isDrivers ? drivers.length : teams.length;
  const total = isDrivers ? standings.drivers.length : standings.constructors.length;
  const emptyLabel = isDrivers
    ? lang === "vi"
      ? "Không tìm thấy tay đua phù hợp."
      : "No matching drivers found."
    : lang === "vi"
      ? "Không tìm thấy đội đua phù hợp."
      : "No matching teams found.";
  const creditIds = isDrivers
    ? drivers.map((driver) => driver.driverId)
    : standings.drivers.map((driver) => driver.driverId);
  const packageOnlyIcons = isDrivers && SEASONAL_ART_ENABLED
    ? packageOnlyDriverVisuals(season, standings.drivers.map((driver) => driver.driverId))
    : [];
  const revealRef = useDirectoryReveal<HTMLDivElement>(`${kind}-${season}`);

  return (
    <div
      ref={revealRef}
      className={`p5-gallery-page${isDrivers && !hideHeader ? ' p5-gallery-page-drivers' : ''}`}
    >
      <div className="p5-gallery-inner">
        {!hideHeader && isDrivers && (
          <DriversHero
            season={season}
            driverCount={standings.drivers.length}
            teamCount={standings.constructors.length}
            drivers={standings.drivers}
            lang={lang}
          />
        )}

        {!hideHeader && !isDrivers && (
          <GalleryHero
            kind={kind}
            season={season}
            driverCount={standings.drivers.length}
            teamCount={standings.constructors.length}
            drivers={standings.drivers}
            lang={lang}
          />
        )}

        {hideHeader && (
          <div className="p5-section-head" data-p5-reveal>
            <div>
              <p className="p5-kicker">{season} / {isDrivers ? 'DRIVERS' : 'CONSTRUCTORS'}</p>
              <h2>{isDrivers ? (lang === "vi" ? "Tay đua" : "Drivers") : lang === "vi" ? "Đội đua" : "Teams"}</h2>
            </div>
            <p className="p5-section-note">
              {lang === "vi" ? "Chọn thẻ để mở hồ sơ." : "Select a card to open its profile."}
            </p>
          </div>
        )}

        <div className="p5-controls" data-p5-reveal>
          <label>
            {lang === "vi" ? "Tìm kiếm" : "Search"}
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                isDrivers
                  ? lang === "vi" ? "Tên, đội hoặc quốc gia" : "Name, team or country"
                  : lang === "vi" ? "Đội, động cơ hoặc địa điểm" : "Team, power unit or base"
              }
            />
          </label>
          {!hideHeader && (
            <label>
              {lang === "vi" ? "Mùa giải" : "Season"}
              <select
                value={season}
                onChange={(event) => changeSeason(Number(event.target.value) as SeasonYear)}
              >
                {SEASONS.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </label>
          )}
          <p className="p5-controls-meta" role="status">
            {lang === "vi" ? `${count}/${total} kết quả` : `${count}/${total} results`}
          </p>
        </div>

        {isDrivers ? (
          <DriverGrid rows={drivers} season={season} lang={lang} emptyLabel={emptyLabel} />
        ) : (
          <TeamGrid
            rows={teams}
            season={season}
            lang={lang}
            drivers={standings.drivers}
            emptyLabel={emptyLabel}
          />
        )}

        {packageOnlyIcons.length > 0 && (
          <aside className="p5-package-icons" aria-label={lang === 'vi' ? 'Avatar chỉ có trong gói ảnh' : 'Package-only avatars'}>
            <p className="p5-kicker">{lang === 'vi' ? 'XEM TRƯỚC GÓI ẢNH' : 'PACKAGE REVIEW'}</p>
            <p>{lang === 'vi' ? 'Các avatar này có trong gói ảnh nhưng không có hàng xếp hạng mùa hiện tại; chúng không được gán thứ hạng hay điểm.' : 'These avatars are in the image package but have no current season standings row; no rank or points are assigned.'}</p>
            <div className="p5-package-icons-list">
              {packageOnlyIcons.map((visual) => (
                <span key={visual.driverId}>
                  <DriverIcon season={season} driverId={visual.driverId} teamId={visual.teamId} size={44} />
                  <strong>{DRIVERS_DATA[visual.driverId]?.name ?? (visual.driverId === 'hirakawa' ? 'Ryo Hirakawa' : visual.driverId)}</strong>
                </span>
              ))}
            </div>
          </aside>
        )}

        <PortraitCredits lang={lang} driverIds={creditIds} season={season} />

        <div className="p5-footer-links p5-gallery-links">
          <Link to={`/season/${season}?tab=${isDrivers ? "standings&category=drivers" : "standings&category=constructors"}`}>
            {isDrivers
              ? lang === "vi" ? "Bảng xếp hạng tay đua" : "Driver standings"
              : lang === "vi" ? "Bảng xếp hạng đội đua" : "Constructor standings"}{" "}
            →
          </Link>
          <Link to={`/season/${season}?tab=${isDrivers ? "teams" : "drivers"}`}>
            {isDrivers
              ? lang === "vi" ? "Xem đội đua" : "Explore teams"
              : lang === "vi" ? "Xem tay đua" : "Explore drivers"}{" "}
            →
          </Link>
        </div>
      </div>
    </div>
  );
}
