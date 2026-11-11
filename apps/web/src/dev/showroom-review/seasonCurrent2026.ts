import { MODEL_B_PHYSICAL_SURFACES } from "./modelBComponentMap";
import { liveryDefinitions } from "./liveryDefinitions";
import { STANDARD_2026_REFERENCE_SETS } from "./standard2026References";
import { artwork } from "./officialArtwork";
import photoIndex from "./official2026PhotoIndex.json";
import type { PrecisionTeam } from "./paintAtlas";

export const CURRENT_VARIANT_ID = "season-current-2026-11-06" as const;
export function defaultStudyVariant(_teamId: PrecisionTeam) {
  return CURRENT_VARIANT_ID;
}
export const REQUIRED_VIEWS = [
  "left",
  "right",
  "front",
  "rear",
  "top",
  "under",
  "front-quarter-left",
  "front-quarter-right",
  "rear-quarter-left",
  "rear-quarter-right",
] as const;
export type RequiredView = (typeof REQUIRED_VIEWS)[number];
type EvidenceStatus = "unverified" | "source-verified";

export interface ReferenceView {
  angle: RequiredView;
  status: EvidenceStatus;
  photoUrl: string | null;
  photoDate: string | null;
  source: string | null;
  confidence: "none" | "low" | "medium" | "high";
}

export interface CurrentSeasonRecord {
  teamId: PrecisionTeam;
  variantId: typeof CURRENT_VARIANT_ID;
  launchVariantId: "season-default-2026";
  variantEvidenceUrl: string;
  variantNote: string;
  currentPhotoIds: readonly string[];
  corroboratingPhotoIds: readonly string[];
  views: readonly ReferenceView[];
  paintRegions: readonly {
    surfaceId: string;
    side: string;
    modelBMesh: string | null;
    sourcePhotoUrl: string | null;
    status: EvidenceStatus;
  }[];
  logoInstances: readonly {
    id: string;
    artwork: string;
    surface: string;
    side: string;
    sourcePhotoUrl: string | null;
    artworkSource: string | null;
    rights: "owner-authorized-dev";
    placement: "unplaced";
  }[];
  renderStatus: "pending-photo-and-owner-review";
}

const cadillacRevision =
  "https://www.formula1.com/en/latest/article/why-cadillac-have-decided-to-switch-up-their-livery.2yJrSHrgmbFpUCW3lZiMYQ";
const mercedesMexicoGallery =
  "https://www.mercedesamgf1.com/news/in-pictures-the-best-images-from-mexico-city-2026";
const cadillacLogoObservations = [
  {
    id: "cadillac-current-cadillac-rear-wing",
    artwork: "cadillacWordmark",
    surface: "rear wing face",
    side: "rear",
    photoId: "cadillac-current-01",
  },
  {
    id: "cadillac-current-ifs-rear-endplate",
    artwork: "ifs",
    surface: "rear wing endplate",
    side: "unresolved",
    photoId: "cadillac-current-02",
  },
  {
    id: "cadillac-current-3m-front-wing",
    artwork: "3m",
    surface: "front wing endplate",
    side: "unresolved",
    photoId: "cadillac-current-02",
  },
  {
    id: "cadillac-current-cadillac-cockpit",
    artwork: "cadillacScript",
    surface: "cockpit shoulder",
    side: "unresolved",
    photoId: "cadillac-current-01",
  },
  {
    id: "cadillac-current-cadillac-cockpit-left",
    artwork: "cadillacScript",
    surface: "cockpit shoulder",
    side: "left",
    photoId: "cadillac-current-belgium-side",
  },
  {
    id: "cadillac-current-3m-front-wing-left",
    artwork: "3m",
    surface: "front wing endplate",
    side: "left",
    photoId: "cadillac-current-belgium-side",
  },
  {
    id: "cadillac-current-claro-sidepod-left",
    artwork: "claro",
    surface: "forward sidepod",
    side: "left",
    photoId: "cadillac-current-belgium-side",
  },
  {
    id: "cadillac-current-jim-beam-floor-left",
    artwork: "jimBeam",
    surface: "sidepod lower panel",
    side: "left",
    photoId: "cadillac-current-belgium-side",
  },
  {
    id: "cadillac-current-twg-sidepod-left",
    artwork: "twg",
    surface: "sidepod outer panel",
    side: "left",
    photoId: "cadillac-current-belgium-side",
  },
  {
    id: "cadillac-current-core-scientific-cover-left",
    artwork: "coreScientific",
    surface: "engine cover shoulder",
    side: "left",
    photoId: "cadillac-current-belgium-side",
  },
  {
    id: "cadillac-current-ifs-rear-endplate-left",
    artwork: "ifs",
    surface: "rear wing endplate",
    side: "left",
    photoId: "cadillac-current-belgium-side",
  },
  {
    id: "cadillac-current-usa-rear-wing",
    artwork: "usaLettering",
    surface: "rear wing aft face",
    side: "rear",
    photoId: "cadillac-current-belgium-rear",
  },
] as const;
const verifiedViewPhotos: Partial<
  Record<PrecisionTeam, Partial<Record<RequiredView, string>>>
> = {
  cadillac: {
    left: "cadillac-current-belgium-side",
    right: "cadillac-current-02",
    front: "cadillac-current-belgium-front",
    rear: "cadillac-current-belgium-rear",
  },
  mercedes: { right: "mercedes-current-mexico-side" },
  mclaren: { front: "mclaren-current-01" },
  redbull: { front: "redbull-current-01" },
  alpine: { front: "alpine-current-01" },
};

function currentView(
  teamId: PrecisionTeam,
  angle: RequiredView,
): ReferenceView {
  const photo = photoIndex.find(
    (item) => item.id === verifiedViewPhotos[teamId]?.[angle],
  );
  return photo
    ? {
        angle,
        status: "source-verified",
        photoUrl: photo.imageUrl,
        photoDate: photo.photoDate,
        source: photo.sourceUrl,
        confidence: "medium",
      }
    : {
        angle,
        status: "unverified",
        photoUrl: null,
        photoDate: null,
        source: null,
        confidence: "none",
      };
}

/**
 * A dated research ledger, not a render registry. A gallery or partner page
 * cannot prove an individual angle, logo occurrence, permission, or placement.
 */
export const CURRENT_2026_REVIEW: Record<PrecisionTeam, CurrentSeasonRecord> = (
  Object.keys(STANDARD_2026_REFERENCE_SETS) as PrecisionTeam[]
).reduce(
  (records, teamId) => {
    const launch = STANDARD_2026_REFERENCE_SETS[teamId];
    const isCadillac = teamId === "cadillac";
    const isMercedes = teamId === "mercedes";
    const currentPhotos = photoIndex.filter(
      (photo) =>
        photo.teamId === teamId && photo.variantId === CURRENT_VARIANT_ID,
    );
    const selectedPhotos = isCadillac
      ? currentPhotos.filter(
          (photo) =>
            photo.photoDate === "2026-07-17" ||
            photo.id.startsWith("cadillac-current-belgium-"),
        )
      : currentPhotos;
    records[teamId] = {
      teamId,
      variantId: CURRENT_VARIANT_ID,
      launchVariantId: launch.variantId,
      variantEvidenceUrl: isCadillac
        ? cadillacRevision
        : isMercedes
          ? mercedesMexicoGallery
          : (currentPhotos[0]?.sourceUrl ?? launch.galleryUrl),
      variantNote: isCadillac
        ? "Belgium 2026-07-17 to 2026-07-19 is the selected non-split reference. Cadillac's own race gallery and reports add front, rear and opposite-side evidence. Exact overhead, underside, both rear quarters and logo placement remain under review; later race photos are comparison evidence only."
        : isMercedes
          ? "Mexico City race photographs anchor this black W17 study with PETRONAS green and muted graphite highlights after the Austin one-off. January studio renders document the AMG rhombi and engine-cover stars. Existing DEV logo decals are provisional placements pending owner review."
          : "Dated regular-race photo indexed; full ten-view coverage and whether launch paint remained unchanged are not yet confirmed.",
      currentPhotoIds: selectedPhotos.map((photo) => photo.id),
      corroboratingPhotoIds: currentPhotos
        .filter((photo) => !selectedPhotos.includes(photo))
        .map((photo) => photo.id),
      views: REQUIRED_VIEWS.map((angle) => currentView(teamId, angle)),
      paintRegions: MODEL_B_PHYSICAL_SURFACES.map((surface) => ({
        surfaceId: surface.id,
        side: surface.side,
        modelBMesh: surface.meshName,
        sourcePhotoUrl: null,
        status: "unverified" as const,
      })),
      logoInstances: isCadillac
        ? cadillacLogoObservations.map((observation) => ({
            id: observation.id,
            artwork: observation.artwork,
            surface: observation.surface,
            side: observation.side,
            sourcePhotoUrl:
              selectedPhotos.find((photo) => photo.id === observation.photoId)
                ?.imageUrl ?? null,
            artworkSource: null,
            rights: "owner-authorized-dev" as const,
            placement: "unplaced" as const,
          }))
        : liveryDefinitions[teamId].decals.map((decal) => ({
            id: decal.id,
            artwork: decal.artwork,
            surface: decal.panel,
            side: decal.anchor.side,
            sourcePhotoUrl: null,
            artworkSource: artwork[decal.artwork].source,
            rights: "owner-authorized-dev" as const,
            placement: "unplaced" as const,
          })),
      renderStatus: "pending-photo-and-owner-review" as const,
    };
    return records;
  },
  {} as Record<PrecisionTeam, CurrentSeasonRecord>,
);
