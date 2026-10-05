import { SectionHeading } from "@/components/ui/section-heading";
import { principles } from "@/content/profile";
import { revealProps } from "@/lib/reveal";
import { sections } from "@/lib/site";

export function Principles() {
  return (
    <section
      id={sections.principles.id}
      aria-labelledby="principles-title"
      className="border-t border-line bg-bg-elevated py-24 md:py-36"
    >
      <div className="container-page">
        <SectionHeading index="06" eyebrow="Working principles" id="principles-title" title="How I work." />
        <ol className="grid gap-12 md:grid-cols-2 md:gap-16">
          {principles.map((principle, index) => (
            <li key={principle.title} className="border-t-2 border-accent-text pt-8" {...revealProps(index)}>
              <p aria-hidden="true" className="font-mono text-sm text-fg-muted">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-4 font-display text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
                {principle.title}
              </h3>
              <p className="mt-5 text-lg leading-relaxed text-fg-muted">{principle.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
