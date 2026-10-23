import { TeamId } from '../types';

export const getOriginalTeamVisualAsset = (teamId: TeamId): string =>
  `/images/eds/vehicle-studies/${teamId}.svg`;

export const getOriginalDriverVisualAsset = (driverId: string): string =>
  `/images/eds/driver-profiles/${driverId}.svg`;
