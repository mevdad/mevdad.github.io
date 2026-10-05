"use client";

import { useEffect, useId, useRef, useState } from "react";
import { navItems, type SectionId } from "@/lib/site";

/**
 * Client island: active-section highlighting + mobile menu.
 * The header around it (logo, theme toggle slot) stays a Server Component.
 */
export function SiteNav() {
  const [active, setActive] = useState<SectionId | null>(null);
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Scroll-spy: a thin band in the middle of the viewport decides which
  // section is "current". IntersectionObserver instead of a scroll listener:
  // no layout reads on every scroll frame.
  useEffect(() => {
    const ids = new Set<string>(navItems.map((item) => item.id));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const match = navItems.find((item) => item.id === entry.target.id);
          if (match) setActive(match.id);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const el of document.querySelectorAll("section[id]")) {
      if (ids.has(el.id)) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  // Escape closes the menu and returns focus to the toggle (WAI-ARIA disclosure pattern).
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const linkClass = (id: SectionId) =>
    `relative rounded-full px-3 py-2 text-sm ${
      active === id ? "text-fg" : "text-fg-muted hover:text-fg"
    }`;

  return (
    <>
      <nav aria-label="Primary" className="hidden md:block">
        <ul className="flex items-center gap-1">
          {navItems.map((item) => (
            <li key={item.id}>
              <a
                href={`/#${item.id}`}
                className={linkClass(item.id)}
                aria-current={active === item.id ? "location" : undefined}
              >
                {item.label}
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-3 -bottom-0.5 h-px origin-left bg-accent-text transition-transform duration-500 ease-out-expo ${
                    active === item.id ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <button
        ref={buttonRef}
        type="button"
        className="inline-flex size-10 items-center justify-center rounded-full border border-line text-fg hover:border-line-strong md:hidden"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="sr-only">Menu</span>
        <span aria-hidden="true" className="relative block h-3 w-4">
          <span
            className={`absolute top-0 left-0 h-px w-4 bg-current transition-transform duration-300 ${
              open ? "translate-y-1.5 rotate-45" : ""
            }`}
          />
          <span
            className={`absolute bottom-0 left-0 h-px w-4 bg-current transition-transform duration-300 ${
              open ? "-translate-y-1.5 -rotate-45" : ""
            }`}
          />
        </span>
      </button>

      {/* `inert` when closed: not focusable, not announced — no hidden tab stops. */}
      <nav
        id={menuId}
        aria-label="Primary mobile"
        inert={!open}
        className={`absolute inset-x-0 top-full border-b border-line bg-bg-elevated transition-[opacity,transform] duration-300 ease-out-expo md:hidden ${
          open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
        }`}
      >
        <ul className="container-page flex flex-col py-3">
          {navItems.map((item) => (
            <li key={item.id} className="border-b border-line last:border-b-0">
              <a
                href={`/#${item.id}`}
                onClick={() => setOpen(false)}
                aria-current={active === item.id ? "location" : undefined}
                className="flex items-center justify-between py-4 font-display text-2xl"
              >
                {item.label}
                <span aria-hidden="true" className="font-mono text-xs text-fg-muted">
                  #{item.id}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
