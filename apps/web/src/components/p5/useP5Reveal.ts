import { useEffect, useRef } from 'react';
import { animate, createScope } from 'animejs';
import { useMotionGate } from '../../hooks/useMotionGate';

/**
 * Staggers P5 surfaces marked with data-p5-reveal.
 * Re-runs when `key` changes (season, category, profile) so tab switches re-enter.
 */
export function useP5Reveal<T extends HTMLElement>(key: string) {
  const rootRef = useRef<T | null>(null);
  const motionEnabled = useMotionGate();

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !motionEnabled) return;
    const scope = createScope({ root });
    scope.add(() => {
      const items = Array.from(root.querySelectorAll<HTMLElement>('[data-p5-reveal]'));
      if (!items.length) return;
      animate(items, {
        opacity: [0, 1],
        translateY: [26, 0],
        duration: 620,
        ease: 'out(4)',
        delay: (_: unknown, index = 0) => Math.min(index, 14) * 55,
      });
    });
    return () => {
      scope.revert();
    };
  }, [key, motionEnabled]);

  return rootRef;
}
