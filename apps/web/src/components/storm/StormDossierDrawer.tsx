import { ArrowRight, X } from "lucide-react";
import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { getTeamBadgeUrl } from "../showroom/fp04rb-garage/teamLogos2026";
import type { TeamId as GarageTeamId } from "../showroom/fp04rb-garage/teams2026";
import { INSPECTION_PARTS } from "../showroom/fp04rb-garage/inspectionParts";
import { getRaceResults, getStandings } from "../../data/championship";
import { getSeasonDriverNumber } from "../../data/championship/raceClassificationHelper";
import { DRIVERS_DATA, getDriverCareerStats } from "../../data/drivers";
import { ENGINEERING_ARTICLES } from "../../data/engineeringArticles";
import { TEAMS_DATA } from "../../data/teams";
import { getTeamSeasonProfile } from "../../data/teamSeasons";
import type { SeasonYear } from "../../types";
import { TEAM_TEXT_PALETTE } from "../../utils/teamColors";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { ensureStormGsapPlugins, gsap, useGSAP } from "./motion/gsapPlugins";
import { StormVisualImage } from "./StormVisualImage";
import { resolveStormVisualAsset } from "./stormVisualAssets";
import type { StormInspectionTarget } from "./types";

const GARAGE_TEAM_ID_BY_DATA_TEAM_ID: Readonly<Record<string, GarageTeamId>> = {
  mclaren: "mclaren",
  ferrari: "ferrari",
  mercedes: "mercedes",
  redbull: "red-bull",
  "red-bull": "red-bull",
  racingbulls: "racing-bulls",
  "racing-bulls": "racing-bulls",
  astonmartin: "aston-martin",
  "aston-martin": "aston-martin",
  alpine: "alpine",
  williams: "williams",
  haas: "haas",
  audi: "audi",
  cadillac: "cadillac",
};

function resolveDrawerBadgeUrl(teamId?: string): string | undefined {
  if (!teamId) return undefined;
  const garageId = GARAGE_TEAM_ID_BY_DATA_TEAM_ID[teamId];
  return garageId ? getTeamBadgeUrl(garageId) : undefined;
}

export interface StormDossierDrawerProps {
  readonly inspecting: StormInspectionTarget | null;
  readonly defaultSeason: SeasonYear;
  readonly lang: "vi" | "en";
  readonly onClose: () => void;
}

export function StormDossierDrawer({
  inspecting,
  defaultSeason,
  lang,
  onClose,
}: StormDossierDrawerProps) {
  const isVi = lang === "vi";
  const reducedMotion = useReducedMotion();
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const drawerElementRef = useRef<HTMLElement | null>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      if (!inspecting || reducedMotion || typeof window === "undefined") {
        return;
      }
      const backdrop = backdropRef.current;
      const drawer = drawerElementRef.current;
      if (!backdrop || !drawer) return;

      ensureStormGsapPlugins();

      gsap.fromTo(
        backdrop,
        { opacity: 0 },
        { opacity: 1, duration: 0.22, ease: "power2.out" },
      );

      gsap.fromTo(
        drawer,
        { x: 34, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.36,
          ease: "expo.out",
          clearProps: "transform,opacity",
        },
      );

      const items = drawer.querySelectorAll<HTMLElement>(
        ".sp-drawer-metric, .sp-drawer-row",
      );
      if (items.length > 0) {
        gsap.fromTo(
          items,
          { y: 10, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.32,
            stagger: 0.024,
            delay: 0.08,
            ease: "expo.out",
            clearProps: "transform,opacity",
          },
        );
      }
    },
    {
      scope: backdropRef,
      dependencies: [inspecting, reducedMotion],
      revertOnUpdate: true,
    },
  );

  useEffect(() => {
    if (inspecting) {
      const active = document.activeElement;
      if (active instanceof HTMLElement) {
        triggerElementRef.current = active;
      }
    }
  }, [inspecting]);

  useEffect(() => {
    if (!inspecting) {
      triggerElementRef.current?.focus();
      triggerElementRef.current = null;
      return;
    }

    const drawer = drawerElementRef.current;
    if (!drawer) return;

    const getFocusableElements = () =>
      Array.from(
        drawer.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter(
        (element) =>
          !element.hidden && element.getAttribute("aria-hidden") !== "true",
      );

    getFocusableElements()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = getFocusableElements();
      if (!focusable.length) {
        event.preventDefault();
        drawer.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          !drawer.contains(document.activeElement))
      ) {
        event.preventDefault();
        last?.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !drawer.contains(document.activeElement))
      ) {
        event.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [inspecting, onClose]);

  const drawerContent = useMemo((): {
    kicker: string;
    title: string;
    subtitle: string;
    accentColor?: string;
    badgeUrl?: string;
    season: SeasonYear;
    visual?: {
      kind: "driver" | "car";
      entityId: string;
      alt: string;
      numberBadge?: string;
    };
    metrics?: { label: string; value: string; hint?: string }[];
    note?: string;
    rows: { label: string; value: string }[];
    fullHref?: string;
    fullLabel?: string;
  } | null => {
    if (!inspecting) return null;

    if (inspecting.kind === "race") {
      const season = inspecting.season ?? defaultSeason;
      const race = getRaceResults(season).find(
        (r) => r.round === inspecting.round,
      );
      if (!race) return null;
      return {
        season,
        kicker: `ROUND ${String(race.round).padStart(2, "0")} · ${race.date}`,
        title: race.grandPrix,
        subtitle: race.circuit,
        rows: [
          {
            label: "P1",
            value: `${race.podium.p1.driver}${race.podium.p1.time ? ` (${race.podium.p1.time})` : ""}`,
          },
          {
            label: "P2",
            value: `${race.podium.p2.driver}${race.podium.p2.gap ? ` (${race.podium.p2.gap})` : ""}`,
          },
          {
            label: "P3",
            value: `${race.podium.p3.driver}${race.podium.p3.gap ? ` (${race.podium.p3.gap})` : ""}`,
          },
          ...(race.fastestLap
            ? [
                {
                  label: isVi ? "Vòng nhanh nhất" : "Fastest Lap",
                  value: `${race.fastestLap.driver} · ${race.fastestLap.time}`,
                },
              ]
            : []),
        ],
        fullHref: `/season/${season}/race/${race.round}`,
        fullLabel: isVi
          ? "Mở bảng phân hạng chặng"
          : "Open full race classification",
      };
    }

    if (inspecting.kind === "hotspot") {
      const part = INSPECTION_PARTS.find((p) => p.id === inspecting.hotspotId);
      if (!part) return null;
      return {
        season: defaultSeason,
        kicker: `FP-04 RB · ${part.supported ? "3D MESH" : "CONCEPT NOTE"}`,
        title: part.label[lang],
        subtitle: part.nodeName ?? "FP-04 RB Concept",
        rows: [
          {
            label: isVi ? "Chi tiết" : "Summary",
            value: part.summary[lang],
          },
          ...(part.unsupportedReason
            ? [
                {
                  label: isVi ? "Trạng thái" : "Note",
                  value: part.unsupportedReason[lang],
                },
              ]
            : []),
        ],
        fullHref: "/showroom",
        fullLabel: isVi
          ? "Soi trực tiếp trong Garage 3D"
          : "Inspect in 3D Garage",
      };
    }

    if (inspecting.kind === "article") {
      const article = ENGINEERING_ARTICLES.find(
        (a) => a.slug === inspecting.slug,
      );
      if (!article) return null;
      return {
        season: defaultSeason,
        kicker: article.topic[lang],
        title: article.title[lang],
        subtitle: article.standfirst[lang],
        rows: article.sections.map((s) => ({
          label: s.heading[lang],
          value: s.paragraphs[lang][0] ?? "",
        })),
        fullHref: `/engineering/${article.slug}`,
        fullLabel: isVi
          ? "Đọc toàn văn chuyên đề"
          : "Read full engineering article",
      };
    }

    if (inspecting.kind === "team") {
      const season = inspecting.season ?? defaultSeason;
      const team = TEAMS_DATA[inspecting.teamId];
      if (!team) return null;
      const profile = getTeamSeasonProfile(inspecting.teamId, season);
      const seasonStandings = getStandings(season);
      const seasonConstructor = seasonStandings.constructors.find(
        (c) => c.teamId === inspecting.teamId,
      );
      const seasonDrivers = seasonStandings.drivers.filter(
        (driver) => driver.teamId === inspecting.teamId,
      );
      const hasCarVisual =
        resolveStormVisualAsset("car", season, inspecting.teamId).source !==
        "missing";
      const accentColor =
        TEAM_TEXT_PALETTE[team.id]?.dark ?? team.primaryColor ?? "#ff8a5c";
      const lineupValue = seasonDrivers
        .map((driver) => {
          const num =
            getSeasonDriverNumber(season, driver.driverId) ??
            DRIVERS_DATA[driver.driverId]?.number;
          return `${num ? `#${num} ` : ""}${driver.driverName}`;
        })
        .join(" · ");
      return {
        season,
        kicker: `${isVi ? "ĐỘI ĐUA" : "CONSTRUCTOR"} · ${season}`,
        title: profile?.fullName ?? team.fullName,
        subtitle: profile?.powerUnit ?? team.powerUnit,
        accentColor,
        badgeUrl: resolveDrawerBadgeUrl(inspecting.teamId),
        visual: hasCarVisual
          ? {
              kind: "car",
              entityId: inspecting.teamId,
              alt: `${profile?.fullName ?? team.fullName} ${season} F1 car`,
            }
          : undefined,
        metrics: [
          {
            label: isVi ? `Thứ hạng ${season}` : `${season} Rank`,
            value: seasonConstructor ? `P${seasonConstructor.rank}` : "—",
          },
          {
            label: isVi ? `Điểm mùa ${season}` : `${season} Points`,
            value: seasonConstructor
              ? `${seasonConstructor.points} PTS`
              : "0 PTS",
          },
          {
            label: isVi ? `Chiến thắng ${season}` : `${season} Wins`,
            value: String(seasonConstructor?.wins ?? 0),
          },
          {
            label: isVi ? `Podium ${season}` : `${season} Podiums`,
            value: String(seasonConstructor?.podiums ?? 0),
          },
        ],
        rows: [
          {
            label:
              profile?.teamLeadTitle ?? (isVi ? "Lãnh đội" : "Team Principal"),
            value: profile?.teamLead ?? team.teamPrincipal,
          },
          {
            label: isVi ? "Trụ sở" : "Base",
            value: profile?.base ?? team.base,
          },
          {
            label: isVi ? "Động cơ" : "Power Unit",
            value: profile?.powerUnit ?? team.powerUnit,
          },
          ...(lineupValue
            ? [
                {
                  label: isVi ? `Tay đua ${season}` : `${season} Drivers`,
                  value: lineupValue,
                },
              ]
            : []),
        ],
        note: isVi
          ? `HỒ SƠ ĐỘI ĐUA · MÙA ${season} · MINH HỌA BIÊN TẬP`
          : `CONSTRUCTOR DOSSIER · SEASON ${season} · ILLUSTRATIVE CONCEPT`,
        fullHref: `/teams/${team.id}?season=${season}`,
        fullLabel: isVi ? "Mở trang hồ sơ đội đua" : "Open full team profile",
      };
    }

    const season = inspecting.season ?? defaultSeason;
    const driver = DRIVERS_DATA[inspecting.driverId];
    const seasonDriver = getStandings(season).drivers.find(
      (entry) => entry.driverId === inspecting.driverId,
    );
    if (!driver && !seasonDriver) return null;
    const driverId = seasonDriver?.driverId ?? driver?.id;
    if (!driverId) return null;
    const driverTeamId = seasonDriver?.teamId ?? driver?.teamId;
    const driverTeam = driverTeamId ? TEAMS_DATA[driverTeamId] : undefined;
    const profile = driverTeamId
      ? getTeamSeasonProfile(driverTeamId, season)
      : undefined;
    const seasonNumber =
      getSeasonDriverNumber(season, driverId) ?? driver?.number;
    const stats = getDriverCareerStats(driverId, season);
    const hasDriverVisual =
      resolveStormVisualAsset("driver", season, driverId).source !== "missing";
    const teamDisplayName =
      profile?.fullName ?? driverTeam?.fullName ?? seasonDriver?.teamName ?? "";
    const accentColor =
      (driverTeamId ? TEAM_TEXT_PALETTE[driverTeamId]?.dark : undefined) ??
      "#ff8a5c";
    return {
      season,
      kicker: `#${seasonNumber ?? "—"} · ${seasonDriver?.driverCode ?? driver?.code ?? ""} · ${season}`,
      title: seasonDriver?.driverName ?? driver?.name ?? driverId,
      subtitle: [driver?.country, seasonDriver?.teamName ?? driverTeam?.name]
        .filter(Boolean)
        .join(" · "),
      accentColor,
      badgeUrl: resolveDrawerBadgeUrl(driverTeamId),
      visual: hasDriverVisual
        ? {
            kind: "driver",
            entityId: driverId,
            alt: `${seasonDriver?.driverName ?? driver?.name ?? driverId} ${season} portrait`,
            numberBadge: seasonNumber ? `#${seasonNumber}` : undefined,
          }
        : undefined,
      metrics: [
        {
          label: isVi ? `Thứ hạng ${season}` : `${season} Rank`,
          value: seasonDriver ? `P${seasonDriver.rank}` : "—",
        },
        {
          label: isVi ? `Điểm mùa ${season}` : `${season} Points`,
          value: seasonDriver ? `${seasonDriver.points} PTS` : "0 PTS",
        },
        {
          label: isVi ? "Chiến thắng sự nghiệp" : "Career Wins",
          value: String(stats.careerWins),
          hint:
            seasonDriver && seasonDriver.wins > 0
              ? isVi
                ? `${seasonDriver.wins} trong ${season}`
                : `${seasonDriver.wins} in ${season}`
              : undefined,
        },
        {
          label: isVi ? "Podium sự nghiệp" : "Career Podiums",
          value: String(stats.podiums),
          hint:
            seasonDriver && seasonDriver.podiums > 0
              ? isVi
                ? `${seasonDriver.podiums} trong ${season}`
                : `${seasonDriver.podiums} in ${season}`
              : undefined,
        },
      ],
      rows: [
        ...(teamDisplayName
          ? [
              {
                label: isVi ? "Đội đua" : "Team",
                value: teamDisplayName,
              },
            ]
          : []),
        ...(driver?.country
          ? [
              {
                label: isVi ? "Quốc tịch" : "Nationality",
                value: driver.country,
              },
            ]
          : []),
        ...((profile?.powerUnit ?? driverTeam?.powerUnit)
          ? [
              {
                label: isVi ? "Động cơ" : "Power Unit",
                value: profile?.powerUnit ?? driverTeam?.powerUnit ?? "",
              },
            ]
          : []),
      ],
      note: isVi
        ? `HỒ SƠ TAY ĐUA · MÙA ${season} · CHÂN DUNG MINH HỌA BIÊN TẬP`
        : `DRIVER DOSSIER · SEASON ${season} · ILLUSTRATIVE PORTRAIT`,
      fullHref: `/drivers/${driverId}?season=${season}`,
      fullLabel: isVi ? "Mở trang hồ sơ tay đua" : "Open full driver profile",
    };
  }, [defaultSeason, inspecting, isVi, lang]);

  if (!drawerContent) return null;

  return (
    <div
      ref={backdropRef}
      className="sp-drawer-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sp-drawer-title"
      aria-describedby="sp-drawer-description"
      data-testid="storm-dossier-drawer"
      onClick={onClose}
    >
      <aside
        ref={drawerElementRef}
        className="sp-drawer"
        style={
          drawerContent.accentColor
            ? ({
                "--drawer-accent": drawerContent.accentColor,
              } as CSSProperties)
            : undefined
        }
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sp-drawer-head">
          <span className="sp-drawer-kicker">{drawerContent.kicker}</span>
          <button
            type="button"
            className="sp-drawer-close"
            aria-label={isVi ? "Đóng" : "Close"}
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {drawerContent.visual ? (
          <div
            className={`sp-drawer-hero ${
              drawerContent.visual.kind === "car" ? "sp-drawer-hero--car" : ""
            }`}
          >
            <div
              className={
                drawerContent.visual.kind === "driver"
                  ? "sp-drawer-portrait-frame"
                  : "sp-drawer-car-frame"
              }
            >
              <StormVisualImage
                kind={drawerContent.visual.kind}
                season={drawerContent.season}
                entityId={drawerContent.visual.entityId}
                alt={drawerContent.visual.alt}
                className="sp-drawer-visual-media"
                placeholder={drawerContent.title}
                showProvenanceNote={drawerContent.visual.kind === "car"}
                loading="eager"
              />
            </div>

            <div className="sp-drawer-identity">
              {(drawerContent.visual.numberBadge || drawerContent.badgeUrl) && (
                <div className="sp-drawer-badge-row">
                  {drawerContent.visual.numberBadge ? (
                    <span className="sp-drawer-num">
                      {drawerContent.visual.numberBadge}
                    </span>
                  ) : (
                    <span />
                  )}
                  {drawerContent.badgeUrl ? (
                    <img
                      src={drawerContent.badgeUrl}
                      alt=""
                      aria-hidden="true"
                      className="sp-drawer-team-logo"
                    />
                  ) : null}
                </div>
              )}
              <h2 id="sp-drawer-title" className="sp-drawer-title">
                {drawerContent.title}
              </h2>
              <p id="sp-drawer-description" className="sp-drawer-sub">
                {drawerContent.subtitle}
              </p>
            </div>
          </div>
        ) : (
          <div>
            <h2 id="sp-drawer-title" className="sp-drawer-title">
              {drawerContent.title}
            </h2>
            <p id="sp-drawer-description" className="sp-drawer-sub">
              {drawerContent.subtitle}
            </p>
          </div>
        )}

        {drawerContent.metrics && drawerContent.metrics.length > 0 && (
          <div className="sp-drawer-metrics">
            {drawerContent.metrics.map((metric) => (
              <div key={metric.label} className="sp-drawer-metric">
                <span className="sp-drawer-metric-label">{metric.label}</span>
                <strong className="sp-drawer-metric-val">{metric.value}</strong>
                {metric.hint ? (
                  <span className="sp-drawer-metric-hint">{metric.hint}</span>
                ) : null}
              </div>
            ))}
          </div>
        )}

        <dl className="sp-drawer-rows">
          {drawerContent.rows.map((row) => (
            <div key={row.label} className="sp-drawer-row">
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>

        {drawerContent.fullHref && drawerContent.fullLabel ? (
          <div className="sp-drawer-actions">
            <Link
              to={drawerContent.fullHref}
              className="sp-storm-btn sp-storm-btn--secondary sp-drawer-full-link"
              onClick={onClose}
            >
              <span>{drawerContent.fullLabel}</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        ) : null}

        {drawerContent.note ? (
          <p className="sp-drawer-note">{drawerContent.note}</p>
        ) : null}
      </aside>
    </div>
  );
}
