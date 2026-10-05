import type { Project } from "./types";

/** Source: CV "Portfolio". Links only where the CV lists one. */
export const projects = [
  {
    id: "landing-creator",
    title: "LandingCreator.ai",
    category: "SaaS / TypeScript Monorepo / Web3",
    description:
      "SaaS platform for publishing token landing pages on custom domains with live on-chain market data (SSE price/candle/trade feeds), in-page swaps (PancakeSwap V2 on EVM, Raydium CPMM on Solana), and cross-chain payments via Heleket with automated treasury distribution. A TypeScript monorepo: Next.js frontend, NestJS/Fastify API, and eight independently scalable background workers sharing a framework-free domain layer, with server-side-only transaction signing and idempotent event handling throughout.",
    tags: ["TypeScript", "Next.js", "NestJS", "Fastify", "SSE", "PancakeSwap V2", "Raydium CPMM", "Solana", "EVM"],
    links: [
      { kind: "github", href: "https://github.com/mevdad/landing-creator", label: "Source on GitHub" },
    ],
  },
  {
    id: "market-making-bot",
    title: "Automated Market-Making Bot for EVM Networks",
    category: "Blockchain / Web3",
    description:
      "A complete software solution for automated token buying/selling and trading volume support. Wallet creation, fund distribution, and custom trading rules. Compatible with all EVM networks (Ethereum, BNB, Polygon, Arbitrum); processes streaming market data in real time.",
    tags: ["EVM", "Ethereum", "BNB", "Polygon", "Arbitrum", "Real-time data"],
    links: [],
  },
  {
    id: "referral-contract",
    title: "Referral EVM Smart Contract",
    category: "Blockchain / Solidity",
    description:
      "A fully functional token contract for any EVM network with nickname-based referral registration. Percentage accruals on every buy/sell by referrals across 7 levels with a claim mechanism. Two access tiers: Premium (7 levels) and Standard (3 levels). Fully tested.",
    tags: ["Solidity", "EVM", "ERC-20", "Referral system", "Tested"],
    links: [],
  },
  {
    id: "friends-of-fashion",
    title: "Friends of Fashion — Highload Web Application",
    category: "Web Development / Angular + Laravel",
    description:
      "Worked on a project built on the Angular + Laravel stack. Prepared the system for high load via horizontal scaling and Redis caching. Full cycle: architecture, backend API, frontend integration, and deployment.",
    tags: ["Angular", "Laravel", "Redis", "Horizontal scaling"],
    links: [{ kind: "website", href: "https://friendsoffashion.com.ua", label: "friendsoffashion.com.ua" }],
  },
  {
    id: "giveaway-bot",
    title: "Giveaway Bot — @wizard_giveaway_bot",
    category: "Telegram Bot / Python",
    description:
      "A full-featured Telegram giveaway bot in Python (aiogram) with PostgreSQL storage, deployed as a systemd service. Configurable giveaway creation, two participation modes (button-click with anti-bot captcha, or keyword in comments), animated live winner draw, end-of-contest notifications, and public result verification.",
    tags: ["Python", "aiogram", "PostgreSQL", "systemd", "Telegram"],
    links: [
      { kind: "github", href: "https://github.com/mevdad/giveaway_bot", label: "Source on GitHub" },
      { kind: "telegram", href: "https://t.me/wizard_giveaway_bot", label: "Open in Telegram" },
    ],
  },
] as const satisfies readonly Project[];
