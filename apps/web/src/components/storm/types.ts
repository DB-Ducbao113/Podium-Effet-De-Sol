import type { SeasonYear, TeamId } from "../../types";

export type StormTabId =
  | "overview"
  | "results"
  | "calendar"
  | "standings"
  | "showroom"
  | "engineering"
  | "teams"
  | "drivers"
  | "about";

export type StormInspectionTarget =
  | { kind: "race"; round: number; season?: SeasonYear }
  | { kind: "hotspot"; hotspotId: string }
  | { kind: "article"; slug: string }
  | { kind: "team"; teamId: TeamId; season?: SeasonYear }
  | { kind: "driver"; driverId: string; season?: SeasonYear };
