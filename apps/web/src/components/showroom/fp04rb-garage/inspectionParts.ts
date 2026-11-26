import type { WheelCorner } from "./fp04rbLoader";

export type GarageMode = "overview" | "inspection" | "maintenance";
export type BayFocus = "bay-1" | "bay-2";

export type CameraPresetId =
  | "pit-lane-overview"
  | "front"
  | "left-side"
  | "right-side"
  | "rear"
  | "top"
  | "technical-closeup"
  | "front-34-left"
  | "front-34-right"
  | "rear-34-left"
  | "rear-34-right";

export interface CameraPresetMeta {
  id: CameraPresetId;
  label: { vi: string; en: string };
}

export const GARAGE_CAMERA_PRESETS: readonly CameraPresetMeta[] = [
  {
    id: "pit-lane-overview",
    label: { vi: "Toàn cảnh Pit-lane", en: "Pit-Lane Overview" },
  },
  { id: "front", label: { vi: "Trước", en: "Front" } },
  { id: "left-side", label: { vi: "Trái (+X)", en: "Left Side" } },
  { id: "right-side", label: { vi: "Phải (-X)", en: "Right Side" } },
  { id: "rear", label: { vi: "Sau", en: "Rear" } },
  { id: "top", label: { vi: "Trên cao", en: "Top" } },
  {
    id: "technical-closeup",
    label: { vi: "Cận kỹ thuật", en: "Technical Close-up" },
  },
] as const;

export const PRD_34_CAMERA_PRESETS: readonly CameraPresetMeta[] = [
  {
    id: "front-34-left",
    label: { vi: "3/4 Trước Trái", en: "3/4 Front Left" },
  },
  {
    id: "front-34-right",
    label: { vi: "3/4 Trước Phải", en: "3/4 Front Right" },
  },
  { id: "rear-34-left", label: { vi: "3/4 Sau Trái", en: "3/4 Rear Left" } },
  { id: "rear-34-right", label: { vi: "3/4 Sau Phải", en: "3/4 Rear Right" } },
] as const;

export const PRD_9_PAINT_REVIEW_ANGLES: readonly CameraPresetId[] = [
  "left-side",
  "right-side",
  "top",
  "front",
  "rear",
  "front-34-left",
  "front-34-right",
  "rear-34-left",
  "rear-34-right",
] as const;

export interface InspectionPartSpec {
  id: string;
  supported: boolean;
  nodeName: string | null;
  label: { vi: string; en: string };
  summary: { vi: string; en: string };
  unsupportedReason?: { vi: string; en: string };
  /** Camera position relative to bay center (bayX, 0, CAR_Z_CENTER) */
  relativeCameraOffset?: [number, number, number];
  /** Look-at target relative to bay center */
  relativeTargetOffset?: [number, number, number];
  defaultCorner?: WheelCorner;
}

export const INSPECTION_PARTS: readonly InspectionPartSpec[] = [
  {
    id: "front-wing",
    supported: true,
    nodeName: "PART_FRONT_WING",
    label: { vi: "Cánh gió trước", en: "Front Wing" },
    summary: {
      vi: "Cụm cánh đa tầng tối ưu outwash và định hướng luồng khí xuống gầm Venturi.",
      en: "Multi-element cascade shaping front-tyre outwash and Venturi floor inflow.",
    },
    relativeCameraOffset: [1.35, 0.88, 3.65],
    relativeTargetOffset: [0, 0.2, 2.35],
  },
  {
    id: "rear-wing",
    supported: true,
    nodeName: "PART_REAR_WING",
    label: { vi: "Cánh gió sau & DRS", en: "Rear Wing & DRS" },
    summary: {
      vi: "Cụm cánh sau liền trục xoay DRS_FLAP_PIVOT kiểm soát lực ép đuôi xe.",
      en: "Rear wing assembly with articulated DRS_FLAP_PIVOT balancing downforce and drag.",
    },
    relativeCameraOffset: [-1.45, 1.35, -3.45],
    relativeTargetOffset: [0, 0.78, -2.05],
  },
  {
    id: "suspension",
    supported: true,
    nodeName: "PART_SUSPENSION",
    label: { vi: "Hệ thống treo", en: "Suspension" },
    summary: {
      vi: "Càng chữ A carbon, thanh đẩy/kéo và cụm dẫn hướng làm mát phanh trước.",
      en: "Carbon wishbones, pushrod/pullrod geometry and inboard brake cooling scoop.",
    },
    relativeCameraOffset: [1.75, 0.68, 2.25],
    relativeTargetOffset: [0.55, 0.36, 1.75],
  },
  {
    id: "tyres",
    supported: true,
    nodeName: "WHEEL_PIVOT_FL",
    label: { vi: "Lốp 18 inch & Phanh", en: "Tyres & Wheel Hub" },
    summary: {
      vi: "Bánh xe 18 inch tâm khóa nhanh; phanh và trục giữ cố định khi tháo bánh bảo dưỡng.",
      en: "18-inch center-lock wheel assembly exposing stationary carbon brake drum on extraction.",
    },
    relativeCameraOffset: [2.15, 0.96, 2.7],
    relativeTargetOffset: [0.85, 0.35, 1.75],
    defaultCorner: "FL",
  },
  {
    id: "cockpit",
    supported: true,
    nodeName: "PART_COCKPIT",
    label: { vi: "Buồng lái & Halo", en: "Cockpit & Halo" },
    summary: {
      vi: "Vô-lăng carbon OLED phát sáng kèm 15 đèn LED sang số, núm xoay vi sai, lẫy số carbon, dây đai 6 điểm đỏ FIA và khung Halo.",
      en: "Illuminated carbon F1 OLED steering wheel, 15 shift LEDs, rotary encoders, carbon paddles, FIA crimson 6-point harness and Halo.",
    },
    relativeCameraOffset: [0.02, 0.84, 0.2],
    relativeTargetOffset: [0, 0.62, 0.78],
  },
  {
    id: "floor-body",
    supported: true,
    nodeName: "PART_FLOOR",
    label: { vi: "Sàn hiệu ứng mặt đất & Thân vỏ", en: "Floor & Bodywork" },
    summary: {
      vi: "Sàn gầm Venturi toàn phần kết hợp sidepod rãnh trượt khí và vây cá mập trung tâm.",
      en: "Full Venturi underbody floor paired with undercut sidepods and central sharkfin cover.",
    },
    relativeCameraOffset: [2.65, 0.85, 0.9],
    relativeTargetOffset: [0.45, 0.38, -0.15],
  },
  // Truthfully declared unsupported sealed internal subsystems (no fake GLB nodes)
  {
    id: "ice-internals",
    supported: false,
    nodeName: null,
    label: { vi: "Khối động cơ 1.6L V6 (Nội bộ)", en: "1.6L V6 ICE Internals" },
    summary: {
      vi: "Cụm xi-lanh và tăng áp nằm bên trong khoang động cơ kín.",
      en: "Internal V6 combustion block & turbocharger enclosed beneath sealed engine cover.",
    },
    unsupportedReason: {
      vi: "Không có mesh tách rời trong GLB Showroom FP-04 RB (khung vỏ kín; không giả lập tọa độ).",
      en: "Not modeled as a separable mesh in Showroom FP-04 RB GLB (sealed bodywork; no fake focus).",
    },
  },
  {
    id: "ers-mgu-k",
    supported: false,
    nodeName: null,
    label: { vi: "Pin cao áp & MGU-K (Nội bộ)", en: "HV Energy Store & MGU-K" },
    summary: {
      vi: "Bộ lưu trữ năng lượng dưới sàn monocoque và máy phát điện động học.",
      en: "Under-floor high-voltage cell pack and kinetic motor-generator unit.",
    },
    unsupportedReason: {
      vi: "Không tồn tại trong manifest P1 của GLB Showroom; được đánh dấu unsupported.",
      en: "Absent from validated P1 Showroom GLB manifest; marked unsupported per spec.",
    },
  },
  {
    id: "gearbox-internals",
    supported: false,
    nodeName: null,
    label: { vi: "Hộp số 8 cấp (Nội bộ)", en: "8-Speed Gearbox Cassette" },
    summary: {
      vi: "Cụm bánh răng liền mạch bên trong vỏ truyền động sau.",
      en: "Seamless-shift gear cassette enclosed within rear impact carrier.",
    },
    unsupportedReason: {
      vi: "Vỏ truyền động là khối ngoài; chi tiết bánh răng nội bộ là unsupported.",
      en: "Rear carrier is an external shell; internal gear cluster is unsupported.",
    },
  },
  {
    id: "fuel-cell",
    supported: false,
    nodeName: null,
    label: {
      vi: "Bình nhiên liệu Kevlar (Nội bộ)",
      en: "Kevlar Safety Fuel Bladder",
    },
    summary: {
      vi: "Túi nhiên liệu an toàn đặt sau khoang lái.",
      en: "Crash-resistant fuel cell behind survival cell bulkhead.",
    },
    unsupportedReason: {
      vi: "Không tách lưới trong GLB Showroom FP-04 RB.",
      en: "Not separated in Showroom FP-04 RB GLB hierarchy.",
    },
  },
] as const;
