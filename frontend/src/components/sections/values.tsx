"use client";

import { motion } from "framer-motion";
import { Container, Section } from "@/components/ui/section";
import { websynerValues } from "@/data/stats";

export function Values() {
  return (
    <Section id="values" className="py-0" bleed>
      <div className="relative overflow-hidden bg-brand text-brand-foreground">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-15" aria-hidden />
        <div className="pointer-events-none absolute -top-40 -right-40 size-96 rounded-full bg-navy/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-40 -left-40 size-96 rounded-full bg-white/15 blur-3xl" aria-hidden />

        <Container className="relative py-20 md:py-28">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-foreground/20 bg-brand-foreground/10 px-3 py-1 text-xs font-medium uppercase tracking-wider">
                <span className="size-1.5 rounded-full bg-brand-foreground" />
                Our values at WebSyner
              </div>
              <h2 className="mt-5 text-balance text-4xl md:text-5xl font-semibold font-display tracking-tight leading-[1.05]">
                Four operating principles, written down, on purpose.
              </h2>
              <p className="mt-5 max-w-md text-base md:text-lg text-brand-foreground/80 leading-relaxed">
                Every studio claims to be different. Here&apos;s the operational stuff we actually do — the things we refuse to compromise on, even when it would be easier.
              </p>
            </div>

            <div className="lg:col-span-7">
              <div className="grid gap-px overflow-hidden rounded-2xl border border-brand-foreground/15 bg-brand-foreground/15 sm:grid-cols-2">
                {websynerValues.map((v, i) => (
                  <motion.div
                    key={v.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className="bg-brand p-6 md:p-7"
                  >
                    <div className="text-xs font-mono opacity-70">/ {String(i + 1).padStart(2, "0")}</div>
                    <h3 className="mt-3 text-lg font-semibold font-display">{v.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-brand-foreground/80">{v.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </div>
    </Section>
  );
}
