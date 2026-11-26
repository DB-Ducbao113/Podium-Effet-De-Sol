import type { GrandPrixRound } from '../types';
import { getSessionTimeRange, type RaceSessionKey } from './raceSchedule';

export const TIMEZONE_STORAGE_KEY = 'peds-timezone';
const SAFE_IANA_PATTERN = /^[A-Za-z0-9_/+\\-]+$/;
const MAX_IANA_LENGTH = 64;

export function validIanaTimeZone(value: unknown): value is string {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > MAX_IANA_LENGTH ||
    !SAFE_IANA_PATTERN.test(value)
  ) {
    return false;
  }
  try {
    new Intl.DateTimeFormat('en', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export function detectBrowserTimeZone(): {
  timeZone: string;
  source: 'device' | 'utc-fallback';
} {
  try {
    const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (validIanaTimeZone(resolved)) {
      return { timeZone: resolved, source: 'device' };
    }
  } catch {
    // Runtime without Intl timezone support falls back to UTC.
  }
  return { timeZone: 'UTC', source: 'utc-fallback' };
}

export function browserTimeZone(): string {
  return detectBrowserTimeZone().timeZone;
}

export function effectiveTimeZone(timeZone?: string | null): string {
  return validIanaTimeZone(timeZone) ? timeZone : browserTimeZone();
}

export function zoneOffsetLabel(date: Date, timeZone?: string | null): string {
  const zone = effectiveTimeZone(timeZone);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    timeZoneName: 'longOffset',
  }).formatToParts(date);
  return (parts.find((part) => part.type === 'timeZoneName')?.value || 'GMT')
    .replace('GMT', 'UTC')
    .replace(/^UTC$/, 'UTC+00:00');
}

export function formatZonedDate(
  date: Date,
  timeZone: string,
  lang: 'vi' | 'en',
): string {
  return new Intl.DateTimeFormat(lang === 'vi' ? 'vi-VN' : 'en-GB', {
    timeZone: effectiveTimeZone(timeZone),
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}

export function formatRaceSessionTime(
  gp: GrandPrixRound,
  key: RaceSessionKey,
  timeZone: string,
  lang: 'vi' | 'en',
): string | null {
  const range = getSessionTimeRange(gp, key);
  if (!range) return null;
  const zone = effectiveTimeZone(timeZone);
  return `${formatZonedDate(range.start, zone, lang)} ${zoneOffsetLabel(range.start, zone)}`;
}

export function computeClockOffsetMs(
  serverEpochMs: number,
  requestStartedAtMs: number,
  responseReceivedAtMs: number,
): number {
  if (
    !Number.isFinite(serverEpochMs) ||
    serverEpochMs <= 0 ||
    !Number.isFinite(requestStartedAtMs) ||
    !Number.isFinite(responseReceivedAtMs)
  ) {
    return 0;
  }
  const clientMidpointMs = (requestStartedAtMs + responseReceivedAtMs) / 2;
  return Math.round(serverEpochMs - clientMidpointMs);
}

export function clearLegacyTimezonePreference(): void {
  try {
    localStorage.removeItem(TIMEZONE_STORAGE_KEY);
  } catch {
    // Storage may be disabled in private or server-rendered contexts.
  }
}
