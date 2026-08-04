"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Section, Container } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { pricingPlans } from "@/data/pricing";
import { cn } from "@/lib/utils";

export function PricingPlans() {
  return (
    <Section id="plans">
      <Container>
        <div className="grid gap-5 md:grid-cols-3">
          {pricingPlans.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className={cn(
                "relative flex flex-col rounded-3xl border bg-card p-7 md:p-8",
                p.popular ? "border-brand shadow-xl shadow-brand/10" : "border-border"
              )}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-brand text-brand-foreground px-3 py-1 text-xs font-medium shadow">
                  <Sparkles className="size-3.5" />
                  Most chosen
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold font-display">{p.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.blurb}</p>
              </div>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl md:text-5xl font-semibold font-display tracking-tight">{p.price}</span>
                {p.period ? (
                  <span className="text-xs text-muted-foreground">{p.period}</span>
                ) : null}
              </div>
              <ul className="mt-7 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <span
                      className={cn(
                        "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full",
                        p.popular ? "bg-brand text-brand-foreground" : "bg-secondary text-foreground"
                      )}
                    >
                      <Check className="size-3" />
                    </span>
                    <span className="text-foreground/85">{f}</span>
                  </li>
                ))}
              </ul>
              <Button asChild size="lg" variant={p.popular ? "brand" : "outline"} className="mt-8 w-full">
                <Link href={p.cta.href}>{p.cta.label}</Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
