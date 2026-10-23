import { describe, expect, it } from 'vitest';
import { EDS_HOTSPOTS } from './edsHotspots';

describe('EDS-G01 hotspot integration', () => {
  it('preserves all seven technical inspection points', () => {
    expect(EDS_HOTSPOTS.map((hotspot) => hotspot.id)).toEqual([
      'wings',
      'drs',
      'power_unit',
      'halo',
      'sidepods',
      'tires',
      'floor',
    ]);
  });

  it('uses only original EDS close-up assets', () => {
    for (const hotspot of EDS_HOTSPOTS) {
      expect(hotspot.imageUrl).toBe(`/images/showroom/eds-g01/${hotspot.id}.svg`);
      expect(hotspot.position).toHaveLength(3);
      expect(hotspot.cameraPos).toHaveLength(3);
      expect(hotspot.cameraTarget).toHaveLength(3);
    }
  });

  it('does not present supplier or constructor marks in EDS descriptions', () => {
    const serialized = JSON.stringify(EDS_HOTSPOTS).toLowerCase();
    for (const mark of ['pirelli', 'brembo', 'ferrari', 'mercedes', 'red bull', 'mclaren']) {
      expect(serialized).not.toContain(mark);
    }
  });
});
