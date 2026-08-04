import { Hero } from "@/components/sections/hero";
import { ServicesGrid } from "@/components/sections/services-grid";
import { MoreThan } from "@/components/sections/more-than";
import { WorldMap } from "@/components/sections/world-map";
import { Stats } from "@/components/sections/stats";
import { Values } from "@/components/sections/values";
import { AboutSummary } from "@/components/sections/about-summary";
import { TestimonialsGrid } from "@/components/sections/testimonials-grid";
import { WhyChoose } from "@/components/sections/why-choose";
import { CaseResults } from "@/components/sections/case-results";
import { AuditBanner } from "@/components/sections/audit-banner";
import { FaqSection } from "@/components/sections/faq";
import { Cta } from "@/components/sections/cta";
import { generalFaqs } from "@/data/faqs";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ServicesGrid />
      <MoreThan />
      <WorldMap />
      <Stats />
      <Values />
      <AboutSummary />
      <TestimonialsGrid />
      <WhyChoose />
      <CaseResults />
      <AuditBanner />
      <FaqSection items={generalFaqs.slice(0, 6)} />
      <Cta />
    </>
  );
}
