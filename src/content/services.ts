import type { Service } from "./types";

/** Source: CV "Core Expertise & Services" (four directions). */
export const services = [
  {
    id: "automation",
    title: "Business Automation & CRM Integrations",
    summary:
      "KeyCRM wired into your websites, marketplaces, payments and shipping — with automation that removes manual work.",
    points: [
      "End-to-end KeyCRM integration with custom websites, marketplaces (Prom, Rozetka), payment gateways, and shipping providers.",
      "Automated trigger flows, lead/order routing, end-to-end analytics, and bi-directional inventory synchronization via API.",
      "Custom AI agents for first-line customer support and inbound lead qualification.",
      "Multifunctional Telegram bots: sales funnels, integrated payments, and self-service customer portals.",
    ],
  },
  {
    id: "web3",
    title: "Crypto Trading Bots & Web3 Engineering",
    summary:
      "Algorithmic trading on CEX and DEX, EVM smart contracts, and full-stack dApps with wallet integrations.",
    points: [
      "Algorithmic trading bots for CEXs (Binance, Bybit, OKX) and DEXs (Uniswap, PancakeSwap) via REST, WebSockets, or direct on-chain interactions (Grid, DCA, arbitrage, scalping).",
      "Solidity EVM smart contract development, testing, and deployment (tokenomics, staking, multi-tier referral programs, AMM liquidity pools).",
      "Full-stack dApps with Web3 wallet integrations (MetaMask, WalletConnect).",
    ],
  },
  {
    id: "high-load",
    title: "High-Load Web Services, SaaS & Enterprise Platforms",
    summary:
      "Production-grade SPAs, PWAs, portals and SaaS — with queues, real-time streams and tuned databases underneath.",
    points: [
      "Production-grade SPAs/PWAs, client portals, and SaaS solutions powered by Nest.js, Laravel, Svelte, Vue, or React.",
      "Queue architectures (RabbitMQ, BullMQ) for compute-heavy background jobs and real-time data streaming via WebSockets.",
      "Database optimization: schema normalization, complex SQL tuning, PostgreSQL indexing, and multi-layer Redis caching.",
    ],
  },
  {
    id: "websites",
    title: "Turnkey Websites, Blogs & E-Commerce",
    summary:
      "High-converting landing pages, blogs and stores engineered for technical SEO and 95+ performance scores.",
    points: [
      "High-converting landing pages, content blogs, and digital media platforms engineered for top-tier technical SEO.",
      "Turnkey e-commerce development and customization on PrestaShop, OpenCart, and WooCommerce (custom payment gateways, shipping methods, and inventory sync).",
      "Speed optimization and Core Web Vitals remediation targeting 95+ benchmark scores.",
    ],
  },
] as const satisfies readonly Service[];
