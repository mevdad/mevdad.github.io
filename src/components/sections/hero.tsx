import { Magnetic } from "@/components/motion/magnetic";
import { ButtonLink } from "@/components/ui/button-link";
import { profile } from "@/content/profile";
import { services } from "@/content/services";
import { sections } from "@/lib/site";

/**
 * Server Component. The entrance stagger is CSS (`.hero-line`, `.hero-fade`,
 * indexed by `--i`), so it runs on first paint without waiting for JS — the
 * headline is the LCP element and must not depend on hydration.
 * The only client code here is the two Magnetic wrappers around the CTAs.
 */
export function Hero() {
  const [firstName, ...rest] = profile.name.split(" ");
  const lastName = rest.join(" ");

  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden">
      <GradientMesh />

      <div className="container-page relative flex min-h-[calc(100svh-4rem)] flex-col justify-center pt-16 pb-20 md:pt-20">
        <p
          className="hero-fade mb-8 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs tracking-[0.18em] text-fg-muted uppercase"
          style={{ "--i": 0 }}
        >
          <span className="inline-flex items-center gap-2 text-fg">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-accent-text" />
            {profile.headline}
          </span>
          <span aria-hidden="true">/</span>
          <span>
            {profile.location} · {profile.workMode}
          </span>
        </p>

        <h1
          id="hero-title"
          className="font-display text-[clamp(3.4rem,13vw,11.5rem)] leading-[0.88] font-bold tracking-[-0.055em]"
        >
          <span className="hero-line">
            <span style={{ "--i": 0 }}>{firstName}</span>
          </span>
          <span className="hero-line">
            <span style={{ "--i": 1 }} className="text-accent-text">
              {lastName}
              <span className="text-fg">.</span>
            </span>
          </span>
        </h1>

        <div className="mt-10 grid gap-10 md:mt-14 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <p
              className="hero-fade font-display text-xl leading-snug font-medium tracking-tight text-balance sm:text-2xl"
              style={{ "--i": 1 }}
            >
              Full-stack engineering for{" "}
              {profile.focus.map((item, index) => (
                <span key={item}>
                  <span className="text-accent-text">{item}</span>
                  {index < profile.focus.length - 1 ? " and " : ""}
                </span>
              ))}{" "}
              — from database to deploy.
            </p>
            <p
              className="hero-fade mt-5 max-w-xl leading-relaxed text-fg-muted"
              style={{ "--i": 2 }}
            >
              {profile.summary}
            </p>
            <div className="hero-fade mt-9 flex flex-wrap gap-3" style={{ "--i": 3 }}>
              <Magnetic>
                <ButtonLink href={`/#${sections.projects.id}`}>See selected work</ButtonLink>
              </Magnetic>
              <Magnetic>
                <ButtonLink href={`/#${sections.contact.id}`} variant="ghost" icon="arrow-up-right">
                  Get in touch
                </ButtonLink>
              </Magnetic>
            </div>
          </div>

          <nav aria-label="Services" className="hero-fade md:col-span-4 md:col-start-9" style={{ "--i": 4 }}>
            <p className="mb-3 font-mono text-xs tracking-[0.18em] text-fg-muted uppercase">What I do</p>
            <ol className="divide-y divide-line border-y border-line">
              {services.map((service, index) => (
                <li key={service.id}>
                  <a
                    href={`/#service-${service.id}`}
                    className="group flex items-baseline gap-4 py-3 text-sm hover:text-accent-text"
                  >
                    <span className="font-mono text-xs text-fg-muted">{String(index + 1).padStart(2, "0")}</span>
                    <span className="transition-transform duration-500 ease-out-expo group-hover:translate-x-1">
                      {service.title}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>
    </section>
  );
}

/** Decorative animated background (CSS keyframes on transform only). */
function GradientMesh() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <div className="mesh-blob mesh-blob--b top-[-20%] left-[-15%] size-[70vmax]" />
      <div className="mesh-blob mesh-blob--a top-[-10%] right-[-20%] size-[60vmax]" />
      <div className="mesh-blob mesh-blob--c bottom-[-35%] left-[25%] size-[55vmax]" />
      <div className="grid-overlay absolute inset-0" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-bg" />
    </div>
  );
}
