import { useSyncExternalStore } from 'react';

const query = '(max-width: 860px)';

function subscribe(callback: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}

function getSnapshot() {
  return window.matchMedia(query).matches;
}

export function useMobileHub() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

export const isPrimaryPath = (pathname: string) =>
  pathname === '/' || pathname === '/showroom' || /^\/season\/(2024|2025|2026)$/.test(pathname);
