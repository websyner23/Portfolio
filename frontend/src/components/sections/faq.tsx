"use client";

import Link from "next/link";
import { Section, Container, SectionHeading } from "@/components/ui/section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type { Faq } from "@/data/faqs";
import { ArrowUpRight } from "lucide-react";

type FaqProps = {
  id?: string;
  eyebrow?: string;
  title?: React.ReactNode;
  description?: string;
  items: Faq[];
  ctaHref?: string;
  ctaLabel?: string;
};

export function FaqSection({
  id = "faq",
  eyebrow = "FAQ",
  title = <>Questions, asked and answered</>,
  description = "Most of what people want to know before kicking off — if your question isn't here, just ask.",
  items,
  ctaHref = "/contact",
  ctaLabel = "Ask your question",
}: FaqProps) {
  return (
    <Section id={id}>
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <SectionHeading
              eyebrow={eyebrow}
              title={title}
              description={description}
              align="left"
              className="lg:sticky lg:top-28 mb-8"
            />
            <Button asChild variant="outline" className="hidden lg:inline-flex">
              <Link href={ctaHref}>
                {ctaLabel}
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="lg:col-span-7">
            <Accordion type="single" collapsible className="rounded-2xl border border-border bg-card px-6 md:px-8">
              {items.map((f, i) => (
                <AccordionItem key={f.q} value={`item-${i}`} className="last:border-0">
                  <AccordionTrigger>{f.q}</AccordionTrigger>
                  <AccordionContent>{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <div className="lg:hidden mt-6">
              <Button asChild variant="outline">
                <Link href={ctaHref}>
                  {ctaLabel}
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
