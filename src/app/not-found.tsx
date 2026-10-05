import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button-link";

// Next already emits <meta name="robots" content="noindex"> for not-found, so it is not
// repeated here. Metadata objects are replaced, not deep-merged, so empty `alternates` and a
// minimal `openGraph` drop the layout's canonical/og:url "/" (a 404 must not claim to be the homepage).
export const metadata: Metadata = {
  title: "Page not found",
  alternates: {},
  openGraph: { title: "Page not found" },
};

/** Exported as out/404.html, which GitHub Pages serves for unknown paths. */
export default function NotFound() {
  return (
    <section aria-labelledby="not-found-title" className="container-page flex min-h-[70svh] flex-col justify-center py-24">
      <p className="font-mono text-sm text-accent-text">404</p>
      <h1 id="not-found-title" className="mt-4 font-display text-5xl font-bold tracking-[-0.04em] md:text-7xl">
        This page doesn&apos;t exist.
      </h1>
      <div className="mt-10">
        <ButtonLink href="/">Back to the homepage</ButtonLink>
      </div>
    </section>
  );
}
