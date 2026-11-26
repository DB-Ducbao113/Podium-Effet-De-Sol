import reviewCatalog from "./stormVisualAssets.catalog.json";
import {
  extra2026Hero,
  extra2026TeamPoster,
} from "../../utils/extended2026Visuals";
import {
  driverConcept2026,
  teamConcept2026,
} from "../../utils/f1VisualAssets2026";
import type { SeasonYear, TeamId } from "../../types";

export type StormVisualKind = "car" | "driver" | "team" | "hero";
export type StormVisualSource =
  | "seasonal-concept"
  | "existing-season-portrait"
  | "owner-concept-2026"
  | "missing";

export interface StormVisualAsset {
  readonly src?: string;
  readonly fallbackSrc?: string;
  readonly source: StormVisualSource;
  readonly provenanceNote: string;
  readonly width: number;
  readonly height: number;
}

export const STORM_SEASONAL_CATALOG = reviewCatalog.assets;

const CATALOG_BY_KEY = new Map(
  STORM_SEASONAL_CATALOG.map((asset) => [
    `${asset.kind}:${asset.season}:${asset.entityId}`,
    asset,
  ]),
);

export function resolveStormKindDirectory(kind: StormVisualKind): string {
  return kind === "hero" ? "heroes" : `${kind}s`;
}

function imageDimensions(kind: StormVisualKind) {
  if (kind === "car") return { width: 526, height: 235 };
  if (kind === "team") return { width: 526, height: 839 };
  if (kind === "hero") return { width: 1600, height: 900 };
  return { width: 341, height: 436 };
}

/**
 * Resolves production-shipped seasonal editorial artwork under `/images/` with
 * zero DEV-only prototype middleware dependencies (`REQ-01`, `BR-01`).
 */
export function resolveStormVisualAsset(
  kind: StormVisualKind,
  season: SeasonYear,
  entityId: string,
): StormVisualAsset {
  const dimensions = imageDimensions(kind);
  const catalogHit = CATALOG_BY_KEY.get(`${kind}:${season}:${entityId}`);

  if (catalogHit) {
    const dir = resolveStormKindDirectory(kind);
    const fallbackSrc =
      kind === "driver" && (season === 2024 || season === 2025)
        ? `/images/driver-portraits-ai/${season}-${entityId}.webp`
        : undefined;
    return {
      src: `/images/concepts-${season}/${dir}/${catalogHit.outputFile}`,
      fallbackSrc,
      source: "seasonal-concept",
      provenanceNote: "Illustrative editorial concept",
      ...dimensions,
    };
  }

  if (kind === "driver" && (season === 2024 || season === 2025)) {
    const known2024Or2025Ids = new Set([
      "albon",
      "alonso",
      "antonelli",
      "bearman",
      "bortoleto",
      "bottas",
      "colapinto",
      "doohan",
      "gasly",
      "hadjar",
      "hamilton",
      "hulkenberg",
      "lawson",
      "leclerc",
      "magnussen",
      "norris",
      "ocon",
      "perez",
      "piastri",
      "ricciardo",
      "russell",
      "sainz",
      "sargeant",
      "stroll",
      "tsunoda",
      "verstappen",
      "zhou",
    ]);
    if (known2024Or2025Ids.has(entityId)) {
      return {
        src: `/images/driver-portraits-ai/${season}-${entityId}.webp`,
        source: "existing-season-portrait",
        provenanceNote: "Illustrative seasonal portrait",
        ...dimensions,
      };
    }
  }

  const concept2026 =
    kind === "car"
      ? teamConcept2026(entityId, season)
      : kind === "team"
        ? extra2026TeamPoster(entityId as TeamId, season)?.src
        : kind === "hero"
          ? extra2026Hero(
              entityId as "drivers" | "constructors" | "championship",
              season,
            )?.src
          : driverConcept2026(entityId, season);

  if (concept2026) {
    return {
      src: concept2026,
      source: "owner-concept-2026",
      provenanceNote: "Illustrative 2026 editorial concept",
      ...dimensions,
    };
  }

  return {
    source: "missing",
    provenanceNote: "Visual unavailable",
    ...dimensions,
  };
}

export function resolveStormSeasonTeamName(
  teamId: TeamId,
  season: SeasonYear,
): string | undefined {
  return STORM_SEASONAL_CATALOG.find(
    (asset) =>
      asset.kind === "car" &&
      asset.season === season &&
      asset.entityId === teamId,
  )?.teamName;
}
