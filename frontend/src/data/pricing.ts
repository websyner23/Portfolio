export type PricingPlan = {
  id: string;
  name: string;
  price: string;
  period?: string;
  blurb: string;
  features: string[];
  cta: { label: string; href: string };
  popular?: boolean;
};

export const pricingPlans: PricingPlan[] = [
  {
    id: "launch",
    name: "Launch",
    price: "$6,800",
    period: "fixed scope",
    blurb: "A modern marketing site, shipped in weeks, not quarters.",
    features: [
      "Up to 6 designed pages",
      "Custom Next.js front-end",
      "CMS your team can edit",
      "SEO foundations and analytics",
      "Performance budget (90+ Lighthouse)",
      "30 days post-launch support",
    ],
    cta: { label: "Start a Launch project", href: "/contact?plan=launch" },
  },
  {
    id: "growth",
    name: "Growth",
    price: "$14,800",
    period: "fixed scope",
    blurb: "A complete brand and site engagement for teams ready to scale.",
    features: [
      "Up to 12 designed pages",
      "Brand refresh and design system",
      "Custom Next.js front-end + CMS",
      "Conversion strategy and A/B tests",
      "Ongoing performance monitoring",
      "60 days post-launch support",
    ],
    cta: { label: "Start a Growth project", href: "/contact?plan=growth" },
    popular: true,
  },
  {
    id: "platform",
    name: "Platform",
    price: "From $28,000",
    period: "scoped engagement",
    blurb: "Custom software, SaaS products, and multi-team platforms.",
    features: [
      "Discovery and architecture phase",
      "Full product UX and UI",
      "Multi-tenant app with billing",
      "API surface and integrations",
      "Test suite and CI/CD",
      "Quarterly roadmap and reviews",
    ],
    cta: { label: "Talk about a Platform build", href: "/contact?plan=platform" },
  },
];

export const extras: { title: string; price: string; description: string }[] = [
  {
    title: "Brand sprint",
    price: "$4,500",
    description: "Two-week intensive: positioning, identity, and a launch-ready system.",
  },
  {
    title: "SEO retainer",
    price: "$2,400/mo",
    description: "Strategy, content, and technical work tied to monthly KPIs.",
  },
  {
    title: "Care plan",
    price: "$650/mo",
    description: "Hosting, monitoring, security patches, and small improvements.",
  },
  {
    title: "Conversion audit",
    price: "$2,200",
    description: "Heuristic + analytics review with a prioritized roadmap.",
  },
  {
    title: "Webflow → Next migration",
    price: "From $5,800",
    description: "Move to a maintainable Next.js codebase without losing SEO.",
  },
  {
    title: "Design system extension",
    price: "From $7,500",
    description: "Take an existing system from MVP to production-ready library.",
  },
];

export const compareRows: { feature: string; values: [string, string, string] }[] = [
  { feature: "Designed pages", values: ["Up to 6", "Up to 12", "Unlimited"] },
  { feature: "Custom branding", values: ["Light refresh", "Full refresh", "Full system"] },
  { feature: "CMS integration", values: ["✓", "✓", "✓"] },
  { feature: "Custom app / dashboards", values: ["—", "Add-on", "Included"] },
  { feature: "Auth & multi-tenant", values: ["—", "—", "✓"] },
  { feature: "Analytics & A/B tests", values: ["Basic", "Advanced", "Custom"] },
  { feature: "Post-launch support", values: ["30 days", "60 days", "90 days + retainer"] },
  { feature: "Project lead time", values: ["1–2 wks", "2–3 wks", "3–4 wks"] },
  { feature: "Typical timeline", values: ["4–8 wks", "6–10 wks", "12–20 wks"] },
];

/** API-shaped fallback used by src/lib/content.ts when the backend is down. */
export const pricingFallback = {
  plans: pricingPlans.map((plan, i) => ({
    ...plan,
    _id: plan.id,
    planId: plan.id,
    order: i + 1,
  })),
  extras: extras.map((extra, i) => ({ ...extra, _id: `extra-${i}` })),
  compareRows: compareRows.map((row, i) => ({ ...row, _id: `row-${i}` })),
};
