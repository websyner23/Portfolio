"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "websyner-theme";
const DEFAULT_THEME: Theme = "dark";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyClass(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(theme);
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);

  useEffect(() => {
    const stored =
      (typeof window !== "undefined" && (localStorage.getItem(STORAGE_KEY) as Theme | null)) ||
      DEFAULT_THEME;
    setThemeState(stored);
    applyClass(stored);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, t);
    applyClass(t);
  }, []);

  const toggle = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, next);
      applyClass(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ theme, setTheme, toggle }), [theme, setTheme, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}

/**
 * Inline script that runs before hydration to apply the stored theme,
 * preventing a flash of the wrong theme. Default is dark.
 */
export const themeInitScript = `
  (function () {
    try {
      var stored = localStorage.getItem('${STORAGE_KEY}');
      var theme = stored === 'light' || stored === 'dark' ? stored : '${DEFAULT_THEME}';
      var root = document.documentElement;
      root.classList.remove('dark', 'light');
      root.classList.add(theme);
      root.style.colorScheme = theme;
    } catch (e) {
      document.documentElement.classList.add('${DEFAULT_THEME}');
    }
  })();
`;
