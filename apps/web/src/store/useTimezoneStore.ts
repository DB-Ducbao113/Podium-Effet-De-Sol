import { create } from 'zustand';
import { TIMEZONE_STORAGE_KEY, validTimeZone } from '../utils/championshipTimezone';

function initialPreference() {
  try {
    const saved = localStorage.getItem(TIMEZONE_STORAGE_KEY);
    return saved && validTimeZone(saved) ? saved : 'venue';
  } catch { return 'venue'; }
}

export const useTimezoneStore = create<{ preference: string; setPreference: (zone: string) => void }>((set) => ({
  preference: initialPreference(),
  setPreference: (zone) => {
    if (!validTimeZone(zone)) return;
    try { localStorage.setItem(TIMEZONE_STORAGE_KEY, zone); } catch { /* storage can be disabled */ }
    set({ preference: zone });
  },
}));
