import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeMode, CustomThemeColors, DisplayMode } from '../types';

export const BUILTIN_THEMES_DEFAULT: Record<ThemeMode, CustomThemeColors> = {
  ivory: {
    bgPage: '#F7F3EB',
    cardBg: '#FFFDF9',
    navbarBg: '#F5F0E6',
    textMain: '#2C2621',
    textMuted: '#7D746A',
    cardBorder: '#E3DCD0',
    accentColor: '#B4783E',
    homeGreetingColor: '#2C2621',
    homeMottoColor: '#7D746A',
  },
  pure_white: {
    bgPage: '#FFFFFF',
    cardBg: '#FAFAFA',
    navbarBg: '#FFFFFF',
    textMain: '#111827',
    textMuted: '#6B7280',
    cardBorder: '#E5E7EB',
    accentColor: '#374151',
    homeGreetingColor: '#111827',
    homeMottoColor: '#6B7280',
  },
  dark: {
    bgPage: '#0C0E14',
    cardBg: '#141822',
    navbarBg: '#10131B',
    textMain: '#F3F4F6',
    textMuted: '#9CA3AF',
    cardBorder: '#232A3B',
    accentColor: '#F59E0B',
    homeGreetingColor: '#F3F4F6',
    homeMottoColor: '#9CA3AF',
  },
  pink: {
    bgPage: '#FFF5F7',
    cardBg: '#FFFFFF',
    navbarBg: '#FFF0F4',
    textMain: '#3B202B',
    textMuted: '#8E6578',
    cardBorder: '#FCE7F0',
    accentColor: '#EC4899',
    homeGreetingColor: '#3B202B',
    homeMottoColor: '#8E6578',
  },
  pixel: {
    bgPage: '#0C1512',
    cardBg: '#13241D',
    navbarBg: '#0A1310',
    textMain: '#E6FFF5',
    textMuted: '#7AA594',
    cardBorder: '#1E3D30',
    accentColor: '#10B981',
    homeGreetingColor: '#E6FFF5',
    homeMottoColor: '#7AA594',
  },
  custom: {
    bgPage: '#F3F4F6',
    cardBg: '#FFFFFF',
    navbarBg: '#FFFFFF',
    textMain: '#111827',
    textMuted: '#6B7280',
    cardBorder: '#E5E7EB',
    accentColor: '#6366F1',
    homeGreetingColor: '#111827',
    homeMottoColor: '#6B7280',
  },
  light: {
    bgPage: '#FAF8F5',
    cardBg: '#FFFFFF',
    navbarBg: '#FAF8F5',
    textMain: '#1C1E21',
    textMuted: '#6B7280',
    cardBorder: '#E8E4DC',
    accentColor: '#C28E5A',
    homeGreetingColor: '#1C1E21',
    homeMottoColor: '#6B7280',
  },
};

export const DEFAULT_CUSTOM_COLORS: CustomThemeColors = BUILTIN_THEMES_DEFAULT.custom;

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  customColors: CustomThemeColors; // Current active theme colors (either default or user customized)
  setCustomColors: (colors: Partial<CustomThemeColors>) => void;
  resetCustomColors: () => void;
  isThemeCustomized: boolean;
  displayMode: DisplayMode;
  setDisplayMode: (mode: DisplayMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = 'art_vault_theme_mode_v3';
const THEME_PALETTES_KEY = 'art_vault_theme_palettes_v3';
const DISPLAY_MODE_KEY = 'art_vault_display_mode_v1';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(THEME_KEY) as ThemeMode;
      if (['light', 'dark', 'ivory', 'pure_white', 'pink', 'pixel', 'custom'].includes(saved)) {
        return saved;
      }
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'ivory';
  });

  // Store user color customizations per theme
  const [themePalettes, setThemePalettes] = useState<Record<string, CustomThemeColors>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(THEME_PALETTES_KEY);
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (e) {
        console.error(e);
      }
    }
    return {};
  });

  // Effective colors for the currently selected theme
  const currentThemeKey = theme === 'light' ? 'ivory' : theme;
  const currentDefaultColors = BUILTIN_THEMES_DEFAULT[currentThemeKey] || BUILTIN_THEMES_DEFAULT.ivory;
  const currentColors = themePalettes[currentThemeKey] || currentDefaultColors;

  const isDark = theme === 'dark' || theme === 'pixel';
  const isThemeCustomized = Boolean(themePalettes[currentThemeKey]);

  // Mode selection: default (with avatar & signature) vs minimal (clean, without avatar & signature)
  const [displayMode, setDisplayModeState] = useState<DisplayMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(DISPLAY_MODE_KEY) as DisplayMode;
      if (saved === 'default' || saved === 'minimal') {
        return saved;
      }
    }
    return 'default';
  });

  const setDisplayMode = (mode: DisplayMode) => {
    setDisplayModeState(mode);
    localStorage.setItem(DISPLAY_MODE_KEY, mode);
  };

  useEffect(() => {
    const root = document.documentElement;

    // Remove previous theme classes
    root.classList.remove(
      'dark',
      'theme-light',
      'theme-dark',
      'theme-ivory',
      'theme-pure_white',
      'theme-pink',
      'theme-pixel',
      'theme-custom'
    );

    // Add current theme class
    root.classList.add(`theme-${currentThemeKey}`);
    if (isDark) {
      root.classList.add('dark');
    }

    // Always inject CSS variables on root so that top bar, modules, and UI reflect the colors dynamically
    root.style.setProperty('--bg-page', currentColors.bgPage);
    root.style.setProperty('--card-bg', currentColors.cardBg);
    root.style.setProperty('--module-bg', currentColors.cardBg);
    root.style.setProperty('--navbar-bg', currentColors.navbarBg || currentColors.cardBg);
    root.style.setProperty('--navbar-border', currentColors.cardBorder);
    root.style.setProperty('--text-main', currentColors.textMain);
    root.style.setProperty('--text-muted', currentColors.textMuted);
    root.style.setProperty('--card-border', currentColors.cardBorder);
    root.style.setProperty('--accent-gold', currentColors.accentColor);
    root.style.setProperty('--home-greeting-color', currentColors.homeGreetingColor || currentColors.textMain);
    root.style.setProperty('--home-motto-color', currentColors.homeMottoColor || currentColors.textMuted);

    localStorage.setItem(THEME_KEY, theme);
  }, [theme, currentColors, currentThemeKey, isDark]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'ivory' : 'dark'));
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  // Modify the colors of the current active theme (built-in or custom)
  const setCustomColors = (newColors: Partial<CustomThemeColors>) => {
    setThemePalettes((prev) => {
      const updatedCurrent = {
        ...(prev[currentThemeKey] || currentDefaultColors),
        ...newColors,
      };
      const updated = {
        ...prev,
        [currentThemeKey]: updatedCurrent,
      };
      localStorage.setItem(THEME_PALETTES_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // Reset the current theme back to its built-in default palette
  const resetCustomColors = () => {
    setThemePalettes((prev) => {
      const updated = { ...prev };
      delete updated[currentThemeKey];
      localStorage.setItem(THEME_PALETTES_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        toggleTheme,
        setTheme,
        customColors: currentColors,
        setCustomColors,
        resetCustomColors,
        isThemeCustomized,
        displayMode,
        setDisplayMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
