import { CarSpec, SeasonYear, TeamId } from '../../types';
import { TEAMS_DATA } from '../teams';

/** Creates a car catalog record with verified identity only; technical specs stay absent. */
export const createCatalogCar = (
  season: SeasonYear,
  teamId: TeamId,
  name: string,
  shortName: string,
  powerUnit: string,
  drivers: string[],
): CarSpec => {
  const team = TEAMS_DATA[teamId];

  return {
    id: `${teamId}-${season}`,
    season,
    teamId,
    name,
    shortName,
    powerUnit,
    drivers,
    primaryColor: team.primaryColor,
    accentColor: team.accentColor,
    highlightColor: team.highlightColor,
    has3DModel: false,
  };
};
