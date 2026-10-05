import { Magnetic } from "@/components/motion/magnetic";
import { Icon, type IconName } from "@/components/ui/icons";
import { contacts } from "@/content/profile";
import type { Contact as ContactItem } from "@/content/types";
import { revealProps } from "@/lib/reveal";
import { sections } from "@/lib/site";

type ResolvedContact = {
  href: string;
  icon: IconName;
  external: boolean;
};

/**
 * Exhaustive switch over the Contact union: each kind knows how to become a
 * link. Add a new kind to `Contact` and this stops compiling until handled.
 */
function resolveContact(contact: ContactItem): ResolvedContact {
  switch (contact.kind) {
    case "email":
      return { href: `mailto:${contact.value}`, icon: "mail", external: false };
    case "phone":
      return { href: `tel:${contact.e164}`, icon: "phone", external: false };
    case "freelancehunt":
      return { href: contact.href, icon: "briefcase", external: true };
    case "github":
      return { href: contact.href, icon: "github", external: true };
    default: {
      const unhandled: never = contact;
      throw new Error(`Unhandled contact: ${JSON.stringify(unhandled)}`);
    }
  }
}

export function Contact() {
  const email = contacts.find((contact) => contact.kind === "email");

  return (
    <section
      id={sections.contact.id}
      aria-labelledby="contact-title"
      className="relative isolate overflow-hidden border-t border-line py-28 md:py-40"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="mesh-blob mesh-blob--a bottom-[-40%] left-[-10%] size-[60vmax]" />
        <div className="mesh-blob mesh-blob--b right-[-20%] bottom-[-30%] size-[55vmax]" />
      </div>

      <div className="container-page">
        <p
          className="mb-6 flex items-center gap-3 font-mono text-xs tracking-[0.2em] text-fg-muted uppercase"
          {...revealProps(0)}
        >
          <span className="text-accent-text">08</span>
          <span aria-hidden="true" className="h-px w-8 bg-line-strong" />
          Contact
        </p>
        <h2
          id="contact-title"
          className="max-w-5xl font-display text-[clamp(2.75rem,8vw,7rem)] leading-[0.92] font-bold tracking-[-0.045em] text-balance"
          {...revealProps(1)}
        >
          Have a system to build, automate or speed up? <span className="text-accent-text">Let&apos;s talk.</span>
        </h2>

        {email ? (
          <div className="mt-12" {...revealProps(2)}>
            <Magnetic strength={0.2}>
              <a
                href={`mailto:${email.value}`}
                className="group inline-flex max-w-full items-center gap-3 rounded-full bg-accent px-5 py-4 font-display text-base font-semibold [overflow-wrap:anywhere] text-accent-ink hover:bg-fg hover:text-bg sm:gap-4 sm:px-7 sm:text-2xl"
              >
                <Icon name="mail" className="size-6 shrink-0" />
                {email.value}
                <Icon
                  name="arrow-up-right"
                  className="size-5 shrink-0 transition-transform duration-500 ease-out-expo group-hover:translate-x-1 group-hover:-translate-y-1"
                />
              </a>
            </Magnetic>
          </div>
        ) : null}

        <ul className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2">
          {contacts.map((contact, index) => {
            const { href, icon, external } = resolveContact(contact);
            return (
              <li key={contact.kind} className="bg-bg" {...revealProps(index)}>
                <a
                  href={href}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="group flex h-full flex-col gap-6 p-6 hover:bg-bg-elevated"
                >
                  <span className="flex items-center justify-between text-fg-muted">
                    <Icon name={icon} className="size-5" />
                    <Icon
                      name="arrow-up-right"
                      className="size-4 transition-transform duration-500 ease-out-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </span>
                  <span>
                    <span className="block font-mono text-xs tracking-[0.18em] text-fg-muted uppercase">
                      {contact.label}
                    </span>
                    <span className="mt-1 block text-lg font-medium [overflow-wrap:anywhere] text-fg">{contact.value}</span>
                    {external ? <span className="sr-only"> (opens in a new tab)</span> : null}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
