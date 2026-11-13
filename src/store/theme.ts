import { create } from 'zustand';

type ThemeState = { dark: boolean; toggle: () => void };

export const useTheme = create<ThemeState>((set, get) => ({
  dark: typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  toggle: () => {
    const dark = !get().dark;
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem('bl-theme', dark ? 'dark' : 'light');
    } catch {
      /* storage unavailable */
    }
    set({ dark });
  },
}));
