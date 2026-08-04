"use client";

import { motion } from "framer-motion";
import {
  Accessibility,
  Gauge,
  ShieldCheck,
  Search,
  GitBranch,
  Smartphone,
  Eye,
  Headphones,
} from "lucide-react";
import { Section, Container, SectionHeading } from "@/components/ui/section";

const items = [
  { icon: Gauge, title: "90+ Lighthouse", body: "Performance budget per page, audited at launch." },
  { icon: Accessibility, title: "WCAG AA accessibility", body: "Keyboard nav, contrast, and screen-reader baseline." },
  { icon: Smartphone, title: "Responsive on every device", body: "Tested across phones, tablets, and 4K monitors." },
  { icon: Search, title: "On-page SEO foundations", body: "Metadata, schema, sitemaps, and search console wiring." },
  { icon: ShieldCheck, title: "Secure by default", body: "HTTPS, headers, dependency hygiene, and audits." },
  { icon: GitBranch, title: "Version-controlled handover", body: "GitHub repo, environments, and CI from day one." },
  { icon: Eye, title: "Analytics + heatmaps", body: "GA4, Plausible, or your tool of choice — wired up." },
  { icon: Headphones, title: "Post-launch support", body: "30+ days of bug-fix and small-tweak window included." },
];

export function IncludedEverywhere() {
  return (
    <Section id="included" className="bg-secondary/30 border-y border-border">
      <Container>
        <SectionHeading
          eyebrow="Included in every plan"
          title={<>Eight things we never charge extra for</>}
          description="The fundamentals that should be in every modern build. They're our floor — and yours."
        />
        <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it, i) => {
            const Icon = it.icon;
            return (
              <motion.div
                key={it.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                className="bg-card p-6 md:p-7"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-brand/10 text-brand-ink">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold font-display">{it.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{it.body}</p>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
