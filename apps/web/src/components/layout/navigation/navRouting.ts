import type { MouseEvent } from "react";
import { isPrimaryPath } from "../../../hooks/useMobileHub";
import { isSeasonYear, type Language, type SeasonYear } from "../../../types";
import type { CanonicalNavId } from "./navRegistry";

export type NavAdapterMode = "router" | "prototype";

export type DevNextRaceFixture =
  "live" | "scheduled" | "current" | "loading" | "none" | "unavailable";

export interface NavAdapter {
  readonly mode: NavAdapterMode;
  readonly activeId: CanonicalNavId | null;
  readonly season: SeasonYear;
  readonly lang: Language;
  readonly surfaceTone: "dark" | "light";
  readonly isImmersiveSurface: boolean;
  readonly getHref: (id: CanonicalNavId) => string;
  readonly onNavigate: (
    id: CanonicalNavId,
    event: MouseEvent<HTMLAnchorElement>,
  ) => void;
  readonly onSelectLang: (lang: Language) => void;
  readonly onPrefetchNav?: (id: CanonicalNavId) => void;
  readonly nextRaceFixture?: DevNextRaceFixture;
}

export interface ResolveActiveNavInput {
  readonly pathname: string;
  readonly search?: string;
  readonly hash?: string;
  readonly mobileHub?: boolean;
}

const VALID_SEASON_PATH_RE =
  /^\/season\/(2024|2025|2026)(?:\/race\/(\d+))?\/?$/;

export function extractSeasonFromPath(pathname: string): SeasonYear | null {
  const match = pathname.match(/^\/season\/(2024|2025|2026)(?:\/|$)/);
  if (!match) return null;
  return Number(match[1]) as SeasonYear;
}

export function resolveEffectiveSeason(
  pathname: string,
  storeSeason?: SeasonYear | number | null,
): SeasonYear {
  const pathSeason = extractSeasonFromPath(pathname);
  if (pathSeason) return pathSeason;
  return isSeasonYear(storeSeason) ? storeSeason : 2026;
}

/**
 * Deterministic single-active-section resolver derived strictly from URL state (BR-02, BR-03, BR-09).
 * Returns `null` on 404, invalid seasons, `/about`, `/cars/:carId`, or `/season/:year?tab=overview`.
 */
export function resolveActiveNavId({
  pathname,
  search = "",
  hash = "",
  mobileHub = false,
}: ResolveActiveNavInput): CanonicalNavId | null {
  const normalizedPath = pathname || "/";

  if (mobileHub && isPrimaryPath(normalizedPath)) {
    if (hash === "#showroom") return "showroom";
    if (hash === "#giai-dau") return "standings";
    if (hash === "#home") return "overview";
  }

  if (normalizedPath === "/") {
    return "overview";
  }

  if (normalizedPath.startsWith("/season/")) {
    const match = normalizedPath.match(VALID_SEASON_PATH_RE);
    if (!match) return null;
    if (match[2]) return "results";

    const params = new URLSearchParams(search);
    const tab = params.get("tab");
    if (tab === "results") return "results";
    if (tab === "calendar") return "calendar";
    if (tab === "drivers") return "drivers";
    if (tab === "teams") return "teams";
    if (tab === "overview") return null;
    if (tab === "standings" || !tab) return "standings";
    return "standings";
  }

  if (normalizedPath === "/drivers" || normalizedPath.startsWith("/drivers/")) {
    return "drivers";
  }

  if (normalizedPath === "/teams" || normalizedPath.startsWith("/teams/")) {
    return "teams";
  }

  if (
    normalizedPath === "/engineering" ||
    normalizedPath.startsWith("/engineering/")
  ) {
    return "engineering";
  }

  if (
    normalizedPath === "/showroom" ||
    normalizedPath.startsWith("/showroom/") ||
    normalizedPath === "/gallery" ||
    normalizedPath.startsWith("/gallery/")
  ) {
    return "showroom";
  }

  if (normalizedPath === "/about" || normalizedPath.startsWith("/about/")) {
    return "about";
  }

  return null;
}

export interface BuildNavHrefInput {
  readonly targetId: CanonicalNavId;
  readonly currentPathname: string;
  readonly currentSearch?: string;
  readonly activeId?: CanonicalNavId | null;
  readonly storeSeason?: SeasonYear | number | null;
  readonly mobileHub?: boolean;
}

/**
 * Generates clean, same-origin target URLs while preserving valid season (2024..2026)
 * and view-scoped query params only on same-section re-activation (BR-04, BR-09).
 */
export function buildNavHref({
  targetId,
  currentPathname,
  currentSearch = "",
  activeId = null,
  storeSeason,
  mobileHub = false,
}: BuildNavHrefInput): string {
  const normalizedPath = currentPathname || "/";
  const onHub = mobileHub && isPrimaryPath(normalizedPath);

  if (activeId !== null && activeId === targetId && !onHub) {
    return `${normalizedPath}${currentSearch}`;
  }

  if (onHub) {
    const hubParams = new URLSearchParams(currentSearch);
    hubParams.delete("hotspot");
    const qs = hubParams.toString();
    const base = `${normalizedPath}${qs ? `?${qs}` : ""}`;
    if (targetId === "overview") return `${base}#home`;
    if (targetId === "showroom") return `${base}#showroom`;
  }

  const season = resolveEffectiveSeason(normalizedPath, storeSeason);
  switch (targetId) {
    case "overview":
      return "/";
    case "results":
      return `/season/${season}?tab=results`;
    case "calendar":
      return `/season/${season}?tab=calendar`;
    case "standings":
      return `/season/${season}?tab=standings`;
    case "drivers":
      return "/drivers";
    case "teams":
      return "/teams";
    case "engineering":
      return "/engineering";
    case "showroom":
      return "/showroom";
    case "about":
      return "/about";
  }
}

export function isPlainPrimaryClick(
  event: Pick<
    MouseEvent<HTMLAnchorElement>,
    "button" | "metaKey" | "ctrlKey" | "shiftKey" | "altKey"
  >,
): boolean {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}
