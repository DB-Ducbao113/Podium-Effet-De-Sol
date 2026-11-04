import React from 'react';
import { useLocation } from 'react-router-dom';
import type { SeasonYear } from '../../types';
import { WeekendResults } from './WeekendResults';
import { BackToJourney, RaceCalendarJourney } from './RaceCalendarJourney';

export const RaceResults: React.FC<{ season: SeasonYear }> = React.memo(({ season }) => {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const round = Number(query.get('round'));
  const classic = query.has('round') || query.get('view') === 'classic';
  return classic ? (
    <>
      <BackToJourney season={season} tab="results" round={Number.isInteger(round) && round > 0 ? round : null} />
      <WeekendResults season={season} />
    </>
  ) : <RaceCalendarJourney season={season} />;
});
