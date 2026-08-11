"use client";

import { motion } from "framer-motion";
import { Section, Container, SectionHeading } from "@/components/ui/section";
import { statsFallback } from "@/data/stats";
import type { ApiStat } from "@/lib/content";
import { Badge } from "@/components/ui/badge";

export function Industries({
  items = statsFallback.filter((s) => s.group === "industries"),
}: {
  items?: ApiStat[];
} = {}) {
  return (
    <Section id="industries" className="bg-secondary/30 border-y border-border">
      <Container>
        <SectionHeading
          eyebrow="Industries we serve"
          title={<>Generalists with deep pockets of expertise</>}
          description="We've worked across enough industries to bring fresh thinking, and stayed deep enough in a few to know your edge cases."
        />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="flex flex-wrap justify-center gap-3"
        >
          {items.map((entry) => {
            const i = entry.label ?? "";
            return (
            <Badge
              key={i}
              variant="outline"
              className="px-5 py-2 text-sm hover:border-brand hover:bg-brand/5 hover:text-brand-ink cursor-default transition-colors"
            >
              {i}
            </Badge>
            );
          })}
        </motion.div>
      </Container>
    </Section>
  );
}
