import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { SeasonYear } from '../../types';
import { WeekendResults } from './WeekendResults';
import { JourneyViewSwitch, RaceCalendarJourney } from './RaceCalendarJourney';

export const RaceResults: React.FC<{ season: SeasonYear }> = React.memo(({ season }) => {
  const location = useLocation();
  const [mode, setMode] = useState<'journey' | 'classic'>(() =>
    new URLSearchParams(location.search).has('round') ? 'classic' : 'journey'
  );

  useEffect(() => {
    if (new URLSearchParams(location.search).has('round')) setMode('classic');
  }, [location.search]);

  return (
    <>
      <JourneyViewSwitch mode={mode} onChange={setMode} />
      {mode === 'journey' ? <RaceCalendarJourney season={season} /> : <WeekendResults season={season} />}
    </>
  );
});
