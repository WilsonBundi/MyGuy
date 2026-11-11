import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { StyleSheet, useColorScheme, type StyleProp, type ViewStyle } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSoft: string;
  text: string;
  textSecondary: string;
  muted: string;
  border: string;
  accent: string;
  accentSoft: string;
  input: string;
}

interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  loading: boolean;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => Promise<void>;
}

const STORAGE_KEY = 'myguy:theme:v1';

const lightColors: ThemeColors = {
  background: '#fffaf5',
  surface: '#ffffff',
  surfaceSoft: '#fff1e5',
  text: '#292524',
  textSecondary: '#6b625b',
  muted: '#6b625b',
  border: '#f1e8df',
  accent: '#c2410c',
  accentSoft: '#fff5eb',
  input: '#ffffff',
};

const darkColors: ThemeColors = {
  background: '#151210',
  surface: '#211c19',
  surfaceSoft: '#30241c',
  text: '#f5eee8',
  textSecondary: '#c4b8ae',
  muted: '#a39488',
  border: '#3a3029',
  accent: '#fb923c',
  accentSoft: '#38271d',
  input: '#211c19',
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (mounted && (stored === 'light' || stored === 'dark' || stored === 'system')) {
          setModeState(stored);
        }
      })
      .catch((error) => {
        console.error('Could not load MyGuy theme preference:', error);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const setMode = async (nextMode: ThemeMode) => {
    await AsyncStorage.setItem(STORAGE_KEY, nextMode);
    setModeState(nextMode);
  };

  const isDark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark');
  const colors = isDark ? darkColors : lightColors;
  const value = useMemo(
    () => ({ mode, isDark, loading, colors, setMode }),
    [mode, isDark, loading]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}

const darkValueMap: Record<string, string> = {
  '#fffaf5': darkColors.background,
  '#f9fafb': darkColors.background,
  '#f5f5f5': darkColors.background,
  '#ffffff': darkColors.surface,
  '#fff1e5': darkColors.surfaceSoft,
  '#fff0e2': darkColors.surfaceSoft,
  '#fff5eb': darkColors.accentSoft,
  '#f1e8df': darkColors.border,
  '#f3eee9': darkColors.border,
  '#f5f0eb': darkColors.border,
  '#f4eee8': darkColors.border,
  '#f3f4f6': darkColors.border,
  '#f5f5f4': darkColors.input,
  '#e5e7eb': darkColors.border,
  '#d1d5db': darkColors.border,
  '#fff7ed': darkColors.accentSoft,
  '#fff1f0': '#3a211e',
  '#111827': darkColors.text,
  '#1f2937': darkColors.text,
  '#292524': darkColors.text,
  '#44403c': darkColors.textSecondary,
  '#374151': darkColors.textSecondary,
  '#57534e': darkColors.textSecondary,
  '#6b625b': darkColors.textSecondary,
  '#6b7280': darkColors.textSecondary,
  '#78716c': darkColors.textSecondary,
  '#9ca3af': darkColors.muted,
  '#a8a29e': darkColors.muted,
  '#b7ada4': darkColors.muted,
  '#9a6b51': darkColors.textSecondary,
  '#9a5b3d': darkColors.textSecondary,
  '#8b5e46': darkColors.textSecondary,
  '#7c2d12': darkColors.textSecondary,
  '#9a3412': darkColors.textSecondary,
  '#4d7c0f': '#bef264',
  '#166534': '#86efac',
  '#b42318': '#fca5a5',
  '#b91c1c': '#fca5a5',
  '#dc2626': '#fca5a5',
  '#cc4b4b': '#fca5a5',
  '#c2410c': darkColors.accent,
  '#b45324': darkColors.accent,
};

const lightValueMap: Record<string, string> = {
  '#9ca3af': lightColors.muted,
  '#a8a29e': lightColors.muted,
  '#b7ada4': lightColors.muted,
  '#9a6b51': lightColors.textSecondary,
  '#9a5b3d': lightColors.textSecondary,
  '#8b5e46': lightColors.textSecondary,
  '#6b7280': lightColors.textSecondary,
};

export function useThemedStyles<T extends Record<string, unknown>>(source: T): T {
  const { isDark } = useTheme();
  return useMemo(() => {
    const themed: Record<string, unknown> = {};
    const valueMap = isDark ? darkValueMap : lightValueMap;
    for (const [name, style] of Object.entries(source)) {
      const flattened = StyleSheet.flatten(style as StyleProp<ViewStyle>) || {};
      const next: Record<string, unknown> = { ...flattened };
      for (const [property, value] of Object.entries(flattened)) {
        if (typeof value !== 'string' || !value.startsWith('#')) continue;
        const mapped = valueMap[value.toLowerCase()];
        if (!mapped) continue;
        if (property === 'color' && value.toLowerCase() === '#ffffff') continue;
        next[property] = mapped;
      }
      themed[name] = next;
    }
    return themed as T;
  }, [isDark, source]);
}
