import type { GrandPrixRound } from '../../types';

export type Geo = { latitude: number; longitude: number };

// Geographic coordinates identify the circuits, not artificial positions along a timeline.
// Shared names across 2024–2026 map to the same venue; multiple races in a country remain distinct.
const CIRCUITS: ReadonlyArray<{ match: RegExp; at: readonly [number, number] }> = [
  { match: /Albert Park/i, at: [144.969, -37.850] },
  { match: /Shanghai/i, at: [121.220, 31.339] },
  { match: /Suzuka/i, at: [136.536, 34.844] },
  { match: /Miami/i, at: [-80.239, 25.958] },
  { match: /Gilles.Villeneuve/i, at: [-73.522, 45.502] },
  { match: /Monaco/i, at: [7.420, 43.734] },
  { match: /Barcelona/i, at: [2.261, 41.570] },
  { match: /Red Bull Ring/i, at: [14.765, 47.219] },
  { match: /Silverstone/i, at: [-1.015, 52.073] },
  { match: /Spa.Francorchamps/i, at: [5.971, 50.437] },
  { match: /Hungaroring/i, at: [19.248, 47.579] },
  { match: /Zandvoort/i, at: [4.544, 52.388] },
  { match: /Monza/i, at: [9.281, 45.621] },
  { match: /Madring/i, at: [-3.606, 40.469] },
  { match: /Baku/i, at: [49.853, 40.372] },
  { match: /Sepang/i, at: [101.738, 2.760] },
  { match: /Marina Bay/i, at: [103.863, 1.291] },
  { match: /Circuit of The Americas/i, at: [-97.633, 30.133] },
  { match: /Hermanos Rodr/i, at: [-99.091, 19.405] },
  { match: /Jos. Carlos Pace/i, at: [-46.697, -23.703] },
  { match: /Las Vegas/i, at: [-115.173, 36.115] },
  { match: /Lusail/i, at: [51.490, 25.490] },
  { match: /Yas Marina/i, at: [54.604, 24.470] },
  { match: /Bahrain/i, at: [50.510, 26.032] },
  { match: /Jeddah/i, at: [39.103, 21.633] },
  { match: /Enzo e Dino Ferrari/i, at: [11.714, 44.344] },
];

export const resolveCircuit = (race: GrandPrixRound): Geo | null => {
  const found = CIRCUITS.find((entry) => entry.match.test(race.circuit));
  return found ? { longitude: found.at[0], latitude: found.at[1] } : null;
};
