export type PortfolioCategory = "All" | "Web Design" | "Branding" | "SEO" | "Software" | "SaaS";

export type PortfolioItem = {
  slug: string;
  title: string;
  client: string;
  category: Exclude<PortfolioCategory, "All">;
  summary: string;
  metrics: { label: string; value: string }[];
  tags: string[];
  year: number;
  gradient: string;
};

export const portfolio: PortfolioItem[] = [
  {
    slug: "northwind-logistics",
    title: "A logistics site that books meetings",
    client: "Northwind Logistics",
    category: "Web Design",
    summary:
      "Replaced a slow WordPress site with a Next.js front-end and a CMS the marketing team owns. Pipeline grew 40% in the first quarter post-launch.",
    metrics: [
      { label: "Pipeline lift", value: "+40%" },
      { label: "Lighthouse", value: "98" },
      { label: "Time on page", value: "+62%" },
    ],
    tags: ["Next.js", "Sanity", "Webflow → Next"],
    year: 2025,
    gradient: "from-indigo-500/30 via-fuchsia-500/20 to-cyan-400/30",
  },
  {
    slug: "atlas-health-brand",
    title: "A health brand that feels like a friend",
    client: "Atlas Health",
    category: "Branding",
    summary:
      "Full identity system, voice guidelines, and launch site for a primary-care startup serving rural communities.",
    metrics: [
      { label: "Brand recall", value: "+3.1×" },
      { label: "Sign-ups w1", value: "1,820" },
      { label: "NPS", value: "72" },
    ],
    tags: ["Brand system", "Naming", "Launch site"],
    year: 2025,
    gradient: "from-emerald-400/30 via-teal-400/20 to-sky-400/30",
  },
  {
    slug: "lumen-studio-design-system",
    title: "A design system that paid for itself",
    client: "Lumen Studio",
    category: "Web Design",
    summary:
      "Migrated a multi-brand portfolio onto a single component library. Page-build time went from days to hours.",
    metrics: [
      { label: "Build time", value: "-78%" },
      { label: "Components", value: "84" },
      { label: "Sites unified", value: "6" },
    ],
    tags: ["Design system", "Tailwind", "Storybook"],
    year: 2024,
    gradient: "from-rose-400/30 via-orange-300/20 to-yellow-400/30",
  },
  {
    slug: "cobalt-outdoors-seo",
    title: "Outranking REI in nine months",
    client: "Cobalt Outdoors",
    category: "SEO",
    summary:
      "Built a topical authority program around camping and overlanding. Organic now drives 38% of revenue.",
    metrics: [
      { label: "Organic revenue", value: "+312%" },
      { label: "Top-3 keywords", value: "184" },
      { label: "Backlinks", value: "+1.4k" },
    ],
    tags: ["Technical SEO", "Content", "Digital PR"],
    year: 2024,
    gradient: "from-amber-400/30 via-lime-300/20 to-emerald-400/30",
  },
  {
    slug: "beacon-ops-tool",
    title: "An ops tool that replaced four spreadsheets",
    client: "Beacon Realty",
    category: "Software",
    summary:
      "Custom internal app for property operations. Saves the field team 15 hours per person per week.",
    metrics: [
      { label: "Hours saved", value: "15/wk" },
      { label: "Team size", value: "42" },
      { label: "Built in", value: "8 wks" },
    ],
    tags: ["Internal tool", "Postgres", "Roles & audit"],
    year: 2025,
    gradient: "from-blue-500/30 via-indigo-500/20 to-violet-500/30",
  },
  {
    slug: "foreground-ai-saas",
    title: "Zero to paid users in 14 weeks",
    client: "Foreground.ai",
    category: "SaaS",
    summary:
      "End-to-end product partnership for an AI annotation tool. Full brand, app, billing, marketing site.",
    metrics: [
      { label: "Time to paid", value: "14 wks" },
      { label: "Paying teams", value: "38" },
      { label: "ARR (90d)", value: "$420k" },
    ],
    tags: ["Product", "Stripe", "Multi-tenant"],
    year: 2026,
    gradient: "from-fuchsia-500/30 via-purple-500/20 to-indigo-500/30",
  },
  {
    slug: "verdant-tea-ecom",
    title: "A tea shop that ships globally",
    client: "Verdant Tea",
    category: "Web Design",
    summary:
      "Headless Shopify build with a custom subscription flow. AOV up 22% after launch.",
    metrics: [
      { label: "AOV", value: "+22%" },
      { label: "Conversion", value: "+18%" },
      { label: "Subscribers", value: "2,400" },
    ],
    tags: ["Shopify", "Hydrogen", "Subscriptions"],
    year: 2025,
    gradient: "from-green-400/30 via-emerald-300/20 to-teal-400/30",
  },
  {
    slug: "harbor-fintech-saas",
    title: "Compliance software people don't hate",
    client: "Harbor",
    category: "SaaS",
    summary:
      "Redesigned a complex compliance dashboard used by mid-market banks. Activation up 2.4×.",
    metrics: [
      { label: "Activation", value: "2.4×" },
      { label: "Tickets", value: "-58%" },
      { label: "NPS", value: "+34" },
    ],
    tags: ["Product redesign", "Dashboard", "Enterprise"],
    year: 2025,
    gradient: "from-cyan-400/30 via-sky-400/20 to-blue-500/30",
  },
  {
    slug: "ember-restaurant-brand",
    title: "A restaurant brand worth Instagramming",
    client: "Ember & Oak",
    category: "Branding",
    summary:
      "Identity, menu system, and ordering site for a fine-dining group. Reservations up 65%.",
    metrics: [
      { label: "Reservations", value: "+65%" },
      { label: "IG followers", value: "+28k" },
      { label: "Locations", value: "3" },
    ],
    tags: ["Hospitality", "Identity", "Print"],
    year: 2024,
    gradient: "from-orange-500/30 via-red-400/20 to-rose-500/30",
  },
];

export const portfolioCategories: PortfolioCategory[] = [
  "All",
  "Web Design",
  "Branding",
  "SEO",
  "Software",
  "SaaS",
];

export const getPortfolioBySlug = (slug: string) => portfolio.find((p) => p.slug === slug);
