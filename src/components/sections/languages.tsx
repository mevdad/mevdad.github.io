import { languages } from "@/content/profile";
import { revealProps } from "@/lib/reveal";
import { sections } from "@/lib/site";

export function Languages() {
  return (
    <section id={sections.languages.id} aria-labelledby="languages-title" className="border-t border-line py-20 md:py-28">
      <div className="container-page grid gap-10 md:grid-cols-12 md:items-center">
        <div className="md:col-span-4" {...revealProps(0)}>
          <p className="mb-4 flex items-center gap-3 font-mono text-xs tracking-[0.2em] text-fg-muted uppercase">
            <span className="text-accent-text">07</span>
            <span aria-hidden="true" className="h-px w-8 bg-line-strong" />
            Languages
          </p>
          <h2 id="languages-title" className="font-display text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
            Spoken &amp; written.
          </h2>
        </div>
        <dl className="grid gap-4 sm:grid-cols-2 md:col-span-8">
          {languages.map((language, index) => (
            <div
              key={language.name}
              className="flex items-baseline justify-between gap-6 rounded-3xl border border-line p-6"
              {...revealProps(index)}
            >
              <dt className="font-display text-2xl font-semibold tracking-tight">{language.name}</dt>
              <dd className="text-right text-fg-muted">
                <span className="block text-fg">{language.level}</span>
                {"note" in language ? <span className="block text-sm">{language.note}</span> : null}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
