import { CarSpec } from '../../types';
import { getOriginalTeamVisualAsset } from '../../config/originalVisualAssets';
import { createCatalogCar } from './catalogEntry';

export const CARS_2026: CarSpec[] = [
  {
    id: 'cadillac-mac26',
    season: 2026,
    teamId: 'cadillac',
    name: 'Cadillac MAC-26',
    shortName: 'MAC-26',
    powerUnit: 'Ferrari 2026 power unit (Cadillac customer team)',
    drivers: ['Sergio Pérez #11', 'Valtteri Bottas #77'],
    primaryColor: '#8a8d8f',
    accentColor: '#d4af37',
    highlightColor: '#09090b',
    officialSpecs: {
      minWeightKg: 768,
      engineConfig: '1.6L V6 Turbo + 350kW Electric MGU-K (50/50 Split)',
      displacementLiters: 1.6,
      gearbox: 'Cadillac 8-speed semi-automatic',
      wheelSizeInch: 18,
      fuelCapacityKg: 100, // 100% Advanced Sustainable Fuel
    },
    technicalHighlights: {
      frontSuspension: 'Active aerodynamic push-rod kinematics',
      rearSuspension: 'Integrated carbon push-rod',
      aeroPhilosophy:
        'Quy chuẩn 2026: Cánh gió chủ động Active Aero (X-Mode đường thẳng & Z-Mode vào cua).',
      groundEffectNotes:
        'Sàn xe phẳng hơn theo luật 2026 nhằm giảm tối đa luồng khí nhiễu (dirty air) cho xe bám đuổi.',
      chassisConstruction: 'Ultra-rigid carbon honeycomb meeting 2026 FIA impact limits',
    },
    descriptionVi:
      'Mẫu xe đầu tiên của Cadillac tại Formula 1, do Sergio Pérez và Valtteri Bottas cầm lái.',
    descriptionEn: 'Cadillac’s debut Formula 1 car, driven by Sergio Pérez and Valtteri Bottas.',
    heroImage: getOriginalTeamVisualAsset('cadillac'),
    studioImage: getOriginalTeamVisualAsset('cadillac'),
    has3DModel: true,
    model3DId: 'cadillac',
  },
  {
    id: 'sf26',
    season: 2026,
    teamId: 'ferrari',
    name: 'Ferrari SF-26',
    shortName: 'SF-26',
    designer: 'Loïc Serra & Diego Tondi',
    powerUnit: 'Ferrari 067/1 1.6L V6 Turbo Hybrid (100% Sustainable Fuel)',
    drivers: ['Charles Leclerc #16', 'Lewis Hamilton #44'],
    primaryColor: '#e80020',
    accentColor: '#ffffff',
    highlightColor: '#ffe500',
    officialSpecs: {
      minWeightKg: 768,
      engineConfig: '1.6L Turbo Hybrid + 350kW MGU-K',
      displacementLiters: 1.6,
      gearbox: 'Ferrari 8-speed transverse gearbox',
      wheelSizeInch: 18,
      fuelCapacityKg: 100,
    },
    technicalHighlights: {
      frontSuspension: 'Push-rod with integrated steering actuator',
      rearSuspension: 'Compact pull-rod aero packaging',
      aeroPhilosophy:
        'Hệ thống cánh trước và cánh sau chuyển đổi chủ động Z-Mode / X-Mode điều khiển điện tử.',
      groundEffectNotes:
        'Thiết kế đáy sàn thu gọn 100mm theo tiêu chuẩn FIA 2026, triệt tiêu vệt khí cuộn sau đuôi xe.',
      chassisConstruction: 'Scuderia Ferrari lightweight modular carbon cell',
    },
    descriptionVi:
      'Siêu phẩm kỷ nguyên động cơ 2026 của Maranello, tối đa hóa sức mạnh điện 350kW và hệ thống cánh gió chủ động thích ứng.',
    descriptionEn:
      'Ferrari’s flagship for the 2026 technical reset, unleashing 350kW electric power with active aerodynamic wings.',
    heroImage: getOriginalTeamVisualAsset('ferrari'),
    studioImage: getOriginalTeamVisualAsset('ferrari'),
    has3DModel: true,
    model3DId: 'sf24',
  },
  {
    id: 'mcl40',
    season: 2026,
    teamId: 'mclaren',
    name: 'McLaren MCL40',
    shortName: 'MCL40',
    designer: 'Rob Marshall & Peter Prodromou',
    powerUnit: 'Mercedes-AMG High Performance Powertrains 2026',
    drivers: ['Lando Norris #4', 'Oscar Piastri #81'],
    primaryColor: '#ff8000',
    accentColor: '#47c7fc',
    highlightColor: '#141416',
    officialSpecs: {
      minWeightKg: 768,
      engineConfig: '1.6L Turbo Hybrid + 350kW Electric Recovery',
      displacementLiters: 1.6,
      gearbox: '8-speed carbon-cased transmission',
      wheelSizeInch: 18,
      fuelCapacityKg: 100,
    },
    technicalHighlights: {
      frontSuspension: 'Pull-rod next-gen front geometry',
      rearSuspension: 'Push-rod multi-link',
      aeroPhilosophy:
        'Triết lý khí động học hẹp hơn 100mm, giảm 30% lực cản tổng thể khi kích hoạt chế độ X-Mode.',
      groundEffectNotes:
        'Bộ khuếch tán gầm sau thu nhỏ theo quy chuẩn mới, gia tăng cơ hội vượt xe cận chiến.',
      chassisConstruction: 'Molded carbon fiber composite monocoque',
    },
    descriptionVi:
      'Cỗ máy kỷ niệm 40 năm dòng xe MCL lừng lẫy của McLaren, trang bị động cơ hybrid tương lai và hệ thống cánh gió chủ động.',
    descriptionEn:
      'McLaren’s 2026 milestone challenger engineered for wheel-to-wheel combat under the agile car concept.',
    heroImage: getOriginalTeamVisualAsset('mclaren'),
    studioImage: getOriginalTeamVisualAsset('mclaren'),
    has3DModel: true,
    model3DId: 'mcl38',
  },
  {
    id: 'rb22',
    season: 2026,
    teamId: 'redbull',
    name: 'Red Bull Racing RB22 (Red Bull Ford Powertrains)',
    shortName: 'RB22',
    designer: 'Pierre Waché & Red Bull Powertrains-Ford',
    powerUnit: 'Red Bull Ford 1.6L V6 Turbo Hybrid',
    drivers: ['Max Verstappen #1', 'Isack Hadjar #6'],
    primaryColor: '#0600ef',
    accentColor: '#cc1e4a',
    highlightColor: '#fcd700',
    officialSpecs: {
      minWeightKg: 768,
      engineConfig: '1.6L Turbo V6 + Red Bull Ford 350kW E-Motor',
      displacementLiters: 1.6,
      gearbox: 'Red Bull Technology 8-speed',
      wheelSizeInch: 18,
      fuelCapacityKg: 100,
    },
    technicalHighlights: {
      frontSuspension: 'Pull-rod high anti-dive',
      rearSuspension: 'Push-rod aero-profiled',
      aeroPhilosophy: 'Hốc gió khí động học tích hợp tối ưu làm mát động cơ điện công suất lớn.',
      groundEffectNotes: 'Sàn xe thế hệ mới thích ứng tức thời theo trạng thái cánh gió chủ động.',
      chassisConstruction: 'Red Bull carbon composite sandwich',
    },
    descriptionVi:
      'Khởi đầu lịch sử của liên minh Red Bull Ford Powertrains, cỗ máy tốc độ bước vào kỷ nguyên quy chuẩn 2026.',
    descriptionEn:
      'The dawn of Red Bull Ford Powertrains, uniting bespoke chassis architecture with an all-new factory power unit.',
    heroImage: getOriginalTeamVisualAsset('redbull'),
    studioImage: getOriginalTeamVisualAsset('redbull'),
    has3DModel: true,
    model3DId: 'rb20',
  },
  {
    id: 'w17',
    season: 2026,
    teamId: 'mercedes',
    name: 'Mercedes-AMG F1 W17 E Performance',
    shortName: 'W17',
    designer: 'James Allison & John Owen',
    powerUnit: 'Mercedes-AMG HPP 1.6L V6 Turbo Hybrid 2026',
    drivers: ['George Russell #63', 'Kimi Antonelli #12'],
    primaryColor: '#00a19c',
    accentColor: '#c0c0c0',
    highlightColor: '#eb142b',
    officialSpecs: {
      minWeightKg: 768,
      engineConfig: '1.6L Turbo Hybrid + 350kW MGU-K',
      displacementLiters: 1.6,
      gearbox: 'Mercedes 8-speed seamless',
      wheelSizeInch: 18,
      fuelCapacityKg: 100,
    },
    technicalHighlights: {
      frontSuspension: 'Push-rod anti-dive',
      rearSuspension: 'Push-rod inboard dampers',
      aeroPhilosophy:
        'Khí động học thích ứng thông minh (Active Aero) với khả năng triệt tiêu lực cản tối đa trên đường thẳng.',
      groundEffectNotes:
        'Kiểm soát luồng khí gầm xe đồng bộ hoàn toàn với hệ thống thu hồi năng lượng điện.',
      chassisConstruction: 'High-strength carbon composite',
    },
    descriptionVi:
      'Cỗ máy Mũi Tên Bạc đại diện cho đỉnh cao nghiên cứu động cơ hybrid bền vững 2026 của Mercedes-AMG.',
    descriptionEn:
      'The Silver Arrow spearheading Mercedes-AMG’s 2026 power unit revolution and agile aero architecture.',
    heroImage: getOriginalTeamVisualAsset('mercedes'),
    studioImage: getOriginalTeamVisualAsset('mercedes'),
    has3DModel: true,
    model3DId: 'w15',
  },
  {
    id: 'audi-r26',
    season: 2026,
    teamId: 'audi',
    name: 'Audi F1 R26 Factory Works',
    shortName: 'Audi R26',
    designer: 'Mattia Binotto & James Key',
    powerUnit: 'Audi Sport F1 Neuburg 1.6L V6 Hybrid',
    drivers: ['Nico Hülkenberg #27', 'Gabriel Bortoleto #5'],
    primaryColor: '#f50537',
    accentColor: '#e5e7eb',
    highlightColor: '#1c1917',
    officialSpecs: {
      minWeightKg: 768,
      engineConfig: 'Audi Neuburg 1.6L Turbo V6 + 350kW Hybrid',
      displacementLiters: 1.6,
      gearbox: 'Audi Sport 8-speed',
      wheelSizeInch: 18,
      fuelCapacityKg: 100,
    },
    technicalHighlights: {
      frontSuspension: 'Push-rod German precision kinematics',
      rearSuspension: 'Push-rod',
      aeroPhilosophy:
        'Vorsprung durch Technik: Thiết kế nguyên khối sắc sảo tối ưu hóa cho hệ quy chuẩn 2026.',
      groundEffectNotes: 'Đường hầm gầm khí động học phát triển tại Neuburg và Hinwil.',
      chassisConstruction: 'Audi carbon fibre composite',
    },
    descriptionVi:
      'Màn xuất trận lịch sử của Audi với tư cách đội đua xuất xưởng chính thức tại Formula 1.',
    descriptionEn:
      'Audi’s historic factory works debut in Formula 1 with bespoke chassis and German-engineered powertrain.',
    heroImage: getOriginalTeamVisualAsset('audi'),
    studioImage: getOriginalTeamVisualAsset('audi'),
    has3DModel: true,
    model3DId: 'audi',
  },
  createCatalogCar(2026, 'astonmartin', 'Aston Martin AMR26', 'AMR26', 'Honda', [
    'Fernando Alonso #14',
    'Lance Stroll #18',
  ]),
  createCatalogCar(2026, 'alpine', 'Alpine A526', 'A526', 'Mercedes', [
    'Pierre Gasly #10',
    'Franco Colapinto #43',
  ]),
  createCatalogCar(2026, 'racingbulls', 'Racing Bulls VCARB 03', 'VCARB 03', 'Red Bull Ford', [
    'Liam Lawson #30',
    'Arvid Lindblad #41',
  ]),
  createCatalogCar(2026, 'haas', 'TGR Haas VF-26', 'VF-26', 'Ferrari', [
    'Esteban Ocon #31',
    'Oliver Bearman #87',
  ]),
  createCatalogCar(2026, 'williams', 'Atlassian Williams FW48', 'FW48', 'Mercedes', [
    'Carlos Sainz #55',
    'Alexander Albon #23',
  ]),
];
