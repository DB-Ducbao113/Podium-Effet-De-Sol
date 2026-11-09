import type { SeasonYear } from '../../types';
import {
  cinematicSrc,
  cinematicSrcSet,
  getDriverCinematic,
  type CinematicImageCredit,
} from '../../utils/driverCinematic';
import './p5Cinematic.css';

type Lang = 'vi' | 'en';

export function P5RaceImage({
  driverId,
  season,
  alt,
  sizes = '(max-width: 700px) 90vw, 33vw',
  className = '',
  eager = false,
}: {
  driverId: string;
  season: SeasonYear;
  alt: string;
  sizes?: string;
  className?: string;
  eager?: boolean;
}) {
  const image = getDriverCinematic(driverId, season);
  if (!image) return null;
  return (
    <picture className={`p5-cinematic p5-cinematic-race ${className}`.trim()}>
      <source type="image/avif" srcSet={cinematicSrcSet(image, 'race', 'avif')} sizes={sizes} />
      <source type="image/webp" srcSet={cinematicSrcSet(image, 'race', 'webp')} sizes={sizes} />
      <img
        src={cinematicSrc(image, 'race')}
        alt={alt}
        width={720}
        height={960}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />
    </picture>
  );
}

export function P5ActionImage({
  driverId,
  season,
  alt,
  sizesLand = '100vw',
  sizesPort = '100vw',
  className = '',
  eager = false,
}: {
  driverId: string;
  season: SeasonYear;
  alt: string;
  sizesLand?: string;
  sizesPort?: string;
  className?: string;
  eager?: boolean;
}) {
  const image = getDriverCinematic(driverId, season);
  if (!image) return null;
  return (
    <picture className={`p5-cinematic p5-cinematic-action ${className}`.trim()}>
      <source media="(max-width: 760px)" type="image/avif" srcSet={cinematicSrcSet(image, 'action-port', 'avif')} sizes={sizesPort} />
      <source media="(max-width: 760px)" type="image/webp" srcSet={cinematicSrcSet(image, 'action-port', 'webp')} sizes={sizesPort} />
      <source type="image/avif" srcSet={cinematicSrcSet(image, 'action-land', 'avif')} sizes={sizesLand} />
      <source type="image/webp" srcSet={cinematicSrcSet(image, 'action-land', 'webp')} sizes={sizesLand} />
      <img
        src={cinematicSrc(image, 'action-land')}
        alt={alt}
        width={1920}
        height={1080}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />
    </picture>
  );
}

export function P5CinematicCreditLine({
  driverId,
  season,
  lang,
}: {
  driverId: string;
  season: SeasonYear;
  lang: Lang;
}) {
  const image = getDriverCinematic(driverId, season);
  if (!image) return null;
  const credit = (prefix: string, item: CinematicImageCredit) => (
    <span>
      {prefix}{' '}
      <a href={item.sourcePage} target="_blank" rel="noopener noreferrer">
        {item.event} · {item.artist}
      </a>{' '}
      · {item.license}
    </span>
  );
  return (
    <p className="p5-cinematic-credit">
      <span className="p5-cinematic-credit-label">
        {lang === 'vi' ? 'Ảnh đua 2026' : '2026 race photography'}
      </span>
      {credit(lang === 'vi' ? 'Chế độ đua' : 'Race mode', image.race)}
      {credit(lang === 'vi' ? 'Trên đường đua' : 'On track', image.action)}
    </p>
  );
}
