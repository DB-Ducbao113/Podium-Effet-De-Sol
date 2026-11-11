import { STANDINGS_DATA } from '../../data/championship';
import { useChampionshipStore } from '../../store/useChampionshipStore';
import type {
  ConstructorStanding,
  DetailedRaceResult,
  DriverStanding,
  SeasonYear,
} from '../../types';

export type DirectorySeasonStandings = {
  drivers: DriverStanding[];
  constructors: ConstructorStanding[];
};

/**
 * P5 directories and profiles must show the same standings as the P5 table.
 * The store starts from the locked baseline and replaces it after a verified
 * sync, so every surface reads from that single source.
 */
export function useSeasonDirectoryData(season: SeasonYear): {
  standings: DirectorySeasonStandings;
  detailedResults: DetailedRaceResult[];
} {
  const calculated = useChampionshipStore((state) => state.calculatedStandings[season]);
  const detailedResults = useChampionshipStore((state) => state.detailedResults[season]);
  return {
    standings: calculated ?? STANDINGS_DATA[season],
    detailedResults: detailedResults ?? [],
  };
}

export function useDirectoryStandingsBySeason(): Record<SeasonYear, DirectorySeasonStandings> {
  const calculated = useChampionshipStore((state) => state.calculatedStandings);
  return {
    2024: calculated[2024] ?? STANDINGS_DATA[2024],
    2025: calculated[2025] ?? STANDINGS_DATA[2025],
    2026: calculated[2026] ?? STANDINGS_DATA[2026],
  };
}

export function useDirectoryRacesBySeason(): Record<SeasonYear, DetailedRaceResult[]> {
  const detailed = useChampionshipStore((state) => state.detailedResults);
  return {
    2024: detailed[2024] ?? [],
    2025: detailed[2025] ?? [],
    2026: detailed[2026] ?? [],
  };
}