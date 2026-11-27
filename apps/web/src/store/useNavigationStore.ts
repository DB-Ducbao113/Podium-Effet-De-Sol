import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Language } from '../types';

interface NavigationStoreState {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
}

function syncDocumentLang(lang: Language): void {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
  }
}

export const useNavigationStore = create<NavigationStoreState>()(
  persist(
    (set) => ({
      lang: 'en',
      setLang: (lang) => {
        syncDocumentLang(lang);
        set({ lang });
      },
      toggleLang: () =>
        set((state) => {
          const next: Language = state.lang === 'vi' ? 'en' : 'vi';
          syncDocumentLang(next);
          return { lang: next };
        }),
    }),
    {
      name: 'podium-navigation',
      partialize: (state) => ({ lang: state.lang }),
      onRehydrateStorage: () => (state) => {
        if (state?.lang) {
          syncDocumentLang(state.lang);
        }
      },
    },
  ),
);
