import React from 'react';
import type { SeasonYear } from '../../types';
import { WeekendResults } from './WeekendResults';

export const RaceResults: React.FC<{ season: SeasonYear }> = React.memo(({ season }) => (
  <WeekendResults season={season} />
));
