"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Section, Container, SectionHeading } from "@/components/ui/section";
import { portfolio, portfolioCategories, type PortfolioCategory } from "@/data/portfolio";
import { cn } from "@/lib/utils";

export function PortfolioGrid() {
  const [active, setActive] = useState<PortfolioCategory>("All");
  const filtered = active === "All" ? portfolio : portfolio.filter((p) => p.category === active);

  return (
    <Section id="work">
      <Container>
        <SectionHeading
          eyebrow="Selected work"
          title={<>Real projects, real outcomes</>}
          description="A slice of recent work across categories. Every case study includes the constraints, the choices, and the numbers."
        />

        <div className="mb-10 flex flex-wrap items-center justify-center gap-2">
          {portfolioCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium border transition-all",
                active === cat
                  ? "border-brand bg-brand text-brand-foreground shadow-sm shadow-brand/20"
                  : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-foreground/30"
              )}
            >
              {cat}
              <span className="ml-2 text-xs opacity-60">
                {cat === "All" ? portfolio.length : portfolio.filter((p) => p.category === cat).length}
              </span>
            </button>
          ))}
        </div>

        <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((p, i) => (
              <motion.article
                key={p.slug}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.35, delay: i * 0.03 }}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card hover:border-brand/40 transition-colors"
              >
                <div className={cn("relative aspect-[16/11] overflow-hidden bg-gradient-to-br", p.gradient)}>
                  <div className="absolute inset-0 bg-dot opacity-30" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center px-6">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-foreground/60">
                        {p.client}
                      </div>
                      <div className="mt-2 text-xl md:text-2xl font-semibold font-display text-foreground/90 leading-tight">
                        {p.title}
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-background/85 backdrop-blur px-2.5 py-1 text-[11px] font-medium border border-border">
                    {p.category}
                  </div>
                  <div className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-background/85 backdrop-blur px-2.5 py-1 text-[11px] font-mono">
                    {p.year}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-base font-semibold font-display line-clamp-1">{p.client}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {p.summary}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-4 items-center">
                    {p.metrics.slice(0, 2).map((m) => (
                      <div key={m.label}>
                        <div className="text-sm font-semibold font-display text-foreground">
                          {m.value}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {m.label}
                        </div>
                      </div>
                    ))}
                    <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-brand">
                      View website
                      <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      </Container>
    </Section>
  );
}
