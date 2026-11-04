import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import manifest from '../data/visualAssets/p5SeasonalManifest.json';
import clientManifest from '../data/visualAssets/p5SeasonalClientManifest.json';
import { getCalendarBySeason } from '../data/championship/calendar';
import { getStandings } from '../data/championship/standings';
import type { SeasonYear } from '../types';
import { packageOnlyDriverVisuals, resolveCircuitVisual, resolveDriverVisual } from './p5SeasonalVisuals';

describe('P5 seasonal visual mapping', () => {
  it('resolves every event by season and round without historical round collisions', () => {
    for (const [season, count] of [[2024, 24], [2025, 24], [2026, 23]] as const) {
      const calendar = getCalendarBySeason(season);
      expect(calendar).toHaveLength(count);
      for (const event of calendar) {
        const asset = resolveCircuitVisual(season, event.round);
        expect(asset?.round).toBe(event.round);
        expect(asset?.circuitId).toBeTruthy();
      }
    }
    expect(resolveCircuitVisual(2024, 10)?.circuitId).toBe('catalunya');
    expect(resolveCircuitVisual(2025, 10)?.circuitId).toBe('gilles-villeneuve');
    expect(resolveCircuitVisual(2026, 10)?.circuitId).toBe('spa');
    expect(resolveCircuitVisual(2026, 16)?.circuitId).toBe('sepang');
    expect(resolveCircuitVisual(2026, 24)).toBeUndefined();
  });

  it('resolves every standings driver by stable season and driver ID', () => {
    expect(manifest.drivers).toHaveLength(69);
    for (const season of [2024, 2025, 2026] as SeasonYear[]) {
      const standings = getStandings(season);
      for (const driver of standings.drivers) {
        const visual = resolveDriverVisual(season, driver.driverId);
        expect(visual?.teamId).toBe(driver.teamId);
        expect(visual?.assetStatus).toBe('NEEDS_REVIEW');
      }
    }
    expect(resolveDriverVisual(2024, 'hamilton')?.teamId).toBe('mercedes');
    expect(resolveDriverVisual(2025, 'hamilton')?.teamId).toBe('ferrari');
    expect(resolveDriverVisual(2024, 'sainz')?.teamId).toBe('ferrari');
    expect(resolveDriverVisual(2026, 'sainz')?.teamId).toBe('williams');
    expect(resolveDriverVisual(2026, 'unknown')).toBeUndefined();
  });

  it('keeps review assets outside public and validates local bytes when present', () => {
    expect(manifest.circuits).toHaveLength(71);
    for (const asset of [
      ...manifest.circuits.flatMap((entry) => [entry.desktop, entry.mobile, entry.thumbnail]),
      ...manifest.drivers.flatMap((entry) => [entry.full, entry.small]),
    ]) {
      expect(asset.sourceFile.startsWith('.local-assets/p5-review/')).toBe(true);
      const file = resolve(process.cwd(), '../..', asset.sourceFile);
      expect(asset.bytes).toBeGreaterThan(0);
      expect(asset.sha256).toMatch(/^[a-f0-9]{64}$/);
      if (process.env.PEDS_VERIFY_LOCAL_ASSETS === '1') expect(existsSync(file), asset.sourceFile).toBe(true);
      if (!existsSync(file)) continue;
      const bytes = readFileSync(file);
      expect(bytes.length).toBe(asset.bytes);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
    }
  });

  it('keeps compact client records in sync with the validated source manifest', () => {
    expect(clientManifest.circuits).toEqual(manifest.circuits.map(({ season, round, circuitId, assetStatus, focalPointX, desktop }) => ({
      season, round, circuitId, assetStatus, focalPointX, desktop: { width: desktop.width, height: desktop.height },
    })));
    expect(clientManifest.drivers).toEqual(manifest.drivers.map(({ season, driverId, teamId, assetStatus }) => ({
      season, driverId, teamId, assetStatus,
    })));
  });

  it('keeps package-only substitutes separate from ranked drivers', () => {
    const ranked = getStandings(2026).drivers.map((driver) => driver.driverId);
    expect(packageOnlyDriverVisuals(2026, ranked).map((driver) => driver.driverId).sort()).toEqual(['hirakawa', 'tsunoda']);
  });
});
