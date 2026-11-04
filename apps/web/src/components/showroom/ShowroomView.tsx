import React, { Suspense } from 'react';

const ModelBShowroom = React.lazy(() => import('./ModelBShowroom'));
const P6ReviewShowroom = import.meta.env.DEV
  ? React.lazy(() => import('../../dev/P6ReviewShowroom'))
  : null;

export const ShowroomView: React.FC<{ headingLevel?: 'h1' | 'h2' }> = ({
  headingLevel = 'h1',
}) => {
  const showP6Review = import.meta.env.DEV &&
    new URLSearchParams(window.location.search).get('review') !== 'model-b';

  return (
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
  );
};
