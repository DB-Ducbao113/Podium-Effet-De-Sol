import { DriverStanding, ConstructorStanding, SeasonYear, SeasonStandings } from '../../types';

// ============================================================================
// OFFICIAL FIA FORMULA ONE WORLD CHAMPIONSHIP STANDINGS (OFFICIAL SOURCES)
// Source: Formula 1 Official Results (formula1.com/en/results)
// - 2024: Completed Season (Official Final Classification)
// - 2025: Completed Season (Official Final Classification)
// - 2026: Ongoing Season (Official Current Live Standings after 17 events)
// ============================================================================

// ----------------------------------------------------------------------------
// 1. SEASON 2024 — Official Final Classification
// ----------------------------------------------------------------------------
export const DRIVER_STANDINGS_2024: DriverStanding[] = [
  { rank: 1, driverId: 'verstappen', driverName: 'Max Verstappen', driverCode: 'VER', teamId: 'redbull', teamName: 'Red Bull Racing', points: 437, wins: 9, podiums: 14, countryFlag: '🇳🇱' },
  { rank: 2, driverId: 'norris', driverName: 'Lando Norris', driverCode: 'NOR', teamId: 'mclaren', teamName: 'McLaren', points: 374, wins: 4, podiums: 15, countryFlag: '🇬🇧' },
  { rank: 3, driverId: 'leclerc', driverName: 'Charles Leclerc', driverCode: 'LEC', teamId: 'ferrari', teamName: 'Ferrari', points: 356, wins: 3, podiums: 13, countryFlag: '🇲🇨' },
  { rank: 4, driverId: 'piastri', driverName: 'Oscar Piastri', driverCode: 'PIA', teamId: 'mclaren', teamName: 'McLaren', points: 292, wins: 2, podiums: 8, countryFlag: '🇦🇺' },
  { rank: 5, driverId: 'sainz', driverName: 'Carlos Sainz', driverCode: 'SAI', teamId: 'ferrari', teamName: 'Ferrari', points: 290, wins: 2, podiums: 8, countryFlag: '🇪🇸' },
  { rank: 6, driverId: 'russell', driverName: 'George Russell', driverCode: 'RUS', teamId: 'mercedes', teamName: 'Mercedes', points: 245, wins: 2, podiums: 4, countryFlag: '🇬🇧' },
  { rank: 7, driverId: 'hamilton', driverName: 'Lewis Hamilton', driverCode: 'HAM', teamId: 'mercedes', teamName: 'Mercedes', points: 223, wins: 2, podiums: 5, countryFlag: '🇬🇧' },
  { rank: 8, driverId: 'perez', driverName: 'Sergio Perez', driverCode: 'PER', teamId: 'redbull', teamName: 'Red Bull Racing', points: 152, wins: 0, podiums: 4, countryFlag: '🇲🇽' },
  { rank: 9, driverId: 'alonso', driverName: 'Fernando Alonso', driverCode: 'ALO', teamId: 'astonmartin', teamName: 'Aston Martin', points: 70, wins: 0, podiums: 0, countryFlag: '🇪🇸' },
  { rank: 10, driverId: 'gasly', driverName: 'Pierre Gasly', driverCode: 'GAS', teamId: 'alpine', teamName: 'Alpine', points: 42, wins: 0, podiums: 1, countryFlag: '🇫🇷' },
  { rank: 11, driverId: 'hulkenberg', driverName: 'Nico Hülkenberg', driverCode: 'HUL', teamId: 'haas', teamName: 'Haas', points: 41, wins: 0, podiums: 0, countryFlag: '🇩🇪' },
  { rank: 12, driverId: 'tsunoda', driverName: 'Yuki Tsunoda', driverCode: 'TSU', teamId: 'racingbulls', teamName: 'RB', points: 30, wins: 0, podiums: 0, countryFlag: '🇯🇵' },
  { rank: 13, driverId: 'stroll', driverName: 'Lance Stroll', driverCode: 'STR', teamId: 'astonmartin', teamName: 'Aston Martin', points: 24, wins: 0, podiums: 0, countryFlag: '🇨🇦' },
  { rank: 14, driverId: 'ocon', driverName: 'Esteban Ocon', driverCode: 'OCO', teamId: 'alpine', teamName: 'Alpine', points: 23, wins: 0, podiums: 1, countryFlag: '🇫🇷' },
  { rank: 15, driverId: 'magnussen', driverName: 'Kevin Magnussen', driverCode: 'MAG', teamId: 'haas', teamName: 'Haas', points: 16, wins: 0, podiums: 0, countryFlag: '🇩🇰' },
  { rank: 16, driverId: 'albon', driverName: 'Alexander Albon', driverCode: 'ALB', teamId: 'williams', teamName: 'Williams', points: 12, wins: 0, podiums: 0, countryFlag: '🇹🇭' },
  { rank: 17, driverId: 'ricciardo', driverName: 'Daniel Ricciardo', driverCode: 'RIC', teamId: 'racingbulls', teamName: 'RB', points: 12, wins: 0, podiums: 0, countryFlag: '🇦🇺' },
  { rank: 18, driverId: 'bearman', driverName: 'Oliver Bearman', driverCode: 'BEA', teamId: 'haas', teamName: 'Haas', points: 7, wins: 0, podiums: 0, countryFlag: '🇬🇧' },
  { rank: 19, driverId: 'colapinto', driverName: 'Franco Colapinto', driverCode: 'COL', teamId: 'williams', teamName: 'Williams', points: 5, wins: 0, podiums: 0, countryFlag: '🇦🇷' },
  { rank: 20, driverId: 'zhou', driverName: 'Zhou Guanyu', driverCode: 'ZHO', teamId: 'audi', teamName: 'Kick Sauber', points: 4, wins: 0, podiums: 0, countryFlag: '🇨🇳' },
  { rank: 21, driverId: 'lawson', driverName: 'Liam Lawson', driverCode: 'LAW', teamId: 'racingbulls', teamName: 'RB', points: 4, wins: 0, podiums: 0, countryFlag: '🇳🇿' },
  { rank: 22, driverId: 'bottas', driverName: 'Valtteri Bottas', driverCode: 'BOT', teamId: 'audi', teamName: 'Kick Sauber', points: 0, wins: 0, podiums: 0, countryFlag: '🇫🇮' },
  { rank: 23, driverId: 'sargeant', driverName: 'Logan Sargeant', driverCode: 'SAR', teamId: 'williams', teamName: 'Williams', points: 0, wins: 0, podiums: 0, countryFlag: '🇺🇸' },
  { rank: 24, driverId: 'doohan', driverName: 'Jack Doohan', driverCode: 'DOO', teamId: 'alpine', teamName: 'Alpine', points: 0, wins: 0, podiums: 0, countryFlag: '🇦🇺' },
];

export const CONSTRUCTOR_STANDINGS_2024: ConstructorStanding[] = [
  { rank: 1, teamId: 'mclaren', teamName: 'McLaren', points: 666, wins: 6, podiums: 23, engine: 'Mercedes' },
  { rank: 2, teamId: 'ferrari', teamName: 'Ferrari', points: 652, wins: 5, podiums: 21, engine: 'Ferrari' },
  { rank: 3, teamId: 'redbull', teamName: 'Red Bull Racing', points: 589, wins: 9, podiums: 18, engine: 'Honda RBPT' },
  { rank: 4, teamId: 'mercedes', teamName: 'Mercedes', points: 468, wins: 4, podiums: 9, engine: 'Mercedes' },
  { rank: 5, teamId: 'astonmartin', teamName: 'Aston Martin', points: 94, wins: 0, podiums: 0, engine: 'Mercedes' },
  { rank: 6, teamId: 'alpine', teamName: 'Alpine', points: 65, wins: 0, podiums: 2, engine: 'Renault' },
  { rank: 7, teamId: 'haas', teamName: 'Haas', points: 58, wins: 0, podiums: 0, engine: 'Ferrari' },
  { rank: 8, teamId: 'racingbulls', teamName: 'RB', points: 46, wins: 0, podiums: 0, engine: 'Honda RBPT' },
  { rank: 9, teamId: 'williams', teamName: 'Williams', points: 17, wins: 0, podiums: 0, engine: 'Mercedes' },
  { rank: 10, teamId: 'audi', teamName: 'Kick Sauber', points: 4, wins: 0, podiums: 0, engine: 'Ferrari' },
];

// ----------------------------------------------------------------------------
// 2. SEASON 2025 — Official Final Classification
// ----------------------------------------------------------------------------
export const DRIVER_STANDINGS_2025: DriverStanding[] = [
  { rank: 1, driverId: 'norris', driverName: 'Lando Norris', driverCode: 'NOR', teamId: 'mclaren', teamName: 'McLaren', points: 423, wins: 7, podiums: 16, countryFlag: '🇬🇧' },
  { rank: 2, driverId: 'verstappen', driverName: 'Max Verstappen', driverCode: 'VER', teamId: 'redbull', teamName: 'Red Bull Racing', points: 421, wins: 8, podiums: 15, countryFlag: '🇳🇱' },
  { rank: 3, driverId: 'piastri', driverName: 'Oscar Piastri', driverCode: 'PIA', teamId: 'mclaren', teamName: 'McLaren', points: 410, wins: 4, podiums: 14, countryFlag: '🇦🇺' },
  { rank: 4, driverId: 'russell', driverName: 'George Russell', driverCode: 'RUS', teamId: 'mercedes', teamName: 'Mercedes', points: 319, wins: 2, podiums: 8, countryFlag: '🇬🇧' },
  { rank: 5, driverId: 'leclerc', driverName: 'Charles Leclerc', driverCode: 'LEC', teamId: 'ferrari', teamName: 'Ferrari', points: 242, wins: 2, podiums: 7, countryFlag: '🇲🇨' },
  { rank: 6, driverId: 'hamilton', driverName: 'Lewis Hamilton', driverCode: 'HAM', teamId: 'ferrari', teamName: 'Ferrari', points: 156, wins: 1, podiums: 4, countryFlag: '🇬🇧' },
  { rank: 7, driverId: 'antonelli', driverName: 'Kimi Antonelli', driverCode: 'ANT', teamId: 'mercedes', teamName: 'Mercedes', points: 150, wins: 0, podiums: 3, countryFlag: '🇮🇹' },
  { rank: 8, driverId: 'albon', driverName: 'Alexander Albon', driverCode: 'ALB', teamId: 'williams', teamName: 'Williams', points: 73, wins: 0, podiums: 1, countryFlag: '🇹🇭' },
  { rank: 9, driverId: 'sainz', driverName: 'Carlos Sainz', driverCode: 'SAI', teamId: 'williams', teamName: 'Williams', points: 64, wins: 0, podiums: 1, countryFlag: '🇪🇸' },
  { rank: 10, driverId: 'alonso', driverName: 'Fernando Alonso', driverCode: 'ALO', teamId: 'astonmartin', teamName: 'Aston Martin', points: 56, wins: 0, podiums: 0, countryFlag: '🇪🇸' },
  { rank: 11, driverId: 'hulkenberg', driverName: 'Nico Hülkenberg', driverCode: 'HUL', teamId: 'audi', teamName: 'Kick Sauber', points: 51, wins: 0, podiums: 0, countryFlag: '🇩🇪' },
  { rank: 12, driverId: 'hadjar', driverName: 'Isack Hadjar', driverCode: 'HAD', teamId: 'racingbulls', teamName: 'Racing Bulls', points: 51, wins: 0, podiums: 0, countryFlag: '🇫🇷' },
  { rank: 13, driverId: 'bearman', driverName: 'Oliver Bearman', driverCode: 'BEA', teamId: 'haas', teamName: 'Haas', points: 41, wins: 0, podiums: 0, countryFlag: '🇬🇧' },
  { rank: 14, driverId: 'lawson', driverName: 'Liam Lawson', driverCode: 'LAW', teamId: 'racingbulls', teamName: 'Racing Bulls', points: 38, wins: 0, podiums: 0, countryFlag: '🇳🇿' },
  { rank: 15, driverId: 'ocon', driverName: 'Esteban Ocon', driverCode: 'OCO', teamId: 'haas', teamName: 'Haas', points: 38, wins: 0, podiums: 0, countryFlag: '🇫🇷' },
  { rank: 16, driverId: 'stroll', driverName: 'Lance Stroll', driverCode: 'STR', teamId: 'astonmartin', teamName: 'Aston Martin', points: 33, wins: 0, podiums: 0, countryFlag: '🇨🇦' },
  { rank: 17, driverId: 'tsunoda', driverName: 'Yuki Tsunoda', driverCode: 'TSU', teamId: 'redbull', teamName: 'Red Bull Racing', points: 33, wins: 0, podiums: 0, countryFlag: '🇯🇵' },
  { rank: 18, driverId: 'gasly', driverName: 'Pierre Gasly', driverCode: 'GAS', teamId: 'alpine', teamName: 'Alpine', points: 22, wins: 0, podiums: 0, countryFlag: '🇫🇷' },
  { rank: 19, driverId: 'bortoleto', driverName: 'Gabriel Bortoleto', driverCode: 'BOR', teamId: 'audi', teamName: 'Kick Sauber', points: 19, wins: 0, podiums: 0, countryFlag: '🇧🇷' },
  { rank: 20, driverId: 'colapinto', driverName: 'Franco Colapinto', driverCode: 'COL', teamId: 'alpine', teamName: 'Alpine', points: 0, wins: 0, podiums: 0, countryFlag: '🇦🇷' },
  { rank: 21, driverId: 'doohan', driverName: 'Jack Doohan', driverCode: 'DOO', teamId: 'alpine', teamName: 'Alpine', points: 0, wins: 0, podiums: 0, countryFlag: '🇦🇺' },
];

export const CONSTRUCTOR_STANDINGS_2025: ConstructorStanding[] = [
  { rank: 1, teamId: 'mclaren', teamName: 'McLaren', points: 833, wins: 11, podiums: 30, engine: 'Mercedes' },
  { rank: 2, teamId: 'mercedes', teamName: 'Mercedes', points: 469, wins: 2, podiums: 11, engine: 'Mercedes' },
  { rank: 3, teamId: 'redbull', teamName: 'Red Bull Racing', points: 451, wins: 8, podiums: 15, engine: 'Honda RBPT' },
  { rank: 4, teamId: 'ferrari', teamName: 'Ferrari', points: 398, wins: 3, podiums: 11, engine: 'Ferrari' },
  { rank: 5, teamId: 'williams', teamName: 'Williams', points: 137, wins: 0, podiums: 2, engine: 'Mercedes' },
  { rank: 6, teamId: 'racingbulls', teamName: 'Racing Bulls', points: 92, wins: 0, podiums: 0, engine: 'Honda RBPT' },
  { rank: 7, teamId: 'astonmartin', teamName: 'Aston Martin', points: 89, wins: 0, podiums: 0, engine: 'Mercedes' },
  { rank: 8, teamId: 'haas', teamName: 'Haas', points: 79, wins: 0, podiums: 0, engine: 'Ferrari' },
  { rank: 9, teamId: 'audi', teamName: 'Kick Sauber', points: 70, wins: 0, podiums: 0, engine: 'Ferrari' },
  { rank: 10, teamId: 'alpine', teamName: 'Alpine', points: 22, wins: 0, podiums: 0, engine: 'Renault' },
];

// ----------------------------------------------------------------------------
// 3. SEASON 2026 — Official Live Standings (Ongoing Season after 17 events)
// ----------------------------------------------------------------------------
export const DRIVER_STANDINGS_2026: DriverStanding[] = [
  { rank: 1, driverId: 'antonelli', driverName: 'Andrea Kimi Antonelli', driverCode: 'ANT', teamId: 'mercedes', teamName: 'Mercedes', points: 340, wins: 8, podiums: 14, countryFlag: '🇮🇹' },
  { rank: 2, driverId: 'russell', driverName: 'George Russell', driverCode: 'RUS', teamId: 'mercedes', teamName: 'Mercedes', points: 238, wins: 3, podiums: 8, countryFlag: '🇬🇧' },
  { rank: 3, driverId: 'hamilton', driverName: 'Lewis Hamilton', driverCode: 'HAM', teamId: 'ferrari', teamName: 'Ferrari', points: 229, wins: 1, podiums: 6, countryFlag: '🇬🇧' },
  { rank: 4, driverId: 'verstappen', driverName: 'Max Verstappen', driverCode: 'VER', teamId: 'redbull', teamName: 'Red Bull', points: 221, wins: 2, podiums: 9, countryFlag: '🇳🇱' },
  { rank: 5, driverId: 'leclerc', driverName: 'Charles Leclerc', driverCode: 'LEC', teamId: 'ferrari', teamName: 'Ferrari', points: 215, wins: 1, podiums: 5, countryFlag: '🇲🇨' },
  { rank: 6, driverId: 'norris', driverName: 'Lando Norris', driverCode: 'NOR', teamId: 'mclaren', teamName: 'McLaren', points: 201, wins: 2, podiums: 5, countryFlag: '🇬🇧' },
  { rank: 7, driverId: 'piastri', driverName: 'Oscar Piastri', driverCode: 'PIA', teamId: 'mclaren', teamName: 'McLaren', points: 138, wins: 0, podiums: 2, countryFlag: '🇦🇺' },
  { rank: 8, driverId: 'hadjar', driverName: 'Isack Hadjar', driverCode: 'HAD', teamId: 'redbull', teamName: 'Red Bull', points: 97, wins: 0, podiums: 2, countryFlag: '🇫🇷' },
  { rank: 9, driverId: 'lawson', driverName: 'Liam Lawson', driverCode: 'LAW', teamId: 'racingbulls', teamName: 'RB F1 Team', points: 75, wins: 0, podiums: 0, countryFlag: '🇳🇿' },
  { rank: 10, driverId: 'gasly', driverName: 'Pierre Gasly', driverCode: 'GAS', teamId: 'alpine', teamName: 'Alpine F1 Team', points: 41, wins: 0, podiums: 0, countryFlag: '🇫🇷' },
  { rank: 11, driverId: 'lindblad', driverName: 'Arvid Lindblad', driverCode: 'LIN', teamId: 'racingbulls', teamName: 'RB F1 Team', points: 38, wins: 0, podiums: 0, countryFlag: '🇬🇧' },
  { rank: 12, driverId: 'colapinto', driverName: 'Franco Colapinto', driverCode: 'COL', teamId: 'alpine', teamName: 'Alpine F1 Team', points: 27, wins: 0, podiums: 0, countryFlag: '🇦🇷' },
  { rank: 13, driverId: 'bearman', driverName: 'Oliver Bearman', driverCode: 'BEA', teamId: 'haas', teamName: 'Haas F1 Team', points: 23, wins: 0, podiums: 0, countryFlag: '🇬🇧' },
  { rank: 14, driverId: 'hulkenberg', driverName: 'Nico Hülkenberg', driverCode: 'HUL', teamId: 'audi', teamName: 'Audi', points: 13, wins: 0, podiums: 0, countryFlag: '🇩🇪' },
  { rank: 15, driverId: 'bortoleto', driverName: 'Gabriel Bortoleto', driverCode: 'BOR', teamId: 'audi', teamName: 'Audi', points: 10, wins: 0, podiums: 0, countryFlag: '🇧🇷' },
  { rank: 16, driverId: 'ocon', driverName: 'Esteban Ocon', driverCode: 'OCO', teamId: 'haas', teamName: 'Haas F1 Team', points: 7, wins: 0, podiums: 0, countryFlag: '🇫🇷' },
  { rank: 17, driverId: 'alonso', driverName: 'Fernando Alonso', driverCode: 'ALO', teamId: 'astonmartin', teamName: 'Aston Martin', points: 7, wins: 0, podiums: 0, countryFlag: '🇪🇸' },
  { rank: 18, driverId: 'sainz', driverName: 'Carlos Sainz', driverCode: 'SAI', teamId: 'williams', teamName: 'Williams', points: 7, wins: 0, podiums: 0, countryFlag: '🇪🇸' },
  { rank: 19, driverId: 'albon', driverName: 'Alexander Albon', driverCode: 'ALB', teamId: 'williams', teamName: 'Williams', points: 5, wins: 0, podiums: 0, countryFlag: '🇹🇭' },
  { rank: 20, driverId: 'stroll', driverName: 'Lance Stroll', driverCode: 'STR', teamId: 'astonmartin', teamName: 'Aston Martin', points: 0, wins: 0, podiums: 0, countryFlag: '🇨🇦' },
  { rank: 21, driverId: 'bottas', driverName: 'Valtteri Bottas', driverCode: 'BOT', teamId: 'cadillac', teamName: 'Cadillac F1 Team', points: 0, wins: 0, podiums: 0, countryFlag: '🇫🇮' },
  { rank: 22, driverId: 'perez', driverName: 'Sergio Pérez', driverCode: 'PER', teamId: 'cadillac', teamName: 'Cadillac F1 Team', points: 0, wins: 0, podiums: 0, countryFlag: '🇲🇽' },
];

export const CONSTRUCTOR_STANDINGS_2026: ConstructorStanding[] = [
  { rank: 1, teamId: 'mercedes', teamName: 'Mercedes', points: 578, wins: 11, podiums: 22, engine: 'Mercedes' },
  { rank: 2, teamId: 'ferrari', teamName: 'Ferrari', points: 444, wins: 2, podiums: 11, engine: 'Ferrari' },
  { rank: 3, teamId: 'mclaren', teamName: 'McLaren', points: 339, wins: 2, podiums: 7, engine: 'Mercedes' },
  { rank: 4, teamId: 'redbull', teamName: 'Red Bull', points: 332, wins: 2, podiums: 11, engine: 'Red Bull Ford' },
  { rank: 5, teamId: 'racingbulls', teamName: 'RB F1 Team', points: 100, wins: 0, podiums: 0, engine: 'Red Bull Ford' },
  { rank: 6, teamId: 'alpine', teamName: 'Alpine F1 Team', points: 68, wins: 0, podiums: 0, engine: 'Mercedes' },
  { rank: 7, teamId: 'haas', teamName: 'Haas F1 Team', points: 30, wins: 0, podiums: 0, engine: 'Ferrari' },
  { rank: 8, teamId: 'audi', teamName: 'Audi', points: 23, wins: 0, podiums: 0, engine: 'Audi' },
  { rank: 9, teamId: 'williams', teamName: 'Williams', points: 12, wins: 0, podiums: 0, engine: 'Mercedes' },
  { rank: 10, teamId: 'astonmartin', teamName: 'Aston Martin', points: 7, wins: 0, podiums: 0, engine: 'Honda' },
  { rank: 11, teamId: 'cadillac', teamName: 'Cadillac F1 Team', points: 0, wins: 0, podiums: 0, engine: 'Ferrari' },
];

// ============================================================================
// STRUCTURED STANDINGS DATABASE (OFFICIAL COMPLETED VS ONGOING CLASSIFICATION)
// ============================================================================

export const STANDINGS_DATA: Record<SeasonYear, SeasonStandings> = {
  2024: {
    season: 2024,
    status: 'completed',
    notes: 'Official Final Classification · Max Verstappen & McLaren Champions',
    leaderTitle: 'World Champion: Max Verstappen (437 pts) · Constructors: McLaren (666 pts)',
    drivers: DRIVER_STANDINGS_2024,
    constructors: CONSTRUCTOR_STANDINGS_2024,
  },
  2025: {
    season: 2025,
    status: 'completed',
    notes: 'Official Final Classification · Lando Norris & McLaren Champions',
    leaderTitle: 'World Champion: Lando Norris (423 pts) · Constructors: McLaren (833 pts)',
    drivers: DRIVER_STANDINGS_2025,
    constructors: CONSTRUCTOR_STANDINGS_2025,
  },
  2026: {
    season: 2026,
    status: 'ongoing',
    lastUpdated: '2026-10-11',
    notes: 'Official Live Standings after 17 events · Mercedes & Andrea Kimi Antonelli Leading',
    leaderTitle: 'Current Championship Leader: Andrea Kimi Antonelli (340 pts) · Mercedes (578 pts)',
    drivers: DRIVER_STANDINGS_2026,
    constructors: CONSTRUCTOR_STANDINGS_2026,
  },
};

export const getStandings = (season: SeasonYear): SeasonStandings => {
  return STANDINGS_DATA[season] || STANDINGS_DATA[2024];
};
