import { venueHeroFor, venueHeroSrcSet } from './venueHeroes';

// P5 uses licensed circuit-atmosphere photography for team surfaces.
// The plate is atmosphere only and is never captioned as the team's home venue.
export const TEAM_VENUE: Record<string, string> = {
  ferrari: 'monza',
  mclaren: 'silverstone',
  redbull: 'red-bull-ring',
  mercedes: 'spa',
  astonmartin: 'zandvoort',
  alpine: 'marina-bay',
  racingbulls: 'suzuka',
  haas: 'cota',
  williams: 'albert-park',
  audi: 'hungaroring',
  cadillac: 'miami',
};

export const STANDINGS_DRIVERS_VENUE = 'marina-bay';
export const STANDINGS_CONSTRUCTORS_VENUE = 'monza';
export const DRIVER_GALLERY_VENUE = 'silverstone';
export const TEAM_GALLERY_VENUE = 'marina-bay';

export const teamAtmosphereFor = (teamId?: string) =>
  venueHeroFor(teamId ? TEAM_VENUE[teamId] : undefined);

export const teamAtmosphereSrcSet = (teamId: string, format: 'avif' | 'webp') =>
  venueHeroSrcSet(TEAM_VENUE[teamId] || 'silverstone', 'land', format);

export const teamAtmosphereSrc = (teamId: string) =>
  `/images/championship/venues/${TEAM_VENUE[teamId] || 'silverstone'}-land-960.webp`;
