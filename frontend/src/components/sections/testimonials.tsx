"use client";

import { Star, Quote } from "lucide-react";
import { Section, Container, SectionHeading } from "@/components/ui/section";
import { testimonialsFallback } from "@/data/testimonials";
import type { ApiTestimonial } from "@/lib/content";
import { cn } from "@/lib/utils";

export function Testimonials({
  items = testimonialsFallback,
}: {
  items?: ApiTestimonial[];
} = {}) {
  const half = Math.ceil(items.length / 2);
  const row1 = items.slice(0, half);
  const row2 = items.slice(half).concat(items.slice(0, 1));
  return (
    <Section id="testimonials" className="overflow-hidden bg-secondary/30 border-y border-border">
      <Container>
        <SectionHeading
          eyebrow="Testimonials"
          title={<>What clients say after we ship</>}
          description="Six months after launch is when the real grade comes in. Here's what teams say once the dust settles."
        />
      </Container>

      <div className="space-y-6">
        <Marquee items={row1} duration="55s" />
        <Marquee items={row2} duration="65s" reverse />
      </div>
    </Section>
  );
}

function Marquee({
  items,
  duration = "50s",
  reverse,
}: {
  items: ApiTestimonial[];
  duration?: string;
  reverse?: boolean;
}) {
  return (
    <div
      className="group relative flex overflow-hidden mask-fade-edges hide-scrollbar"
      style={{
        ["--gap" as string]: "1.25rem",
        ["--duration" as string]: duration,
      }}
    >
      <div
        className={cn(
          "flex shrink-0 gap-5 pr-5 animate-marquee group-hover:[animation-play-state:paused]",
          reverse && "[animation-direction:reverse]"
        )}
      >
        {items.concat(items).map((t, i) => (
          <TestimonialCard key={`${t.name}-${i}`} t={t} />
        ))}
      </div>
    </div>
  );
}

function TestimonialCard({ t }: { t: ApiTestimonial }) {
  return (
    <figure className="relative w-[340px] md:w-[420px] shrink-0 rounded-2xl border border-border bg-card p-6 md:p-7 shadow-sm">
      <Quote className="absolute right-6 top-6 size-7 text-muted-foreground/20" aria-hidden />
      <div className="flex items-center gap-1 text-brand-ink">
        {Array.from({ length: t.rating ?? 5 }).map((_, i) => (
          <Star key={i} className="size-4 fill-current" />
        ))}
      </div>
      <blockquote className="mt-4 text-[15px] md:text-base leading-relaxed text-foreground/90">
        “{t.quote}”
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-brand/30 to-navy/20 text-sm font-semibold">
          {t.initials}
        </div>
        <div className="text-sm">
          <div className="font-medium">{t.name}</div>
          <div className="text-muted-foreground">
            {t.role} · {t.company}
          </div>
        </div>
      </figcaption>
    </figure>
  );
}
