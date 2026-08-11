import type { Metadata } from "next";
import { Suspense } from "react";
import { PageBanner } from "@/components/sections/page-banner";
import { ContactForm } from "@/components/sections/contact-form";
import { Schedule } from "@/components/sections/schedule";
import { ContactSummary } from "@/components/sections/contact-summary";
import { TestimonialsGrid } from "@/components/sections/testimonials-grid";
import { Cta } from "@/components/sections/cta";
import { getServices, getSiteSettings, getTestimonials } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Tell us about your project. We'll reply within one business day with thoughtful questions and a clear next step.",
};

export default async function ContactPage() {
  const [services, testimonials, settings] = await Promise.all([
    getServices(),
    getTestimonials(),
    getSiteSettings(),
  ]);

  return (
    <>
      <PageBanner
        eyebrow="Get in touch"
        title={
          <>
            Let&apos;s talk about{" "}
            <span className="bg-gradient-to-br from-brand-ink to-foreground bg-clip-text text-transparent">
              what you&apos;re building.
            </span>
          </>
        }
        description="Fill the form, send us an email, or grab a slot directly. We answer real messages, written by real humans, within one business day."
        breadcrumbs={[{ label: "Contact" }]}
      />
      <Suspense fallback={<div className="container-page py-20" />}>
        <ContactForm services={services} settings={settings} />
      </Suspense>
      <Schedule />
      <ContactSummary />
      <TestimonialsGrid
        eyebrow="Still on the fence?"
        title={<>What others say about WebSyner</>}
        description="Honest words from teams who finished a project with us in the last twelve months."
        count={3}
      />
      <Cta />
    </>
  );
}
