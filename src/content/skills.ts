import type { SkillGroup } from "./types";

/** Source: CV "Technical Skills". */
export const skillGroups = [
  {
    id: "languages",
    title: "Languages",
    items: ["Node.js / TypeScript", "Python", "JavaScript", "PHP", "Solidity"],
  },
  {
    id: "backend",
    title: "Backend",
    items: ["Nest.js", "REST API", "GraphQL", "WebSockets", "BullMQ", "RabbitMQ", "Symfony", "Laravel", "Yii"],
  },
  {
    id: "frontend",
    title: "Frontend",
    items: [
      "Next.js",
      "Svelte",
      "React",
      "Vue.js",
      "Angular",
      "TypeScript",
      "Vanilla JavaScript",
      "Tailwind CSS",
      "HTML5",
      "CSS3",
    ],
  },
  {
    id: "databases",
    title: "Databases",
    items: ["PostgreSQL", "MySQL", "Redis", "SQL"],
  },
  {
    id: "web3",
    title: "Web3 / Blockchain",
    items: [
      "Solidity",
      "EVM",
      "JSON-RPC",
      "Web3.js",
      "Smart Contracts",
      "AMM",
      "Crypto Trading Bots (CEX/DEX)",
      "Binance, Bybit, OKX",
      "Uniswap, PancakeSwap",
      "MetaMask / WalletConnect",
    ],
  },
  {
    id: "crm",
    title: "CRM / E-commerce",
    items: [
      "KeyCRM (API, webhooks, automation)",
      "WordPress / WooCommerce",
      "1C-Bitrix",
      "OpenCart",
      "PrestaShop",
      "Prom",
      "Rozetka",
    ],
  },
  {
    id: "infrastructure",
    title: "Infrastructure",
    items: ["Docker", "Docker Compose", "Git / GitHub", "CI/CD", "Unix/Linux"],
  },
  {
    id: "ai",
    title: "AI / Automation",
    items: [
      "Claude API",
      "ChatGPT",
      "OpenAI",
      "AI Agents",
      "Telegram Bots",
      "Distributed Web Scraping",
      "Webhooks",
      "Data Migration & Sync",
    ],
  },
] as const satisfies readonly SkillGroup[];

/** Headline technologies for the marquee — a curated subset of the groups above. */
export const marqueeSkills = [
  "TypeScript",
  "Node.js",
  "Nest.js",
  "Next.js",
  "React",
  "Svelte",
  "Vue.js",
  "Angular",
  "Python",
  "PHP",
  "Laravel",
  "Solidity",
  "PostgreSQL",
  "Redis",
  "RabbitMQ",
  "BullMQ",
  "GraphQL",
  "WebSockets",
  "Docker",
  "KeyCRM",
  "Claude API",
] as const satisfies readonly string[];
