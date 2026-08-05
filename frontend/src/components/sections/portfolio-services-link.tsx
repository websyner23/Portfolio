"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Section, Container, SectionHeading } from "@/components/ui/section";
import { servicesFallback } from "@/data/services";
import type { ApiService } from "@/lib/content";
import { getIcon } from "@/lib/icon-map";

export function PortfolioServicesLink({
  items = servicesFallback,
}: {
  items?: ApiService[];
}) {
  return (
    <Section id="explore-services" className="bg-secondary/30 border-y border-border">
      <Container>
        <SectionHeading
          eyebrow="Explore our services"
          title={<>Each project lives inside a service practice</>}
          description="Pick a practice to see what's involved, what's included, and what it costs."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {items.map((s, i) => {
            const Icon = getIcon(s.icon);
            return (
              <motion.div
                key={s.slug}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
              >
                <Link
                  href={`/services/${s.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 hover:border-brand/40 transition-colors"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-brand/10 text-brand-ink">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold font-display">{s.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2 flex-1">{s.short}</p>
                  <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-brand-ink">
                    Details
                    <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
