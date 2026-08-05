import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowUpRight } from "lucide-react";
import { PageBanner } from "@/components/sections/page-banner";
import { PortfolioSummary } from "@/components/sections/portfolio-summary";
import { PortfolioGrid } from "@/components/sections/portfolio-grid";
import { AuditBanner } from "@/components/sections/audit-banner";
import { PortfolioServicesLink } from "@/components/sections/portfolio-services-link";
import { FaqSection } from "@/components/sections/faq";
import { Cta } from "@/components/sections/cta";
import { Button } from "@/components/ui/button";
import {
  getFaqs,
  getPortfolio,
  getPortfolioCategories,
  getSections,
  sectionValue,
} from "@/lib/content";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Selected case studies — websites, brands, and software shipped for ambitious teams across the world.",
};

export default async function PortfolioPage() {
  const [{ data: items }, categories, faqs, sections] = await Promise.all([
    getPortfolio(),
    getPortfolioCategories(),
    getFaqs("portfolio"),
    getSections("portfolio"),
  ]);

  const banner = {
    eyebrow: sectionValue(sections, "banner", "eyebrow", "Portfolio"),
    description: sectionValue(
      sections,
      "banner",
      "description",
      "A selection of recent case studies — the constraints, the decisions, the outcomes. Many more under NDA; happy to walk through them on a call."
    ),
  };

  const audit = {
    eyebrow: sectionValue(
      sections,
      "auditBanner",
      "eyebrow",
      "Want to see your business here?"
    ),
    description: sectionValue(
      sections,
      "auditBanner",
      "description",
      "Get a free quote today and join our growing list of happy clients. Most projects start within two weeks."
    ),
    ctaLabel: sectionValue(sections, "auditBanner", "ctaLabel", "Start your project"),
    ctaHref: sectionValue(sections, "auditBanner", "ctaHref", "/contact"),
  };

  return (
    <>
      <PageBanner
        eyebrow={banner.eyebrow}
        title={
          <>
            Work we&apos;re{" "}
            <span className="bg-gradient-to-br from-brand-ink to-foreground bg-clip-text text-transparent">
              proud of
            </span>{" "}
            and willing to talk about.
          </>
        }
        description={banner.description}
        breadcrumbs={[{ label: "Portfolio" }]}
        actions={
          <Button asChild size="lg" variant="brand">
            <Link href="/contact">
              Have a similar project?
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        }
      />
      <PortfolioSummary />
      {/* Suspense is required: PortfolioGrid reads filters from useSearchParams. */}
      <Suspense fallback={<div className="min-h-[60vh]" />}>
        <PortfolioGrid items={items} categories={categories} />
      </Suspense>
      <AuditBanner
        eyebrow={audit.eyebrow}
        title={
          <>
            Let&apos;s build something{" "}
            <span className="bg-brand/30 px-1.5 -mx-1 rounded">worth showing off.</span>
          </>
        }
        description={audit.description}
        ctaHref={audit.ctaHref}
        ctaLabel={audit.ctaLabel}
      />
      <PortfolioServicesLink />
      <FaqSection items={faqs} title={<>Portfolio questions</>} />
      <Cta />
    </>
  );
}
