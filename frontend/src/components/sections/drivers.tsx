"use client";

import { motion } from "framer-motion";
import { Section, Container, SectionHeading } from "@/components/ui/section";
import { drivers } from "@/data/stats";

export function Drivers() {
  return (
    <Section id="drivers" className="bg-secondary/30 border-y border-border">
      <Container>
        <SectionHeading
          eyebrow="What drives us"
          title={<>Four words we use to settle arguments</>}
          description="When we disagree internally — about scope, design, or how to handle a tough conversation — we ask which of these four wins. It usually clears it up fast."
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {drivers.map((d, i) => (
            <motion.div
              key={d.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="rounded-2xl border border-border bg-card p-7 md:p-8"
            >
              <div className="text-5xl md:text-6xl font-semibold font-display text-brand">
                {d.title.charAt(0)}
              </div>
              <h3 className="mt-4 text-lg font-semibold font-display">{d.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{d.description}</p>
            </motion.div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
