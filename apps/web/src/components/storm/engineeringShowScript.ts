import {
  getEngineeringStoryShot,
  type EngineeringStoryChapterId,
} from "../engineering/engineeringStoryTimeline";
import type { LocalizedText } from "../engineering/engineeringDisassemblyData";

export type EngineeringShowMood =
  "prologue" | "aero" | "cockpit" | "thermal" | "venturi" | "climax";

export type EngineeringStoryStage =
  "hidden" | "entering" | "visible" | "exiting";

export type EngineeringStorySide = "left" | "right";

export interface EngineeringShowScene {
  readonly id: string;
  readonly index: number;
  readonly indexLabel: string;
  readonly chapterId: EngineeringStoryChapterId;
  readonly mood: EngineeringShowMood;
  readonly storySide: EngineeringStorySide;
  readonly partId: string | null;
  readonly anchorProgress: number;
  readonly actLabel: LocalizedText;
  readonly title: LocalizedText;
  readonly subtitle: LocalizedText;
  readonly narrative: LocalizedText;
  readonly techCue: LocalizedText;
  readonly transitionHint: LocalizedText;
}

export interface EngineeringShowCameraArc {
  readonly fromProgress: number;
  readonly toProgress: number;
  readonly progress: number;
}

export interface EngineeringShowScrollState {
  readonly rawScroll: number;
  readonly timelineProgress: number;
  readonly sceneIndex: number;
  readonly scene: EngineeringShowScene;
  /** The scene whose text is currently rendered (keeps outgoing copy visible during exit). */
  readonly displayScene: EngineeringShowScene;
  readonly nextScene: EngineeringShowScene | null;
  readonly phase: "transition" | "resting";
  /** 0..1 progress within the current transition glide (1 when resting). */
  readonly transitionProgress: number;
  /** 0..1 progress through the resting dwell plateau ("khoảng nghỉ"). */
  readonly dwellProgress: number;
  readonly isResting: boolean;
  readonly isFinale: boolean;
  /** Choreographed typography stage synchronized with camera motion. */
  readonly storyStage: EngineeringStoryStage;
  /** Direct scene-to-scene camera arc during glides to prevent intermediate 47-part anchor whips. */
  readonly cameraArc: EngineeringShowCameraArc | null;
}

/**
 * Calm, museum-grade scroll pacing per scene in svh:
 * 12 scenes × 150svh = 1800svh total runway.
 * - 46% (~69svh): unhurried camera & mechanical glide (previous text exits smoothly,
 *   stage clears mid-flight, incoming text reveals as the camera settles).
 * - 54% (~81svh): generous resting dwell plateau ("khoảng nghỉ") where the 3D part
 *   locks rock-steady while the staggered story title & narrative are read.
 */
export const SHOW_SCENE_SCROLL_VH = 150;
export const SHOW_TRANSITION_RATIO = 0.46;
export const SHOW_AUTOPLAY_TRANSITION_SEC = 2.3;
export const SHOW_AUTOPLAY_DWELL_SEC = 4.3;

/**
 * Smooth, velocity-capped timeline damping for the 12-scene Engineering Show.
 * Prevents abrupt camera/part whips when users flick a mouse wheel or jump across scenes.
 */
export function stepShowTimelineProgress(
  current: number,
  target: number,
  deltaMs: number,
  immediate = false,
): number {
  const clampedTarget = Math.max(0, Math.min(1, Number.isFinite(target) ? target : 0));
  const clampedCurrent = Math.max(0, Math.min(1, Number.isFinite(current) ? current : 0));
  if (immediate) return clampedTarget;
  const diff = clampedTarget - clampedCurrent;
  if (Math.abs(diff) < 0.00012) return clampedTarget;
  const dtSec = Math.min(0.064, Math.max(0.001, (Number.isFinite(deltaMs) ? deltaMs : 16) / 1000));
  const alpha = 1 - Math.exp(-4.8 * dtSec);
  const rawStep = diff * alpha;
  const maxStep = 0.24 * dtSec;
  const cappedStep = Math.sign(rawStep) * Math.min(Math.abs(rawStep), maxStep);
  const next = clampedCurrent + cappedStep;
  return Math.abs(clampedTarget - next) < 0.00012 ? clampedTarget : next;
}

function shotHoldProgress(partId: string, fallback: number): number {
  return getEngineeringStoryShot(partId)?.holdProgress ?? fallback;
}

function smootherstep(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
}

export const ENGINEERING_SHOW_SCENES: readonly EngineeringShowScene[] = [
  {
    id: "prologue",
    index: 0,
    indexLabel: "01",
    chapterId: "origin",
    mood: "prologue",
    storySide: "left",
    partId: null,
    anchorProgress: 0,
    actLabel: {
      en: "PROLOGUE · ASSEMBLED DATUM",
      vi: "MỞ MÀN · NGUYÊN BẢN TĨNH LẶNG",
    },
    title: {
      en: "Sculpted by air, waiting to open",
      vi: "Điêu khắc từ gió, sẵn sàng hé mở",
    },
    subtitle: {
      en: "FP-04 RB Ground-Effect Architecture · 47 Mechanical Assemblies",
      vi: "Kiến trúc Hiệu ứng Mặt đất FP-04 RB · 47 Cụm Cơ Khí",
    },
    narrative: {
      en: "Before a single carbon panel moves, look at the car as one unbroken arrow. Scroll gently: the camera glides into each component and pauses just long enough to tell its story.",
      vi: "Trước khi mảnh carbon đầu tiên dịch chuyển, hãy ngắm cỗ máy ở trạng thái nguyên khối hoàn chỉnh. Cuộn nhẹ xuống, ống kính sẽ lướt tới từng linh kiện và dừng nhịp vừa đủ để kể câu chuyện của nó.",
    },
    techCue: {
      en: "DATUM 0.0 mm · 47 ASSEMBLIES LOCKED",
      vi: "CHUẨN 0,0 mm · 47 CỤM KHÓA KHÍT",
    },
    transitionHint: {
      en: "Scroll down · Act I: Front Wing",
      vi: "Cuộn xuống · Hồi I: Cánh Gió Trước",
    },
  },
  {
    id: "front-wing",
    index: 1,
    indexLabel: "02",
    chapterId: "aero",
    mood: "aero",
    storySide: "right",
    partId: "FRONT_WING_ASSEMBLY",
    anchorProgress: shotHoldProgress("FRONT_WING_ASSEMBLY", 0.055),
    actLabel: {
      en: "ACT I · FIRST CONTACT WITH AIR",
      vi: "HỒI I · NHÁT CẮT ĐẦU TIÊN",
    },
    title: {
      en: "Multi-Element Front Wing",
      vi: "Cánh Gió Trước Đa Tầng",
    },
    subtitle: {
      en: "Front Assembly · Four-Plane Carbon Aerofoil",
      vi: "Đầu xe · Bốn tầng cánh carbon tạo áp suất",
    },
    narrative: {
      en: "Our story begins at the leading edge. At 300 km/h, untouched air hits these four stacked carbon planes first, pushing dirty wake around the front tyres while feeding clean air toward the underfloor.",
      vi: "Câu chuyện bắt đầu ngay mũi chạm gió đầu tiên. Ở 300 km/h, bốn tầng cánh carbon này xẻ đôi dòng khí: đẩy luồng nhiễu động vòng qua bánh trước và dẫn khí sạch giàu năng lượng chui thẳng xuống gầm xe.",
    },
    techCue: {
      en: "OUTWASH SHAPING · ~25% FRONT DOWNFORCE",
      vi: "ĐIỀU HƯỚNG XOÁY · ~25% LỰC ÉP ĐẦU XE",
    },
    transitionHint: {
      en: "Next · Impact Nosecone & Pitot",
      vi: "Tiếp theo · Mũi Carbon & Cảm Biến Pitot",
    },
  },
  {
    id: "nosecone",
    index: 2,
    indexLabel: "03",
    chapterId: "aero",
    mood: "aero",
    storySide: "left",
    partId: "NOSECONE_SHELL",
    anchorProgress: shotHoldProgress("NOSECONE_SHELL", 0.075),
    actLabel: {
      en: "ACT I · IMPACT SPEAR",
      vi: "HỒI I · MŨI GIÁO HẤP THỤ LỰC",
    },
    title: {
      en: "Carbon Nosecone & Pitot Array",
      vi: "Mũi Carbon & Cụm Ống Đo Áp Pitot",
    },
    subtitle: {
      en: "Front Crash Structure · Structural & Aero Conduit",
      vi: "Cụm mũi xe · Cấu trúc hấp thụ va chạm chuẩn FIA",
    },
    narrative: {
      en: "Follow the airflow backward past the wing. This slender carbon cone crushes progressively to absorb frontal impact energy, yet stays razor-thin so air rushes uninterrupted to the floor inlets.",
      vi: "Theo dòng khí lùi về sau cánh trước. Chiếc mũi carbon thon gọn này vừa hấp thụ xung lực va chạm cực đại theo chuẩn FIA, vừa mảnh mai để không cản luồng khí đổ thẳng vào cửa hút gầm.",
    },
    techCue: {
      en: "FIA CRASH CONE · LIVE AIRSPEED PITOT",
      vi: "CẤU TRÚC VA CHẠM FIA · ĐO ÁP SUẤT GIÓ",
    },
    transitionHint: {
      en: "Next · Rear Wing & DRS Valve",
      vi: "Tiếp theo · Cánh Gió Sau & Cơ Cấu DRS",
    },
  },
  {
    id: "rear-drs",
    index: 3,
    indexLabel: "04",
    chapterId: "aero",
    mood: "aero",
    storySide: "right",
    partId: "REAR_DRS_FLAP_ACTUATOR",
    anchorProgress: shotHoldProgress("REAR_DRS_FLAP_ACTUATOR", 0.16),
    actLabel: {
      en: "ACT I · STRAIGHT-LINE RELEASE",
      vi: "HỒI I · GIẢI PHÓNG TỐC ĐỘ THẲNG",
    },
    title: {
      en: "Rear Wing & Hydraulic DRS Flap",
      vi: "Cánh Gió Sau & Van Tốc Độ DRS",
    },
    subtitle: {
      en: "Rear Aero · Switchable Drag Reduction System",
      vi: "Đuôi xe · Cơ cấu thủy lực mở góc cánh 85mm",
    },
    narrative: {
      en: "High downforce comes with drag. On long straights, one thumb press fires this hydraulic actuator, pivoting the upper flap open 85 mm to spill air resistance and unlock an overtaking surge.",
      vi: "Lực ép lớn luôn đi kèm lực cản. Trên đoạn thẳng, một nút bấm kích hoạt cơ cấu thủy lực mở lá cánh trên 85 mm, xả lực cản tức thì để bứt tốc hơn 15 km/h vượt đối thủ.",
    },
    techCue: {
      en: "85 mm SLOT GAP · +12–18 KM/H DELTA",
      vi: "KHE MỞ 85 mm · TĂNG 12–18 KM/H KHI VƯỢT",
    },
    transitionHint: {
      en: "Next · Act II: Titanium Halo",
      vi: "Tiếp theo · Hồi II: Khung Halo Titanium",
    },
  },
  {
    id: "cockpit-halo",
    index: 4,
    indexLabel: "05",
    chapterId: "cockpit",
    mood: "cockpit",
    storySide: "right",
    partId: "COCKPIT_HALO",
    anchorProgress: shotHoldProgress("COCKPIT_HALO", 0.21),
    actLabel: {
      en: "ACT II · TITANIUM SANCTUARY",
      vi: "HỒI II · VÒNG CHẮN TITANIUM",
    },
    title: {
      en: "Grade-5 Titanium Halo",
      vi: "Khung Bảo Vệ Halo Titanium Cấp 5",
    },
    subtitle: {
      en: "Driver Cockpit · 7 kg Structure Rated to 125 kN",
      vi: "Buồng lái · Nặng 7 kg, chịu tải tương đương 2 xe buýt",
    },
    narrative: {
      en: "Now we step inside where human courage meets material science. The Halo hoists upward like a theatre curtain: just seven kilograms of Grade-5 titanium built to bear 125 kN of vertical load.",
      vi: "Bây giờ chúng ta bước vào không gian sinh tồn của tay đua. Khung Halo nâng thẳng lên như vén tấm màn sân khấu: chỉ 7 kg titan cấp 5 nhưng đủ sức chịu tải dọc 125 kN để bảo vệ tính mạng.",
    },
    techCue: {
      en: "GRADE-5 TITANIUM · 125 kN VERTICAL LOAD",
      vi: "TITANIUM CẤP 5 · CHỊU TẢI DỌC 125 kN",
    },
    transitionHint: {
      en: "Next · F1 OLED Steering Wheel",
      vi: "Tiếp theo · Vô-Lăng OLED & Buồng Lái",
    },
  },
  {
    id: "cockpit-wheel",
    index: 5,
    indexLabel: "06",
    chapterId: "cockpit",
    mood: "cockpit",
    storySide: "right",
    partId: "STEERING_WHEEL_LCD",
    anchorProgress: shotHoldProgress("STEERING_WHEEL_LCD", 0.27),
    actLabel: {
      en: "ACT II · COMMAND AT 320 KM/H",
      vi: "HỒI II · TRUNG TÂM CHỈ HUY Ở 320 KM/H",
    },
    title: {
      en: "F1 OLED Steering Wheel & Telemetry",
      vi: "Vô-Lăng OLED & Bảng Điều Khiển F1",
    },
    subtitle: {
      en: "Driver Eye-Level · 15 Shift LEDs & Rotary Differentials",
      vi: "Tầm mắt tay đua · 15 đèn sang số & núm xoay vi sai",
    },
    narrative: {
      en: "With the Halo lifted clear, take the driver's seat. Brake-migration dials, differential maps, ERS deploy modes, and carbon paddles sit between your thumbs: test them live in the tray on the left.",
      vi: "Khi khung Halo đã mở lối, hãy ngồi vào vị trí tay đua. Toàn bộ bộ não chỉnh phanh, khóa vi sai, xả pin ERS và lẫy số carbon nằm gọn trong hai ngón cái: bạn có thể bấm thử ngay trên khay bên trái.",
    },
    techCue: {
      en: "INTERACTIVE COCKPIT · TRY GEAR / DRS / ERS",
      vi: "BUỒNG LÁI TƯƠNG TÁC · THỬ SANG SỐ / DRS / ERS",
    },
    transitionHint: {
      en: "Next · Act III: Wheels & Carbon Brakes",
      vi: 'Tiếp theo · Hồi III: Mâm 18" & Phanh Carbon',
    },
  },
  {
    id: "wheel-corner",
    index: 6,
    indexLabel: "07",
    chapterId: "corners",
    mood: "thermal",
    storySide: "left",
    partId: "FL_BRAKE_SUSPENSION",
    anchorProgress: shotHoldProgress("FL_BRAKE_SUSPENSION", 0.415),
    actLabel: {
      en: "ACT III · FOUR PALMS OF GRIP",
      vi: "HỒI III · BỐN ĐIỂM CHẠM MẶT ĐƯỜNG",
    },
    title: {
      en: '18" Slicks, Forged Rims & Carbon Brakes',
      vi: 'Lốp Slick 18", Mâm Rèn & Đĩa Phanh Carbon',
    },
    subtitle: {
      en: "Wheel Corners · 720° Centerlock Separation",
      vi: "Bốn góc bánh · Đai ốc tâm xoay 720° bóc tách cụm phanh",
    },
    narrative: {
      en: "Centerlock nuts spin 720° outward, peeling back aero covers, 18-inch slicks, and forged rims. Beneath them sit carbon-carbon brake discs capable of 5.5 G stops above 1,000 °C.",
      vi: "Đai ốc khóa tâm xoay 720° kéo rời ốp khí động, lốp trơn 18 inch và mâm rèn. Ẩn bên trong là cụm đĩa phanh carbon chịu lực hãm 5,5 G, đỏ rực vượt 1.000 °C ở mỗi góc cua gắt.",
    },
    techCue: {
      en: "5.5 G DECELERATION · >1,000 °C CARBON DISCS",
      vi: "LỰC HÃM 5,5 G · ĐĨA PHANH CARBON >1.000 °C",
    },
    transitionHint: {
      en: "Next · Act IV: Sidepods & Cooling",
      vi: "Tiếp theo · Hồi IV: Sidepod & Két Tản Nhiệt",
    },
  },
  {
    id: "sidepods",
    index: 7,
    indexLabel: "08",
    chapterId: "bodywork",
    mood: "thermal",
    storySide: "right",
    partId: "SIDEPOD_SHELL_LEFT",
    anchorProgress: shotHoldProgress("SIDEPOD_SHELL_LEFT", 0.565),
    actLabel: {
      en: "ACT IV · SCULPTED BREATHING",
      vi: "HỒI IV · LÀN DA KHÍ ĐỘNG & TẢN NHIỆT",
    },
    title: {
      en: "Undercut Sidepods & Inclined Radiators",
      vi: "Vỏ Hốc Gió Sidepod & Két Nước Nghiêng",
    },
    subtitle: {
      en: "Bodywork & Thermal Packaging · Tight Undercut Waist",
      vi: "Thân vỏ · Cân bằng giữa làm mát và thu hẹp hông xe",
    },
    narrative: {
      en: "Composite sidepods peel laterally like armor plates to expose tilted heat exchangers. Every millimeter shaved here carves a deeper undercut channel guiding fast air onto the rear diffuser.",
      vi: "Hai lớp vỏ sidepod tách ngang như bộ giáp để lộ cặp két tản nhiệt đặt nghiêng cực gắt. Từng milimét được ép gọn mở ra rãnh undercut sâu, tăng tốc luồng khí quét thẳng về bộ khuếch tán sau.",
    },
    techCue: {
      en: "UNDERCUT CHANNEL · INCLINED RADIATOR CORES",
      vi: "RÃNH UNDERCUT · KÉT GIẢI NHIỆT ĐẶT NGHIÊNG",
    },
    transitionHint: {
      en: "Next · Act V: Venturi Underfloor",
      vi: "Tiếp theo · Hồi V: Bí Mật Sàn Venturi",
    },
  },
  {
    id: "venturi-floor",
    index: 8,
    indexLabel: "09",
    chapterId: "core",
    mood: "venturi",
    storySide: "left",
    partId: "VENTURI_FLOOR_TITANIUM",
    anchorProgress: shotHoldProgress("VENTURI_FLOOR_TITANIUM", 0.625),
    actLabel: {
      en: "ACT V · THE EFFET DE SOL SECRET",
      vi: "HỒI V · BÍ MẬT EFFET DE SOL",
    },
    title: {
      en: "Venturi Underfloor & Titanium Skid Plank",
      vi: "Sàn Đường Hầm Venturi & Tấm Trượt Titan",
    },
    subtitle: {
      en: "Underfloor Core · Ground-Effect Suction Engine",
      vi: "Gầm xe · Nguồn sinh lực ép lớn nhất toàn xe",
    },
    narrative: {
      en: "This is why our project carries the name Effet de Sol. The floor drops away to reveal twin Venturi tunnels that accelerate air beneath the chassis, pulling the car down onto the asphalt.",
      vi: "Đây là lý do cái tên Effet de Sol ra đời. Sàn gầm hạ thấp để lộ hai đường hầm Venturi tăng tốc luồng khí bên dưới khung xe, tạo vùng áp suất thấp hút chặt chiếc xe xuống mặt đường.",
    },
    techCue: {
      en: "VENTURI SUCTION · ~55% TOTAL DOWNFORCE",
      vi: "LỰC HÚT VENTURI · ~55% TỔNG LỰC ÉP KHÍ ĐỘNG",
    },
    transitionHint: {
      en: "Next · 1.6L V6 Turbo Hybrid Core",
      vi: "Tiếp theo · Trái Tim Hybrid 1.6L V6 Turbo",
    },
  },
  {
    id: "powertrain",
    index: 9,
    indexLabel: "10",
    chapterId: "core",
    mood: "venturi",
    storySide: "right",
    partId: "POWERTRAIN_V6_HYBRID",
    anchorProgress: shotHoldProgress("POWERTRAIN_V6_HYBRID", 0.68),
    actLabel: {
      en: "ACT V · THE HYBRID HEART",
      vi: "HỒI V · TRÁI TIM HYBRID 1.6L V6",
    },
    title: {
      en: "1.6L V6 Turbo Hybrid & Stressed Gearbox",
      vi: "Động Cơ V6 Turbo Hybrid & Hộp Số Chịu Lực",
    },
    subtitle: {
      en: "Powertrain Spine · >50% Thermal Efficiency",
      vi: "Lõi động lực · Hiệu suất nhiệt vượt 50% gắn liền khung",
    },
    narrative: {
      en: "Deep behind the driver's spine lives the most thermally efficient hybrid power unit ever raced, bolted directly between the carbon survival cell and 8-speed gearbox as the car's skeleton.",
      vi: "Ẩn ngay sau lưng tay đua là cỗ máy hybrid có hiệu suất nhiệt vượt 50%. Khối động cơ V6 và hộp số 8 cấp được bắt trực tiếp vào khoang sinh tồn carbon như xương sống chịu lực của xe.",
    },
    techCue: {
      en: "1.6L V6 + ERS HYBRID · STRESSED CHASSIS MEMBER",
      vi: "V6 1.6L + ERS HYBRID · XƯƠNG SỐNG CHỊU LỰC",
    },
    transitionHint: {
      en: "Next · Climax: 47-Assembly Symphony",
      vi: "Tiếp theo · Cao Trào: Toàn Cảnh 47 Cụm",
    },
  },
  {
    id: "matrix-climax",
    index: 10,
    indexLabel: "11",
    chapterId: "matrix",
    mood: "climax",
    storySide: "left",
    partId: "MONOCOQUE_CHASSIS",
    anchorProgress: shotHoldProgress("MONOCOQUE_CHASSIS", 0.8),
    actLabel: {
      en: "CLIMAX · 47-ASSEMBLY SYMPHONY",
      vi: "CAO TRÀO · BẢN GIAO HƯỞNG 47 CỤM",
    },
    title: {
      en: "Monocoque Survival Cell & Exploded Matrix",
      vi: "Khoang Monocoque & Toàn Cảnh 47 Cụm Lơ Lửng",
    },
    subtitle: {
      en: "Peak Disassembly · Free 360° Orbit Unlocked",
      vi: "Cực đại bóc tách · Mở khóa xoay tự do 360° Orbit",
    },
    narrative: {
      en: "Forty-six subsystems float in spatial equilibrium around the central carbon monocoque. Tap 360° Orbit below to fly freely around the sculpture or click any assembly to isolate it.",
      vi: "Toàn bộ 46 cụm cơ khí lơ lửng cân bằng quanh khoang sinh tồn Monocoque carbon. Hãy bấm Xoay 360° bên dưới để bay tự do quanh tác phẩm hoặc bấm vào bất kỳ chi tiết nào để soi riêng.",
    },
    techCue: {
      en: "PEAK MATRIX · 360° ORBIT & ISOLATION READY",
      vi: "TOÀN CẢNH CỰC ĐẠI · SẴN SÀNG XOAY 360°",
    },
    transitionHint: {
      en: "Next · Finale: Precision Re-Lock",
      vi: "Tiếp theo · Hạ Màn: Tái Lắp Ráp 0,0 mm",
    },
  },
  {
    id: "finale-lock",
    index: 11,
    indexLabel: "12",
    chapterId: "reassembly",
    mood: "climax",
    storySide: "right",
    partId: null,
    anchorProgress: 1,
    actLabel: {
      en: "FINALE · PRECISION RE-LOCK",
      vi: "HẠ MÀN · HỢP NHẤT NGUYÊN KHỐI",
    },
    title: {
      en: "47 parts return to one racing machine",
      vi: "47 mảnh ghép hội tụ thành một cỗ máy đua",
    },
    subtitle: {
      en: "100% Datum Lock · End of the Engineering Show",
      vi: "Khóa chuẩn 100% · Kết thúc màn trình diễn Kỹ thuật",
    },
    narrative: {
      en: "Core, cockpit, bodywork, wings, and centerlock nuts glide home in reverse sequence and seal to 0.0 mm tolerance. Replay the show anytime, or step into the Pit Garage Showroom.",
      vi: "Lõi máy, buồng lái, thân vỏ, cánh gió và bốn đai ốc tâm trượt ngược về khớp kín chuẩn 0,0 mm. Bạn có thể xem lại màn trình diễn bất cứ lúc nào hoặc bước sang Garage Showroom.",
    },
    techCue: {
      en: "100% LOCKED · CURTAIN CALL",
      vi: "KHÓA CHUẨN 100% · KHÉP LẠI MÀN TRÌNH DIỄN",
    },
    transitionHint: {
      en: "Show complete · Replay or visit Showroom",
      vi: "Kết thúc Show · Xem lại hoặc sang Showroom",
    },
  },
];

export const ENGINEERING_SHOW_TOTAL_VH =
  ENGINEERING_SHOW_SCENES.length * SHOW_SCENE_SCROLL_VH;

/**
 * Returns a raw scroll ratio (0..1) that lands calmly inside scene `sceneIndex`'s
 * resting dwell plateau ("khoảng nghỉ").
 */
export function getShowScrollForScene(sceneIndex: number): number {
  const total = ENGINEERING_SHOW_SCENES.length;
  const clampedIdx = Math.max(0, Math.min(total - 1, Math.round(sceneIndex)));
  if (clampedIdx === 0) return 0;
  const segSize = 1 / total;
  // Land at 58% of the scene segment — cleanly past the 48% glide, with a crisp
  // resting beat ahead before the next scene starts gliding.
  return Math.min(1, (clampedIdx + 0.58) * segSize);
}

/**
 * Maps raw page scroll ratio `rawScroll ∈ [0, 1]` through a snappy piecewise
 * glide + dwell-plateau curve with synchronized typography reveal/exit states:
 * - During glide (localT < 0.48): camera moves smoothly while text stays veiled
 *   ("hidden"), keeping the 3D choreography unobstructed.
 * - As camera arrives (localT ∈ [0.48, 0.56]): text triggers staggered unmask
 *   reveal ("entering" -> "visible").
 * - Across the dwell plateau (localT ∈ [0.48, 1.0]): timelineProgress locks
 *   strictly at `anchorProgress`, with a gentle exit handoff on the final 12%.
 */
export function evaluateEngineeringShowScroll(
  rawScrollInput: number,
): EngineeringShowScrollState {
  const total = ENGINEERING_SHOW_SCENES.length;
  const rawScroll = Number.isFinite(rawScrollInput)
    ? Math.max(0, Math.min(1, rawScrollInput))
    : 0;
  const scaled = rawScroll * total;
  const sceneIndex = Math.min(total - 1, Math.floor(scaled));
  const localT =
    sceneIndex === total - 1 && rawScroll >= 1
      ? 1
      : Math.max(0, Math.min(1, scaled - sceneIndex));

  const scene = ENGINEERING_SHOW_SCENES[sceneIndex];
  const nextScene = ENGINEERING_SHOW_SCENES[sceneIndex + 1] ?? null;
  const isFinale = sceneIndex === total - 1;

  // Scene 0 (Prologue) opens immediately visible and gently fades out near its end
  if (sceneIndex === 0) {
    const storyStage: EngineeringStoryStage =
      localT > 0.88 ? "exiting" : "visible";
    return {
      rawScroll,
      timelineProgress: scene.anchorProgress,
      sceneIndex,
      scene,
      displayScene: scene,
      nextScene,
      phase: "resting",
      transitionProgress: 1,
      dwellProgress: localT,
      isResting: true,
      isFinale: false,
      storyStage,
      cameraArc: null,
    };
  }

  const prevScene = ENGINEERING_SHOW_SCENES[sceneIndex - 1];
  const prevAnchor = prevScene.anchorProgress;
  const targetAnchor = scene.anchorProgress;

  if (localT < SHOW_TRANSITION_RATIO) {
    const glideT = localT / SHOW_TRANSITION_RATIO;
    const eased = smootherstep(glideT);
    const timelineProgress = prevAnchor + (targetAnchor - prevAnchor) * eased;
    // Outgoing text glides cleanly out in the first 18% of the transition,
    // stays veiled mid-flight so the 3D camera swoop shines unobstructed,
    // then reveals the incoming scene in staggered editorial layers on arrival.
    const storyStage: EngineeringStoryStage =
      glideT < 0.18 ? "exiting" : glideT >= 0.82 ? "entering" : "hidden";
    const displayScene = glideT < 0.18 ? prevScene : scene;
    return {
      rawScroll,
      timelineProgress,
      sceneIndex,
      scene,
      displayScene,
      nextScene,
      phase: "transition",
      transitionProgress: glideT,
      dwellProgress: 0,
      isResting: false,
      isFinale,
      storyStage,
      cameraArc: {
        fromProgress: prevAnchor,
        toProgress: targetAnchor,
        progress: glideT,
      },
    };
  }

  const dwellProgress =
    (localT - SHOW_TRANSITION_RATIO) / (1 - SHOW_TRANSITION_RATIO);
  const clampedDwell = Math.max(0, Math.min(1, dwellProgress));
  const storyStage: EngineeringStoryStage =
    !isFinale && clampedDwell > 0.90 ? "exiting" : "visible";

  return {
    rawScroll,
    timelineProgress: targetAnchor,
    sceneIndex,
    scene,
    displayScene: scene,
    nextScene,
    phase: "resting",
    transitionProgress: 1,
    dwellProgress: clampedDwell,
    isResting: true,
    isFinale,
    storyStage,
    cameraArc: null,
  };
}
