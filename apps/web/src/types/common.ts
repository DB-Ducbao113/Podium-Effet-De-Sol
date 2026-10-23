export type Language = 'vi' | 'en';

export const SUPPORTED_SEASONS = [2026, 2025, 2024] as const;
export type SeasonYear = (typeof SUPPORTED_SEASONS)[number];

export const isSeasonYear = (value?: string | number | null): value is SeasonYear => {
  if (value === undefined || value === null || value === '') return false;
  const num = Number(value);
  return SUPPORTED_SEASONS.includes(num as SeasonYear);
};

export type NavTab = 'home' | 'championship' | 'showroom';
