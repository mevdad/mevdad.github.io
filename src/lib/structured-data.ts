import { contacts, profile } from "@/content/profile";
import { skillGroups } from "@/content/skills";
import { siteConfig } from "./site";

type PersonJsonLd = {
  "@context": "https://schema.org";
  "@type": "Person";
  name: string;
  jobTitle: string;
  description: string;
  url: string;
  email: `mailto:${string}`;
  telephone: string;
  address: { "@type": "PostalAddress"; addressLocality: string; addressCountry: string };
  sameAs: string[];
  knowsAbout: string[];
  knowsLanguage: string[];
};

export function buildPersonJsonLd(): PersonJsonLd {
  const sameAs: string[] = [];
  let email = "";
  let telephone = "";
  // Exhaustive switch over the Contact union: adding a new contact kind
  // without handling it here is a compile error (see `never` below).
  for (const contact of contacts) {
    switch (contact.kind) {
      case "email":
        email = contact.value;
        break;
      case "phone":
        telephone = contact.e164;
        break;
      case "freelancehunt":
      case "github":
        sameAs.push(contact.href);
        break;
      default: {
        const unhandled: never = contact;
        throw new Error(`Unhandled contact: ${JSON.stringify(unhandled)}`);
      }
    }
  }

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.headline,
    description: profile.summary,
    url: siteConfig.url,
    email: `mailto:${email}`,
    telephone,
    address: { "@type": "PostalAddress", addressLocality: "Kyiv", addressCountry: "UA" },
    sameAs,
    knowsAbout: skillGroups.flatMap((group) => group.items).slice(0, 30),
    knowsLanguage: ["uk", "en"],
  };
}

/**
 * JSON.stringify does not escape `<`, so a value containing `</script>` could
 * break out of the tag. Escaping it keeps inline JSON-LD safe by construction.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
