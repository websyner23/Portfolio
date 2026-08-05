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
import { getFaqs, getSections, getServices, sectionValue } from "@/lib/content";

export default async function HomePage() {
  const [faqs, services, sections] = await Promise.all([
    getFaqs("general"),
    getServices(),
    getSections("home"),
  ]);

  return (
    <>
      <Hero />
      <ServicesGrid
        items={services}
        eyebrow={sectionValue(sections, "services", "eyebrow", "What we do")}
        title={sectionValue(sections, "services", "title", "One studio, every layer of the stack")}
        description={sectionValue(
          sections,
          "services",
          "description",
          "From a single landing page to a full SaaS platform — we shape strategy, design, and engineering into one accountable engagement."
        )}
      />
      <MoreThan />
      <WorldMap />
      <Stats />
      <Values />
      <AboutSummary />
      <TestimonialsGrid />
      <WhyChoose />
      <CaseResults />
      <AuditBanner />
      <FaqSection items={faqs.slice(0, 6)} />
      <Cta />
    </>
  );
}
