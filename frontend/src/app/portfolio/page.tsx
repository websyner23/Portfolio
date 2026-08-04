import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageBanner } from "@/components/sections/page-banner";
import { PortfolioSummary } from "@/components/sections/portfolio-summary";
import { PortfolioGrid } from "@/components/sections/portfolio-grid";
import { AuditBanner } from "@/components/sections/audit-banner";
import { PortfolioServicesLink } from "@/components/sections/portfolio-services-link";
import { FaqSection } from "@/components/sections/faq";
import { Cta } from "@/components/sections/cta";
import { Button } from "@/components/ui/button";
import { portfolioFaqs } from "@/data/faqs";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Selected case studies — websites, brands, and software shipped for ambitious teams across the world.",
};

export default function PortfolioPage() {
  return (
    <>
      <PageBanner
        eyebrow="Portfolio"
        title={
          <>
            Work we&apos;re{" "}
            <span className="bg-gradient-to-br from-brand to-lime bg-clip-text text-transparent">
              proud of
            </span>{" "}
            and willing to talk about.
          </>
        }
        description="A selection of recent case studies — the constraints, the decisions, the outcomes. Many more under NDA; happy to walk through them on a call."
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
      <PortfolioGrid />
      <AuditBanner
        eyebrow="Want to see your business here?"
        title={
          <>
            Let&apos;s build something{" "}
            <span className="bg-lime/40 px-1.5 -mx-1 rounded">worth showing off.</span>
          </>
        }
        description="Get a free quote today and join our growing list of happy clients. Most projects start within two weeks."
        ctaHref="/contact"
        ctaLabel="Start your project"
      />
      <PortfolioServicesLink />
      <FaqSection items={portfolioFaqs} title={<>Portfolio questions</>} />
      <Cta />
    </>
  );
}
