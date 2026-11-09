import { useState, useEffect, useRef } from 'react';

/**
 * Hook to animate numbers from 0 to target value in duration ms using easeOutExpo
 */
export function useAnimatedCounter(
  target: number,
  durationMs: number = 1200,
  enabled: boolean = true,
): { value: number; isDone: boolean } {
  const [value, setValue] = useState<number>(enabled ? 0 : target);
  const [isDone, setIsDone] = useState<boolean>(!enabled);
  const hasAnimatedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!enabled || hasAnimatedRef.current) {
      setValue(target);
      setIsDone(true);
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      setIsDone(true);
      hasAnimatedRef.current = true;
      return;
    }

    hasAnimatedRef.current = true;
    let startTime: number | null = null;
    let rafId: number;

    const tick = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      // easeOutExpo: 1 - Math.pow(2, -10 * progress)
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(eased * target);
      setValue(current);

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setValue(target);
        setIsDone(true);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, durationMs, enabled]);

  return { value, isDone };
}
