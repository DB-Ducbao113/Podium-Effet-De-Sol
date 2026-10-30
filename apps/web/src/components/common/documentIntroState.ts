import { INTRO_SEEN_STORAGE_KEY } from './F1StartLightsPreloader';
import { isDocumentReload } from './documentReload';

export function shouldShowDocumentIntro(): boolean {
  if (typeof window === 'undefined') return false;

  // 1. Respect prefers-reduced-motion
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
    return false;
  }

  // 2. Query override checks (?intro=false/skip vs ?intro=1x/2x/3x/replay)
  try {
    const params = new URLSearchParams(window.location.search);
    const param = (params.get('intro') || params.get('speed'))?.toLowerCase();
    if (param === 'false' || param === 'off' || param === 'skip' || param === '0') {
      return false;
    }
    if (param === 'replay' || param === '1x' || param === '2x' || param === '3x') {
      return true;
    }
  } catch {
    // ignore
  }

  // 3. User explicitly triggered a document reload (F5 / refresh)
  if (isDocumentReload()) {
    return true;
  }

  // 4. Initial entrance check: has it been seen in this session?
  try {
    const seen = window.sessionStorage?.getItem(INTRO_SEEN_STORAGE_KEY);
    return seen !== '1';
  } catch {
    return true;
  }
}

// Module evaluation happens once for this document, independently of router remounts.
export const initialIntroDecision = typeof window !== 'undefined' ? shouldShowDocumentIntro() : false;
