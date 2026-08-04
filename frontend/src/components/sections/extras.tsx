"use client";

import { motion } from "framer-motion";
import { Section, Container, SectionHeading } from "@/components/ui/section";
import { extras } from "@/data/pricing";

export function Extras() {
  return (
    <Section id="extras">
      <Container>
        <SectionHeading
          eyebrow="Extras"
          title={<>Add-ons that pair with any plan</>}
          description="A focused engagement, a maintenance retainer, or a quick audit. Mix and match to match the moment."
        />
        <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
          {extras.map((e, i) => (
            <motion.div
              key={e.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              className="bg-card p-7 md:p-8"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-lg font-semibold font-display">{e.title}</h3>
                <span className="text-base md:text-lg font-semibold text-brand whitespace-nowrap">{e.price}</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{e.description}</p>
            </motion.div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
