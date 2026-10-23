import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CircuitTrackMap } from './CircuitTrackMap';
import { CircuitDetailModal } from './CircuitDetailModal';
import { getCircuitByRound } from '../../data/championship/circuitsData';

describe('CircuitTrackMap Component', () => {
  it('renders thumbnail variant with mini SVG path for Round 1 (Albert Park)', () => {
    const html = renderToStaticMarkup(<CircuitTrackMap round={1} variant="thumbnail" />);
    expect(html).toContain('viewBox="0 0 500 360"');
    expect(html).toContain('<path');
    expect(html).toContain('<circle');
  });

  it('renders card variant with full telemetry, turns, and lap record', () => {
    const html = renderToStaticMarkup(<CircuitTrackMap round={1} variant="card" />);
    expect(html).toContain('Albert Park Grand Prix Circuit');
    expect(html).toContain('Melbourne, Australia');
    expect(html).toContain('5.278'); // Circuit length km
    expect(html).toContain('14'); // Total turns
    expect(html).toContain('1:19.813'); // Lap record
    expect(html).toContain('Charles Leclerc'); // Driver
  });

  it('renders card variant for Monaco (Round 6) with specific length and turns', () => {
    const html = renderToStaticMarkup(<CircuitTrackMap round={6} variant="card" />);
    expect(html).toContain('Circuit de Monaco');
    expect(html).toContain('Monte Carlo, Monaco');
    expect(html).toContain('3.337');
    expect(html).toContain('19');
    expect(html).toContain('1:12.909');
    expect(html).toContain('Lewis Hamilton');
  });

  it('returns null if round or circuit cannot be found', () => {
    const html = renderToStaticMarkup(<CircuitTrackMap round={999} variant="card" />);
    expect(html).toBe('');
  });
});

describe('CircuitDetailModal Component', () => {
  it('renders modal dialog with full circuit details and DRS zones', () => {
    const circuit = getCircuitByRound(1)!;
    expect(circuit).toBeDefined();

    const html = renderToStaticMarkup(<CircuitDetailModal circuit={circuit} onClose={() => {}} />);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('Albert Park Grand Prix Circuit');
    expect(html).toContain('Melbourne, Australia');
    expect(html).toContain('1:19.813');
    expect(html).toContain('DRS 1');
    expect(html).toContain('DRS 2');
    expect(html).toContain('DRS 3');
    expect(html).toContain('DRS 4');
    expect(html).toContain('Review Khúc Cua');
    expect(html).toContain('TRACK STREET VIEW');
  });
});

describe('CircuitStreetReview Component', () => {
  it('renders track street view review with checkpoints, photos, and telemetry', async () => {
    const { CircuitStreetReview } = await import('./CircuitStreetReview');
    const circuit = getCircuitByRound(1)!;

    const html = renderToStaticMarkup(<CircuitStreetReview circuit={circuit} lang="vi" />);
    expect(html).toContain('TRACK STREET VIEW');
    expect(html).toContain('Review Chi Tiết Từng Khúc Đường');
    expect(html).toContain('Street View');
    expect(html).toContain('Vạch Xuất Phát');
    expect(html).toContain('TỐC ĐỘ');
    expect(html).toContain('SỐ');
  });

  it('provides authentic Street View review checkpoints for all 24 circuits in the calendar', async () => {
    const { CIRCUIT_REVIEW_POINTS, getCircuitReviewPoints } =
      await import('../../data/championship/circuitReviewPoints');
    for (let round = 1; round <= 24; round++) {
      const circuit = getCircuitByRound(round);
      if (!circuit) continue;
      const points = getCircuitReviewPoints(circuit.id);
      expect(points.length).toBeGreaterThanOrEqual(2);
      expect(CIRCUIT_REVIEW_POINTS[circuit.id]).toBeDefined();
      expect(points[0].lat).toBeTypeOf('number');
      expect(points[0].lng).toBeTypeOf('number');
      expect(points[0].telemetry.speedKmh).toBeGreaterThan(0);
      expect(points[0].descriptionVi.length).toBeGreaterThan(10);
    }
  });
});

describe('CircuitRealWorldMap Component', () => {
  it('renders an offline vector atlas with coordinates and no tile-provider dependency', async () => {
    const { CircuitRealWorldMap } = await import('./CircuitRealWorldMap');
    const { CIRCUIT_COORDINATES } = await import('./circuitCoordinates');
    const circuit = getCircuitByRound(1)!;

    const html = renderToStaticMarkup(<CircuitRealWorldMap circuit={circuit} lang="en" />);
    expect(html).toContain('data-offline-circuit-atlas="albert-park"');
    expect(html).toContain('EDS offline atlas');
    expect(html).toContain('no external tiles');
    expect(html).not.toContain('arcgisonline');
    expect(html).not.toContain('tile.openstreetmap');
    expect(CIRCUIT_COORDINATES['albert-park']).toBeDefined();
    expect(CIRCUIT_COORDINATES['albert-park'].lat).toBeCloseTo(-37.8497, 3);
  });
});

describe('OpenF1LiveMap Component', () => {
  it('renders OpenF1 tracker with replay telemetry, race selector, and openf1 credit', async () => {
    const { OpenF1LiveMap } = await import('./OpenF1LiveMap');

    const html = renderToStaticMarkup(<OpenF1LiveMap lang="en" />);
    expect(html).toContain('REPLAY TELEMETRY');
    expect(html).toContain('Australian GP 2024');
    expect(html).toContain('OpenF1.org');
    expect(html).toContain('00:00');
    expect(html).toContain('90:00');
  });
});

describe('CircuitLiveRadar Component', () => {
  it('renders radar HUD with drivers, speed gauge, and playback controls', async () => {
    const { CircuitLiveRadar } = await import('./CircuitLiveRadar');
    const { RADAR_DRIVERS } = await import('./radarDrivers');
    const circuit = getCircuitByRound(1)!;

    const html = renderToStaticMarkup(<CircuitLiveRadar circuit={circuit} lang="en" />);
    expect(html).toContain('LIVE RADAR');
    expect(html).toContain('Live Speed');
    expect(html).toContain('Gear');
    expect(html).toContain('DRS');
    expect(html).toContain('VER');
    expect(html).toContain('LEC');
    expect(html).toContain('NOR');
    expect(html).toContain('HAM');
    expect(html).toContain('RUS');
    expect(RADAR_DRIVERS).toHaveLength(5);
  });
});
