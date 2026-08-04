import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageBanner } from "@/components/sections/page-banner";
import { PricingPlans } from "@/components/sections/pricing-plans";
import { CustomQuote } from "@/components/sections/custom-quote";
import { IncludedEverywhere } from "@/components/sections/included-everywhere";
import { Extras } from "@/components/sections/extras";
import { Compare } from "@/components/sections/compare";
import { PricingTestimonial } from "@/components/sections/pricing-testimonial";
import { FaqSection } from "@/components/sections/faq";
import { Cta } from "@/components/sections/cta";
import { Button } from "@/components/ui/button";
import { pricingFaqs } from "@/data/faqs";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Honest, fixed-scope pricing. Three core plans, optional add-ons, and a clear path to a custom quote.",
};

export default function PricingPage() {
  return (
    <>
      <PageBanner
        eyebrow="Pricing"
        title={
          <>
            Honest pricing, no{" "}
            <span className="bg-gradient-to-br from-brand-ink to-foreground bg-clip-text text-transparent">
              surprises.
            </span>
          </>
        }
        description="Every quote is fixed-scope and itemized. Three core plans cover most engagements, and we&apos;ll happily build a custom one if your project doesn&apos;t fit cleanly."
        breadcrumbs={[{ label: "Pricing" }]}
        actions={
          <Button asChild size="lg" variant="brand">
            <Link href="/contact">
              Get a quote
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        }
      />
      <PricingPlans />
      <CustomQuote />
      <Extras />
      <IncludedEverywhere />
      <Compare />
      <PricingTestimonial />
      <FaqSection items={pricingFaqs} title={<>Pricing questions, answered</>} />
      <Cta />
    </>
  );
}
