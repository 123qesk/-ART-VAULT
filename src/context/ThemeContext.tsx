import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeMode, CustomThemeColors, DisplayMode, WallpaperConfig, ThemePreset } from '../types';
import { vaultDB } from '../services/db';

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
  wallpaper: WallpaperConfig;
  setWallpaper: (wallpaper: WallpaperConfig) => Promise<void>;
  removeWallpaper: () => Promise<void>;
  autoPlayMedia: boolean;
  setAutoPlayMedia: (enabled: boolean) => void;
  // Saved custom theme presets
  savedPresets: ThemePreset[];
  activePresetId: string | null;
  addPreset: (name: string, showInHeader?: boolean) => ThemePreset;
  updatePreset: (id: string, updates: Partial<ThemePreset>) => void;
  deletePreset: (id: string) => void;
  applyPreset: (preset: ThemePreset) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = 'art_vault_theme_mode_v3';
const THEME_PALETTES_KEY = 'art_vault_theme_palettes_v3';
const DISPLAY_MODE_KEY = 'art_vault_display_mode_v1';
const AUTOPLAY_MEDIA_KEY = 'art_vault_autoplay_media_v1';
const WALLPAPER_STORAGE_KEY = 'art_vault_wallpaper_state_v1';
const THEME_PRESETS_KEY = 'art_vault_saved_presets_v1';
const ACTIVE_PRESET_KEY = 'art_vault_active_preset_id_v1';

const DEFAULT_WALLPAPER: WallpaperConfig = {
  type: 'none',
  url: '',
  opacity: 85,
  blur: 0,
  fit: 'cover',
};

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

  // Saved theme presets state
  const [savedPresets, setSavedPresets] = useState<ThemePreset[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(THEME_PRESETS_KEY);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  const [activePresetId, setActivePresetId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(ACTIVE_PRESET_KEY);
    }
    return null;
  });

  // Wallpaper state
  const [wallpaper, setWallpaperState] = useState<WallpaperConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(WALLPAPER_STORAGE_KEY);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_WALLPAPER;
  });

  // Load wallpaper from IndexedDB on initial mount
  useEffect(() => {
    let mounted = true;
    vaultDB.getWallpaper().then((savedWp) => {
      if (mounted && savedWp) {
        setWallpaperState(savedWp);
        try {
          // If small, cache in localStorage
          if (savedWp.url.length < 500000) {
            localStorage.setItem(WALLPAPER_STORAGE_KEY, JSON.stringify(savedWp));
          }
        } catch (e) {
          console.error(e);
        }
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const setWallpaper = async (newWp: WallpaperConfig) => {
    if (!newWp) return;
    const url = newWp.url || '';
    const safeWp: WallpaperConfig = {
      type: newWp.type || (url ? 'image' : 'none'),
      url: url,
      opacity: typeof newWp.opacity === 'number' ? newWp.opacity : 85,
      blur: typeof newWp.blur === 'number' ? newWp.blur : 0,
      fit: newWp.fit || 'cover',
    };
    setWallpaperState(safeWp);
    try {
      if (url.length < 500000) {
        localStorage.setItem(WALLPAPER_STORAGE_KEY, JSON.stringify(safeWp));
      } else {
        localStorage.removeItem(WALLPAPER_STORAGE_KEY);
      }
    } catch (e) {
      console.error(e);
    }
    try {
      await vaultDB.saveWallpaper(safeWp);
    } catch (e) {
      console.error(e);
    }
  };

  const removeWallpaper = async () => {
    setWallpaperState(DEFAULT_WALLPAPER);
    localStorage.removeItem(WALLPAPER_STORAGE_KEY);
    await vaultDB.deleteWallpaper();
  };

  // Effective colors for the currently selected theme
  const currentThemeKey = theme === 'light' ? 'ivory' : theme;
  const currentDefaultColors = BUILTIN_THEMES_DEFAULT[currentThemeKey] || BUILTIN_THEMES_DEFAULT.ivory;
  const currentColors: CustomThemeColors = {
    ...currentDefaultColors,
    ...(themePalettes[currentThemeKey] || {}),
  };

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

  // Video & GIF autoplay management mode
  const [autoPlayMedia, setAutoPlayMediaState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(AUTOPLAY_MEDIA_KEY);
        if (saved !== null) {
          return JSON.parse(saved);
        }
      } catch (e) {
        // fallback
      }
    }
    return true;
  });

  const setAutoPlayMedia = (enabled: boolean) => {
    setAutoPlayMediaState(enabled);
    localStorage.setItem(AUTOPLAY_MEDIA_KEY, JSON.stringify(enabled));
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
      'theme-custom',
      'theme-style-default',
      'theme-style-glass',
      'theme-style-neumorphism',
      'theme-style-flat'
    );

    // Add current theme class
    root.classList.add(`theme-${currentThemeKey}`);
    if (isDark) {
      root.classList.add('dark');
    }

    // Determine granular opacities (0 - 100)
    const pageOp = currentColors.pageOpacity !== undefined ? currentColors.pageOpacity : 100;
    const cardOp = currentColors.cardOpacity !== undefined ? currentColors.cardOpacity : 100;
    const navOp = currentColors.navbarOpacity !== undefined ? currentColors.navbarOpacity : 100;
    const dockOp = currentColors.dockOpacity !== undefined ? currentColors.dockOpacity : navOp;
    const contentOp = currentColors.contentOpacity !== undefined ? currentColors.contentOpacity : 100;
    const modalOp = currentColors.modalOpacity !== undefined ? currentColors.modalOpacity : 98;
    const searchOp = currentColors.searchOpacity !== undefined ? currentColors.searchOpacity : 90;
    const badgeOp = currentColors.badgeOpacity !== undefined ? currentColors.badgeOpacity : 100;

    // Apply styles to root classList
    const themeStyle = currentColors.themeStyle || 'default';
    root.classList.add(`theme-style-${themeStyle}`);
    root.style.setProperty('--bg-page-raw', currentColors.bgPage);
    root.style.setProperty('--bg-page', `color-mix(in srgb, ${currentColors.bgPage} ${pageOp}%, transparent)`);
    
    // Mix with transparent for opacities
    root.style.setProperty('--card-bg-raw', currentColors.cardBg);
    root.style.setProperty('--navbar-bg-raw', currentColors.navbarBg || currentColors.cardBg);
    
    root.style.setProperty('--card-bg', `color-mix(in srgb, ${currentColors.cardBg} ${cardOp}%, transparent)`);
    root.style.setProperty('--module-bg', `color-mix(in srgb, ${currentColors.cardBg} ${cardOp}%, transparent)`);
    root.style.setProperty('--navbar-bg', `color-mix(in srgb, ${currentColors.navbarBg || currentColors.cardBg} ${navOp}%, transparent)`);
    root.style.setProperty('--dock-bg', `color-mix(in srgb, ${currentColors.navbarBg || currentColors.cardBg} ${dockOp}%, transparent)`);
    root.style.setProperty('--content-bg', `color-mix(in srgb, ${currentColors.cardBg} ${contentOp}%, transparent)`);
    root.style.setProperty('--modal-bg', `color-mix(in srgb, ${currentColors.cardBg} ${modalOp}%, transparent)`);
    root.style.setProperty('--search-bg', `color-mix(in srgb, ${currentColors.cardBg} ${searchOp}%, transparent)`);
    root.style.setProperty('--badge-bg', `color-mix(in srgb, ${currentColors.cardBg} ${badgeOp}%, transparent)`);
    
    root.style.setProperty('--page-opacity', `${pageOp}%`);
    root.style.setProperty('--card-opacity', `${cardOp}%`);
    root.style.setProperty('--navbar-opacity', `${navOp}%`);
    root.style.setProperty('--dock-opacity', `${dockOp}%`);
    root.style.setProperty('--content-opacity', `${contentOp}%`);
    root.style.setProperty('--modal-opacity', `${modalOp}%`);
    root.style.setProperty('--search-opacity', `${searchOp}%`);
    root.style.setProperty('--badge-opacity', `${badgeOp}%`);

    root.style.setProperty('--navbar-border', currentColors.cardBorder);
    root.style.setProperty('--text-main', currentColors.textMain);
    root.style.setProperty('--text-muted', currentColors.textMuted);
    root.style.setProperty('--card-border', currentColors.cardBorder);
    root.style.setProperty('--accent-gold', currentColors.accentColor);
    root.style.setProperty('--home-greeting-color', currentColors.homeGreetingColor || currentColors.textMain);
    root.style.setProperty('--home-motto-color', currentColors.homeMottoColor || currentColors.textMuted);

    localStorage.setItem(THEME_KEY, theme);
  }, [theme, currentColors, currentThemeKey, isDark]);

  // Sync or clean up activePresetId if referenced preset no longer exists
  useEffect(() => {
    if (activePresetId && !savedPresets.some((p) => p.id === activePresetId)) {
      setActivePresetId(null);
      localStorage.removeItem(ACTIVE_PRESET_KEY);
    }
  }, [activePresetId, savedPresets]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'ivory' : 'dark'));
    setActivePresetId(null);
    localStorage.removeItem(ACTIVE_PRESET_KEY);
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    setActivePresetId(null);
    localStorage.removeItem(ACTIVE_PRESET_KEY);
  };

  // Modify the colors of the current active theme (built-in or custom)
  const setCustomColors = (newColors: Partial<CustomThemeColors>) => {
    setActivePresetId(null);
    localStorage.removeItem(ACTIVE_PRESET_KEY);
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
    setActivePresetId(null);
    localStorage.removeItem(ACTIVE_PRESET_KEY);
    setThemePalettes((prev) => {
      const updated = { ...prev };
      delete updated[currentThemeKey];
      localStorage.setItem(THEME_PALETTES_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // Preset handlers
  const addPreset = (name: string, showInHeader: boolean = true): ThemePreset => {
    const newPreset: ThemePreset = {
      id: `preset-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim() || '未命名预设',
      themeMode: theme,
      colors: { ...currentColors, wallpaper },
      showInHeader,
      createdAt: new Date().toISOString(),
    };

    setSavedPresets((prev) => {
      const updated = [newPreset, ...prev];
      localStorage.setItem(THEME_PRESETS_KEY, JSON.stringify(updated));
      return updated;
    });

    setActivePresetId(newPreset.id);
    localStorage.setItem(ACTIVE_PRESET_KEY, newPreset.id);

    return newPreset;
  };

  const updatePreset = (id: string, updates: Partial<ThemePreset>) => {
    setSavedPresets((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
      localStorage.setItem(THEME_PRESETS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const deletePreset = (id: string) => {
    setSavedPresets((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      localStorage.setItem(THEME_PRESETS_KEY, JSON.stringify(updated));
      return updated;
    });
    if (activePresetId === id) {
      setActivePresetId(null);
      localStorage.removeItem(ACTIVE_PRESET_KEY);
    }
  };

  const applyPreset = (preset: ThemePreset) => {
    if (!preset || !preset.id) return;

    try {
      const mode = preset.themeMode || 'custom';
      const targetKey = mode === 'light' ? 'ivory' : mode;
      
      const defaultForTarget = BUILTIN_THEMES_DEFAULT[targetKey] || BUILTIN_THEMES_DEFAULT.ivory;
      const cleanColors = { ...(preset.colors || {}) };
      delete (cleanColors as any).wallpaper; // separate wallpaper from colors map

      const mergedColors: CustomThemeColors = {
        ...defaultForTarget,
        ...cleanColors,
      };

      setThemePalettes((prev) => {
        const updated = {
          ...prev,
          [targetKey]: mergedColors,
        };
        localStorage.setItem(THEME_PALETTES_KEY, JSON.stringify(updated));
        return updated;
      });

      setThemeState(mode);
      localStorage.setItem(THEME_KEY, mode);

      setActivePresetId(preset.id);
      localStorage.setItem(ACTIVE_PRESET_KEY, preset.id);

      // Apply wallpaper if exists in preset
      if (preset.colors && preset.colors.wallpaper) {
        setWallpaper(preset.colors.wallpaper);
      }
    } catch (e) {
      console.error('Error applying theme preset:', e);
    }
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
        wallpaper,
        setWallpaper,
        removeWallpaper,
        autoPlayMedia,
        setAutoPlayMedia,
        savedPresets,
        activePresetId,
        addPreset,
        updatePreset,
        deletePreset,
        applyPreset,
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
