"use client";

import { motion } from "framer-motion";
import { MessagesSquare, Eye, Activity, FileSearch } from "lucide-react";
import { Section, Container } from "@/components/ui/section";

const items = [
  {
    icon: MessagesSquare,
    title: "Project workspace",
    body: "A shared Slack channel and a Linear project. You see every commit, comment, and decision in real time — no email blackouts.",
  },
  {
    icon: Eye,
    title: "100% visibility",
    body: "Live preview deployments on every change. Designs in Figma, code in GitHub, status in Linear. Nothing happens off-camera.",
  },
  {
    icon: Activity,
    title: "Weekly cadence",
    body: "A short Loom on Friday and a 30-minute live sync on Monday. You always know what shipped and what's next.",
  },
  {
    icon: FileSearch,
    title: "Open by default",
    body: "Your contract, scope, and changelog live in one place you can read at any time. No surprise scope creep.",
  },
];

export function PeaceOfMind() {
  return (
    <Section className="py-0" bleed>
      <div className="relative overflow-hidden bg-brand text-brand-foreground">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-15" aria-hidden />
        <div className="pointer-events-none absolute -top-40 -right-40 size-96 rounded-full bg-lime/30 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-40 -left-40 size-96 rounded-full bg-fuchsia-500/30 blur-3xl" aria-hidden />

        <Container className="relative py-20 md:py-28">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-foreground/20 bg-brand-foreground/10 px-3 py-1 text-xs font-medium uppercase tracking-wider">
                <span className="size-1.5 rounded-full bg-lime" />
                Peace of mind
              </div>
              <h2 className="mt-5 text-balance text-3xl md:text-5xl font-semibold font-display tracking-tight leading-[1.05]">
                You see everything we&apos;re working on, whenever you want.
              </h2>
              <p className="mt-5 max-w-md text-base md:text-lg text-brand-foreground/80 leading-relaxed">
                The biggest reason agency engagements go sideways is information asymmetry. We solve it with a tooling stack designed to keep nothing hidden — from kickoff to launch.
              </p>
            </div>

            <div className="lg:col-span-7 grid gap-px overflow-hidden rounded-2xl border border-brand-foreground/15 bg-brand-foreground/15 sm:grid-cols-2">
              {items.map((it, i) => {
                const Icon = it.icon;
                return (
                  <motion.div
                    key={it.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className="bg-brand p-6 md:p-7"
                  >
                    <div className="flex size-10 items-center justify-center rounded-lg bg-brand-foreground/15">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold font-display">{it.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-brand-foreground/80">{it.body}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </Container>
      </div>
    </Section>
  );
}
