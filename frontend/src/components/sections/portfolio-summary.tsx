"use client";

import { motion } from "framer-motion";
import { Section, Container } from "@/components/ui/section";

const summary = [
  { v: "120+", l: "Projects shipped" },
  { v: "38", l: "Countries served" },
  { v: "$48M", l: "Pipeline influenced" },
  { v: "92%", l: "Retention rate" },
];

export function PortfolioSummary() {
  return (
    <Section className="py-12 md:py-16">
      <Container>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
          {summary.map((s, i) => (
            <motion.div
              key={s.l}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              className="bg-card p-6 md:p-8 text-center"
            >
              <div className="text-3xl md:text-4xl font-semibold font-display tracking-tight">{s.v}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.l}</div>
            </motion.div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
