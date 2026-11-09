import { useState } from "react";
import type { SeasonYear } from "../../../types";

const teamSlugs: Record<string, string> = {
  ferrari: "ferrari",
  mercedes: "mercedes",
  mclaren: "mclaren",
  redbull: "red-bull",
  astonmartin: "aston-martin",
  williams: "williams",
  audi: "audi",
  alpine: "alpine",
  haas: "haas",
  racingbulls: "racing-bulls",
  cadillac: "cadillac",
};

const historicalTeamSlugs: Record<string, string> = {
  ferrari: "ferrari",
  mercedes: "mercedes",
  mclaren: "mclaren",
  redbull: "redbull",
  astonmartin: "astonmartin",
  williams: "williams",
  alpine: "alpine",
  haas: "haas",
  racingbulls: "racingbulls",
  sauber: "sauber",
};

export function MiniRaceCar({
  season,
  teamId,
  eager,
}: {
  season: SeasonYear;
  teamId: string;
  eager: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const isHistoricalSeason = season === 2024 || season === 2025;
  const slug = import.meta.env.DEV
    ? season === 2026
      ? teamSlugs[teamId]
      : isHistoricalSeason
        ? historicalTeamSlugs[teamId]
        : undefined
    : undefined;
  const gifPath = slug
    ? season === 2026
      ? `gifs/${slug}-2026-side.gif`
      : `${season}/${slug}-${season}.gif`
    : undefined;
  const posterPath = slug
    ? season === 2026
      ? `posters/${slug}-2026-side.webp`
      : `posters/${season}/${slug}-${season}.webp`
    : undefined;
  return (
    <span
      className={`mini-race__car-slot${slug && !failed ? " mini-race__car-slot--image" : ""}`}
    >
      {slug && !failed && (
        <picture>
          <source
            media="(prefers-reduced-motion: reduce)"
            srcSet={`/__peds-mini-race/${posterPath}`}
            type="image/webp"
          />
          <img
            src={`/__peds-mini-race/${gifPath}`}
            alt=""
            width={600}
            height={240}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            onError={() => setFailed(true)}
          />
        </picture>
      )}
    </span>
  );
}
