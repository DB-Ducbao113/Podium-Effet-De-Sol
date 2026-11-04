import type { CSSProperties } from 'react';
import './homeLaunchV6.css';

/**
 * Decorative CSS-only perspective beyond the actual WebGL viewport.
 * The real road/arches are inside HomeTrackEnvironment3D (one Canvas).
 * This layer preserves the scene's depth while Model B is still loading.
 */
export function HomeLaunchEnvironment() {
  return (
    <div className="launch-env" aria-hidden="true">
      <div className="launch-env__vanishing-point" />
      <div className="launch-env__tunnel">
        {Array.from({ length: 6 }, (_, index) => (
          <span
            className="launch-env__rib"
            key={index}
            style={{ '--rib-index': index } as CSSProperties}
          />
        ))}
      </div>
      <div className="launch-env__track">
        <span className="launch-env__rail launch-env__rail--left" />
        <span className="launch-env__rail launch-env__rail--right" />
        <span className="launch-env__centerline" />
      </div>
      <div className="launch-env__speedfield">
        <span /><span /><span />
      </div>
      <div className="launch-env__haze" />
    </div>
  );
}
