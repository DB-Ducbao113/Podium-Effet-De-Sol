import { venueHeroFor, venueHeroSrcSet } from './venueHeroes';

// P5 uses licensed circuit-atmosphere photography for team surfaces.
// The plate is atmosphere only and is never captioned as the team's home venue.
export const P5_TEAM_VENUE: Record<string, string> = {
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

export const P5_STANDINGS_DRIVERS_VENUE = 'marina-bay';
export const P5_STANDINGS_CONSTRUCTORS_VENUE = 'monza';
export const P5_DRIVER_GALLERY_VENUE = 'silverstone';
export const P5_TEAM_GALLERY_VENUE = 'marina-bay';

export const teamAtmosphereFor = (teamId?: string) =>
  venueHeroFor(teamId ? P5_TEAM_VENUE[teamId] : undefined);

export const teamAtmosphereSrcSet = (teamId: string, format: 'avif' | 'webp') =>
  venueHeroSrcSet(P5_TEAM_VENUE[teamId] || 'silverstone', 'land', format);

export const teamAtmosphereSrc = (teamId: string) =>
  `/images/p4/venues/${P5_TEAM_VENUE[teamId] || 'silverstone'}-land-960.webp`;
