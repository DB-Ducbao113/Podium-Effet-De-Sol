import React, { useEffect, useState, useRef } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface F1PageTransitionProps {
  pathname: string;
  noTransform?: boolean;
  children: React.ReactNode;
}

/** Longer than the 0.4s wipe; a safety net, not the primary dismissal. */
const WIPE_SAFETY_MS = 1000;

export const F1PageTransition: React.FC<F1PageTransitionProps> = ({
  pathname,
  noTransform,
  children,
}) => {
  const [displayChildren, setDisplayChildren] = useState(children);
  const [isWiping, setIsWiping] = useState(false);
  const prevPathRef = useRef(pathname);
  const reducedMotion = useReducedMotion();
  const immediateContent = pathname.startsWith('/engineering');

  useEffect(() => {
    if (prevPathRef.current === pathname) {
      setDisplayChildren(children);
      return;
    }
    prevPathRef.current = pathname;
    setDisplayChildren(children);
    // Reduced motion declares `animation: none` on the wipe, so animationend can
    // never arrive and the beam would sit as a static overlay: skip it entirely.
    setIsWiping(!reducedMotion);
  }, [pathname, children, reducedMotion]);

  useEffect(() => {
    if (!isWiping) return;
    const timer = setTimeout(() => setIsWiping(false), WIPE_SAFETY_MS);
    return () => clearTimeout(timer);
  }, [isWiping, pathname]);

  return (
    <div className="relative w-full">
      {/* ── F1 High-Speed Telemetry Speed Wipe Beam (Scene Transition) ── */}
      {isWiping && (
        <div
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none z-[80] overflow-hidden"
        >
          {/* Main Laser Speed Line */}
          <div
            className="absolute inset-y-0 w-full animate-f1-speed-wipe"
            onAnimationEnd={(event) => {
              if (event.target === event.currentTarget) setIsWiping(false);
            }}
          >
            <div className="w-48 sm:w-72 h-full bg-gradient-to-r from-transparent via-white/15 to-transparent blur-md" />
            <div className="absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b from-white/70 via-white to-white/30 shadow-xs" />
          </div>
        </div>
      )}

      {/* ── 3D Perspective Page Entrance Container ── */}
      <div
        key={pathname}
        className={
          immediateContent || noTransform
            ? undefined
            : 'animate-f1-depth-enter will-change-transform'
        }
      >
        {displayChildren}
      </div>
    </div>
  );
};
