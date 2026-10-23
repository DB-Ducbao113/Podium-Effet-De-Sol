import { describe, expect, it } from 'vitest';
import { getOriginalDriverVisualAsset, getOriginalTeamVisualAsset } from './originalVisualAssets';
import { TEAMS_DATA } from '../data/teams';
import { DRIVERS_DATA } from '../data/drivers';

describe('original visual asset routing', () => {
  it('routes team cards to original EDS-G01 studies', () => {
    expect(getOriginalTeamVisualAsset('ferrari')).toBe('/images/eds/vehicle-studies/ferrari.svg');
  });

  it('routes driver cards to abstract EDS profiles', () => {
    expect(getOriginalDriverVisualAsset('hamilton')).toBe(
      '/images/eds/driver-profiles/hamilton.svg',
    );
  });

  it('keeps every team and driver profile off legacy bitmap paths', () => {
    expect(Object.values(TEAMS_DATA).every((team) => team.imageUrl?.endsWith('.svg'))).toBe(true);
    expect(
      Object.values(DRIVERS_DATA).every((driver) =>
        driver.imageUrl?.startsWith('/images/eds/driver-profiles/'),
      ),
    ).toBe(true);
  });
});
