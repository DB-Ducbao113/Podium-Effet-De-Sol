import { useState } from 'react';
import { F1StartLightsPreloader } from './F1StartLightsPreloader';
import { initialIntroDecision } from './documentIntroState';

export function DocumentIntroController() {
  const [showIntro, setShowIntro] = useState(initialIntroDecision);

  if (!showIntro) return null;
  return <F1StartLightsPreloader onComplete={() => setShowIntro(false)} />;
}
