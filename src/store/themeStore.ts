import { create } from 'zustand';
import type { ThemeType } from '../types';
import { THEME_CONFIGS } from '../types';

interface ThemeState {
  currentTheme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  getThemeConfig: () => typeof THEME_CONFIGS[ThemeType];
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  currentTheme: 'default',
  setTheme: (currentTheme) => set({ currentTheme }),
  getThemeConfig: () => THEME_CONFIGS[get().currentTheme],
}));
