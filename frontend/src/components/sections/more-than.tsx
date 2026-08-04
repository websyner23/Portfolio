"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";
import { Section, Container } from "@/components/ui/section";
import { Button } from "@/components/ui/button";

export function MoreThan() {
  return (
    <Section id="more-than">
      <Container>
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-6"
          >
            <div className="relative rounded-3xl border border-border bg-card overflow-hidden shadow-xl shadow-foreground/5">
              <div className="flex items-center gap-2 border-b border-border bg-secondary/40 px-4 py-3">
                <span className="size-2.5 rounded-full bg-destructive/50" />
                <span className="size-2.5 rounded-full bg-brand/70" />
                <span className="size-2.5 rounded-full bg-brand/70" />
                <span className="ml-3 text-xs text-muted-foreground font-mono">studio.websyner.co</span>
              </div>
              <div className="relative aspect-[4/3] bg-gradient-to-br from-brand/15 via-card to-navy/12">
                <div className="absolute inset-0 bg-dot opacity-30" />
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-3 p-6">
                  {[
                    { v: "+312%", l: "Organic revenue" },
                    { v: "98", l: "Lighthouse" },
                    { v: "14 wks", l: "Time to paid" },
                    { v: "+40%", l: "Pipeline lift" },
                  ].map((t, i) => (
                    <motion.div
                      key={t.l}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + i * 0.08, duration: 0.4 }}
                      className="rounded-xl bg-background/85 backdrop-blur border border-border p-4 flex flex-col justify-end"
                    >
                      <div className="text-2xl md:text-3xl font-semibold font-display">{t.v}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wider">{t.l}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-border bg-secondary/30 px-5 py-3">
                <div className="flex items-center gap-1 text-brand-ink">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-3.5 fill-current" />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">Real numbers from recent launches</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span className="size-1.5 rounded-full bg-brand" />
              More than websites
            </div>
            <h2 className="mt-5 text-balance text-3xl md:text-5xl font-semibold font-display tracking-tight leading-[1.05]">
              We design for the metric, not the mockup.
            </h2>
            <p className="mt-5 text-base md:text-lg text-muted-foreground leading-relaxed">
              A pretty site that nobody finds, no one converts on, and your team can&apos;t update is not a win. We pair design and engineering with strategy from day one — so the work moves your business, not just your homepage.
            </p>
            <ul className="mt-6 space-y-3 text-base">
              {[
                "Strategy + design + engineering, one accountable team",
                "Performance budgets and Lighthouse audits at launch",
                "CMS your team can edit without calling us",
                "Built-in analytics and conversion baselines",
              ].map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <span className="mt-1 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand-ink">
                    <ArrowRight className="size-3" />
                  </span>
                  <span className="text-foreground/85">{p}</span>
                </li>
              ))}
            </ul>
            <Button asChild size="lg" variant="brand" className="mt-8">
              <Link href="/about">More about how we work</Link>
            </Button>
          </motion.div>
        </div>
      </Container>
    </Section>
  );
}
