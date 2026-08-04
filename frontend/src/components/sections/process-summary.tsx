"use client";

import { motion } from "framer-motion";
import { Section, Container } from "@/components/ui/section";
import { processSummary } from "@/data/process";

export function ProcessSummary() {
  return (
    <Section className="py-16 md:py-20">
      <Container>
        <div className="rounded-3xl border border-border bg-card overflow-hidden">
          <div className="grid md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
            {processSummary.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="p-8 md:p-10 text-center"
              >
                <div className="text-3xl md:text-4xl font-semibold font-display tracking-tight">{s.stat}</div>
                <div className="mt-2 text-sm text-muted-foreground">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
