import { useNavigationStore } from "../../store/useNavigationStore";
import type { SeasonYear } from "../../types";
import {
  DriverGrid,
  PortraitCredits,
  TeamGrid,
} from "../directory/DirectorySurfaces";
import { useSeasonDirectoryData } from "../directory/useSeasonDirectoryData";
import { useDirectoryReveal } from "../directory/useDirectoryReveal";
import "../directory/directory.css";
import "../directory/teamGarage.css";

export function ChampionshipDirectory({
  season,
  kind,
}: {
  season: SeasonYear;
  kind: "teams" | "drivers";
}) {
  const lang = useNavigationStore((state) => state.lang);
  const isDrivers = kind === "drivers";
  const { standings } = useSeasonDirectoryData(season);
  const teams = [...standings.constructors].sort((a, b) => a.rank - b.rank);
  const drivers = [...standings.drivers].sort((a, b) => a.rank - b.rank);
  const revealRef = useDirectoryReveal<HTMLElement>(`embedded-${kind}-${season}`);

  return (
    <section
      ref={revealRef}
      className="p5-gallery-embedded"
      aria-label={
        isDrivers
          ? lang === "vi" ? "Tay đua" : "Drivers"
          : lang === "vi" ? "Đội đua" : "Teams"
      }
    >
      <div className="p5-section-head" data-p5-reveal>
        <div>
          <p className="p5-kicker">
            {season} <span aria-hidden="true">/</span>{' '}
            {isDrivers
              ? lang === "vi" ? "DANH SÁCH" : "DIRECTORY"
              : lang === "vi" ? "DANH SÁCH" : "DIRECTORY"}
          </p>
          <h2>
            {isDrivers
              ? lang === "vi" ? "Tay đua" : "Drivers"
              : lang === "vi" ? "Đội đua" : "Teams"}
          </h2>
        </div>
        <p className="p5-section-note">
          {lang === "vi"
            ? `Xếp theo thứ hạng ${season}. Chọn thẻ để mở hồ sơ.`
            : `Ordered by ${season} position. Select a card to open its profile.`}
        </p>
      </div>
      {isDrivers ? (
        <DriverGrid
          rows={drivers}
          season={season}
          lang={lang}
          emptyLabel={lang === "vi" ? "Chưa có tay đua trong dữ liệu mùa này." : "No drivers are available for this season."}
        />
      ) : (
        <TeamGrid
          rows={teams}
          season={season}
          lang={lang}
          drivers={standings.drivers}
          emptyLabel={lang === "vi" ? "Chưa có đội đua trong dữ liệu mùa này." : "No teams are available for this season."}
        />
      )}
      <PortraitCredits lang={lang} driverIds={standings.drivers.map((driver) => driver.driverId)} season={season} />
    </section>
  );
}