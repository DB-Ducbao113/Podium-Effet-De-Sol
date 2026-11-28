import {
  Calendar,
  Compass,
  Flag,
  Info,
  Layers,
  Move3d,
  Shield,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Language } from "../../../types";

export type CanonicalNavId =
  | "overview"
  | "results"
  | "calendar"
  | "standings"
  | "drivers"
  | "teams"
  | "engineering"
  | "showroom"
  | "about";

export interface NavDestinationDef {
  readonly id: CanonicalNavId;
  readonly label: Readonly<Record<Language, string>>;
  readonly compactDesc?: Readonly<Record<Language, string>>;
  readonly icon: LucideIcon;
}

/**
 * Canonical 8-destination flat navigation registry (BR-01, BR-12).
 * Order and sentence-case labels are locked across desktop rail and compact drawer.
 */
export const LIQUID_NAV_DESTINATIONS: readonly NavDestinationDef[] = [
  {
    id: "overview",
    label: { en: "Overview", vi: "Tổng quan" },
    icon: Compass,
  },
  {
    id: "results",
    label: { en: "Results", vi: "Kết quả" },
    icon: Flag,
  },
  {
    id: "calendar",
    label: { en: "Calendar", vi: "Lịch đua" },
    icon: Calendar,
  },
  {
    id: "standings",
    label: { en: "Standings", vi: "Xếp hạng" },
    icon: Trophy,
  },
  {
    id: "drivers",
    label: { en: "Drivers", vi: "Tay đua" },
    icon: Users,
  },
  {
    id: "teams",
    label: { en: "Teams", vi: "Đội đua" },
    icon: Shield,
  },
  {
    id: "engineering",
    label: { en: "Engineering", vi: "Kỹ thuật" },
    icon: Layers,
  },
  {
    id: "showroom",
    label: { en: "Showroom", vi: "Showroom" },
    icon: Move3d,
  },
  {
    id: "about",
    label: { en: "About", vi: "Giới thiệu" },
    icon: Info,
  },
] as const;

export const NAV_MICROCOPY = {
  navLandmark: { en: "Primary navigation", vi: "Điều hướng chính" },
  openTrigger: { en: "Open navigation", vi: "Mở điều hướng" },
  closeTrigger: { en: "Close navigation", vi: "Đóng điều hướng" },
  drawerHeading: { en: "Explore PEDS", vi: "Khám phá PEDS" },
  nextRaceLabel: { en: "Next race", vi: "Chặng tiếp theo" },
  currentWeekendLabel: { en: "Race weekend", vi: "Cuối tuần đua" },
  loadingState: {
    en: "Loading race schedule…",
    vi: "Đang tải lịch đua…",
  },
  noneState: {
    en: "View season calendar",
    vi: "Xem lịch mùa giải",
  },
  unavailableState: {
    en: "Schedule unavailable",
    vi: "Chưa có lịch đua",
  },
  brandHomeAria: {
    en: "PODIUM — Effet de Sol Overview",
    vi: "PODIUM — Effet de Sol Tổng quan",
  },
  languageGroupAria: {
    en: "Language",
    vi: "Ngôn ngữ",
  },
  switchToEnAria: {
    en: "Switch language to English",
    vi: "Chuyển ngôn ngữ sang Tiếng Anh",
  },
  switchToViAria: {
    en: "Switch language to Vietnamese",
    vi: "Chuyển ngôn ngữ sang Tiếng Việt",
  },
} as const;
