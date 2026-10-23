import { SeasonYear } from '../../types';

export interface BaselineCutoff {
  /** Rounds already locked in the static baseline; only rounds above this recalculate from sync. */
  completedRounds: number;
  /** True for finished seasons: standings are final, never recalculated. */
  final: boolean;
  /** Where the baseline comes from. */
  source: string;
  /** What the cutoff means for sync/recalc behavior. */
  meaning: string;
}

/**
 * Per-season baseline cutoff.
 * - 2024/2025: completed seasons, official final classification (24 rounds each).
 * - 2026: ongoing season, official live standings after 17 events
 *   (see `src/data/championship/standings.ts`). Rounds 1-17 are locked in the
 *   baseline; only rounds > 17 are added from freshly synced data. Baseline
 *   detailed results only fill rounds missing from sync, never overwrite
 *   successfully synced rounds.
 */
export const BASELINE_CUTOFF_BY_SEASON: Record<SeasonYear, BaselineCutoff> = {
  2024: {
    completedRounds: 24,
    final: true,
    source: 'FIA official final classification (formula1.com/en/results)',
    meaning: 'Toàn bộ mùa đã khóa; không tính lại từ sync.',
  },
  2025: {
    completedRounds: 24,
    final: true,
    source: 'FIA official final classification (formula1.com/en/results)',
    meaning: 'Toàn bộ mùa đã khóa; không tính lại từ sync.',
  },
  2026: {
    completedRounds: 17,
    final: false,
    source: 'Official live standings after 17 events (src/data/championship/standings.ts)',
    meaning:
      'Rounds 1–17 đã khóa trong baseline; chỉ rounds > 17 được cộng thêm từ dữ liệu đồng bộ.',
  },
};
