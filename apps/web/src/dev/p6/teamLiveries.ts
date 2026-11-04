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
  { id: 'mclaren', name: 'McLaren', car: 'MCL40', primary: '#f48220', secondary: '#161a20', accent: '#30a4a8', ink: '#f7f6f1', side: '#171b20', cover: '#161a20', nose: '#f48220', wing: '#15191c', finish: 'satin', sponsor: 'Gemini', secondarySponsor: 'McLaren', description: 'Papaya and anthracite; Gemini is featured on the 2026 right-side engine cover.', reference: 'https://www.mclaren.com/racing/formula-1/2026/mcl40-launch/' },
  { id: 'ferrari', name: 'Ferrari', car: 'SF-26', primary: '#d9182b', secondary: '#f2f0eb', accent: '#ffe045', ink: '#fffaf4', side: '#d9182b', cover: '#f2f0eb', nose: '#d9182b', wing: '#16171a', finish: 'gloss', sponsor: 'HP', secondarySponsor: 'Ferrari', description: 'Rosso red with the SF-26 white engine cover treatment.', reference: 'https://www.formula1.com/en/latest/article/first-look-ferrari-reveal-new-sf-26-car-for-2026-f1-season.19b0ad82cdsyXgvA675Ey4' },
  { id: 'mercedes', name: 'Mercedes', car: 'W17', primary: '#b8c3c8', secondary: '#101416', accent: '#22beb6', ink: '#f4faf9', side: '#101416', cover: '#b8c3c8', nose: '#b8c3c8', wing: '#111416', finish: 'satin', sponsor: 'PETRONAS', secondarySponsor: 'AMG', description: 'Silver and black with a PETRONAS turquoise edge.', reference: 'https://www.formula1.com/en/latest/article/gallery-check-out-every-angle-of-mercedes-new-livery-for-2026.70sm6Znl139u64MesOt5Vf' },
  { id: 'redbull', name: 'Red Bull Racing', car: 'RB22', primary: '#172857', secondary: '#f1f2ee', accent: '#e32c31', ink: '#fffaf4', side: '#172857', cover: '#172857', nose: '#172857', wing: '#15234d', finish: 'gloss', sponsor: 'ORACLE', secondarySponsor: 'Red Bull', description: 'Deep blue body and wings with red and yellow bull graphics.', reference: 'https://www.formula1.com/en/latest/article/first-look-red-bull-unveil-striking-new-livery-for-2026-f1-season.61MNwo6zMoxUtOAjS8JH0S' },
  { id: 'astonmartin', name: 'Aston Martin', car: 'AMR26', primary: '#075544', secondary: '#12241e', accent: '#c9df43', ink: '#f3f6ea', side: '#075544', cover: '#075544', nose: '#075544', wing: '#12241e', finish: 'satin', sponsor: 'aramco', secondarySponsor: 'Aston Martin', description: 'Racing green body and a fine lime accent.', reference: 'https://www.formula1.com/en/latest/article/first-look-aston-martin-present-new-livery-for-2026-f1-season.HUgB4dvw9PWse9SbIFPKV' },
  { id: 'williams', name: 'Williams', car: 'FW48', primary: '#1559bd', secondary: '#f0f2f3', accent: '#d32e37', ink: '#f8fbff', side: '#f0f2f3', cover: '#1559bd', nose: '#1559bd', wing: '#f0f2f3', finish: 'gloss', sponsor: 'Atlassian', secondarySponsor: 'Barclays', description: 'Gloss blue, white sidepod and a red heritage keyline.', reference: 'https://www.formula1.com/en/latest/article/first-look-williams-show-off-their-new-livery-for-2026-f1-season.4tY1qBa2lWI35hqxV6AH1g' },
  { id: 'alpine', name: 'Alpine', car: 'A526', primary: '#1959c6', secondary: '#ef80b4', accent: '#f4f1f3', ink: '#f8f8fc', side: '#ef80b4', cover: '#1959c6', nose: '#1959c6', wing: '#ef80b4', finish: 'gloss', sponsor: 'BWT', secondarySponsor: 'Alpine', description: 'Alpine blue paired with BWT pink.', reference: 'https://www.formula1.com/en/latest/article/first-look-alpine-unveil-new-car-ahead-of-2026-f1-season.4sRaEq3lWrZqcMxVCQ6Ub5' },
  { id: 'haas', name: 'Haas', car: 'VF-26', primary: '#e8e9e6', secondary: '#16181a', accent: '#d52a32', ink: '#f8f9f6', side: '#e8e9e6', cover: '#e8e9e6', nose: '#e8e9e6', wing: '#16181a', finish: 'satin', sponsor: 'TGR', secondarySponsor: 'Haas', description: 'White body, black wing sections and Toyota red.', reference: 'https://www.formula1.com/en/latest/article/first-look-haas-show-off-their-new-livery-for-2026-f1-season.5h7RFMnGXxpcmIVY3D56Xi' },
  { id: 'racingbulls', name: 'Racing Bulls', car: 'VCARB 03', primary: '#e9edef', secondary: '#2149a0', accent: '#d93439', ink: '#f7f9fb', side: '#e9edef', cover: '#e9edef', nose: '#e9edef', wing: '#2149a0', finish: 'gloss', sponsor: 'VISA', secondarySponsor: 'Racing Bulls', description: 'White field with blue contour accents for the Ford era.', reference: 'https://www.formula1.com/en/latest/article/first-look-racing-bulls-showcase-2026-livery-at-launch-event-in-detroit.ObKtbPEmmdtrnfMHw34pd' },
  { id: 'audi', name: 'Audi', car: 'R26', primary: '#a8aaa6', secondary: '#111315', accent: '#da3035', ink: '#f6f7f5', side: '#a8aaa6', cover: '#111315', nose: '#a8aaa6', wing: '#111315', finish: 'satin', sponsor: 'Audi', secondarySponsor: 'Revolut', description: 'Titanium silver, carbon and lava red.', reference: 'https://www.formula1.com/en/latest/article/first-look-audi-reveal-their-new-car-for-2026-f1-season.5g0jakpo0CQwnqoFDjhsAG' },
  { id: 'cadillac', name: 'Cadillac', car: '2026 updated', primary: '#edece8', secondary: '#111315', accent: '#bcc0bf', ink: '#f7f7f3', side: '#111315', cover: '#edece8', nose: '#edece8', wing: '#111315', finish: 'satin', sponsor: 'Cadillac', secondarySponsor: 'IFS', description: 'Belgium-onward white upper body and black lower body on both sides. Artwork remains under review.', reference: 'https://www.formula1.com/en/latest/article/why-cadillac-have-decided-to-switch-up-their-livery.2yJrSHrgmbFpUCW3lZiMYQ' },
];
