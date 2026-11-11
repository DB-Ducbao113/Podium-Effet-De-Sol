import type { SeasonYear } from '../types';

export type CinematicImageCredit = {
  event: string;
  sourceTitle: string;
  artist: string;
  license: string;
  licenseUrl: string;
  sourcePage: string;
  cropNote: string;
};

export type DriverCinematic = {
  driverId: string;
  season: SeasonYear;
  teamId: string;
  imageBase: string;
  race: CinematicImageCredit;
};

// Keyed by driverId + season. Provenance and hashes: docs/asset-manifests/p5-driver-cinematic.json
const CINEMATIC_REGISTRY: Record<string, DriverCinematic> = {
  'antonelli:2026': {
    driverId: 'antonelli',
    season: 2026,
    teamId: 'mercedes',
    imageBase: '/images/driver-cinematic/antonelli',
    race: {
      event: '2026 Australian Grand Prix — Melbourne Walk',
      sourceTitle:
        'Kimi Antonelli at the Melbourne Walk during the 2026 Australian Grand Prix (028A7930) cropped.jpg',
      artist: 'Yu Chu Chin',
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
      sourcePage:
        'https://commons.wikimedia.org/wiki/File%3AKimi_Antonelli_at_the_Melbourne_Walk_during_the_2026_Australian_Grand_Prix_%28028A7930%29_cropped.jpg',
      cropNote: 'Pre-race 3:4 crop; face, cap and Mercedes team identity retained.',
    },
  },
  'verstappen:2026': {
    driverId: 'verstappen',
    season: 2026,
    teamId: 'red-bull',
    imageBase: '/images/driver-cinematic/verstappen',
    race: {
      event: '2026 Chinese Grand Prix — FP1',
      sourceTitle: '2026 Chinese GP - Red Bull - Max Verstappen - FP1.jpg',
      artist: 'Liauzh',
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0',
      sourcePage: 'https://commons.wikimedia.org/wiki/File%3A2026_Chinese_GP_-_Red_Bull_-_Max_Verstappen_-_FP1.jpg',
      cropNote: 'Cockpit and helmet crop; visor and halo retained.',
    },
  },
  'hamilton:2026': {
    driverId: 'hamilton',
    season: 2026,
    teamId: 'ferrari',
    imageBase: '/images/driver-cinematic/hamilton',
    race: {
      event: '2026 Dutch Grand Prix',
      sourceTitle:
        '2026-08-21 Motorsport, Formel 1, Großer Preis der Niederlande 2026 STP 2183.jpg',
      artist: 'Steffen Prößdorf',
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
      sourcePage:
        'https://commons.wikimedia.org/wiki/File%3A2026-08-21_Motorsport%2C_Formel_1%2C_Gro%C3%9Fer_Preis_der_Niederlande_2026_STP_2183.jpg',
      cropNote: 'Front-cockpit 3:4 crop; yellow helmet and halo retained.',
    },
  },
};

export type CinematicMode = 'race';

const WIDTHS: Record<CinematicMode, number[]> = {
  race: [480, 720, 960],
};

export function getDriverCinematic(
  driverId: string | undefined,
  season: SeasonYear,
): DriverCinematic | undefined {
  if (!driverId) return undefined;
  return CINEMATIC_REGISTRY[`${driverId}:${season}`];
}

export function cinematicSrcSet(
  image: DriverCinematic,
  mode: CinematicMode,
  format: 'avif' | 'webp',
): string {
  return WIDTHS[mode]
    .map((width) => `${image.imageBase}/${mode}-${width}.${format} ${width}w`)
    .join(', ');
}

export function cinematicSrc(image: DriverCinematic, mode: CinematicMode): string {
  const widths = WIDTHS[mode];
  return `${image.imageBase}/${mode}-${widths[Math.min(1, widths.length - 1)]}.webp`;
}

export function cinematicCreditLabel(credit: CinematicImageCredit): string {
  return `${credit.artist} · ${credit.license}`;
}
