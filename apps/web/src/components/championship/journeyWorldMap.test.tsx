import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { getCalendarBySeason } from '../../data/championship';
import type { SeasonYear } from '../../types';
import { resolveCircuit } from './journeyCoordinates';
import { JourneyWorldMap } from './JourneyWorldMap';
import { layoutRoundLabels } from './journeyLabelLayout';

describe('2D World Tour: all-round atlas, not a progressive flight map', () => {
  for (const season of [2024, 2025, 2026] as const satisfies readonly SeasonYear[]) {
    it(`shows every Grand Prix as a numbered, interactive stop in ${season}`, () => {
      const calendar = getCalendarBySeason(season);
      const html = renderToStaticMarkup(
        <MemoryRouter>
          <JourneyWorldMap season={season} calendar={calendar} activeRound={calendar[0].round}
            lang="en" />
        </MemoryRouter>,
      );
      const numbers = [...html.matchAll(/data-round-label="R(\d{2})"/g)].map((match) => Number(match[1]));
      expect(numbers).toEqual(calendar.map((race) => race.round));
      expect(html.match(/data-map-round="/g)).toHaveLength(calendar.length);
      expect(html).toContain('data-map-mode="all-rounds"');
      expect(html).toContain('data-route-lines="false"');
      expect(html).not.toContain('rcj-route-glow');
      expect(html).not.toContain('rcj-map-route');
      expect(html).toContain('aria-label="R01:');
    });

    it(`positions all ${season} labels inside the atlas without overlaps`, () => {
      const calendar = getCalendarBySeason(season);
      const points = calendar.map((race) => {
        const location = resolveCircuit(race);
        expect(location, `Coordinate missing for ${race.circuit}`).not.toBeNull();
        return {
          race,
          x: ((location!.longitude + 180) / 360) * 1000,
          y: ((90 - location!.latitude) / 180) * 500,
        };
      });
      const labels = layoutRoundLabels(points);
      expect(labels).toHaveLength(calendar.length);
      for (let i = 0; i < labels.length; i++) {
        const a = labels[i];
        expect(a.labelX).toBeGreaterThanOrEqual(23);
        expect(a.labelX).toBeLessThanOrEqual(977);
        expect(a.labelY).toBeGreaterThanOrEqual(15);
        expect(a.labelY).toBeLessThanOrEqual(485);
        for (let j = i + 1; j < labels.length; j++) {
          const b = labels[j];
          expect(
            Math.abs(a.labelX - b.labelX) >= 37 ||
            Math.abs(a.labelY - b.labelY) >= 22,
            `Labels R${a.race.round} and R${b.race.round} overlap`,
          ).toBe(true);
        }
      }
    });
  }

  it('opens the selected 2D race details from the dot without a top-right Details button', () => {
    const mapSource = readFileSync('src/components/championship/JourneyWorldMap.tsx', 'utf8');
    const journeySource = readFileSync('src/components/championship/RaceCalendarJourney.tsx', 'utf8');
    expect(mapSource).toContain('data-map-view-details');
    expect(mapSource).toContain('setSelectedRound');
    expect(mapSource).toContain('round=${selected.race.round}');
    expect(journeySource).toContain('rcj-globe-details');
    expect(journeySource).toContain('data-view-details');
    expect(journeySource).not.toContain('rcj-view-details');
  });
});
