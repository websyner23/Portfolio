import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageBanner } from "@/components/sections/page-banner";
import { ServicesDetailed } from "@/components/sections/services-detailed";
import { Industries } from "@/components/sections/industries";
import { OurApproach } from "@/components/sections/our-approach";
import { Cta } from "@/components/sections/cta";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Strategy, design, engineering, and growth services — delivered by a small senior team accountable end-to-end.",
};

export default function ServicesPage() {
  return (
    <>
      <PageBanner
        eyebrow="Services"
        title={
          <>
            Five practices,{" "}
            <span className="bg-gradient-to-br from-brand to-lime bg-clip-text text-transparent">
              one team
            </span>{" "}
            that owns the outcome.
          </>
        }
        description="Whether you need a focused landing page or a full SaaS product, you get the same senior team — strategy, design, and engineering working as one."
        breadcrumbs={[{ label: "Services" }]}
        actions={
          <>
            <Button asChild size="lg" variant="brand">
              <Link href="/contact">
                Start a project
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/pricing">View pricing</Link>
            </Button>
          </>
        }
      />
      <ServicesDetailed />
      <Industries />
      <OurApproach />
      <Cta />
    </>
  );
}
