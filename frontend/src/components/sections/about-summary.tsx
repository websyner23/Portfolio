"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Section, Container, SectionHeading } from "@/components/ui/section";
import { Button } from "@/components/ui/button";

const points = [
  "A senior team — no junior bait-and-switch",
  "Fixed-scope quotes with no hidden fees",
  "You own the code, the brand, and the docs",
  "Live preview deployments on every change",
];

export function AboutSummary() {
  return (
    <Section id="about">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7"
          >
            <SectionHeading
              eyebrow="About WebSyner"
              align="left"
              title={
                <>
                  A boutique studio that <span className="text-brand">treats your business like ours</span>.
                </>
              }
              description="We're a small group of senior designers, engineers, and strategists working with founders and growth teams who want their digital presence to actually move the business forward. We turn down work that isn't a fit so the work we take stays excellent."
              className="mb-8 max-w-2xl"
            />

            <ul className="grid sm:grid-cols-2 gap-3 mb-10">
              {points.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand" />
                  <span className="text-foreground/85">{p}</span>
                </li>
              ))}
            </ul>

            <Button asChild variant="outline" size="lg">
              <Link href="/about">
                More about us
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-5"
          >
            <div className="grid grid-cols-2 gap-4">
              {[
                { v: "12+", l: "Years combined craft", grad: "from-brand/20 to-fuchsia-500/10" },
                { v: "120+", l: "Projects shipped", grad: "from-lime/20 to-emerald-400/10" },
                { v: "38", l: "Countries served", grad: "from-cyan-400/20 to-sky-400/10" },
                { v: "92%", l: "Client retention", grad: "from-amber-400/20 to-orange-400/10" },
              ].map((s) => (
                <div
                  key={s.l}
                  className={`relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${s.grad} p-6`}
                >
                  <div className="text-3xl md:text-4xl font-semibold font-display tracking-tight">{s.v}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{s.l}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </Container>
    </Section>
  );
}
