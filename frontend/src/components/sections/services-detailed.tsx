"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Check } from "lucide-react";
import { Section, Container } from "@/components/ui/section";
import { servicesFallback } from "@/data/services";
import type { ApiService } from "@/lib/content";
import { getIcon } from "@/lib/icon-map";

export function ServicesDetailed({
  items = servicesFallback,
}: {
  items?: ApiService[];
}) {
  return (
    <Section id="services">
      <Container>
        <div className="space-y-6 md:space-y-8">
          {items.map((s, i) => {
            const Icon = getIcon(s.icon);
            const reverse = i % 2 === 1;
            return (
              <motion.article
                key={s.slug}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5 }}
                className="grid gap-8 md:grid-cols-12 items-center rounded-3xl border border-border bg-card p-6 md:p-10 hover:border-brand/40 transition-colors"
              >
                <div className={`md:col-span-7 ${reverse ? "md:order-2" : ""}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-brand/10 text-brand-ink">
                      <Icon className="size-5" />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">
                      0{i + 1} / Service
                    </span>
                  </div>
                  <h3 className="mt-5 text-2xl md:text-3xl lg:text-4xl font-semibold font-display tracking-tight leading-tight">
                    {s.title}
                  </h3>
                  <p className="mt-4 text-base text-muted-foreground leading-relaxed">{s.summary}</p>
                  <ul className="mt-6 grid sm:grid-cols-2 gap-2.5">
                    {s.outcomes.map((o) => (
                      <li key={o} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 size-4 shrink-0 text-brand-ink" />
                        <span className="text-foreground/85">{o}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                    <span className="text-muted-foreground">
                      From <span className="font-semibold text-foreground">{s.startingPrice}</span>
                    </span>
                    <span className="text-muted-foreground">{s.timeline}</span>
                    <Link
                      href={`/services/${s.slug}`}
                      className="ml-auto inline-flex items-center gap-1 font-medium text-brand-ink hover:underline"
                    >
                      Service details <ArrowUpRight className="size-4" />
                    </Link>
                  </div>
                </div>

                <div className={`md:col-span-5 ${reverse ? "md:order-1" : ""}`}>
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-border bg-gradient-to-br from-brand/15 via-card to-navy/12 flex items-center justify-center">
                    <div className="absolute inset-0 bg-dot opacity-30" />
                    <div className="relative grid grid-cols-2 gap-3 p-6 max-w-xs">
                      {s.techHighlights.slice(0, 4).map((t) => (
                        <div
                          key={t}
                          className="rounded-lg bg-background/80 backdrop-blur-sm border border-border px-3 py-2 text-xs font-mono text-center"
                        >
                          {t}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
