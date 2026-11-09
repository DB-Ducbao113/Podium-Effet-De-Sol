/**
 * Model B's paint-first, component-by-component review contract.
 *
 * These 30 logical component families expand to independent physical L/R and
 * per-wheel surfaces. They are semantic design targets, NOT verified GLB mesh
 * names, UV islands or bounding boxes. A component must be attached to measured
 * Model B geometry before it may be marked geometry/visual-approved.
 */
export type ComponentFamily =
  | 'front-wing' | 'nose' | 'cockpit' | 'sidepod' | 'engine-cover'
  | 'floor' | 'wheel' | 'rear-body' | 'rear-wing' | 'diffuser';

export type CaptureAngle =
  | 'left' | 'right' | 'front' | 'rear' | 'top'
  | 'front-quarter-left' | 'front-quarter-right' | 'rear-quarter';

export type SponsorSuitability = 'possible-after-geometry-audit' | 'graphic-only' | 'none';
export type SurfaceSide = 'center' | 'left' | 'right' | 'front-left' | 'front-right' | 'rear-left' | 'rear-right';
export type SurfaceEvidence = 'semantic-only' | 'mesh-mapped' | 'render-verified';

export interface ModelBComponentGroup {
  /** Stable logical group; both sides always get distinct physical IDs. */
  id: string;
  title: string;
  family: ComponentFamily;
  sides: readonly SurfaceSide[];
  referenceAngles: readonly CaptureAngle[];
  sponsorSuitability: SponsorSuitability;
  priority: 'critical' | 'high' | 'normal';
  paintRole: 'body' | 'carbon-or-paint' | 'wheel' | 'rubber';
  designNotes: string;
}

const bilateral = ['left', 'right'] as const;
const wheelSides = ['front-left', 'front-right', 'rear-left', 'rear-right'] as const;
const single = ['center'] as const;
const sideAngles = ['left', 'right', 'front-quarter-left', 'front-quarter-right'] as const;
const frontAngles = ['front', 'top', 'front-quarter-left', 'front-quarter-right'] as const;
const rearAngles = ['rear', 'top', 'rear-quarter'] as const;

/** Every row is a distinct *design decision*, including the small inlet lip. */
export const MODEL_B_COMPONENT_GROUPS: readonly ModelBComponentGroup[] = [
  { id: 'fw-center', title: 'Front wing — centre', family: 'front-wing', sides: single, referenceAngles: frontAngles, sponsorSuitability: 'graphic-only', priority: 'critical', paintRole: 'carbon-or-paint', designNotes: 'Keep nose-to-wing split and lower/front faces distinct; no blanket front-wing rectangle.' },
  { id: 'fw-outer', title: 'Front wing — outer flaps', family: 'front-wing', sides: bilateral, referenceAngles: frontAngles, sponsorSuitability: 'possible-after-geometry-audit', priority: 'critical', paintRole: 'carbon-or-paint', designNotes: 'Left/right flap colors and transitions must be reviewed independently.' },
  { id: 'fw-endplate', title: 'Front wing — endplates', family: 'front-wing', sides: bilateral, referenceAngles: frontAngles, sponsorSuitability: 'possible-after-geometry-audit', priority: 'high', paintRole: 'carbon-or-paint', designNotes: 'Review outer/inner faces; do not assume upper and front faces match.' },
  { id: 'nose-tip', title: 'Nose — front tip', family: 'nose', sides: single, referenceAngles: frontAngles, sponsorSuitability: 'graphic-only', priority: 'critical', paintRole: 'body', designNotes: 'Inspect tip silhouette, taper and front-wing junction.' },
  { id: 'nose-top', title: 'Nose — upper spine', family: 'nose', sides: single, referenceAngles: frontAngles, sponsorSuitability: 'possible-after-geometry-audit', priority: 'critical', paintRole: 'body', designNotes: 'Track exact color boundary into cockpit/halo.' },
  { id: 'nose-side', title: 'Nose — sidewalls', family: 'nose', sides: bilateral, referenceAngles: sideAngles, sponsorSuitability: 'possible-after-geometry-audit', priority: 'critical', paintRole: 'body', designNotes: 'The purple-outline example: audit small sidewall paint and front-wing-body transition separately.' },
  { id: 'cockpit-surround', title: 'Cockpit — surround', family: 'cockpit', sides: single, referenceAngles: ['top','front-quarter-left','front-quarter-right'], sponsorSuitability: 'graphic-only', priority: 'high', paintRole: 'body', designNotes: 'Distinct from nose and engine-cover masks.' },
  { id: 'halo-top', title: 'Halo — upper bridge', family: 'cockpit', sides: single, referenceAngles: ['top','front-quarter-left','front-quarter-right'], sponsorSuitability: 'graphic-only', priority: 'high', paintRole: 'carbon-or-paint', designNotes: 'No spill from roof projection over thin supports.' },
  { id: 'halo-side', title: 'Halo — side surfaces', family: 'cockpit', sides: bilateral, referenceAngles: sideAngles, sponsorSuitability: 'possible-after-geometry-audit', priority: 'high', paintRole: 'carbon-or-paint', designNotes: 'Separate support paint, carbon and small logo positions.' },
  { id: 'airbox-front', title: 'Airbox — front intake', family: 'cockpit', sides: single, referenceAngles: frontAngles, sponsorSuitability: 'none', priority: 'high', paintRole: 'carbon-or-paint', designNotes: 'Intake opening stays an opening; do not paint across its void.' },
  { id: 'sidepod-inlet-lip', title: 'Sidepod — intake lip', family: 'sidepod', sides: bilateral, referenceAngles: sideAngles, sponsorSuitability: 'graphic-only', priority: 'critical', paintRole: 'body', designNotes: 'The yellow-outline example: narrow lip must be separate from main sidepod and inlet interior.' },
  { id: 'sidepod-upper', title: 'Sidepod — upper shoulder', family: 'sidepod', sides: bilateral, referenceAngles: ['top',...sideAngles], sponsorSuitability: 'possible-after-geometry-audit', priority: 'critical', paintRole: 'body', designNotes: 'The cyan-outline example: distinguish upper shell from the vertical sidepod face.' },
  { id: 'sidepod-main-face', title: 'Sidepod — main outer face', family: 'sidepod', sides: bilateral, referenceAngles: sideAngles, sponsorSuitability: 'possible-after-geometry-audit', priority: 'critical', paintRole: 'body', designNotes: 'Largest brand-color shapes; match curves, height and leading/trailing edges, independent left/right.' },
  { id: 'sidepod-undercut', title: 'Sidepod — undercut', family: 'sidepod', sides: bilateral, referenceAngles: sideAngles, sponsorSuitability: 'none', priority: 'critical', paintRole: 'carbon-or-paint', designNotes: 'Under-inlet fold: deep shadows are not necessarily black paint.' },
  { id: 'sidepod-lower', title: 'Sidepod — lower edge', family: 'sidepod', sides: bilateral, referenceAngles: sideAngles, sponsorSuitability: 'graphic-only', priority: 'high', paintRole: 'carbon-or-paint', designNotes: 'Must meet floor carbon without unplanned mask seams.' },
  { id: 'engine-cover-side', title: 'Engine cover — side', family: 'engine-cover', sides: bilateral, referenceAngles: sideAngles, sponsorSuitability: 'possible-after-geometry-audit', priority: 'critical', paintRole: 'body', designNotes: 'The pink-outline example: carry shapes smoothly rearwards; graphics are not sponsor wordmarks.' },
  { id: 'engine-cover-top', title: 'Engine cover — top', family: 'engine-cover', sides: single, referenceAngles: ['top','rear-quarter'], sponsorSuitability: 'possible-after-geometry-audit', priority: 'critical', paintRole: 'body', designNotes: 'Upper livery and dorsal graphics need a dedicated patch rather than a normal-driven side blend.' },
  { id: 'spine', title: 'Engine cover — dorsal spine', family: 'engine-cover', sides: single, referenceAngles: ['top','rear-quarter'], sponsorSuitability: 'graphic-only', priority: 'high', paintRole: 'body', designNotes: 'Verify central stripe/colored spine if the team design features one.' },
  { id: 'airbox-surround', title: 'Airbox — outer surround', family: 'engine-cover', sides: single, referenceAngles: ['top','front-quarter-left','front-quarter-right'], sponsorSuitability: 'graphic-only', priority: 'high', paintRole: 'body', designNotes: 'Separate from open intake/front aperture.' },
  { id: 'floor-edge', title: 'Floor — side edges', family: 'floor', sides: bilateral, referenceAngles: sideAngles, sponsorSuitability: 'none', priority: 'high', paintRole: 'carbon-or-paint', designNotes: 'Follow floor edge silhouette; avoid painting exposed carbon unintentionally.' },
  { id: 'floor-upper', title: 'Floor — upper shoulders', family: 'floor', sides: bilateral, referenceAngles: ['top',...sideAngles], sponsorSuitability: 'graphic-only', priority: 'normal', paintRole: 'carbon-or-paint', designNotes: 'Distinguish upper floor from sidepod lower body.' },
  { id: 'floor-fence', title: 'Floor — fences/vanes', family: 'floor', sides: bilateral, referenceAngles: sideAngles, sponsorSuitability: 'none', priority: 'normal', paintRole: 'carbon-or-paint', designNotes: 'Only paint a vane if the Model B mesh actually contains that surface.' },
  { id: 'wheel-cover', title: 'Wheel — cover/hub', family: 'wheel', sides: wheelSides, referenceAngles: sideAngles, sponsorSuitability: 'graphic-only', priority: 'high', paintRole: 'wheel', designNotes: 'The photographed rim/cover treatment must be independent at all four wheels.' },
  { id: 'rim-accent', title: 'Wheel — rim accents', family: 'wheel', sides: wheelSides, referenceAngles: sideAngles, sponsorSuitability: 'none', priority: 'high', paintRole: 'wheel', designNotes: 'Do not add decorative rainbow or team-colored rings without on-car photographic proof.' },
  { id: 'tire-sidewall', title: 'Tire — sidewalls', family: 'wheel', sides: wheelSides, referenceAngles: sideAngles, sponsorSuitability: 'none', priority: 'high', paintRole: 'rubber', designNotes: 'Rubber stays rubber; tire marking/compound graphic requires its own licensed reference.' },
  { id: 'rear-body', title: 'Rear body — before wing', family: 'rear-body', sides: bilateral, referenceAngles: ['left','right','rear-quarter'], sponsorSuitability: 'possible-after-geometry-audit', priority: 'high', paintRole: 'carbon-or-paint', designNotes: 'Transition from sidepod and cover to rear suspension/wing.' },
  { id: 'rw-main-rear', title: 'Rear wing — rear-facing plane', family: 'rear-wing', sides: single, referenceAngles: rearAngles, sponsorSuitability: 'possible-after-geometry-audit', priority: 'critical', paintRole: 'carbon-or-paint', designNotes: 'Rear-face paint can differ from top; must be captured separately.' },
  { id: 'rw-top', title: 'Rear wing — upper main plane', family: 'rear-wing', sides: single, referenceAngles: rearAngles, sponsorSuitability: 'possible-after-geometry-audit', priority: 'critical', paintRole: 'carbon-or-paint', designNotes: 'Inspect both flaps, outer panels, top face, independent of rear sponsor art.' },
  { id: 'rw-endplate', title: 'Rear wing — endplates', family: 'rear-wing', sides: bilateral, referenceAngles: ['left','right','rear-quarter'], sponsorSuitability: 'possible-after-geometry-audit', priority: 'high', paintRole: 'carbon-or-paint', designNotes: 'Both sides, both faces; do not duplicate one source blindly.' },
  { id: 'diffuser-visible', title: 'Rear — diffuser visible', family: 'diffuser', sides: single, referenceAngles: rearAngles, sponsorSuitability: 'none', priority: 'normal', paintRole: 'carbon-or-paint', designNotes: 'Do not paint underbody carbon based on nearby body colors.' },
] as const;

export interface ModelBPhysicalSurface {
  id: string;
  groupId: string;
  title: string;
  family: ComponentFamily;
  side: SurfaceSide;
  referenceAngles: readonly CaptureAngle[];
  sponsorSuitability: SponsorSuitability;
  priority: ModelBComponentGroup['priority'];
  paintRole: ModelBComponentGroup['paintRole'];
  /** Never set true until a mesh/connected patch has been inspected. */
  geometryEvidence: SurfaceEvidence;
  meshName: string | null;
  designNotes: string;
}

export const MODEL_B_PHYSICAL_SURFACES: readonly ModelBPhysicalSurface[] =
  MODEL_B_COMPONENT_GROUPS.flatMap((group) => group.sides.map((side) => ({
    id: side === 'center' ? group.id : `${group.id}-${side}`,
    groupId: group.id,
    title: side === 'center' ? group.title : `${group.title} (${side})`,
    family: group.family,
    side,
    referenceAngles: group.referenceAngles,
    sponsorSuitability: group.sponsorSuitability,
    priority: group.priority,
    paintRole: group.paintRole,
    geometryEvidence: 'semantic-only' as const,
    meshName: null,
    designNotes: group.designNotes,
  })));

export function groupForSurface(surfaceId: string): ModelBComponentGroup | undefined {
  const surface = MODEL_B_PHYSICAL_SURFACES.find((item) => item.id === surfaceId);
  return MODEL_B_COMPONENT_GROUPS.find((group) => group.id === surface?.groupId);
}
