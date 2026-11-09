import { CarSpec, SeasonYear } from '../../types';
import { CARS_2026 } from './2026';
import { CARS_2025 } from './2025';
import { CARS_2024 } from './2024';

export * from './2026';
export * from './2025';
export * from './2024';

export const ALL_CARS: CarSpec[] = [...CARS_2026, ...CARS_2025, ...CARS_2024];

export const CARS_BY_SEASON: Record<SeasonYear, CarSpec[]> = {
  2026: CARS_2026,
  2025: CARS_2025,
  2024: CARS_2024,
};

export const getCarById = (id: string): CarSpec | undefined => {
  return ALL_CARS.find((c) => c.id === id);
};

export const getCarsBySeason = (season: SeasonYear): CarSpec[] => {
  return CARS_BY_SEASON[season] || [];
};

// Map by id for quick lookup
export const CARS_MAP: Record<string, CarSpec> = ALL_CARS.reduce((acc, car) => {
  acc[car.id] = car;
  return acc;
}, {} as Record<string, CarSpec>);

export const CARS_DATA = CARS_MAP;
