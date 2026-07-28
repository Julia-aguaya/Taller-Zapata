import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const THEME_STORAGE_KEY = 'front2.theme';
const LEGACY_DARK_STORAGE_KEY = 'front2.dark';

const ThemeContext = createContext(null);

function resolveInitialTheme() {
  if (typeof window === 'undefined') return 'light';

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }

  const legacyDark = window.localStorage.getItem(LEGACY_DARK_STORAGE_KEY);
  if (legacyDark === 'true') return 'dark';
  if (legacyDark === 'false') return 'light';

  if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
}

function applyThemeToDocument(theme) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const isDark = theme === 'dark';

  root.classList.toggle('dark', isDark);
  root.setAttribute('data-theme', theme);
  root.style.colorScheme = theme;
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(resolveInitialTheme);

  useEffect(() => {
    applyThemeToDocument(theme);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
      window.localStorage.removeItem(LEGACY_DARK_STORAGE_KEY);
    }
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    setTheme,
    toggleTheme: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }

  return context;
}
