"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/section";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

type PageBannerProps = {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
  variant?: "default" | "minimal";
};

export function PageBanner({
  eyebrow,
  title,
  description,
  breadcrumbs,
  actions,
  variant = "default",
}: PageBannerProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden",
        variant === "default" ? "pt-12 md:pt-20 pb-16 md:pb-24" : "pt-12 md:pt-16 pb-10"
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-grid mask-fade-edges opacity-50" aria-hidden />
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-[600px] rounded-full bg-brand/10 blur-3xl" aria-hidden />

      <Container className="relative">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav className="mb-8 flex items-center gap-1.5 text-xs text-muted-foreground" aria-label="Breadcrumb">
            <Link href="/" className="inline-flex items-center gap-1 hover:text-foreground">
              <Home className="size-3.5" />
            </Link>
            {breadcrumbs.map((b, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <ChevronRight className="size-3.5" />
                {b.href ? (
                  <Link href={b.href} className="hover:text-foreground">
                    {b.label}
                  </Link>
                ) : (
                  <span className="text-foreground">{b.label}</span>
                )}
              </div>
            ))}
          </nav>
        ) : null}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="max-w-4xl"
        >
          {eyebrow ? (
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span className="size-1.5 rounded-full bg-brand" />
              {eyebrow}
            </div>
          ) : null}
          <h1 className="text-balance text-4xl md:text-6xl lg:text-7xl font-semibold font-display tracking-tight leading-[1.05]">
            {title}
          </h1>
          {description ? (
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground text-pretty leading-relaxed">
              {description}
            </p>
          ) : null}
          {actions ? <div className="mt-8 flex flex-wrap gap-3">{actions}</div> : null}
        </motion.div>
      </Container>
    </section>
  );
}
