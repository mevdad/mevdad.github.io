import Link from "next/link";
import { profile } from "@/content/profile";
import { SiteNav } from "./site-nav";
import { ThemeToggle } from "./theme-toggle";

/**
 * Server Component shell. Only SiteNav (scroll-spy, mobile menu) and
 * ThemeToggle are client islands; the logo and layout ship as plain HTML.
 */
export function Header() {
  const initials = profile.name
    .split(" ")
    .map((part) => part[0])
    .join("");

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-[var(--header-bg)] backdrop-blur-md">
      <div className="container-page relative flex h-16 items-center justify-between gap-4">
        <Link href="/" className="group flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-full bg-accent font-display text-sm font-bold text-accent-ink transition-transform duration-500 ease-out-expo group-hover:rotate-[-12deg]"
          >
            {initials}
          </span>
          {/* Accessible name = the visible name (WCAG 2.5.3); on small screens it is sr-only. */}
          <span className="sr-only font-display text-[0.95rem] font-semibold tracking-tight sm:not-sr-only">
            {profile.name}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <SiteNav />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
