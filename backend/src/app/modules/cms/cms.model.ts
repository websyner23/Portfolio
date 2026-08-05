import { model, Schema } from "mongoose";

/* ------------------------------------------------------------------ *
 * Singletons — one document each, addressed by a fixed `key`.
 * ------------------------------------------------------------------ */

const siteSettingsSchema = new Schema(
  {
    key: { type: String, default: "default", unique: true, immutable: true },
    brandName: { type: String, default: "WebSyner" },
    tagline: { type: String, default: "" },
    description: { type: String, default: "" },
    url: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: {
      line1: { type: String, default: "" },
      line2: { type: String, default: "" },
    },
    logo: { url: String, publicId: String },
    logoDark: { url: String, publicId: String },
    social: {
      twitter: String,
      linkedin: String,
      instagram: String,
      dribbble: String,
      github: String,
      facebook: String,
      youtube: String,
    },
    nav: [
      {
        _id: false,
        label: { type: String, required: true },
        href: { type: String, required: true },
        order: { type: Number, default: 0 },
        visible: { type: Boolean, default: true },
      },
    ],
    footerNote: { type: String, default: "" },
    seo: {
      metaTitle: String,
      metaDescription: String,
      ogImage: String,
    },
  },
  { timestamps: true }
);

export const SiteSettings = model("SiteSettings", siteSettingsSchema);

/**
 * Theme tokens are stored as hex values keyed by the CSS variable names used
 * in frontend/src/app/globals.css. Tailwind class strings can never be stored
 * here — they wouldn't survive the build-time content scan.
 */
const themeTokens = {
  background: String,
  foreground: String,
  card: String,
  cardForeground: String,
  muted: String,
  mutedForeground: String,
  border: String,
  input: String,
  ring: String,
  brand: String,
  brandForeground: String,
  brandInk: String,
  navy: String,
  navyForeground: String,
  logoInk: String,
};

const themeSettingsSchema = new Schema(
  {
    key: { type: String, default: "default", unique: true, immutable: true },
    light: themeTokens,
    dark: themeTokens,
    defaultMode: { type: String, enum: ["light", "dark"], default: "dark" },
    radius: { type: String, default: "0.75rem" },
  },
  { timestamps: true }
);

export const ThemeSettings = model("ThemeSettings", themeSettingsSchema);

/* ------------------------------------------------------------------ *
 * Page sections — flexible copy blocks keyed by (page, sectionKey).
 * Covers headlines and body copy that live inline in the page components.
 * ------------------------------------------------------------------ */

const sectionSchema = new Schema(
  {
    page: { type: String, required: true, index: true },
    sectionKey: { type: String, required: true },
    label: { type: String, default: "" },
    content: { type: Schema.Types.Mixed, default: {} },
    order: { type: Number, default: 0 },
    visible: { type: Boolean, default: true },
  },
  { timestamps: true }
);

sectionSchema.index({ page: 1, sectionKey: 1 }, { unique: true });

export const Section = model("Section", sectionSchema);

/* ------------------------------------------------------------------ *
 * Typed content collections
 * ------------------------------------------------------------------ */

const serviceSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Lucide icon NAME (e.g. "Layout") — resolved to a component on the client.
    icon: { type: String, default: "Sparkles" },
    title: { type: String, required: true },
    short: { type: String, default: "" },
    summary: { type: String, default: "" },
    outcomes: { type: [String], default: [] },
    deliverables: { type: [String], default: [] },
    process: [
      { _id: false, title: String, description: String },
    ],
    faqs: [{ _id: false, q: String, a: String }],
    startingPrice: { type: String, default: "" },
    timeline: { type: String, default: "" },
    techHighlights: { type: [String], default: [] },
    image: { url: String, publicId: String },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Service = model("Service", serviceSchema);

const portfolioCategorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const PortfolioCategory = model(
  "PortfolioCategory",
  portfolioCategorySchema
);

const portfolioSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true },
    client: { type: String, default: "" },
    category: {
      type: Schema.Types.ObjectId,
      ref: "PortfolioCategory",
      required: true,
    },
    summary: { type: String, default: "" },
    body: { type: String, default: "" }, // rich HTML for the detail page
    metrics: [{ _id: false, label: String, value: String }],
    tags: { type: [String], default: [] },
    techStack: { type: [String], default: [] },
    year: { type: Number, default: new Date().getFullYear() },
    coverImage: { url: String, publicId: String },
    gallery: [{ _id: false, url: String, publicId: String, caption: String }],
    // Live demo / prototype the client can open from the site.
    liveUrl: { type: String, default: "" },
    // Hex gradient pair used when there's no cover image (never Tailwind classes).
    colors: {
      from: { type: String, default: "#0fcda1" },
      to: { type: String, default: "#1e2d40" },
    },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Portfolio = model("Portfolio", portfolioSchema);

const testimonialSchema = new Schema(
  {
    quote: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, default: "" },
    company: { type: String, default: "" },
    initials: { type: String, default: "" },
    avatar: { url: String, publicId: String },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Testimonial = model("Testimonial", testimonialSchema);

const teamMemberSchema = new Schema(
  {
    name: { type: String, required: true },
    role: { type: String, default: "" },
    bio: { type: String, default: "" },
    initials: { type: String, default: "" },
    image: { url: String, publicId: String },
    linkedin: { type: String, default: "" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const TeamMember = model("TeamMember", teamMemberSchema);

const pricingPlanSchema = new Schema(
  {
    planId: { type: String, required: true, unique: true, lowercase: true },
    name: { type: String, required: true },
    price: { type: String, default: "" },
    period: { type: String, default: "" },
    blurb: { type: String, default: "" },
    features: { type: [String], default: [] },
    popular: { type: Boolean, default: false },
    cta: { label: String, href: String },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const PricingPlan = model("PricingPlan", pricingPlanSchema);

const pricingExtraSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: String, default: "" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const PricingExtra = model("PricingExtra", pricingExtraSchema);

const compareRowSchema = new Schema(
  {
    feature: { type: String, required: true },
    values: { type: [String], default: [] }, // one entry per plan, in plan order
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const CompareRow = model("CompareRow", compareRowSchema);

const faqSchema = new Schema(
  {
    q: { type: String, required: true },
    a: { type: String, required: true },
    // Which page's FAQ block this belongs to: general | process | pricing | portfolio
    group: { type: String, default: "general", index: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Faq = model("Faq", faqSchema);

const processStepSchema = new Schema(
  {
    step: { type: String, default: "" }, // display number, e.g. "01"
    title: { type: String, required: true },
    description: { type: String, default: "" },
    icon: { type: String, default: "Sparkles" },
    duration: { type: String, default: "" },
    bullets: { type: [String], default: [] },
    // step | after-launch | summary
    group: { type: String, default: "step", index: true },
    // summary entries carry a headline figure instead of a description
    stat: { type: String, default: "" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ProcessStep = model("ProcessStep", processStepSchema);

/**
 * One collection backs several small homepage/about lists. `group` selects the
 * list; counters use value/suffix/label while value-prop cards use
 * title/description, so both sets of fields are optional.
 */
const statSchema = new Schema(
  {
    label: { type: String, default: "" },
    value: { type: String, default: "" },
    suffix: { type: String, default: "" },
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    icon: { type: String, default: "Sparkles" },
    // home-stats | values | why-choose | drivers | industries
    group: { type: String, default: "home-stats", index: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Stat = model("Stat", statSchema);
