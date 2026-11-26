import {
  getEngineeringStoryShot,
  type EngineeringStoryChapterId,
} from "../engineering/engineeringStoryTimeline";
import type { LocalizedText } from "../engineering/engineeringDisassemblyData";

export type EngineeringShowMood =
  "prologue" | "aero" | "cockpit" | "thermal" | "venturi" | "climax";

export type EngineeringStoryStage =
  "hidden" | "entering" | "visible" | "exiting";

export interface EngineeringShowScene {
  readonly id: string;
  readonly index: number;
  readonly indexLabel: string;
  readonly chapterId: EngineeringStoryChapterId;
  readonly mood: EngineeringShowMood;
  readonly partId: string | null;
  readonly anchorProgress: number;
  readonly actLabel: LocalizedText;
  readonly title: LocalizedText;
  readonly subtitle: LocalizedText;
  readonly narrative: LocalizedText;
  readonly techCue: LocalizedText;
  readonly transitionHint: LocalizedText;
}

export interface EngineeringShowScrollState {
  readonly rawScroll: number;
  readonly timelineProgress: number;
  readonly sceneIndex: number;
  readonly scene: EngineeringShowScene;
  readonly nextScene: EngineeringShowScene | null;
  readonly phase: "transition" | "resting";
  /** 0..1 progress within the current transition glide (1 when resting). */
  readonly transitionProgress: number;
  /** 0..1 progress through the resting dwell plateau ("khoáº£ng nghá»‰"). */
  readonly dwellProgress: number;
  readonly isResting: boolean;
  readonly isFinale: boolean;
  /** Choreographed typography stage synchronized with camera motion. */
  readonly storyStage: EngineeringStoryStage;
}

/**
 * Snappy, rhythmic scroll pacing per scene in svh:
 * 12 scenes Ã— 82svh = 984svh total runway.
 * - 48% (~39svh): smooth camera & mechanical glide (previous text exits cleanly).
 * - 52% (~43svh): crisp resting dwell plateau ("khoáº£ng nghá»‰") where the 3D part
 *   locks rock-steady while the staggered story title & narrative animate in.
 */
export const SHOW_SCENE_SCROLL_VH = 82;
export const SHOW_TRANSITION_RATIO = 0.48;

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
    partId: null,
    anchorProgress: 0,
    actLabel: {
      en: "PROLOGUE Â· ASSEMBLED DATUM",
      vi: "Má»ž MÃ€N Â· NGUYÃŠN Báº¢N TÄ¨NH Láº¶NG",
    },
    title: {
      en: "Sculpted by air, waiting to open",
      vi: "ÄiÃªu kháº¯c tá»« giÃ³, sáºµn sÃ ng hÃ© má»Ÿ",
    },
    subtitle: {
      en: "FP-04 RB Ground-Effect Architecture Â· 47 Mechanical Assemblies",
      vi: "Kiáº¿n trÃºc Hiá»‡u á»©ng Máº·t Ä‘áº¥t FP-04 RB Â· 47 Cá»¥m CÆ¡ KhÃ­",
    },
    narrative: {
      en: "Before a single carbon panel moves, look at the car as one unbroken arrow. Scroll gently: the camera glides into each component and pauses just long enough to tell its story.",
      vi: "TrÆ°á»›c khi máº£nh carbon Ä‘áº§u tiÃªn dá»‹ch chuyá»ƒn, hÃ£y ngáº¯m cá»— mÃ¡y á»Ÿ tráº¡ng thÃ¡i nguyÃªn khá»‘i hoÃ n chá»‰nh. Cuá»™n nháº¹ xuá»‘ng, á»‘ng kÃ­nh sáº½ lÆ°á»›t tá»›i tá»«ng linh kiá»‡n vÃ  dá»«ng nhá»‹p vá»«a Ä‘á»§ Ä‘á»ƒ ká»ƒ cÃ¢u chuyá»‡n cá»§a nÃ³.",
    },
    techCue: {
      en: "DATUM 0.0 mm Â· 47 ASSEMBLIES LOCKED",
      vi: "CHUáº¨N 0,0 mm Â· 47 Cá»¤M KHÃ“A KHÃT",
    },
    transitionHint: {
      en: "Scroll down Â· Act I: Front Wing",
      vi: "Cuá»™n xuá»‘ng Â· Há»“i I: CÃ¡nh GiÃ³ TrÆ°á»›c",
    },
  },
  {
    id: "front-wing",
    index: 1,
    indexLabel: "02",
    chapterId: "aero",
    mood: "aero",
    partId: "FRONT_WING_ASSEMBLY",
    anchorProgress: shotHoldProgress("FRONT_WING_ASSEMBLY", 0.055),
    actLabel: {
      en: "ACT I Â· FIRST CONTACT WITH AIR",
      vi: "Há»’I I Â· NHÃT Cáº®T Äáº¦U TIÃŠN",
    },
    title: {
      en: "Multi-Element Front Wing",
      vi: "CÃ¡nh GiÃ³ TrÆ°á»›c Äa Táº§ng",
    },
    subtitle: {
      en: "Front Assembly Â· Four-Plane Carbon Aerofoil",
      vi: "Äáº§u xe Â· Bá»‘n táº§ng cÃ¡nh carbon táº¡o Ã¡p suáº¥t",
    },
    narrative: {
      en: "Our story begins at the leading edge. At 300 km/h, untouched air hits these four stacked carbon planes first, pushing dirty wake around the front tyres while feeding clean air toward the underfloor.",
      vi: "CÃ¢u chuyá»‡n báº¯t Ä‘áº§u ngay mÅ©i cháº¡m giÃ³ Ä‘áº§u tiÃªn. á»ž 300 km/h, bá»‘n táº§ng cÃ¡nh carbon nÃ y xáº» Ä‘Ã´i dÃ²ng khÃ­: Ä‘áº©y luá»“ng nhiá»…u Ä‘á»™ng vÃ²ng qua bÃ¡nh trÆ°á»›c vÃ  dáº«n khÃ­ sáº¡ch giÃ u nÄƒng lÆ°á»£ng chui tháº³ng xuá»‘ng gáº§m xe.",
    },
    techCue: {
      en: "OUTWASH SHAPING Â· ~25% FRONT DOWNFORCE",
      vi: "ÄIá»€U HÆ¯á»šNG XOÃY Â· ~25% Lá»°C Ã‰P Äáº¦U XE",
    },
    transitionHint: {
      en: "Next Â· Impact Nosecone & Pitot",
      vi: "Tiáº¿p theo Â· MÅ©i Carbon & Cáº£m Biáº¿n Pitot",
    },
  },
  {
    id: "nosecone",
    index: 2,
    indexLabel: "03",
    chapterId: "aero",
    mood: "aero",
    partId: "NOSECONE_SHELL",
    anchorProgress: shotHoldProgress("NOSECONE_SHELL", 0.075),
    actLabel: {
      en: "ACT I Â· IMPACT SPEAR",
      vi: "Há»’I I Â· MÅ¨I GIÃO Háº¤P THá»¤ Lá»°C",
    },
    title: {
      en: "Carbon Nosecone & Pitot Array",
      vi: "MÅ©i Carbon & Cá»¥m á»ng Äo Ãp Pitot",
    },
    subtitle: {
      en: "Front Crash Structure Â· Structural & Aero Conduit",
      vi: "Cá»¥m mÅ©i xe Â· Cáº¥u trÃºc háº¥p thá»¥ va cháº¡m chuáº©n FIA",
    },
    narrative: {
      en: "Follow the airflow backward past the wing. This slender carbon cone crushes progressively to absorb frontal impact energy, yet stays razor-thin so air rushes uninterrupted to the floor inlets.",
      vi: "Theo dÃ²ng khÃ­ lÃ¹i vá» sau cÃ¡nh trÆ°á»›c. Chiáº¿c mÅ©i carbon thon gá»n nÃ y vá»«a háº¥p thá»¥ xung lá»±c va cháº¡m cá»±c Ä‘áº¡i theo chuáº©n FIA, vá»«a máº£nh mai Ä‘á»ƒ khÃ´ng cáº£n luá»“ng khÃ­ Ä‘á»• tháº³ng vÃ o cá»­a hÃºt gáº§m.",
    },
    techCue: {
      en: "FIA CRASH CONE Â· LIVE AIRSPEED PITOT",
      vi: "Cáº¤U TRÃšC VA CHáº M FIA Â· ÄO ÃP SUáº¤T GIÃ“",
    },
    transitionHint: {
      en: "Next Â· Rear Wing & DRS Valve",
      vi: "Tiáº¿p theo Â· CÃ¡nh GiÃ³ Sau & CÆ¡ Cáº¥u DRS",
    },
  },
  {
    id: "rear-drs",
    index: 3,
    indexLabel: "04",
    chapterId: "aero",
    mood: "aero",
    partId: "REAR_DRS_FLAP_ACTUATOR",
    anchorProgress: shotHoldProgress("REAR_DRS_FLAP_ACTUATOR", 0.16),
    actLabel: {
      en: "ACT I Â· STRAIGHT-LINE RELEASE",
      vi: "Há»’I I Â· GIáº¢I PHÃ“NG Tá»C Äá»˜ THáº²NG",
    },
    title: {
      en: "Rear Wing & Hydraulic DRS Flap",
      vi: "CÃ¡nh GiÃ³ Sau & Van Tá»‘c Äá»™ DRS",
    },
    subtitle: {
      en: "Rear Aero Â· Switchable Drag Reduction System",
      vi: "ÄuÃ´i xe Â· CÆ¡ cáº¥u thá»§y lá»±c má»Ÿ gÃ³c cÃ¡nh 85mm",
    },
    narrative: {
      en: "High downforce comes with drag. On long straights, one thumb press fires this hydraulic actuator, pivoting the upper flap open 85 mm to spill air resistance and unlock an overtaking surge.",
      vi: "Lá»±c Ã©p lá»›n luÃ´n Ä‘i kÃ¨m lá»±c cáº£n. TrÃªn Ä‘oáº¡n tháº³ng, má»™t nÃºt báº¥m kÃ­ch hoáº¡t cÆ¡ cáº¥u thá»§y lá»±c má»Ÿ lÃ¡ cÃ¡nh trÃªn 85 mm, xáº£ lá»±c cáº£n tá»©c thÃ¬ Ä‘á»ƒ bá»©t tá»‘c hÆ¡n 15 km/h vÆ°á»£t Ä‘á»‘i thá»§.",
    },
    techCue: {
      en: "85 mm SLOT GAP Â· +12â€“18 KM/H DELTA",
      vi: "KHE Má»ž 85 mm Â· TÄ‚NG 12â€“18 KM/H KHI VÆ¯á»¢T",
    },
    transitionHint: {
      en: "Next Â· Act II: Titanium Halo",
      vi: "Tiáº¿p theo Â· Há»“i II: Khung Halo Titanium",
    },
  },
  {
    id: "cockpit-halo",
    index: 4,
    indexLabel: "05",
    chapterId: "cockpit",
    mood: "cockpit",
    partId: "COCKPIT_HALO",
    anchorProgress: shotHoldProgress("COCKPIT_HALO", 0.21),
    actLabel: {
      en: "ACT II Â· TITANIUM SANCTUARY",
      vi: "Há»’I II Â· VÃ’NG CHáº®N TITANIUM",
    },
    title: {
      en: "Grade-5 Titanium Halo",
      vi: "Khung Báº£o Vá»‡ Halo Titanium Cáº¥p 5",
    },
    subtitle: {
      en: "Driver Cockpit Â· 7 kg Structure Rated to 125 kN",
      vi: "Buá»“ng lÃ¡i Â· Náº·ng 7 kg, chá»‹u táº£i tÆ°Æ¡ng Ä‘Æ°Æ¡ng 2 xe buÃ½t",
    },
    narrative: {
      en: "Now we step inside where human courage meets material science. The Halo hoists upward like a theatre curtain: just seven kilograms of Grade-5 titanium built to bear 125 kN of vertical load.",
      vi: "BÃ¢y giá» chÃºng ta bÆ°á»›c vÃ o khÃ´ng gian sinh tá»“n cá»§a tay Ä‘ua. Khung Halo nÃ¢ng tháº³ng lÃªn nhÆ° vÃ©n táº¥m mÃ n sÃ¢n kháº¥u: chá»‰ 7 kg titan cáº¥p 5 nhÆ°ng Ä‘á»§ sá»©c chá»‹u táº£i dá»c 125 kN Ä‘á»ƒ báº£o vá»‡ tÃ­nh máº¡ng.",
    },
    techCue: {
      en: "GRADE-5 TITANIUM Â· 125 kN VERTICAL LOAD",
      vi: "TITANIUM Cáº¤P 5 Â· CHá»ŠU Táº¢I Dá»ŒC 125 kN",
    },
    transitionHint: {
      en: "Next Â· F1 OLED Steering Wheel",
      vi: "Tiáº¿p theo Â· VÃ´-LÄƒng OLED & Buá»“ng LÃ¡i",
    },
  },
  {
    id: "cockpit-wheel",
    index: 5,
    indexLabel: "06",
    chapterId: "cockpit",
    mood: "cockpit",
    partId: "STEERING_WHEEL_LCD",
    anchorProgress: shotHoldProgress("STEERING_WHEEL_LCD", 0.27),
    actLabel: {
      en: "ACT II Â· COMMAND AT 320 KM/H",
      vi: "Há»’I II Â· TRUNG TÃ‚M CHá»ˆ HUY á»ž 320 KM/H",
    },
    title: {
      en: "F1 OLED Steering Wheel & Telemetry",
      vi: "VÃ´-LÄƒng OLED & Báº£ng Äiá»u Khiá»ƒn F1",
    },
    subtitle: {
      en: "Driver Eye-Level Â· 15 Shift LEDs & Rotary Differentials",
      vi: "Táº§m máº¯t tay Ä‘ua Â· 15 Ä‘Ã¨n sang sá»‘ & nÃºm xoay vi sai",
    },
    narrative: {
      en: "With the Halo lifted clear, take the driver's seat. Brake-migration dials, differential maps, ERS deploy modes, and carbon paddles sit between your thumbs: test them live in the tray on the left.",
      vi: "Khi khung Halo Ä‘Ã£ má»Ÿ lá»‘i, hÃ£y ngá»“i vÃ o vá»‹ trÃ­ tay Ä‘ua. ToÃ n bá»™ bá»™ nÃ£o chá»‰nh phanh, khÃ³a vi sai, xáº£ pin ERS vÃ  láº«y sá»‘ carbon náº±m gá»n trong hai ngÃ³n cÃ¡i: báº¡n cÃ³ thá»ƒ báº¥m thá»­ ngay trÃªn khay bÃªn trÃ¡i.",
    },
    techCue: {
      en: "INTERACTIVE COCKPIT Â· TRY GEAR / DRS / ERS",
      vi: "BUá»’NG LÃI TÆ¯Æ NG TÃC Â· THá»¬ SANG Sá» / DRS / ERS",
    },
    transitionHint: {
      en: "Next Â· Act III: Wheels & Carbon Brakes",
      vi: 'Tiáº¿p theo Â· Há»“i III: MÃ¢m 18" & Phanh Carbon',
    },
  },
  {
    id: "wheel-corner",
    index: 6,
    indexLabel: "07",
    chapterId: "corners",
    mood: "thermal",
    partId: "FL_BRAKE_SUSPENSION",
    anchorProgress: shotHoldProgress("FL_BRAKE_SUSPENSION", 0.415),
    actLabel: {
      en: "ACT III Â· FOUR PALMS OF GRIP",
      vi: "Há»’I III Â· Bá»N ÄIá»‚M CHáº M Máº¶T ÄÆ¯á»œNG",
    },
    title: {
      en: '18" Slicks, Forged Rims & Carbon Brakes',
      vi: 'Lá»‘p Slick 18", MÃ¢m RÃ¨n & ÄÄ©a Phanh Carbon',
    },
    subtitle: {
      en: "Wheel Corners Â· 720Â° Centerlock Separation",
      vi: "Bá»‘n gÃ³c bÃ¡nh Â· Äai á»‘c tÃ¢m xoay 720Â° bÃ³c tÃ¡ch cá»¥m phanh",
    },
    narrative: {
      en: "Centerlock nuts spin 720Â° outward, peeling back aero covers, 18-inch slicks, and forged rims. Beneath them sit carbon-carbon brake discs capable of 5.5 G stops above 1,000 Â°C.",
      vi: "Äai á»‘c khÃ³a tÃ¢m xoay 720Â° kÃ©o rá»i á»‘p khÃ­ Ä‘á»™ng, lá»‘p trÆ¡n 18 inch vÃ  mÃ¢m rÃ¨n. áº¨n bÃªn trong lÃ  cá»¥m Ä‘Ä©a phanh carbon chá»‹u lá»±c hÃ£m 5,5 G, Ä‘á» rá»±c vÆ°á»£t 1.000 Â°C á»Ÿ má»—i gÃ³c cua gáº¯t.",
    },
    techCue: {
      en: "5.5 G DECELERATION Â· >1,000 Â°C CARBON DISCS",
      vi: "Lá»°C HÃƒM 5,5 G Â· ÄÄ¨A PHANH CARBON >1.000 Â°C",
    },
    transitionHint: {
      en: "Next Â· Act IV: Sidepods & Cooling",
      vi: "Tiáº¿p theo Â· Há»“i IV: Sidepod & KÃ©t Táº£n Nhiá»‡t",
    },
  },
  {
    id: "sidepods",
    index: 7,
    indexLabel: "08",
    chapterId: "bodywork",
    mood: "thermal",
    partId: "SIDEPOD_SHELL_LEFT",
    anchorProgress: shotHoldProgress("SIDEPOD_SHELL_LEFT", 0.565),
    actLabel: {
      en: "ACT IV Â· SCULPTED BREATHING",
      vi: "Há»’I IV Â· LÃ€N DA KHÃ Äá»˜NG & Táº¢N NHIá»†T",
    },
    title: {
      en: "Undercut Sidepods & Inclined Radiators",
      vi: "Vá» Há»‘c GiÃ³ Sidepod & KÃ©t NÆ°á»›c NghiÃªng",
    },
    subtitle: {
      en: "Bodywork & Thermal Packaging Â· Tight Undercut Waist",
      vi: "ThÃ¢n vá» Â· CÃ¢n báº±ng giá»¯a lÃ m mÃ¡t vÃ  thu háº¹p hÃ´ng xe",
    },
    narrative: {
      en: "Composite sidepods peel laterally like armor plates to expose tilted heat exchangers. Every millimeter shaved here carves a deeper undercut channel guiding fast air onto the rear diffuser.",
      vi: "Hai lá»›p vá» sidepod tÃ¡ch ngang nhÆ° bá»™ giÃ¡p Ä‘á»ƒ lá»™ cáº·p kÃ©t táº£n nhiá»‡t Ä‘áº·t nghiÃªng cá»±c gáº¯t. Tá»«ng milimÃ©t Ä‘Æ°á»£c Ã©p gá»n má»Ÿ ra rÃ£nh undercut sÃ¢u, tÄƒng tá»‘c luá»“ng khÃ­ quÃ©t tháº³ng vá» bá»™ khuáº¿ch tÃ¡n sau.",
    },
    techCue: {
      en: "UNDERCUT CHANNEL Â· INCLINED RADIATOR CORES",
      vi: "RÃƒNH UNDERCUT Â· KÃ‰T GIáº¢I NHIá»†T Äáº¶T NGHIÃŠNG",
    },
    transitionHint: {
      en: "Next Â· Act V: Venturi Underfloor",
      vi: "Tiáº¿p theo Â· Há»“i V: BÃ­ Máº­t SÃ n Venturi",
    },
  },
  {
    id: "venturi-floor",
    index: 8,
    indexLabel: "09",
    chapterId: "core",
    mood: "venturi",
    partId: "VENTURI_FLOOR_TITANIUM",
    anchorProgress: shotHoldProgress("VENTURI_FLOOR_TITANIUM", 0.625),
    actLabel: {
      en: "ACT V Â· THE EFFET DE SOL SECRET",
      vi: "Há»’I V Â· BÃ Máº¬T EFFET DE SOL",
    },
    title: {
      en: "Venturi Underfloor & Titanium Skid Plank",
      vi: "SÃ n ÄÆ°á»ng Háº§m Venturi & Táº¥m TrÆ°á»£t Titan",
    },
    subtitle: {
      en: "Underfloor Core Â· Ground-Effect Suction Engine",
      vi: "Gáº§m xe Â· Nguá»“n sinh lá»±c Ã©p lá»›n nháº¥t toÃ n xe",
    },
    narrative: {
      en: "This is why our project carries the name Effet de Sol. The floor drops away to reveal twin Venturi tunnels that accelerate air beneath the chassis, pulling the car down onto the asphalt.",
      vi: "ÄÃ¢y lÃ  lÃ½ do cÃ¡i tÃªn Effet de Sol ra Ä‘á»i. SÃ n gáº§m háº¡ tháº¥p Ä‘á»ƒ lá»™ hai Ä‘Æ°á»ng háº§m Venturi tÄƒng tá»‘c luá»“ng khÃ­ bÃªn dÆ°á»›i khung xe, táº¡o vÃ¹ng Ã¡p suáº¥t tháº¥p hÃºt cháº·t chiáº¿c xe xuá»‘ng máº·t Ä‘Æ°á»ng.",
    },
    techCue: {
      en: "VENTURI SUCTION Â· ~55% TOTAL DOWNFORCE",
      vi: "Lá»°C HÃšT VENTURI Â· ~55% Tá»”NG Lá»°C Ã‰P KHÃ Äá»˜NG",
    },
    transitionHint: {
      en: "Next Â· 1.6L V6 Turbo Hybrid Core",
      vi: "Tiáº¿p theo Â· TrÃ¡i Tim Hybrid 1.6L V6 Turbo",
    },
  },
  {
    id: "powertrain",
    index: 9,
    indexLabel: "10",
    chapterId: "core",
    mood: "venturi",
    partId: "POWERTRAIN_V6_HYBRID",
    anchorProgress: shotHoldProgress("POWERTRAIN_V6_HYBRID", 0.68),
    actLabel: {
      en: "ACT V Â· THE HYBRID HEART",
      vi: "Há»’I V Â· TRÃI TIM HYBRID 1.6L V6",
    },
    title: {
      en: "1.6L V6 Turbo Hybrid & Stressed Gearbox",
      vi: "Äá»™ng CÆ¡ V6 Turbo Hybrid & Há»™p Sá»‘ Chá»‹u Lá»±c",
    },
    subtitle: {
      en: "Powertrain Spine Â· >50% Thermal Efficiency",
      vi: "LÃµi Ä‘á»™ng lá»±c Â· Hiá»‡u suáº¥t nhiá»‡t vÆ°á»£t 50% gáº¯n liá»n khung",
    },
    narrative: {
      en: "Deep behind the driver's spine lives the most thermally efficient hybrid power unit ever raced, bolted directly between the carbon survival cell and 8-speed gearbox as the car's skeleton.",
      vi: "áº¨n ngay sau lÆ°ng tay Ä‘ua lÃ  cá»— mÃ¡y hybrid cÃ³ hiá»‡u suáº¥t nhiá»‡t vÆ°á»£t 50%. Khá»‘i Ä‘á»™ng cÆ¡ V6 vÃ  há»™p sá»‘ 8 cáº¥p Ä‘Æ°á»£c báº¯t trá»±c tiáº¿p vÃ o khoang sinh tá»“n carbon nhÆ° xÆ°Æ¡ng sá»‘ng chá»‹u lá»±c cá»§a xe.",
    },
    techCue: {
      en: "1.6L V6 + ERS HYBRID Â· STRESSED CHASSIS MEMBER",
      vi: "V6 1.6L + ERS HYBRID Â· XÆ¯Æ NG Sá»NG CHá»ŠU Lá»°C",
    },
    transitionHint: {
      en: "Next Â· Climax: 47-Assembly Symphony",
      vi: "Tiáº¿p theo Â· Cao TrÃ o: ToÃ n Cáº£nh 47 Cá»¥m",
    },
  },
  {
    id: "matrix-climax",
    index: 10,
    indexLabel: "11",
    chapterId: "matrix",
    mood: "climax",
    partId: "MONOCOQUE_CHASSIS",
    anchorProgress: shotHoldProgress("MONOCOQUE_CHASSIS", 0.8),
    actLabel: {
      en: "CLIMAX Â· 47-ASSEMBLY SYMPHONY",
      vi: "CAO TRÃ€O Â· Báº¢N GIAO HÆ¯á»žNG 47 Cá»¤M",
    },
    title: {
      en: "Monocoque Survival Cell & Exploded Matrix",
      vi: "Khoang Monocoque & ToÃ n Cáº£nh 47 Cá»¥m LÆ¡ Lá»­ng",
    },
    subtitle: {
      en: "Peak Disassembly Â· Free 360Â° Orbit Unlocked",
      vi: "Cá»±c Ä‘áº¡i bÃ³c tÃ¡ch Â· Má»Ÿ khÃ³a xoay tá»± do 360Â° Orbit",
    },
    narrative: {
      en: "Forty-six subsystems float in spatial equilibrium around the central carbon monocoque. Tap 360Â° Orbit below to fly freely around the sculpture or click any assembly to isolate it.",
      vi: "ToÃ n bá»™ 46 cá»¥m cÆ¡ khÃ­ lÆ¡ lá»­ng cÃ¢n báº±ng quanh khoang sinh tá»“n Monocoque carbon. HÃ£y báº¥m Xoay 360Â° bÃªn dÆ°á»›i Ä‘á»ƒ bay tá»± do quanh tÃ¡c pháº©m hoáº·c báº¥m vÃ o báº¥t ká»³ chi tiáº¿t nÃ o Ä‘á»ƒ soi riÃªng.",
    },
    techCue: {
      en: "PEAK MATRIX Â· 360Â° ORBIT & ISOLATION READY",
      vi: "TOÃ€N Cáº¢NH Cá»°C Äáº I Â· Sáº´N SÃ€NG XOAY 360Â°",
    },
    transitionHint: {
      en: "Next Â· Finale: Precision Re-Lock",
      vi: "Tiáº¿p theo Â· Háº¡ MÃ n: TÃ¡i Láº¯p RÃ¡p 0,0 mm",
    },
  },
  {
    id: "finale-lock",
    index: 11,
    indexLabel: "12",
    chapterId: "reassembly",
    mood: "climax",
    partId: null,
    anchorProgress: 1,
    actLabel: {
      en: "FINALE Â· PRECISION RE-LOCK",
      vi: "Háº  MÃ€N Â· Há»¢P NHáº¤T NGUYÃŠN KHá»I",
    },
    title: {
      en: "47 parts return to one racing machine",
      vi: "47 máº£nh ghÃ©p há»™i tá»¥ thÃ nh má»™t cá»— mÃ¡y Ä‘ua",
    },
    subtitle: {
      en: "100% Datum Lock Â· End of the Engineering Show",
      vi: "KhÃ³a chuáº©n 100% Â· Káº¿t thÃºc mÃ n trÃ¬nh diá»…n Ká»¹ thuáº­t",
    },
    narrative: {
      en: "Core, cockpit, bodywork, wings, and centerlock nuts glide home in reverse sequence and seal to 0.0 mm tolerance. Replay the show anytime, or step into the Pit Garage Showroom.",
      vi: "LÃµi mÃ¡y, buá»“ng lÃ¡i, thÃ¢n vá», cÃ¡nh giÃ³ vÃ  bá»‘n Ä‘ai á»‘c tÃ¢m trÆ°á»£t ngÆ°á»£c vá» khá»›p kÃ­n chuáº©n 0,0 mm. Báº¡n cÃ³ thá»ƒ xem láº¡i mÃ n trÃ¬nh diá»…n báº¥t cá»© lÃºc nÃ o hoáº·c bÆ°á»›c sang Garage Showroom.",
    },
    techCue: {
      en: "100% LOCKED Â· CURTAIN CALL",
      vi: "KHÃ“A CHUáº¨N 100% Â· KHÃ‰P Láº I MÃ€N TRÃŒNH DIá»„N",
    },
    transitionHint: {
      en: "Show complete Â· Replay or visit Showroom",
      vi: "Káº¿t thÃºc Show Â· Xem láº¡i hoáº·c sang Showroom",
    },
  },
];

export const ENGINEERING_SHOW_TOTAL_VH =
  ENGINEERING_SHOW_SCENES.length * SHOW_SCENE_SCROLL_VH;

/**
 * Returns a raw scroll ratio (0..1) that lands calmly inside scene `sceneIndex`'s
 * resting dwell plateau ("khoáº£ng nghá»‰").
 */
export function getShowScrollForScene(sceneIndex: number): number {
  const total = ENGINEERING_SHOW_SCENES.length;
  const clampedIdx = Math.max(0, Math.min(total - 1, Math.round(sceneIndex)));
  if (clampedIdx === 0) return 0;
  const segSize = 1 / total;
  // Land at 58% of the scene segment â€” cleanly past the 48% glide, with a crisp
  // resting beat ahead before the next scene starts gliding.
  return Math.min(1, (clampedIdx + 0.58) * segSize);
}

/**
 * Maps raw page scroll ratio `rawScroll âˆˆ [0, 1]` through a snappy piecewise
 * glide + dwell-plateau curve with synchronized typography reveal/exit states:
 * - During glide (localT < 0.48): camera moves smoothly while text stays veiled
 *   ("hidden"), keeping the 3D choreography unobstructed.
 * - As camera arrives (localT âˆˆ [0.48, 0.56]): text triggers staggered unmask
 *   reveal ("entering" -> "visible").
 * - Across the dwell plateau (localT âˆˆ [0.48, 1.0]): timelineProgress locks
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
      localT > 0.84 ? "exiting" : "visible";
    return {
      rawScroll,
      timelineProgress: scene.anchorProgress,
      sceneIndex,
      scene,
      nextScene,
      phase: "resting",
      transitionProgress: 1,
      dwellProgress: localT,
      isResting: true,
      isFinale: false,
      storyStage,
    };
  }

  const prevAnchor = ENGINEERING_SHOW_SCENES[sceneIndex - 1].anchorProgress;
  const targetAnchor = scene.anchorProgress;

  if (localT < SHOW_TRANSITION_RATIO) {
    const glideT = localT / SHOW_TRANSITION_RATIO;
    const eased = smootherstep(glideT);
    const timelineProgress = prevAnchor + (targetAnchor - prevAnchor) * eased;
    // Keep text veiled while the 3D camera swoops so text never snaps abruptly;
    // begin staggered reveal right as the camera nears arrival (last 14% of glide).
    const storyStage: EngineeringStoryStage =
      glideT >= 0.86 ? "entering" : "hidden";
    return {
      rawScroll,
      timelineProgress,
      sceneIndex,
      scene,
      nextScene,
      phase: "transition",
      transitionProgress: glideT,
      dwellProgress: 0,
      isResting: false,
      isFinale,
      storyStage,
    };
  }

  const dwellProgress =
    (localT - SHOW_TRANSITION_RATIO) / (1 - SHOW_TRANSITION_RATIO);
  const clampedDwell = Math.max(0, Math.min(1, dwellProgress));
  const storyStage: EngineeringStoryStage =
    !isFinale && clampedDwell > 0.88 ? "exiting" : "visible";

  return {
    rawScroll,
    timelineProgress: targetAnchor,
    sceneIndex,
    scene,
    nextScene,
    phase: "resting",
    transitionProgress: 1,
    dwellProgress: clampedDwell,
    isResting: true,
    isFinale,
    storyStage,
  };
}
