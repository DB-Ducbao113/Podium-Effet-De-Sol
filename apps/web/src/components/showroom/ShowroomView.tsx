import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import './showroomRoute.css';
import { useNavigationStore } from '../../store/useNavigationStore';
import {
  SHOWROOM_INTRO_COPY,
  SHOWROOM_INTRO_FOCUS_MS,
  detectShowroomIntroCapability,
  getShowroomIntroTier,
  type ShowroomIntroTier,
} from './showroomIntroState';

const ModelBShowroom = React.lazy(() => import('./ModelBShowroom'));
const P6ReviewShowroom = import.meta.env.DEV
  ? React.lazy(() => import('../../dev/P6ReviewShowroom'))
  : null;
const ShowroomIntroV3 = import.meta.env.DEV
  ? React.lazy(() => import('./ShowroomIntroV3'))
  : null;

export const ShowroomView: React.FC<{ headingLevel?: 'h1' | 'h2' }> = ({
  headingLevel = 'h1',
}) => {
  const showP6Review = import.meta.env.DEV &&
    new URLSearchParams(window.location.search).get('review') !== 'model-b';
  const lang = useNavigationStore((state) => state.lang);
  const introEnabled = import.meta.env.DEV && ShowroomIntroV3 !== null;
  const [tier] = useState<ShowroomIntroTier>(() =>
    introEnabled ? getShowroomIntroTier(detectShowroomIntroCapability()) : 'T0',
  );
  const [entered, setEntered] = useState(!introEnabled || tier === 'T0');
  const [revealed, setRevealed] = useState(false);
  const [introDismissed, setIntroDismissed] = useState(false);
  const [introKey, setIntroKey] = useState(0);
  const replayRef = useRef<HTMLButtonElement>(null);

  const handleEntered = useCallback(() => {
    setEntered(true);
    setRevealed(true);
  }, []);
  const handleDismissed = useCallback(() => setIntroDismissed(true), []);
  const replay = useCallback(() => {
    setIntroKey((key) => key + 1);
    setEntered(false);
    setRevealed(false);
    setIntroDismissed(false);
  }, []);

  useEffect(() => {
    if (!entered) return;
    if (!revealed) {
      replayRef.current?.focus({ preventScroll: true });
      return;
    }
    const timer = setTimeout(
      () => replayRef.current?.focus({ preventScroll: true }),
      SHOWROOM_INTRO_FOCUS_MS,
    );
    return () => clearTimeout(timer);
  }, [entered, revealed, introKey]);

  const copy = SHOWROOM_INTRO_COPY[lang];

  return (
    <div
      className="sr-view"
      data-variant={showP6Review ? 'p6' : 'model-b'}
      data-intro={introEnabled ? (entered ? 'entered' : 'active') : undefined}
      data-reveal={revealed ? 'true' : 'false'}
    >
      {introEnabled && tier !== 'T0' && !introDismissed && ShowroomIntroV3 && (
        <Suspense fallback={null}>
          <ShowroomIntroV3
            key={introKey}
            lang={lang}
            tier={tier}
            onEnter={handleEntered}
            onDismissed={handleDismissed}
          />
        </Suspense>
      )}
      <div className="sr-stage" data-intro-hidden={introEnabled && !entered ? 'true' : 'false'}>
        <Suspense
          fallback={
            <div role="status" className="min-h-screen bg-studio-950 text-white flex items-center justify-center">
              Loading Showroom…
            </div>
          }
        >
          {showP6Review && P6ReviewShowroom
            ? <P6ReviewShowroom />
            : <ModelBShowroom headingLevel={headingLevel} />}
        </Suspense>
      </div>
      {introEnabled && entered && (
        <button ref={replayRef} type="button" className="sr-replay" onClick={replay}>
          <span aria-hidden="true">↺</span>
          {copy.replay}
        </button>
      )}
    </div>
  );
};