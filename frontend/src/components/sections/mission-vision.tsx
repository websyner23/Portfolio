"use client";

import { motion } from "framer-motion";
import { Target, Telescope } from "lucide-react";
import { Section, Container } from "@/components/ui/section";

export function MissionVision() {
  return (
    <Section className="border-y border-border bg-secondary/30">
      <Container>
        <div className="grid gap-6 lg:grid-cols-2">
          {[
            {
              icon: Target,
              eyebrow: "Our mission",
              title: "Make excellent digital craft accessible to ambitious teams.",
              body:
                "Most companies don't need a 40-person agency. They need a small, senior team that takes their goals seriously, ships on time, and leaves things in better shape than they found them. That's the gap WebSyner exists to fill.",
              grad: "from-brand/20 via-fuchsia-500/10 to-transparent",
            },
            {
              icon: Telescope,
              eyebrow: "Our vision",
              title: "A world where shipping great software feels like a relief, not a risk.",
              body:
                "We want every founder and team we work with to look back at a launch and say 'that was easier than I expected.' We're building toward a studio reputation where the answer to 'who should we hire?' is obvious.",
              grad: "from-lime/25 via-emerald-400/10 to-transparent",
            },
          ].map(({ icon: Icon, eyebrow, title, body, grad }, i) => (
            <motion.div
              key={eyebrow}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              className={`relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br ${grad} bg-card p-8 md:p-12`}
            >
              <div className="flex size-14 items-center justify-center rounded-2xl bg-background border border-border">
                <Icon className="size-6 text-brand" />
              </div>
              <div className="mt-6 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                {eyebrow}
              </div>
              <h3 className="mt-3 text-2xl md:text-3xl font-semibold font-display tracking-tight leading-tight">
                {title}
              </h3>
              <p className="mt-5 text-base text-muted-foreground leading-relaxed">{body}</p>
            </motion.div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
