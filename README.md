# mevdad.github.io

Portfolio of **Artem Kalinichenko** — Senior Software Engineer (Web3 · AI Automation).
Live: https://mevdad.github.io

Next.js 15 (App Router, static export) · React 19 · TypeScript (strict) · Tailwind CSS v4 · Motion · Lenis.

## Run locally

Requires Node.js ≥ 20.9 and pnpm 9 (`corepack enable`, or prefix commands with `npx --yes pnpm@9`).

```bash
pnpm install
pnpm dev         # http://localhost:3000
pnpm lint        # ESLint (next/core-web-vitals + typescript)
pnpm typecheck   # next typegen && tsc --noEmit
pnpm build       # static export to ./out
pnpm start       # serve ./out locally
```

## Structure

```
src/
  app/            layout (fonts, metadata, JSON-LD, theme script), page, globals.css (design tokens),
                  sitemap.ts, robots.ts, icon.svg, og.png/ (build-time Open Graph image), not-found
  components/
    sections/     Hero, About, Services, Skills, Experience, Projects, Principles, Languages, Contact
    ui/           Header, SiteNav*, ThemeToggle*, Footer, Intro, Marquee, Tag, ButtonLink, icons
    motion/       SmoothScroll* (Lenis), RevealObserver*, Counter*, Magnetic*, TiltCard*, TimelineProgress*
  content/        Typed content: profile, services, skills, experience, projects
  lib/            site config & section ids, dates, theme, reveal helper, structured data
```

`*` = client component (`'use client'`). Everything else is a Server Component rendered to static HTML at build time.

Content lives only in `src/content` — edit it there, never in components.

### Motion & accessibility

- Hero entrance, intro, gradient mesh and marquee are pure CSS; reveal-on-scroll is CSS driven by one observer.
- All animations use `transform` / `opacity` only.
- `prefers-reduced-motion: reduce` disables the intro, hero/reveal/mesh/marquee animations, counters,
  magnetic/tilt effects, the timeline progress animation and Lenis (it is never even downloaded).
- Dark theme by default; the choice is stored in `localStorage` and applied by a blocking head script (no flash).

## Deploy

`.github/workflows/deploy.yml` runs lint → typecheck → build on every push/PR to `main` and, on `main`,
publishes `out/` with `actions/upload-pages-artifact` + `actions/deploy-pages`. A monthly cron rebuilds it,
because "years of experience" and the footer year are computed at build time.

One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
The site is a user site served from the domain root, so there is no `basePath`.
