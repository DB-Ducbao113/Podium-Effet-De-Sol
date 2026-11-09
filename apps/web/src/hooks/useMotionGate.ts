import { useEffect, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

type NetworkInformation = { saveData?: boolean };

function isLowPerformanceDevice() {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: NetworkInformation;
  };
  return nav.connection?.saveData === true || (nav.deviceMemory ?? 8) <= 4;
}

/** True when non-essential P4 reveals may run: motion allowed, tab visible, no data-saver/low-memory device. */
export function useMotionGate() {
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(
    () => typeof document === 'undefined' || !document.hidden,
  );

  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  return !reducedMotion && visible && !isLowPerformanceDevice();
}
