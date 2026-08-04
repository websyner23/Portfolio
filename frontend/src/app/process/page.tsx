import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageBanner } from "@/components/sections/page-banner";
import { ProcessSummary } from "@/components/sections/process-summary";
import { ProcessSteps } from "@/components/sections/process-steps";
import { PeaceOfMind } from "@/components/sections/peace-of-mind";
import { AfterLaunch } from "@/components/sections/after-launch";
import { FaqSection } from "@/components/sections/faq";
import { Cta } from "@/components/sections/cta";
import { Button } from "@/components/ui/button";
import { processFaqs } from "@/data/faqs";

export const metadata: Metadata = {
  title: "Process",
  description:
    "How we run engagements at WebSyner — from discovery to launch and beyond. Predictable, transparent, accountable.",
};

export default function ProcessPage() {
  return (
    <>
      <PageBanner
        eyebrow="How we work"
        title={
          <>
            A process that feels{" "}
            <span className="bg-gradient-to-br from-brand to-lime bg-clip-text text-transparent">
              quiet
            </span>{" "}
            on purpose.
          </>
        }
        description="No surprise invoices, no late-night fire drills. We've run this same process for over 100 launches — every phase has a clear owner, deliverable, and exit criteria so you always know where you stand."
        breadcrumbs={[{ label: "Process" }]}
        actions={
          <Button asChild size="lg" variant="brand">
            <Link href="/contact">
              Start a project
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        }
      />
      <ProcessSummary />
      <ProcessSteps />
      <PeaceOfMind />
      <AfterLaunch />
      <FaqSection items={processFaqs} title={<>How engagements actually run</>} />
      <Cta />
    </>
  );
}
