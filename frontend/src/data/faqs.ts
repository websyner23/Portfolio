export type Faq = { q: string; a: string };

export const generalFaqs: Faq[] = [
  {
    q: "How do engagements typically start?",
    a: "We start with a free 30-minute discovery call. If there's a fit, we send a fixed-scope proposal within a week. Once accepted, kickoff is usually within 7–10 days.",
  },
  {
    q: "Do you work with clients outside the US?",
    a: "Yes — we are a remote-first studio and work with founders and teams worldwide. Roughly half of our clients are outside North America.",
  },
  {
    q: "What does pricing look like?",
    a: "Marketing sites start at $6,800. Product engagements start at $18,000. SEO retainers start at $2,400/month. Every quote is fixed-scope so you know what you're paying for.",
  },
  {
    q: "Who owns the work?",
    a: "You do. Full IP transfer is part of every engagement. You get the source files, the repo, and a documented handover — no platform lock-in.",
  },
  {
    q: "Do you work with existing in-house teams?",
    a: "Often. We can pair with your engineers and designers, run the work solo, or flex between the two as needed.",
  },
  {
    q: "What happens after launch?",
    a: "We offer ongoing care plans for performance, security, and small improvements. Many clients move into a monthly retainer to keep shipping.",
  },
  {
    q: "How fast can you start?",
    a: "Typically 1–3 weeks out. We keep capacity tight on purpose so the people on your call are the people doing the work.",
  },
  {
    q: "Can I see references or recent work?",
    a: "Yes — our portfolio page has detailed case studies and we're happy to connect you with past clients on request.",
  },
];

export const processFaqs: Faq[] = [
  {
    q: "How involved will I need to be?",
    a: "We need 2–3 hours per week from a single decision-maker. Less and we slow down; more is welcome but not required.",
  },
  {
    q: "What tools do you use to collaborate?",
    a: "Figma for design, Linear or Notion for project tracking, Slack for day-to-day, and Loom for async updates.",
  },
  {
    q: "How do revisions work?",
    a: "Every phase has two structured revision rounds built in. Beyond that, we scope changes transparently.",
  },
  {
    q: "What if we want to change scope mid-project?",
    a: "Happens often. We pause, document the change, and adjust the SOW before resuming. No surprises.",
  },
  {
    q: "Do you provide weekly updates?",
    a: "Yes. Async Loom on Friday plus a 30-minute live sync. You always know what shipped and what's next.",
  },
];

export const pricingFaqs: Faq[] = [
  {
    q: "Are there hidden fees?",
    a: "No. Quotes are fixed-scope. The only variable is third-party costs (hosting, fonts, stock) which we surface upfront.",
  },
  {
    q: "Do you offer payment plans?",
    a: "Yes. Most engagements split into 30/40/30 across kickoff, mid-project, and launch.",
  },
  {
    q: "Is there a money-back guarantee?",
    a: "If we don't ship the first design milestone to your satisfaction, we refund what you've paid, full stop.",
  },
  {
    q: "Can you match a fixed budget?",
    a: "Sometimes. We'll be honest about what's realistic at a given budget instead of overpromising.",
  },
  {
    q: "Do you offer discounts for nonprofits?",
    a: "Yes — 15% off for registered nonprofits and a sliding scale for early-stage founders.",
  },
];

export const portfolioFaqs: Faq[] = [
  {
    q: "Can I see live links to these projects?",
    a: "For most. A handful are under NDA — happy to walk through them on a call.",
  },
  {
    q: "What industries do you have the most experience in?",
    a: "SaaS, professional services, healthcare, and e-commerce in roughly that order.",
  },
  {
    q: "Do you take on small projects?",
    a: "Yes — landing pages, brand refreshes, and audits are often great fits.",
  },
];

/** API-shaped fallback keyed by group, used by src/lib/content.ts. */
const withIds = (items: Faq[], group: string) =>
  items.map((faq, i) => ({ ...faq, _id: `${group}-${i}`, group }));

export const faqsFallback: Record<string, ReturnType<typeof withIds>> = {
  general: withIds(generalFaqs, "general"),
  process: withIds(processFaqs, "process"),
  pricing: withIds(pricingFaqs, "pricing"),
  portfolio: withIds(portfolioFaqs, "portfolio"),
};
