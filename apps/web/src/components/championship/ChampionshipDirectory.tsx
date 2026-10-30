import { getStandings } from "../../data/championship";
import { getSeasonDriverNumber } from "../../data/championship/raceClassificationHelper";
import { DRIVERS_DATA } from "../../data/drivers";
import { getTeamSeasonProfile } from "../../data/teamSeasons";
import { useNavigationStore } from "../../store/useNavigationStore";
import type { SeasonYear } from "../../types";
import { ProfileIdentityCard } from "./ProfileIdentityCard";
import "./championshipC11.css";

export function ChampionshipDirectory({
  season,
  kind,
}: {
  season: SeasonYear;
  kind: "teams" | "drivers";
}) {
  const lang = useNavigationStore((state) => state.lang);
  const isDrivers = kind === "drivers";
  const standings = getStandings(season);
  const teams = [...standings.constructors].sort((a, b) =>
    a.teamName.localeCompare(b.teamName),
  );
  const drivers = [...standings.drivers].sort((a, b) =>
    a.driverName.localeCompare(b.driverName),
  );
  return (
    <section
      className="c11-directory"
      aria-label={
        isDrivers
          ? lang === "vi"
            ? "Tay đua"
            : "Drivers"
          : lang === "vi"
            ? "Đội đua"
            : "Teams"
      }
    >
      <header className="c1-section-head">
        <div>
          <h2>
            {isDrivers
              ? lang === "vi"
                ? "Tay đua"
                : "Drivers"
              : lang === "vi"
                ? "Đội đua"
                : "Teams"}
          </h2>
          <p>
            {lang === "vi"
              ? `Giới thiệu các ${isDrivers ? "tay đua" : "đội đua"} trong mùa ${season}. Chọn tên để xem hồ sơ.`
              : `Meet the ${isDrivers ? "drivers" : "constructors"} of the ${season} season. Select a name for the profile.`}
          </p>
        </div>
      </header>
      <div className="c11-directory-list">
        {isDrivers
          ? drivers.map((driver) => {
              const profile = DRIVERS_DATA[driver.driverId];
              const number = getSeasonDriverNumber(season, driver.driverId);
              return (
                <ProfileIdentityCard
                  key={driver.driverId}
                  kind="driver"
                  teamId={driver.teamId}
                  href={`/drivers/${driver.driverId}?season=${season}`}
                  name={driver.driverName}
                  number={number}
                  meta={
                    profile?.country || driver.countryFlag || driver.driverCode
                  }
                  detail={driver.teamName}
                  action={lang === "vi" ? "Hồ sơ tay đua" : "Driver profile"}
                />
              );
            })
          : teams.map((team) => {
              const profile = getTeamSeasonProfile(team.teamId, season);
              return (
                <ProfileIdentityCard
                  key={team.teamId}
                  kind="team"
                  teamId={team.teamId}
                  href={`/teams/${team.teamId}?season=${season}`}
                  name={profile?.fullName || team.teamName}
                  meta={
                    profile?.base ||
                    (lang === "vi"
                      ? "Chưa có địa điểm được xác minh"
                      : "Base unavailable")
                  }
                  detail={
                    profile?.powerUnit
                      ? `${lang === "vi" ? "Động cơ" : "Power unit"}: ${profile.powerUnit}`
                      : lang === "vi"
                        ? "Thông tin đội theo mùa"
                        : "Season team profile"
                  }
                  action={lang === "vi" ? "Hồ sơ đội đua" : "Team profile"}
                />
              );
            })}
      </div>
    </section>
  );
}
