import { SeasonYear } from './common';
import { TeamId } from './team';

export type ViewMode = 'showroom' | 'xray' | 'aero';
export type CameraPreset = 'isometric' | 'front' | 'side' | 'top' | 'floor' | 'rear';

export interface OfficialSpecs {
  minWeightKg: number;
  engineConfig: string;
  displacementLiters: number;
  gearbox: string;
  wheelSizeInch: number;
  fuelCapacityKg: number;
}

export interface TechnicalHighlights {
  frontSuspension: string;
  rearSuspension: string;
  aeroPhilosophy: string;
  groundEffectNotes: string;
  chassisConstruction: string;
}

export interface CarSpec {
  id: string; // e.g. 'rb20', 'sf24', 'w15', 'cadillac-mac26'
  season: SeasonYear;
  teamId: TeamId;
  name: string;
  shortName: string;
  designer?: string;
  powerUnit: string;
  drivers: string[]; // Driver names / numbers
  primaryColor: string;
  accentColor: string;
  highlightColor: string;
  officialSpecs?: OfficialSpecs;
  technicalHighlights?: Partial<TechnicalHighlights>;
  descriptionVi?: string;
  descriptionEn?: string;
  heroImage?: string;
  studioImage?: string;
  has3DModel: boolean;
  model3DId?: string;
}

export interface AnatomyPart {
  id: string;
  name: string;
  vietnameseName: string;
  category: 'aerodynamics' | 'safety' | 'powertrain' | 'chassis' | 'suspension';
  material: string;
  weightKg: number;
  explodedOffset: [number, number, number]; // [x, y, z] in meters
  description: string;
  technicalRole: string;
}
