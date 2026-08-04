"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Section, Container } from "@/components/ui/section";
import { testimonials } from "@/data/testimonials";

export function PricingTestimonial() {
  const t = testimonials[0];
  return (
    <Section className="py-0" bleed>
      <div className="relative overflow-hidden bg-brand text-brand-foreground">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-15" aria-hidden />
        <div className="pointer-events-none absolute -top-32 -left-32 size-72 rounded-full bg-lime/30 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-32 -right-32 size-72 rounded-full bg-fuchsia-500/30 blur-3xl" aria-hidden />

        <Container className="relative py-16 md:py-20">
          <motion.figure
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="flex items-center justify-center gap-1 text-amber-300">
              {Array.from({ length: t.rating ?? 5 }).map((_, i) => (
                <Star key={i} className="size-5 fill-current" />
              ))}
            </div>
            <blockquote className="mt-5 text-balance text-2xl md:text-3xl font-display font-semibold leading-snug">
              “{t.quote}”
            </blockquote>
            <figcaption className="mt-6 text-sm">
              <div className="font-semibold">{t.name}</div>
              <div className="text-brand-foreground/70">
                {t.role} · {t.company}
              </div>
            </figcaption>
          </motion.figure>
        </Container>
      </div>
    </Section>
  );
}
