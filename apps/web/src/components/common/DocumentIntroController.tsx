import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { F1StartLightsPreloader } from './F1StartLightsPreloader';
import { initialIntroDecision, INTRO_COMPLETE_EVENT } from './documentIntroState';

export function DocumentIntroController() {
  const location = useLocation();
  const [showIntro, setShowIntro] = useState(initialIntroDecision);
  const wasShowing = useRef(showIntro);

  useEffect(() => {
    if (location.pathname !== '/') setShowIntro(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!showIntro && wasShowing.current) {
      wasShowing.current = false;
      window.dispatchEvent(new Event(INTRO_COMPLETE_EVENT));
    }
  }, [showIntro]);

  if (!showIntro || location.pathname !== '/') return null;
  return <F1StartLightsPreloader onComplete={() => setShowIntro(false)} />;
}
