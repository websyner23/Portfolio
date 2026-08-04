"use client";

import { motion } from "framer-motion";
import { Section, Container, SectionHeading } from "@/components/ui/section";
import { processSteps } from "@/data/process";
import { Check } from "lucide-react";

export function ProcessSteps() {
  return (
    <Section id="process">
      <Container>
        <SectionHeading
          eyebrow="Our process"
          title={<>Six phases, one accountable team</>}
          description="The same end-to-end process that delivered our last 100 launches. Predictable from the outside, flexible inside."
        />

        <div className="relative">
          <div className="pointer-events-none absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-border md:-translate-x-1/2" aria-hidden />
          <div className="space-y-12 md:space-y-20">
            {processSteps.map((p, i) => {
              const Icon = p.icon;
              const reverse = i % 2 === 1;
              return (
                <motion.div
                  key={p.step}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.5 }}
                  className="relative grid md:grid-cols-2 gap-6 md:gap-12 items-center"
                >
                  <div className={`md:order-${reverse ? "2" : "1"} pl-16 md:pl-0 ${reverse ? "md:pr-12 md:text-right" : "md:pl-12"}`}>
                    <div className={`flex items-center gap-3 ${reverse ? "md:justify-end" : ""}`}>
                      <div className="text-xs font-mono text-muted-foreground">{p.step}</div>
                      <div className="text-xs font-medium text-brand-ink">{p.duration}</div>
                    </div>
                    <h3 className="mt-3 text-2xl md:text-3xl font-semibold font-display tracking-tight">{p.title}</h3>
                    <p className="mt-3 text-base text-muted-foreground leading-relaxed">{p.description}</p>
                    <ul className={`mt-5 grid gap-2 sm:grid-cols-2 ${reverse ? "md:[direction:rtl]" : ""}`}>
                      {p.bullets.map((b) => (
                        <li
                          key={b}
                          className={`flex items-start gap-2 text-sm text-foreground/85 [direction:ltr]`}
                        >
                          <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand-ink">
                            <Check className="size-3" />
                          </span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={`md:order-${reverse ? "1" : "2"}`}>
                    <div className={`relative ${reverse ? "md:mr-auto" : "md:ml-auto"} max-w-md`}>
                      <div className="aspect-[4/3] rounded-2xl border border-border bg-gradient-to-br from-brand/10 via-card to-navy/8 p-8 flex items-center justify-center overflow-hidden">
                        <Icon className="size-24 md:size-32 text-brand-ink/60" strokeWidth={1.2} />
                      </div>
                    </div>
                  </div>

                  <span className="absolute left-0 md:left-1/2 top-2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 flex size-12 items-center justify-center rounded-full bg-brand text-brand-foreground font-mono text-sm font-semibold shadow-lg shadow-brand/20">
                    {p.step}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Container>
    </Section>
  );
}
