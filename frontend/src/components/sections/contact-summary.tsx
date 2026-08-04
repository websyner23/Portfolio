"use client";

import { motion } from "framer-motion";
import { Section, Container } from "@/components/ui/section";
import { Clock, MessageCircleHeart, Send, Sparkles } from "lucide-react";

const items = [
  {
    icon: Send,
    title: "1. You send a message",
    body: "Tell us as much or as little as you have. Either way, we'll come back with the right next question.",
  },
  {
    icon: MessageCircleHeart,
    title: "2. We reply within a day",
    body: "Real reply, written by a human, with a few good questions to make the call useful.",
  },
  {
    icon: Clock,
    title: "3. We meet for 30 minutes",
    body: "We'll learn about your goals and constraints. You'll learn how we work and what it might cost.",
  },
  {
    icon: Sparkles,
    title: "4. You get a fixed quote",
    body: "Within five working days. If we're not the right fit, we'll tell you and point you somewhere good.",
  },
];

export function ContactSummary() {
  return (
    <Section className="py-12 md:py-16">
      <Container>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it, i) => {
            const Icon = it.icon;
            return (
              <motion.div
                key={it.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <div className="flex size-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold font-display">{it.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{it.body}</p>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
