"use client";

import { motion } from "framer-motion";
import { Section, Container, SectionHeading } from "@/components/ui/section";
import { Brain, MessageSquare, Gauge, Repeat } from "lucide-react";

const approach = [
  {
    icon: Brain,
    title: "Strategy first, pixels second",
    body: "We start every engagement with a goal map. Design and engineering decisions are downstream of that map.",
  },
  {
    icon: MessageSquare,
    title: "Async by default, live when it matters",
    body: "Loom over Zoom. We respect deep work — yours and ours. Live syncs are reserved for decisions, not status.",
  },
  {
    icon: Gauge,
    title: "Performance is a feature",
    body: "Fast experiences convert. We design and build with explicit performance budgets you can audit anytime.",
  },
  {
    icon: Repeat,
    title: "Built to be iterated on",
    body: "Component-driven, well-typed, well-tested. Future-you (and your engineers) will not curse us.",
  },
];

export function OurApproach() {
  return (
    <Section id="approach">
      <Container>
        <SectionHeading
          eyebrow="Our approach"
          title={<>Four habits that make our work different</>}
          description="They sound simple. They're remarkably hard to do consistently. We do."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {approach.map((a, i) => {
            const Icon = a.icon;
            return (
              <motion.div
                key={a.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="rounded-2xl border border-border bg-card p-7 md:p-8 flex gap-5"
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand-ink">
                  <Icon className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold font-display">{a.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{a.body}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
