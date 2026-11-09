import { describe, it, expect } from 'vitest';
import { TEAM_HISTORY_DATA } from './teamHistoryStats';
import { TEAMS_DATA } from '../teams';
import { TeamId } from '../../types';

describe('TEAM_HISTORY_DATA integrity', () => {
  const teamIds = Object.keys(TEAMS_DATA) as TeamId[];

  it('contains historical data for all teams', () => {
    expect(teamIds.length).toBeGreaterThan(0);
    teamIds.forEach((id) => {
      const data = TEAM_HISTORY_DATA[id];
      expect(data).toBeDefined();
      expect(data.drivers).toBeDefined();
      expect(data.drivers.length).toBeGreaterThanOrEqual(4);
      expect(data.stats).toBeDefined();
      expect(typeof data.stats.constructorTitles).toBe('number');
      expect(typeof data.stats.raceWins).toBe('number');
      expect(data.stats.heritageNoteVi).toBeTruthy();
    });
  });

  it('has valid driver fields for each driver in roster', () => {
    Object.values(TEAM_HISTORY_DATA).forEach((team) => {
      team.drivers.forEach((driver) => {
        expect(driver.name).toBeTruthy();
        expect(driver.role).toBeTruthy();
      });
    });
  });
});
