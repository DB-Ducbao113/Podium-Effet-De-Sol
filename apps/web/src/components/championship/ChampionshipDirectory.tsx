import { useNavigationStore } from "../../store/useNavigationStore";
import type { SeasonYear } from "../../types";
import {
  P5DriverGrid,
  P5PortraitCredit,
  P5TeamGrid,
} from "../p5/P5DirectorySurfaces";
import { useP5SeasonData } from "../p5/useP5ChampionshipData";
import { useP5Reveal } from "../p5/useP5Reveal";
import "../p5/p5.css";
import "../p5/p5TeamGarage.css";

export function ChampionshipDirectory({
  season,
  kind,
}: {
  season: SeasonYear;
  kind: "teams" | "drivers";
}) {
  const lang = useNavigationStore((state) => state.lang);
  const isDrivers = kind === "drivers";
  const { standings } = useP5SeasonData(season);
  const teams = [...standings.constructors].sort((a, b) => a.rank - b.rank);
  const drivers = [...standings.drivers].sort((a, b) => a.rank - b.rank);
  const revealRef = useP5Reveal<HTMLElement>(`embedded-${kind}-${season}`);

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
        <P5DriverGrid
          rows={drivers}
          season={season}
          lang={lang}
          emptyLabel={lang === "vi" ? "Chưa có tay đua trong dữ liệu mùa này." : "No drivers are available for this season."}
        />
      ) : (
        <P5TeamGrid
          rows={teams}
          season={season}
          lang={lang}
          drivers={standings.drivers}
          emptyLabel={lang === "vi" ? "Chưa có đội đua trong dữ liệu mùa này." : "No teams are available for this season."}
        />
      )}
      <P5PortraitCredit lang={lang} driverIds={standings.drivers.map((driver) => driver.driverId)} season={season} />
    </section>
  );
}