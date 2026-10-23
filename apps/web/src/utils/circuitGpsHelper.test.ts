import { describe, it, expect } from 'vitest';
import { sampleSvgPathPoints, generateCircuitGpsLayout } from './circuitGpsHelper';
import { CIRCUITS_DATA } from '../data/championship/circuitsData';

describe('circuitGpsHelper', () => {
  it('samples points correctly from SVG path string', () => {
    const testSvg = 'M 0 0 L 100 100 Q 150 150 200 200 Z';
    const points = sampleSvgPathPoints(testSvg);
    expect(points.length).toBeGreaterThan(3);
    expect(points[0]).toEqual([0, 0]);
  });

  it('generates GPS layout for Albert Park circuit', () => {
    const circuit = CIRCUITS_DATA['albert-park'];
    const center = { lat: -37.8497, lng: 144.968, zoom: 15 };

    const layout = generateCircuitGpsLayout(circuit, center);

    expect(layout.trackCoordinates.length).toBeGreaterThan(15);
    expect(layout.turns.length).toBe(circuit.telemetry.turns.total);
    expect(layout.drsSegments.length).toBe(circuit.drsZones.length);
    expect(layout.startFinishCoord).toBeDefined();

    // Verify all coords are valid numbers close to Melbourne center
    for (const [lat, lng] of layout.trackCoordinates) {
      expect(lat).toBeCloseTo(-37.8497, 1);
      expect(lng).toBeCloseTo(144.968, 1);
    }
  });

  it('handles fallback if svgPath is minimal', () => {
    const mockCircuit: any = {
      id: 'albert-park',
      svgPath: 'M 0 0 Z',
      telemetry: { circuitLengthKm: 5.0, turns: { total: 10 } },
      drsZones: [],
    };
    const layout = generateCircuitGpsLayout(mockCircuit, { lat: 0, lng: 0, zoom: 14 });
    expect(layout.trackCoordinates.length).toBeGreaterThan(10);
    expect(layout.turns.length).toBe(10);
  });
});
