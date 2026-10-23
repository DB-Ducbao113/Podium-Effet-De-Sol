import { describe, it, expect } from 'vitest';
import {
  CIRCUITS_DATA,
  ROUND_TO_CIRCUIT_MAP,
  getCircuitByRound,
  findCircuitByName,
} from './circuitsData';
import { CALENDAR_2026 } from './calendar';

describe('Circuits Database & Registry', () => {
  it('contains data for all rounds of the 2026 Championship calendar', () => {
    expect(CALENDAR_2026.length).toBe(23);
    CALENDAR_2026.forEach((roundInfo) => {
      const circuit = getCircuitByRound(roundInfo.round);
      expect(circuit).toBeDefined();
      expect(circuit?.round).toBe(roundInfo.round);
      expect(circuit?.svgPath.length).toBeGreaterThan(20);
      expect(circuit?.viewBox).toMatch(/^\d+\s+\d+\s+\d+\s+\d+$/);
      expect(circuit?.startFinish.x).toBeGreaterThan(0);
      expect(circuit?.startFinish.y).toBeGreaterThan(0);
      expect(circuit?.telemetry.circuitLengthKm).toBeGreaterThan(2.0);
      expect(circuit?.telemetry.turns.total).toBeGreaterThan(5);
      expect(circuit?.telemetry.drsZonesCount).toBeGreaterThanOrEqual(1);
      expect(circuit?.lapRecord.time).toMatch(/^\d+:\d{2}\.\d{3}$/);
    });
  });

  it('correctly maps round 1 to Albert Park', () => {
    const r1 = getCircuitByRound(1);
    expect(r1?.id).toBe('albert-park');
    expect(r1?.city).toBe('Melbourne');
    expect(r1?.country).toBe('Australia');
    expect(r1?.telemetry.turns.total).toBe(14);
  });

  it('correctly maps round 6 to Circuit de Monaco with 1 DRS zone', () => {
    const monaco = getCircuitByRound(6);
    expect(monaco?.id).toBe('monaco');
    expect(monaco?.telemetry.drsZonesCount).toBe(1);
    expect(monaco?.telemetry.circuitLengthKm).toBe(3.337);
  });

  it('correctly maps round 8 to Red Bull Ring', () => {
    const austria = getCircuitByRound(8);
    expect(austria?.id).toBe('red-bull-ring');
    expect(austria?.telemetry.drsZonesCount).toBe(3);
    expect(austria?.telemetry.circuitLengthKm).toBe(4.318);
  });

  it('finds circuit by fuzzy or partial name', () => {
    const silverstone = findCircuitByName('Silverstone');
    expect(silverstone).toBeDefined();
    expect(silverstone?.id).toBe('silverstone');

    const spa = findCircuitByName('Spa-Francorchamps');
    expect(spa).toBeDefined();
    expect(spa?.id).toBe('spa');

    const suzuka = findCircuitByName('Suzuka');
    expect(suzuka).toBeDefined();
    expect(suzuka?.id).toBe('suzuka');
  });

  it('ensures each circuit has valid DRS zones definitions', () => {
    Object.values(CIRCUITS_DATA).forEach((c) => {
      expect(c.drsZones.length).toBe(c.telemetry.drsZonesCount);
      c.drsZones.forEach((zone) => {
        expect(zone.id).toBeGreaterThanOrEqual(1);
        expect(zone.nameVi.length).toBeGreaterThan(2);
        expect(zone.nameEn.length).toBeGreaterThan(2);
      });
    });
  });

  it('ROUND_TO_CIRCUIT_MAP has all CALENDAR_2026 rounds indexed', () => {
    expect(Object.keys(ROUND_TO_CIRCUIT_MAP).length).toBe(CALENDAR_2026.length);
  });
});
