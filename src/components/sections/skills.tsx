import { Marquee } from "@/components/ui/marquee";
import { SectionHeading } from "@/components/ui/section-heading";
import { TagList } from "@/components/ui/tag";
import { marqueeSkills, skillGroups } from "@/content/skills";
import { revealProps } from "@/lib/reveal";
import { sections } from "@/lib/site";

export function Skills() {
  const half = Math.ceil(marqueeSkills.length / 2);

  return (
    <section id={sections.skills.id} aria-labelledby="skills-title" className="overflow-x-clip border-t border-line py-24 md:py-36">
      <div className="container-page">
        <SectionHeading
          index="03"
          eyebrow="Skills"
          id="skills-title"
          title={
            <>
              A stack chosen for <span className="text-accent-text">the problem</span>, not the hype.
            </>
          }
          intro="Backend, frontend, data, chain and automation — the tools I reach for, grouped the way projects use them."
        />
      </div>

      <div className="my-14 -rotate-1 border-y border-line bg-bg-elevated py-4 md:my-20">
        <Marquee items={marqueeSkills.slice(0, half)} label="Core technologies, part 1" duration={50} />
        <Marquee
          items={marqueeSkills.slice(half)}
          label="Core technologies, part 2"
          direction="reverse"
          duration={55}
        />
      </div>

      <div className="container-page">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {skillGroups.map((group, index) => (
            <li
              key={group.id}
              className="flex flex-col gap-5 rounded-3xl border border-line bg-surface p-6"
              {...revealProps(index % 4)}
            >
              <h3 className="flex items-baseline justify-between font-display text-lg font-semibold tracking-tight">
                {group.title}
                <span className="font-mono text-xs font-normal text-fg-muted">{group.items.length}</span>
              </h3>
              <TagList items={group.items} label={group.title} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
