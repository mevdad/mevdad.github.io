import type { ReactNode } from "react";
import { revealProps } from "@/lib/reveal";

type SectionHeadingProps = {
  /** Two-digit index shown as the editorial "chapter" marker. */
  index: string;
  eyebrow: string;
  /** Becomes the section's accessible name via aria-labelledby. */
  id: string;
  title: ReactNode;
  intro?: ReactNode;
};

export function SectionHeading({ index, eyebrow, id, title, intro }: SectionHeadingProps) {
  return (
    <header className="mb-12 grid gap-6 md:mb-16 md:grid-cols-12 md:items-end">
      <div className="md:col-span-7" {...revealProps(0)}>
        <p className="mb-5 flex items-center gap-3 font-mono text-xs tracking-[0.2em] text-fg-muted uppercase">
          <span className="text-accent-text">{index}</span>
          <span aria-hidden="true" className="h-px w-8 bg-line-strong" />
          {eyebrow}
        </p>
        <h2
          id={id}
          className="font-display text-4xl leading-[1.02] font-semibold tracking-[-0.03em] text-balance sm:text-5xl md:text-6xl"
        >
          {title}
        </h2>
      </div>
      {intro ? (
        <p className="max-w-prose text-base leading-relaxed text-fg-muted md:col-span-5 md:text-lg" {...revealProps(1)}>
          {intro}
        </p>
      ) : null}
    </header>
  );
}
