"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Search, Sparkles } from "lucide-react";
import { Section, Container } from "@/components/ui/section";
import { Button } from "@/components/ui/button";

type AuditBannerProps = {
  eyebrow?: string;
  title?: React.ReactNode;
  description?: string;
  ctaHref?: string;
  ctaLabel?: string;
};

export function AuditBanner({
  eyebrow = "Free site audit",
  title = (
    <>
      A no-strings audit of your current site —{" "}
      <span className="bg-lime/40 px-1.5 -mx-1 rounded">delivered in 48 hours.</span>
    </>
  ),
  description = "We'll run your site through our checklist — performance, SEO, accessibility, conversion — and send back a prioritized list of fixes you can ship today.",
  ctaHref = "/contact?service=audit",
  ctaLabel = "Request your free audit",
}: AuditBannerProps) {
  return (
    <Section className="py-12 md:py-16" bleed>
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl border border-border bg-brand text-brand-foreground"
        >
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-15" aria-hidden />
          <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-lime/40 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-24 -left-24 size-72 rounded-full bg-fuchsia-500/30 blur-3xl" aria-hidden />

          <div className="relative grid gap-8 md:grid-cols-12 items-center p-8 md:p-12 lg:p-16">
            <div className="md:col-span-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-foreground/20 bg-brand-foreground/10 px-3 py-1 text-xs font-medium uppercase tracking-wider">
                <Sparkles className="size-3.5" />
                {eyebrow}
              </div>
              <h2 className="mt-5 text-balance text-3xl md:text-5xl font-semibold font-display tracking-tight leading-[1.05]">
                {title}
              </h2>
              <p className="mt-4 max-w-2xl text-base md:text-lg text-brand-foreground/80 leading-relaxed">
                {description}
              </p>
            </div>
            <div className="md:col-span-4 md:text-right">
              <Button asChild size="xl" variant="lime">
                <Link href={ctaHref}>
                  {ctaLabel}
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
              <div className="mt-4 inline-flex items-center gap-2 text-xs text-brand-foreground/70">
                <Search className="size-3.5" />
                Includes 12-point performance + SEO checklist
              </div>
            </div>
          </div>
        </motion.div>
      </Container>
    </Section>
  );
}
