export interface ModelBLivery {
  id: string;
  name: string;
  nameVi: string;
  primary: string;
  secondary: string;
  accent: string;
  carbon: string;
  finish: 'gloss' | 'satin';
  roughness: number;
  metalness: number;
  clearcoat: number;
}

export const MODEL_B_LIVERIES: ModelBLivery[] = [
  { id: 'graphite', name: 'EDS Graphite', nameVi: 'EDS Graphite', primary: '#343a43', secondary: '#59616c', accent: '#cf2539', carbon: '#101318', finish: 'satin', roughness: 0.32, metalness: 0.52, clearcoat: 0.5 },
  { id: 'scarlet-velocity', name: 'Scarlet Velocity', nameVi: 'Scarlet Velocity', primary: '#bd202d', secondary: '#e8e1d5', accent: '#f1eee8', carbon: '#101318', finish: 'gloss', roughness: 0.27, metalness: 0.38, clearcoat: 0.62 },
  { id: 'papaya-rush', name: 'Papaya Rush', nameVi: 'Papaya Rush', primary: '#ed7828', secondary: '#353b43', accent: '#f7a05a', carbon: '#101318', finish: 'gloss', roughness: 0.3, metalness: 0.35, clearcoat: 0.58 },
  { id: 'silver-pulse', name: 'Silver Pulse', nameVi: 'Silver Pulse', primary: '#afb9c1', secondary: '#161e25', accent: '#25b7b2', carbon: '#101318', finish: 'satin', roughness: 0.34, metalness: 0.7, clearcoat: 0.4 },
  { id: 'midnight-apex', name: 'Midnight Apex', nameVi: 'Midnight Apex', primary: '#182d54', secondary: '#a48539', accent: '#b83c4b', carbon: '#101318', finish: 'gloss', roughness: 0.29, metalness: 0.43, clearcoat: 0.56 },
  { id: 'emerald-circuit', name: 'Emerald Circuit', nameVi: 'Emerald Circuit', primary: '#205f4e', secondary: '#2e403c', accent: '#a3cb43', carbon: '#101318', finish: 'gloss', roughness: 0.3, metalness: 0.4, clearcoat: 0.55 },
  { id: 'alpine-flux', name: 'Alpine Flux', nameVi: 'Alpine Flux', primary: '#2163d3', secondary: '#162447', accent: '#e58ab4', carbon: '#101318', finish: 'gloss', roughness: 0.29, metalness: 0.4, clearcoat: 0.56 },
  { id: 'royal-velocity', name: 'Royal Velocity', nameVi: 'Royal Velocity', primary: '#2e4aca', secondary: '#162342', accent: '#bcc7d3', carbon: '#101318', finish: 'gloss', roughness: 0.28, metalness: 0.43, clearcoat: 0.55 },
  { id: 'arctic-sprint', name: 'Arctic Sprint', nameVi: 'Arctic Sprint', primary: '#e9edf0', secondary: '#204d9b', accent: '#152845', carbon: '#101318', finish: 'gloss', roughness: 0.31, metalness: 0.3, clearcoat: 0.5 },
  { id: 'titanium-strike', name: 'Titanium Strike', nameVi: 'Titanium Strike', primary: '#87929b', secondary: '#393c46', accent: '#c63047', carbon: '#101318', finish: 'satin', roughness: 0.38, metalness: 0.67, clearcoat: 0.36 },
  { id: 'white-vector', name: 'White Vector', nameVi: 'White Vector', primary: '#eef0ed', secondary: '#181b20', accent: '#c82d35', carbon: '#101318', finish: 'gloss', roughness: 0.29, metalness: 0.28, clearcoat: 0.6 },
  { id: 'monochrome-gt', name: 'Monochrome GT', nameVi: 'Monochrome GT', primary: '#eceeec', secondary: '#474c52', accent: '#acb4bb', carbon: '#101318', finish: 'satin', roughness: 0.36, metalness: 0.43, clearcoat: 0.35 },
];

export interface ModelBHotspot {
  id: string;
  nameEn: string;
  nameVi: string;
  summaryEn: string;
  summaryVi: string;
  position: [number, number, number];
  cameraPos: [number, number, number];
  cameraTarget: [number, number, number];
}

// Approximate educational anchors on a single mesh; these are not independently selectable assemblies.
export const MODEL_B_HOTSPOTS: ModelBHotspot[] = [
  { id: 'front-wing', nameEn: 'Front wing', nameVi: 'Cánh gió trước', summaryEn: 'The front wing conditions airflow and helps generate front-axle downforce.', summaryVi: 'Cánh gió trước điều hướng luồng khí và góp phần tạo lực ép cho trục trước.', position: [0.8, 0.34, -2.18], cameraPos: [1.5, 1.0, -3.4], cameraTarget: [0, 0.35, -1.9] },
  { id: 'sidepods', nameEn: 'Sidepods', nameVi: 'Hông xe', summaryEn: 'The sidepod surfaces guide airflow around the chassis and cooling inlets.', summaryVi: 'Bề mặt hông xe dẫn luồng khí quanh thân và các cửa lấy gió làm mát.', position: [0.72, 0.72, -0.18], cameraPos: [3.6, 1.35, -0.35], cameraTarget: [0.3, 0.55, -0.25] },
  { id: 'floor', nameEn: 'Floor / ground effect', nameVi: 'Sàn / hiệu ứng mặt đất', summaryEn: 'The underfloor helps accelerate airflow beneath the car to create suction.', summaryVi: 'Sàn xe tăng tốc luồng khí bên dưới để tạo lực hút xuống mặt đường.', position: [0.7, 0.18, 0.55], cameraPos: [3.4, 0.8, 0.7], cameraTarget: [0.3, 0.22, 0.45] },
  { id: 'diffuser', nameEn: 'Diffuser', nameVi: 'Bộ khuếch tán', summaryEn: 'The rear diffuser expands the underfloor airflow and supports downforce.', summaryVi: 'Bộ khuếch tán phía sau mở rộng luồng khí dưới sàn, hỗ trợ lực ép.', position: [0, 0.24, 2.08], cameraPos: [1.8, 0.85, 3.35], cameraTarget: [0, 0.28, 1.8] },
  { id: 'halo', nameEn: 'Halo', nameVi: 'Vòng bảo vệ Halo', summaryEn: 'The halo is a cockpit protection structure surrounding the driver.', summaryVi: 'Halo là kết cấu bảo vệ buồng lái bao quanh tay đua.', position: [0, 1.22, -0.17], cameraPos: [1.5, 1.85, -0.9], cameraTarget: [0, 0.85, -0.1] },
  { id: 'rear-wing', nameEn: 'Rear wing', nameVi: 'Cánh gió sau', summaryEn: 'The rear wing contributes rear-axle downforce; this static model does not animate DRS.', summaryVi: 'Cánh gió sau tạo lực ép trục sau; mô hình tĩnh này không mô phỏng DRS.', position: [0, 1.1, 2.1], cameraPos: [1.8, 1.45, 3.3], cameraTarget: [0, 0.95, 1.9] },
  { id: 'suspension', nameEn: 'Suspension', nameVi: 'Hệ thống treo', summaryEn: 'The suspension links the wheels to the chassis and manages wheel movement.', summaryVi: 'Hệ thống treo liên kết bánh xe với thân xe và kiểm soát chuyển động bánh.', position: [0.98, 0.38, -1.5], cameraPos: [2.9, 1.1, -2.2], cameraTarget: [0.85, 0.42, -1.4] },
];
