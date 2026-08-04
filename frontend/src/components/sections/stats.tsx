"use client";

import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";
import { Section, Container } from "@/components/ui/section";
import { homeStats } from "@/data/stats";

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 70, damping: 22 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    if (inView) mv.set(to);
  }, [inView, mv, to]);

  return (
    <span ref={ref} className="tabular-nums">
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  );
}

export function Stats() {
  return (
    <Section className="py-16 md:py-20">
      <Container>
        <div className="rounded-3xl border border-border bg-gradient-to-br from-brand/8 via-background to-lime/8 p-8 md:p-12">
          <div className="grid gap-10 md:grid-cols-4">
            {homeStats.map((s, i) => {
              const numeric = parseInt(s.value, 10);
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                  className="flex items-start gap-4"
                >
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-background border border-border">
                    <Icon className="size-5 text-brand" />
                  </div>
                  <div>
                    <div className="text-3xl md:text-4xl font-semibold font-display tracking-tight">
                      {Number.isFinite(numeric) ? <Counter to={numeric} suffix={s.suffix} /> : `${s.value}${s.suffix ?? ""}`}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Container>
    </Section>
  );
}
