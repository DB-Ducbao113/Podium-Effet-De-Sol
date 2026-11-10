import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { F1StartLightsPreloader } from './F1StartLightsPreloader';
import { initialIntroDecision, isEngineeringCadReviewPath } from './documentIntroState';

export function DocumentIntroController() {
  const [showIntro, setShowIntro] = useState(initialIntroDecision);
  const { pathname } = useLocation();

  // A client-side navigation from the home page must also uncover the
  // original Model B immediately. Otherwise a pre-existing launch splash
  // obscures the already-running 3D scene on narrow mobile screens.
  if (!showIntro || isEngineeringCadReviewPath(pathname)) return null;
  return <F1StartLightsPreloader onComplete={() => setShowIntro(false)} />;
}
