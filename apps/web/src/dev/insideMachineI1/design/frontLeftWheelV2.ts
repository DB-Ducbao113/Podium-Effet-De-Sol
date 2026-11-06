/**
 * First V2 visual-design contract: FRONT_LEFT_WHEEL.
 *
 * Values are proposed LOOKDEV treatments, not assertions of genuine F1 metallurgy.
 * Offsets and semantic IDs are taken from the owner-supplied R4.5 manifest.
 * The existing REV4.2 scene/animation remains the approved runtime baseline.
 */

export const ENGINEERING_V2_PALETTE = {
  graphiteBackground: '#080D15',
  graphitePanel: '#0E1721',
  titanium: '#B7C5CE',
  ignition: '#FF5635',
  telemetry: '#56D4E9',
  blueprint: '#EEF3F5',
} as const;

export type MaterialFamily =
  | 'titanium-satin'
  | 'rubber-metal'
  | 'gunmetal'
  | 'brake-carbon'
  | 'carbon-composite';

export type MotionCue = 'lock-release' | 'axial-extract' | 'hub-release' | 'brake-reveal' | 'caliper-clearance' | 'link-relief' | 'mount-release';

export interface PartDesignTicket {
  id: string;
  node: string;
  authoredOffsetZUp: readonly [number, number, number];
  order: number;
  material: MaterialFamily;
  motion: MotionCue;
  inspection: string;
  acceptance: string;
  engineeringConfidence: 'illustrative' | 'unproven-fitment';
}

/**
 * These seven steps control visual storytelling. They do not claim
 * to prescribe a verified real-world pit-stop disassembly procedure.
 */
export const FRONT_LEFT_WHEEL_V2: readonly PartDesignTicket[] = [
  {
    id: 'FRONT_LEFT_WHEEL.CENTER_LOCK_NUT',
    node: 'PEDS_CENTER_LOCK_NUT',
    authoredOffsetZUp: [0, 0.34, 0],
    order: 0,
    material: 'titanium-satin',
    motion: 'lock-release',
    inspection: 'Reveal center nut thickness, edges and hub alignment',
    acceptance: 'No nut-to-wheel interpenetration at 0/25/50/75/100% and reverse',
    engineeringConfidence: 'unproven-fitment',
  },
  {
    id: 'FRONT_LEFT_WHEEL.WHEEL_OUTER',
    node: 'PEDS_WHEEL_OUTER',
    authoredOffsetZUp: [0, 0.66, 0],
    order: 1,
    material: 'rubber-metal',
    motion: 'axial-extract',
    inspection: 'Keep tyre and rim silhouette crisp against graphite background',
    acceptance: 'Tire sidewall stays aligned; no warped disc or duplicate shell',
    engineeringConfidence: 'illustrative',
  },
  {
    id: 'FRONT_LEFT_WHEEL.WHEEL_HUB',
    node: 'PEDS_WHEEL_HUB',
    authoredOffsetZUp: [0, 0.29, 0],
    order: 2,
    material: 'gunmetal',
    motion: 'hub-release',
    inspection: 'Macro view of wheel center, mating face and shaft interface',
    acceptance: 'Do not claim shaft–hub engagement before validated geometry',
    engineeringConfidence: 'unproven-fitment',
  },
  {
    id: 'FRONT_LEFT_WHEEL.BRAKE_DISC',
    node: 'PEDS_BRAKE_DISC',
    authoredOffsetZUp: [-0.04, 0.2, 0],
    order: 3,
    material: 'brake-carbon',
    motion: 'brake-reveal',
    inspection: 'Read disc radius and vents without aggressive bloom',
    acceptance: 'No flat decal pretending to be a through-hole vent',
    engineeringConfidence: 'illustrative',
  },
  {
    id: 'FRONT_LEFT_WHEEL.BRAKE_CALIPER',
    node: 'PEDS_BRAKE_CALIPER',
    authoredOffsetZUp: [-0.1, 0.25, 0.1],
    order: 4,
    material: 'gunmetal',
    motion: 'caliper-clearance',
    inspection: 'Show caliper throat and its clearance to the disc',
    acceptance: 'No mesh intersection at full separation or in reverse',
    engineeringConfidence: 'illustrative',
  },
  {
    id: 'FRONT_LEFT_WHEEL.SUSPENSION_LINKS',
    node: 'PEDS_SUSPENSION_LINKS',
    authoredOffsetZUp: [-0.12, 0.08, 0.08],
    order: 5,
    material: 'carbon-composite',
    motion: 'link-relief',
    inspection: 'Expose fixed endpoints and metallic suspension joints',
    acceptance: 'Links must not stretch or deform during movement',
    engineeringConfidence: 'illustrative',
  },
  {
    id: 'FRONT_LEFT_WHEEL.HUB_MOUNT_INTERFACE',
    node: 'PEDS_R43_FRONT_LEFT_WHEEL_HUB_INTERFACE_CONTROL',
    authoredOffsetZUp: [0, 0.2, 0.08],
    order: 6,
    material: 'titanium-satin',
    motion: 'mount-release',
    inspection: 'Show face of mounting interface only if geometry exists',
    acceptance: 'Flag unverified shaft–hub mechanical engagement in documentation',
    engineeringConfidence: 'unproven-fitment',
  },
] as const;

export const FRONT_LEFT_WHEEL_LOOKDEV = {
  hero: {
    label: 'IGNITION / HERO CARBON',
    purpose: 'Readable silhouette and controlled titanium reflections',
    background: ENGINEERING_V2_PALETTE.graphiteBackground,
  },
  blueprint: {
    label: 'X-RAY / TECHNICAL BLUEPRINT',
    purpose: 'Wire edges and 3D anchored semantic labels, no invented geometry',
    background: ENGINEERING_V2_PALETTE.blueprint,
  },
  macro: {
    label: 'PRECISION / CONTACT PATCH',
    purpose: 'Macro brake/hub inspection with physically plausible roughness',
    background: ENGINEERING_V2_PALETTE.graphitePanel,
  },
} as const;
