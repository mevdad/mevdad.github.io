import { profile } from "@/content/profile";
import { Icon } from "./icons";

export function Footer() {
  // Evaluated at build time (static export), so it is the build year — fine for a copyright line.
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line">
      <div className="container-page flex flex-col gap-6 py-10 text-sm text-fg-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {year} {profile.name}. {profile.location} · {profile.workMode}.
        </p>
        <p className="font-mono text-xs">Built with Next.js, React &amp; TypeScript · Static on GitHub Pages</p>
        <a href="#top" className="group inline-flex items-center gap-2 text-fg hover:text-accent-text">
          Back to top
          <Icon
            name="arrow-up"
            className="size-4 transition-transform duration-500 ease-out-expo group-hover:-translate-y-1"
          />
        </a>
      </div>
    </footer>
  );
}
