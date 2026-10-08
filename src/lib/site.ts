/** Site-level constants shared by metadata, sitemap, robots and navigation. */
export const siteConfig = {
  url: "https://mevdad.github.io",
  title: "Artem Kalinichenko — Software Engineer · Backend · Frontend · Web3 · AI Automation",
  shortTitle: "Artem Kalinichenko",
  locale: "en_US",
  /** Bump (YYYY-MM-DD) when page content changes; feeds the sitemap <lastmod>. */
  contentUpdated: "2026-10-08",
} as const;

export const ogImage = {
  path: "/og.png",
  width: 1200,
  height: 630,
} as const;

/**
 * Single source for section ids. Sections and the nav both read from here,
 * so an anchor can't silently drift from its target.
 */
export const sections = {
  about: { id: "about", label: "About" },
  services: { id: "services", label: "Services" },
  skills: { id: "skills", label: "Skills" },
  experience: { id: "experience", label: "Experience" },
  projects: { id: "projects", label: "Projects" },
  principles: { id: "principles", label: "Principles" },
  languages: { id: "languages", label: "Languages" },
  contact: { id: "contact", label: "Contact" },
} as const;

export type SectionKey = keyof typeof sections;
export type SectionId = (typeof sections)[SectionKey]["id"];

/** Order shown in the header. Principles/Languages are reachable by scrolling. */
export const navItems = [
  sections.about,
  sections.services,
  sections.skills,
  sections.experience,
  sections.projects,
  sections.contact,
] as const;
