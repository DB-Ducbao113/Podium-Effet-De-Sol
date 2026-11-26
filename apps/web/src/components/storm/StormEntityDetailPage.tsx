import { ArrowLeft, ArrowRight, Box } from "lucide-react";
import { useMemo, type CSSProperties } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  getCarById,
  getCarsBySeason,
  resolveTechnicalHighlights,
} from "../../data/cars";
import { getStandings } from "../../data/championship";
import { getSeasonDriverNumber } from "../../data/championship/raceClassificationHelper";
import { DRIVERS_DATA, getDriverCareerStats } from "../../data/drivers";
import { TEAMS_DATA } from "../../data/teams";
import { getTeamSeasonProfile } from "../../data/teamSeasons";
import { useNavigationStore } from "../../store/useNavigationStore";
import { isSeasonYear, type SeasonYear, type TeamId } from "../../types";
import { TEAM_TEXT_PALETTE } from "../../utils/teamColors";
import { StormNotFound } from "./StormNotFound";
import { StormVisualImage } from "./StormVisualImage";

const SEASONS: readonly SeasonYear[] = [2024, 2025, 2026];

export interface StormEntityDetailPageProps {
  readonly entityKind: "team" | "driver" | "car";
}

export function StormEntityDetailPage({
  entityKind,
}: StormEntityDetailPageProps) {
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const lang = useNavigationStore((s) => s.lang);
  const isVi = lang === "vi";

  const rawSeason = searchParams.get("season");
  const selectedSeason: SeasonYear = isSeasonYear(rawSeason ?? undefined)
    ? (Number(rawSeason) as SeasonYear)
    : 2026;

  const setSeasonParam = (next: SeasonYear) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("season", String(next));
    setSearchParams(nextParams);
  };

  const driverIdParam = params.driverId ?? "";
  const driverSeasonEntry = useMemo(
    () =>
      entityKind === "driver"
        ? getStandings(selectedSeason).drivers.find(
            (d) => d.driverId === driverIdParam,
          )
        : undefined,
    [driverIdParam, entityKind, selectedSeason],
  );
  const driverAnySeasonEntry = useMemo(
    () =>
      entityKind === "driver"
        ? SEASONS.map((yr) =>
            getStandings(yr).drivers.find((d) => d.driverId === driverIdParam),
          ).find(Boolean)
        : undefined,
    [driverIdParam, entityKind],
  );

  if (entityKind === "car") {
    const car = params.carId ? getCarById(params.carId) : undefined;
    if (!car) {
      return (
        <StormNotFound
          kicker="404 · CAR DOSSIER NOT FOUND"
          title={isVi ? "Không tìm thấy hồ sơ mẫu xe" : "Car profile not found"}
          backHref="/teams"
          backLabel={isVi ? "Về Danh bạ Đội đua" : "Back to Teams Directory"}
        />
      );
    }
    const team = TEAMS_DATA[car.teamId];
    const seasonProfile = getTeamSeasonProfile(car.teamId, car.season);
    const accent =
      TEAM_TEXT_PALETTE[car.teamId]?.dark ?? car.primaryColor ?? "#ff6a3d";
    const specs = car.officialSpecs;
    const resolvedHighlights = resolveTechnicalHighlights(
      car.technicalHighlights,
      lang,
    );
    const highlightRows = [
      [
        isVi ? "Hệ thống treo trước" : "Front suspension",
        resolvedHighlights?.frontSuspension,
      ],
      [
        isVi ? "Hệ thống treo sau" : "Rear suspension",
        resolvedHighlights?.rearSuspension,
      ],
      [
        isVi ? "Triết lý khí động học" : "Aerodynamic philosophy",
        resolvedHighlights?.aeroPhilosophy,
      ],
      [
        isVi ? "Hiệu ứng mặt đất" : "Ground effect",
        resolvedHighlights?.groundEffectNotes,
      ],
      [
        isVi ? "Kết cấu khung gầm" : "Chassis construction",
        resolvedHighlights?.chassisConstruction,
      ],
    ].filter(([, val]) => Boolean(val)) as [string, string][];

    return (
      <div
        className="sp-lg-wrap sp-entity-detail"
        data-testid="storm-car-detail"
        style={{ "--tc": accent } as CSSProperties}
      >
        <nav className="sp-entity-crumbs" aria-label="Breadcrumb">
          <Link
            to={`/teams/${car.teamId}?season=${car.season}`}
            className="sp-entity-back"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            <span>
              {seasonProfile?.fullName ?? team?.fullName ?? car.teamId}
            </span>
          </Link>
          <span className="sp-mono-dim">/</span>
          <span className="sp-mono-tag">{car.name}</span>
        </nav>

        <header className="sp-lg-panel sp-entity-hero">
          <div className="sp-entity-hero__copy">
            <div className="sp-lg-kick">
              {isVi
                ? `MẪU XE ĐUA · MÙA ${car.season}`
                : `CHASSIS DOSSIER · SEASON ${car.season}`}
            </div>
            <h1 className="sp-lg-h1">{car.name}</h1>
            <p className="sp-hero-lead">
              {(isVi ? car.descriptionVi : car.descriptionEn) ??
                `${seasonProfile?.fullName ?? team?.fullName ?? ""} · ${car.powerUnit}`}
            </p>
            <div className="sp-hero-actions">
              <Link
                to={`/teams/${car.teamId}?season=${car.season}`}
                className="sp-storm-btn sp-storm-btn--secondary"
              >
                <span>{isVi ? "Hồ sơ Đội đua" : "Team Profile"}</span>
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
              <Link
                to={`/showroom?team=${car.teamId}`}
                className="sp-storm-btn sp-storm-btn--primary"
              >
                <Box size={15} aria-hidden="true" />
                <span>
                  {isVi
                    ? "Soi trong Garage 3D FP-04 RB"
                    : "Open in FP-04 RB 3D Garage"}
                </span>
              </Link>
            </div>
          </div>

          <div className="sp-entity-hero__visual">
            <StormVisualImage
              kind="car"
              season={car.season}
              entityId={car.teamId}
              alt={`${car.name} ${car.season} F1 car`}
              className="sp-entity-visual-frame"
              placeholder={car.name}
              showProvenanceNote
              loading="eager"
            />
          </div>
        </header>

        <div className="sp-entity-grid">
          <section className="sp-lg-panel sp-panel">
            <span className="sp-mono-tag">
              {isVi ? "THÔNG SỐ CHÍNH" : "CORE SPECIFICATIONS"}
            </span>
            <h2 className="sp-panel-title">
              {isVi ? "Cấu hình kỹ thuật" : "Technical configuration"}
            </h2>
            <dl className="sp-drawer-rows">
              <div className="sp-drawer-row">
                <dt>{isVi ? "Đơn vị động lực" : "Power Unit"}</dt>
                <dd>{car.powerUnit}</dd>
              </div>
              {car.designer ? (
                <div className="sp-drawer-row">
                  <dt>{isVi ? "Chỉ đạo kỹ thuật" : "Technical Lead"}</dt>
                  <dd>{car.designer}</dd>
                </div>
              ) : null}
              <div className="sp-drawer-row">
                <dt>{isVi ? "Tay đua" : "Drivers"}</dt>
                <dd>{car.drivers.join(" · ")}</dd>
              </div>
              {specs ? (
                <>
                  <div className="sp-drawer-row">
                    <dt>{isVi ? "Khối lượng tối thiểu" : "Min Weight"}</dt>
                    <dd>{specs.minWeightKg} kg</dd>
                  </div>
                  <div className="sp-drawer-row">
                    <dt>{isVi ? "Động cơ" : "Engine"}</dt>
                    <dd>
                      {specs.engineConfig} · {specs.displacementLiters}L
                    </dd>
                  </div>
                  <div className="sp-drawer-row">
                    <dt>{isVi ? "Hộp số" : "Gearbox"}</dt>
                    <dd>{specs.gearbox}</dd>
                  </div>
                </>
              ) : null}
            </dl>
          </section>

          <section className="sp-lg-panel sp-panel">
            <span className="sp-mono-tag">
              {isVi ? "GHI CHÚ KHÍ ĐỘNG & KHUNG GẦM" : "AERO & CHASSIS NOTES"}
            </span>
            <h2 className="sp-panel-title">
              {isVi ? "Điểm nhấn kỹ thuật" : "Engineering highlights"}
            </h2>
            {highlightRows.length > 0 ? (
              <dl className="sp-drawer-rows">
                {highlightRows.map(([label, val]) => (
                  <div key={label} className="sp-drawer-row">
                    <dt>{label}</dt>
                    <dd>{val}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="sp-panel-sub">
                {isVi
                  ? "Ghi chú chi tiết đang được cập nhật theo hồ sơ kỹ thuật mùa giải."
                  : "Detailed chassis notes are maintained alongside verified season engineering briefs."}
              </p>
            )}
          </section>
        </div>
      </div>
    );
  }

  if (entityKind === "team") {
    const teamId = (params.teamId ?? "") as TeamId;
    const team = TEAMS_DATA[teamId];
    if (!team) {
      return (
        <StormNotFound
          kicker="404 · TEAM DOSSIER NOT FOUND"
          title={
            isVi ? "Không tìm thấy hồ sơ đội đua" : "Team profile not found"
          }
          backHref="/teams"
          backLabel={isVi ? "Về Danh bạ Đội đua" : "Back to Teams Directory"}
        />
      );
    }

    const profile = getTeamSeasonProfile(team.id, selectedSeason);
    const standings = getStandings(selectedSeason);
    const constructorEntry = standings.constructors.find(
      (c) => c.teamId === team.id,
    );
    const teamDrivers = standings.drivers.filter((d) => d.teamId === team.id);
    const seasonCar = getCarsBySeason(selectedSeason).find(
      (c) => c.teamId === team.id,
    );
    const accent =
      TEAM_TEXT_PALETTE[team.id]?.dark ?? team.primaryColor ?? "#ff6a3d";

    return (
      <div
        className="sp-lg-wrap sp-entity-detail"
        data-testid="storm-team-detail"
        style={{ "--tc": accent } as CSSProperties}
      >
        <div className="sp-entity-topbar">
          <Link to="/teams" className="sp-entity-back">
            <ArrowLeft size={14} aria-hidden="true" />
            <span>{isVi ? "Danh bạ Đội đua" : "Teams Directory"}</span>
          </Link>

          <div
            className="sp-lg-panel sp-lg-years"
            role="group"
            aria-label="Season"
          >
            {SEASONS.map((yr) => (
              <button
                key={yr}
                type="button"
                aria-pressed={selectedSeason === yr}
                className={`sp-lg-ybtn ${selectedSeason === yr ? "is-active" : ""}`}
                onClick={() => setSeasonParam(yr)}
              >
                {yr}
              </button>
            ))}
          </div>
        </div>

        <header className="sp-lg-panel sp-entity-hero">
          <div className="sp-entity-hero__copy">
            <div className="sp-lg-kick">
              {isVi
                ? `ĐỘI ĐUA · MÙA GIẢI ${selectedSeason}`
                : `CONSTRUCTOR · SEASON ${selectedSeason}`}
            </div>
            <h1 className="sp-lg-h1">{profile?.fullName ?? team.fullName}</h1>
            <p className="sp-hero-lead">
              {`${profile?.base ?? team.base} · ${profile?.powerUnit ?? team.powerUnit}`}
            </p>

            <div className="sp-drawer-metrics">
              <div className="sp-drawer-metric">
                <span className="sp-drawer-metric-label">
                  {isVi
                    ? `Thứ hạng ${selectedSeason}`
                    : `${selectedSeason} Rank`}
                </span>
                <strong className="sp-drawer-metric-val">
                  {constructorEntry ? `P${constructorEntry.rank}` : "—"}
                </strong>
              </div>
              <div className="sp-drawer-metric">
                <span className="sp-drawer-metric-label">
                  {isVi
                    ? `Điểm số ${selectedSeason}`
                    : `${selectedSeason} Points`}
                </span>
                <strong className="sp-drawer-metric-val">
                  {constructorEntry
                    ? `${constructorEntry.points} PTS`
                    : "0 PTS"}
                </strong>
              </div>
              <div className="sp-drawer-metric">
                <span className="sp-drawer-metric-label">
                  {isVi ? "Chiến thắng" : "Wins"}
                </span>
                <strong className="sp-drawer-metric-val">
                  {constructorEntry?.wins ?? 0}
                </strong>
              </div>
              <div className="sp-drawer-metric">
                <span className="sp-drawer-metric-label">Podiums</span>
                <strong className="sp-drawer-metric-val">
                  {constructorEntry?.podiums ?? 0}
                </strong>
              </div>
            </div>

            <div className="sp-hero-actions">
              <Link
                to={`/showroom?team=${team.id}`}
                className="sp-storm-btn sp-storm-btn--primary"
              >
                <Box size={15} aria-hidden="true" />
                <span>
                  {isVi ? "Mở Garage 3D 2 Xe" : "Open 2-Bay 3D Garage"}
                </span>
              </Link>
              {seasonCar ? (
                <Link
                  to={`/cars/${seasonCar.id}`}
                  className="sp-storm-btn sp-storm-btn--secondary"
                >
                  <span>
                    {isVi
                      ? `Hồ sơ xe ${seasonCar.name}`
                      : `${seasonCar.name} Chassis`}
                  </span>
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              ) : null}
            </div>
          </div>

          <div className="sp-entity-hero__visual">
            <StormVisualImage
              kind="car"
              season={selectedSeason}
              entityId={team.id}
              alt={`${profile?.fullName ?? team.fullName} ${selectedSeason} F1 car`}
              className="sp-entity-visual-frame"
              placeholder={team.name}
              showProvenanceNote
              loading="eager"
            />
          </div>
        </header>

        <div className="sp-entity-grid">
          <section className="sp-lg-panel sp-panel">
            <span className="sp-mono-tag">
              {isVi ? "THÔNG TIN ĐỘI ĐUA" : "CONSTRUCTOR BRIEF"}
            </span>
            <h2 className="sp-panel-title">
              {isVi ? "Tổ chức & Động lực" : "Operations & Power Unit"}
            </h2>
            <dl className="sp-drawer-rows">
              <div className="sp-drawer-row">
                <dt>
                  {profile?.teamLeadTitle ??
                    (isVi ? "Lãnh đội" : "Team Principal")}
                </dt>
                <dd>{profile?.teamLead ?? team.teamPrincipal}</dd>
              </div>
              <div className="sp-drawer-row">
                <dt>{isVi ? "Trụ sở" : "Base"}</dt>
                <dd>{profile?.base ?? team.base}</dd>
              </div>
              <div className="sp-drawer-row">
                <dt>{isVi ? "Động cơ" : "Power Unit"}</dt>
                <dd>{profile?.powerUnit ?? team.powerUnit}</dd>
              </div>
              {seasonCar ? (
                <div className="sp-drawer-row">
                  <dt>{isVi ? "Khung gầm" : "Chassis"}</dt>
                  <dd>{seasonCar.name}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="sp-lg-panel sp-panel">
            <span className="sp-mono-tag">
              {isVi
                ? `ĐỘI HÌNH TAY ĐUA ${selectedSeason}`
                : `${selectedSeason} DRIVER LINEUP`}
            </span>
            <h2 className="sp-panel-title">
              {isVi ? "Tay đua chính thức" : "Race drivers"}
            </h2>
            <div className="sp-pulse-rows">
              {teamDrivers.map((d) => {
                const num =
                  getSeasonDriverNumber(selectedSeason, d.driverId) ??
                  DRIVERS_DATA[d.driverId]?.number;
                return (
                  <Link
                    key={d.driverId}
                    to={`/drivers/${d.driverId}?season=${selectedSeason}`}
                    className="sp-pulse-row-btn"
                  >
                    <span className="sp-pulse-row-main">
                      <strong>
                        {num ? `#${num} · ` : ""}
                        {d.driverCode}
                      </strong>
                      <span>{d.driverName}</span>
                    </span>
                    <span className="sp-pulse-row-meta">
                      P{d.rank} · {d.points} PTS →
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    );
  }

  // Driver Detail
  const driverRecord = DRIVERS_DATA[driverIdParam];
  if (!driverRecord && !driverAnySeasonEntry) {
    return (
      <StormNotFound
        kicker="404 · DRIVER DOSSIER NOT FOUND"
        title={
          isVi ? "Không tìm thấy hồ sơ tay đua" : "Driver profile not found"
        }
        backHref="/drivers"
        backLabel={isVi ? "Về Danh bạ Tay đua" : "Back to Drivers Directory"}
      />
    );
  }

  const effectiveTeamId = (driverSeasonEntry?.teamId ??
    driverRecord?.teamId ??
    driverAnySeasonEntry?.teamId) as TeamId | undefined;
  const driverTeam = effectiveTeamId ? TEAMS_DATA[effectiveTeamId] : undefined;
  const teamProfile = effectiveTeamId
    ? getTeamSeasonProfile(effectiveTeamId, selectedSeason)
    : undefined;
  const seasonNumber =
    getSeasonDriverNumber(selectedSeason, driverIdParam) ??
    driverRecord?.number;
  const careerStats = getDriverCareerStats(driverIdParam, selectedSeason);
  const accent =
    (effectiveTeamId ? TEAM_TEXT_PALETTE[effectiveTeamId]?.dark : undefined) ??
    "#ff6a3d";
  const displayName =
    driverSeasonEntry?.driverName ??
    driverRecord?.name ??
    driverAnySeasonEntry?.driverName ??
    driverIdParam;

  return (
    <div
      className="sp-lg-wrap sp-entity-detail"
      data-testid="storm-driver-detail"
      style={{ "--tc": accent } as CSSProperties}
    >
      <div className="sp-entity-topbar">
        <Link to="/drivers" className="sp-entity-back">
          <ArrowLeft size={14} aria-hidden="true" />
          <span>{isVi ? "Danh bạ Tay đua" : "Drivers Directory"}</span>
        </Link>

        <div
          className="sp-lg-panel sp-lg-years"
          role="group"
          aria-label="Season"
        >
          {SEASONS.map((yr) => (
            <button
              key={yr}
              type="button"
              aria-pressed={selectedSeason === yr}
              className={`sp-lg-ybtn ${selectedSeason === yr ? "is-active" : ""}`}
              onClick={() => setSeasonParam(yr)}
            >
              {yr}
            </button>
          ))}
        </div>
      </div>

      <header className="sp-lg-panel sp-entity-hero">
        <div className="sp-entity-hero__copy">
          <div className="sp-lg-kick">
            #{seasonNumber ?? "—"} ·{" "}
            {driverSeasonEntry?.driverCode ?? driverRecord?.code ?? ""} ·{" "}
            {selectedSeason}
          </div>
          <h1 className="sp-lg-h1">{displayName}</h1>
          <p className="sp-hero-lead">
            {[
              driverRecord?.country,
              teamProfile?.fullName ??
                driverTeam?.fullName ??
                driverSeasonEntry?.teamName,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>

          <div className="sp-drawer-metrics">
            <div className="sp-drawer-metric">
              <span className="sp-drawer-metric-label">
                {isVi ? `Thứ hạng ${selectedSeason}` : `${selectedSeason} Rank`}
              </span>
              <strong className="sp-drawer-metric-val">
                {driverSeasonEntry ? `P${driverSeasonEntry.rank}` : "—"}
              </strong>
            </div>
            <div className="sp-drawer-metric">
              <span className="sp-drawer-metric-label">
                {isVi
                  ? `Điểm mùa ${selectedSeason}`
                  : `${selectedSeason} Points`}
              </span>
              <strong className="sp-drawer-metric-val">
                {driverSeasonEntry
                  ? `${driverSeasonEntry.points} PTS`
                  : "0 PTS"}
              </strong>
            </div>
            <div className="sp-drawer-metric">
              <span className="sp-drawer-metric-label">
                {isVi ? "Thắng sự nghiệp" : "Career Wins"}
              </span>
              <strong className="sp-drawer-metric-val">
                {careerStats.careerWins}
              </strong>
            </div>
            <div className="sp-drawer-metric">
              <span className="sp-drawer-metric-label">
                {isVi ? "Podium sự nghiệp" : "Career Podiums"}
              </span>
              <strong className="sp-drawer-metric-val">
                {careerStats.podiums}
              </strong>
            </div>
          </div>

          {effectiveTeamId ? (
            <div className="sp-hero-actions">
              <Link
                to={`/teams/${effectiveTeamId}?season=${selectedSeason}`}
                className="sp-storm-btn sp-storm-btn--primary"
              >
                <span>
                  {teamProfile?.fullName ??
                    driverTeam?.fullName ??
                    (isVi ? "Hồ sơ Đội đua" : "Team Profile")}
                </span>
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
              <Link
                to={`/season/${selectedSeason}?tab=standings`}
                className="sp-storm-btn sp-storm-btn--secondary"
              >
                <span>
                  {isVi
                    ? `Bảng xếp hạng ${selectedSeason}`
                    : `${selectedSeason} Standings`}
                </span>
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          ) : null}
        </div>

        <div className="sp-entity-hero__visual sp-entity-hero__visual--portrait">
          <StormVisualImage
            kind="driver"
            season={selectedSeason}
            entityId={driverIdParam}
            alt={`${displayName} ${selectedSeason} portrait`}
            className="sp-entity-portrait-frame"
            placeholder={`#${seasonNumber ?? "—"}`}
            showProvenanceNote
            loading="eager"
          />
        </div>
      </header>
    </div>
  );
}
