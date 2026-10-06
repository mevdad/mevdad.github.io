import { fullYearsBetween } from "@/lib/dates";
import type { Contact, Language, Principle, Profile, Stat } from "./types";

/** Source: Artem_Kalinichenko_FullStack_CV_2.docx (header + "About me"). */
export const profile = {
  name: "Artem Kalinichenko",
  headline: "Senior Software Engineer",
  focus: ["Backend", "Frontend", "Web3", "AI Automation"],
  location: "Kyiv, Ukraine",
  workMode: "Remote",
  summary:
    "I build web systems, automation solutions, and Web3/FinTech applications — owning the full engineering process from database design and back-end systems to front-end applications and server installations.",
  about: [
    "As a Senior Software Engineer, I am responsible for building and creating web systems, automation solutions, and Web3/FinTech applications. I take on the full engineering process from database design and back-end systems to front-end applications and server installations, while making sure that the platform works well.",
    "I am specifically interested in tooling that delivers the highest level of performance — such as an overall Google PageSpeed score above 95 or backend latency under 10ms.",
    "My knowledge covers back-end development (Node.js / Nest.js, Python, PHP) and front-end development (Next.js, Svelte, React, Vue.js, Angular); REST, GraphQL and WebSocket APIs; event-driven systems on BullMQ and RabbitMQ; and databases (PostgreSQL, MySQL, Redis).",
    "I work on Solidity smart contracts, algorithmic trading systems for CEX/DEX (Binance, Bybit, OKX, Uniswap, PancakeSwap), automation with CRM integrations (KeyCRM, marketplaces, payment systems), Telegram bots, distributed scrapers, and AI-based products (Claude AI, OpenAI).",
  ],
  careerStart: "2010-10",
} as const satisfies Profile;

/**
 * Headline numbers (CV "About me" + work history start date).
 *
 * `now` is a parameter, not `new Date()` inside: the page is rendered once at
 * build time, and making time an explicit input keeps the value deterministic
 * (and keeps it out of client components, where it would differ from the
 * server HTML and cause a hydration mismatch).
 */
export function getStats(now: Date): readonly Stat[] {
  return [
    {
      kind: "number",
      value: fullYearsBetween(profile.careerStart, now),
      suffix: "+",
      label: "years in production",
      note: "Shipping web software since October 2010",
    },
    {
      kind: "number",
      value: 95,
      suffix: "+",
      label: "Google PageSpeed",
      note: "Performance target for the sites I build",
    },
    {
      kind: "number",
      value: 10,
      prefix: "<",
      suffix: "ms",
      label: "backend latency",
      note: "What I aim for on hot API paths",
    },
  ];
}

/** Source: CV "Working Principles". */
export const principles = [
  {
    title: "Senior-Level Ownership",
    body: "I dive straight into the business domain, select the most pragmatic tech stack without overengineering, and operate entirely without micromanagement.",
  },
  {
    title: "Long-Term Accountability",
    body: "I stand behind the software I build — troubleshooting bugs, refactoring legacy components, and scaling architecture as your business evolves over its entire lifecycle.",
  },
] as const satisfies readonly Principle[];

/** Source: CV "Languages". */
export const languages = [
  { name: "Ukrainian", level: "Native" },
  { name: "English", level: "Intermediate", note: "strong written" },
] as const satisfies readonly Language[];

/**
 * Source: CV "Contacts". GitHub profile URL is derived from the repository
 * links listed in the CV portfolio (github.com/mevdad/...).
 */
export const contacts = [
  { kind: "email", label: "Email", value: "artem21kalinichenko@gmail.com" },
  { kind: "phone", label: "Phone", value: "+380 68-482-66-29", e164: "+380684826629" },
  {
    kind: "freelancehunt",
    label: "Freelancehunt",
    value: "artemkalinichenko",
    href: "https://freelancehunt.com/freelancer/artemkalinichenko.html",
  },
  { kind: "github", label: "GitHub", value: "mevdad", href: "https://github.com/mevdad" },
] as const satisfies readonly Contact[];
