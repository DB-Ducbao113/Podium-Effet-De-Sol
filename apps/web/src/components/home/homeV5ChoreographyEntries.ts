import type { HomeV5Effect } from './homeV5Choreography';

/**
 * Scoped targets: section layouts remain normal and all F1 numbers remain factual.
 * Shared by both engines so the classic rAF loop and ScrollTrigger cannot drift
 * apart while `?motion=gsap` is being compared against it.
 */
export const HOME_V5_ENTRIES: ReadonlyArray<[string, HomeV5Effect]> = [
  ['#race-control .home-live__heading h2','left'],
  ['#race-control .home-live__heading > a','right'],
  ['#race-control .home-rc__next','wipe-left'],
  ['#race-control .home-rc__identity h3','left'],
  ['#race-control .home-rc__map','wipe-right'],
  ['#race-control .home-rc__timing','wipe-right'],
  ['#race-control .home-rc__digits > div','number'],
  ['#race-control .home-rc__session','rise'],
  ['#race-control .home-rc__result','rise'],
  ['#race-control .home-rc__result > strong','number'],
  ['#championship-overview .home-live__heading h2','left'],
  ['#championship-overview .home-title-fight__panel:first-child','wipe-left'],
  ['#championship-overview .home-title-fight__panel:last-child','wipe-right'],
  ['#championship-overview .home-title-fight__rows li','rise'],
  ['#championship-overview .home-title-fight__rank','number'],
  ['#championship-overview .home-title-fight__rows strong','number'],
  ['.home-v5__editorial .home-v5__eyebrow','rise'],
  ['.home-v5__editorial h2','left'],
  ['.home-v5__editorial-copy > p','rise'],
  ['.home-v5__editorial-link','left'],
  ['.home-v5__editorial-art','wipe-right'],
  ['#eds-explore .eds-explore__header h2','left'],
  ['#eds-explore .eds-explore__card:nth-child(odd)','wipe-left'],
  ['#eds-explore .eds-explore__card:nth-child(even)','wipe-right'],
  ['#eds-explore .eds-explore__number','number'],
  ['#eds-explore .eds-explore__bottom strong','rise'],
];

/** One ScrollTrigger per section: layout stays in flow, only these anchors are observed. */
export const HOME_V5_SECTIONS = '#race-control, #championship-overview, .home-v5__editorial, #eds-explore';

export const HOME_V5_ANIMATED_PROPERTIES = [
  '--v5-anim-x',
  '--v5-anim-y',
  '--v5-anim-alpha',
  '--v5-anim-left',
  '--v5-anim-right',
  '--v5-anim-bottom',
] as const;
