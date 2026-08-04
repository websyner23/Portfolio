import {
  Compass,
  PenTool,
  Code2,
  Rocket,
  LineChart,
  HeartHandshake,
  type LucideIcon,
} from "lucide-react";

export type ProcessStep = {
  step: string;
  icon: LucideIcon;
  title: string;
  duration: string;
  description: string;
  bullets: string[];
};

export const processSteps: ProcessStep[] = [
  {
    step: "01",
    icon: Compass,
    title: "Discover",
    duration: "Week 1",
    description:
      "We start by getting deeply familiar with your business, your audience, and the problem we're really solving — not the one stated in a brief.",
    bullets: [
      "Stakeholder interviews",
      "Audit of current site, brand, and analytics",
      "Competitor and category landscape",
      "Goal mapping and KPI definition",
    ],
  },
  {
    step: "02",
    icon: PenTool,
    title: "Strategy & Design",
    duration: "Weeks 2–3",
    description:
      "We translate insights into a sharp design direction — sitemap, wireframes, then high-fidelity, motion-aware visuals.",
    bullets: [
      "Information architecture and content scaffolds",
      "Design language and motion direction",
      "High-fidelity Figma mockups",
      "Two structured revision rounds",
    ],
  },
  {
    step: "03",
    icon: Code2,
    title: "Build",
    duration: "Weeks 3–6",
    description:
      "We build in component-driven sprints with a live preview deployed for every change. You see the work as it grows.",
    bullets: [
      "Type-safe Next.js front-end",
      "CMS integration your team can run",
      "Accessibility (WCAG AA) baked in",
      "Performance budget per page",
    ],
  },
  {
    step: "04",
    icon: Rocket,
    title: "Launch",
    duration: "Week 6+",
    description:
      "We ship with a full QA pass, a performance audit, and a smooth DNS swap. No drama, no downtime.",
    bullets: [
      "Cross-device QA matrix",
      "SEO and metadata verification",
      "Lighthouse and Core Web Vitals pass",
      "Coordinated launch and DNS cutover",
    ],
  },
  {
    step: "05",
    icon: LineChart,
    title: "Measure",
    duration: "Post-launch",
    description:
      "Launch is the start. We track what happened, learn from it, and tune what's already shipped.",
    bullets: [
      "Analytics and event verification",
      "Heatmaps and session-replay setup",
      "Conversion baselines and benchmarks",
      "Monthly performance readouts",
    ],
  },
  {
    step: "06",
    icon: HeartHandshake,
    title: "Partner",
    duration: "Ongoing",
    description:
      "Most clients keep us on as a fractional design and engineering partner. Scoped, lightweight, easy to ramp up or down.",
    bullets: [
      "Quarterly roadmap and goals",
      "Weekly shipping cadence",
      "Direct Slack channel",
      "Quarterly business reviews",
    ],
  },
];

export const afterLaunch = [
  {
    title: "Care plan",
    description: "Monitoring, security patches, dependency updates, and small monthly improvements.",
  },
  {
    title: "Growth retainer",
    description: "Ongoing design and engineering capacity for landing pages, experiments, and features.",
  },
  {
    title: "Quarterly reviews",
    description: "We meet every 90 days to review what shipped, what worked, and what to tackle next.",
  },
  {
    title: "Knowledge transfer",
    description: "Documentation, recorded walkthroughs, and an open Slack channel — never a black box.",
  },
];

export const processSummary = [
  { stat: "4–16 wks", label: "Typical engagement" },
  { stat: "2", label: "Revision rounds per phase" },
  { stat: "Weekly", label: "Shipping cadence" },
  { stat: "100%", label: "Source code ownership" },
];
