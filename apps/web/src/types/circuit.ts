/**
 * Circuit and Track Map Type Definitions
 * Strict, advanced TypeScript definitions for Formula 1 circuits, SVG track paths,
 * telemetry parameters, DRS zones, and localized specifications.
 */

export type CircuitId =
  | 'albert-park'
  | 'shanghai'
  | 'suzuka'
  | 'miami'
  | 'gilles-villeneuve'
  | 'monaco'
  | 'catalunya'
  | 'red-bull-ring'
  | 'silverstone'
  | 'spa'
  | 'hungaroring'
  | 'zandvoort'
  | 'monza'
  | 'madring'
  | 'baku'
  | 'sepang'
  | 'marina-bay'
  | 'cota'
  | 'hermanos-rodriguez'
  | 'interlagos'
  | 'las-vegas'
  | 'lusail'
  | 'yas-marina'
  | 'bahrain';

export type CircuitDirection = 'clockwise' | 'anticlockwise';

export interface DrsZoneInfo {
  id: number;
  nameVi: string;
  nameEn: string;
  detectionPoint: string;
  activationPoint: string;
  lengthM?: number;
}

export interface CircuitLapRecord {
  time: string;
  driver: string;
  team: string;
  year: number;
}

export interface CircuitTurnSummary {
  total: number;
  left: number;
  right: number;
}

export interface CircuitTelemetry {
  circuitLengthKm: number;
  raceDistanceKm: number;
  lapsCount: number;
  turns: CircuitTurnSummary;
  drsZonesCount: number;
  direction: CircuitDirection;
  elevationChangeM: number;
  topSpeedKmh?: number;
  gearChangesPerLap?: number;
}

export interface CircuitCornerHighlight {
  number: number;
  nameVi: string;
  nameEn: string;
  speedCategory: 'slow' | 'medium' | 'high';
  descriptionVi?: string;
  descriptionEn?: string;
}

export interface CircuitData {
  id: CircuitId;
  round: number;
  circuitName: string;
  officialName: string;
  city: string;
  country: string;
  countryCode: string;
  flag: string;
  firstGrandPrixYear: number;
  telemetry: CircuitTelemetry;
  lapRecord: CircuitLapRecord;
  svgPath: string;
  viewBox: string;
  startFinish: {
    x: number;
    y: number;
    angleDeg?: number;
  };
  drsZones: DrsZoneInfo[];
  corners?: CircuitCornerHighlight[];
  keyFeaturesVi: string[];
  keyFeaturesEn: string[];
}

/** Readonly map of circuits indexed by CircuitId */
export type CircuitMap = Readonly<Record<CircuitId, CircuitData>>;

/** Readonly map of circuits indexed by calendar round number */
export type RoundCircuitMap = Readonly<Record<number, CircuitData>>;

/** Lookup helper type for extracting circuit metadata */
export type CircuitProperty<K extends keyof CircuitData> = CircuitData[K];
