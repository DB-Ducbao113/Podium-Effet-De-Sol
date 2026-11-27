import type { LocalizedText } from "../engineering/engineeringDisassemblyData";
import type { LabModeId } from "./engineeringLabRoutes";

export interface EngineeringChapterCardSpec {
  readonly indexLabel: string;
  readonly overline: LocalizedText;
  readonly title: LocalizedText;
  readonly articleSlug: string;
  readonly labMode: LabModeId;
  readonly figCode: string;
  readonly summary: LocalizedText;
  readonly effectsTags: readonly LocalizedText[];
}

export interface EngineeringPhilosophyPillar {
  readonly code: string;
  readonly title: LocalizedText;
  readonly body: LocalizedText;
}

export const ENGINEERING_PHILOSOPHY_PILLARS: readonly EngineeringPhilosophyPillar[] =
  [
    {
      code: "FIG. 00A — FLOW ARCHITECTURE",
      title: {
        en: "Sculpted by Pressure Fields",
        vi: "Định hình bởi trường áp suất",
      },
      body: {
        en: "Every millimetre of carbon bodywork exists to guide momentum, seal low-pressure Venturi channels, and recover wake energy cleanly.",
        vi: "Từng milimét bề mặt sợi carbon được tính toán để dẫn hướng động lượng, giữ kín vùng áp thấp dưới sàn và phục hồi áp suất ở đuôi xe.",
      },
    },
    {
      code: "FIG. 00B — CLOSED-LOOP ENERGY",
      title: {
        en: "Thermal & Electrical Precision",
        vi: "Chính xác nhiệt – điện khép kín",
      },
      body: {
        en: "Combustion work, kinetic harvesting, and multi-phase electric deployment operate as one tightly coupled lap-wide energy budget.",
        vi: "Công cơ học từ động cơ đốt trong, thu hồi động năng khi phanh và triển khai mô-men điện vận hành như một bài toán năng lượng khép kín.",
      },
    },
    {
      code: "FIG. 00C — MECHANICAL PLATFORM",
      title: {
        en: "Platform Control at 300+ km/h",
        vi: "Kiểm soát bệ phóng ở 300+ km/h",
      },
      body: {
        en: "Suspension kinematics connect four contact patches to the aerodynamic floor, translating vertical load into predictable cornering confidence.",
        vi: "Động học hệ treo kết nối bốn vùng tiếp xúc lốp với sàn khí động, chuyển hóa tải thẳng đứng thành độ bám ổn định và nhất quán.",
      },
    },
  ];

export const ENGINEERING_DISCIPLINE_CHAPTERS: readonly EngineeringChapterCardSpec[] =
  [
    {
      indexLabel: "01",
      overline: {
        en: "01 / AERODYNAMICS",
        vi: "01 / KHÍ ĐỘNG HỌC",
      },
      title: {
        en: "Ground Effect",
        vi: "Hiệu ứng mặt đất",
      },
      articleSlug: "ground-effect-aerodynamics",
      labMode: "ground-effect",
      figCode: "FIG. 01",
      summary: {
        en: "Visualize underfloor airflow acceleration, low-pressure throat suction, edge sealing, and diffuser recovery.",
        vi: "Trực quan hóa luồng khí bên dưới sàn xe, vùng áp suất thấp tại họng Venturi và bộ khuếch tán đuôi xe.",
      },
      effectsTags: [
        { en: "Airflow particles", vi: "Hạt luồng khí" },
        { en: "Pressure map", vi: "Bản đồ áp suất" },
        { en: "Ground clearance", vi: "Khoảng sáng gầm" },
      ],
    },
    {
      indexLabel: "02",
      overline: {
        en: "02 / ACTIVE SYSTEMS",
        vi: "02 / HỆ THỐNG CHỦ ĐỘNG",
      },
      title: {
        en: "Active Aerodynamics",
        vi: "Khí động học chủ động",
      },
      articleSlug: "active-aerodynamics-wing-mechanics",
      labMode: "active-aero",
      figCode: "FIG. 02",
      summary: {
        en: "Examine moving wing elements, precision pivots, hydraulic actuation paths, and fail-safe interlock logic.",
        vi: "Tập trung vào cơ cấu cánh chuyển động, bản lề chịu tải, bộ chấp hành và nguyên lý an toàn fail-safe.",
      },
      effectsTags: [
        { en: "Flap rotation", vi: "Xoay góc cánh" },
        { en: "Exploded view", vi: "Bóc tách cụm" },
        { en: "Mechanical transitions", vi: "Chuyển tiếp cơ khí" },
      ],
    },
    {
      indexLabel: "03",
      overline: {
        en: "03 / ENERGY SYSTEMS",
        vi: "03 / HỆ THỐNG NĂNG LƯỢNG",
      },
      title: {
        en: "Hybrid Powertrain",
        vi: "Hệ truyền động Hybrid",
      },
      articleSlug: "hybrid-powertrains-energy-management",
      labMode: "hybrid-powertrain",
      figCode: "FIG. 03",
      summary: {
        en: "Trace real-time power transfer across the internal combustion unit, Energy Store battery, MGU-K, and rear axle.",
        vi: "Khám phá đường truyền năng lượng giữa động cơ đốt trong, khối pin lưu trữ, mô-tơ điện và bánh dẫn động.",
      },
      effectsTags: [
        { en: "Energy flow", vi: "Dòng năng lượng" },
        { en: "Regenerative braking", vi: "Phanh tái sinh" },
        { en: "Power distribution", vi: "Phân bổ công suất" },
      ],
    },
    {
      indexLabel: "04",
      overline: {
        en: "04 / CHASSIS ENGINEERING",
        vi: "04 / KỸ THUẬT KHUNG GẦM",
      },
      title: {
        en: "Vehicle Dynamics",
        vi: "Động lực học khung gầm",
      },
      articleSlug: "vehicle-dynamics-suspension",
      labMode: "vehicle-dynamics",
      figCode: "FIG. 04",
      summary: {
        en: "Investigate how carbon wishbones, dampers, and tyre contact patches manage load transfer through every corner phase.",
        vi: "Khám phá sự tương tác chặt chẽ giữa hệ thống treo, bốn vùng tiếp xúc lốp và khung monocoque khi chịu tải.",
      },
      effectsTags: [
        { en: "Suspension travel", vi: "Hành trình hệ treo" },
        { en: "Weight transfer", vi: "Chuyển dịch tải trọng" },
        { en: "Cornering forces", vi: "Hợp lực vào cua" },
      ],
    },
  ];

export const HERO_CAMERA_STAGE_LABELS: readonly LocalizedText[] = [
  {
    en: "01 / 04 — SILHOUETTE DATUM",
    vi: "01 / 04 — TỔNG THỂ KHÍ ĐỘNG",
  },
  {
    en: "02 / 04 — VENTURI UNDERFLOOR",
    vi: "02 / 04 — SÀN HÚT VENTURI",
  },
  {
    en: "03 / 04 — ACTIVE AERO WINGS",
    vi: "03 / 04 — CƠ CẤU CÁNH CHỦ ĐỘNG",
  },
  {
    en: "04 / 04 — HYBRID POWERTRAIN",
    vi: "04 / 04 — HỆ TRUYỀN ĐỘNG HYBRID",
  },
];

export const LAB_CONCEPT_DISCLAIMER: LocalizedText = {
  vi: "Demo minh họa giao diện tương tác, không phải dữ liệu CFD hay kết quả mô phỏng vật lý đã kiểm chứng.",
  en: "Interactive concept demonstration illustrating engineering principles — not verified CFD output or physical test telemetry.",
};
