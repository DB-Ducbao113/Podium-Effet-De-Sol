import type { PrecisionTeam } from './paintAtlas';
import {
  MODEL_B_COMPONENT_GROUPS,
  type ModelBComponentGroup,
} from './modelBComponentMap';

export type PaintLayoutStatus =
  | 'reference-confirmed-gap' // concrete source description vs missing/wrong region
  | 'code-geometry-risk'      // static atlas or shader can spill over a physical seam
  | 'photo-review-required';  // no side-by-side proof for this exact part

export type PaintLayoutEvidence = 'official-design-description' | 'source-code' | 'pending-photo';

export interface PaintLayoutFinding {
  teamId: PrecisionTeam;
  groupId: string;
  status: PaintLayoutStatus;
  evidence: PaintLayoutEvidence;
  summary: string;
  /** Source used for evidence. Empty for code-only geometry concerns. */
  sourceUrl?: string;
}

const williamsSource = 'https://www.williamsf1.com/articles/5363520c-1e22-4d62-a568-7f1c7b6ff529/atlassian-williams-f1-team-reveals-bold-new-racing-livery-for-2026';
const mercedesSource = 'https://www.mercedesamgf1.com/news/mercedes-amg-f1-season-launch-2026-a-new-era-begins';
const racingBullsSource = 'https://www.redbull.com/us-en/visa-cash-app-racing-bulls-2026-f1-livery-launch';
const ferrariSource = 'https://www.formula1.com/en/latest/article/gallery-check-out-every-angle-of-ferraris-2026-f1-car.7HdOPtJJwN5VHJ8XAWVtuS';

/**
 * A gap is not a measured rendered difference. A code-risk is not an
 * assertion that the real car looks one specific way. No entry means the
 * region has NOT yet been audited, rather than being considered correct.
 *
 * Large TEAM identity graphics belong to paint-layout audit, but paid
 * sponsor wordmarks are intentionally excluded until paint passes.
 */
export const PAINT_LAYOUT_FINDINGS: readonly PaintLayoutFinding[] = [
  { teamId: 'ferrari', groupId: 'rw-top', status: 'reference-confirmed-gap', evidence: 'official-design-description', summary: 'Current rear-wing top atlas adds a blue color block over its dark wing base; check same-date SF-26 launch wing, then eliminate the unrelated block.', sourceUrl: ferrariSource },
  { teamId: 'ferrari', groupId: 'engine-cover-top', status: 'code-geometry-risk', evidence: 'source-code', summary: 'White cockpit-to-airbox mask is a world-space polygon; its boundary has not been aligned to the Model B cover seams.' },
  { teamId: 'ferrari', groupId: 'airbox-surround', status: 'photo-review-required', evidence: 'pending-photo', summary: 'Verify the white treatment around the airbox against overhead and side views of one launch variant.' },

  { teamId: 'mclaren', groupId: 'fw-outer', status: 'code-geometry-risk', evidence: 'source-code', summary: 'Papaya flap bands share one top world-space region and may cross independent wing flaps/endplates.' },
  { teamId: 'mclaren', groupId: 'sidepod-upper', status: 'code-geometry-risk', evidence: 'source-code', summary: 'Papaya/anthracite shoulder break has no component-surface boundary; side and top projection blend by normal rather than UV island.' },
  { teamId: 'mclaren', groupId: 'sidepod-inlet-lip', status: 'photo-review-required', evidence: 'pending-photo', summary: 'Separately compare the tiny intake rim, as in the yellow-highlighted reference example.' },
  { teamId: 'mclaren', groupId: 'rim-accent', status: 'code-geometry-risk', evidence: 'source-code', summary: 'DEV McLaren wheel overlay procedurally generates rainbow torus accents; do not certify as the launch livery without physical wheel-cover evidence.' },

  { teamId: 'mercedes', groupId: 'sidepod-upper', status: 'reference-confirmed-gap', evidence: 'official-design-description', summary: 'Team confirms AMG rhombus signature atop sidepods; the atlas only has broad silver and turquoise polygons, without rhombus pattern.', sourceUrl: mercedesSource },
  { teamId: 'mercedes', groupId: 'engine-cover-side', status: 'reference-confirmed-gap', evidence: 'official-design-description', summary: 'Official Mercedes three-pointed-star pattern on engine cover is missing from paint-map graphics.', sourceUrl: mercedesSource },
  { teamId: 'mercedes', groupId: 'sidepod-main-face', status: 'reference-confirmed-gap', evidence: 'official-design-description', summary: 'PETRONAS green flow line must sweep low along the real sidepod/body silhouette; current straight polygon band is unverified.', sourceUrl: mercedesSource },
  { teamId: 'mercedes', groupId: 'nose-top', status: 'photo-review-required', evidence: 'pending-photo', summary: 'Check silver nose spine and center black transition in official overhead images.' },

  { teamId: 'redbull', groupId: 'engine-cover-side', status: 'code-geometry-risk', evidence: 'source-code', summary: 'Large red/yellow bull-and-sun identity is a separate logo decal and not aligned to a verified continuous body-color region.' },
  { teamId: 'redbull', groupId: 'rw-main-rear', status: 'photo-review-required', evidence: 'pending-photo', summary: 'Inspect rear-facing wing paint separately from top-face blue/black fill.' },
  { teamId: 'redbull', groupId: 'sidepod-main-face', status: 'photo-review-required', evidence: 'pending-photo', summary: 'Check Oracle-area blue base silhouette independently before reapplying sponsor artwork.' },

  { teamId: 'racingbulls', groupId: 'sidepod-upper', status: 'reference-confirmed-gap', evidence: 'official-design-description', summary: 'Official matte-white chassis and Ford-linked blue contour accents need a bodywork-aware transition, rather than generic left/right mirrored polygons.', sourceUrl: racingBullsSource },
  { teamId: 'racingbulls', groupId: 'engine-cover-side', status: 'photo-review-required', evidence: 'pending-photo', summary: 'Separate big team-identity graphic from its white/blue background; measure top/side crop before moving any wordmark.' },
  { teamId: 'racingbulls', groupId: 'nose-side', status: 'code-geometry-risk', evidence: 'source-code', summary: 'Nose-side blue/white accent currently follows global z/y boxes, not nose-wall geometry.' },

  { teamId: 'astonmartin', groupId: 'sidepod-inlet-lip', status: 'code-geometry-risk', evidence: 'source-code', summary: 'Thin lime side accent may run over an inlet opening: split intake lip from undercut and upper shell.' },
  { teamId: 'astonmartin', groupId: 'sidepod-upper', status: 'code-geometry-risk', evidence: 'source-code', summary: 'Green/black seam uses a generic side band, not a measured shoulder topology.' },
  { teamId: 'astonmartin', groupId: 'engine-cover-top', status: 'photo-review-required', evidence: 'pending-photo', summary: 'Gallery initially shows a launch concept; compare standard running-car cover without mixing different versions.' },

  { teamId: 'alpine', groupId: 'nose-top', status: 'code-geometry-risk', evidence: 'source-code', summary: 'Pink nose region is approximated by one top polygon; test the nose-tip-to-cockpit hand-off.' },
  { teamId: 'alpine', groupId: 'halo-side', status: 'photo-review-required', evidence: 'pending-photo', summary: 'Verify physical pink coverage on both halo supports separately from neighboring cockpit body.' },
  { teamId: 'alpine', groupId: 'rw-endplate', status: 'code-geometry-risk', evidence: 'source-code', summary: 'Wing endplate pink/black accents need individual inner and outer-face masks.' },

  { teamId: 'williams', groupId: 'sidepod-main-face', status: 'reference-confirmed-gap', evidence: 'official-design-description', summary: 'White extends across sidepod, while cyan branding field and black rear sweep coexist. Current limited white rear polygon + cyan band need per-surface coverage verification; do NOT recolor the whole sidepod white.', sourceUrl: williamsSource },
  { teamId: 'williams', groupId: 'fw-outer', status: 'reference-confirmed-gap', evidence: 'official-design-description', summary: 'Williams explicitly extends white to front wing; check each wing flap and both upper/front faces.', sourceUrl: williamsSource },
  { teamId: 'williams', groupId: 'rw-top', status: 'reference-confirmed-gap', evidence: 'official-design-description', summary: 'White must appear on the rear wing as well; current top polygon only establishes a dark block with no dedicated white wing mask.', sourceUrl: williamsSource },
  { teamId: 'williams', groupId: 'rear-body', status: 'reference-confirmed-gap', evidence: 'official-design-description', summary: 'Black rearward sweep with red/white heritage keyline requires independent spline paths, not a black rectangle.', sourceUrl: williamsSource },
  { teamId: 'williams', groupId: 'sidepod-inlet-lip', status: 'photo-review-required', evidence: 'pending-photo', summary: 'Inspect intake-lip color separately from turquoise main side and upper blue shoulder.' },

  { teamId: 'haas', groupId: 'fw-outer', status: 'code-geometry-risk', evidence: 'source-code', summary: 'Red/black front-wing polygons cross a generic top atlas; independent flap and endplate paint remain unverified.' },
  { teamId: 'haas', groupId: 'engine-cover-side', status: 'code-geometry-risk', evidence: 'source-code', summary: 'Angular rising red treatment over white and black must be joined to top cover without a projection seam.' },
  { teamId: 'haas', groupId: 'rw-main-rear', status: 'photo-review-required', evidence: 'pending-photo', summary: 'Verify rear face of wing; current high-level wing-mask placement may not match flap geometry.' },

  { teamId: 'audi', groupId: 'sidepod-main-face', status: 'code-geometry-risk', evidence: 'source-code', summary: 'Red geometry is a world-space wedge, not a cut tied to the sidepod panel boundaries.' },
  { teamId: 'audi', groupId: 'engine-cover-side', status: 'code-geometry-risk', evidence: 'source-code', summary: 'The titanium/black transition needs a component-aware shoulder and cover edge.' },
  { teamId: 'audi', groupId: 'nose-top', status: 'photo-review-required', evidence: 'pending-photo', summary: 'Confirm extent of titanium front nose under a top camera and standard 2026 photo.' },

  { teamId: 'cadillac', groupId: 'nose-top', status: 'code-geometry-risk', evidence: 'source-code', summary: 'Asymmetric front/top boundary is currently a straight x=0 atlas split; source has richer cut shapes.' },
  { teamId: 'cadillac', groupId: 'sidepod-inlet-lip', status: 'photo-review-required', evidence: 'pending-photo', summary: 'Examine intake rim on light and dark physical sides separately.' },
  { teamId: 'cadillac', groupId: 'rw-endplate', status: 'photo-review-required', evidence: 'pending-photo', summary: 'Two-sided rear wing cannot inherit one-side colors from the simple main-body x split.' },
  { teamId: 'cadillac', groupId: 'engine-cover-top', status: 'code-geometry-risk', evidence: 'source-code', summary: 'The physical-left-light/right-dark boundary currently ignores panel curvature and graphics.' },
];

export interface ComponentReview {
  group: ModelBComponentGroup;
  status: PaintLayoutStatus;
  finding: PaintLayoutFinding | null;
  /** Status reflects a backlog, never approval. */
  approved: false;
}

export function getPaintLayoutReview(teamId: PrecisionTeam): readonly ComponentReview[] {
  return MODEL_B_COMPONENT_GROUPS.map((group) => {
    const finding = PAINT_LAYOUT_FINDINGS.find((item) =>
      item.teamId === teamId && item.groupId === group.id,
    ) ?? null;
    return {
      group,
      finding,
      status: finding?.status ?? 'photo-review-required',
      approved: false,
    };
  });
}

export function getPaintLayoutCounts(teamId: PrecisionTeam) {
  const rows = getPaintLayoutReview(teamId);
  return {
    total: rows.length,
    confirmedGaps: rows.filter((row) => row.status === 'reference-confirmed-gap').length,
    codeRisks: rows.filter((row) => row.status === 'code-geometry-risk').length,
    photoNeeded: rows.filter((row) => row.status === 'photo-review-required').length,
    approved: 0,
  };
}
