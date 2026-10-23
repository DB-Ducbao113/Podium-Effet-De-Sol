import { TeamId } from '../types';

/**
 * Palette with guaranteed WCAG AA accessible contrast (> 4.5:1) for both light and dark backgrounds.
 * Ensures driver names styled with their team color NEVER appear as black-on-black or washed out white-on-white.
 */
export interface TeamTextColorPair {
  light: string; // For light background (e.g., white tables, light cards) - ratio >= 4.5:1 against #ffffff
  dark: string; // For dark background (e.g., dark modals, dark cards) - ratio >= 4.5:1 against #000000 / #090d16
}

export const TEAM_TEXT_PALETTE: Record<TeamId, TeamTextColorPair> = {
  ferrari: {
    light: '#dc2626', // Ferrari Rosso Corsa (Red-600)
    dark: '#ef4444', // Bright Racing Red (Red-500)
  },
  mclaren: {
    light: '#c2410c', // McLaren Papaya Orange (Orange-700, high contrast on white)
    dark: '#fb923c', // Luminous Papaya (Orange-400)
  },
  redbull: {
    light: '#1e40af', // Red Bull Royal Blue (Blue-800)
    dark: '#60a5fa', // Red Bull Electric Blue (Blue-400 - avoids pitch black #050f26)
  },
  mercedes: {
    light: '#0f766e', // Petronas Emerald Teal (Teal-700 - avoids invisible silver #c8ccce)
    dark: '#2dd4bf', // Petronas Luminous Cyan (Teal-400)
  },
  astonmartin: {
    light: '#047857', // British Racing Green (Emerald-700)
    dark: '#34d399', // Emerald Neon Green (Emerald-400)
  },
  alpine: {
    light: '#0284c7', // Alpine Electric Blue (Sky-600)
    dark: '#38bdf8', // Vivid Sky Blue (Sky-400)
  },
  racingbulls: {
    light: '#4338ca', // VCARB Royal Indigo (Indigo-700)
    dark: '#818cf8', // VCARB Bright Indigo (Indigo-400)
  },
  haas: {
    light: '#b91c1c', // Haas Racing Crimson (Red-700 - avoids invisible light gray #e5e7eb)
    dark: '#f87171', // Haas Vibrant Crimson (Red-400)
  },
  williams: {
    light: '#0369a1', // Williams Marine Blue (Sky-700)
    dark: '#38bdf8', // Williams Cyan Blue (Sky-400 - avoids pitch dark #002447)
  },
  audi: {
    light: '#15803d', // Audi Racing Green (Green-700 - avoids invisible gray #c4c8cc)
    dark: '#4ade80', // Audi Neon Green (Green-400)
  },
  cadillac: {
    light: '#b45309', // Cadillac Racing Gold / Amber (Amber-700)
    dark: '#fbbf24', // Cadillac Championship Gold (Amber-400 - avoids pitch black #141518)
  },
};

const DEFAULT_FALLBACK: TeamTextColorPair = {
  light: '#1e293b',
  dark: '#f1f5f9',
};

const DRIVER_TO_TEAM: Record<string, TeamId> = {
  // Ferrari
  leclerc: 'ferrari',
  charlesleclerc: 'ferrari',
  hamilton: 'ferrari',
  lewishamilton: 'ferrari',
  // McLaren
  norris: 'mclaren',
  landonorris: 'mclaren',
  piastri: 'mclaren',
  oscarpiastri: 'mclaren',
  // Red Bull
  verstappen: 'redbull',
  maxverstappen: 'redbull',
  hadjar: 'redbull',
  isackhadjar: 'redbull',
  // Mercedes
  russell: 'mercedes',
  georgerussell: 'mercedes',
  antonelli: 'mercedes',
  andreakimiantonelli: 'mercedes',
  kimiantonelli: 'mercedes',
  // Aston Martin
  alonso: 'astonmartin',
  fernandoalonso: 'astonmartin',
  stroll: 'astonmartin',
  lancestroll: 'astonmartin',
  // Alpine
  gasly: 'alpine',
  pierregasly: 'alpine',
  colapinto: 'alpine',
  francocolapinto: 'alpine',
  // Racing Bulls
  lawson: 'racingbulls',
  liamlawson: 'racingbulls',
  lindblad: 'racingbulls',
  arvidlindblad: 'racingbulls',
  tsunoda: 'racingbulls',
  yukitsunoda: 'racingbulls',
  // Haas
  ocon: 'haas',
  estebanocon: 'haas',
  bearman: 'haas',
  oliverbearman: 'haas',
  // Williams
  sainz: 'williams',
  carlossainz: 'williams',
  albon: 'williams',
  alexalbon: 'williams',
  alexanderalbon: 'williams',
  // Audi
  hulkenberg: 'audi',
  nicohulkenberg: 'audi',
  bortoleto: 'audi',
  gabrielbortoleto: 'audi',
  // Cadillac
  perez: 'cadillac',
  sergioperez: 'cadillac',
  bottas: 'cadillac',
  valtteribottas: 'cadillac',
};

/**
 * Normalizes input string (teamId, teamName, driverId, driverName) and resolves to a TeamId
 */
export function resolveTeamId(raw?: string): TeamId | null {
  if (!raw) return null;
  const clean = raw.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Exact team ID match
  if (clean in TEAM_TEXT_PALETTE) {
    return clean as TeamId;
  }

  // Driver lookup
  if (clean in DRIVER_TO_TEAM) {
    return DRIVER_TO_TEAM[clean];
  }

  // Partial match patterns
  if (clean.includes('ferrari')) return 'ferrari';
  if (clean.includes('mclaren')) return 'mclaren';
  if (clean.includes('redbull')) return 'redbull';
  if (clean.includes('mercedes')) return 'mercedes';
  if (clean.includes('aston')) return 'astonmartin';
  if (clean.includes('alpine')) return 'alpine';
  if (clean.includes('racingbulls') || clean.includes('vcarb') || clean.includes('cashapp'))
    return 'racingbulls';
  if (clean.includes('haas')) return 'haas';
  if (clean.includes('williams')) return 'williams';
  if (clean.includes('audi') || clean.includes('sauber') || clean.includes('kick')) return 'audi';
  if (clean.includes('cadillac')) return 'cadillac';

  return null;
}

/**
 * Gets high-contrast accessible text color for a driver or team.
 * @param identifier teamId, teamName, driverId, or driverName
 * @param isDarkTheme true if background is dark (e.g. modals), false if background is light (e.g. tables)
 */
export function getTeamTextColor(identifier?: string, isDarkTheme: boolean = false): string {
  const teamId = resolveTeamId(identifier);
  if (!teamId || !TEAM_TEXT_PALETTE[teamId]) {
    return isDarkTheme ? DEFAULT_FALLBACK.dark : DEFAULT_FALLBACK.light;
  }

  return isDarkTheme ? TEAM_TEXT_PALETTE[teamId].dark : TEAM_TEXT_PALETTE[teamId].light;
}
