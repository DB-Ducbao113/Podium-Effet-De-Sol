import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { SeasonYear } from '../../types';
import { WeekendResults } from './WeekendResults';
import { JourneyViewSwitch, RaceCalendarJourney } from './RaceCalendarJourney';

export const RaceResults: React.FC<{ season: SeasonYear }> = React.memo(({ season }) => {
  const location = useLocation();
  const [mode, setMode] = useState<'journey' | 'classic'>(() =>
    new URLSearchParams(location.search).has('round') ||
    new URLSearchParams(location.search).get('view') === 'classic' ? 'classic' : 'journey'
  );

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    if (query.has('round') || query.get('view') === 'classic') setMode('classic');
  }, [location.search]);

  return (
    <>
      <JourneyViewSwitch mode={mode} onChange={setMode} />
      {mode === 'journey' ? <RaceCalendarJourney season={season} /> : <WeekendResults season={season} />}
    </>
  );
});
