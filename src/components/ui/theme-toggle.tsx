"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_THEME, THEME_STORAGE_KEY, applyThemeColor, isTheme, type Theme } from "@/lib/theme";

/**
 * The theme lives on <html data-theme> (set by the blocking head script
 * before paint), not in React state. React just *subscribes* to it.
 *
 * useSyncExternalStore is the hook for "state owned outside React":
 * - getServerSnapshot returns the default, which is exactly what the static
 *   HTML was rendered with, so hydration matches;
 * - right after hydration React re-reads getSnapshot and re-renders if the
 *   stored theme differs. No useEffect + useState dance, no mismatch warning.
 */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function getSnapshot(): Theme {
  const value = document.documentElement.dataset.theme;
  return isTheme(value) ? value : DEFAULT_THEME;
}

function getServerSnapshot(): Theme {
  return DEFAULT_THEME;
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isDark = theme === "dark";

  function toggle() {
    const next: Theme = isDark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    applyThemeColor(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable (privacy mode); the switch still works for this page view.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={!isDark}
      className="group relative inline-flex size-10 items-center justify-center rounded-full border border-line text-fg hover:border-line-strong"
    >
      <span className="sr-only">Light theme</span>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={`absolute size-[18px] transition-[opacity,transform] duration-500 ease-out-expo ${
          isDark ? "scale-100 rotate-0 opacity-100" : "scale-50 -rotate-90 opacity-0"
        }`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      </svg>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={`absolute size-[18px] transition-[opacity,transform] duration-500 ease-out-expo ${
          isDark ? "scale-50 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"
        }`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}
