"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Section, Container, SectionHeading } from "@/components/ui/section";
import { servicesFallback } from "@/data/services";
import type { ApiService } from "@/lib/content";
import { getIcon } from "@/lib/icon-map";
import { cn } from "@/lib/utils";

export function ServicesGrid({
  id = "services",
  items = servicesFallback,
  eyebrow = "What we do",
  title = "One studio, every layer of the stack",
  description = "From a single landing page to a full SaaS platform — we shape strategy, design, and engineering into one accountable engagement.",
}: {
  id?: string;
  items?: ApiService[];
  eyebrow?: string;
  title?: string;
  description?: string;
}) {
  return (
    <Section id={id} className="bg-secondary/30 border-y border-border">
      <Container>
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          description={description}
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((s, i) => {
            const Icon = getIcon(s.icon);
            return (
              <motion.div
                key={s.slug}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className={cn(
                  "group relative rounded-2xl border border-border bg-background p-6 md:p-8 transition-all hover:border-brand/40 hover:-translate-y-1 hover:shadow-lg"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-brand/10 text-brand-ink">
                    <Icon className="size-6" />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-semibold font-display">{s.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {s.summary}
                </p>
                <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                  <span className="text-xs text-muted-foreground">
                    From <span className="font-semibold text-foreground">{s.startingPrice}</span> · {s.timeline}
                  </span>
                  <Link
                    href={`/services/${s.slug}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-brand-ink opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Details <ArrowUpRight className="size-3.5" />
                  </Link>
                </div>
                <Link href={`/services/${s.slug}`} className="absolute inset-0" aria-label={s.title} />
              </motion.div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
