export type Theme = "light" | "dark";

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  resolvedTheme: Theme;
}

export const THEME_STORAGE_KEY = "arrise-theme-preference";
export const THEME_ATTRIBUTE = "data-theme";

export function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";

  const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
  if (stored === "dark" || stored === "light") return stored;

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;

  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(theme);
  document.documentElement.setAttribute(THEME_ATTRIBUTE, theme);
}

export function getServerTheme(cookieTheme?: string): Theme {
  if (cookieTheme === "dark" || cookieTheme === "light") return cookieTheme;
  return "light";
}
