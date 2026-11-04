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
  action: CinematicImageCredit;
};

// Keyed by driverId + season. Provenance and hashes: docs/asset-manifests/p5-driver-cinematic.json
const CINEMATIC_REGISTRY: Record<string, DriverCinematic> = {
  'antonelli:2026': {
    driverId: 'antonelli',
    season: 2026,
    teamId: 'mercedes',
    imageBase: '/images/p5/cinematic/antonelli',
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
    action: {
      event: '2026 Chinese Grand Prix — Post Race Celebration',
      sourceTitle: '2026 Chinese GP - Mercedes - Kimi Antonelli - Post Race Celebration.jpg',
      artist: 'Liauzh',
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0',
      sourcePage:
        'https://commons.wikimedia.org/wiki/File%3A2026_Chinese_GP_-_Mercedes_-_Kimi_Antonelli_-_Post_Race_Celebration.jpg',
      cropNote: '16:9 celebration plate; 4:5 mobile crop centred on the driver, helmet and car.',
    },
  },
  'verstappen:2026': {
    driverId: 'verstappen',
    season: 2026,
    teamId: 'red-bull',
    imageBase: '/images/p5/cinematic/verstappen',
    race: {
      event: '2026 Chinese Grand Prix — FP1',
      sourceTitle: '2026 Chinese GP - Red Bull - Max Verstappen - FP1.jpg',
      artist: 'Liauzh',
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0',
      sourcePage: 'https://commons.wikimedia.org/wiki/File%3A2026_Chinese_GP_-_Red_Bull_-_Max_Verstappen_-_FP1.jpg',
      cropNote: 'Cockpit and helmet crop; visor and halo retained.',
    },
    action: {
      event: '2026 Chinese Grand Prix — Qualifying',
      sourceTitle: '2026 Chinese GP - Red Bull - Max Verstappen - Qualifying.jpg',
      artist: 'Liauzh',
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0',
      sourcePage: 'https://commons.wikimedia.org/wiki/File%3A2026_Chinese_GP_-_Red_Bull_-_Max_Verstappen_-_Qualifying.jpg',
      cropNote: '16:9 action plate; 4:5 mobile crop centred on the cockpit.',
    },
  },
  'hamilton:2026': {
    driverId: 'hamilton',
    season: 2026,
    teamId: 'ferrari',
    imageBase: '/images/p5/cinematic/hamilton',
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
    action: {
      event: '2026 Japanese Grand Prix — Suzuka',
      sourceTitle:
        'Ferrari SF-26 - Lewis Hamilton exits the final chicane at Suzuka during the 2026 Japanese GP (55195432409).jpg',
      artist: 'Martin Lee from London, UK',
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
      sourcePage:
        'https://commons.wikimedia.org/wiki/File%3AFerrari_SF-26_-_Lewis_Hamilton_exits_the_final_chicane_at_Suzuka_during_the_2026_Japanese_GP_%2855195432409%29.jpg',
      cropNote: '16:9 crop from the 1.42:1 original; 4:5 mobile crop centred on the cockpit.',
    },
  },
};

export type CinematicMode = 'race' | 'action-land' | 'action-port';

const WIDTHS: Record<CinematicMode, number[]> = {
  race: [480, 720, 960],
  'action-land': [960, 1440, 1920],
  'action-port': [480, 720, 960],
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
