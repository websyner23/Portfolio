import { apiGet, apiGetWithMeta } from "./api";
import { faqsFallback } from "@/data/faqs";
import { portfolioFallback } from "@/data/portfolio";
import { pricingFallback } from "@/data/pricing";
import { processFallback } from "@/data/process";
import { servicesFallback } from "@/data/services";
import { site as siteFallback } from "@/data/site";
import { statsFallback } from "@/data/stats";
import { team as teamFallback } from "@/data/team";
import { testimonials as testimonialsFallback } from "@/data/testimonials";

/* ----------------------------- shared types ----------------------------- */

export type SiteSettings = {
  brandName: string;
  tagline: string;
  description: string;
  url: string;
  email: string;
  phone: string;
  address: { line1: string; line2: string };
  social: Record<string, string | undefined>;
  nav: { label: string; href: string; order: number; visible: boolean }[];
  footerNote?: string;
  logo?: { url?: string };
  logoDark?: { url?: string };
  seo?: { metaTitle?: string; metaDescription?: string; ogImage?: string };
};

export type ThemeTokens = Record<string, string | undefined>;

export type ThemeSettings = {
  light: ThemeTokens;
  dark: ThemeTokens;
  defaultMode: "light" | "dark";
  radius?: string;
};

export type ApiService = {
  _id: string;
  slug: string;
  icon: string;
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

export type ApiPortfolioCategory = {
  _id: string;
  name: string;
  slug: string;
  order: number;
};

export type ApiPortfolioItem = {
  _id: string;
  slug: string;
  title: string;
  client: string;
  category: ApiPortfolioCategory | null;
  summary: string;
  body?: string;
  metrics: { label: string; value: string }[];
  tags: string[];
  techStack: string[];
  year: number;
  coverImage?: { url?: string };
  gallery?: { url: string; caption?: string }[];
  liveUrl?: string;
  colors: { from: string; to: string };
  featured: boolean;
};

export type ApiTestimonial = {
  _id: string;
  quote: string;
  name: string;
  role: string;
  company: string;
  initials?: string;
  avatar?: { url?: string };
  rating: number;
};

export type ApiTeamMember = {
  _id: string;
  name: string;
  role: string;
  bio: string;
  initials?: string;
  image?: { url?: string };
  linkedin?: string;
};

export type ApiFaq = { _id: string; q: string; a: string; group: string };

export type ApiProcessStep = {
  _id: string;
  step?: string;
  title: string;
  description: string;
  icon: string;
  duration?: string;
  bullets: string[];
  group: "step" | "after-launch" | "summary";
  stat?: string;
};

export type ApiStat = {
  _id: string;
  label?: string;
  title?: string;
  value?: string;
  suffix?: string;
  description?: string;
  icon: string;
  group: string;
};

export type ApiPricing = {
  plans: {
    _id: string;
    planId: string;
    name: string;
    price: string;
    period?: string;
    blurb: string;
    features: string[];
    popular?: boolean;
    cta?: { label?: string; href?: string };
  }[];
  extras: { _id: string; title: string; description: string; price: string }[];
  compareRows: { _id: string; feature: string; values: string[] }[];
};

export type SectionContent = Record<string, Record<string, unknown>>;

/* ------------------------------- fetchers ------------------------------- */

export const getSite = () =>
  apiGet<{ settings: SiteSettings | null; theme: ThemeSettings | null }>(
    "/public/site",
    ["site", "theme"],
    { settings: null, theme: null }
  );

/** Site settings with the static file filling any gaps. */
export const getSiteSettings = async (): Promise<SiteSettings> => {
  const { settings } = await getSite();
  if (settings) return settings;

  return {
    brandName: siteFallback.name,
    tagline: siteFallback.tagline,
    description: siteFallback.description,
    url: siteFallback.url,
    email: siteFallback.email,
    phone: siteFallback.phone,
    address: siteFallback.address,
    social: siteFallback.social,
    nav: siteFallback.nav.map((n, i) => ({ ...n, order: i, visible: true })),
  };
};

export const getSections = (page: string) =>
  apiGet<SectionContent>(
    `/public/sections?page=${page}`,
    ["sections"],
    {} as SectionContent
  );

/** Reads one field out of a section, falling back to a literal default. */
export const sectionValue = <T>(
  sections: SectionContent,
  sectionKey: string,
  field: string,
  fallback: T
): T => {
  const value = sections?.[sectionKey]?.[field];
  return (value === undefined || value === "" ? fallback : value) as T;
};

export const getServices = () =>
  apiGet<ApiService[]>("/public/services", ["services"], servicesFallback);

export const getService = (slug: string) =>
  apiGet<ApiService | null>(
    `/public/services/${slug}`,
    ["services"],
    servicesFallback.find((s) => s.slug === slug) ?? null
  );

export const getPortfolioCategories = () =>
  apiGet<ApiPortfolioCategory[]>(
    "/public/portfolio-categories",
    ["portfolio"],
    portfolioFallback.categories
  );

export const getPortfolio = (query = "") =>
  apiGetWithMeta<ApiPortfolioItem[]>(
    `/public/portfolio${query ? `?${query}` : ""}`,
    ["portfolio"],
    portfolioFallback.items
  );

export const getPortfolioItem = (slug: string) =>
  apiGet<{
    item: ApiPortfolioItem;
    prev: { slug: string; title: string } | null;
    next: { slug: string; title: string } | null;
  } | null>(`/public/portfolio/${slug}`, ["portfolio"], null);

export const getTestimonials = () =>
  apiGet<ApiTestimonial[]>(
    "/public/testimonials",
    ["testimonials"],
    testimonialsFallback as unknown as ApiTestimonial[]
  );

export const getTeam = () =>
  apiGet<ApiTeamMember[]>(
    "/public/team",
    ["team"],
    teamFallback as unknown as ApiTeamMember[]
  );

export const getPricing = () =>
  apiGet<ApiPricing>("/public/pricing", ["pricing"], pricingFallback);

export const getFaqs = (group: string) =>
  apiGet<ApiFaq[]>(
    `/public/faqs?group=${group}`,
    ["faqs"],
    faqsFallback[group] ?? []
  );

export const getProcess = () =>
  apiGet<ApiProcessStep[]>("/public/process", ["process"], processFallback);

export const getStats = () =>
  apiGet<ApiStat[]>("/public/stats", ["stats"], statsFallback);

/** Convenience: stats filtered to one group. */
export const statsByGroup = (stats: ApiStat[], group: string) =>
  stats.filter((s) => s.group === group);
