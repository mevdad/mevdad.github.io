export const THEMES = ["dark", "light"] as const;
export type Theme = (typeof THEMES)[number];

export const DEFAULT_THEME: Theme = "dark";

/** Browser-chrome colour per theme; keep in sync with `--bg` in globals.css. */
export const THEME_COLORS: Record<Theme, string> = { dark: "#0c0e14", light: "#f8f7f2" };

/** Keeps <meta name="theme-color"> (mobile address bar) in step with the chosen theme. */
export function applyThemeColor(theme: Theme) {
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[theme]);
}
export const THEME_STORAGE_KEY = "theme";
const INTRO_SESSION_KEY = "intro-seen";

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

/**
 * Blocking inline script placed in <head>. It runs before first paint, so:
 *  - the stored theme is applied before anything is drawn (no light/dark flash);
 *  - the theme-color meta matches it (the static `viewport.themeColor` is only the dark default);
 *  - the intro flag is set at most once per session and never with reduced motion.
 *
 * It must stay tiny and dependency-free: it is a string, not a module.
 * Because it mutates <html> attributes before React hydrates, <html> carries
 * `suppressHydrationWarning` (that prop is one level deep — children are still checked).
 */
export const themeInitScript = `(function(){try{var d=document.documentElement;var t=localStorage.getItem('${THEME_STORAGE_KEY}');var th=(t==='light'||t==='dark')?t:'${DEFAULT_THEME}';d.dataset.theme=th;var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',th==='light'?'${THEME_COLORS.light}':'${THEME_COLORS.dark}');if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&!sessionStorage.getItem('${INTRO_SESSION_KEY}')){d.dataset.intro='';sessionStorage.setItem('${INTRO_SESSION_KEY}','1')}}catch(e){}})();`;
