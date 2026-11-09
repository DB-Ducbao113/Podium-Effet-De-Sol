export const EDS_LIVERY_IDS = [
  'eds-carbon',
  'eds-aero',
  'eds-crimson',
  'eds-monochrome',
  'eds-gold',
  'eds-electric',
] as const;

export type EDSLiveryId = (typeof EDS_LIVERY_IDS)[number];

export interface EDSLiveryPreset {
  id: EDSLiveryId;
  name: string;
  nameVi: string;
  primary: string;
  secondary: string;
  accent: string;
  roughness: number;
  metalness: number;
  clearcoat: number;
}

export const EDS_LIVERIES: Record<EDSLiveryId, EDSLiveryPreset> = {
  'eds-carbon': {
    id: 'eds-carbon',
    name: 'Carbon Heritage',
    nameVi: 'Di sản Carbon',
    primary: '#101216',
    secondary: '#252b33',
    accent: '#94a3b8',
    roughness: 0.58,
    metalness: 0.25,
    clearcoat: 0.4,
  },
  'eds-aero': {
    id: 'eds-aero',
    name: 'Aero Velocity',
    nameVi: 'Khí động Tốc độ',
    primary: '#0a1128',
    secondary: '#101b3d',
    accent: '#00f0ff',
    roughness: 0.2,
    metalness: 0.52,
    clearcoat: 1,
  },
  'eds-crimson': {
    id: 'eds-crimson',
    name: 'Crimson Prototype',
    nameVi: 'Nguyên mẫu Đỏ',
    primary: '#d90429',
    secondary: '#7f0018',
    accent: '#ffffff',
    roughness: 0.14,
    metalness: 0.32,
    clearcoat: 1,
  },
  'eds-monochrome': {
    id: 'eds-monochrome',
    name: 'Studio Stealth',
    nameVi: 'Tàng hình Studio',
    primary: '#050505',
    secondary: '#20242a',
    accent: '#e2e8f0',
    roughness: 0.7,
    metalness: 0.18,
    clearcoat: 0.12,
  },
  'eds-gold': {
    id: 'eds-gold',
    name: 'Grand Prix Edition',
    nameVi: 'Phiên bản Grand Prix',
    primary: '#004b42',
    secondary: '#062f2b',
    accent: '#d4af37',
    roughness: 0.18,
    metalness: 0.68,
    clearcoat: 1,
  },
  'eds-electric': {
    id: 'eds-electric',
    name: 'Cyber Kinetic',
    nameVi: 'Động năng Điện',
    primary: '#1f2421',
    secondary: '#090c0a',
    accent: '#ccff00',
    roughness: 0.62,
    metalness: 0.35,
    clearcoat: 0.3,
  },
};

export const DEFAULT_EDS_LIVERY_ID: EDSLiveryId = 'eds-aero';

export const getEDSLivery = (id: EDSLiveryId): EDSLiveryPreset => EDS_LIVERIES[id];
