import { TimelineProgress } from "@/components/motion/timeline-progress";
import { SectionHeading } from "@/components/ui/section-heading";
import { experience } from "@/content/experience";
import { formatYearMonth, toDateTime } from "@/lib/dates";
import { revealProps } from "@/lib/reveal";
import { sections } from "@/lib/site";

export function Experience() {
  const buildTime = new Date();

  return (
    <section
      id={sections.experience.id}
      aria-labelledby="experience-title"
      className="border-t border-line bg-bg-elevated py-24 md:py-36"
    >
      <div className="container-page">
        <SectionHeading
          index="04"
          eyebrow="Experience"
          id="experience-title"
          title="Over a decade of shipping — in teams and independently."
        />

        <TimelineProgress>
          <ol className="space-y-14 md:space-y-20">
            {experience.map((item) => {
              const isCurrent = item.period.end === "present";
              return (
                <li
                  key={`${item.company}-${item.period.start}`}
                  className="relative grid gap-4 pl-10 md:grid-cols-12 md:gap-10"
                  {...revealProps(0)}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute top-1.5 left-0 grid size-[15px] place-items-center rounded-full border ${
                      isCurrent ? "border-accent-text bg-accent" : "border-line-strong bg-bg-elevated"
                    }`}
                  />
                  <div className="md:col-span-4">
                    <p className="font-mono text-sm text-fg-muted">
                      <time dateTime={item.period.start}>{formatYearMonth(item.period.start)}</time>
                      {" — "}
                      <time dateTime={toDateTime(item.period.end, buildTime)}>
                        {item.period.end === "present" ? "Present" : formatYearMonth(item.period.end)}
                      </time>
                    </p>
                    <p className="mt-2 text-sm text-fg-muted">
                      {item.company} · {item.location}
                    </p>
                    {isCurrent ? (
                      <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 font-mono text-xs text-accent-text">
                        Current
                      </p>
                    ) : null}
                  </div>
                  <div className="md:col-span-8">
                    <h3 className="font-display text-2xl font-semibold tracking-[-0.02em] md:text-3xl">
                      {item.role}
                      <span className="text-fg-muted"> · {item.company}</span>
                    </h3>
                    <ul className="mt-5 space-y-3 leading-relaxed text-fg-muted">
                      {item.highlights.map((highlight) => (
                        <li key={highlight} className="flex gap-3">
                          <span aria-hidden="true" className="mt-[0.7em] h-px w-3 shrink-0 bg-line-strong" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ol>
        </TimelineProgress>
      </div>
    </section>
  );
}
