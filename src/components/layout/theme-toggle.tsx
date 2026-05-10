"use client";

import { useEffect, useSyncExternalStore } from "react";

type Theme = "light" | "dark";
const THEME_STORAGE_KEY = "theme";
const THEME_COOKIE_KEY = "theme";
const THEME_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function applyThemePreference(preference: Theme) {
  document.documentElement.classList.toggle("dark", preference === "dark");
  document.documentElement.dataset.theme = preference;
}

function persistManualTheme(theme: Theme) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  document.cookie = `${THEME_COOKIE_KEY}=${theme}; path=/; max-age=${THEME_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
}

function getResolvedThemeFromDocument(): Theme {
  const explicitTheme = document.documentElement.dataset.theme;

  if (explicitTheme === "dark") {
    return "dark";
  }

  if (explicitTheme === "light") {
    return "light";
  }

  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function emitThemeChange() {
  window.dispatchEvent(new Event("themechange"));
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        d="M20 15.5A8.5 8.5 0 1 1 12.5 4a7 7 0 1 0 7.5 11.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <circle cx="12" cy="12" r="4.5" fill="currentColor" />
      <path
        d="M12 2.5v2.2M12 19.3v2.2M4.7 4.7l1.6 1.6M17.7 17.7l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.7 19.3l1.6-1.6M17.7 6.3l1.6-1.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ThemeToggle({
  initialThemePreference,
}: Readonly<{ initialThemePreference: Theme }>) {
  const resolvedTheme = useSyncExternalStore(
    (onStoreChange) => {
      const handleThemeChange = () => {
        onStoreChange();
      };

      window.addEventListener("themechange", handleThemeChange);

      return () => {
        window.removeEventListener("themechange", handleThemeChange);
      };
    },
    getResolvedThemeFromDocument,
    () => (initialThemePreference === "dark" ? "dark" : "light"),
  );

  useEffect(() => {
    applyThemePreference(initialThemePreference);
    persistManualTheme(initialThemePreference);
    emitThemeChange();
  }, [initialThemePreference]);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => {
        const nextTheme: Theme = resolvedTheme === "dark" ? "light" : "dark";
        applyThemePreference(nextTheme);
        persistManualTheme(nextTheme);
        emitThemeChange();
      }}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-900 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 dark:focus:ring-slate-500 dark:focus:ring-offset-slate-950"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
