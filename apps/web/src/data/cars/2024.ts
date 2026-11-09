import { CarSpec } from '../../types';
import { getOriginalTeamVisualAsset } from '../../config/originalVisualAssets';
import { createCatalogCar } from './catalogEntry';

export const CARS_2024: CarSpec[] = [
  {
    id: 'rb20',
    season: 2024,
    teamId: 'redbull',
    name: 'Red Bull Racing RB20',
    shortName: 'RB20',
    designer: 'Adrian Newey & Pierre Waché',
    powerUnit: 'Honda RBPTH002 1.6L V6 Turbo Hybrid',
    drivers: ['Max Verstappen #1', 'Sergio Pérez #11'],
    primaryColor: '#0600ef',
    accentColor: '#cc1e4a',
    highlightColor: '#fcd700',
    officialSpecs: {
      minWeightKg: 798,
      engineConfig: '1.6L 90° V6 Turbocharged Hybrid',
      displacementLiters: 1.6,
      gearbox: '8-speed sequential semi-automatic + reverse',
      wheelSizeInch: 18,
      fuelCapacityKg: 110,
    },
    technicalHighlights: {
      frontSuspension: 'Pull-rod actuated wishbone & torsion spring',
      rearSuspension: 'Push-rod multi-link aerodynamic geometry',
      aeroPhilosophy: 'Hốc gió đảo ngược Overbite độc đáo kết hợp hai rãnh xả nhiệt lưng gù lớn.',
      groundEffectNotes:
        'Đường hầm Venturi đáy sàn tạo lực hút cực lớn với độ ổn định cao trên mọi dải tốc độ.',
      chassisConstruction: 'Molded carbon fiber composite monocoque honeycomb',
    },
    descriptionVi:
      'Cỗ máy vô địch thế giới 2024 với thiết kế khí động học cách mạng Overbite inlet và kiểm soát luồng khí tinh tế của Adrian Newey.',
    descriptionEn:
      'The 2024 Constructors and Drivers World Championship machine featuring revolutionary overbite air intakes and masterful underfloor management.',
    heroImage: getOriginalTeamVisualAsset('redbull'),
    studioImage: getOriginalTeamVisualAsset('redbull'),
    has3DModel: true,
    model3DId: 'rb20',
  },
  {
    id: 'mcl38',
    season: 2024,
    teamId: 'mclaren',
    name: 'McLaren MCL38',
    shortName: 'MCL38',
    designer: 'Rob Marshall & Peter Prodromou',
    powerUnit: 'Mercedes-AMG M15 1.6L V6 Turbo Hybrid',
    drivers: ['Lando Norris #4', 'Oscar Piastri #81'],
    primaryColor: '#ff8000',
    accentColor: '#47c7fc',
    highlightColor: '#141416',
    officialSpecs: {
      minWeightKg: 798,
      engineConfig: '1.6L 90° V6 Turbocharged Hybrid',
      displacementLiters: 1.6,
      gearbox: '8-speed sequential semi-automatic',
      wheelSizeInch: 18,
      fuelCapacityKg: 110,
    },
    technicalHighlights: {
      frontSuspension: 'Pull-rod front assembly',
      rearSuspension: 'Push-rod rear packaging',
      aeroPhilosophy: 'Thắt eo Coke-Bottle khí động học sâu với bề mặt carbon trần siêu nhẹ.',
      groundEffectNotes:
        'Sàn xe dải rộng mang lại độ bám đường đỉnh cao từ cua chậm đến cua tốc độ cao.',
      chassisConstruction: 'McLaren carbon-fibre composite monocoque',
    },
    descriptionVi:
      'Chiếc xe mang lại chức Vô địch Đội đua Thế giới 2024 cho McLaren với sự cân bằng hoàn hảo và tốc độ phát triển nâng cấp vượt bậc.',
    descriptionEn:
      'The car that secured the 2024 Constructors World Championship for McLaren through relentless development and aerodynamic balance.',
    heroImage: getOriginalTeamVisualAsset('mclaren'),
    studioImage: getOriginalTeamVisualAsset('mclaren'),
    has3DModel: true,
    model3DId: 'mcl38',
  },
  {
    id: 'sf24',
    season: 2024,
    teamId: 'ferrari',
    name: 'Ferrari SF-24',
    shortName: 'SF-24',
    designer: 'Enrico Cardile & Diego Tondi',
    powerUnit: 'Ferrari 066/12 1.6L V6 Turbo Hybrid',
    drivers: ['Charles Leclerc #16', 'Carlos Sainz #55'],
    primaryColor: '#e80020',
    accentColor: '#ffffff',
    highlightColor: '#ffe500',
    officialSpecs: {
      minWeightKg: 798,
      engineConfig: '1.6L 90° V6 Turbocharged Hybrid',
      displacementLiters: 1.6,
      gearbox: 'Ferrari 8-speed longitudinal semi-automatic',
      wheelSizeInch: 18,
      fuelCapacityKg: 110,
    },
    technicalHighlights: {
      frontSuspension: 'Push-rod wishbone',
      rearSuspension: 'Pull-rod compact configuration',
      aeroPhilosophy:
        'Máng trượt sidepod hạ thấp hướng luồng khí trực tiếp vào bộ dầm cánh sau beam wing.',
      groundEffectNotes:
        'Kênh Venturi dốc đều về bộ khuếch tán diffuser giữ lực ép ổn định khi xe phanh dốc.',
      chassisConstruction: 'Carbon-fibre and honeycomb composite structure',
    },
    descriptionVi:
      'SF-24 hồi sinh phong độ ấn tượng của Ferrari tại Monza, Monaco và Austin với khả năng giữ lốp và độ đầm chắc khi vào cua gắt.',
    descriptionEn:
      'The SF-24 delivered iconic victories at Monaco and Monza, offering exceptional ride stability and superior tire management.',
    heroImage: getOriginalTeamVisualAsset('ferrari'),
    studioImage: getOriginalTeamVisualAsset('ferrari'),
    has3DModel: true,
    model3DId: 'sf24',
  },
  {
    id: 'w15',
    season: 2024,
    teamId: 'mercedes',
    name: 'Mercedes-AMG F1 W15 E Performance',
    shortName: 'W15',
    designer: 'James Allison & John Owen',
    powerUnit: 'Mercedes-AMG M15 1.6L V6 Turbo Hybrid',
    drivers: ['George Russell #63', 'Lewis Hamilton #44'],
    primaryColor: '#00a19c',
    accentColor: '#c0c0c0',
    highlightColor: '#eb142b',
    officialSpecs: {
      minWeightKg: 798,
      engineConfig: '1.6L 90° V6 Turbocharged Hybrid',
      displacementLiters: 1.6,
      gearbox: 'Mercedes-AMG 8-speed sequential',
      wheelSizeInch: 18,
      fuelCapacityKg: 110,
    },
    technicalHighlights: {
      frontSuspension: 'Push-rod with anti-dive geometry',
      rearSuspension: 'Push-rod inboard spring damper',
      aeroPhilosophy:
        'Mũi xe Arrow vuốt nhọn, loại bỏ hoàn toàn triết lý zeropod cũ để đón nhận cấu trúc sidepod truyền thống.',
      groundEffectNotes:
        'Hầm Venturi cải tiến triệt tiêu hiện tượng nảy gầm porpoising của thế hệ trước.',
      chassisConstruction: 'Carbon-fibre and Kevlar composite monocoque',
    },
    descriptionVi:
      'Bước ngoặt kỹ thuật của Mercedes với việc tái thiết lập khung gầm và hệ thống treo, giành chiến thắng lịch sử tại Silverstone và Spa.',
    descriptionEn:
      'A pivotal technical reset for Mercedes, ditching previous experimental concepts in favor of aerodynamic predictability.',
    heroImage: getOriginalTeamVisualAsset('mercedes'),
    studioImage: getOriginalTeamVisualAsset('mercedes'),
    has3DModel: true,
    model3DId: 'w15',
  },
  createCatalogCar(2024, 'astonmartin', 'Aston Martin AMR24', 'AMR24', 'Mercedes', [
    'Fernando Alonso #14',
    'Lance Stroll #18',
  ]),
  createCatalogCar(2024, 'alpine', 'Alpine A524', 'A524', 'Renault', [
    'Pierre Gasly #10',
    'Jack Doohan #7',
  ]),
  createCatalogCar(2024, 'racingbulls', 'RB VCARB 01', 'VCARB 01', 'Honda RBPT', [
    'Yuki Tsunoda #22',
    'Liam Lawson #30',
  ]),
  createCatalogCar(2024, 'haas', 'MoneyGram Haas VF-24', 'VF-24', 'Ferrari', [
    'Nico Hülkenberg #27',
    'Kevin Magnussen #20',
  ]),
  createCatalogCar(2024, 'williams', 'Williams FW46', 'FW46', 'Mercedes', [
    'Alexander Albon #23',
    'Franco Colapinto #43',
  ]),
  createCatalogCar(2024, 'audi', 'Stake F1 Team Kick Sauber C44', 'C44', 'Ferrari', [
    'Valtteri Bottas #77',
    'Zhou Guanyu #24',
  ]),
];
