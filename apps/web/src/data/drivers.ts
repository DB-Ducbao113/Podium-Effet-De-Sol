import { F1Driver, SeasonYear } from '../types';
import { getOriginalDriverVisualAsset } from '../config/originalVisualAssets';
import { STANDINGS_DATA } from './championship/standings';

/**
 * Historical F1 Career Records prior to the 2024 Championship season (pre-2024 baseline).
 * Source: Official FIA Formula One Historical Statistics (formula1.com / StatsF1).
 */
export const PRE_2024_CAREER_BASELINE: Record<string, { wins: number; podiums: number }> = {
  hamilton: { wins: 103, podiums: 197 },
  verstappen: { wins: 54, podiums: 98 },
  alonso: { wins: 32, podiums: 106 },
  bottas: { wins: 10, podiums: 67 },
  ricciardo: { wins: 8, podiums: 32 },
  perez: { wins: 6, podiums: 35 },
  leclerc: { wins: 5, podiums: 30 },
  sainz: { wins: 2, podiums: 18 },
  russell: { wins: 1, podiums: 11 },
  gasly: { wins: 1, podiums: 4 },
  ocon: { wins: 1, podiums: 3 },
  norris: { wins: 0, podiums: 13 },
  stroll: { wins: 0, podiums: 3 },
  albon: { wins: 0, podiums: 2 },
  piastri: { wins: 0, podiums: 2 },
  magnussen: { wins: 0, podiums: 1 },
  hulkenberg: { wins: 0, podiums: 0 },
  tsunoda: { wins: 0, podiums: 0 },
  zhou: { wins: 0, podiums: 0 },
  sargeant: { wins: 0, podiums: 0 },
  antonelli: { wins: 0, podiums: 0 },
  hadjar: { wins: 0, podiums: 0 },
  bearman: { wins: 0, podiums: 0 },
  colapinto: { wins: 0, podiums: 0 },
  lawson: { wins: 0, podiums: 0 },
  lindblad: { wins: 0, podiums: 0 },
  bortoleto: { wins: 0, podiums: 0 },
  doohan: { wins: 0, podiums: 0 },
};

/**
 * Computes career statistics (wins, podiums) dynamically by combining
 * the pre-2024 historical baseline with official season standings results.
 * If upToSeason is omitted, calculates all-time totals across all available seasons.
 */
export function getDriverCareerStats(
  driverId?: string,
  upToSeason?: SeasonYear,
): { careerWins: number; podiums: number } {
  if (!driverId) {
    return { careerWins: 0, podiums: 0 };
  }

  const baseline = PRE_2024_CAREER_BASELINE[driverId] || { wins: 0, podiums: 0 };
  let totalWins = baseline.wins;
  let totalPodiums = baseline.podiums;

  const seasons: SeasonYear[] = [2024, 2025, 2026];
  for (const s of seasons) {
    if (upToSeason && s > upToSeason) break;
    const seasonData = STANDINGS_DATA[s];
    if (seasonData) {
      const entry = seasonData.drivers.find((d) => d.driverId === driverId);
      if (entry) {
        totalWins += entry.wins;
        totalPodiums += entry.podiums;
      }
    }
  }

  return { careerWins: totalWins, podiums: totalPodiums };
}

const RAW_DRIVERS_DATA: Record<string, F1Driver> = {
  // Ferrari
  leclerc: {
    id: 'leclerc',
    number: 16,
    code: 'LEC',
    name: 'Charles Leclerc',
    shortName: 'C. Leclerc',
    teamId: 'ferrari',
    country: 'Monaco',
    countryCode: 'MC',
    flagEmoji: '🇲🇨',
    careerWins: 11, // 8 through 2024 + 2 (2025) + 1 (2026)
    podiums: 54, // 43 through 2024 + 7 (2025) + 4 (2026)
  },
  hamilton: {
    id: 'hamilton',
    number: 44,
    code: 'HAM',
    name: 'Lewis Hamilton',
    shortName: 'L. Hamilton',
    teamId: 'ferrari',
    country: 'United Kingdom',
    countryCode: 'GB',
    flagEmoji: '🇬🇧',
    careerWins: 107, // 105 through 2024 + 1 (2025) + 1 (2026)
    podiums: 211, // 202 through 2024 + 4 (2025) + 5 (2026)
  },

  // McLaren
  norris: {
    id: 'norris',
    number: 4,
    code: 'NOR',
    name: 'Lando Norris',
    shortName: 'L. Norris',
    teamId: 'mclaren',
    country: 'United Kingdom',
    countryCode: 'GB',
    flagEmoji: '🇬🇧',
    careerWins: 13, // 4 through 2024 + 7 (2025) + 2 (2026)
    podiums: 49, // 28 through 2024 + 16 (2025) + 5 (2026)
  },
  piastri: {
    id: 'piastri',
    number: 81,
    code: 'PIA',
    name: 'Oscar Piastri',
    shortName: 'O. Piastri',
    teamId: 'mclaren',
    country: 'Australia',
    countryCode: 'AU',
    flagEmoji: '🇦🇺',
    careerWins: 6, // 2 through 2024 + 4 (2025) + 0 (2026)
    podiums: 26, // 10 through 2024 + 14 (2025) + 2 (2026)
  },

  // Red Bull
  verstappen: {
    id: 'verstappen',
    number: 1,
    code: 'VER',
    name: 'Max Verstappen',
    shortName: 'M. Verstappen',
    teamId: 'redbull',
    country: 'Netherlands',
    countryCode: 'NL',
    flagEmoji: '🇳🇱',
    careerWins: 71, // 63 through 2024 + 8 (2025) + 0 (2026)
    podiums: 134, // 112 through 2024 + 15 (2025) + 7 (2026)
  },
  hadjar: {
    id: 'hadjar',
    number: 6,
    code: 'HAD',
    name: 'Isack Hadjar',
    shortName: 'I. Hadjar',
    teamId: 'redbull',
    country: 'France',
    countryCode: 'FR',
    flagEmoji: '🇫🇷',
    careerWins: 0,
    podiums: 2, // 2 podiums in 2026 season
  },

  // Mercedes
  russell: {
    id: 'russell',
    number: 63,
    code: 'RUS',
    name: 'George Russell',
    shortName: 'G. Russell',
    teamId: 'mercedes',
    country: 'United Kingdom',
    countryCode: 'GB',
    flagEmoji: '🇬🇧',
    careerWins: 8, // 3 through 2024 + 2 (2025) + 3 (2026)
    podiums: 31, // 15 through 2024 + 8 (2025) + 8 (2026)
  },
  antonelli: {
    id: 'antonelli',
    number: 12,
    code: 'ANT',
    name: 'Kimi Antonelli',
    shortName: 'K. Antonelli',
    teamId: 'mercedes',
    country: 'Italy',
    countryCode: 'IT',
    flagEmoji: '🇮🇹',
    careerWins: 8, // 8 wins in 2026 season
    podiums: 15, // 3 in 2025 + 12 in 2026
  },

  // Aston Martin
  alonso: {
    id: 'alonso',
    number: 14,
    code: 'ALO',
    name: 'Fernando Alonso',
    shortName: 'F. Alonso',
    teamId: 'astonmartin',
    country: 'Spain',
    countryCode: 'ES',
    flagEmoji: '🇪🇸',
    careerWins: 32,
    podiums: 106,
  },
  stroll: {
    id: 'stroll',
    number: 18,
    code: 'STR',
    name: 'Lance Stroll',
    shortName: 'L. Stroll',
    teamId: 'astonmartin',
    country: 'Canada',
    countryCode: 'CA',
    flagEmoji: '🇨🇦',
    careerWins: 0,
    podiums: 3,
  },

  // Alpine
  gasly: {
    id: 'gasly',
    number: 10,
    code: 'GAS',
    name: 'Pierre Gasly',
    shortName: 'P. Gasly',
    teamId: 'alpine',
    country: 'France',
    countryCode: 'FR',
    flagEmoji: '🇫🇷',
    careerWins: 1,
    podiums: 5, // 4 through 2023 + 1 (Brazil 2024)
  },
  colapinto: {
    id: 'colapinto',
    number: 43,
    code: 'COL',
    name: 'Franco Colapinto',
    shortName: 'F. Colapinto',
    teamId: 'alpine',
    country: 'Argentina',
    countryCode: 'AR',
    flagEmoji: '🇦🇷',
    careerWins: 0,
    podiums: 0,
  },

  // Racing Bulls
  lawson: {
    id: 'lawson',
    number: 30,
    code: 'LAW',
    name: 'Liam Lawson',
    shortName: 'L. Lawson',
    teamId: 'racingbulls',
    country: 'New Zealand',
    countryCode: 'NZ',
    flagEmoji: '🇳🇿',
    careerWins: 0,
    podiums: 0,
  },
  lindblad: {
    id: 'lindblad',
    number: 41,
    code: 'LIN',
    name: 'Arvid Lindblad',
    shortName: 'A. Lindblad',
    teamId: 'racingbulls',
    country: 'United Kingdom',
    countryCode: 'GB',
    flagEmoji: '🇬🇧',
    careerWins: 0,
    podiums: 0,
  },

  // Haas
  ocon: {
    id: 'ocon',
    number: 31,
    code: 'OCO',
    name: 'Esteban Ocon',
    shortName: 'E. Ocon',
    teamId: 'haas',
    country: 'France',
    countryCode: 'FR',
    flagEmoji: '🇫🇷',
    careerWins: 1,
    podiums: 4, // 3 through 2023 + 1 (Brazil 2024)
  },
  bearman: {
    id: 'bearman',
    number: 87,
    code: 'BEA',
    name: 'Oliver Bearman',
    shortName: 'O. Bearman',
    teamId: 'haas',
    country: 'United Kingdom',
    countryCode: 'GB',
    flagEmoji: '🇬🇧',
    careerWins: 0,
    podiums: 0,
  },

  // Williams
  sainz: {
    id: 'sainz',
    number: 55,
    code: 'SAI',
    name: 'Carlos Sainz',
    shortName: 'C. Sainz',
    teamId: 'williams',
    country: 'Spain',
    countryCode: 'ES',
    flagEmoji: '🇪🇸',
    careerWins: 4, // 4 through 2024
    podiums: 27, // 26 through 2024 + 1 (2025)
  },
  albon: {
    id: 'albon',
    number: 23,
    code: 'ALB',
    name: 'Alexander Albon',
    shortName: 'A. Albon',
    teamId: 'williams',
    country: 'Thailand',
    countryCode: 'TH',
    flagEmoji: '🇹🇭',
    careerWins: 0,
    podiums: 3, // 2 through 2024 + 1 (2025)
  },

  // Audi
  hulkenberg: {
    id: 'hulkenberg',
    number: 27,
    code: 'HUL',
    name: 'Nico Hülkenberg',
    shortName: 'N. Hülkenberg',
    teamId: 'audi',
    country: 'Germany',
    countryCode: 'DE',
    flagEmoji: '🇩🇪',
    careerWins: 0,
    podiums: 0,
  },
  bortoleto: {
    id: 'bortoleto',
    number: 5,
    code: 'BOR',
    name: 'Gabriel Bortoleto',
    shortName: 'G. Bortoleto',
    teamId: 'audi',
    country: 'Brazil',
    countryCode: 'BR',
    flagEmoji: '🇧🇷',
    careerWins: 0,
    podiums: 0,
  },

  // Cadillac
  perez: {
    id: 'perez',
    number: 11,
    code: 'PER',
    name: 'Sergio Pérez',
    shortName: 'S. Pérez',
    teamId: 'cadillac',
    country: 'Mexico',
    countryCode: 'MX',
    flagEmoji: '🇲🇽',
    careerWins: 6,
    podiums: 39,
  },
  bottas: {
    id: 'bottas',
    number: 77,
    code: 'BOT',
    name: 'Valtteri Bottas',
    shortName: 'V. Bottas',
    teamId: 'cadillac',
    country: 'Finland',
    countryCode: 'FI',
    flagEmoji: '🇫🇮',
    careerWins: 10,
    podiums: 67,
  },

  // Additional Active Drivers (2024-2026 Championship)
  tsunoda: {
    id: 'tsunoda',
    number: 22,
    code: 'TSU',
    name: 'Yuki Tsunoda',
    shortName: 'Y. Tsunoda',
    teamId: 'racingbulls',
    country: 'Japan',
    countryCode: 'JP',
    flagEmoji: '🇯🇵',
    careerWins: 0,
    podiums: 0,
  },
  ricciardo: {
    id: 'ricciardo',
    number: 3,
    code: 'RIC',
    name: 'Daniel Ricciardo',
    shortName: 'D. Ricciardo',
    teamId: 'racingbulls',
    country: 'Australia',
    countryCode: 'AU',
    flagEmoji: '🇦🇺',
    careerWins: 8,
    podiums: 32,
  },
  magnussen: {
    id: 'magnussen',
    number: 20,
    code: 'MAG',
    name: 'Kevin Magnussen',
    shortName: 'K. Magnussen',
    teamId: 'haas',
    country: 'Denmark',
    countryCode: 'DK',
    flagEmoji: '🇩🇰',
    careerWins: 0,
    podiums: 1,
  },
  zhou: {
    id: 'zhou',
    number: 24,
    code: 'ZHO',
    name: 'Zhou Guanyu',
    shortName: 'G. Zhou',
    teamId: 'audi',
    country: 'China',
    countryCode: 'CN',
    flagEmoji: '🇨🇳',
    careerWins: 0,
    podiums: 0,
  },
  sargeant: {
    id: 'sargeant',
    number: 2,
    code: 'SAR',
    name: 'Logan Sargeant',
    shortName: 'L. Sargeant',
    teamId: 'williams',
    country: 'United States',
    countryCode: 'US',
    flagEmoji: '🇺🇸',
    careerWins: 0,
    podiums: 0,
  },
  doohan: {
    id: 'doohan',
    number: 61,
    code: 'DOO',
    name: 'Jack Doohan',
    shortName: 'J. Doohan',
    teamId: 'alpine',
    country: 'Australia',
    countryCode: 'AU',
    flagEmoji: '🇦🇺',
    careerWins: 0,
    podiums: 0,
  },
};

export const DRIVERS_DATA: Record<string, F1Driver> = Object.fromEntries(
  Object.entries(RAW_DRIVERS_DATA).map(([id, driver]) => [
    id,
    {
      ...driver,
      imageUrl: driver.imageUrl || getOriginalDriverVisualAsset(id),
    },
  ]),
);
