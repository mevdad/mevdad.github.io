import { profile } from "@/content/profile";

/**
 * Page-load intro. Pure CSS (see `.intro` in globals.css): rendered on the
 * server, shown only when the head script set html[data-intro] (once per
 * session, never with reduced motion). It is decorative, so it is hidden
 * from assistive tech and never intercepts clicks.
 */
export function Intro() {
  return (
    <div
      aria-hidden="true"
      className="intro pointer-events-none fixed inset-0 z-[60] flex-col items-start justify-end bg-accent p-[clamp(1.25rem,4vw,2.5rem)] text-accent-ink"
    >
      <p className="intro-mark font-display text-[clamp(2.5rem,9vw,7rem)] leading-none font-bold tracking-[-0.04em]">
        {profile.name}
      </p>
      <span className="intro-bar mt-6 block h-[3px] w-full bg-accent-ink" />
    </div>
  );
}
