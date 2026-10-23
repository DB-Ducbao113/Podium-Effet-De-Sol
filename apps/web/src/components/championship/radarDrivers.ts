export interface DriverRadarItem {
  id: string;
  name: string;
  shortName: string;
  number: number;
  team: string;
  teamColor: string;
  textColor: string;
  baseOffsetSec: number; // initial gap in seconds
}

export const RADAR_DRIVERS: DriverRadarItem[] = [
  {
    id: 'ver',
    name: 'Max Verstappen',
    shortName: 'VER',
    number: 1,
    team: 'Red Bull Racing',
    teamColor: '#004bff',
    textColor: '#ffffff',
    baseOffsetSec: 0.0,
  },
  {
    id: 'lec',
    name: 'Charles Leclerc',
    shortName: 'LEC',
    number: 16,
    team: 'Ferrari',
    teamColor: '#e8002d',
    textColor: '#ffffff',
    baseOffsetSec: 0.72,
  },
  {
    id: 'nor',
    name: 'Lando Norris',
    shortName: 'NOR',
    number: 4,
    team: 'McLaren',
    teamColor: '#ff8000',
    textColor: '#0a0b0e',
    baseOffsetSec: 1.45,
  },
  {
    id: 'ham',
    name: 'Lewis Hamilton',
    shortName: 'HAM',
    number: 44,
    team: 'Ferrari / Mercedes',
    teamColor: '#00d2be',
    textColor: '#0a0b0e',
    baseOffsetSec: 2.38,
  },
  {
    id: 'rus',
    name: 'George Russell',
    shortName: 'RUS',
    number: 63,
    team: 'Mercedes',
    teamColor: '#e2e8f0',
    textColor: '#0a0b0e',
    baseOffsetSec: 3.12,
  },
];
