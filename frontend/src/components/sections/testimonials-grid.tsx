"use client";

import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { Section, Container, SectionHeading } from "@/components/ui/section";
import { testimonialsFallback } from "@/data/testimonials";
import type { ApiTestimonial } from "@/lib/content";

type Props = {
  eyebrow?: string;
  title?: React.ReactNode;
  description?: string;
  count?: number;
  items?: ApiTestimonial[];
};

export function TestimonialsGrid({
  eyebrow = "Client testimonials",
  title = <>What clients say after we ship</>,
  description = "Six months after launch is when the real grade comes in. Here's what teams say once the dust settles.",
  count = 3,
  items: source = testimonialsFallback,
}: Props) {
  const items = source.slice(0, count);
  return (
    <Section id="testimonials">
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} description={description} />
        <div className="grid gap-5 md:grid-cols-3">
          {items.map((t, i) => (
            <TestimonialCard key={t.name} t={t} delay={i * 0.06} />
          ))}
        </div>
      </Container>
    </Section>
  );
}

function TestimonialCard({ t, delay = 0 }: { t: ApiTestimonial; delay?: number }) {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4, delay }}
      className="relative rounded-2xl border border-border bg-card p-7 shadow-sm hover:border-brand/40 transition-colors"
    >
      <Quote className="absolute right-6 top-6 size-7 text-muted-foreground/20" aria-hidden />
      <div className="flex items-center gap-1 text-brand-ink">
        {Array.from({ length: t.rating ?? 5 }).map((_, i) => (
          <Star key={i} className="size-4 fill-current" />
        ))}
      </div>
      <blockquote className="mt-4 text-[15px] md:text-base leading-relaxed text-foreground/90">
        “{t.quote}”
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5">
        <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-brand/30 to-navy/20 text-sm font-semibold">
          {t.initials}
        </div>
        <div className="text-sm">
          <div className="font-semibold">{t.name}</div>
          <div className="text-muted-foreground text-xs">
            {t.role} · {t.company}
          </div>
        </div>
      </figcaption>
    </motion.figure>
  );
}
