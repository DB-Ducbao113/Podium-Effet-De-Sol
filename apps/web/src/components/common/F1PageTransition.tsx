import React, { useEffect, useState, useRef } from 'react';

interface F1PageTransitionProps {
  pathname: string;
  noTransform?: boolean;
  children: React.ReactNode;
}

export const F1PageTransition: React.FC<F1PageTransitionProps> = ({
  pathname,
  noTransform,
  children,
}) => {
  const [displayChildren, setDisplayChildren] = useState(children);
  const [isWiping, setIsWiping] = useState(false);
  const prevPathRef = useRef(pathname);
  const immediateContent = pathname.startsWith('/engineering');

  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      setIsWiping(true);
      setDisplayChildren(children);

      const timer = setTimeout(() => {
        setIsWiping(false);
      }, 420);

      return () => clearTimeout(timer);
    } else {
      setDisplayChildren(children);
    }
  }, [pathname, children]);

  return (
    <div className="relative w-full">
      {/* ── F1 High-Speed Telemetry Speed Wipe Beam (Scene Transition) ── */}
      {isWiping && (
        <div
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none z-[80] overflow-hidden"
        >
          {/* Main Laser Speed Line */}
          <div className="absolute inset-y-0 w-full animate-f1-speed-wipe">
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
