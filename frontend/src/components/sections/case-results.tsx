"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, TrendingUp } from "lucide-react";
import { Section, Container, SectionHeading } from "@/components/ui/section";
import { cn } from "@/lib/utils";

const cases = [
  {
    metric: "+40%",
    label: "Pipeline lift",
    client: "Northwind Logistics",
    type: "Web Design",
    body: "Replaced a slow WordPress build with a Next.js front-end and a CMS the marketing team owns end-to-end.",
    slug: "northwind-logistics",
    grad: "from-brand/28 via-brand/10 to-navy/25",
  },
  {
    metric: "+312%",
    label: "Organic revenue",
    client: "Cobalt Outdoors",
    type: "SEO Program",
    body: "Built topical authority around camping and overlanding. Organic now drives more than a third of revenue.",
    slug: "cobalt-outdoors-seo",
    grad: "from-navy/28 via-brand/12 to-brand/28",
  },
  {
    metric: "14 wks",
    label: "Zero to paid",
    client: "Foreground.ai",
    type: "SaaS Product",
    body: "End-to-end product partnership for an AI annotation tool. Brand, app, billing, and marketing site shipped.",
    slug: "foreground-ai-saas",
    grad: "from-brand/22 via-navy/15 to-navy/28",
  },
];

export function CaseResults() {
  return (
    <Section id="results">
      <Container>
        <SectionHeading
          eyebrow="Recent results"
          title={<>Three numbers we&apos;re happy to be measured by</>}
          description="A snapshot of what shipped in the last twelve months. Full case studies on the portfolio page."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {cases.map((c, i) => (
            <motion.article
              key={c.slug}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.07 }}
              className={cn(
                "group relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br p-7 md:p-8 hover:border-brand/40 transition-colors",
                c.grad
              )}
            >
              <div className="absolute inset-0 bg-dot opacity-30 -z-10" />
              <div className="flex items-center gap-2 text-xs font-medium text-brand-ink">
                <TrendingUp className="size-3.5" />
                {c.type}
              </div>
              <div className="mt-5 text-5xl md:text-6xl font-semibold font-display tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
                {c.metric}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{c.label}</div>
              <div className="mt-6 border-t border-border pt-5">
                <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  {c.client}
                </div>
                <p className="mt-2 text-sm md:text-[15px] leading-relaxed text-foreground/85">{c.body}</p>
              </div>
              <Link
                href={`/portfolio`}
                className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-brand-ink opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Read case study
                <ArrowUpRight className="size-3.5" />
              </Link>
              <Link href={`/portfolio`} className="absolute inset-0" aria-label={c.client} />
            </motion.article>
          ))}
        </div>
      </Container>
    </Section>
  );
}
