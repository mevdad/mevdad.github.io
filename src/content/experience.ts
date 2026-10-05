import type { ExperienceItem } from "./types";

/** Source: CV "Work Experience" (newest first). */
export const experience = [
  {
    role: "Software Engineer",
    company: "Freelance",
    location: "Remote",
    period: { start: "2023-05", end: "present" },
    highlights: [
      "Built full-stack applications end to end: backend in Node.js / Nest.js and PHP / Laravel, frontend in React, Next.js, Vue.js, Angular, and Svelte, with real-time data delivery over WebSockets.",
      "Designed parallel background services and task queues for real-time data ingestion, idempotent event processing, and high-load traffic across independently scalable workers.",
      "Developed Solidity smart contracts for EVM networks: ERC-20 token with a 7-level referral system, casino bank contract, and bonus payout contract.",
      "Built automated trading / market-making software for EVM networks: continuous on-chain data ingestion, order execution, and real-time volume support.",
      "Developed an AI sales agent for a travel business that automatically detects customer intent and recommends relevant tours and services.",
      "Delivered business automation and CRM integrations: end-to-end KeyCRM setup with custom websites, marketplaces (Prom, Rozetka), payment gateways, and shipping providers, including automated trigger flows, lead/order routing, and bi-directional inventory sync via API.",
      "Optimized page load times and throughput on legacy systems, including horizontal scaling and Redis caching.",
    ],
  },
  {
    role: "Backend Developer (PHP)",
    company: "Evogence",
    location: "Kyiv, Ukraine",
    period: { start: "2021-07", end: "2023-05" },
    highlights: [
      "Developed and maintained backend applications and APIs for terminal systems serving US-based clients.",
      "Worked in a team using a Git pull-request workflow with code review and branching strategy.",
    ],
  },
  {
    role: "Full-Stack Developer",
    company: "Freelance",
    location: "Remote",
    period: { start: "2016-07", end: "2021-07" },
    highlights: [
      "Built backend logic and APIs in PHP and Node.js with MySQL, implemented real-time features via WebSockets.",
      "Managed diverse client projects independently: from data modeling and API design to frontend integration.",
    ],
  },
  {
    role: "Web Developer",
    company: "Genius Marketing",
    location: "Kyiv, Ukraine",
    period: { start: "2015-10", end: "2016-07" },
    highlights: ["Built landing pages and blogs, integrated WordPress sites."],
  },
] as const satisfies readonly ExperienceItem[];
