"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { ArrowUpRight, Sparkles, Star, Clock, BadgeCheck, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/section";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { servicesFallback } from "@/data/services";
import { submitLead } from "@/lib/client-api";

const quoteSchema = z.object({
  name: z.string().min(2, "Your name"),
  email: z.string().email("Valid email"),
  service: z.string().min(1, "Pick one"),
  message: z.string().min(10, "A few words"),
});
type QuoteValues = z.infer<typeof quoteSchema>;

export function Hero({
  services = servicesFallback,
}: {
  services?: { slug: string; title: string }[];
} = {}) {
  return (
    <section className="relative overflow-hidden pt-12 pb-24 md:pt-16 md:pb-28">
      <div className="pointer-events-none absolute inset-0 bg-grid mask-fade-edges opacity-50" aria-hidden />
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 size-[680px] rounded-full bg-brand/10 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-40 right-0 size-[420px] rounded-full bg-navy/8 blur-3xl" aria-hidden />

      <Container className="relative">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-brand opacity-75 animate-ping" />
                <span className="relative inline-flex size-2 rounded-full bg-brand" />
              </span>
              Booking projects starting May 2026
            </div>

            <h1 className="text-balance text-5xl font-semibold tracking-tight md:text-6xl lg:text-7xl font-display leading-[1.05]">
              Smart sites.{" "}
              <span className="relative whitespace-nowrap">
                <span className="bg-gradient-to-br from-brand-ink to-foreground bg-clip-text text-transparent">
                  Solid craft.
                </span>
              </span>
              <br />
              Real results.
            </h1>

            <p className="mt-6 max-w-xl text-lg text-muted-foreground text-pretty leading-relaxed">
              WebSyner is a senior, remote-first studio building modern websites, brands, and software for ambitious teams worldwide.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button asChild size="xl" variant="brand">
                <Link href="#hero-quote">
                  Get a free quote
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline">
                <Link href="/portfolio">See our work</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="lg:col-span-5"
            id="hero-quote"
          >
            <QuoteForm services={services} />
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

function QuoteForm({
  services,
}: {
  services: { slug: string; title: string }[];
}) {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
  } = useForm<QuoteValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: { name: "", email: "", service: "", message: "" },
  });

  const onSubmit = async (values: QuoteValues) => {
    setSubmitError(null);

    const result = await submitLead({
      type: "quick-quote",
      name: values.name,
      email: values.email,
      service: values.service,
      message: values.message,
      sourcePage: "/",
    });

    if (!result.ok) {
      Object.entries(result.error.fields ?? {}).forEach(([field, message]) => {
        setError(field as keyof QuoteValues, { type: "server", message });
      });
      setSubmitError(result.error.message);
      return;
    }

    setSubmitted(true);
    reset();
    setTimeout(() => setSubmitted(false), 6000);
  };

  return (
    <div className="relative rounded-3xl border border-border bg-card p-6 md:p-7 shadow-xl shadow-foreground/5">
      <div className="absolute -top-3 left-6 inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-brand-foreground shadow-md shadow-brand/30">
        <Sparkles className="size-3.5" />
        Free 30-min consultation
      </div>

      <div className="mb-5">
        <h3 className="text-xl font-semibold font-display">Get a free quote</h3>
        <p className="mt-1 text-sm text-muted-foreground">No commitment. Real reply within one business day.</p>
      </div>

      {submitted ? (
        <div className="flex flex-col items-center justify-center text-center py-10">
          <div className="flex size-14 items-center justify-center rounded-full bg-brand/15 text-brand-ink">
            <CheckCircle2 className="size-7" />
          </div>
          <h4 className="mt-4 text-lg font-semibold font-display">Thanks — we&apos;ll be in touch.</h4>
          <p className="mt-1 text-sm text-muted-foreground">Check your inbox within 24 hours.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Your name" {...register("name")} aria-invalid={!!errors.name} />
            <Input placeholder="Email" type="email" {...register("email")} aria-invalid={!!errors.email} />
          </div>
          <select
            {...register("service")}
            defaultValue=""
            className="flex h-11 w-full rounded-lg border border-input bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="" disabled>
              What service do you need?
            </option>
            {services.map((s) => (
              <option key={s.slug} value={s.title}>
                {s.title}
              </option>
            ))}
            <option>Not sure yet</option>
          </select>
          <Textarea rows={3} placeholder="Briefly, what are you trying to build?" {...register("message")} />

          {(errors.name || errors.email || errors.service || errors.message) && (
            <p className="text-xs text-destructive">Please fill the required fields.</p>
          )}

          {submitError && (
            <p role="alert" className="text-xs text-destructive">
              {submitError}
            </p>
          )}

          <Button type="submit" variant="brand" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Sending…" : "Send your quote request"}
            <Send className="size-4" />
          </Button>

          <div className="flex items-center justify-center gap-3 pt-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <BadgeCheck className="size-3 text-brand-ink" /> No spam
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3 text-brand-ink" /> 24h reply
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Star className="size-3 fill-brand-ink text-brand-ink" /> 5.0 rating
            </span>
          </div>
        </form>
      )}
    </div>
  );
}
