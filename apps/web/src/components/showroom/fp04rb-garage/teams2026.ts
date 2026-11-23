import type { LogoAssetKey, LogoToneVariant } from "./teamLogos2026";

export type TeamId =
  | "mclaren"
  | "ferrari"
  | "mercedes"
  | "red-bull"
  | "racing-bulls"
  | "aston-martin"
  | "alpine"
  | "williams"
  | "haas"
  | "audi"
  | "cadillac";

export type LiveryPatternStyle =
  | "papaya-wedge"
  | "scuderia-band"
  | "silver-arrows-blade"
  | "bull-charge"
  | "toro-stripe"
  | "british-racing-sweep"
  | "alpine-tricolor"
  | "grove-aeroline"
  | "money-split"
  | "audi-monolith"
  | "cadillac-asymmetric";

export interface TeamFinishSpec {
  clearcoat: number;
  clearcoatRoughness: number;
  roughness: number;
  metalness: number;
  carbonBlend: "high" | "balanced" | "painted";
}

export interface TeamZonePaint2026 {
  nose: string;
  sidepod: string;
  engineCover: string;
  wing: string;
  lowerFlank: string;
  halo: string;
  detail: string;
  crewSuitPrimary: string;
  crewSuitSecondary: string;
  crewHelmet: string;
}

export interface TeamLogoPlacementSpec {
  key: LogoAssetKey;
  tone: LogoToneVariant;
}

export interface TeamLogos2026Config {
  constructorBadge: TeamLogoPlacementSpec;
  noseMark: TeamLogoPlacementSpec;
  sidepodPrimary: TeamLogoPlacementSpec;
  sidepodSecondary?: TeamLogoPlacementSpec;
  engineCoverMark: TeamLogoPlacementSpec;
  rearWingMark: TeamLogoPlacementSpec;
  frontWingMark: TeamLogoPlacementSpec;
  rightSidepodOverride?: TeamLogoPlacementSpec;
  rightEngineCoverOverride?: TeamLogoPlacementSpec;
}

export interface Team2026Spec {
  id: TeamId;
  name: string;
  shortCode: string;
  constructorTitle: string;
  conceptNote: { vi: string; en: string };
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textOnPrimary: string;
  textOnSecondary: string;
  pattern: LiveryPatternStyle;
  asymmetricSplit: boolean;
  finish: TeamFinishSpec;
  zonePaint: TeamZonePaint2026;
  logos: TeamLogos2026Config;
  carNumbers: { bay1: string; bay2: string };
  drivers: { bay1: string; bay2: string };
  wordmark: string;
  wingBanner: string;
  secondaryMark: string;
  garageTagline: { vi: string; en: string };
}

export const FP04RB_CHASSIS_DISCLAIMER = {
  vi: "Khung gầm concept F1 2022 FP-04 RB (Peter Kiss). Các bản phối màu 2026 là nghiên cứu concept phi thương mại, không phải xe đua 2026 chính thức.",
  en: "FP-04 RB 2022 F1 concept chassis (Peter Kiss). 2026 liveries are non-commercial concept studies on this chassis, not official 2026 cars.",
} as const;

export const TEAMS_2026: readonly Team2026Spec[] = [
  {
    id: "mclaren",
    name: "McLaren",
    shortCode: "MCL",
    constructorTitle: "McLaren MCL40 Concept Study",
    conceptNote: FP04RB_CHASSIS_DISCLAIMER,
    primaryColor: "#F48220",
    secondaryColor: "#161A20",
    accentColor: "#30A4A8",
    textOnPrimary: "#111417",
    textOnSecondary: "#F4F6F8",
    pattern: "papaya-wedge",
    asymmetricSplit: false,
    finish: {
      clearcoat: 0.72,
      clearcoatRoughness: 0.14,
      roughness: 0.28,
      metalness: 0.14,
      carbonBlend: "high",
    },
    zonePaint: {
      nose: "#EF6E12",
      sidepod: "#15191C",
      engineCover: "#15191C",
      wing: "#15191C",
      lowerFlank: "#15191C",
      halo: "#15191C",
      detail: "#253796",
      crewSuitPrimary: "#EF6E12",
      crewSuitSecondary: "#15191C",
      crewHelmet: "#EF6E12",
    },
    logos: {
      constructorBadge: { key: "mclaren", tone: "papaya" },
      noseMark: { key: "mclaren", tone: "dark" },
      sidepodPrimary: { key: "okx", tone: "light" },
      sidepodSecondary: { key: "mastercard", tone: "original" },
      engineCoverMark: { key: "gemini", tone: "light" },
      rearWingMark: { key: "mclarenWordmark", tone: "light" },
      frontWingMark: { key: "mclarenWordmark", tone: "dark" },
    },
    carNumbers: { bay1: "1", bay2: "81" },
    drivers: { bay1: "NORRIS #1", bay2: "PIASTRI #81" },
    wordmark: "McLAREN",
    wingBanner: "McLAREN",
    secondaryMark: "OKX · GEMINI · DP WORLD",
    garageTagline: {
      vi: "Khoang kỹ thuật Papaya Woking",
      en: "Papaya Engineering Bay",
    },
  },
  {
    id: "ferrari",
    name: "Ferrari",
    shortCode: "FER",
    constructorTitle: "Ferrari SF-26 Concept Study",
    conceptNote: FP04RB_CHASSIS_DISCLAIMER,
    primaryColor: "#D9182B",
    secondaryColor: "#F2F0EB",
    accentColor: "#FFE045",
    textOnPrimary: "#FFFFFF",
    textOnSecondary: "#16181A",
    pattern: "scuderia-band",
    asymmetricSplit: false,
    finish: {
      clearcoat: 0.9,
      clearcoatRoughness: 0.08,
      roughness: 0.18,
      metalness: 0.18,
      carbonBlend: "painted",
    },
    zonePaint: {
      nose: "#D9182B",
      sidepod: "#D9182B",
      engineCover: "#F2F0EB",
      wing: "#17191B",
      lowerFlank: "#17191B",
      halo: "#D9182B",
      detail: "#193987",
      crewSuitPrimary: "#D9182B",
      crewSuitSecondary: "#F2F0EB",
      crewHelmet: "#D9182B",
    },
    logos: {
      constructorBadge: { key: "ferrari", tone: "original" },
      noseMark: { key: "ferrari", tone: "original" },
      sidepodPrimary: { key: "ceva", tone: "light" },
      sidepodSecondary: { key: "shell", tone: "original" },
      engineCoverMark: { key: "hp", tone: "original" },
      rearWingMark: { key: "ibm", tone: "light" },
      frontWingMark: { key: "hp", tone: "original" },
    },
    carNumbers: { bay1: "16", bay2: "44" },
    drivers: { bay1: "LECLERC #16", bay2: "HAMILTON #44" },
    wordmark: "SCUDERIA",
    wingBanner: "SCUDERIA FERRARI",
    secondaryMark: "HP · SHELL",
    garageTagline: {
      vi: "Khoang kỹ thuật Maranello",
      en: "Maranello Garage Bay",
    },
  },
  {
    id: "mercedes",
    name: "Mercedes",
    shortCode: "MER",
    constructorTitle: "Mercedes W17 Concept Study",
    conceptNote: FP04RB_CHASSIS_DISCLAIMER,
    primaryColor: "#B8C3C8",
    secondaryColor: "#101416",
    accentColor: "#22BEB6",
    textOnPrimary: "#101416",
    textOnSecondary: "#E9F2F4",
    pattern: "silver-arrows-blade",
    asymmetricSplit: false,
    finish: {
      clearcoat: 0.85,
      clearcoatRoughness: 0.1,
      roughness: 0.2,
      metalness: 0.52,
      carbonBlend: "balanced",
    },
    zonePaint: {
      nose: "#C1C9C9",
      sidepod: "#131719",
      engineCover: "#131719",
      wing: "#101416",
      lowerFlank: "#101416",
      halo: "#131719",
      detail: "#00A19C",
      crewSuitPrimary: "#131719",
      crewSuitSecondary: "#C1C9C9",
      crewHelmet: "#131719",
    },
    logos: {
      constructorBadge: { key: "mercedes", tone: "original" },
      noseMark: { key: "mercedes", tone: "dark" },
      sidepodPrimary: { key: "petronas", tone: "light" },
      sidepodSecondary: { key: "microsoft", tone: "original" },
      engineCoverMark: { key: "mercedes", tone: "original" },
      rearWingMark: { key: "petronas", tone: "light" },
      frontWingMark: { key: "petronas", tone: "light" },
    },
    carNumbers: { bay1: "63", bay2: "12" },
    drivers: { bay1: "RUSSELL #63", bay2: "ANTONELLI #12" },
    wordmark: "PETRONAS",
    wingBanner: "PETRONAS AMG",
    secondaryMark: "MICROSOFT",
    garageTagline: {
      vi: "Khoang kỹ thuật Brackley",
      en: "Brackley Silver Bay",
    },
  },
  {
    id: "red-bull",
    name: "Red Bull",
    shortCode: "RBR",
    constructorTitle: "Red Bull RB22 Concept Study",
    conceptNote: FP04RB_CHASSIS_DISCLAIMER,
    primaryColor: "#172857",
    secondaryColor: "#F1F2EE",
    accentColor: "#E32C31",
    textOnPrimary: "#F7F8FA",
    textOnSecondary: "#172857",
    pattern: "bull-charge",
    asymmetricSplit: false,
    finish: {
      clearcoat: 0.86,
      clearcoatRoughness: 0.12,
      roughness: 0.22,
      metalness: 0.28,
      carbonBlend: "balanced",
    },
    zonePaint: {
      nose: "#14306E",
      sidepod: "#14306E",
      engineCover: "#14306E",
      wing: "#101A3D",
      lowerFlank: "#101A3D",
      halo: "#14306E",
      detail: "#FFCE00",
      crewSuitPrimary: "#14306E",
      crewSuitSecondary: "#101A3D",
      crewHelmet: "#14306E",
    },
    logos: {
      constructorBadge: { key: "redbull", tone: "original" },
      noseMark: { key: "redbullSunBulls", tone: "original" },
      sidepodPrimary: { key: "oracle", tone: "light" },
      sidepodSecondary: { key: "ford", tone: "original" },
      engineCoverMark: { key: "redbullSunBulls", tone: "original" },
      rearWingMark: { key: "oracle", tone: "light" },
      frontWingMark: { key: "redbull", tone: "original" },
    },
    carNumbers: { bay1: "3", bay2: "6" },
    drivers: { bay1: "VERSTAPPEN #3", bay2: "HADJAR #6" },
    wordmark: "RED BULL",
    wingBanner: "ORACLE RED BULL",
    secondaryMark: "FORD POWERTRAINS",
    garageTagline: {
      vi: "Khoang kỹ thuật Milton Keynes",
      en: "Milton Keynes Garage Bay",
    },
  },
  {
    id: "racing-bulls",
    name: "Racing Bulls",
    shortCode: "VCARB",
    constructorTitle: "Racing Bulls VCARB 03 Concept Study",
    conceptNote: FP04RB_CHASSIS_DISCLAIMER,
    primaryColor: "#E9EDEF",
    secondaryColor: "#2149A0",
    accentColor: "#D93439",
    textOnPrimary: "#16213A",
    textOnSecondary: "#FFFFFF",
    pattern: "toro-stripe",
    asymmetricSplit: false,
    finish: {
      clearcoat: 0.92,
      clearcoatRoughness: 0.08,
      roughness: 0.16,
      metalness: 0.14,
      carbonBlend: "painted",
    },
    zonePaint: {
      nose: "#ECF0EE",
      sidepod: "#ECF0EE",
      engineCover: "#1C4AA9",
      wing: "#1C4AA9",
      lowerFlank: "#163F9B",
      halo: "#1C4AA9",
      detail: "#D93439",
      crewSuitPrimary: "#1C4AA9",
      crewSuitSecondary: "#ECF0EE",
      crewHelmet: "#ECF0EE",
    },
    logos: {
      constructorBadge: { key: "racingbulls", tone: "red" },
      noseMark: { key: "racingbulls", tone: "red" },
      sidepodPrimary: { key: "visa", tone: "blue" },
      sidepodSecondary: { key: "ford", tone: "original" },
      engineCoverMark: { key: "racingbulls", tone: "red" },
      rearWingMark: { key: "visa", tone: "light" },
      frontWingMark: { key: "visa", tone: "light" },
    },
    carNumbers: { bay1: "30", bay2: "41" },
    drivers: { bay1: "LAWSON #30", bay2: "LINDBLAD #41" },
    wordmark: "RACING BULLS",
    wingBanner: "VISA CASH APP RB",
    secondaryMark: "VISA · FORD",
    garageTagline: { vi: "Khoang kỹ thuật Faenza", en: "Faenza Technical Bay" },
  },
  {
    id: "aston-martin",
    name: "Aston Martin",
    shortCode: "AMR",
    constructorTitle: "Aston Martin AMR26 Concept Study",
    conceptNote: FP04RB_CHASSIS_DISCLAIMER,
    primaryColor: "#075544",
    secondaryColor: "#12241E",
    accentColor: "#C9DF43",
    textOnPrimary: "#FFFFFF",
    textOnSecondary: "#E7ECE9",
    pattern: "british-racing-sweep",
    asymmetricSplit: false,
    finish: {
      clearcoat: 0.9,
      clearcoatRoughness: 0.09,
      roughness: 0.2,
      metalness: 0.44,
      carbonBlend: "balanced",
    },
    zonePaint: {
      nose: "#075744",
      sidepod: "#075744",
      engineCover: "#075744",
      wing: "#11221F",
      lowerFlank: "#11221F",
      halo: "#075744",
      detail: "#BFD82C",
      crewSuitPrimary: "#075744",
      crewSuitSecondary: "#11221F",
      crewHelmet: "#075744",
    },
    logos: {
      constructorBadge: { key: "astonmartin", tone: "original" },
      noseMark: { key: "astonmartin", tone: "light" },
      sidepodPrimary: { key: "aramco", tone: "original" },
      sidepodSecondary: { key: "valvoline", tone: "original" },
      engineCoverMark: { key: "astonmartin", tone: "original" },
      rearWingMark: { key: "valvoline", tone: "original" },
      frontWingMark: { key: "aramco", tone: "original" },
    },
    carNumbers: { bay1: "14", bay2: "18" },
    drivers: { bay1: "ALONSO #14", bay2: "STROLL #18" },
    wordmark: "ARAMCO",
    wingBanner: "ASTON MARTIN ARAMCO",
    secondaryMark: "HONDA · VALVOLINE",
    garageTagline: {
      vi: "Khoang kỹ thuật Silverstone",
      en: "Silverstone Works Bay",
    },
  },
  {
    id: "alpine",
    name: "Alpine",
    shortCode: "ALP",
    constructorTitle: "Alpine A526 Concept Study",
    conceptNote: FP04RB_CHASSIS_DISCLAIMER,
    primaryColor: "#1959C6",
    secondaryColor: "#EF80B4",
    accentColor: "#F4F1F3",
    textOnPrimary: "#FFFFFF",
    textOnSecondary: "#12161E",
    pattern: "alpine-tricolor",
    asymmetricSplit: false,
    finish: {
      clearcoat: 0.78,
      clearcoatRoughness: 0.14,
      roughness: 0.24,
      metalness: 0.24,
      carbonBlend: "high",
    },
    zonePaint: {
      nose: "#F17EB6",
      sidepod: "#095FB1",
      engineCover: "#095FB1",
      wing: "#F17EB6",
      lowerFlank: "#1B1D24",
      halo: "#F17EB6",
      detail: "#F17EB6",
      crewSuitPrimary: "#095FB1",
      crewSuitSecondary: "#1B1D24",
      crewHelmet: "#F17EB6",
    },
    logos: {
      constructorBadge: { key: "alpine", tone: "light" },
      noseMark: { key: "alpine", tone: "dark" },
      sidepodPrimary: { key: "bwt", tone: "pink" },
      sidepodSecondary: { key: "eni", tone: "light" },
      engineCoverMark: { key: "eni", tone: "light" },
      rearWingMark: { key: "bwt", tone: "dark" },
      frontWingMark: { key: "bwt", tone: "dark" },
    },
    carNumbers: { bay1: "10", bay2: "43" },
    drivers: { bay1: "GASLY #10", bay2: "COLAPINTO #43" },
    wordmark: "ALPINE",
    wingBanner: "BWT ALPINE",
    secondaryMark: "BWT · ENI",
    garageTagline: { vi: "Khoang kỹ thuật Enstone", en: "Enstone Aero Bay" },
  },
  {
    id: "williams",
    name: "Williams",
    shortCode: "WIL",
    constructorTitle: "Williams FW48 Concept Study",
    conceptNote: FP04RB_CHASSIS_DISCLAIMER,
    primaryColor: "#1559BD",
    secondaryColor: "#F0F2F3",
    accentColor: "#D32E37",
    textOnPrimary: "#FFFFFF",
    textOnSecondary: "#102247",
    pattern: "grove-aeroline",
    asymmetricSplit: false,
    finish: {
      clearcoat: 0.84,
      clearcoatRoughness: 0.11,
      roughness: 0.22,
      metalness: 0.26,
      carbonBlend: "balanced",
    },
    zonePaint: {
      nose: "#1555BD",
      sidepod: "#30A5D2",
      engineCover: "#1555BD",
      wing: "#11171E",
      lowerFlank: "#F1F2F0",
      halo: "#1555BD",
      detail: "#30A5D2",
      crewSuitPrimary: "#1555BD",
      crewSuitSecondary: "#F1F2F0",
      crewHelmet: "#30A5D2",
    },
    logos: {
      constructorBadge: { key: "williams", tone: "light" },
      noseMark: { key: "williams", tone: "light" },
      sidepodPrimary: { key: "barclays", tone: "light" },
      sidepodSecondary: { key: "komatsu", tone: "blue" },
      engineCoverMark: { key: "atlassian", tone: "light" },
      rearWingMark: { key: "komatsu", tone: "light" },
      frontWingMark: { key: "atlassian", tone: "light" },
    },
    carNumbers: { bay1: "23", bay2: "55" },
    drivers: { bay1: "ALBON #23", bay2: "SAINZ #55" },
    wordmark: "WILLIAMS",
    wingBanner: "ATLASSIAN WILLIAMS",
    secondaryMark: "BARCLAYS · KOMATSU",
    garageTagline: { vi: "Khoang kỹ thuật Grove", en: "Grove Engineering Bay" },
  },
  {
    id: "haas",
    name: "Haas",
    shortCode: "HAS",
    constructorTitle: "Haas VF-26 Concept Study",
    conceptNote: FP04RB_CHASSIS_DISCLAIMER,
    primaryColor: "#E8E9E6",
    secondaryColor: "#16181A",
    accentColor: "#D52A32",
    textOnPrimary: "#16181A",
    textOnSecondary: "#F4F4F4",
    pattern: "money-split",
    asymmetricSplit: false,
    finish: {
      clearcoat: 0.76,
      clearcoatRoughness: 0.15,
      roughness: 0.26,
      metalness: 0.12,
      carbonBlend: "high",
    },
    zonePaint: {
      nose: "#E8E9E6",
      sidepod: "#E8E9E6",
      engineCover: "#D51C2D",
      wing: "#141719",
      lowerFlank: "#141719",
      halo: "#141719",
      detail: "#D51C2D",
      crewSuitPrimary: "#141719",
      crewSuitSecondary: "#E8E9E6",
      crewHelmet: "#D51C2D",
    },
    logos: {
      constructorBadge: { key: "haas", tone: "original" },
      noseMark: { key: "haas", tone: "dark" },
      sidepodPrimary: { key: "haasSidepod", tone: "original" },
      sidepodSecondary: { key: "tgr", tone: "original" },
      engineCoverMark: { key: "tgr", tone: "original" },
      rearWingMark: { key: "haas", tone: "light" },
      frontWingMark: { key: "tgr", tone: "original" },
    },
    carNumbers: { bay1: "31", bay2: "87" },
    drivers: { bay1: "OCON #31", bay2: "BEARMAN #87" },
    wordmark: "HAAS TGR",
    wingBanner: "HAAS TOYOTA GAZOO",
    secondaryMark: "TGR · HAAS",
    garageTagline: {
      vi: "Khoang kỹ thuật Kannapolis",
      en: "Kannapolis Garage Bay",
    },
  },
  {
    id: "audi",
    name: "Audi",
    shortCode: "AUD",
    constructorTitle: "Audi R26 Concept Study",
    conceptNote: FP04RB_CHASSIS_DISCLAIMER,
    primaryColor: "#A8AAA6",
    secondaryColor: "#111315",
    accentColor: "#DA3035",
    textOnPrimary: "#111315",
    textOnSecondary: "#F2F4F6",
    pattern: "audi-monolith",
    asymmetricSplit: false,
    finish: {
      clearcoat: 0.68,
      clearcoatRoughness: 0.22,
      roughness: 0.28,
      metalness: 0.48,
      carbonBlend: "high",
    },
    zonePaint: {
      nose: "#AEB2B1",
      sidepod: "#AEB2B1",
      engineCover: "#111315",
      wing: "#111315",
      lowerFlank: "#D92D35",
      halo: "#111315",
      detail: "#D92D35",
      crewSuitPrimary: "#111315",
      crewSuitSecondary: "#AEB2B1",
      crewHelmet: "#D92D35",
    },
    logos: {
      constructorBadge: { key: "audi", tone: "light" },
      noseMark: { key: "audi", tone: "dark" },
      sidepodPrimary: { key: "revolut", tone: "dark" },
      sidepodSecondary: { key: "audi", tone: "light" },
      engineCoverMark: { key: "audi", tone: "light" },
      rearWingMark: { key: "revolut", tone: "light" },
      frontWingMark: { key: "audi", tone: "light" },
    },
    carNumbers: { bay1: "27", bay2: "5" },
    drivers: { bay1: "HULKENBERG #27", bay2: "BORTOLETO #5" },
    wordmark: "AUDI F1",
    wingBanner: "AUDI REVOLUT F1",
    secondaryMark: "REVOLUT · AUDI",
    garageTagline: { vi: "Khoang kỹ thuật Neuburg", en: "Neuburg Factory Bay" },
  },
  {
    id: "cadillac",
    name: "Cadillac",
    shortCode: "CAD",
    constructorTitle: "Cadillac MAC-26 Concept Study",
    conceptNote: FP04RB_CHASSIS_DISCLAIMER,
    primaryColor: "#EDECE8",
    secondaryColor: "#111315",
    accentColor: "#BCC0BF",
    textOnPrimary: "#111315",
    textOnSecondary: "#F2F3F0",
    pattern: "cadillac-asymmetric",
    asymmetricSplit: true,
    finish: {
      clearcoat: 0.82,
      clearcoatRoughness: 0.12,
      roughness: 0.24,
      metalness: 0.28,
      carbonBlend: "balanced",
    },
    zonePaint: {
      nose: "#EDECE8",
      sidepod: "#EDECE8",
      engineCover: "#EDECE8",
      wing: "#111315",
      lowerFlank: "#111315",
      halo: "#111315",
      detail: "#BCC0BF",
      crewSuitPrimary: "#111315",
      crewSuitSecondary: "#EDECE8",
      crewHelmet: "#111315",
    },
    logos: {
      constructorBadge: { key: "cadillac", tone: "original" },
      noseMark: { key: "cadillac", tone: "original" },
      sidepodPrimary: { key: "twg", tone: "dark" },
      rightSidepodOverride: { key: "twg", tone: "light" },
      engineCoverMark: { key: "cadillac", tone: "dark" },
      rightEngineCoverOverride: { key: "cadillac", tone: "original" },
      rearWingMark: { key: "cadillac", tone: "original" },
      frontWingMark: { key: "twg", tone: "light" },
    },
    carNumbers: { bay1: "11", bay2: "77" },
    drivers: { bay1: "PEREZ #11", bay2: "BOTTAS #77" },
    wordmark: "CADILLAC",
    wingBanner: "CADILLAC TWG F1",
    secondaryMark: "TWG GLOBAL",
    garageTagline: {
      vi: "Khoang kỹ thuật Charlotte",
      en: "Charlotte Works Bay",
    },
  },
] as const;

export const TEAM_2026_MAP: Record<TeamId, Team2026Spec> = Object.fromEntries(
  TEAMS_2026.map((team) => [team.id, team]),
) as Record<TeamId, Team2026Spec>;

export function getTeam2026ById(teamId: string): Team2026Spec {
  return TEAM_2026_MAP[teamId as TeamId] ?? TEAMS_2026[0];
}
