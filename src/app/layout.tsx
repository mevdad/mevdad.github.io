import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { RevealObserver } from "@/components/motion/reveal-observer";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { Footer } from "@/components/ui/footer";
import { Header } from "@/components/ui/header";
import { Intro } from "@/components/ui/intro";
import { profile } from "@/content/profile";
import { ogImage, siteConfig } from "@/lib/site";
import { buildPersonJsonLd, serializeJsonLd } from "@/lib/structured-data";
import { DEFAULT_THEME, THEME_COLORS, themeInitScript } from "@/lib/theme";
import "./globals.css";

/*
 * Fonts are downloaded at build time and self-hosted from /_next/static —
 * no request to Google at runtime, and `adjustFontFallback` sizes the
 * fallback font to match, so the swap does not shift layout (CLS).
 *  - Bricolage Grotesque: characterful display grotesque for headlines.
 *  - Geist: neutral, highly legible text face.
 *  - Geist Mono: labels, dates, tags — the "engineering" voice.
 */
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});
const sans = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap", preload: false });

const [firstName = "", ...lastNameParts] = profile.name.split(" ");
const images = [{ url: ogImage.path, width: ogImage.width, height: ogImage.height, alt: `${profile.name} — ${profile.headline}` }];

const description = `${profile.headline} (${profile.focus.join(", ")}) based in ${profile.location}. ${profile.summary}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: siteConfig.title,
  description,
  applicationName: siteConfig.shortTitle,
  authors: [{ name: profile.name, url: siteConfig.url }],
  creator: profile.name,
  keywords: [
    "Artem Kalinichenko",
    "Senior Software Engineer",
    "Full-stack developer",
    "Web3",
    "Solidity",
    "AI automation",
    "KeyCRM integration",
    "Nest.js",
    "Next.js",
    "Trading bots",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "profile",
    url: "/",
    siteName: siteConfig.shortTitle,
    title: siteConfig.title,
    description,
    locale: siteConfig.locale,
    firstName,
    lastName: lastNameParts.join(" "),
    images,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description,
    images,
  },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark light",
  themeColor: THEME_COLORS[DEFAULT_THEME],
};

/**
 * Root layout — a Server Component. It renders the document shell once at
 * build time. The client islands mounted here (SmoothScroll, RevealObserver,
 * and inside Header: SiteNav + ThemeToggle) plus the per-section ones
 * (Counter, Magnetic, TiltCard, TimelineProgress) are the only components
 * that ship JS; everything else is static HTML.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning: the head script sets data-theme / class on
    // <html> before React hydrates. It only silences this one element's
    // attributes — mismatches deeper in the tree are still reported.
    <html
      lang="en"
      data-theme="dark"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildPersonJsonLd()) }} />
      </head>
      <body id="top">
        <a
          href="#main"
          className="fixed top-3 left-3 z-[70] -translate-y-20 rounded-full bg-accent px-5 py-3 text-sm font-medium text-accent-ink focus-visible:translate-y-0"
        >
          Skip to content
        </a>
        <Intro />
        <Header />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <Footer />
        <SmoothScroll />
        <RevealObserver />
      </body>
    </html>
  );
}
