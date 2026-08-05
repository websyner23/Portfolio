import {
  Layout,
  Search,
  Sparkles,
  Code2,
  Cloud,
  type LucideIcon,
} from "lucide-react";

export type Service = {
  slug: string;
  icon: LucideIcon;
  title: string;
  short: string;
  summary: string;
  outcomes: string[];
  deliverables: string[];
  process: { title: string; description: string }[];
  faqs: { q: string; a: string }[];
  startingPrice: string;
  timeline: string;
  techHighlights: string[];
};

export const services: Service[] = [
  {
    slug: "web-design",
    icon: Layout,
    title: "Web Design & Development",
    short: "Strategic, fast, conversion-first sites.",
    summary:
      "We design and build marketing sites and product UIs that load fast, look sharp on every screen, and turn visitors into customers. Built on Next.js with a clean component system your team can maintain long after launch.",
    outcomes: [
      "Higher landing-page conversion",
      "Improved Core Web Vitals scores",
      "Reusable design system for future pages",
      "Editor-friendly CMS your team can actually use",
    ],
    deliverables: [
      "Brand-aligned visual design in Figma",
      "Pixel-perfect responsive front-end",
      "CMS integration (Sanity, Contentful, or custom)",
      "SEO foundations and analytics wiring",
      "Performance budget and Lighthouse audit",
    ],
    process: [
      { title: "Discovery", description: "Stakeholder interviews, audit of current site, goal mapping." },
      { title: "Strategy", description: "Information architecture, sitemap, content scaffolds." },
      { title: "Design", description: "Wireframes, high-fidelity mocks, motion direction." },
      { title: "Build", description: "Component-driven development with previews on every change." },
      { title: "Launch", description: "QA across devices, performance pass, deploy." },
    ],
    faqs: [
      {
        q: "Do you work with our existing brand?",
        a: "Yes. We can extend an existing identity or refresh it as part of the engagement.",
      },
      {
        q: "How long does a project take?",
        a: "Most marketing sites ship in 4–8 weeks. Larger product UIs take 8–14 weeks.",
      },
      {
        q: "Will my team be able to update the site?",
        a: "Absolutely. We hand over a CMS and a documented component library.",
      },
    ],
    startingPrice: "$6,800",
    timeline: "4–8 weeks",
    techHighlights: ["Next.js", "TypeScript", "Tailwind CSS", "Sanity / Contentful"],
  },
  {
    slug: "seo-services",
    icon: Search,
    title: "SEO & Content Strategy",
    short: "Predictable organic growth, not tricks.",
    summary:
      "A full-funnel SEO program built on technical fundamentals, search-intent driven content, and authority signals. We measure what moves revenue, not vanity rankings.",
    outcomes: [
      "Steady growth in qualified organic traffic",
      "Clear keyword strategy mapped to pipeline",
      "Resolved technical issues holding rankings back",
      "Reporting your CFO actually understands",
    ],
    deliverables: [
      "Technical SEO audit and remediation plan",
      "Keyword and topic cluster strategy",
      "Monthly content production and optimization",
      "Internal linking and authority plan",
      "Monthly performance reporting",
    ],
    process: [
      { title: "Audit", description: "Crawl, index, and competitor analysis." },
      { title: "Strategy", description: "Pillar topics, target queries, editorial calendar." },
      { title: "Production", description: "Briefs, drafts, on-page optimization." },
      { title: "Distribution", description: "Internal linking, digital PR, refresh cycles." },
      { title: "Reporting", description: "Monthly readouts tied to revenue." },
    ],
    faqs: [
      {
        q: "How fast will I see results?",
        a: "Technical wins land in weeks. Content compounds over 3–9 months depending on competition.",
      },
      {
        q: "Do you guarantee rankings?",
        a: "No serious agency does. We commit to a transparent process and shared KPIs.",
      },
      {
        q: "Can you work with our writers?",
        a: "Yes. We can produce content end-to-end or only do strategy and editing.",
      },
    ],
    startingPrice: "$2,400/mo",
    timeline: "Ongoing retainer",
    techHighlights: ["Ahrefs", "Search Console", "Screaming Frog", "Looker Studio"],
  },
  {
    slug: "logo-branding",
    icon: Sparkles,
    title: "Logo & Branding",
    short: "Identities that look right at every size.",
    summary:
      "From wordmarks to full brand systems. We build identities that work in a favicon and on a billboard, with a design language your team can extend without us in the room.",
    outcomes: [
      "A distinctive, ownable identity",
      "Consistent usage across every surface",
      "Faster design decisions for your team",
      "Brand guidelines people actually open",
    ],
    deliverables: [
      "Logo and lockups (primary, secondary, favicon)",
      "Color, typography, and motion system",
      "Brand voice and messaging pillars",
      "Templates for social, deck, and email",
      "Brand guidelines PDF and Figma library",
    ],
    process: [
      { title: "Discover", description: "Positioning workshop and competitive landscape." },
      { title: "Concept", description: "Three directions explored at full fidelity." },
      { title: "Refine", description: "Iterate on the chosen direction." },
      { title: "System", description: "Extend into a complete brand system." },
      { title: "Handover", description: "Files, guidelines, and a 30-day support window." },
    ],
    faqs: [
      {
        q: "Can you do just a logo?",
        a: "We can, but the value compounds quickly when you do at least a basic system.",
      },
      {
        q: "Do you do rebrands?",
        a: "Yes. Refreshes and full rebrands are a big chunk of our work.",
      },
      {
        q: "What if we don't love the first concepts?",
        a: "We expect feedback. Two structured rounds are built into the engagement.",
      },
    ],
    startingPrice: "$4,500",
    timeline: "3–6 weeks",
    techHighlights: ["Figma", "Illustrator", "After Effects"],
  },
  {
    slug: "custom-software",
    icon: Code2,
    title: "Custom Software",
    short: "Internal tools, dashboards, and APIs.",
    summary:
      "We build custom web apps for teams that have outgrown spreadsheets and off-the-shelf tools. Cleanly architected, properly tested, and designed for the humans who use them every day.",
    outcomes: [
      "Replace fragile workflows with reliable software",
      "Cut hours of manual work per week",
      "A platform you can extend in-house",
      "Documentation that actually exists",
    ],
    deliverables: [
      "Architecture and data model",
      "Designed and accessible user interface",
      "Auth, permissions, and audit logging",
      "API surface and integration glue",
      "Test suite and deployment pipeline",
    ],
    process: [
      { title: "Scoping", description: "Map the workflow, surface the real requirements." },
      { title: "Design", description: "Prototype the interface with real users." },
      { title: "Build", description: "Two-week increments with working previews." },
      { title: "Harden", description: "Test, secure, document." },
      { title: "Handover", description: "Train your team, then stay on call." },
    ],
    faqs: [
      {
        q: "Do you work with our existing engineers?",
        a: "Yes. We pair with internal teams or run the build solo, whichever fits.",
      },
      {
        q: "What stack do you use?",
        a: "TypeScript end-to-end, Next.js or Node, Postgres, deployed on Vercel or your cloud of choice.",
      },
      {
        q: "Who owns the code?",
        a: "You do. Full IP transfer, repo handover, no lock-in.",
      },
    ],
    startingPrice: "$18,000",
    timeline: "8–16 weeks",
    techHighlights: ["Next.js", "TypeScript", "PostgreSQL", "Vercel / AWS"],
  },
  {
    slug: "saas-product",
    icon: Cloud,
    title: "SaaS Product Development",
    short: "Ship a real product, not a prototype.",
    summary:
      "End-to-end product partnerships for founders. We help you go from validated idea to billed users — with the design taste, engineering rigor, and growth thinking it actually takes.",
    outcomes: [
      "A live, paid product",
      "A scalable architecture from day one",
      "Onboarding and retention loops in place",
      "A team that knows your codebase",
    ],
    deliverables: [
      "Product strategy and roadmap",
      "Design system and core UX flows",
      "Multi-tenant app with billing",
      "Analytics, experiments, and feature flags",
      "Marketing site and docs",
    ],
    process: [
      { title: "Define", description: "Sharpen the wedge and pick the first three months of work." },
      { title: "Design", description: "Brand, identity, and core product flows." },
      { title: "Build v1", description: "Smallest thing that delivers the core value." },
      { title: "Launch", description: "Closed beta, then public launch." },
      { title: "Iterate", description: "Weekly shipping based on real usage." },
    ],
    faqs: [
      {
        q: "Do you take equity?",
        a: "Sometimes, on a case-by-case basis. We mostly work on cash and SOWs.",
      },
      {
        q: "Will you stay on after launch?",
        a: "Most clients keep us as a fractional product team. Optional, never required.",
      },
      {
        q: "What if the idea is still rough?",
        a: "We do a paid two-week scoping engagement to sharpen it before committing.",
      },
    ],
    startingPrice: "$28,000",
    timeline: "12–20 weeks",
    techHighlights: ["Next.js", "TypeScript", "Stripe", "Postgres", "Redis"],
  },
];

export const getServiceBySlug = (slug: string) => services.find((s) => s.slug === slug);

/**
 * API-shaped fallback used by src/lib/content.ts when the backend is
 * unreachable. Icon components are mapped back to the names the API stores.
 */
const SERVICE_ICON_NAMES = new Map<LucideIcon, string>([
  [Layout, "Layout"],
  [Search, "Search"],
  [Sparkles, "Sparkles"],
  [Code2, "Code2"],
  [Cloud, "Cloud"],
]);

export const servicesFallback = services.map((service, index) => ({
  ...service,
  _id: service.slug,
  icon: SERVICE_ICON_NAMES.get(service.icon) ?? "Sparkles",
  order: index + 1,
}));
