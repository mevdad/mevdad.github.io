import { Counter } from "@/components/motion/counter";
import { SectionHeading } from "@/components/ui/section-heading";
import { getStats, profile } from "@/content/profile";
import { revealProps } from "@/lib/reveal";
import { sections } from "@/lib/site";

export function About() {
  // Runs at build time on the server; the resulting numbers are baked into
  // the HTML and passed to the Counter island as plain props.
  const stats = getStats(new Date());
  const [lead, ...paragraphs] = profile.about;

  return (
    <section id={sections.about.id} aria-labelledby="about-title" className="py-24 md:py-36">
      <div className="container-page">
        <SectionHeading
          index="01"
          eyebrow="About"
          id="about-title"
          title={
            <>
              One engineer for the <span className="text-accent-text">whole stack</span> — and for what happens after
              launch.
            </>
          }
        />

        <div className="grid gap-14 md:grid-cols-12">
          <div className="space-y-6 text-lg leading-relaxed md:col-span-7">
            <p className="text-xl text-fg md:text-2xl md:leading-snug" {...revealProps(0)}>
              {lead}
            </p>
            {paragraphs.map((paragraph, index) => (
              <p key={paragraph.slice(0, 24)} className="text-fg-muted" {...revealProps(index + 1)}>
                {paragraph}
              </p>
            ))}
          </div>

          <dl className="grid content-start gap-4 md:col-span-5">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="rounded-3xl border border-line bg-surface p-6 md:p-7"
                {...revealProps(index)}
              >
                <dt className="font-mono text-xs tracking-[0.18em] text-fg-muted uppercase">{stat.label}</dt>
                <dd className="mt-3 font-display text-6xl leading-none font-bold tracking-[-0.04em] text-fg md:text-7xl">
                  {stat.kind === "number" ? (
                    <Counter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                  ) : (
                    stat.value
                  )}
                </dd>
                <dd className="mt-3 text-sm text-fg-muted">{stat.note}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
