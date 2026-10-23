import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TeamId } from '../../types';
import { ConstructorLogo } from './ConstructorLogo';

const teams: TeamId[] = [
  'ferrari',
  'mclaren',
  'redbull',
  'mercedes',
  'astonmartin',
  'alpine',
  'racingbulls',
  'haas',
  'williams',
  'audi',
  'cadillac',
];

describe('ConstructorLogo', () => {
  it('renders an original EDS editorial identifier for every team', () => {
    for (const teamId of teams) {
      const html = renderToStaticMarkup(<ConstructorLogo teamId={teamId} badgeMode lang="en" />);
      expect(html).toContain('INDEPENDENT PROFILE');
      expect(html).toContain('EDS');
      expect(html).not.toContain('OFFICIAL COMPONENT');
    }
  });
});
