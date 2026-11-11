import { STANDARD_2026_PAINT } from './standard2026Paint';
// Approximate screen colours sampled from the cited 2026 launch references.
// This is a local visual study on the 2022 Model B shape, not a 2026 car asset.
export type TeamLivery = {
  id: string;
  name: string;
  car: string;
  primary: string;
  secondary: string;
  accent: string;
  ink: string;
  side: string;
  cover: string;
  nose: string;
  wing: string;
  finish: 'gloss' | 'satin';
  sponsor: string;
  secondarySponsor: string;
  description: string;
  reference: string;
};

export const teamLiveries: TeamLivery[] = [
  { id: 'mclaren', name: 'McLaren', car: 'MCL40', ...STANDARD_2026_PAINT.mclaren, sponsor: 'Gemini', secondarySponsor: 'McLaren', description: 'Papaya and anthracite; Gemini is featured on the 2026 right-side engine cover.', reference: 'https://www.mclaren.com/racing/formula-1/2026/mcl40-launch/' },
  { id: 'ferrari', name: 'Ferrari', car: 'SF-26', ...STANDARD_2026_PAINT.ferrari, sponsor: 'HP', secondarySponsor: 'Ferrari', description: 'Rosso red with the SF-26 white engine cover treatment.', reference: 'https://www.formula1.com/en/latest/article/first-look-ferrari-reveal-new-sf-26-car-for-2026-f1-season.19b0ad82cdsyXgvA675Ey4' },
  { id: 'mercedes', name: 'Mercedes', car: 'W17', ...STANDARD_2026_PAINT.mercedes, sponsor: 'PETRONAS', secondarySponsor: 'AMG', description: 'Silver and black with a PETRONAS turquoise edge.', reference: 'https://www.formula1.com/en/latest/article/gallery-check-out-every-angle-of-mercedes-new-livery-for-2026.70sm6Znl139u64MesOt5Vf' },
  { id: 'redbull', name: 'Red Bull Racing', car: 'RB22', ...STANDARD_2026_PAINT.redbull, sponsor: 'ORACLE', secondarySponsor: 'Red Bull', description: 'Deep blue body and wings with red and yellow bull graphics.', reference: 'https://www.formula1.com/en/latest/article/first-look-red-bull-unveil-striking-new-livery-for-2026-f1-season.61MNwo6zMoxUtOAjS8JH0S' },
  { id: 'astonmartin', name: 'Aston Martin', car: 'AMR26', ...STANDARD_2026_PAINT.astonmartin, sponsor: 'aramco', secondarySponsor: 'Aston Martin', description: 'Racing green body and a fine lime accent.', reference: 'https://www.formula1.com/en/latest/article/first-look-aston-martin-present-new-livery-for-2026-f1-season.HUgB4dvw9PWse9SbIFPKV' },
  { id: 'williams', name: 'Williams', car: 'FW48', ...STANDARD_2026_PAINT.williams, sponsor: 'Atlassian', secondarySponsor: 'Barclays', description: 'Gloss blue body, cyan Barclays sidepod, white lower rear panel and red heritage detail.', reference: 'https://www.formula1.com/en/latest/article/first-look-williams-show-off-their-new-livery-for-2026-f1-season.4tY1qBa2lWI35hqxV6AH1g' },
  { id: 'alpine', name: 'Alpine', car: 'A526', ...STANDARD_2026_PAINT.alpine, sponsor: 'BWT', secondarySponsor: 'Alpine', description: 'Alpine blue paired with BWT pink.', reference: 'https://www.formula1.com/en/latest/article/first-look-alpine-unveil-new-car-ahead-of-2026-f1-season.4sRaEq3lWrZqcMxVCQ6Ub5' },
  { id: 'haas', name: 'Haas', car: 'VF-26', ...STANDARD_2026_PAINT.haas, sponsor: 'TGR', secondarySponsor: 'Haas', description: 'White body, black wing sections and Toyota red.', reference: 'https://www.formula1.com/en/latest/article/first-look-haas-show-off-their-new-livery-for-2026-f1-season.5h7RFMnGXxpcmIVY3D56Xi' },
  { id: 'racingbulls', name: 'Racing Bulls', car: 'VCARB 03', ...STANDARD_2026_PAINT.racingbulls, sponsor: 'VISA', secondarySponsor: 'Racing Bulls', description: 'White field with blue contour accents for the Ford era.', reference: 'https://www.formula1.com/en/latest/article/first-look-racing-bulls-showcase-2026-livery-at-launch-event-in-detroit.ObKtbPEmmdtrnfMHw34pd' },
  { id: 'audi', name: 'Audi', car: 'R26', ...STANDARD_2026_PAINT.audi, sponsor: 'Audi', secondarySponsor: 'Revolut', description: 'Titanium silver, carbon and lava red.', reference: 'https://www.formula1.com/en/latest/article/first-look-audi-reveal-their-new-car-for-2026-f1-season.5g0jakpo0CQwnqoFDjhsAG' },
  { id: 'cadillac', name: 'Cadillac', car: '2026 debut', ...STANDARD_2026_PAINT.cadillac, sponsor: 'Cadillac', secondarySponsor: 'IFS', description: 'Frozen launch livery: asymmetric white physical left and black physical right; sponsor placement remains under review.', reference: 'https://www.cadillacf1team.com/news/cadillac-formula-1-r-team-reveals-historic-first-livery' },
];
