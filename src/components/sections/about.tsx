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
          wide
          title={
            <>
              One engineer for the <span className="text-accent-text">whole stack</span> — and for what happens after
              launch.
            </>
          }
        />

        {/*
          Source order is the mobile order: portrait → text → stats.
          From md up the portrait is placed into the right column of row 1 via
          explicit grid placement. It isn't focusable, so the visual/DOM order
          difference doesn't affect keyboard or screen-reader flow.
        */}
        <div className="grid gap-12 md:grid-cols-12 md:gap-14">
          <Portrait className="md:col-span-5 md:col-start-8 md:row-start-1" />

          <div className="space-y-6 text-lg leading-relaxed md:col-span-7 md:row-start-1">
            <p className="text-xl text-fg md:text-2xl md:leading-snug" {...revealProps(0)}>
              {lead}
            </p>
            {paragraphs.map((paragraph, index) => (
              <p key={paragraph.slice(0, 24)} className="text-fg-muted" {...revealProps(index + 1)}>
                {paragraph}
              </p>
            ))}
          </div>

          {/* Three across only from lg: below that "<10ms" at display size doesn't fit a third of the row. */}
          <dl className="grid content-start gap-4 md:col-span-12 lg:grid-cols-3">
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

/**
 * Server-rendered framed portrait. The photo is a transparent cutout, so the
 * frame supplies the backdrop: theme-aware glow (`.portrait-glow`, built from
 * the mesh tokens) plus the hero's grid texture. The box has a fixed 3:4
 * aspect ratio, so the space is reserved before the image arrives (no CLS).
 */
function Portrait({ className = "" }: { className?: string }) {
  const { variants, width, height, alt } = profile.portrait;
  const [fallback] = variants;
  const srcSet = variants.map((variant) => `${variant.src} ${variant.width}w`).join(", ");

  return (
    <figure className={`relative mx-auto w-full max-w-sm self-start md:max-w-none ${className}`} {...revealProps(0)}>
      <div className="relative isolate aspect-[3/4] overflow-hidden rounded-3xl border border-line bg-surface">
        <div aria-hidden="true" className="portrait-glow absolute inset-0 -z-10" />
        <div aria-hidden="true" className="grid-overlay absolute inset-0 -z-10" />
        {/*
          Plain <img>, not next/image: with static export images are
          `unoptimized`, and next/image then drops `srcset` — we'd ship the
          768px file to every phone. Here the browser picks 480w/768w itself.
        */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fallback.src}
          srcSet={srcSet}
          // Column width: ~440px at the 76rem container, ~36vw from md, capped at max-w-sm (24rem) below.
          sizes="(min-width: 76rem) 440px, (min-width: 48rem) 36vw, 24rem"
          width={width}
          height={height}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover object-bottom"
        />
      </div>
      <figcaption className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full border border-line bg-bg-elevated/85 px-3 py-1.5 font-mono text-[0.6875rem] tracking-[0.18em] text-fg uppercase">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-accent-text" />
        {profile.location} · {profile.workMode}
      </figcaption>
    </figure>
  );
}
