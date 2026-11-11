import type { SeasonYear } from '../../types';
import {
  cinematicSrc,
  cinematicSrcSet,
  getDriverCinematic,
  type CinematicImageCredit,
} from '../../utils/driverCinematic';
import './cinematicImage.css';

type Lang = 'vi' | 'en';

export function DriverRaceImage({
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

export function DriverCinematicCredit({
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
  const item: CinematicImageCredit = image.race;
  return (
    <p className="p5-cinematic-credit">
      <span className="p5-cinematic-credit-label">
        {lang === 'vi' ? 'Ảnh đua 2026' : '2026 race photography'}
      </span>
      <span>
        {lang === 'vi' ? 'Chế độ đua' : 'Race mode'}{' '}
        <a href={item.sourcePage} target="_blank" rel="noopener noreferrer">
          {item.event} · {item.artist}
        </a>{' '}
        · {item.license}
      </span>
    </p>
  );
}
