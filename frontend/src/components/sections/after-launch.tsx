"use client";

import { motion } from "framer-motion";
import { Section, Container, SectionHeading } from "@/components/ui/section";
import { afterLaunch } from "@/data/process";
import { Sparkles } from "lucide-react";

export function AfterLaunch() {
  return (
    <Section id="after-launch" className="bg-secondary/30 border-y border-border">
      <Container>
        <SectionHeading
          eyebrow="After launch"
          title={<>The part most agencies forget</>}
          description="Launch is the start of the work, not the end. Here's what staying in business looks like together once the site is live."
        />

        <div className="grid gap-4 md:grid-cols-2">
          {afterLaunch.map((a, i) => (
            <motion.div
              key={a.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="group flex gap-5 rounded-2xl border border-border bg-card p-6 md:p-8 hover:border-brand/40 transition-colors"
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand-ink">
                <Sparkles className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold font-display">{a.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{a.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
