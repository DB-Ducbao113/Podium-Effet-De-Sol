import type { PrecisionTeam } from './paintAtlas';

/**
 * One canonical early-season design per constructor.
 * Every URL below is a single-livery *gallery*, not a clearance to copy images.
 * Photo-by-photo side/angle coverage is NOT certified by this index.
 */
export interface Standard2026ReferenceSet {
  teamId: PrecisionTeam;
  variantId: 'season-default-2026';
  sourceSetId: string;
  galleryUrl: string;
  photoIndexStatus: 'needs-angle-audit';
  usage: 'external-reference-only';
  caveat?: string;
}

function standard(teamId: PrecisionTeam, galleryUrl: string, caveat?: string): Standard2026ReferenceSet {
  return {
    teamId,
    variantId: 'season-default-2026',
    sourceSetId: '2026-' + teamId + '-launch',
    galleryUrl,
    photoIndexStatus: 'needs-angle-audit',
    usage: 'external-reference-only',
    ...(caveat ? { caveat } : {}),
  };
}

/**
 * Preserve design identity across side/front/rear/top photos; never substitute
 * a special Grand Prix livery, a later revision, or a different season.
 */
export const STANDARD_2026_REFERENCE_SETS: Record<PrecisionTeam, Standard2026ReferenceSet> = {
  mclaren: standard('mclaren', 'https://www.formula1.com/en/latest/article/gallery-take-a-look-at-every-angle-of-mclarens-2026-livery.7z5YtdHeuCJaX2XMxLWgMR.7z5YtdHeuCJaX2XMxLWgMR'),
  ferrari: standard('ferrari', 'https://www.formula1.com/en/latest/article/gallery-check-out-every-angle-of-ferraris-2026-f1-car.7HdOPtJJwN5VHJ8XAWVtuS'),
  mercedes: standard('mercedes', 'https://www.formula1.com/en/latest/article/gallery-check-out-every-angle-of-mercedes-new-livery-for-2026.70sm6Znl139u64MesOt5Vf'),
  redbull: standard('redbull', 'https://www.formula1.com/en/latest/article/gallery-every-angle-of-red-bulls-2026-livery.2wkyYJ754lp5juGmqEYlaf'),
  racingbulls: standard('racingbulls', 'https://www.formula1.com/en/latest/article/gallery-check-out-every-angle-of-racing-bulls-2026-livery.4sFYb6zqwZulpzrmxlc2m3'),
  astonmartin: standard('astonmartin', 'https://www.formula1.com/en/latest/article/gallery-check-out-every-angle-of-aston-martins-2026-livery.33hwCL69EtT4X6xpBUTkBA', 'Gallery shows launch livery on a concept rather than the final AMR26 chassis.'),
  alpine: standard('alpine', 'https://www.formula1.com/en/latest/article/gallery-see-all-the-angles-of-alpines-2026-f1-car.29Ovl5O6FJcTNQgwE4Fuwx'),
  williams: standard('williams', 'https://www.formula1.com/en/latest/article/gallery-check-out-every-angle-of-williams-new-livery-for-their-2026-f1-car.5I6ZzmDjZPrMpl9UByTQAV'),
  haas: standard('haas', 'https://www.formula1.com/en/latest/article/gallery-check-out-every-angle-of-haas-livery-design-for-2026.F8aBXbh0IdujXCPIf6ArC'),
  audi: standard('audi', 'https://www.formula1.com/en/latest/article/gallery-all-the-angles-of-audis-2026-f1-car.4i5FnqGOoH5jo67PRpyEud.4i5FnqGOoH5jo67PRpyEud'),
  cadillac: standard('cadillac', 'https://www.formula1.com/en/latest/article/gallery-see-all-the-angles-of-cadillacs-2026-livery.7oVj9gp6OSXescXdqEQVCt.7oVj9gp6OSXescXdqEQVCt', 'February split black/white debut; Belgium-onward revised version must remain separate.'),
};
