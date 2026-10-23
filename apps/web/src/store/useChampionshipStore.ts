import { create } from 'zustand';
import {
  SeasonYear,
  DriverStanding,
  ConstructorStanding,
  DetailedRaceResult,
  F1SyncMetadata,
} from '../types';
import {
  loadSavedDetailedResults,
  persistDetailedResults,
  loadSyncMetadata,
  persistSyncMetadata,
  syncF1SeasonData,
  clearStaleSyncReview,
} from '../services/f1DataService';
import { recalculateStandingsFromRaces } from '../services/standingsEngine';
import { BASELINE_CUTOFF_BY_SEASON } from '../data/championship/baselineCutoff';
import {
  DRIVER_STANDINGS_2024,
  CONSTRUCTOR_STANDINGS_2024,
  DRIVER_STANDINGS_2025,
  CONSTRUCTOR_STANDINGS_2025,
  DRIVER_STANDINGS_2026,
  CONSTRUCTOR_STANDINGS_2026,
} from '../data/championship/standings';

// Base standings fallback
const BASE_DRIVER_STANDINGS: Record<SeasonYear, DriverStanding[]> = {
  2024: DRIVER_STANDINGS_2024,
  2025: DRIVER_STANDINGS_2025,
  2026: DRIVER_STANDINGS_2026,
};

const BASE_CONSTRUCTOR_STANDINGS: Record<SeasonYear, ConstructorStanding[]> = {
  2024: CONSTRUCTOR_STANDINGS_2024,
  2025: CONSTRUCTOR_STANDINGS_2025,
  2026: CONSTRUCTOR_STANDINGS_2026,
};

interface ChampionshipStoreState {
  selectedSeason: SeasonYear;
  activeSubTab: 'standings' | 'calendar' | 'results' | 'drivers' | 'teams';
  standingsCategory: 'drivers' | 'constructors';
  selectedRaceRound: number | null;

  // Live and Raw Data
  detailedResults: Record<SeasonYear, DetailedRaceResult[]>;
  calculatedStandings: Record<
    SeasonYear,
    { drivers: DriverStanding[]; constructors: ConstructorStanding[] }
  >;
  syncMeta: F1SyncMetadata;

  // Actions
  setSelectedSeason: (season: SeasonYear) => void;
  setActiveSubTab: (tab: 'standings' | 'calendar' | 'results' | 'drivers' | 'teams') => void;
  setStandingsCategory: (category: 'drivers' | 'constructors') => void;
  setSelectedRaceRound: (round: number | null) => void;

  // Data Pipeline Synchronization Actions
  syncSeasonData: (season: SeasonYear) => Promise<void>;
}

const initialDetailedResults = loadSavedDetailedResults();
// Users may still carry a leftover review snapshot (and a blocked sync) from
// the previous interactive-sync flow; drop it so every load starts clean.
clearStaleSyncReview();

// Compute initial calculated standings from the loaded results

function computeInitialStandings(resultsMap: Record<SeasonYear, DetailedRaceResult[]>) {
  const out: Record<
    SeasonYear,
    { drivers: DriverStanding[]; constructors: ConstructorStanding[] }
  > = {
    2024: { drivers: DRIVER_STANDINGS_2024, constructors: CONSTRUCTOR_STANDINGS_2024 },
    2025: { drivers: DRIVER_STANDINGS_2025, constructors: CONSTRUCTOR_STANDINGS_2025 },
    2026: { drivers: DRIVER_STANDINGS_2026, constructors: CONSTRUCTOR_STANDINGS_2026 },
  };

  try {
    const races2026 = resultsMap?.[2026];
    const cutoff2026 = BASELINE_CUTOFF_BY_SEASON[2026].completedRounds;
    if (
      Array.isArray(races2026) &&
      races2026.some(
        (r) =>
          r &&
          !r.isSynthesized &&
          r.round > cutoff2026 &&
          (r.status === 'completed' || (r.sprintEntries?.length || 0) > 0),
      )
    ) {
      out[2026] = recalculateStandingsFromRaces(
        2026,
        races2026,
        BASE_DRIVER_STANDINGS[2026],
        BASE_CONSTRUCTOR_STANDINGS[2026],
      );
    }
  } catch (err) {
    console.warn('Initial standings compute error, using base standings:', err);
  }

  return out;
}

export const useChampionshipStore = create<ChampionshipStoreState>((set, get) => ({
  selectedSeason: 2026,
  activeSubTab: 'standings',
  standingsCategory: 'drivers',
  selectedRaceRound: null,

  detailedResults: initialDetailedResults,
  calculatedStandings: computeInitialStandings(initialDetailedResults),
  syncMeta: loadSyncMetadata(),

  setSelectedSeason: (season) => set({ selectedSeason: season }),
  setActiveSubTab: (tab) => set({ activeSubTab: tab }),
  setStandingsCategory: (category) => set({ standingsCategory: category }),
  setSelectedRaceRound: (round) => set({ selectedRaceRound: round }),

  syncSeasonData: async (season) => {
    try {
      set({
        syncMeta: {
          ...get().syncMeta,
          syncStatus: 'syncing',
          message: `Đang kết nối và đối chiếu dữ liệu mùa giải ${season}...`,
        },
      });

      const currentRaces = get().detailedResults[season] || [];
      const syncRes = await syncF1SeasonData(season, currentRaces);

      // Failed or partial sync: keep the saved snapshot untouched (no persist),
      // only report the status honestly.
      if (!syncRes.success) {
        const failMeta: F1SyncMetadata = {
          lastSyncTimestamp: new Date().toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            day: '2-digit',
            month: '2-digit',
          }),
          syncStatus: 'error',
          source: syncRes.source,
          completedRoundsCount: currentRaces.length,
          message: syncRes.message,
        };
        persistSyncMetadata(failMeta);
        set({ syncMeta: failMeta });
        return;
      }

      // Successful sync: always apply the reconciled results. The data layer
      // (reconcileSeasonRaces + sprint provenance) already guarantees official
      // results win and provisional data is only replaced by newer snapshots,
      // so no interactive review step is needed.
      const nextDetailedResults = {
        ...get().detailedResults,
        [season]: syncRes.results,
      };

      // Recalculate standings live
      const nextStandingsForSeason = recalculateStandingsFromRaces(
        season,
        syncRes.results,
        BASE_DRIVER_STANDINGS[season],
        BASE_CONSTRUCTOR_STANDINGS[season],
      );

      const nextCalculated = {
        ...get().calculatedStandings,
        [season]: nextStandingsForSeason,
      };

      const nextMeta: F1SyncMetadata = {
        lastSyncTimestamp: new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          day: '2-digit',
          month: '2-digit',
        }),
        syncStatus: syncRes.success ? 'success' : 'error',
        source: syncRes.source,
        completedRoundsCount: syncRes.results.length,
        message: syncRes.message,
      };

      // Persist to storage
      persistDetailedResults(nextDetailedResults);
      persistSyncMetadata(nextMeta);

      set({
        detailedResults: nextDetailedResults,
        calculatedStandings: nextCalculated,
        syncMeta: nextMeta,
      });
    } catch (err: any) {
      console.error('syncSeasonData safe catch:', err);
      const fallbackMeta: F1SyncMetadata = {
        ...get().syncMeta,
        syncStatus: 'error',
        message: 'Đồng bộ tạm gián đoạn; đang sử dụng dữ liệu nội bộ sẵn có.',
      };
      set({ syncMeta: fallbackMeta });
    }
  },
}));
