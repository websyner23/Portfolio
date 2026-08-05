/**
 * Editable page copy that currently lives inline in the frontend components.
 * Each entry becomes a Section document the admin can edit; the frontend looks
 * them up by (page, sectionKey) and falls back to these same values if the API
 * is unavailable.
 */

export type TSeedSection = {
  page: string;
  sectionKey: string;
  label: string;
  content: Record<string, unknown>;
  order: number;
};

export const defaultSections: TSeedSection[] = [
  /* ----------------------------- Home ----------------------------- */
  {
    page: "home",
    sectionKey: "hero",
    label: "Hero",
    order: 1,
    content: {
      badge: "Booking projects starting May 2026",
      titleLine1: "Smart sites.",
      titleHighlight: "Solid craft.",
      titleLine2: "Real results.",
      subtitle:
        "WebSyner is a senior, remote-first studio building modern websites, brands, and software for ambitious teams worldwide.",
      primaryCta: { label: "Get a free quote", href: "#hero-quote" },
      secondaryCta: { label: "See our work", href: "/portfolio" },
      quoteFormTitle: "Get a free quote",
      quoteFormSubtitle: "Tell us what you need — we reply within one business day.",
    },
  },
  {
    page: "home",
    sectionKey: "stats",
    label: "Stats strip",
    order: 2,
    content: {
      eyebrow: "By the numbers",
      title: "Work that speaks for itself",
    },
  },
  {
    page: "home",
    sectionKey: "services",
    label: "Services overview",
    order: 3,
    content: {
      eyebrow: "What we do",
      title: "Five practices, one team",
      description:
        "Every engagement is led by senior people who stay on the project from kickoff to launch.",
    },
  },
  {
    page: "home",
    sectionKey: "portfolioSummary",
    label: "Portfolio teaser",
    order: 4,
    content: {
      eyebrow: "Selected work",
      title: "Projects with measurable outcomes",
      description:
        "A sample of recent engagements and the numbers that came out of them.",
      ctaLabel: "View all work",
      ctaHref: "/portfolio",
    },
  },
  {
    page: "home",
    sectionKey: "aboutSummary",
    label: "About teaser",
    order: 5,
    content: {
      eyebrow: "Who we are",
      title: "A senior studio, not an agency pyramid",
      description:
        "No account managers relaying messages. You work directly with the people building your project.",
      ctaLabel: "More about us",
      ctaHref: "/about",
    },
  },
  {
    page: "home",
    sectionKey: "testimonials",
    label: "Testimonials",
    order: 6,
    content: {
      eyebrow: "Client words",
      title: "Teams who shipped with us",
      description:
        "Honest words from teams who finished a project with us in the last twelve months.",
    },
  },
  {
    page: "home",
    sectionKey: "cta",
    label: "Closing CTA",
    order: 7,
    content: {
      title: "Ready to build something worth shipping?",
      description:
        "Tell us about your project. We'll reply within one business day with honest next steps.",
      primaryCta: { label: "Start a project", href: "/contact" },
      secondaryCta: { label: "See pricing", href: "/pricing" },
    },
  },

  /* ----------------------------- About ----------------------------- */
  {
    page: "about",
    sectionKey: "banner",
    label: "Page banner",
    order: 1,
    content: {
      eyebrow: "About WebSyner",
      title: "A remote-first studio built on craft",
      description:
        "We're a small senior team that partners with ambitious companies to design, build, and grow digital products.",
    },
  },
  {
    page: "about",
    sectionKey: "missionVision",
    label: "Mission & vision",
    order: 2,
    content: {
      eyebrow: "Why we exist",
      missionTitle: "Our mission",
      mission:
        "Make excellent digital craft accessible to teams who care about outcomes, not just deliverables.",
      visionTitle: "Our vision",
      vision:
        "A web where fast, accessible, well-built experiences are the norm rather than the exception.",
    },
  },
  {
    page: "about",
    sectionKey: "values",
    label: "Values",
    order: 3,
    content: {
      eyebrow: "What we believe",
      title: "The principles behind the work",
    },
  },
  {
    page: "about",
    sectionKey: "team",
    label: "Team",
    order: 4,
    content: {
      eyebrow: "The people",
      title: "Senior by default",
      description: "The people you meet are the people who do the work.",
    },
  },
  {
    page: "about",
    sectionKey: "industries",
    label: "Industries",
    order: 5,
    content: {
      eyebrow: "Where we work",
      title: "Industries we know well",
    },
  },

  /* ----------------------------- Services ----------------------------- */
  {
    page: "services",
    sectionKey: "banner",
    label: "Page banner",
    order: 1,
    content: {
      eyebrow: "Services",
      title: "Five practices that ship together",
      description:
        "Design, build, brand, search, and cloud — run by one senior team so nothing gets lost between hand-offs.",
    },
  },

  /* ----------------------------- Process ----------------------------- */
  {
    page: "process",
    sectionKey: "banner",
    label: "Page banner",
    order: 1,
    content: {
      eyebrow: "How we work",
      title: "A process you can actually follow",
      description:
        "Every milestone has a deliverable, an exit criterion, and a defined revision window.",
    },
  },
  {
    page: "process",
    sectionKey: "afterLaunch",
    label: "After launch",
    order: 2,
    content: {
      eyebrow: "After launch",
      title: "We don't disappear at go-live",
      description:
        "Launch is the start of the relationship, not the end of the engagement.",
    },
  },

  /* ----------------------------- Pricing ----------------------------- */
  {
    page: "pricing",
    sectionKey: "banner",
    label: "Page banner",
    order: 1,
    content: {
      eyebrow: "Pricing",
      title: "Clear numbers, no discovery calls required",
      description:
        "Fixed-scope packages for common engagements, and honest ranges for everything else.",
    },
  },
  {
    page: "pricing",
    sectionKey: "customQuote",
    label: "Custom quote",
    order: 2,
    content: {
      title: "Something more custom?",
      description:
        "Most of our work is scoped to the project. Tell us what you're building and we'll send a real number.",
      ctaLabel: "Request a quote",
      ctaHref: "/contact",
    },
  },

  /* ----------------------------- Portfolio ----------------------------- */
  {
    page: "portfolio",
    sectionKey: "banner",
    label: "Page banner",
    order: 1,
    content: {
      eyebrow: "Portfolio",
      title: "Work with numbers attached",
      description:
        "Selected projects from the last two years, with the outcomes our clients measured.",
    },
  },
  {
    page: "portfolio",
    sectionKey: "auditBanner",
    label: "Audit banner",
    order: 2,
    content: {
      eyebrow: "Want to see your business here?",
      title: "Start with a free project quote",
      description:
        "Get a free quote today and join our growing list of happy clients. Most projects start within two weeks.",
      ctaLabel: "Get a free quote",
      ctaHref: "/contact",
    },
  },

  /* ----------------------------- Contact ----------------------------- */
  {
    page: "contact",
    sectionKey: "banner",
    label: "Page banner",
    order: 1,
    content: {
      eyebrow: "Get in touch",
      title: "Tell us about your project",
      description:
        "Fill the form, send us an email, or grab a slot directly. We answer real messages, written by real humans, within one business day.",
    },
  },
  {
    page: "contact",
    sectionKey: "schedule",
    label: "Meeting scheduler",
    order: 2,
    content: {
      eyebrow: "Book a call",
      title: "Grab a 30-minute slot",
      description:
        "Pick a time that suits you. You'll get a confirmation email with the meeting link.",
    },
  },
  {
    page: "contact",
    sectionKey: "testimonials",
    label: "Testimonials",
    order: 3,
    content: {
      eyebrow: "Still on the fence?",
      title: "Hear it from our clients",
      description:
        "Honest words from teams who finished a project with us in the last twelve months.",
    },
  },
];
