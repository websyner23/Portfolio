"use client";

import { motion } from "framer-motion";
import { Section, Container } from "@/components/ui/section";
import { processFallback } from "@/data/process";
import type { ApiProcessStep } from "@/lib/content";

export function ProcessSummary({
  items = processFallback.filter((p) => p.group === "summary"),
}: {
  items?: ApiProcessStep[];
} = {}) {
  return (
    <Section className="py-16 md:py-20">
      <Container>
        <div className="rounded-3xl border border-border bg-card overflow-hidden">
          <div className="grid md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
            {items.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="p-8 md:p-10 text-center"
              >
                <div className="text-3xl md:text-4xl font-semibold font-display tracking-tight">{s.stat}</div>
                <div className="mt-2 text-sm text-muted-foreground">{s.title}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
