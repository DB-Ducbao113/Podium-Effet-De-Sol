import { TeamId } from '../../types';

export interface DriverNumber {
  number: string;
  name: string;
  code: string;
}

export interface TeamSponsorConfig {
  teamId: TeamId;
  teamName: string;
  primarySponsor: string;
  rearWingText: string;
  rearWingSub: string;
  rearWingBg: string;
  rearWingTextColor: string;
  rearWingAccent: string;
  sidepodText: string;
  sidepodSub: string;
  sidepodTextColor: string;
  engineCoverText: string;
  engineCoverLogo: string;
  haloText: string;
  noseSponsor: string;
  drivers: DriverNumber[];
  accentStripe: string;
}

export const TEAM_SPONSORS: Record<TeamId, TeamSponsorConfig> = {
  ferrari: {
    teamId: 'ferrari',
    teamName: 'Ferrari',
    primarySponsor: 'Scuderia Ferrari HP',
    rearWingText: 'Ferrari',
    rearWingSub: 'HP',
    rearWingBg: '#18181b',
    rearWingTextColor: '#ffffff',
    rearWingAccent: '#ffe500', // Modena Yellow
    sidepodText: 'HP',
    sidepodSub: 'Shell',
    sidepodTextColor: '#ffffff',
    engineCoverText: 'Cavallino',
    engineCoverLogo: '🐎',
    haloText: 'HP · FERRARI',
    noseSponsor: 'Shell',
    drivers: [
      { number: '16', name: 'Charles Leclerc', code: 'LEC' },
      { number: '44', name: 'Lewis Hamilton', code: 'HAM' },
    ],
    accentStripe: '#ffe500',
  },

  mercedes: {
    teamId: 'mercedes',
    teamName: 'Mercedes',
    primarySponsor: 'PETRONAS',
    rearWingText: 'PETRONAS',
    rearWingSub: 'PRIMAX',
    rearWingBg: '#090a0f',
    rearWingTextColor: '#00a19c', // Petronas Emerald
    rearWingAccent: '#e10600', // Ineos Red
    sidepodText: 'PETRONAS',
    sidepodSub: 'TeamViewer',
    sidepodTextColor: '#ffffff',
    engineCoverText: 'AMG',
    engineCoverLogo: '⭐',
    haloText: 'PETRONAS',
    noseSponsor: 'INEOS',
    drivers: [
      { number: '63', name: 'George Russell', code: 'RUS' },
      { number: '12', name: 'Kimi Antonelli', code: 'ANT' },
    ],
    accentStripe: '#00a19c',
  },

  redbull: {
    teamId: 'redbull',
    teamName: 'Red Bull',
    primarySponsor: 'Oracle Red Bull Racing',
    rearWingText: 'ORACLE',
    rearWingSub: 'RED BULL',
    rearWingBg: '#050714',
    rearWingTextColor: '#ffffff',
    rearWingAccent: '#ff1801',
    sidepodText: 'ORACLE',
    sidepodSub: 'BYBIT',
    sidepodTextColor: '#facc15', // Red Bull Racing Yellow
    engineCoverText: 'Red Bull',
    engineCoverLogo: '🐂',
    haloText: 'ORACLE',
    noseSponsor: 'Mobil 1',
    drivers: [
      { number: '1', name: 'Max Verstappen', code: 'VER' },
      { number: '6', name: 'Isack Hadjar', code: 'HAD' },
    ],
    accentStripe: '#facc15',
  },

  mclaren: {
    teamId: 'mclaren',
    teamName: 'McLaren',
    primarySponsor: 'McLaren F1 Team',
    rearWingText: 'OKX',
    rearWingSub: 'VELO',
    rearWingBg: '#121214',
    rearWingTextColor: '#ffffff',
    rearWingAccent: '#ff8000', // Papaya
    sidepodText: 'OKX',
    sidepodSub: 'Chrome',
    sidepodTextColor: '#ff8000',
    engineCoverText: 'McLaren',
    engineCoverLogo: '🏎️',
    haloText: 'Google Chrome',
    noseSponsor: 'DP WORLD',
    drivers: [
      { number: '4', name: 'Lando Norris', code: 'NOR' },
      { number: '81', name: 'Oscar Piastri', code: 'PIA' },
    ],
    accentStripe: '#4ade80',
  },

  astonmartin: {
    teamId: 'astonmartin',
    teamName: 'Aston Martin',
    primarySponsor: 'Aramco',
    rearWingText: 'ARAMCO',
    rearWingSub: 'COGNIZANT',
    rearWingBg: '#021814',
    rearWingTextColor: '#ffffff',
    rearWingAccent: '#cbf348', // Aston Lime
    sidepodText: 'ARAMCO',
    sidepodSub: 'JCB',
    sidepodTextColor: '#cbf348',
    engineCoverText: 'Aston Martin',
    engineCoverLogo: '🦅',
    haloText: 'ARAMCO',
    noseSponsor: 'Boss',
    drivers: [
      { number: '14', name: 'Fernando Alonso', code: 'ALO' },
      { number: '18', name: 'Lance Stroll', code: 'STR' },
    ],
    accentStripe: '#cbf348',
  },

  alpine: {
    teamId: 'alpine',
    teamName: 'Alpine',
    primarySponsor: 'BWT Alpine F1 Team',
    rearWingText: 'BWT',
    rearWingSub: 'ALPINE',
    rearWingBg: '#081426',
    rearWingTextColor: '#fd4bc7', // BWT Pink
    rearWingAccent: '#0090ff', // Alpine Blue
    sidepodText: 'BWT',
    sidepodSub: 'Renault',
    sidepodTextColor: '#ffffff',
    engineCoverText: 'Alpine A',
    engineCoverLogo: '🔺',
    haloText: 'BWT',
    noseSponsor: 'Castrol',
    drivers: [
      { number: '10', name: 'Pierre Gasly', code: 'GAS' },
      { number: '43', name: 'Jack Doohan', code: 'DOO' },
    ],
    accentStripe: '#fd4bc7',
  },

  racingbulls: {
    teamId: 'racingbulls',
    teamName: 'Racing Bulls',
    primarySponsor: 'Visa Cash App RB',
    rearWingText: 'VISA',
    rearWingSub: 'Cash App',
    rearWingBg: '#020b24',
    rearWingTextColor: '#ffffff',
    rearWingAccent: '#3b82f6',
    sidepodText: 'VISA',
    sidepodSub: 'HUGO',
    sidepodTextColor: '#60a5fa',
    engineCoverText: 'RB Bulls',
    engineCoverLogo: '⚡',
    haloText: 'CASH APP',
    noseSponsor: 'TUDOR',
    drivers: [
      { number: '22', name: 'Yuki Tsunoda', code: 'TSU' },
      { number: '30', name: 'Liam Lawson', code: 'LAW' },
    ],
    accentStripe: '#ffffff',
  },

  haas: {
    teamId: 'haas',
    teamName: 'Haas',
    primarySponsor: 'MoneyGram Haas F1 Team',
    rearWingText: 'MoneyGram',
    rearWingSub: 'HAAS',
    rearWingBg: '#111113',
    rearWingTextColor: '#ffffff',
    rearWingAccent: '#e10600',
    sidepodText: 'MoneyGram',
    sidepodSub: 'TGR Toyota',
    sidepodTextColor: '#ffffff',
    engineCoverText: 'Haas CNC',
    engineCoverLogo: '🛠️',
    haloText: 'MoneyGram',
    noseSponsor: 'Chipotle',
    drivers: [
      { number: '31', name: 'Esteban Ocon', code: 'OCO' },
      { number: '87', name: 'Oliver Bearman', code: 'BEA' },
    ],
    accentStripe: '#e10600',
  },

  williams: {
    teamId: 'williams',
    teamName: 'Williams',
    primarySponsor: 'Williams Racing',
    rearWingText: 'KOMATSU',
    rearWingSub: 'GULF',
    rearWingBg: '#041026',
    rearWingTextColor: '#ffffff',
    rearWingAccent: '#00a3e0',
    sidepodText: 'KOMATSU',
    sidepodSub: 'KRAKEN',
    sidepodTextColor: '#38bdf8',
    engineCoverText: 'Williams W',
    engineCoverLogo: '🔋', // Duracell battery copper top
    haloText: 'KOMATSU',
    noseSponsor: 'Gulf Oil',
    drivers: [
      { number: '23', name: 'Alexander Albon', code: 'ALB' },
      { number: '55', name: 'Carlos Sainz', code: 'SAI' },
    ],
    accentStripe: '#38bdf8',
  },

  audi: {
    teamId: 'audi',
    teamName: 'Audi',
    primarySponsor: 'Audi F1 Team',
    rearWingText: 'AUDI SPORT',
    rearWingSub: 'REVOLUT',
    rearWingBg: '#121214',
    rearWingTextColor: '#ffffff',
    rearWingAccent: '#f97316', // Audi Neon Orange
    sidepodText: 'AUDI',
    sidepodSub: 'Revolut',
    sidepodTextColor: '#ffffff',
    engineCoverText: 'Vorsprung',
    engineCoverLogo: '⭕⭕⭕⭕',
    haloText: 'AUDI SPORT',
    noseSponsor: 'BP Castrol',
    drivers: [
      { number: '27', name: 'Nico Hülkenberg', code: 'HUL' },
      { number: '5', name: 'Gabriel Bortoleto', code: 'BOR' },
    ],
    accentStripe: '#f97316',
  },

  cadillac: {
    teamId: 'cadillac',
    teamName: 'Cadillac',
    primarySponsor: 'Cadillac Formula 1 Team',
    rearWingText: 'CADILLAC',
    rearWingSub: 'TWINSPARK',
    rearWingBg: '#09090b',
    rearWingTextColor: '#e2b342', // Cadillac Gold
    rearWingAccent: '#ffffff',
    sidepodText: 'CADILLAC',
    sidepodSub: 'GM Power',
    sidepodTextColor: '#e2b342',
    engineCoverText: 'Cadillac Racing',
    engineCoverLogo: '🛡️',
    haloText: 'CADILLAC',
    noseSponsor: 'General Motors',
    drivers: [
      { number: '99', name: 'Cadillac Driver A', code: 'CAD' },
      { number: '98', name: 'Cadillac Driver B', code: 'GM' },
    ],
    accentStripe: '#e2b342',
  },
};

export const getTeamSponsors = (teamId: TeamId): TeamSponsorConfig => {
  return TEAM_SPONSORS[teamId] || TEAM_SPONSORS.ferrari;
};
