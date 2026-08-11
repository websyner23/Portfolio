"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Section, Container, SectionHeading } from "@/components/ui/section";
import { statsFallback } from "@/data/stats";
import type { ApiStat } from "@/lib/content";

export function WhyChoose({
  items = statsFallback.filter((s) => s.group === "why-choose"),
}: {
  items?: ApiStat[];
} = {}) {
  return (
    <Section id="why-us">
      <Container>
        <SectionHeading
          eyebrow="Why choose WebSyner"
          title={<>Six reasons clients stay for engagement two</>}
          description="The studio you hire on day one is the studio you'll have on day 100. Here's how we keep that promise."
        />

        <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
          {items.map((w, i) => (
            <motion.div
              key={w.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              className="group relative bg-card p-7 md:p-9 hover:bg-secondary/40 transition-colors"
            >
              <div className="text-xs font-mono text-brand-ink">/ {String(i + 1).padStart(2, "0")}</div>
              <h3 className="mt-4 text-lg md:text-xl font-semibold font-display">{w.title}</h3>
              <p className="mt-3 text-sm md:text-[15px] text-muted-foreground leading-relaxed">{w.description}</p>
              <ArrowRight className="absolute right-7 bottom-7 size-4 text-muted-foreground translate-x-0 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
            </motion.div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
