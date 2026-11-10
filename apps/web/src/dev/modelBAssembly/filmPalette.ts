import type {AssemblyChapterId} from './modelBAssemblyTimeline';

/**
 * P2.17 visual direction sampled from the owner's animejs(2).mp4.
 * The two base colours below are actual scene background samples
 * (not colour estimates from a stock reference).
 *
 * Presentation colours must never mutate the original Model B binary,
 * native CAD source or evidence hashes.
 */
export const FILM_PALETTE={
  graphite:'#242421',
  bone:'#d9d5cd',
  ivory:'#f1eee7',
  copper:'#dcb29f',
  metal:'#8b8981',
  carbon:'#353532',
  rubber:'#181917',
  teal:'#23d9bb',
  lime:'#b4ef58',
  amber:'#e9ab42',
  red:'#f04b64',
} as const;

const LIGHT_CHAPTERS=new Set<AssemblyChapterId>(['cutaway','rear-joints']);

export type FilmTone='dark'|'light';
export const filmToneForChapter=(chapter:AssemblyChapterId):FilmTone=>
  LIGHT_CHAPTERS.has(chapter)?'light':'dark';

export function filmBackground(tone:FilmTone):string{
  return tone==='light'?FILM_PALETTE.bone:FILM_PALETTE.graphite;
}
