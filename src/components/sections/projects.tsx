import { TiltCard } from "@/components/motion/tilt-card";
import { Icon, type IconName } from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/section-heading";
import { TagList } from "@/components/ui/tag";
import { projects } from "@/content/projects";
import type { Project, ProjectLink } from "@/content/types";
import { revealProps } from "@/lib/reveal";
import { sections } from "@/lib/site";

// Record keyed by the union's discriminant: adding a new link kind to
// ProjectLink without an icon here is a type error.
const linkIcon: Record<ProjectLink["kind"], IconName> = {
  github: "github",
  website: "arrow-up-right",
  telegram: "telegram",
};

export function Projects() {
  return (
    <section id={sections.projects.id} aria-labelledby="projects-title" className="border-t border-line py-24 md:py-36">
      <div className="container-page">
        <SectionHeading
          index="05"
          eyebrow="Selected work"
          id="projects-title"
          title={
            <>
              Things I&apos;ve <span className="text-accent-text">built</span>.
            </>
          }
          intro="SaaS, on-chain systems, high-load web and bots — a cross-section of recent work."
        />

        <ul className="grid grid-cols-1 gap-5 md:grid-cols-6">
          {projects.map((project, index) => (
            <li
              key={project.id}
              // Featured first card spans the full row; the other four form a 2×2 grid.
              className={index === 0 ? "md:col-span-6" : "md:col-span-3"}
              {...revealProps(index === 0 ? 0 : (index - 1) % 2)}
            >
              <TiltCard className="h-full rounded-3xl border border-line bg-surface">
                <ProjectCard project={project} featured={index === 0} index={index} />
              </TiltCard>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ProjectCard({ project, featured, index }: { project: Project; featured: boolean; index: number }) {
  return (
    <article
      aria-labelledby={`project-${project.id}`}
      className={`relative flex h-full flex-col p-7 md:p-9 ${featured ? "md:grid md:grid-cols-12 md:gap-10" : ""}`}
    >
      <div className={featured ? "md:col-span-7" : ""}>
        <div className="mb-6 flex items-center justify-between gap-4">
          <p className="font-mono text-xs tracking-[0.14em] text-fg-muted uppercase">{project.category}</p>
          <span aria-hidden="true" className="font-mono text-xs text-accent-text">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
        <h3
          id={`project-${project.id}`}
          className={`font-display leading-[1.05] font-semibold tracking-[-0.025em] ${
            featured ? "text-4xl md:text-5xl" : "text-2xl md:text-3xl"
          }`}
        >
          {project.title}
        </h3>
        <p className="mt-5 leading-relaxed text-fg-muted">{project.description}</p>
      </div>

      <div className={`flex flex-col gap-6 ${featured ? "mt-8 md:col-span-5 md:mt-0 md:justify-end" : "mt-auto pt-8"}`}>
        <TagList items={project.tags} label={`${project.title} technologies`} />
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-line pt-5 text-sm">
          {project.links.length > 0 ? (
            project.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 font-medium text-fg hover:text-accent-text"
              >
                <Icon name={linkIcon[link.kind]} />
                {link.label}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            ))
          ) : (
            <p className="inline-flex items-center gap-2 text-fg-muted">
              <Icon name="briefcase" />
              No public link
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
