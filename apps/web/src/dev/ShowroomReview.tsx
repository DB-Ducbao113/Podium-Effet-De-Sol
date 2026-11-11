import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { App } from './showroom-review/main';
import reviewCss from './showroom-review/style.css?inline';

// Keep the broad prototype stylesheet inside the review surface.
export default function ShowroomReview() {
  const immersive = useLocation().pathname === '/showroom';
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const shadow = host?.shadowRoot ?? host?.attachShadow({ mode: 'open' });

  return (
    <div ref={setHost} data-testid="p6-review-showroom" data-immersive={immersive || undefined}>
      {shadow && createPortal(
        <>
          <style>{reviewCss.replace(':root', ':host').replace('body{', ':host{')}</style>
          <App embedded />
        </>,
        shadow,
      )}
    </div>
  );
}
