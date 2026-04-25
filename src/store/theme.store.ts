import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      toggleTheme() {
        set({ theme: get().theme === 'light' ? 'dark' : 'light' });
      },
    }),
    { name: 'jeep-in-theme' }
  )
);
