import type { TeamId } from "../../types";

/** Editorial colors for directory surfaces; not official team brand values. */
export const EDITORIAL_TEAM_TONES: Record<TeamId, string> = {
  mclaren: "#e89c5b",
  ferrari: "#c55d50",
  mercedes: "#5cae9b",
  redbull: "#536e93",
  astonmartin: "#639b89",
  williams: "#6491bd",
  audi: "#a5b0af",
  cadillac: "#a4a297",
  alpine: "#769db7",
  haas: "#a3a3a4",
  racingbulls: "#657eaa",
};

/** Per-constructor visual signatures; they do not alter membership or results. */
export const EDITORIAL_TEAM_SIGNATURES: Record<
  TeamId,
  {
    accent: string;
    deep: string;
    paper: string;
  }
> = {
  mclaren: { accent: "#47c7fc", deep: "#583216", paper: "#f4e2d2" },
  ferrari: { accent: "#ffe500", deep: "#6e1b23", paper: "#f0dedc" },
  mercedes: { accent: "#c8ccce", deep: "#155c56", paper: "#ddece8" },
  redbull: { accent: "#fcd700", deep: "#17294e", paper: "#dfe3ef" },
  astonmartin: { accent: "#cedc00", deep: "#0d5147", paper: "#dde9e1" },
  williams: { accent: "#00e5ff", deep: "#143c68", paper: "#dce9f4" },
  audi: { accent: "#f50537", deep: "#272d31", paper: "#e0e3e4" },
  cadillac: { accent: "#d4af37", deep: "#1a1d21", paper: "#e7e4db" },
  alpine: { accent: "#ff87bc", deep: "#284b80", paper: "#e4e6f4" },
  haas: { accent: "#e6002b", deep: "#37383c", paper: "#e6e4e1" },
  racingbulls: { accent: "#d90429", deep: "#1f2b77", paper: "#dfe3f3" },
};
