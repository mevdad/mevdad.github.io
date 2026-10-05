import { SectionHeading } from "@/components/ui/section-heading";
import { services } from "@/content/services";
import { revealProps } from "@/lib/reveal";
import { sections } from "@/lib/site";

export function Services() {
  return (
    <section
      id={sections.services.id}
      aria-labelledby="services-title"
      className="border-t border-line bg-bg-elevated py-24 md:py-36"
    >
      <div className="container-page">
        <SectionHeading
          index="02"
          eyebrow="Services"
          id="services-title"
          title="Four directions, one standard of engineering."
          intro="From CRM automation and trading bots to high-load platforms and fast websites — scoped pragmatically, built to last."
        />

        <ol className="grid gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-2">
          {services.map((service, index) => (
            <li
              key={service.id}
              id={`service-${service.id}`}
              className="group relative flex flex-col bg-bg-elevated p-7 md:p-10"
              {...revealProps(index % 2)}
            >
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-accent-text transition-transform duration-700 ease-out-expo group-hover:scale-x-100"
              />
              <div className="mb-8 flex items-center justify-between">
                <span className="font-mono text-sm text-accent-text">{String(index + 1).padStart(2, "0")}</span>
                <span className="font-mono text-xs tracking-[0.18em] text-fg-muted uppercase">
                  {service.points.length} capabilities
                </span>
              </div>
              <h3 className="font-display text-2xl leading-tight font-semibold tracking-[-0.02em] md:text-3xl">
                {service.title}
              </h3>
              <p className="mt-4 text-fg-muted">{service.summary}</p>
              <ul className="mt-8 space-y-3 border-t border-line pt-6 text-sm leading-relaxed">
                {service.points.map((point) => (
                  <li key={point} className="flex gap-3">
                    <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-accent-text" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
