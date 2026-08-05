import { Globe2, Users, Award, Zap, type LucideIcon } from "lucide-react";

export type Stat = { value: string; label: string; icon: LucideIcon; suffix?: string };

export const homeStats: Stat[] = [
  { value: "120", suffix: "+", label: "Projects shipped", icon: Zap },
  { value: "38", suffix: "", label: "Countries served", icon: Globe2 },
  { value: "92", suffix: "%", label: "Client retention", icon: Users },
  { value: "14", suffix: "yrs", label: "Combined craft", icon: Award },
];

export type ValueItem = { title: string; description: string };

export const websynerValues: ValueItem[] = [
  {
    title: "Outcomes over deliverables",
    description:
      "A great deck doesn't move the business. We define success in your metrics on day one and ship toward them.",
  },
  {
    title: "Transparent by default",
    description:
      "Live dashboards, weekly Loom updates, fixed-scope quotes. No surprise invoices, ever.",
  },
  {
    title: "Senior, in the room",
    description:
      "The people on your kickoff call do the work. No layered handoffs, no junior teams hidden behind a producer.",
  },
  {
    title: "Built to be handed over",
    description:
      "Documented code, editable CMS, recorded walkthroughs. You own the work and the knowledge.",
  },
];

export const whyChoose: { title: string; description: string }[] = [
  {
    title: "We work in your stack",
    description:
      "Next.js, TypeScript, Tailwind, modern tooling. Your future engineers will thank us.",
  },
  {
    title: "We design for performance",
    description:
      "90+ Lighthouse is the floor, not the goal. Fast sites convert better — period.",
  },
  {
    title: "We measure what matters",
    description:
      "Pipeline, signups, revenue. We don't celebrate vanity wins on your behalf.",
  },
  {
    title: "We're built to last",
    description:
      "Boutique by design. We turn down work that isn't a fit so the work we take stays excellent.",
  },
  {
    title: "Senior team, every project",
    description:
      "No bait-and-switch. The lead designer and engineer on day one are the same on launch day.",
  },
  {
    title: "No platform lock-in",
    description:
      "You own the code, the brand assets, and the documentation. Leaving us is always easy.",
  },
];

export const drivers: { title: string; description: string }[] = [
  {
    title: "Curiosity",
    description:
      "We ask the questions clients sometimes haven't thought to ask. The result is sharper work.",
  },
  {
    title: "Craft",
    description:
      "Every detail, from typography to error states, gets the same care. Quality compounds.",
  },
  {
    title: "Candor",
    description:
      "If a feature won't work, we say so. If your timeline is unrealistic, we'll tell you.",
  },
  {
    title: "Care",
    description:
      "We work with people we like, on projects we believe in. It shows up in the output.",
  },
];

export const industries: string[] = [
  "SaaS",
  "Healthcare",
  "Fintech",
  "Real Estate",
  "Hospitality",
  "E-commerce",
  "Professional Services",
  "Logistics",
  "Education",
  "Outdoor & Lifestyle",
  "Agencies & Studios",
  "Non-profits",
];

/** API-shaped fallback used by src/lib/content.ts when the backend is down. */
const STAT_ICON_NAMES = new Map<LucideIcon, string>([
  [Zap, "Zap"],
  [Globe2, "Globe2"],
  [Users, "Users"],
  [Award, "Award"],
]);

const asStatDocs = (
  items: { title: string; description: string }[],
  group: string
) =>
  items.map((item, i) => ({
    _id: `${group}-${i}`,
    title: item.title,
    description: item.description,
    icon: "Sparkles",
    group,
  }));

export const statsFallback = [
  ...homeStats.map((stat, i) => ({
    _id: `home-stats-${i}`,
    label: stat.label,
    value: stat.value,
    suffix: stat.suffix,
    icon: STAT_ICON_NAMES.get(stat.icon) ?? "Sparkles",
    group: "home-stats",
  })),
  ...asStatDocs(websynerValues, "values"),
  ...asStatDocs(whyChoose, "why-choose"),
  ...asStatDocs(drivers, "drivers"),
  ...industries.map((name, i) => ({
    _id: `industries-${i}`,
    label: name,
    icon: "Sparkles",
    group: "industries",
  })),
];
