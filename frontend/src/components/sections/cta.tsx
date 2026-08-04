"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Calendar } from "lucide-react";
import { Section, Container } from "@/components/ui/section";
import { Button } from "@/components/ui/button";

type CtaProps = {
  eyebrow?: string;
  title?: React.ReactNode;
  description?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function Cta({
  eyebrow = "Ready when you are",
  title = (
    <>
      Have an idea? Let&apos;s build it{" "}
      <span className="bg-gradient-to-r from-brand to-lime bg-clip-text text-transparent">
        right.
      </span>
    </>
  ),
  description = "Book a 30-minute discovery call and walk away with a clearer roadmap — whether or not we end up working together.",
  primaryHref = "/contact",
  primaryLabel = "Start a project",
  secondaryHref = "/contact#schedule",
  secondaryLabel = "Book a call",
}: CtaProps) {
  return (
    <Section id="cta" className="pt-12 pb-24">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl border border-border bg-primary text-primary-foreground p-10 md:p-16"
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-32 -right-32 size-96 rounded-full bg-brand/30 blur-3xl" />
            <div className="absolute -bottom-32 -left-32 size-96 rounded-full bg-lime/20 blur-3xl" />
            <div className="absolute inset-0 bg-grid opacity-10" />
          </div>

          <div className="relative max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-xs font-medium">
              <span className="size-1.5 rounded-full bg-lime" />
              {eyebrow}
            </div>
            <h2 className="mt-6 text-balance text-4xl md:text-6xl font-semibold font-display tracking-tight leading-[1.05]">
              {title}
            </h2>
            <p className="mt-5 max-w-xl text-base md:text-lg text-primary-foreground/70 leading-relaxed">
              {description}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button asChild size="xl" variant="lime">
                <Link href={primaryHref}>
                  {primaryLabel}
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <Link href={secondaryHref}>
                  <Calendar className="size-4" />
                  {secondaryLabel}
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </Container>
    </Section>
  );
}
