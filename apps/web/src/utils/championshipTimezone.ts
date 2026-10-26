import type { GrandPrixRound } from '../types';
import { getSessionTimeRange, type RaceSessionKey } from './raceSchedule';

export const TIMEZONE_STORAGE_KEY = 'peds-timezone';
export const TIMEZONE_OPTIONS = [
  'local', 'UTC', 'Asia/Bangkok', 'Europe/London', 'America/New_York',
  'Asia/Tokyo', 'Asia/Singapore', 'Australia/Sydney',
] as const;

export function browserTimeZone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; }
  catch { return 'UTC'; }
}

export function validTimeZone(value: string): boolean {
  if (value === 'local') return true;
  try { new Intl.DateTimeFormat('en', { timeZone: value }); return true; }
  catch { return false; }
}

export function effectiveTimeZone(preference: string): string {
  return preference === 'local' ? browserTimeZone() : validTimeZone(preference) ? preference : 'UTC';
}

export function zoneOffsetLabel(date: Date, preference: string): string {
  const zone = effectiveTimeZone(preference);
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'longOffset' }).formatToParts(date);
  return (parts.find((part) => part.type === 'timeZoneName')?.value || 'GMT').replace('GMT', 'UTC').replace(/^UTC$/, 'UTC+00:00');
}

export function formatZonedDate(date: Date, preference: string, lang: 'vi' | 'en'): string {
  return new Intl.DateTimeFormat(lang === 'vi' ? 'vi-VN' : 'en-GB', {
    timeZone: effectiveTimeZone(preference), day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(date);
}

export function formatRaceSessionTime(gp: GrandPrixRound, key: RaceSessionKey, preference: string, lang: 'vi' | 'en'): string | null {
  const range = getSessionTimeRange(gp, key);
  return range ? `${formatZonedDate(range.start, preference, lang)} ${zoneOffsetLabel(range.start, preference)}` : null;
}
