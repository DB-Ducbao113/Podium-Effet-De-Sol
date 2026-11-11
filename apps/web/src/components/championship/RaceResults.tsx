import React from 'react';
import { useLocation } from 'react-router-dom';
import type { SeasonYear } from '../../types';
import { WeekendResults } from './WeekendResults';
import { BackToJourney } from './RaceCalendarJourney';

// Results is the detailed per-round classification table; the globe journey
// lives on Calendar only. A round deep-linked from the map keeps a return path.
export const RaceResults: React.FC<{ season: SeasonYear }> = React.memo(({ season }) => {
  const location = useLocation();
  const round = Number(new URLSearchParams(location.search).get('round'));
  const fromMap = Number.isInteger(round) && round > 0;
  return (
    <>
      {fromMap && <BackToJourney season={season} tab="calendar" round={round} />}
      <WeekendResults season={season} />
    </>
  );
});
