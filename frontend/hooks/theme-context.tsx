import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme as useNativeColorScheme } from 'react-native';
import { getPreference, savePreference } from '@/utils/storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: 'light' | 'dark';
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const THEME_PREFERENCE_KEY = 'themePreference';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const nativeScheme = useNativeColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    const loadThemePreference = async () => {
      const saved = await getPreference(THEME_PREFERENCE_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setThemeModeState(saved);
      }
    };

    loadThemePreference();
  }, []);

  const theme = themeMode === 'system' ? (nativeScheme === 'dark' ? 'dark' : 'light') : themeMode;

  const value = useMemo(
    () => ({
      theme,
      themeMode,
      setThemeMode: async (mode: ThemeMode) => {
        setThemeModeState(mode);
        await savePreference(THEME_PREFERENCE_KEY, mode);
      },
    }),
    [theme, themeMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  return context;
}
