import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { setTheme as setThemeAction, toggleTheme as toggleThemeAction, setAccentColor as setAccentColorAction, setGlowEnabled as setGlowEnabledAction } from '@/store/themeSlice';
import React from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  accentColor: string;
  setAccentColor: (hex: string) => void;
  accentRgb: string;
  glowEnabled: boolean;
  setGlowEnabled: (v: boolean) => void;
}

export function useTheme(): ThemeContextValue {
  const dispatch = useDispatch<AppDispatch>();
  const theme = useSelector((s: RootState) => s.theme.theme);
  const accentColor = useSelector((s: RootState) => s.theme.accentColor);
  const glowEnabled = useSelector((s: RootState) => s.theme.glowEnabled);

  function hexToRgb(hex: string) {
    const h = hex.replace('#', '');
    const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `${r},${g},${b}`;
  }

  const toggleTheme = () => dispatch(toggleThemeAction());
  const setTheme = (t: Theme) => dispatch(setThemeAction(t));
  const setAccentColor = (hex: string) => dispatch(setAccentColorAction(hex));
  const setGlowEnabled = (v: boolean) => dispatch(setGlowEnabledAction(v));

  React.useEffect(() => {
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.setProperty('--page-bg', '#081028');
      root.style.setProperty('--page-text', '#f8fafc');
    } else {
      root.classList.remove('dark');
      root.style.setProperty('--page-bg', '#ffffff');
      root.style.setProperty('--page-text', '#0b1220');
    }

    root.style.setProperty('--accent-color', accentColor);
    try {
      const h = accentColor.replace('#', '');
      const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      root.style.setProperty('--accent-rgb', `${r},${g},${b}`);
    } catch (e) {}

    root.style.setProperty('--toggle-ring', glowEnabled ? `${accentColor}` : 'transparent');
  }, [theme, accentColor, glowEnabled]);

  return {
    theme,
    toggleTheme,
    setTheme,
    accentColor,
    setAccentColor,
    accentRgb: hexToRgb(accentColor),
    glowEnabled,
    setGlowEnabled,
  };
}
