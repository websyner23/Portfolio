/**
 * Migrated from frontend/src/data/portfolio.ts.
 *
 * Two deliberate conversions:
 *  · `gradient` Tailwind class strings → `colors {from,to}` hex pairs.
 *    Class strings stored in the DB would be stripped by Tailwind's build-time
 *    content scan; hex values render as inline styles instead.
 *  · flat `category` strings → PortfolioCategory documents (see categories below).
 */

export const portfolioCategories = [
  { name: "Web Design", slug: "web-design", order: 1 },
  { name: "Branding", slug: "branding", order: 2 },
  { name: "SEO", slug: "seo", order: 3 },
  { name: "Software", slug: "software", order: 4 },
  { name: "SaaS", slug: "saas", order: 5 },
];

const BRAND = "#0fcda1";
const NAVY = "#1e2d40";

export const portfolioItems = [
  {
    slug: "northwind-logistics",
    title: "A logistics site that books meetings",
    client: "Northwind Logistics",
    categorySlug: "web-design",
    summary:
      "Replaced a slow WordPress site with a Next.js front-end and a CMS the marketing team owns. Pipeline grew 40% in the first quarter post-launch.",
    metrics: [
      { label: "Pipeline lift", value: "+40%" },
      { label: "Lighthouse", value: "98" },
      { label: "Time on page", value: "+62%" },
    ],
    tags: ["Next.js", "Sanity", "Webflow → Next"],
    techStack: ["Next.js", "Sanity", "Vercel"],
    year: 2025,
    colors: { from: BRAND, to: NAVY },
    featured: true,
    order: 1,
  },
  {
    slug: "atlas-health-brand",
    title: "A health brand that feels like a friend",
    client: "Atlas Health",
    categorySlug: "branding",
    summary:
      "Full identity system, voice guidelines, and launch site for a primary-care startup serving rural communities.",
    metrics: [
      { label: "Brand recall", value: "+3.1×" },
      { label: "Sign-ups w1", value: "1,820" },
      { label: "NPS", value: "72" },
    ],
    tags: ["Brand system", "Naming", "Launch site"],
    techStack: ["Figma", "Next.js"],
    year: 2025,
    colors: { from: BRAND, to: NAVY },
    featured: true,
    order: 2,
  },
  {
    slug: "lumen-studio-design-system",
    title: "A design system that paid for itself",
    client: "Lumen Studio",
    categorySlug: "web-design",
    summary:
      "Migrated a multi-brand portfolio onto a single component library. Page-build time went from days to hours.",
    metrics: [
      { label: "Build time", value: "-78%" },
      { label: "Components", value: "84" },
      { label: "Sites unified", value: "6" },
    ],
    tags: ["Design system", "Tailwind", "Storybook"],
    techStack: ["Tailwind CSS", "Storybook", "React"],
    year: 2024,
    colors: { from: NAVY, to: BRAND },
    order: 3,
  },
  {
    slug: "cobalt-outdoors-seo",
    title: "Outranking REI in nine months",
    client: "Cobalt Outdoors",
    categorySlug: "seo",
    summary:
      "Built a topical authority program around camping and overlanding. Organic now drives 38% of revenue.",
    metrics: [
      { label: "Organic revenue", value: "+312%" },
      { label: "Top-3 keywords", value: "184" },
      { label: "Backlinks", value: "+1.4k" },
    ],
    tags: ["Technical SEO", "Content", "Digital PR"],
    techStack: ["Ahrefs", "Screaming Frog", "GA4"],
    year: 2024,
    colors: { from: NAVY, to: BRAND },
    order: 4,
  },
  {
    slug: "beacon-ops-tool",
    title: "An ops tool that replaced four spreadsheets",
    client: "Beacon Realty",
    categorySlug: "software",
    summary:
      "Custom internal app for property operations. Saves the field team 15 hours per person per week.",
    metrics: [
      { label: "Hours saved", value: "15/wk" },
      { label: "Team size", value: "42" },
      { label: "Built in", value: "8 wks" },
    ],
    tags: ["Internal tool", "Postgres", "Roles & audit"],
    techStack: ["React", "Node.js", "PostgreSQL"],
    year: 2025,
    colors: { from: NAVY, to: BRAND },
    order: 5,
  },
  {
    slug: "foreground-ai-saas",
    title: "Zero to paid users in 14 weeks",
    client: "Foreground.ai",
    categorySlug: "saas",
    summary:
      "End-to-end product partnership for an AI annotation tool. Full brand, app, billing, marketing site.",
    metrics: [
      { label: "Time to paid", value: "14 wks" },
      { label: "Paying teams", value: "38" },
      { label: "ARR (90d)", value: "$420k" },
    ],
    tags: ["Product", "Stripe", "Multi-tenant"],
    techStack: ["Next.js", "Stripe", "PostgreSQL"],
    year: 2026,
    colors: { from: BRAND, to: NAVY },
    featured: true,
    order: 6,
  },
  {
    slug: "verdant-tea-ecom",
    title: "A tea shop that ships globally",
    client: "Verdant Tea",
    categorySlug: "web-design",
    summary:
      "Headless Shopify build with a custom subscription flow. AOV up 22% after launch.",
    metrics: [
      { label: "AOV", value: "+22%" },
      { label: "Conversion", value: "+18%" },
      { label: "Subscribers", value: "2,400" },
    ],
    tags: ["Shopify", "Hydrogen", "Subscriptions"],
    techStack: ["Shopify Hydrogen", "Remix"],
    year: 2025,
    colors: { from: BRAND, to: NAVY },
    order: 7,
  },
  {
    slug: "harbor-fintech-saas",
    title: "Compliance software people don't hate",
    client: "Harbor",
    categorySlug: "saas",
    summary:
      "Redesigned a complex compliance dashboard used by mid-market banks. Activation up 2.4×.",
    metrics: [
      { label: "Activation", value: "2.4×" },
      { label: "Tickets", value: "-58%" },
      { label: "NPS", value: "+34" },
    ],
    tags: ["Product redesign", "Dashboard", "Enterprise"],
    techStack: ["React", "TypeScript", "D3"],
    year: 2025,
    colors: { from: NAVY, to: BRAND },
    order: 8,
  },
  {
    slug: "ember-restaurant-brand",
    title: "A restaurant brand worth Instagramming",
    client: "Ember & Oak",
    categorySlug: "branding",
    summary:
      "Identity, menu system, and ordering site for a fine-dining group. Reservations up 65%.",
    metrics: [
      { label: "Reservations", value: "+65%" },
      { label: "IG followers", value: "+28k" },
      { label: "Locations", value: "3" },
    ],
    tags: ["Hospitality", "Identity", "Print"],
    techStack: ["Figma", "Webflow"],
    year: 2024,
    colors: { from: BRAND, to: NAVY },
    order: 9,
  },
];
