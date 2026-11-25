import type { LogoAssetKey } from "./teamLogos2026";
import type { TeamId } from "./teams2026";

/**
 * PEDS Showroom — 2026 F1 Livery Design PRD v1.0 (23/11/2026)
 * Canonical Z01–Z11 Zone Audit Matrix, Variant Manifest, 22 FIA Driver Number Registry,
 * Decal Hierarchy (Tier 1 / Tier 2 / Tier 3), and Shared-Chassis Discrepancy Ledger.
 */

export type PrdEvidenceTag = "[N]" | "[P]" | "[C]";

export type PrdSurfaceStatus =
  "verified" | "study" | "needs-reference" | "occluded" | "not-applicable";

export type PrdZoneId =
  | "Z01"
  | "Z02"
  | "Z03"
  | "Z04"
  | "Z05"
  | "Z06"
  | "Z07"
  | "Z08"
  | "Z09"
  | "Z10"
  | "Z11";

export type LiveryVariantId =
  "standard-2026" | "cadillac-spa-2026" | "cadillac-debut-2026";

export type DecalTier = 1 | 2 | 3;

export interface PrdZoneDefinition {
  id: PrdZoneId;
  title: { vi: string; en: string };
  inspectionScope: { vi: string; en: string };
}

export const PRD_ZONES_Z01_Z11: readonly PrdZoneDefinition[] = [
  {
    id: "Z01",
    title: { vi: "Cánh trước", en: "Front Wing" },
    inspectionScope: {
      vi: "Mặt trên, các flap, phần giữa, phần ngoài, hai thành cánh (endplate) và mặt trước.",
      en: "Upper mainplane, cascade flaps, center section, outboard sections, L/R endplates, leading edge.",
    },
  },
  {
    id: "Z02",
    title: { vi: "Mũi và trụ cánh", en: "Nose & Wing Pylons" },
    inspectionScope: {
      vi: "Mặt trên mũi, mặt nghiêng trái/phải, đầu mũi, trụ đỡ cánh, số xe và huy hiệu đội.",
      en: "Upper nose deck, L/R nose sidewalls, nose tip, wing pylons, driver number, constructor badge.",
    },
  },
  {
    id: "Z03",
    title: { vi: "Thân trước, chassis", en: "Forward Chassis & Shoulders" },
    inspectionScope: {
      vi: "Vai chassis, hai vách giữa mũi và sidepod, mảng chuyển dẫn vào cockpit.",
      en: "Chassis upper shoulders, forward monocoque sidewalls, transition contour into cockpit.",
    },
  },
  {
    id: "Z04",
    title: { vi: "Cockpit, halo, gương", en: "Cockpit, Halo & Mirrors" },
    inspectionScope: {
      vi: "Thanh giữa halo, thanh cong trái/phải, gương và chân gương; tách sơn với lòng khoang tối.",
      en: "Central halo pillar, L/R halo hoops, mirror housings & stalks; separate paint from dark cockpit void.",
    },
  },
  {
    id: "Z05",
    title: { vi: "Airbox, roll hoop", en: "Airbox & Roll Hoop" },
    inspectionScope: {
      vi: "Viền miệng hút, mặt bên vai airbox, điểm nối đến nắp máy; giữ lòng hốc hút gió tối.",
      en: "Intake lip surround, airbox shoulder flanks, junction to engine cover; keep intake void dark.",
    },
  },
  {
    id: "Z06",
    title: { vi: "Sidepod", en: "Sidepods (Left & Right)" },
    inspectionScope: {
      vi: "Miệng hút, vai trên, hông giữa, gầm hông (undercut) và đoạn thu trước bánh sau; thứ tự decal đầu→đuôi.",
      en: "Inlet lip, upper shoulder, main flank, lower undercut, Coke-bottle taper ahead of rear wheel; front-to-rear decal order.",
    },
  },
  {
    id: "Z07",
    title: { vi: "Nắp động cơ, sống lưng", en: "Engine Cover & Dorsal Spine" },
    inspectionScope: {
      vi: "Mặt nghiêng trái/phải, trục sống lưng trên, số xe bên hông, logo lớn và họa tiết lặp.",
      en: "L/R sloped engine cover flanks, dorsal spine/sharkfin, flank driver numbers, primary graphics & repeating motifs.",
    },
  },
  {
    id: "Z08",
    title: {
      vi: "Sàn, sườn dưới, diffuser",
      en: "Floor, Lower Skirt & Diffuser",
    },
    inspectionScope: {
      vi: "Mép sàn, sườn kỹ thuật dưới thân và diffuser; giữ vật liệu carbon kỹ thuật, tách khỏi bóng đổ.",
      en: "Floor edge wing, technical lower skirt, rear diffuser; preserve exposed carbon weave distinct from shadow.",
    },
  },
  {
    id: "Z09",
    title: { vi: "Cánh sau", en: "Rear Wing & Endplates" },
    inspectionScope: {
      vi: "Mặt trên, mặt sau, phần dưới cánh, giá đỡ và hai endplate trái/phải; ghi rõ mặt có chữ.",
      en: "Upper DRS flap, rear-facing mainplane, lower beam/carbon face, pylon, L/R endplates (outer/inner).",
    },
  },
  {
    id: "Z10",
    title: { vi: "Bánh, lốp, hệ treo", en: "Wheels, Tyres & Suspension" },
    inspectionScope: {
      vi: "Sidewall lốp, chụp mâm (wheel cover), hub, tay đòn carbon; không lấy vệt màu lốp làm màu đội.",
      en: "Tyre sidewall markings, aero wheel covers, center-lock hubs, carbon wishbones; compound stripe kept independent.",
    },
  },
  {
    id: "Z11",
    title: {
      vi: "Số xe và nhận diện tay đua",
      en: "Driver Numbers & Identity",
    },
    inspectionScope: {
      vi: "22 cấu hình số xe chuẩn FIA (Khoang 1 = Cấu hình A, Khoang 2 = Cấu hình B) trên mũi và nắp máy.",
      en: "22 FIA driver number configurations (Bay 1 = Config A, Bay 2 = Config B) on nose deck and rear flank.",
    },
  },
] as const;

export interface PrdDriverConfig {
  configSlot: "A" | "B";
  bayRole: "bay-1" | "bay-2";
  driverName: string;
  carNumber: string;
  fiaSourceUrl: string;
  nosePlacementStatus: PrdSurfaceStatus;
  flankPlacementStatus: PrdSurfaceStatus;
}

export interface PrdZoneAuditEntry {
  zoneId: PrdZoneId;
  tag: PrdEvidenceTag;
  leftStatus: PrdSurfaceStatus;
  rightStatus: PrdSurfaceStatus;
  topOrRearStatus: PrdSurfaceStatus;
  srgbTokens: string[];
  summary: string;
  openCheck?: string;
}

export interface PrdDecalAuditEntry {
  decalId: string;
  tier: DecalTier;
  logoKey?: LogoAssetKey;
  label: string;
  zoneId: PrdZoneId;
  side: "left" | "right" | "both" | "top" | "rear";
  normalizedU: number;
  normalizedV: number;
  tag: PrdEvidenceTag;
  status: PrdSurfaceStatus;
  rightsScope: "owner-authorized-dev";
  note: string;
}

export interface PrdTeamLiveryManifest {
  teamId: TeamId;
  season: 2026;
  carModel: string;
  defaultVariantId: LiveryVariantId;
  availableVariants: readonly {
    id: LiveryVariantId;
    label: { vi: string; en: string };
    eventOrDate: string;
    asymmetricSplit: boolean;
    summary: { vi: string; en: string };
  }[];
  primarySourceUrl: string;
  secondarySourceUrl: string;
  drivers: readonly [PrdDriverConfig, PrdDriverConfig];
  zones: readonly PrdZoneAuditEntry[];
  decals: readonly PrdDecalAuditEntry[];
  chassisDiscrepancies: readonly string[];
}

const FIA_2026_MEDIA_KIT =
  "https://www.fia.com/sites/default/files/2026_f1_japanese_gp_media_kit.pdf";

function makeDrivers(
  nameA: string,
  numA: string,
  nameB: string,
  numB: string,
): [PrdDriverConfig, PrdDriverConfig] {
  return [
    {
      configSlot: "A",
      bayRole: "bay-1",
      driverName: nameA,
      carNumber: numA,
      fiaSourceUrl: FIA_2026_MEDIA_KIT,
      nosePlacementStatus: "study",
      flankPlacementStatus: "study",
    },
    {
      configSlot: "B",
      bayRole: "bay-2",
      driverName: nameB,
      carNumber: numB,
      fiaSourceUrl: FIA_2026_MEDIA_KIT,
      nosePlacementStatus: "study",
      flankPlacementStatus: "study",
    },
  ];
}

function makeStandardZones(params: {
  z01: [PrdEvidenceTag, string[], string, string?];
  z02: [PrdEvidenceTag, string[], string, string?];
  z03: [PrdEvidenceTag, string[], string, string?];
  z04: [PrdEvidenceTag, string[], string, string?];
  z05: [PrdEvidenceTag, string[], string, string?];
  z06: [PrdEvidenceTag, string[], string, string?];
  z07: [PrdEvidenceTag, string[], string, string?];
  z08: [PrdEvidenceTag, string[], string, string?];
  z09: [PrdEvidenceTag, string[], string, string?];
  z10: [PrdEvidenceTag, string[], string, string?];
  z11: [PrdEvidenceTag, string[], string, string?];
}): PrdZoneAuditEntry[] {
  const entries: Array<
    [PrdZoneId, [PrdEvidenceTag, string[], string, string?]]
  > = [
    ["Z01", params.z01],
    ["Z02", params.z02],
    ["Z03", params.z03],
    ["Z04", params.z04],
    ["Z05", params.z05],
    ["Z06", params.z06],
    ["Z07", params.z07],
    ["Z08", params.z08],
    ["Z09", params.z09],
    ["Z10", params.z10],
    ["Z11", params.z11],
  ];
  return entries.map(([zoneId, [tag, srgbTokens, summary, openCheck]]) => ({
    zoneId,
    tag,
    leftStatus: tag === "[C]" ? "needs-reference" : "study",
    rightStatus:
      tag === "[N]" ? "verified" : tag === "[P]" ? "study" : "needs-reference",
    topOrRearStatus: tag === "[C]" ? "needs-reference" : "study",
    srgbTokens,
    summary,
    ...(openCheck ? { openCheck } : {}),
  }));
}

export const PRD_2026_LIVERY_MANIFEST: Record<TeamId, PrdTeamLiveryManifest> = {
  mclaren: {
    teamId: "mclaren",
    season: 2026,
    carModel: "MCL40",
    defaultVariantId: "standard-2026",
    availableVariants: [
      {
        id: "standard-2026",
        label: {
          vi: "Tiêu chuẩn 2026 (MCL40)",
          en: "2026 Standard Launch (MCL40)",
        },
        eventOrDate: "2026-02 Launch",
        asymmetricSplit: false,
        summary: {
          vi: "Papaya #EF6E12 + Anthracite #15191C, vai airbox Teal #2193AE, ô xanh DP World #253796 dưới vai trước.",
          en: "Papaya #EF6E12 + Anthracite #15191C, Teal #2193AE airbox shoulder, DP World #253796 lower front box.",
        },
      },
    ],
    primarySourceUrl:
      "https://www.mclaren.com/racing/formula-1/2026/mclaren-racing-reveal-livery-for-the-mclaren-mastercard-formula-1-teams-2026-challenger/",
    secondarySourceUrl:
      "https://www.formula1.com/en/latest/article/gallery-take-a-look-at-every-angle-of-mclarens-2026-livery.7z5YtdHeuCJaX2XMxLWgMR",
    drivers: makeDrivers("Lando Norris", "1", "Oscar Piastri", "81"),
    zones: makeStandardZones({
      z01: [
        "[P]",
        ["#15191C", "#EF6E12"],
        "Dark anthracite center wing base with papaya outer flap panels.",
      ],
      z02: [
        "[P]",
        ["#EF6E12", "#15191C"],
        "Papaya nose cone with Workday on right nose flank and driver number (#1 / #81).",
      ],
      z03: [
        "[P]",
        ["#EF6E12", "#253796", "#15191C"],
        "Papaya upper shoulder, DP World #253796 blue box below shoulder, orange Speedmark on low dark shroud.",
      ],
      z04: [
        "[C]",
        ["#15191C"],
        "Dark anthracite halo; Okta and Iron Mountain kept hidden pending close-up halo projection crop.",
        "Need halo right-side crop for Okta & Iron Mountain.",
      ],
      z05: [
        "[P]",
        ["#2193AE", "#15191C"],
        "Compact teal #2193AE shoulder around airbox with Allwyn mark; dark airbox intake void.",
      ],
      z06: [
        "[P]",
        ["#15191C", "#EF6E12"],
        "Dark anthracite sidepod with OKX and Mastercard circles, plus small papaya rear wedge ahead of rear tyre.",
      ],
      z07: [
        "[P]",
        ["#15191C"],
        "Anthracite engine cover with Gemini high on cover and Dell Technologies lower rear ahead of rear wheel.",
      ],
      z08: [
        "[P]",
        ["#15191C"],
        "Dark carbon underbody skirt separating papaya rear wedge from floor edge.",
      ],
      z09: [
        "[P]",
        ["#15191C", "#F7F6F1"],
        "Dark rear wing with McLaren wordmark on rear face and Dropbox on right endplate.",
        "Verify Pirelli upper flap & Groq lower beam per variant.",
      ],
      z10: [
        "[P]",
        ["#14171D", "#EF6E12"],
        "Dark aero wheel covers with papaya rim detail and neutral Pirelli sidewall.",
      ],
      z11: [
        "[P]",
        ["#15191C", "#F7F6F1"],
        "FIA 2026 numbers #1 (Lando Norris) and #81 (Oscar Piastri) on nose and rear flank.",
      ],
    }),
    decals: [
      {
        decalId: "mclaren-gemini-cover",
        tier: 1,
        logoKey: "gemini",
        label: "Gemini",
        zoneId: "Z07",
        side: "both",
        normalizedU: 0.24,
        normalizedV: 0.72,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "Primary engine-cover mark on anthracite band.",
      },
      {
        decalId: "mclaren-okx-sidepod",
        tier: 1,
        logoKey: "okx",
        label: "OKX",
        zoneId: "Z06",
        side: "both",
        normalizedU: 0.34,
        normalizedV: 0.48,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "Primary dark sidepod wordmark.",
      },
      {
        decalId: "mclaren-mastercard-sidepod",
        tier: 2,
        logoKey: "mastercard",
        label: "Mastercard",
        zoneId: "Z06",
        side: "both",
        normalizedU: 0.45,
        normalizedV: 0.44,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "Mastercard circles on sidepod aft of OKX.",
      },
      {
        decalId: "mclaren-allwyn-airbox",
        tier: 2,
        logoKey: "allwyn",
        label: "Allwyn",
        zoneId: "Z05",
        side: "both",
        normalizedU: 0.36,
        normalizedV: 0.88,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "Placed inside teal #2193AE airbox shoulder.",
      },
      {
        decalId: "mclaren-dell-rear",
        tier: 2,
        logoKey: "dell",
        label: "Dell Technologies",
        zoneId: "Z07",
        side: "right",
        normalizedU: 0.16,
        normalizedV: 0.54,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "Lower rear engine cover ahead of rear wheel.",
      },
      {
        decalId: "mclaren-dpworld-front",
        tier: 2,
        logoKey: "dpWorld",
        label: "DP World",
        zoneId: "Z03",
        side: "both",
        normalizedU: 0.82,
        normalizedV: 0.32,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "Inside dedicated #253796 blue forward shoulder box.",
      },
      {
        decalId: "mclaren-cisco-shoulder",
        tier: 3,
        logoKey: "cisco",
        label: "Cisco",
        zoneId: "Z03",
        side: "right",
        normalizedU: 0.62,
        normalizedV: 0.74,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "Papaya cockpit shoulder mark.",
      },
      {
        decalId: "mclaren-workday-nose",
        tier: 3,
        logoKey: "workday",
        label: "Workday",
        zoneId: "Z02",
        side: "right",
        normalizedU: 0.82,
        normalizedV: 0.52,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "Papaya nose sidewall candidate ahead of front wheel.",
      },
      {
        decalId: "mclaren-dropbox-endplate",
        tier: 3,
        logoKey: "dropbox",
        label: "Dropbox",
        zoneId: "Z09",
        side: "right",
        normalizedU: 0.36,
        normalizedV: 0.74,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "Outer right rear-wing endplate.",
      },
    ],
    chassisDiscrepancies: [
      "Shared 2022 concept chassis has a narrower halo hoop than MCL40; Okta and Iron Mountain [C] halo marks remain hidden per §2 rule.",
      "Sidepod undercut transitions smoothly into the floor edge; dark #15191C lower mask separates the rear papaya wedge from the floor.",
    ],
  },

  ferrari: {
    teamId: "ferrari",
    season: 2026,
    carModel: "SF-26",
    defaultVariantId: "standard-2026",
    availableVariants: [
      {
        id: "standard-2026",
        label: {
          vi: "Tiêu chuẩn 2026 (SF-26)",
          en: "2026 Standard Launch (SF-26)",
        },
        eventOrDate: "2026-02 Launch",
        asymmetricSplit: false,
        summary: {
          vi: "Rosso #D9182B chủ đạo cùng mảng trắng #F2F0EB ôm vai cockpit và vùng trên nắp máy (nền cho HP).",
          en: "Gloss Rosso #D9182B with warm white #F2F0EB cockpit shoulder collar & upper engine cover hood (HP field).",
        },
      },
    ],
    primarySourceUrl:
      "https://www.formula1.com/en/latest/article/first-look-ferrari-reveal-new-sf-26-car-for-2026-f1-season.19b0ad82cdsyXgvA675Ey4",
    secondarySourceUrl:
      "https://www.the-race.com/formula-1/ferrari-2026-f1-car-serrated-shark-fin-engine-cover/",
    drivers: makeDrivers("Charles Leclerc", "16", "Lewis Hamilton", "44"),
    zones: makeStandardZones({
      z01: [
        "[P]",
        ["#17191B", "#D9182B"],
        "Dark carbon front wing separated cleanly from the Rosso nose cone.",
      ],
      z02: [
        "[P]",
        ["#D9182B", "#FFE045"],
        "Rosso nose with rectangular Ferrari nose badge and driver number (#16 / #44).",
      ],
      z03: [
        "[P]",
        ["#D9182B", "#F2F0EB"],
        "Rosso forward chassis with Scuderia shield ahead of cockpit and white collar wrapping cockpit shoulders.",
      ],
      z04: [
        "[P]",
        ["#D9182B", "#17191B"],
        "Rosso halo outer fairing with dark cockpit interior.",
      ],
      z05: [
        "[P]",
        ["#F2F0EB", "#D9182B", "#17191B"],
        "White collar transitions from cockpit shoulders into upper airbox/engine cover spine; dark airbox opening.",
      ],
      z06: [
        "[P]",
        ["#D9182B", "#F2F0EB"],
        "Rosso sidepod with Shell pecten ahead of white CEVA Logistics wordmark.",
      ],
      z07: [
        "[P]",
        ["#F2F0EB", "#D9182B"],
        "Warm white #F2F0EB upper engine-cover hood carrying blue HP roundel; UniCredit on rear upper red flank.",
      ],
      z08: ["[P]", ["#17191B"], "Dark carbon floor edge and underbody."],
      z09: [
        "[C]",
        ["#17191B", "#193987"],
        "Dark launch rear wing base; blue #193987 IBM wing variant recorded as separate GP check.",
        "Verify rear-view IBM blue wing vs dark launch wing variant.",
      ],
      z10: [
        "[P]",
        ["#14171D", "#D9182B"],
        "Dark aero wheel covers with Rosso rim pinstripe.",
      ],
      z11: [
        "[P]",
        ["#F2F0EB", "#17191B"],
        "FIA 2026 numbers #16 (Charles Leclerc) and #44 (Lewis Hamilton).",
      ],
    }),
    decals: [
      {
        decalId: "ferrari-hp-cover",
        tier: 1,
        logoKey: "hp",
        label: "HP",
        zoneId: "Z07",
        side: "both",
        normalizedU: 0.24,
        normalizedV: 0.78,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "Blue HP roundel on warm white #F2F0EB upper engine cover.",
      },
      {
        decalId: "ferrari-ceva-sidepod",
        tier: 1,
        logoKey: "ceva",
        label: "CEVA Logistics",
        zoneId: "Z06",
        side: "both",
        normalizedU: 0.31,
        normalizedV: 0.46,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "White CEVA Logistics wordmark on Rosso sidepod.",
      },
      {
        decalId: "ferrari-shell-sidepod",
        tier: 2,
        logoKey: "shell",
        label: "Shell",
        zoneId: "Z06",
        side: "both",
        normalizedU: 0.44,
        normalizedV: 0.45,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "Shell pecten placed forward of CEVA on Rosso sidepod.",
      },
      {
        decalId: "ferrari-shield-cockpit",
        tier: 1,
        logoKey: "ferrari",
        label: "Scuderia Shield",
        zoneId: "Z03",
        side: "both",
        normalizedU: 0.58,
        normalizedV: 0.72,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "Scuderia shield ahead of cockpit on upper flank.",
      },
      {
        decalId: "ferrari-unicredit-rear",
        tier: 2,
        logoKey: "unicredit",
        label: "UniCredit",
        zoneId: "Z07",
        side: "both",
        normalizedU: 0.14,
        normalizedV: 0.62,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "White UniCredit mark on upper rear red flank.",
      },
    ],
    chassisDiscrepancies: [
      "SF-26 serrated shark-fin notch is represented as a continuous white-to-red dorsal contour on the shared chassis.",
      "White collar wraps cockpit shoulders from top/side without spilling onto the vertical sidepod inlet face.",
    ],
  },

  mercedes: {
    teamId: "mercedes",
    season: 2026,
    carModel: "W17",
    defaultVariantId: "standard-2026",
    availableVariants: [
      {
        id: "standard-2026",
        label: {
          vi: "Tiêu chuẩn 2026 (W17)",
          en: "2026 Standard Launch (W17)",
        },
        eventOrDate: "2026-02 Launch",
        asymmetricSplit: false,
        summary: {
          vi: "Đen Obsidian #0A0D10 chủ đạo toàn thân kết hợp dải PETRONAS teal #00D2BE, mũi bạc mảnh và họa tiết sao 3 cánh bạc trên nắp máy.",
          en: "Stealth Obsidian Black #0A0D10 full body with vibrant PETRONAS emerald-teal #00D2BE aero sweep, silver nose blade & 3-pointed star engine cover.",
        },
      },
    ],
    primarySourceUrl:
      "https://www.mercedesamgf1.com/news/mercedes-amg-f1-2026-challenger-w17-revealed",
    secondarySourceUrl:
      "https://www.formula1.com/en/latest/article/gallery-check-out-every-angle-of-mercedes-new-livery-for-2026.70sm6Znl139u64MesOt5Vf",
    drivers: makeDrivers("George Russell", "63", "Kimi Antonelli", "12"),
    zones: makeStandardZones({
      z01: [
        "[P]",
        ["#131719", "#C1C9C9"],
        "Dark carbon front wing base with silver/teal flap accents.",
      ],
      z02: [
        "[P]",
        ["#C1C9C9", "#131719"],
        "Silver nose cone with dark Mercedes star and driver number (#63 / #12).",
      ],
      z03: [
        "[P]",
        ["#C1C9C9", "#0B7776", "#22BEB6"],
        "Silver front chassis shoulders with low Petronas teal sweep ascending toward sidepod shoulder.",
      ],
      z04: [
        "[P]",
        ["#131719", "#C1C9C9"],
        "From top view, dark central cockpit spine framed between two silver shoulder edges.",
      ],
      z05: [
        "[P]",
        ["#131719"],
        "Dark airbox and dorsal spine continuing rearward from cockpit.",
      ],
      z06: [
        "[N]",
        ["#131719", "#C1C9C9", "#0B7776"],
        "White PETRONAS wordmark along sidepod main axis; AMG diamond pattern on upper sidepod shoulder.",
      ],
      z07: [
        "[N]",
        ["#131719", "#F4FAF9"],
        "Dark engine cover with repeating 3-pointed star field and Microsoft wordmark positioned lower/aft of stars.",
      ],
      z08: [
        "[P]",
        ["#131719"],
        "Dark carbon lower body and floor edge (teal line does not cover bottom skirt).",
      ],
      z09: [
        "[P]",
        ["#131719", "#F4FAF9"],
        "Dark rear wing without silver bleed on dorsal spine.",
      ],
      z10: [
        "[P]",
        ["#14171D", "#22BEB6"],
        "Dark aero wheel covers with subtle teal rim ring.",
      ],
      z11: [
        "[P]",
        ["#131719", "#F4FAF9"],
        "FIA 2026 numbers #63 (George Russell) and #12 (Kimi Antonelli).",
      ],
    }),
    decals: [
      {
        decalId: "mercedes-petronas-sidepod",
        tier: 1,
        logoKey: "petronas",
        label: "PETRONAS",
        zoneId: "Z06",
        side: "both",
        normalizedU: 0.33,
        normalizedV: 0.46,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "White PETRONAS wordmark along main sidepod axis.",
      },
      {
        decalId: "mercedes-microsoft-cover",
        tier: 2,
        logoKey: "microsoft",
        label: "Microsoft",
        zoneId: "Z07",
        side: "both",
        normalizedU: 0.19,
        normalizedV: 0.58,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "Positioned lower/aft relative to the 3-pointed star cluster.",
      },
      {
        decalId: "mercedes-star-nose",
        tier: 1,
        logoKey: "mercedes",
        label: "Mercedes Star",
        zoneId: "Z02",
        side: "top",
        normalizedU: 0.88,
        normalizedV: 0.68,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "Three-pointed star emblem on silver nose tip.",
      },
    ],
    chassisDiscrepancies: [
      "AMG shoulder diamonds and rear engine-cover 3-pointed stars are rendered as two separate procedural mask layers on PART_BODY_SHELL.",
    ],
  },

  "red-bull": {
    teamId: "red-bull",
    season: 2026,
    carModel: "RB22",
    defaultVariantId: "standard-2026",
    availableVariants: [
      {
        id: "standard-2026",
        label: {
          vi: "Tiêu chuẩn 2026 (RB22)",
          en: "2026 Standard Launch (RB22)",
        },
        eventOrDate: "2026-02 Launch",
        asymmetricSplit: false,
        summary: {
          vi: "Xanh đậm bóng #14306E, cánh tối #101A3D, bò đỏ #E32C31 & mặt trời vàng trên nắp máy, ORACLE trắng ở sidepod và cánh sau.",
          en: "Gloss deep blue #14306E body, darker #101A3D wings, red bull & yellow sun engine cover graphic, white ORACLE on sidepod & rear wing.",
        },
      },
    ],
    primarySourceUrl:
      "https://www.redbullracing.com/int-en/races/season-launch-2026",
    secondarySourceUrl:
      "https://www.formula1.com/en/latest/article/gallery-every-angle-of-red-bulls-2026-livery.2wkyYJ754lp5juGmqEYlaf",
    drivers: makeDrivers("Max Verstappen", "3", "Isack Hadjar", "6"),
    zones: makeStandardZones({
      z01: [
        "[P]",
        ["#101A3D", "#E32C31"],
        "Front wing painted in darker navy #101A3D than the #14306E body.",
      ],
      z02: [
        "[P]",
        ["#14306E", "#FFCE00", "#E32C31"],
        "Blue nose cone with yellow/red tip detail and FIA 2026 number (#3 / #6).",
      ],
      z03: [
        "[P]",
        ["#14306E"],
        "Continuous deep blue #14306E across forward chassis and cockpit surround.",
      ],
      z04: [
        "[P]",
        ["#14306E", "#101A3D"],
        "Deep blue halo fairing with dark cockpit interior.",
      ],
      z05: [
        "[P]",
        ["#14306E", "#FFCE00"],
        "Deep blue airbox hood crowned by yellow sun and red bull charge graphic.",
      ],
      z06: [
        "[P]",
        ["#14306E", "#FFFAF4"],
        "Large white ORACLE wordmark on #14306E blue sidepod.",
      ],
      z07: [
        "[P]",
        ["#14306E", "#E32C31", "#FFCE00"],
        "Charging red bull and yellow sun occupying upper engine cover; white Ford oval near rear wheel.",
      ],
      z08: ["[P]", ["#101A3D"], "Dark floor edge and lower undercut."],
      z09: [
        "[P]",
        ["#101A3D", "#FFFAF4"],
        "White ORACLE wordmark across dark #101A3D rear wing mainplane.",
      ],
      z10: [
        "[P]",
        ["#14171D", "#E32C31"],
        "Dark aero wheel covers with red rim stripe.",
      ],
      z11: [
        "[P]",
        ["#E32C31", "#FFFAF4"],
        "FIA 2026 numbers #3 (Max Verstappen) and #6 (Isack Hadjar).",
      ],
    }),
    decals: [
      {
        decalId: "redbull-oracle-sidepod",
        tier: 1,
        logoKey: "oracle",
        label: "ORACLE",
        zoneId: "Z06",
        side: "both",
        normalizedU: 0.34,
        normalizedV: 0.46,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "Large white ORACLE wordmark on blue sidepod.",
      },
      {
        decalId: "redbull-sunbulls-cover",
        tier: 1,
        logoKey: "redbullSunBulls",
        label: "Red Bull Sun & Bulls",
        zoneId: "Z07",
        side: "both",
        normalizedU: 0.24,
        normalizedV: 0.78,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "Upper engine-cover sun and charging bull artwork.",
      },
      {
        decalId: "redbull-ford-rear",
        tier: 2,
        logoKey: "ford",
        label: "Ford",
        zoneId: "Z07",
        side: "both",
        normalizedU: 0.14,
        normalizedV: 0.38,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "Ford oval on lower rear engine cover ahead of rear tyre.",
      },
      {
        decalId: "redbull-oracle-rearwing",
        tier: 2,
        logoKey: "oracle",
        label: "ORACLE Rear Wing",
        zoneId: "Z09",
        side: "rear",
        normalizedU: 0.81,
        normalizedV: 0.49,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "White ORACLE spanning dark rear wing.",
      },
    ],
    chassisDiscrepancies: [
      "Engine-cover bull-and-sun graphic is scaled to fit the FP-04 RB upper dorsal hood without overlapping the white ORACLE sidepod band.",
    ],
  },

  "racing-bulls": {
    teamId: "racing-bulls",
    season: 2026,
    carModel: "VCARB 03",
    defaultVariantId: "standard-2026",
    availableVariants: [
      {
        id: "standard-2026",
        label: {
          vi: "Tiêu chuẩn 2026 (VCARB 03 Detroit)",
          en: "2026 Standard Launch (VCARB 03 Detroit)",
        },
        eventOrDate: "2026-02 Detroit Launch",
        asymmetricSplit: false,
        summary: {
          vi: "Nền trắng sáng #ECF0EE lớn ở đầu và sidepod (cho chữ VISA xanh), hai dải xanh #1C4AA9/#163F9B định hình hông, bò đỏ #D93439 trên vùng trắng cao.",
          en: "Large bright white #ECF0EE field for blue VISA, two blue contour bands (#1C4AA9 / #163F9B), red charging bull on upper white region, Ford on rear blue.",
        },
      },
    ],
    primarySourceUrl: "https://www.visacashapprb.com/int-en/cars/vcarb03",
    secondarySourceUrl:
      "https://www.redbull.com/us-en/visa-cash-app-racing-bulls-2026-f1-livery-launch",
    drivers: makeDrivers("Liam Lawson", "30", "Arvid Lindblad", "41"),
    zones: makeStandardZones({
      z01: [
        "[P]",
        ["#1C4AA9", "#161A25"],
        "Front wing split between #1C4AA9 blue and #161A25 dark sections.",
      ],
      z02: [
        "[P]",
        ["#ECF0EE", "#1C4AA9"],
        "White nose cone with blue sidewall stripe and driver number (#30 / #41).",
      ],
      z03: [
        "[P]",
        ["#ECF0EE", "#1C4AA9"],
        "White forward chassis with blue shoulder contour line.",
      ],
      z04: [
        "[P]",
        ["#ECF0EE", "#1C4AA9"],
        "White surround preserved around cockpit with blue shoulder border.",
      ],
      z05: [
        "[P]",
        ["#ECF0EE", "#1C4AA9"],
        "White upper airbox region transitioning into blue aft dorsal tail.",
      ],
      z06: [
        "[P]",
        ["#ECF0EE", "#1C4AA9", "#163F9B"],
        "Large white sidepod field framed by upper/aft #1C4AA9 blue and lower #163F9B blue bands, carrying blue VISA wordmark.",
      ],
      z07: [
        "[P]",
        ["#ECF0EE", "#1C4AA9", "#D93439"],
        "Red charging bull on high white upper body separated from VISA; white Ford oval on rear blue section.",
      ],
      z08: [
        "[P]",
        ["#163F9B", "#161A25"],
        "Lower #163F9B blue band running above dark #161A25 technical floor edge.",
      ],
      z09: [
        "[P]",
        ["#161A25", "#1C4AA9"],
        "VISA on dark right rear-wing endplate and rear wing mainplane.",
      ],
      z10: [
        "[P]",
        ["#161A25", "#1C4AA9"],
        "Dark wheel covers with blue rim accent.",
      ],
      z11: [
        "[P]",
        ["#161A25", "#ECF0EE"],
        "FIA 2026 numbers #30 (Liam Lawson) and #41 (Arvid Lindblad).",
      ],
    }),
    decals: [
      {
        decalId: "vcarb-visa-sidepod",
        tier: 1,
        logoKey: "visa",
        label: "VISA",
        zoneId: "Z06",
        side: "both",
        normalizedU: 0.38,
        normalizedV: 0.48,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "Blue VISA wordmark on white sidepod field.",
      },
      {
        decalId: "vcarb-bull-cover",
        tier: 1,
        logoKey: "racingbulls",
        label: "Red Charging Bull",
        zoneId: "Z07",
        side: "both",
        normalizedU: 0.28,
        normalizedV: 0.78,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "Red bull graphic on high white region separated from VISA.",
      },
      {
        decalId: "vcarb-ford-rear",
        tier: 2,
        logoKey: "ford",
        label: "Ford",
        zoneId: "Z07",
        side: "both",
        normalizedU: 0.14,
        normalizedV: 0.42,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "Ford oval on rear blue #1C4AA9 panel.",
      },
      {
        decalId: "vcarb-visa-endplate",
        tier: 2,
        logoKey: "visa",
        label: "VISA Endplate",
        zoneId: "Z09",
        side: "right",
        normalizedU: 0.36,
        normalizedV: 0.74,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "VISA on dark right rear-wing endplate.",
      },
    ],
    chassisDiscrepancies: [
      "Upper white field is extended backward to u=0.22 so the red charging bull sits on white #ECF0EE while Ford sits on the aft #1C4AA9 blue tail.",
    ],
  },

  "aston-martin": {
    teamId: "aston-martin",
    season: 2026,
    carModel: "AMR26",
    defaultVariantId: "standard-2026",
    availableVariants: [
      {
        id: "standard-2026",
        label: {
          vi: "Tiêu chuẩn 2026 (AMR26)",
          en: "2026 Standard Launch (AMR26)",
        },
        eventOrDate: "2026-02 Launch",
        asymmetricSplit: false,
        summary: {
          vi: "Racing green #075744 satin với đường nhấn lime #BFD82C mảnh chạy dọc thân và chữ aramco trắng #F3F6EA tương phản cao.",
          en: "Satin Racing Green #075744 with fine lime #BFD82C body pinline and high-contrast warm white #F3F6EA aramco wordmark.",
        },
      },
    ],
    primarySourceUrl:
      "https://www.astonmartinf1.com/en-GB/news/announcement/aston-martin-aramco-launches-season-with-livery-reveal",
    secondarySourceUrl:
      "https://www.formula1.com/en/latest/article/gallery-check-out-every-angle-of-aston-martins-2026-livery.33hwCL69EtT4X6xpBUTkBA",
    drivers: makeDrivers("Fernando Alonso", "14", "Lance Stroll", "18"),
    zones: makeStandardZones({
      z01: [
        "[P]",
        ["#11221F", "#BFD82C"],
        "Dark #11221F front wing contrasting with Racing Green nose.",
      ],
      z02: [
        "[P]",
        ["#075744", "#BFD82C"],
        "Racing Green #075744 nose cone where fine lime #BFD82C flank line originates.",
      ],
      z03: [
        "[P]",
        ["#075744", "#BFD82C"],
        "Lime accent line runs from nose sidewall along the chassis shoulder contour.",
      ],
      z04: [
        "[P]",
        ["#075744", "#11221F"],
        "Green outer shoulders framing a dark #11221F central cockpit–airbox spine from top view.",
      ],
      z05: [
        "[P]",
        ["#11221F", "#075744"],
        "Dark central airbox spine surrounded by Racing Green shoulders.",
      ],
      z06: [
        "[P]",
        ["#075744", "#F3F6EA", "#BFD82C"],
        "Warm white aramco wordmark on Racing Green sidepod; fine lime pinstripe runs along transition boundary without crossing letters.",
      ],
      z07: [
        "[P]",
        ["#075744", "#F3F6EA"],
        "Aston Martin wings emblem high on Racing Green engine cover.",
      ],
      z08: [
        "[P]",
        ["#11221F"],
        "Dark green-black #11221F lower undercut and floor edge.",
      ],
      z09: [
        "[P]",
        ["#11221F", "#F3F6EA"],
        "Valvoline logo across dark #11221F rear wing rear face.",
      ],
      z10: [
        "[P]",
        ["#14171D", "#BFD82C"],
        "Dark wheel covers with fine lime rim accent.",
      ],
      z11: [
        "[P]",
        ["#F3F6EA", "#11221F"],
        "FIA 2026 numbers #14 (Fernando Alonso) and #18 (Lance Stroll).",
      ],
    }),
    decals: [
      {
        decalId: "amr-aramco-sidepod",
        tier: 1,
        logoKey: "aramco",
        label: "aramco",
        zoneId: "Z06",
        side: "both",
        normalizedU: 0.34,
        normalizedV: 0.48,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "Primary white aramco wordmark on Racing Green sidepod.",
      },
      {
        decalId: "amr-wings-cover",
        tier: 1,
        logoKey: "astonmartin",
        label: "Aston Martin Wings",
        zoneId: "Z07",
        side: "both",
        normalizedU: 0.24,
        normalizedV: 0.78,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "Wings emblem on upper engine cover.",
      },
      {
        decalId: "amr-valvoline-rearwing",
        tier: 2,
        logoKey: "valvoline",
        label: "Valvoline",
        zoneId: "Z09",
        side: "rear",
        normalizedU: 0.81,
        normalizedV: 0.49,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "Valvoline mark across dark rear wing.",
      },
    ],
    chassisDiscrepancies: [
      "Launch gallery depicts livery on an early showcar; fine lime #BFD82C pinline follows FP-04 RB's lower-to-mid sidepod contour below the aramco wordmark.",
    ],
  },

  alpine: {
    teamId: "alpine",
    season: 2026,
    carModel: "A526",
    defaultVariantId: "standard-2026",
    availableVariants: [
      {
        id: "standard-2026",
        label: {
          vi: "Tiêu chuẩn 2026 (A526)",
          en: "2026 Standard Launch (A526)",
        },
        eventOrDate: "2026-02 Launch",
        asymmetricSplit: false,
        summary: {
          vi: "Hông và nắp máy xanh Alpine #095FB1, hồng BWT #F17EB6 tập trung ở mũi, phần giữa cánh trước, vùng halo trước và cánh sau.",
          en: "Alpine blue #095FB1 sidepods & engine cover; BWT pink #F17EB6 focused on nose, center front wing, forward halo band & rear wing.",
        },
      },
    ],
    primarySourceUrl:
      "https://media.alpinecars.com/bwt-alpine-formula-one-team-sets-sail-on-historic-2026-campaign-buoyed-by-new-regulations/?lang=eng",
    secondarySourceUrl:
      "https://www.formula1.com/en/latest/article/gallery-see-all-the-angles-of-alpines-2026-f1-car.29Ovl5O6FJcTNQgwE4Fuwx",
    drivers: makeDrivers("Pierre Gasly", "10", "Franco Colapinto", "43"),
    zones: makeStandardZones({
      z01: [
        "[P]",
        ["#F17EB6", "#1B1D24"],
        "Front wing with BWT pink #F17EB6 center section and dark #1B1D24 outboard sections.",
      ],
      z02: [
        "[P]",
        ["#F17EB6", "#095FB1"],
        "BWT pink #F17EB6 upper nose cone with driver number (#10 / #43).",
      ],
      z03: [
        "[P]",
        ["#F17EB6", "#095FB1"],
        "Pink front flank tapering down as it enters cockpit shoulder, leaving main flank Alpine blue #095FB1.",
      ],
      z04: [
        "[P]",
        ["#F17EB6", "#095FB1"],
        "Pink forward halo band transitioning back to Alpine blue body.",
      ],
      z05: [
        "[P]",
        ["#095FB1", "#1B1D24"],
        "Alpine blue #095FB1 airbox surround with dark intake void.",
      ],
      z06: [
        "[P]",
        ["#095FB1", "#F17EB6"],
        "Large pink BWT graphic on Alpine blue #095FB1 sidepod.",
      ],
      z07: [
        "[P]",
        ["#095FB1", "#F8F8FC"],
        "White eni six-legged-dog mark on blue upper engine cover and Alpine A emblem.",
      ],
      z08: [
        "[P]",
        ["#1B1D24"],
        "Dark #1B1D24 floor edge and lower carbon skirt.",
      ],
      z09: [
        "[P]",
        ["#F17EB6", "#1B1D24"],
        "BWT pink #F17EB6 rear wing with black eni mark on right rear-wing endplate.",
      ],
      z10: [
        "[P]",
        ["#14171D", "#F17EB6"],
        "Dark aero wheel covers with BWT pink rim accent.",
      ],
      z11: [
        "[P]",
        ["#F8F8FC", "#1B1D24"],
        "FIA 2026 numbers #10 (Pierre Gasly) and #43 (Franco Colapinto).",
      ],
    }),
    decals: [
      {
        decalId: "alpine-bwt-sidepod",
        tier: 1,
        logoKey: "bwt",
        label: "BWT",
        zoneId: "Z06",
        side: "both",
        normalizedU: 0.34,
        normalizedV: 0.46,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "Pink BWT graphic on Alpine blue #095FB1 sidepod.",
      },
      {
        decalId: "alpine-eni-cover",
        tier: 2,
        logoKey: "eni",
        label: "eni (White)",
        zoneId: "Z07",
        side: "both",
        normalizedU: 0.24,
        normalizedV: 0.76,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "White eni six-legged-dog mark on blue engine cover.",
      },
      {
        decalId: "alpine-eni-endplate",
        tier: 2,
        logoKey: "eni",
        label: "eni (Black Endplate)",
        zoneId: "Z09",
        side: "right",
        normalizedU: 0.36,
        normalizedV: 0.74,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "Black eni mark on pink right rear-wing endplate.",
      },
    ],
    chassisDiscrepancies: [
      "Top view clearly separates the BWT pink #F17EB6 nose/forward-halo cap from the Alpine blue #095FB1 sidepods and engine cover.",
    ],
  },

  williams: {
    teamId: "williams",
    season: 2026,
    carModel: "FW48",
    defaultVariantId: "standard-2026",
    availableVariants: [
      {
        id: "standard-2026",
        label: {
          vi: "Tiêu chuẩn 2026 (FW48)",
          en: "2026 Standard Launch (FW48)",
        },
        eventOrDate: "2026-02 Launch",
        asymmetricSplit: false,
        summary: {
          vi: "Xanh bóng #1555BD chủ đạo, tầng giữa cyan Barclays #30A5D2, ô trắng thấp phía sau #F1F2F0 cho Komatsu xanh và đường chỉ viền đỏ–trắng #D32E37.",
          en: "Gloss blue #1555BD dominant body, cyan #30A5D2 Barclays mid-sidepod, white #F1F2F0 lower rear Komatsu panel & red-white #D32E37 heritage border.",
        },
      },
    ],
    primarySourceUrl:
      "https://www.formula1.com/en/latest/article/first-look-williams-show-off-their-new-livery-for-2026-f1-season.4tY1qBa2lWI35hqxV6AH1g",
    secondarySourceUrl:
      "https://www.williamsf1.com/articles/b299bc9b-de99-4e81-9675-851ac2ed0fed/discover-our-fw48-livery-up-close-and-claim-the-badge",
    drivers: makeDrivers("Alex Albon", "23", "Carlos Sainz", "55"),
    zones: makeStandardZones({
      z01: [
        "[P]",
        ["#11171E", "#F1F2F0", "#1555BD"],
        "Black #11171E front wing top with white #F1F2F0 outer boxes and light Atlassian mark.",
      ],
      z02: [
        "[P]",
        ["#1555BD", "#F1F2F0", "#D32E37"],
        "Gloss blue #1555BD nose with Williams W emblem, red-white border line and driver number (#23 / #55).",
      ],
      z03: [
        "[P]",
        ["#1555BD"],
        "Gloss blue #1555BD forward chassis and cockpit shoulders.",
      ],
      z04: [
        "[P]",
        ["#1555BD", "#11171E"],
        "Blue cockpit shoulders with dark #11171E cockpit interior.",
      ],
      z05: [
        "[C]",
        ["#1555BD", "#11171E"],
        "Blue airbox hood; Duracell airbox styling recorded as candidate pending angle verification.",
        "Verify Duracell airbox decal across launch vs race photos.",
      ],
      z06: [
        "[P]",
        ["#30A5D2", "#1555BD"],
        "Dedicated cyan #30A5D2 mid-sidepod shoulder contour carrying white Barclays wordmark and eagle.",
      ],
      z07: [
        "[P]",
        ["#1555BD", "#F1F2F0", "#D32E37"],
        "Three-tier right profile: light Atlassian high on blue #1555BD engine cover, Barclays on cyan mid-sidepod, blue Komatsu on white #F1F2F0 lower rear panel with red-white border.",
      ],
      z08: ["[P]", ["#11171E"], "Dark #11171E lower skirt and floor edge."],
      z09: [
        "[P]",
        ["#11171E", "#1555BD", "#F1F2F0"],
        "White Komatsu on blue #1555BD right rear-wing endplate.",
      ],
      z10: [
        "[P]",
        ["#11171E", "#30A5D2"],
        "Dark wheel covers with cyan/blue rim accent.",
      ],
      z11: [
        "[P]",
        ["#F1F2F0", "#11171E"],
        "FIA 2026 numbers #23 (Alex Albon) and #55 (Carlos Sainz).",
      ],
    }),
    decals: [
      {
        decalId: "williams-atlassian-cover",
        tier: 1,
        logoKey: "atlassian",
        label: "Atlassian",
        zoneId: "Z07",
        side: "both",
        normalizedU: 0.28,
        normalizedV: 0.78,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "Light Atlassian high on blue #1555BD engine cover (non-overlapping with Barclays).",
      },
      {
        decalId: "williams-barclays-sidepod",
        tier: 1,
        logoKey: "barclays",
        label: "Barclays",
        zoneId: "Z06",
        side: "both",
        normalizedU: 0.42,
        normalizedV: 0.46,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "White Barclays mark inside cyan #30A5D2 mid-sidepod field.",
      },
      {
        decalId: "williams-komatsu-rear",
        tier: 2,
        logoKey: "komatsu",
        label: "Komatsu (Blue)",
        zoneId: "Z07",
        side: "both",
        normalizedU: 0.19,
        normalizedV: 0.24,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "Blue Komatsu wordmark inside white #F1F2F0 lower rear panel ahead of rear wheel.",
      },
      {
        decalId: "williams-komatsu-endplate",
        tier: 2,
        logoKey: "komatsu",
        label: "Komatsu (White Endplate)",
        zoneId: "Z09",
        side: "right",
        normalizedU: 0.36,
        normalizedV: 0.74,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "White Komatsu on blue right rear-wing endplate.",
      },
    ],
    chassisDiscrepancies: [
      "Three-tier flank layout (blue cover / cyan sidepod / white lower rear panel) is separated by clean non-overlapping UV polygons with a red-white heritage border.",
    ],
  },

  haas: {
    teamId: "haas",
    season: 2026,
    carModel: "VF-26",
    defaultVariantId: "standard-2026",
    availableVariants: [
      {
        id: "standard-2026",
        label: {
          vi: "Tiêu chuẩn 2026 (VF-26)",
          en: "2026 Standard Launch (VF-26)",
        },
        eventOrDate: "2026-02 Launch",
        asymmetricSplit: false,
        summary: {
          vi: "Nền trắng #E8E9E6, glyph HAAS lớn ở sidepod, cụm TGR Toyota Gazoo Racing trên nắp máy cùng mảng đỏ #D51C2D quét rộng và dải đen #141719.",
          en: "White #E8E9E6 base, large VF-26 HAAS sidepod glyph, TGR engine-cover graphic with wide rising red #D51C2D sweep and black #141719 border band.",
        },
      },
    ],
    primarySourceUrl:
      "https://www.haasf1team.com/news/tgr-haas-f1-team-reveals-vf-26-design-livery",
    secondarySourceUrl:
      "https://www.formula1.com/en/latest/article/gallery-check-out-every-angle-of-haas-livery-design-for-2026.F8aBXbh0IdujXCPIf6ArC",
    drivers: makeDrivers("Esteban Ocon", "31", "Oliver Bearman", "87"),
    zones: makeStandardZones({
      z01: [
        "[P]",
        ["#141719", "#E8E9E6", "#D51C2D"],
        "Black #141719 front wing base with white #E8E9E6 side blocks and short red #D51C2D flap accents.",
      ],
      z02: [
        "[P]",
        ["#E8E9E6", "#141719", "#D51C2D"],
        "White #E8E9E6 nose with dark lower flank lead-in, short red accent and driver number (#31 / #87).",
      ],
      z03: [
        "[P]",
        ["#E8E9E6", "#141719"],
        "White forward chassis with dark central spine leading into cockpit.",
      ],
      z04: [
        "[P]",
        ["#141719", "#E8E9E6"],
        "Dark #141719 cockpit surround and halo.",
      ],
      z05: [
        "[P]",
        ["#E8E9E6", "#141719"],
        "Airbox kept distinct from the red engine-cover sweep so red does not cut across intake mouth.",
      ],
      z06: [
        "[P]",
        ["#E8E9E6", "#141719"],
        "Large extracted VF-26 HAAS sidepod glyph on white #E8E9E6 sidepod (not the boxed team badge).",
      ],
      z07: [
        "[P]",
        ["#D51C2D", "#141719", "#E8E9E6"],
        "Wide rising red #D51C2D sweep behind cockpit bordered by black #141719 band, with TGR Toyota Gazoo Racing graphic high on engine cover.",
      ],
      z08: ["[P]", ["#141719"], "Dark #141719 lower skirt and floor edge."],
      z09: [
        "[P]",
        ["#141719", "#E8E9E6", "#D51C2D"],
        "Rear wing combining dark #141719 base with white #E8E9E6 and red #D51C2D zones.",
      ],
      z10: [
        "[P]",
        ["#141719", "#D51C2D"],
        "Dark wheel covers with red rim accent.",
      ],
      z11: [
        "[P]",
        ["#141719", "#E8E9E6"],
        "FIA 2026 numbers #31 (Esteban Ocon) and #87 (Oliver Bearman).",
      ],
    }),
    decals: [
      {
        decalId: "haas-glyph-sidepod",
        tier: 1,
        logoKey: "haasSidepod",
        label: "HAAS VF-26 Glyph",
        zoneId: "Z06",
        side: "both",
        normalizedU: 0.36,
        normalizedV: 0.46,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "Extracted VF-26 sidepod wordmark glyph on white sidepod.",
      },
      {
        decalId: "haas-tgr-cover",
        tier: 1,
        logoKey: "tgr",
        label: "TGR Toyota Gazoo Racing",
        zoneId: "Z07",
        side: "both",
        normalizedU: 0.24,
        normalizedV: 0.78,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "TGR red/black graphic on upper engine cover.",
      },
    ],
    chassisDiscrepancies: [
      "Uses the authentic VF-26 sidepod glyph (haasSidepod) on the white sidepod and keeps the airbox intake separate from the rising red dorsal sweep.",
    ],
  },

  audi: {
    teamId: "audi",
    season: 2026,
    carModel: "R26",
    defaultVariantId: "standard-2026",
    availableVariants: [
      {
        id: "standard-2026",
        label: {
          vi: "Tiêu chuẩn 2026 (Audi R26)",
          en: "2026 Standard Launch (Audi R26)",
        },
        eventOrDate: "2026-02 Launch",
        asymmetricSplit: false,
        summary: {
          vi: "Ba khối vật liệu/màu độc lập: Titanium #AEB2B1 phía trước (Revolut đen), khối đỏ Lava Red #D92D35 phía sau sidepod, carbon #111315 phía trên (4 vòng Audi).",
          en: "Three distinct blocks: Titanium #AEB2B1 forward body (black Revolut), bold Lava Red #D92D35 rear sidepod block, exposed carbon #111315 upper cover (Four Rings).",
        },
      },
    ],
    primarySourceUrl: "https://www.audif1.com/en/audi-r26-car",
    secondarySourceUrl:
      "https://contenthub.audif1.com/en/releases/glasurit-becomes-exclusive-paint-supplier-of-audi-revolut-f1-team-for-2026-debut-151",
    drivers: makeDrivers("Nico Hülkenberg", "27", "Gabriel Bortoleto", "5"),
    zones: makeStandardZones({
      z01: [
        "[P]",
        ["#111315", "#AEB2B1"],
        "Front wing with dark #111315 outboard flaps and titanium #AEB2B1 center detail.",
      ],
      z02: [
        "[P]",
        ["#AEB2B1", "#111315"],
        "Metallic satin titanium #AEB2B1 nose with dark Four Rings and driver number (#27 / #5).",
      ],
      z03: [
        "[P]",
        ["#AEB2B1", "#111315"],
        "Titanium #AEB2B1 forward chassis shoulders.",
      ],
      z04: [
        "[P]",
        ["#111315", "#AEB2B1"],
        "Dark carbon #111315 spine behind cockpit transitioning from titanium shoulders.",
      ],
      z05: [
        "[P]",
        ["#111315"],
        "Exposed carbon #111315 airbox and upper dorsal ridge.",
      ],
      z06: [
        "[N]",
        ["#AEB2B1", "#D92D35"],
        "Black Revolut wordmark on titanium #AEB2B1 forward sidepod; wide Lava Red #D92D35 block on rear sidepod taper.",
      ],
      z07: [
        "[P]",
        ["#111315", "#F6F7F5"],
        "Exposed carbon #111315 upper engine cover carrying Audi Four Rings.",
      ],
      z08: [
        "[P]",
        ["#111315"],
        "Exposed carbon #111315 lower floor and diffuser.",
      ],
      z09: [
        "[P]",
        ["#111315", "#F6F7F5"],
        "White Revolut wordmark spanning dark #111315 rear wing mainplane.",
      ],
      z10: [
        "[P]",
        ["#111315", "#D92D35"],
        "Dark carbon wheel covers with Lava Red accent ring.",
      ],
      z11: [
        "[P]",
        ["#F6F7F5", "#111315"],
        "FIA 2026 numbers #27 (Nico Hülkenberg) and #5 (Gabriel Bortoleto).",
      ],
    }),
    decals: [
      {
        decalId: "audi-revolut-sidepod",
        tier: 1,
        logoKey: "revolut",
        label: "Revolut (Black)",
        zoneId: "Z06",
        side: "both",
        normalizedU: 0.42,
        normalizedV: 0.48,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "Black Revolut wordmark on titanium #AEB2B1 forward sidepod.",
      },
      {
        decalId: "audi-rings-cover",
        tier: 1,
        logoKey: "audi",
        label: "Audi Four Rings",
        zoneId: "Z07",
        side: "both",
        normalizedU: 0.24,
        normalizedV: 0.78,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "Four Rings on carbon #111315 upper engine cover.",
      },
      {
        decalId: "audi-revolut-rearwing",
        tier: 2,
        logoKey: "revolut",
        label: "Revolut (White Rear Wing)",
        zoneId: "Z09",
        side: "rear",
        normalizedU: 0.81,
        normalizedV: 0.49,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "Light Revolut wordmark across dark rear wing.",
      },
    ],
    chassisDiscrepancies: [
      "Satin metalness (0.38) and roughness (0.28) preserve titanium #AEB2B1 metallic character under neutral lighting without turning into mirror chrome.",
    ],
  },

  cadillac: {
    teamId: "cadillac",
    season: 2026,
    carModel: "MAC-26",
    defaultVariantId: "cadillac-spa-2026",
    availableVariants: [
      {
        id: "cadillac-spa-2026",
        label: {
          vi: "Belgian GP (Spa · Mặc định P6)",
          en: "Belgian GP (Spa · P6 Default)",
        },
        eventOrDate: "2026-07-17 Belgian GP (Spa)",
        asymmetricSplit: false,
        summary: {
          vi: "Trắng ấm #EDECE8 phía trên, đen #111315 phía dưới ở CẢ HAI bên thân xe; TWG AI tối trên ô trắng giữa hông, crest đơn sắc trên nắp máy.",
          en: "Warm white #EDECE8 upper body and black #111315 lower body on BOTH flanks; dark TWG AI on white mid-sidepod, monochrome crest on upper cover.",
        },
      },
      {
        id: "cadillac-debut-2026",
        label: {
          vi: "Debut Launch (Chia Trái Trắng / Phải Đen)",
          en: "Debut Launch (L/R Asymmetric Split)",
        },
        eventOrDate: "2026-02-08 Debut Launch",
        asymmetricSplit: true,
        summary: {
          vi: "Bản ra mắt tháng 2/2026: trái vật lý trắng ngọc #EDECE8/#BCC0BF, phải vật lý đen #111315, TWG trên sidepod và IFS ở endplate.",
          en: "February 2026 debut: physical left Pearl White #EDECE8/#BCC0BF, physical right Obsidian Black #111315, TWG on sidepods & IFS on endplate.",
        },
      },
    ],
    primarySourceUrl:
      "https://www.formula1.com/en/latest/article/why-cadillac-have-decided-to-switch-up-their-livery.2yJrSHrgmbFpUCW3lZiMYQ",
    secondarySourceUrl:
      "https://www.cadillacf1team.com/news/cadillac-formula-1-r-team-reveals-historic-first-livery",
    drivers: makeDrivers("Sergio Pérez", "11", "Valtteri Bottas", "77"),
    zones: makeStandardZones({
      z01: [
        "[P]",
        ["#111315", "#EDECE8"],
        "Spa default: white upper nose junction with dark #111315 outer front wing flaps.",
      ],
      z02: [
        "[P]",
        ["#EDECE8", "#111315"],
        "Warm white #EDECE8 nose cone from top view with Cadillac crest and driver number (#11 / #77).",
      ],
      z03: [
        "[P]",
        ["#EDECE8", "#111315"],
        "White upper chassis shoulders above black lower sidewall on both sides (Spa default).",
      ],
      z04: [
        "[P]",
        ["#111315", "#EDECE8"],
        "White cockpit shoulder surround with dark halo structure.",
      ],
      z05: [
        "[P]",
        ["#EDECE8", "#111315"],
        "White upper dorsal spine on both flanks behind airbox.",
      ],
      z06: [
        "[N]",
        ["#EDECE8", "#111315", "#BCC0BF"],
        "Spa default: white #EDECE8 upper sidepod and black #111315 lower undercut on BOTH flanks, with dark TWG AI on white field. (Debut variant keeps L/R white-black split).",
      ],
      z07: [
        "[P]",
        ["#EDECE8", "#111315"],
        "White upper engine cover on both flanks with monochrome Cadillac crest.",
      ],
      z08: ["[P]", ["#111315"], "Black #111315 lower skirt and floor edge."],
      z09: [
        "[P]",
        ["#111315", "#EDECE8"],
        "Dark #111315 rear wing mainplane and endplates.",
      ],
      z10: [
        "[P]",
        ["#111315", "#BCC0BF"],
        "Black aero wheel covers with monochrome Cadillac crest.",
      ],
      z11: [
        "[P]",
        ["#111315", "#EDECE8"],
        "FIA 2026 numbers #11 (Sergio Pérez) and #77 (Valtteri Bottas).",
      ],
    }),
    decals: [
      {
        decalId: "cadillac-twg-sidepod",
        tier: 1,
        logoKey: "twg",
        label: "TWG AI",
        zoneId: "Z06",
        side: "both",
        normalizedU: 0.34,
        normalizedV: 0.56,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "Dark TWG AI mark on white upper-mid sidepod in Spa default; switches to white inverse on right flank in Debut variant.",
      },
      {
        decalId: "cadillac-crest-cover",
        tier: 1,
        logoKey: "cadillac",
        label: "Cadillac Crest",
        zoneId: "Z07",
        side: "both",
        normalizedU: 0.24,
        normalizedV: 0.78,
        tag: "[P]",
        status: "study",
        rightsScope: "owner-authorized-dev",
        note: "Monochrome Cadillac crest on upper engine cover.",
      },
    ],
    chassisDiscrepancies: [
      "Both Spa default (bilateral white-top / black-bottom) and Debut (asymmetric white-left / black-right) variants route through the same variantId parameter across UV atlas generation and summary inspection.",
    ],
  },
};

export function getPrdTeamManifest(teamId: TeamId): PrdTeamLiveryManifest {
  return PRD_2026_LIVERY_MANIFEST[teamId] ?? PRD_2026_LIVERY_MANIFEST.mclaren;
}
