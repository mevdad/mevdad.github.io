export const THEMES = ["dark", "light"] as const;
export type Theme = (typeof THEMES)[number];

export const DEFAULT_THEME: Theme = "dark";
export const THEME_STORAGE_KEY = "theme";
const INTRO_SESSION_KEY = "intro-seen";

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

/**
 * Blocking inline script placed in <head>. It runs before first paint, so:
 *  - the stored theme is applied before anything is drawn (no light/dark flash);
 *  - `js` class marks that scripting works;
 *  - the intro flag is set at most once per session and never with reduced motion.
 *
 * It must stay tiny and dependency-free: it is a string, not a module.
 * Because it mutates <html> attributes before React hydrates, <html> carries
 * `suppressHydrationWarning` (that prop is one level deep — children are still checked).
 */
export const themeInitScript = `(function(){try{var d=document.documentElement;d.classList.add('js');var t=localStorage.getItem('${THEME_STORAGE_KEY}');d.dataset.theme=(t==='light'||t==='dark')?t:'${DEFAULT_THEME}';if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&!sessionStorage.getItem('${INTRO_SESSION_KEY}')){d.dataset.intro='';sessionStorage.setItem('${INTRO_SESSION_KEY}','1')}}catch(e){}})();`;
