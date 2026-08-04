"use client";

import Link from "next/link";
import { ArrowUpRight, MessageSquareQuote } from "lucide-react";
import { Section, Container } from "@/components/ui/section";
import { Button } from "@/components/ui/button";

export function CustomQuote() {
  return (
    <Section className="py-12 md:py-16">
      <Container>
        <div className="relative overflow-hidden rounded-3xl border border-border bg-secondary/40 p-8 md:p-12">
          <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-brand/15 blur-3xl" />
          <div className="relative grid gap-8 md:grid-cols-12 items-center">
            <div className="md:col-span-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium">
                <MessageSquareQuote className="size-3.5 text-brand-ink" />
                Need something custom?
              </div>
              <h3 className="mt-4 text-2xl md:text-3xl font-semibold font-display tracking-tight">
                Most engagements are scoped, not picked off a shelf.
              </h3>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Tell us about the problem you&apos;re solving and the constraints you&apos;re working with. We&apos;ll come back with a fixed-scope proposal within five working days — or tell you honestly if we&apos;re not the right fit.
              </p>
            </div>
            <div className="md:col-span-4 md:text-right">
              <Button asChild size="lg" variant="brand">
                <Link href="/contact">
                  Get a custom quote
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
