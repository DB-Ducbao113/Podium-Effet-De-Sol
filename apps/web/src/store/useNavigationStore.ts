import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Language } from '../types';

interface NavigationStoreState {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
}

export const useNavigationStore = create<NavigationStoreState>()(
  persist(
    (set) => ({
      lang: 'vi',
      setLang: (lang) => set({ lang }),
      toggleLang: () => set((state) => ({ lang: state.lang === 'vi' ? 'en' : 'vi' })),
    }),
    {
      name: 'podium-navigation',
      partialize: (state) => ({ lang: state.lang }),
    },
  ),
);
