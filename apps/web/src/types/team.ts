export type TeamId =
  | 'ferrari'
  | 'mclaren'
  | 'redbull'
  | 'mercedes'
  | 'astonmartin'
  | 'alpine'
  | 'racingbulls'
  | 'haas'
  | 'williams'
  | 'audi'
  | 'cadillac';

/**
 * Sentinel team for unmapped constructors (Jolpica IDs with no internal
 * mapping, unmatched podium names). Displayed with the neutral fallback
 * color and never credited to another team's points. Grid sparsity is
 * allowed: no fake drivers, teams or points are invented to fill 22 seats.
 */
export const UNKNOWN_TEAM_ID: TeamId = 'unknown' as unknown as TeamId;

export interface F1Team {
  id: TeamId;
  name: string;
  fullName: string;
  base: string;
  teamPrincipal: string;
  powerUnit: string;
  primaryColor: string;
  accentColor: string;
  highlightColor: string;
  logoUrl?: string;
  imageUrl?: string;
  drivers: string[]; // driver ids
}
