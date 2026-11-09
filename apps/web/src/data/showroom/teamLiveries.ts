import { TeamId } from '../../types';

export interface Team3DLivery {
  teamId: TeamId;
  teamName: string;
  fullName: string;
  carModelName: string;
  shortCarName: string;
  carImage: string;
  powerUnit: string;
  powerUnitSupplier: string;
  engineOutput: string;
  base: string;
  teamPrincipal: string;
  driversVi: string;
  driversEn: string;
  // 3D Material properties
  bodyColor: string;
  bodyRoughness: number;
  bodyMetalness: number;
  bodyClearcoat?: number;
  noseColor?: string;
  engineCoverColor?: string;
  sidepodColor?: string;
  airboxColor?: string;
  endplateColor?: string;
  noseRoughness?: number;
  noseMetalness?: number;
  sidepodRoughness?: number;
  sidepodMetalness?: number;
  engineCoverRoughness?: number;
  engineCoverMetalness?: number;
  wingColor: string;
  wingRoughness: number;
  wingMetalness: number;
  haloColor: string;
  haloRoughness: number;
  haloMetalness: number;
  floorColor: string;
  accentColor: string;
  highlightColor: string;
  // Dedicated Wheel Aero Disc & BBS Rim Livery Tokens
  wheelCoverColor?: string;
  wheelAccentColor?: string;
  wheelSecondaryColor?: string;
  wheelRimColor?: string;
  wheelPirelliCompound?: 'soft' | 'medium' | 'hard';
  // Dedicated Component Detail & Livery Color Tokens (Mirrors, Floor edges, Cockpit, Diffuser)
  mirrorColor?: string;
  mirrorAccentColor?: string;
  floorEdgeAccentColor?: string;
  seatbeltColor?: string;
  diffuserAccentColor?: string;
  rainLightColor?: string;
  // Engineering highlights
  aeroPhilosophyVi: string;
  aeroPhilosophyEn: string;
  powertrainNoteVi: string;
  powertrainNoteEn: string;
  // Dedicated 8K Engineering Schematic
  schematicImage: string;
  schematicCode: string;
  schematicTitleVi: string;
  schematicTitleEn: string;
}

export const TEAM_3D_LIVERIES: Record<TeamId, Team3DLivery> = {
  ferrari: {
    teamId: 'ferrari',
    teamName: 'Ferrari',
    fullName: 'Scuderia Ferrari HP',
    carModelName: 'Ferrari SF-24 / SF-26',
    shortCarName: 'SF-26',
    carImage: '/images/teams/sf24.webp',
    powerUnit: 'Ferrari 066/12 1.6L V6 Turbo Hybrid',
    powerUnitSupplier: 'Scuderia Ferrari (Maranello, Italy)',
    engineOutput: '1,050+ HP · 15,000 RPM · >52% Hiệu suất nhiệt',
    base: 'Maranello, Italy',
    teamPrincipal: 'Frédéric Vasseur',
    driversVi: 'Charles Leclerc #16 · Lewis Hamilton #44',
    driversEn: 'Charles Leclerc #16 · Lewis Hamilton #44',
    bodyColor: '#e8002d', // Official Ferrari Rosso Corsa (Pantone 186 C)
    noseColor: '#e8002d',
    engineCoverColor: '#e8002d',
    sidepodColor: '#e8002d',
    airboxColor: '#e8002d',
    endplateColor: '#ffdf00', // Modena Racing Yellow
    bodyRoughness: 0.12,
    bodyMetalness: 0.3,
    bodyClearcoat: 1.0,
    wingColor: '#121417', // Carbon black wing with Modena yellow aero tips
    wingRoughness: 0.22,
    wingMetalness: 0.35,
    haloColor: '#e8002d',
    haloRoughness: 0.16,
    haloMetalness: 0.4,
    floorColor: '#0a0b0d',
    accentColor: '#ffdf00', // Modena Yellow
    highlightColor: '#0096d6', // HP Title Sponsor Blue accent
    wheelCoverColor: '#15171c', // Matte stealth carbon base
    wheelAccentColor: '#e8002d', // Scuderia Rosso Corsa outer ring
    wheelSecondaryColor: '#ffdf00', // Modena Yellow concentric speed ring
    wheelRimColor: '#e8002d', // Scuderia Red rim edge
    wheelPirelliCompound: 'soft',
    mirrorColor: '#e8002d', // Scuderia Rosso Corsa mirrors
    mirrorAccentColor: '#ffdf00', // Modena Racing Yellow aero accent
    floorEdgeAccentColor: '#ffdf00', // Modena Yellow floor edge stripe
    seatbeltColor: '#e8002d', // Sabelt Scuderia Red racing harness
    diffuserAccentColor: '#ffdf00', // Modena Yellow diffuser strakes
    rainLightColor: '#ff0033', // FIA Ruby Red Rain Light
    aeroPhilosophyVi:
      'Hốc gió dạng bồn tắm (Bathtub downwash sidepods) dẫn luồng khí áp suất cao ép sát eo xe xuống thẳng sàn sau và bộ khuếch tán.',
    aeroPhilosophyEn:
      'Aggressive bathtub-style downwash sidepod architecture guiding high-energy airflows along the flanks to the beam wing and diffuser.',
    powertrainNoteVi:
      'Động cơ Ferrari 066/12 nổi danh với công nghệ buồng đốt phụ TJI, giải phóng công suất vượt 1050 mã lực kết hợp mô-tơ MGU-K thế hệ mới.',
    powertrainNoteEn:
      'The Ferrari 066/12 power unit excels with Turbulent Jet Ignition (TJI) combustion delivering 1050+ combined horsepower with responsive MGU-K hybrid recovery.',
    schematicImage: '/images/showroom/schematics/ferrari.webp',
    schematicCode: 'FER-SF26-AERO-8K',
    schematicTitleVi: 'Sơ đồ CAD khí động học 8K Scuderia Ferrari (Project 674)',
    schematicTitleEn: 'Scuderia Ferrari SF-26 8K Aerodynamic CAD Schematic',
  },

  mercedes: {
    teamId: 'mercedes',
    teamName: 'Mercedes',
    fullName: 'Mercedes-AMG PETRONAS Formula One Team',
    carModelName: 'Mercedes-AMG F1 W15 · 2024 reference model',
    shortCarName: 'W15',
    carImage: '/images/teams/w15.webp',
    powerUnit: 'Mercedes-AMG M15 E Performance 1.6L V6 Turbo Hybrid',
    powerUnitSupplier: 'Mercedes-AMG High Performance Powertrains (Brixworth, UK)',
    engineOutput: '1,050+ HP · Brixworth Hybrid Power · 350kW MGU-K',
    base: 'Brackley, United Kingdom',
    teamPrincipal: 'Toto Wolff',
    driversVi: 'George Russell #63 · Kimi Antonelli #12',
    driversEn: 'George Russell #63 · Kimi Antonelli #12',
    bodyColor: '#c8ccd0', // Iconic Silver Arrow metallic nose cone
    noseColor: '#c8ccd0', // Silver nose cone tapering into black
    engineCoverColor: '#0a0b0d', // Deep obsidian metallic black engine cover
    sidepodColor: '#0a0b0d', // Deep obsidian metallic black sidepods with green swoosh
    airboxColor: '#e10600', // INEOS vibrant red roll-hoop intake cowl
    endplateColor: '#e10600', // INEOS vibrant red front wing endplates
    bodyRoughness: 0.16,
    bodyMetalness: 0.65,
    bodyClearcoat: 1.0,
    noseRoughness: 0.14,
    noseMetalness: 0.82, // High metallic sheen for classic Silver Arrow look
    sidepodRoughness: 0.18,
    sidepodMetalness: 0.20, // Deep obsidian black - preserves deep contrast without gamma washing
    engineCoverRoughness: 0.18,
    engineCoverMetalness: 0.20, // Deep obsidian black - preserves deep contrast
    wingColor: '#0e1014', // Deep glossy woven carbon fiber black (Identical to W15)
    wingRoughness: 0.20,
    wingMetalness: 0.25,
    haloColor: '#121418', // Deep carbon titanium black (Identical to W15)
    haloRoughness: 0.25,
    haloMetalness: 0.40,
    floorColor: '#08090b',
    accentColor: '#00a19c', // Iconic Petronas Emerald Turquoise speedline
    highlightColor: '#00f5d4', // Bright neon mint/cyan highlight accent
    wheelCoverColor: '#0d1014', // Obsidian carbon aero disc
    wheelAccentColor: '#00a19c', // Iconic PETRONAS Cyan perimeter ring
    wheelSecondaryColor: '#c8ccd0', // Mercedes Silver concentric speed ring
    wheelRimColor: '#c8ccd0', // Silver Arrow rim flange
    wheelPirelliCompound: 'medium',
    mirrorColor: '#c8ccd0', // Silver Arrow mirror housing
    mirrorAccentColor: '#00a19c', // Petronas Turquoise aero stripe
    floorEdgeAccentColor: '#00a19c', // Petronas Emerald Turquoise floor edge
    seatbeltColor: '#00a19c', // Petronas Teal racing harness
    diffuserAccentColor: '#00a19c', // Petronas Turquoise diffuser strakes
    rainLightColor: '#ff0033', // FIA Ruby Red Rain Light
    aeroPhilosophyVi:
      'Triết lý khí động học tinh gọn với rãnh dẫn khí sườn dốc (Undercut Channel) và cánh gió trước đa tầng triệt tiêu nhiễu động bánh xe.',
    aeroPhilosophyEn:
      'Refined aerodynamic flow-conditioning with sculpted undercut sidepod channels and multi-element front wings shedding front-wheel wake.',
    powertrainNoteVi:
      'Động cơ Mercedes-AMG M15 huyền thoại về độ ổn định và hiệu suất thu hồi nhiệt năng MGU-H, thống trị kỷ nguyên động cơ Turbo Hybrid.',
    powertrainNoteEn:
      'Mercedes-AMG M15 power unit setting the benchmark in thermodynamic efficiency and sustained hybrid energy harvesting across full race distances.',
    schematicImage: '/images/showroom/schematics/mercedes.webp',
    schematicCode: 'MERC-W15-AERO-8K',
    schematicTitleVi: 'Bản vẽ kỹ thuật khí động học 8K Mercedes-AMG F1 W15',
    schematicTitleEn: 'Mercedes-AMG F1 W15 8K Aerodynamic Blueprint',
  },

  mclaren: {
    teamId: 'mclaren',
    teamName: 'McLaren',
    fullName: 'McLaren Formula 1 Team',
    carModelName: 'McLaren MCL38 / MCL40',
    shortCarName: 'MCL38',
    carImage: '/images/teams/mcl38.webp',
    powerUnit: 'Mercedes-AMG M15 E Performance 1.6L V6 Turbo Hybrid',
    powerUnitSupplier: 'Mercedes-AMG High Performance Powertrains (Customer Unit)',
    engineOutput: '1,050+ HP · 15,000 RPM · Hệ truyền động Carbon 8 cấp',
    base: 'Woking, United Kingdom',
    teamPrincipal: 'Andrea Stella',
    driversVi: 'Lando Norris #4 · Oscar Piastri #81',
    driversEn: 'Lando Norris #4 · Oscar Piastri #81',
    bodyColor: '#ff8000', // Signature Papaya Orange
    noseColor: '#ff8000',
    engineCoverColor: '#121417', // Anthracite Raw Carbon Black
    sidepodColor: '#ff8000',
    airboxColor: '#121417',
    endplateColor: '#121417',
    bodyRoughness: 0.16,
    bodyMetalness: 0.25,
    bodyClearcoat: 1.0,
    wingColor: '#121417', // Anthracite Carbon with Papaya DRS Flap
    wingRoughness: 0.22,
    wingMetalness: 0.3,
    haloColor: '#ff8000',
    haloRoughness: 0.18,
    haloMetalness: 0.3,
    floorColor: '#0c0d10',
    accentColor: '#ff8000', // Papaya
    highlightColor: '#47c7fc', // Stealth Blue
    wheelCoverColor: '#111317', // Stealth Carbon base disc
    wheelAccentColor: '#ff8000', // Signature Papaya Orange perimeter ring
    wheelSecondaryColor: '#47c7fc', // Google Chrome / Stealth Blue accent
    wheelRimColor: '#ff8000', // Papaya rim edge
    wheelPirelliCompound: 'medium',
    mirrorColor: '#ff8000', // Papaya Orange mirror housing
    mirrorAccentColor: '#47c7fc', // Chrome Cyan aero accent
    floorEdgeAccentColor: '#ff8000', // Papaya Orange floor edge
    seatbeltColor: '#ff8000', // Sabelt Papaya Orange racing harness
    diffuserAccentColor: '#ff8000', // Papaya Orange diffuser strakes
    rainLightColor: '#ff0033', // FIA Ruby Red Rain Light
    aeroPhilosophyVi:
      'Hệ thống hốc gió hớt gầm sâu nhất đoàn đua (Extreme Undercut) và sàn xe Venturi tối ưu lực ép khi vào các góc cua tốc độ cao.',
    aeroPhilosophyEn:
      'Class-leading extreme undercut sidepod geometry feeding high-velocity air into an optimized ground-effect floor for apex stability.',
    powertrainNoteVi:
      'Tích hợp hoàn hảo khối động cơ Mercedes-AMG M15 với bộ làm mát nội bộ siêu gọn do đội ngũ kỹ sư tại Woking tự phát triển.',
    powertrainNoteEn:
      'Seamlessly packaged Mercedes-AMG M15 power unit paired with bespoke Woking-engineered compact cooling architecture.',
    schematicImage: '/images/showroom/schematics/mclaren.webp',
    schematicCode: 'MCL-38-CFD-8K',
    schematicTitleVi: 'Sơ đồ CFD & Khí động học 8K McLaren Racing MCL38',
    schematicTitleEn: 'McLaren Racing MCL38 8K CFD Aerodynamics Schematic',
  },

  redbull: {
    teamId: 'redbull',
    teamName: 'Red Bull',
    fullName: 'Oracle Red Bull Racing',
    carModelName: 'Red Bull Racing RB20 / RB22',
    shortCarName: 'RB20',
    carImage: '/images/teams/rb20.webp',
    powerUnit: 'Honda RBPTH002 1.6L V6 Turbo Hybrid',
    powerUnitSupplier: 'Red Bull Powertrains / Honda HRC',
    engineOutput: '1,050+ HP · Động cơ Honda HRC vô địch thế giới',
    base: 'Milton Keynes, United Kingdom',
    teamPrincipal: 'Christian Horner',
    driversVi: 'Max Verstappen #1 · Isack Hadjar #6',
    driversEn: 'Max Verstappen #1 · Isack Hadjar #6',
    bodyColor: '#0c192c', // Authentic Red Bull Matte Midnight Navy
    noseColor: '#0c192c',
    engineCoverColor: '#0c192c',
    sidepodColor: '#0c192c',
    airboxColor: '#ffce00', // Racing Sunburst Yellow airbox scoop
    endplateColor: '#0c192c',
    bodyRoughness: 0.7, // Signature Velvet Matte Finish
    bodyMetalness: 0.1,
    bodyClearcoat: 0.0, // Zero clearcoat for true velvet matte feel
    wingColor: '#0c0f16', // Matte dark carbon wing
    wingRoughness: 0.35,
    wingMetalness: 0.2,
    haloColor: '#0c192c',
    haloRoughness: 0.65,
    haloMetalness: 0.12,
    floorColor: '#080a0e',
    accentColor: '#ffce00', // Sunburst Yellow
    highlightColor: '#ed1a3b', // Red Bull Racing Red
    wheelCoverColor: '#0c192c', // Matte Midnight Navy base
    wheelAccentColor: '#ffce00', // Red Bull Racing Yellow perimeter ring
    wheelSecondaryColor: '#ed1a3b', // Bull Racing Red inner ring
    wheelRimColor: '#ffce00', // Golden rim lip
    wheelPirelliCompound: 'medium',
    mirrorColor: '#0c192c', // Matte Midnight Navy mirror housing
    mirrorAccentColor: '#ffce00', // Red Bull Sunburst Yellow aero stripe
    floorEdgeAccentColor: '#ed1a3b', // Bull Racing Red floor edge
    seatbeltColor: '#ed1a3b', // Red Bull Sabelt Red harness
    diffuserAccentColor: '#ffce00', // Sunburst Yellow diffuser strakes
    rainLightColor: '#ff0033', // FIA Ruby Red Rain Light
    aeroPhilosophyVi:
      'Tuyệt tác khí động học với các hốc hút gió sườn đảo ngược (Overbite Inlet) và hệ thống treo trước Pull-rod chống chúi đầu khi phanh gấp.',
    aeroPhilosophyEn:
      'Pioneering overbite sidepod intake philosophy combined with anti-dive pull-rod front suspension maintaining steady platform ground clearance.',
    powertrainNoteVi:
      'Động cơ Honda RBPTH002 mang lại khả năng phân bổ mô-men xoắn tức thời và độ bền cơ học đã giành nhiều danh hiệu vô địch thế giới liên tiếp.',
    powertrainNoteEn:
      'Honda RBPTH002 power unit delivers instantaneous torque deployment, surgical driveability and proven championship-winning endurance.',
    schematicImage: '/images/showroom/schematics/redbull.webp',
    schematicCode: 'RBR-RB20-01-8K',
    schematicTitleVi: 'Sơ đồ CAD khí động học 8K Oracle Red Bull Racing RB20',
    schematicTitleEn: 'Oracle Red Bull Racing RB20-01 8K CAD Schematic',
  },

  astonmartin: {
    teamId: 'astonmartin',
    teamName: 'Aston Martin',
    fullName: 'Aston Martin Aramco Formula One Team',
    carModelName: 'Aston Martin AMR25 / AMR26',
    shortCarName: 'AMR25',
    carImage: '/images/teams/astonmartin.webp',
    powerUnit: 'Mercedes-AMG M15 1.6L V6 Turbo Hybrid',
    powerUnitSupplier: 'Mercedes-AMG HPP (Silverstone Customer)',
    engineOutput: '1,050+ HP · Hệ thống treo khí động học Mercedes',
    base: 'Silverstone, United Kingdom',
    teamPrincipal: 'Mike Krack',
    driversVi: 'Fernando Alonso #14 · Lance Stroll #18',
    driversEn: 'Fernando Alonso #14 · Lance Stroll #18',
    bodyColor: '#006f62', // British Racing Metallic Emerald Green
    noseColor: '#006f62',
    engineCoverColor: '#006f62',
    sidepodColor: '#006f62',
    airboxColor: '#006f62',
    endplateColor: '#006f62',
    bodyRoughness: 0.15,
    bodyMetalness: 0.65, // High metallic sheen
    bodyClearcoat: 1.0,
    wingColor: '#0e1214', // Carbon black wing with lime pinstripes
    wingRoughness: 0.22,
    wingMetalness: 0.35,
    haloColor: '#006f62',
    haloRoughness: 0.18,
    haloMetalness: 0.5,
    floorColor: '#080b0a',
    accentColor: '#cedc00', // Fluorescent Lime Essence
    highlightColor: '#006f62',
    wheelCoverColor: '#003d35', // Aston Martin Racing Green aero disc
    wheelAccentColor: '#cedc00', // High-visibility Lime Essence track ring
    wheelSecondaryColor: '#006f62', // Racing Green inner accent
    wheelRimColor: '#cedc00', // Lime rim flange
    wheelPirelliCompound: 'medium',
    mirrorColor: '#006f62', // British Racing Green mirror housing
    mirrorAccentColor: '#cedc00', // Fluorescent Lime Essence aero accent
    floorEdgeAccentColor: '#cedc00', // Lime Essence floor edge
    seatbeltColor: '#cedc00', // Lime Essence racing harness
    diffuserAccentColor: '#cedc00', // Lime Essence diffuser strakes
    rainLightColor: '#ff0033', // FIA Ruby Red Rain Light
    aeroPhilosophyVi:
      'Máng trượt khí động học sườn xe sâu hút không khí dồn về phía sau kết hợp cánh sau DRS tối ưu lực cản tại đường thẳng.',
    aeroPhilosophyEn:
      'Deep waterslide sidepod gulley directing undisturbed ambient flow directly to the rear beam wing and upper diffuser.',
    powertrainNoteVi:
      'Sử dụng động cơ và hộp số Mercedes-AMG đặt trong khung gầm do đội ngũ kỹ sư tại đại bản doanh công nghệ cao Silverstone thiết kế.',
    powertrainNoteEn:
      'Mercedes-AMG powerplant housed within an ultra-stiff carbon cell developed inside the new state-of-the-art Silverstone AMR campus.',
    schematicImage: '/images/showroom/schematics/astonmartin.webp',
    schematicCode: 'AMR-24-SILVERSTONE-8K',
    schematicTitleVi: 'Sơ đồ CAD khí động học 8K Aston Martin AMR24 / AMR25',
    schematicTitleEn: 'Aston Martin Aramco AMR24 / AMR25 8K CAD Blueprint',
  },

  alpine: {
    teamId: 'alpine',
    teamName: 'Alpine',
    fullName: 'BWT Alpine Formula One Team',
    carModelName: 'Alpine A525 / A526',
    shortCarName: 'A525',
    carImage: '/images/teams/alpine.webp',
    powerUnit: 'Renault E-Tech RE25 1.6L V6 Turbo Hybrid',
    powerUnitSupplier: 'Alpine Racing (Viry-Châtillon, France)',
    engineOutput: '1,020+ HP · 15,000 RPM · Khung gầm Enstone Carbon',
    base: 'Enstone, United Kingdom / Viry, France',
    teamPrincipal: 'Oliver Oakes',
    driversVi: 'Pierre Gasly #10 · Franco Colapinto #43',
    driversEn: 'Pierre Gasly #10 · Franco Colapinto #43',
    bodyColor: '#0090ff', // Alpine Metallic Blue
    noseColor: '#0090ff',
    engineCoverColor: '#0090ff',
    sidepodColor: '#fd4bc7', // BWT Vibrant Flamingo Pink
    airboxColor: '#0090ff',
    endplateColor: '#121417',
    bodyRoughness: 0.15,
    bodyMetalness: 0.42,
    bodyClearcoat: 1.0,
    wingColor: '#121417', // Carbon black wing with BWT Pink DRS flap
    wingRoughness: 0.22,
    wingMetalness: 0.3,
    haloColor: '#0090ff',
    haloRoughness: 0.18,
    haloMetalness: 0.4,
    floorColor: '#0c0e12',
    accentColor: '#fd4bc7', // BWT Pink
    highlightColor: '#0090ff', // Alpine Blue
    wheelCoverColor: '#0d1722', // Alpine Navy / Carbon disc
    wheelAccentColor: '#fd4bc7', // BWT Hyper Pink perimeter ring
    wheelSecondaryColor: '#0090ff', // Alpine Blue speed ring
    wheelRimColor: '#0090ff', // Alpine Blue rim flange
    wheelPirelliCompound: 'soft',
    mirrorColor: '#0090ff', // Alpine Metallic Blue mirror housing
    mirrorAccentColor: '#fd4bc7', // BWT Flamingo Pink aero accent
    floorEdgeAccentColor: '#fd4bc7', // BWT Pink floor edge stripe
    seatbeltColor: '#0090ff', // Alpine Blue racing harness
    diffuserAccentColor: '#fd4bc7', // BWT Pink diffuser strakes
    rainLightColor: '#ff0033', // FIA Ruby Red Rain Light
    aeroPhilosophyVi:
      'Cấu trúc thân xe gọn gàng với triết lý tối giản hóa bề mặt ướt khí động và mũi xe dẹt hạ thấp trọng tâm quán tính.',
    aeroPhilosophyEn:
      'Slimline packaging prioritizing reduced wetted aero area with an ultra-low nosecone profile shifting roll centers forward.',
    powertrainNoteVi:
      'Động cơ Renault E-Tech phát triển tại Viry-Châtillon kết hợp bộ phận pin hồi lưu năng lượng điện phục vụ tăng tốc tức thì.',
    powertrainNoteEn:
      'Renault E-Tech hybrid unit engineered at Viry-Châtillon tuned for punchy corner-exit electrical deployment.',
    schematicImage: '/images/showroom/schematics/alpine.webp',
    schematicCode: 'ALP-A525-TECH-8K',
    schematicTitleVi: 'Sơ đồ CAD khí động học 8K BWT Alpine A525 Renault E-Tech',
    schematicTitleEn: 'BWT Alpine F1 Team A525 8K CAD Aero Blueprint',
  },

  racingbulls: {
    teamId: 'racingbulls',
    teamName: 'Racing Bulls',
    fullName: 'Visa Cash App RB Formula One Team',
    carModelName: 'Racing Bulls VCARB 02 / 03',
    shortCarName: 'VCARB 02',
    carImage: '/images/teams/racingbulls.webp',
    powerUnit: 'Honda RBPTH002 1.6L V6 Turbo Hybrid',
    powerUnitSupplier: 'Red Bull Powertrains / Honda HRC',
    engineOutput: '1,050+ HP · Honda HRC · Hệ thống treo Red Bull',
    base: 'Faenza, Italy',
    teamPrincipal: 'Laurent Mekies',
    driversVi: 'Liam Lawson #30 · Arvid Lindblad #41',
    driversEn: 'Liam Lawson #30 · Arvid Lindblad #41',
    bodyColor: '#1434cb', // Royal Electric Metallic Blue
    noseColor: '#1434cb',
    engineCoverColor: '#1434cb',
    sidepodColor: '#1434cb',
    airboxColor: '#1434cb',
    endplateColor: '#121417',
    bodyRoughness: 0.14,
    bodyMetalness: 0.55, // Rich metallic flake
    bodyClearcoat: 1.0,
    wingColor: '#121417', // Carbon black wing with white CashApp DRS flap
    wingRoughness: 0.2,
    wingMetalness: 0.3,
    haloColor: '#1434cb',
    haloRoughness: 0.18,
    haloMetalness: 0.45,
    floorColor: '#0a0c10',
    accentColor: '#ffffff',
    highlightColor: '#d90429', // Orlen Red
    wheelCoverColor: '#0e2270', // Metallic Royal Blue disc
    wheelAccentColor: '#ffffff', // Crisp Pure White Bull perimeter ring
    wheelSecondaryColor: '#d90429', // Racing Red inner ring
    wheelRimColor: '#ffffff', // White rim flange
    wheelPirelliCompound: 'medium',
    mirrorColor: '#1434cb', // Royal Electric Blue mirror housing
    mirrorAccentColor: '#ffffff', // Crisp Pure White aero accent
    floorEdgeAccentColor: '#ffffff', // Clean White floor edge stripe
    seatbeltColor: '#1434cb', // Royal Blue racing harness
    diffuserAccentColor: '#d90429', // Orlen Racing Red diffuser strakes
    rainLightColor: '#ff0033', // FIA Ruby Red Rain Light
    aeroPhilosophyVi:
      'Thừa hưởng cấu trúc hình học hệ thống treo và khí động học tương đồng với cỗ máy vô địch RB20 của đội mẹ Red Bull Racing.',
    aeroPhilosophyEn:
      'Direct aerodynamic and suspension synergy sharing proven pull-rod and floor concepts with the sister Red Bull Racing outfit.',
    powertrainNoteVi:
      'Trang bị khối động cơ Honda RBPTH002 cùng hệ thống thu hồi năng lượng hybrid đồng nhất với Oracle Red Bull Racing.',
    powertrainNoteEn:
      'Powered by the championship-winning Honda RBPTH002 hybrid unit alongside matched Red Bull transmission components.',
    schematicImage: '/images/showroom/schematics/racingbulls.webp',
    schematicCode: 'VCARB-01-FAENZA-8K',
    schematicTitleVi: 'Sơ đồ CAD khí động học 8K Visa Cash App RB VCARB 01',
    schematicTitleEn: 'Visa Cash App RB 01 8K Chassis & Aero Schematic',
  },

  haas: {
    teamId: 'haas',
    teamName: 'Haas',
    fullName: 'MoneyGram Haas F1 Team',
    carModelName: 'Haas VF-25 / VF-26',
    shortCarName: 'VF-25',
    carImage: '/images/teams/haas.webp',
    powerUnit: 'Ferrari 066/12 1.6L V6 Turbo Hybrid',
    powerUnitSupplier: 'Scuderia Ferrari (Maranello Customer)',
    engineOutput: '1,050+ HP · Hộp số & Hệ thống treo Ferrari',
    base: 'Kannapolis, United States / Banbury, UK',
    teamPrincipal: 'Ayao Komatsu',
    driversVi: 'Esteban Ocon #31 · Oliver Bearman #87',
    driversEn: 'Esteban Ocon #31 · Oliver Bearman #87',
    bodyColor: '#ffffff', // Crisp Racing White
    noseColor: '#ffffff',
    engineCoverColor: '#121417', // Carbon black
    sidepodColor: '#121417', // Carbon black with huge red MoneyGram logo
    airboxColor: '#121417',
    endplateColor: '#121417',
    bodyRoughness: 0.18,
    bodyMetalness: 0.25,
    bodyClearcoat: 1.0,
    wingColor: '#121417', // Carbon black with red/white Haas DRS flap
    wingRoughness: 0.22,
    wingMetalness: 0.3,
    haloColor: '#ffffff', // Clean White Halo
    haloRoughness: 0.2,
    haloMetalness: 0.25,
    floorColor: '#0a0c0e',
    accentColor: '#e10600', // Haas Red
    highlightColor: '#ffffff',
    wheelCoverColor: '#181b20', // Matte Carbon disc
    wheelAccentColor: '#e10600', // Haas Racing Red perimeter band
    wheelSecondaryColor: '#ffffff', // Clean White racing ring
    wheelRimColor: '#ffffff', // White BBS rim edge
    wheelPirelliCompound: 'soft',
    mirrorColor: '#ffffff', // Racing White mirror housing
    mirrorAccentColor: '#e10600', // Haas Racing Red aero accent
    floorEdgeAccentColor: '#e10600', // MoneyGram Red floor edge stripe
    seatbeltColor: '#e10600', // Haas Racing Red harness
    diffuserAccentColor: '#e10600', // Haas Red diffuser strakes
    rainLightColor: '#ff0033', // FIA Ruby Red Rain Light
    aeroPhilosophyVi:
      'Triết lý khí động học theo trường phái Downwash của Ferrari, tối ưu hóa việc dẫn gió làm mát và giải quyết hiện tượng thoái hóa lốp.',
    aeroPhilosophyEn:
      'Ferrari-aligned downwash aero concept focusing on tyre-deg preservation and consistent aerodynamic platform balance.',
    powertrainNoteVi:
      'Sử dụng toàn bộ cụm động cơ đốt trong, mô-tơ MGU-K và hộp số 8 cấp được cung cấp trực tiếp từ đại bản doanh Maranello của Ferrari.',
    powertrainNoteEn:
      'Propelled by Ferrari’s works 066/12 hybrid powertrain and rear-end mechanical assembly straight from Maranello.',
    schematicImage: '/images/showroom/schematics/haas.webp',
    schematicCode: 'HAAS-VF24-SPEC-8K',
    schematicTitleVi: 'Sơ đồ CAD khí động học 8K MoneyGram Haas VF-24 / VF-25',
    schematicTitleEn: 'MoneyGram Haas F1 Team VF-24 8K Chassis Schematic',
  },

  williams: {
    teamId: 'williams',
    teamName: 'Williams',
    fullName: 'Williams Racing',
    carModelName: 'Williams FW47 / FW48',
    shortCarName: 'FW47',
    carImage: '/images/teams/williams.webp',
    powerUnit: 'Mercedes-AMG M15 1.6L V6 Turbo Hybrid',
    powerUnitSupplier: 'Mercedes-AMG HPP (Grove Customer)',
    engineOutput: '1,050+ HP · Hệ thống truyền động Mercedes 8 cấp',
    base: 'Grove, United Kingdom',
    teamPrincipal: 'James Vowles',
    driversVi: 'Carlos Sainz #55 · Alex Albon #23',
    driversEn: 'Carlos Sainz #55 · Alex Albon #23',
    bodyColor: '#001f54', // Official Williams Deep Royal Navy Blue
    noseColor: '#001f54',
    engineCoverColor: '#001f54',
    sidepodColor: '#001f54',
    airboxColor: '#b87333', // Iconic Metallic Copper Duracell Battery Scoop
    endplateColor: '#001f54',
    bodyRoughness: 0.16,
    bodyMetalness: 0.45,
    bodyClearcoat: 1.0,
    wingColor: '#0a111a', // Carbon black with cyan Williams Racing DRS flap
    wingRoughness: 0.2,
    wingMetalness: 0.3,
    haloColor: '#001f54',
    haloRoughness: 0.2,
    haloMetalness: 0.4,
    floorColor: '#080b0f',
    accentColor: '#00a3e0', // Cyan Blue
    highlightColor: '#b87333', // Duracell Metallic Copper
    wheelCoverColor: '#00173d', // Williams Heritage Deep Navy disc
    wheelAccentColor: '#00a3e0', // Williams Electric Blue perimeter ring
    wheelSecondaryColor: '#ffffff', // White aerodynamic ring
    wheelRimColor: '#00a3e0', // Electric Blue rim lip
    wheelPirelliCompound: 'medium',
    mirrorColor: '#001f54', // Williams Deep Navy mirror housing
    mirrorAccentColor: '#00a3e0', // Electric Cyan aero accent
    floorEdgeAccentColor: '#00a3e0', // Electric Cyan floor edge stripe
    seatbeltColor: '#005aff', // Williams Heritage Blue harness
    diffuserAccentColor: '#00a3e0', // Electric Cyan diffuser strakes
    rainLightColor: '#ff0033', // FIA Ruby Red Rain Light
    aeroPhilosophyVi:
      'Thân xe thiết kế cho tốc độ đường thẳng vượt trội, kết hợp sàn xe thế hệ mới giảm độ nhạy cảm trước gió tạt ngang góc cua.',
    aeroPhilosophyEn:
      'Renowned straight-line velocity pedigree coupled with modernized floor fences forgiving in sudden crosswind conditions.',
    powertrainNoteVi:
      'Động cơ Mercedes-AMG M15 cung cấp sức kéo uy mãnh và độ tin cậy cơ học cao giúp đội đua Grove cạnh tranh vị trí top đầu.',
    powertrainNoteEn:
      'Mercedes-AMG M15 power unit delivering relentless torque delivery and unmatched mechanical reliability for the Grove team.',
    schematicImage: '/images/showroom/schematics/williams.webp',
    schematicCode: 'WIL-FW46-GROVE-8K',
    schematicTitleVi: 'Sơ đồ CAD khí động học 8K Williams Racing FW46 / FW47',
    schematicTitleEn: 'Williams Racing FW46 8K CAD Chassis & Aero Flow Blueprint',
  },

  audi: {
    teamId: 'audi',
    teamName: 'Audi',
    fullName: 'Audi Formula One Team (Stake Sauber)',
    carModelName: 'Audi F1 R26 / Sauber C44',
    shortCarName: 'C44',
    carImage: '/images/teams/audi.webp',
    powerUnit: 'Ferrari 066/12 / Audi Sport F1 Power Unit',
    powerUnitSupplier: 'Audi Motorsport / Sauber Motorsport',
    engineOutput: '1,050+ HP · Khung gầm Carbon Hinwil',
    base: 'Hinwil, Switzerland / Neuburg, Germany',
    teamPrincipal: 'Mattia Binotto',
    driversVi: 'Nico Hülkenberg #27 · Gabriel Bortoleto #5',
    driversEn: 'Nico Hülkenberg #27 · Gabriel Bortoleto #5',
    bodyColor: '#52ff00', // Fluo Racing Green (BASF R-M AGILIS spec)
    noseColor: '#0d0e11', // Carbon black with Fluo Green center wedge
    engineCoverColor: '#0d0e11', // Carbon black with Audi rings
    sidepodColor: '#0d0e11', // Carbon black with Fluo Green sweep & Stake logo
    airboxColor: '#0d0e11',
    endplateColor: '#52ff00', // Fluo Green endplates
    bodyRoughness: 0.16,
    bodyMetalness: 0.35,
    bodyClearcoat: 1.0,
    wingColor: '#52ff00', // Fluo Green wings
    wingRoughness: 0.2,
    wingMetalness: 0.3,
    haloColor: '#0d0e11', // Carbon black
    haloRoughness: 0.22,
    haloMetalness: 0.3,
    floorColor: '#080a0c',
    accentColor: '#52ff00', // Fluo Racing Green
    highlightColor: '#ffffff',
    wheelCoverColor: '#16191d', // Titanium & Carbon disc
    wheelAccentColor: '#52ff00', // Audi Revolut Neon Green/Red perimeter ring
    wheelSecondaryColor: '#c4c9ce', // Titanium Silver concentric ring
    wheelRimColor: '#c4c9ce', // Titanium Silver rim flange
    wheelPirelliCompound: 'soft',
    mirrorColor: '#0d0e11', // Stealth Carbon mirror housing
    mirrorAccentColor: '#52ff00', // Fluo Racing Green aero accent
    floorEdgeAccentColor: '#52ff00', // Fluo Racing Green floor edge stripe
    seatbeltColor: '#52ff00', // Neon Green racing harness
    diffuserAccentColor: '#52ff00', // Fluo Green diffuser strakes
    rainLightColor: '#ff0033', // FIA Ruby Red Rain Light
    aeroPhilosophyVi:
      'Triết lý "Vorsprung durch Technik": Thiết kế khí động học sắc bén nguyên khối phát triển song song tại Hinwil và Neuburg.',
    aeroPhilosophyEn:
      'Vorsprung durch Technik: Ultra-sharp monolithic aerodynamic surfaces refined in Hinwil’s state-of-the-art wind tunnel.',
    powertrainNoteVi:
      'Cột mốc lịch sử khi Audi tự nghiên cứu và chế tạo toàn bộ khối động cơ Turbo Hybrid tại Neuburg phục vụ kỷ nguyên F1.',
    powertrainNoteEn:
      'Audi’s historic all-new factory power unit engineered from the ground up at the Competence Center Motorsport in Neuburg.',
    schematicImage: '/images/showroom/schematics/audi.webp',
    schematicCode: 'AUDI-R26-NEUBURG-8K',
    schematicTitleVi: 'Sơ đồ CAD khí động học 8K Audi F1 Team (Neuburg Spec)',
    schematicTitleEn: 'Audi Sport F1 Power Unit & Aero 8K Schematic (RS F1-01)',
  },

  cadillac: {
    teamId: 'cadillac',
    teamName: 'Cadillac',
    fullName: 'Cadillac Formula 1 Team',
    carModelName: 'Cadillac MAC-26',
    shortCarName: 'MAC-26',
    carImage: '/images/teams/cadillac.webp',
    powerUnit: 'Ferrari 066/12 / GM F1 Twin-Turbo V6 Hybrid',
    powerUnitSupplier: 'General Motors / Cadillac Racing',
    engineOutput: '1,050+ HP · Hợp tác động cơ Maranello & GM',
    base: 'Fishers, Indiana, United States / Silverstone, UK',
    teamPrincipal: 'Michael Andretti',
    driversVi: 'Sergio Pérez #11 · Valtteri Bottas #77',
    driversEn: 'Sergio Pérez #11 · Valtteri Bottas #77',
    bodyColor: '#0a0b0d', // Satin Velvet Carbon Black
    noseColor: '#0a0b0d',
    engineCoverColor: '#0a0b0d',
    sidepodColor: '#0a0b0d',
    airboxColor: '#0a0b0d',
    endplateColor: '#0a0b0d',
    bodyRoughness: 0.38,
    bodyMetalness: 0.3,
    bodyClearcoat: 0.3,
    wingColor: '#0a0b0d', // Carbon black wing with Cadillac gold crests
    wingRoughness: 0.22,
    wingMetalness: 0.45,
    haloColor: '#0a0b0d',
    haloRoughness: 0.25,
    haloMetalness: 0.4,
    floorColor: '#08090a',
    accentColor: '#cda851', // Metallic Olympic Gold
    highlightColor: '#cda851',
    wheelCoverColor: '#0a0b0d', // Luxury Obsidian Metallic Black disc
    wheelAccentColor: '#cda851', // Imperial Champagne Gold perimeter ring
    wheelSecondaryColor: '#ffffff', // Pure White concentric ring
    wheelRimColor: '#cda851', // Champagne Gold BBS rim lip
    wheelPirelliCompound: 'medium',
    mirrorColor: '#0a0b0d', // Satin Obsidian Black mirror housing
    mirrorAccentColor: '#cda851', // Imperial Champagne Gold aero accent
    floorEdgeAccentColor: '#cda851', // Champagne Gold floor edge stripe
    seatbeltColor: '#cda851', // Cadillac Racing Gold harness
    diffuserAccentColor: '#cda851', // Champagne Gold diffuser strakes
    rainLightColor: '#ff0033', // FIA Ruby Red Rain Light
    aeroPhilosophyVi:
      'Thiết kế khí động học mang đậm phong cách cơ bắp Mỹ với cánh gió trước hình khiên và hốc gió tản nhiệt cỡ lớn.',
    aeroPhilosophyEn:
      'Bold American motorsport aerodynamic identity incorporating high-authority front wing planes and aggressive radiator gills.',
    powertrainNoteVi:
      'Khởi đầu với sự kết hợp động cơ Ferrari và dần chuyển giao công nghệ sang động cơ GM F1 Twin-Turbo tự phát triển.',
    powertrainNoteEn:
      'Debuting with proven Maranello hybrid power while developing GM’s dedicated American factory F1 power unit.',
    schematicImage: '/images/showroom/schematics/cadillac.webp',
    schematicCode: 'CAD-MAC26-USA-8K',
    schematicTitleVi: 'Sơ đồ CAD khí động học 8K Cadillac F1 Team MAC-26',
    schematicTitleEn: 'Cadillac F1 Chassis & Aerodynamic 8K Schematic (MAC-26)',
  },
};

export const getTeam3DLivery = (teamId: TeamId): Team3DLivery => {
  return TEAM_3D_LIVERIES[teamId] || TEAM_3D_LIVERIES.ferrari;
};
