import {
  CompareRow,
  Faq,
  Portfolio,
  PortfolioCategory,
  PricingExtra,
  PricingPlan,
  ProcessStep,
  Service,
  SiteSettings,
  Stat,
  TeamMember,
  Testimonial,
  ThemeSettings,
} from "../app/modules/cms/cms.model";
import content from "./data/frontend-content.json";
import { portfolioCategories, portfolioItems } from "./data/portfolio";
import { defaultSections } from "./data/sections";

/* eslint-disable @typescript-eslint/no-explicit-any */
const c = content as Record<string, any>;

/** Upsert helper — matches on `filter`, so re-seeding never duplicates. */
const upsert = async (model: any, filter: Record<string, unknown>, doc: unknown) =>
  model.findOneAndUpdate(
    filter,
    { $setOnInsert: doc },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

/**
 * Brand tokens copied verbatim from frontend/src/app/globals.css so the DB is
 * the source of truth without changing how the site currently looks.
 */
const THEME = {
  light: {
    background: "#ffffff",
    foreground: "#10202f",
    card: "#ffffff",
    cardForeground: "#10202f",
    muted: "#f1f4f8",
    mutedForeground: "#5b6b7f",
    border: "#dde3ea",
    input: "#dde3ea",
    ring: "#0fcda1",
    brand: "#0fcda1",
    brandForeground: "#1e2d40",
    brandInk: "#0a7d63",
    navy: "#1e2d40",
    navyForeground: "#ffffff",
    logoInk: "#1e2d40",
  },
  dark: {
    background: "#0d151f",
    foreground: "#e9eff5",
    card: "#16202e",
    cardForeground: "#e9eff5",
    muted: "#172231",
    mutedForeground: "#9aabbf",
    border: "#263548",
    input: "#263548",
    ring: "#0fcda1",
    brand: "#0fcda1",
    brandForeground: "#1e2d40",
    brandInk: "#46dfba",
    navy: "#1e2d40",
    navyForeground: "#ffffff",
    logoInk: "#e9eff5",
  },
};

const seedSiteSettings = async () => {
  const site = c.site ?? {};
  await upsert(
    SiteSettings,
    { key: "default" },
    {
      key: "default",
      brandName: site.name,
      tagline: site.tagline,
      description: site.description,
      url: site.url,
      email: site.email,
      phone: site.phone,
      address: site.address,
      social: site.social,
      nav: (site.nav ?? []).map((n: any, i: number) => ({
        label: n.label,
        href: n.href,
        order: i,
        visible: true,
      })),
      seo: {
        metaTitle: site.name,
        metaDescription: site.description,
      },
    }
  );
  console.log("  · site settings");

  await upsert(ThemeSettings, { key: "default" }, { key: "default", ...THEME });
  console.log("  · theme tokens (light + dark)");
};

const seedServices = async () => {
  const services = c.services ?? [];
  for (const [i, s] of services.entries()) {
    await upsert(
      Service,
      { slug: s.slug },
      { ...s, order: i + 1, isActive: true }
    );
  }
  console.log(`  · ${services.length} services`);
};

const seedPortfolio = async () => {
  for (const cat of portfolioCategories) {
    await upsert(PortfolioCategory, { slug: cat.slug }, cat);
  }

  const categories = await PortfolioCategory.find();
  const bySlug = new Map(categories.map((cat) => [cat.slug, cat._id]));

  for (const item of portfolioItems) {
    const { categorySlug, ...rest } = item;
    await upsert(
      Portfolio,
      { slug: item.slug },
      { ...rest, category: bySlug.get(categorySlug), isPublished: true }
    );
  }

  console.log(
    `  · ${portfolioCategories.length} portfolio categories, ${portfolioItems.length} projects`
  );
};

const seedTestimonials = async () => {
  const items = c.testimonials ?? [];
  for (const [i, t] of items.entries()) {
    await upsert(
      Testimonial,
      { name: t.name, company: t.company },
      { ...t, order: i + 1, isActive: true }
    );
  }
  console.log(`  · ${items.length} testimonials`);
};

const seedTeam = async () => {
  const items = c.team ?? [];
  for (const [i, m] of items.entries()) {
    const { image, ...rest } = m;
    await upsert(
      TeamMember,
      { name: m.name },
      { ...rest, order: i + 1, isActive: true }
    );
  }
  console.log(`  · ${items.length} team members`);
};

const seedPricing = async () => {
  const plans = c.pricingPlans ?? [];
  for (const [i, p] of plans.entries()) {
    const { id, ...rest } = p;
    await upsert(
      PricingPlan,
      { planId: id },
      { ...rest, planId: id, order: i + 1, isActive: true }
    );
  }

  const extras = c.extras ?? [];
  for (const [i, e] of extras.entries()) {
    await upsert(
      PricingExtra,
      { title: e.title },
      { ...e, order: i + 1, isActive: true }
    );
  }

  const rows = c.compareRows ?? [];
  for (const [i, r] of rows.entries()) {
    await upsert(CompareRow, { feature: r.feature }, { ...r, order: i + 1 });
  }

  console.log(
    `  · ${plans.length} pricing plans, ${extras.length} extras, ${rows.length} comparison rows`
  );
};

const seedFaqs = async () => {
  const groups: [string, any[]][] = [
    ["general", c.generalFaqs ?? []],
    ["process", c.processFaqs ?? []],
    ["pricing", c.pricingFaqs ?? []],
    ["portfolio", c.portfolioFaqs ?? []],
  ];

  let total = 0;
  for (const [group, faqs] of groups) {
    for (const [i, f] of faqs.entries()) {
      await upsert(
        Faq,
        { q: f.q, group },
        { ...f, group, order: i + 1, isActive: true }
      );
      total += 1;
    }
  }
  console.log(`  · ${total} FAQs across ${groups.length} groups`);
};

const seedProcess = async () => {
  const steps = c.processSteps ?? [];
  for (const [i, s] of steps.entries()) {
    await upsert(
      ProcessStep,
      { title: s.title, group: "step" },
      { ...s, group: "step", order: i + 1, isActive: true }
    );
  }

  const after = c.afterLaunch ?? [];
  for (const [i, a] of after.entries()) {
    await upsert(
      ProcessStep,
      { title: a.title, group: "after-launch" },
      { ...a, group: "after-launch", order: i + 1, isActive: true }
    );
  }

  const summary = c.processSummary ?? [];
  for (const [i, s] of summary.entries()) {
    await upsert(
      ProcessStep,
      { title: s.label, group: "summary" },
      {
        title: s.label,
        stat: s.stat,
        group: "summary",
        order: i + 1,
        isActive: true,
      }
    );
  }

  console.log(
    `  · ${steps.length} process steps, ${after.length} after-launch, ${summary.length} summary`
  );
};

const seedStats = async () => {
  const groups: [string, any[]][] = [
    ["home-stats", c.homeStats ?? []],
    ["values", c.websynerValues ?? []],
    ["why-choose", c.whyChoose ?? []],
    ["drivers", c.drivers ?? []],
  ];

  let total = 0;
  for (const [group, items] of groups) {
    for (const [i, item] of items.entries()) {
      const key = item.label ?? item.title;
      await upsert(
        Stat,
        { group, $or: [{ label: key }, { title: key }] },
        { ...item, group, order: i + 1, isActive: true }
      );
      total += 1;
    }
  }

  // Industries are a flat string list on the frontend.
  const industries = c.industries ?? [];
  for (const [i, name] of industries.entries()) {
    await upsert(
      Stat,
      { group: "industries", label: name },
      { label: name, group: "industries", order: i + 1, isActive: true }
    );
    total += 1;
  }

  console.log(`  · ${total} stats/values across 5 groups`);
};

const seedSections = async () => {
  const { Section } = await import("../app/modules/cms/cms.model");

  for (const section of defaultSections) {
    await upsert(
      Section,
      { page: section.page, sectionKey: section.sectionKey },
      section
    );
  }
  console.log(`  · ${defaultSections.length} editable page sections`);
};

export const seedCms = async () => {
  await seedSiteSettings();
  await seedServices();
  await seedPortfolio();
  await seedTestimonials();
  await seedTeam();
  await seedPricing();
  await seedFaqs();
  await seedProcess();
  await seedStats();
  await seedSections();
};
