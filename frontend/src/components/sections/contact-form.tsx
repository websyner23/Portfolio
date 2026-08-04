"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import { Section, Container } from "@/components/ui/section";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector, saveDraft, markSubmitted, resetSubmitted } from "@/lib/store";
import { services } from "@/data/services";
import { site } from "@/data/site";
import { cn } from "@/lib/utils";

const budgetOptions = [
  "Under $5k",
  "$5k – $15k",
  "$15k – $40k",
  "$40k – $100k",
  "$100k+",
] as const;

const timelineOptions = ["ASAP", "1–3 months", "3–6 months", "Just exploring"] as const;

const referralOptions = [
  "Google search",
  "LinkedIn",
  "Referral from a friend",
  "Twitter / X",
  "Dribbble or Behance",
  "Past client",
  "Other",
] as const;

const schema = z.object({
  name: z.string().min(2, "Tell us your name"),
  email: z.string().email("Use a valid email"),
  phone: z.string().optional(),
  company: z.string().optional(),
  startDate: z.string().optional(),
  service: z.string().min(1, "Pick a service"),
  budget: z.enum(budgetOptions),
  timeline: z.enum(timelineOptions),
  referral: z.enum(referralOptions),
  message: z.string().min(20, "A bit more detail helps us prepare"),
  consent: z.literal(true, { message: "Required" }),
});

type FormValues = z.infer<typeof schema>;

export function ContactForm() {
  const params = useSearchParams();
  const dispatch = useAppDispatch();
  const submitted = useAppSelector((s) => s.leads.submitted);

  const defaultService = useMemo(() => {
    const fromQuery = params?.get("service");
    if (fromQuery && services.some((s) => s.slug === fromQuery)) {
      return services.find((s) => s.slug === fromQuery)!.title;
    }
    const planQuery = params?.get("plan");
    if (planQuery) return `Plan: ${planQuery}`;
    return "";
  }, [params]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      startDate: "",
      service: defaultService,
      budget: "$5k – $15k",
      timeline: "1–3 months",
      referral: "Google search",
      message: "",
      consent: undefined as unknown as true,
    },
  });

  useEffect(() => {
    if (defaultService) setValue("service", defaultService);
  }, [defaultService, setValue]);

  const watched = watch();
  useEffect(() => {
    if (watched.name || watched.email || watched.message) {
      dispatch(
        saveDraft({
          name: watched.name ?? "",
          email: watched.email ?? "",
          service: watched.service ?? "",
          budget: watched.budget ?? "",
          message: watched.message ?? "",
        })
      );
    }
  }, [watched.name, watched.email, watched.service, watched.budget, watched.message, dispatch]);

  const onSubmit = async (values: FormValues) => {
    await new Promise((r) => setTimeout(r, 900));
    console.log("[contact] submitting", values);
    dispatch(markSubmitted());
    reset();
    setTimeout(() => dispatch(resetSubmitted()), 8000);
  };

  return (
    <Section id="contact-form">
      <Container>
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-border bg-card p-6 md:p-10 relative overflow-hidden">
              <AnimatePresence>
                {submitted && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card/95 backdrop-blur-sm p-8 text-center"
                  >
                    <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                      <CheckCircle2 className="size-8" />
                    </div>
                    <h3 className="mt-5 text-2xl font-semibold font-display">Got it — thank you.</h3>
                    <p className="mt-2 max-w-sm text-muted-foreground leading-relaxed">
                      We&apos;ll review the details and reply within one business day. If it&apos;s urgent, email{" "}
                      <a href={`mailto:${site.email}`} className="text-brand underline">
                        {site.email}
                      </a>
                      .
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mb-7">
                <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Tell us about your project
                </div>
                <h3 className="mt-2 text-2xl md:text-3xl font-semibold font-display">
                  Start the conversation
                </h3>
                <p className="mt-2 text-muted-foreground">
                  We&apos;ll come back within one business day with a few good questions.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Full name" error={errors.name?.message}>
                    <Input placeholder="Jane Doe" {...register("name")} />
                  </Field>
                  <Field label="Email" error={errors.email?.message}>
                    <Input type="email" placeholder="jane@company.com" {...register("email")} />
                  </Field>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Phone" hint="Optional">
                    <Input type="tel" placeholder="+1 (555) 000-0000" {...register("phone")} />
                  </Field>
                  <Field label="Business name" hint="Optional">
                    <Input placeholder="Company Inc." {...register("company")} />
                  </Field>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Preferred start date" hint="Optional">
                    <Input type="date" {...register("startDate")} />
                  </Field>
                  <Field label="What type of project?" error={errors.service?.message}>
                    <Controller
                      control={control}
                      name="service"
                      render={({ field }) => (
                        <select
                          {...field}
                          className="flex h-11 w-full rounded-lg border border-input bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                        >
                          <option value="" disabled>
                            Pick one…
                          </option>
                          {services.map((s) => (
                            <option key={s.slug} value={s.title}>
                              {s.title}
                            </option>
                          ))}
                          <option value="Other / not sure yet">Other / not sure yet</option>
                        </select>
                      )}
                    />
                  </Field>
                </div>

                <Field label="Budget" error={errors.budget?.message}>
                  <Controller
                    control={control}
                    name="budget"
                    render={({ field }) => (
                      <div className="flex flex-wrap gap-2">
                        {budgetOptions.map((b) => (
                          <button
                            key={b}
                            type="button"
                            onClick={() => field.onChange(b)}
                            className={cn(
                              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                              field.value === b
                                ? "border-brand bg-brand text-brand-foreground"
                                : "border-border bg-background text-foreground/80 hover:border-foreground/30"
                            )}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    )}
                  />
                </Field>

                <Field label="Timeline" error={errors.timeline?.message}>
                  <Controller
                    control={control}
                    name="timeline"
                    render={({ field }) => (
                      <div className="flex flex-wrap gap-2">
                        {timelineOptions.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => field.onChange(t)}
                            className={cn(
                              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                              field.value === t
                                ? "border-brand bg-brand text-brand-foreground"
                                : "border-border bg-background text-foreground/80 hover:border-foreground/30"
                            )}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    )}
                  />
                </Field>

                <Field label="How did you hear about us?" error={errors.referral?.message}>
                  <Controller
                    control={control}
                    name="referral"
                    render={({ field }) => (
                      <select
                        {...field}
                        className="flex h-11 w-full rounded-lg border border-input bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                      >
                        {referralOptions.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </Field>

                <Field label="What are you trying to build?" error={errors.message?.message}>
                  <Textarea
                    rows={5}
                    placeholder="The shorter version is fine — we'll dig in on the call. Goals, constraints, and any links help."
                    {...register("message")}
                  />
                </Field>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-border bg-secondary/30 px-4 py-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="size-3.5 text-brand" /> No spam, ever
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="size-3.5 text-brand" /> Reply within 24 hours
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="size-3.5 text-brand" /> 5.0 average rating
                  </span>
                </div>

                <Field error={errors.consent?.message}>
                  <label className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      {...register("consent")}
                      className="mt-0.5 size-4 rounded border-border accent-[var(--brand)]"
                    />
                    <span className="text-muted-foreground">
                      I&apos;m happy for WebSyner to follow up by email about this project. We&apos;ll never share
                      your details.
                    </span>
                  </label>
                </Field>

                <Button type="submit" size="lg" variant="brand" disabled={isSubmitting} className="w-full sm:w-auto">
                  {isSubmitting ? "Sending…" : "Send message"}
                  <ArrowRight className="size-4" />
                </Button>
              </form>
            </div>
          </div>

          <aside className="lg:col-span-5">
            <div className="space-y-4 lg:sticky lg:top-28">
              <ContactCard
                icon={Mail}
                label="Email"
                value={site.email}
                href={`mailto:${site.email}`}
                hint="Replies within 1 business day"
              />
              <ContactCard
                icon={Phone}
                label="Phone"
                value={site.phone}
                href={`tel:${site.phone.replace(/[^+\d]/g, "")}`}
                hint="Mon–Fri, 9 to 5 (your timezone)"
              />
              <ContactCard
                icon={MapPin}
                label="Location"
                value={`${site.address.line1}`}
                hint={site.address.line2}
              />
              <div className="rounded-2xl border border-border bg-secondary/40 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-brand text-brand-foreground">
                    <MessageCircle className="size-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Prefer chat?</div>
                    <div className="text-xs text-muted-foreground">Average response: 20 minutes</div>
                  </div>
                </div>
                <ul className="mt-5 space-y-2 text-sm">
                  {[
                    "Free 30-minute discovery call",
                    "Honest 'is this a fit?' answer",
                    "Fixed-scope quote within a week",
                  ].map((p) => (
                    <li key={p} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-brand" />
                      <span className="text-foreground/85">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </Container>
    </Section>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      {label ? (
        <div className="flex items-center justify-between">
          <Label>{label}</Label>
          {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
        </div>
      ) : null}
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function ContactCard({
  icon: Icon,
  label,
  value,
  href,
  hint,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  href?: string;
  hint?: string;
}) {
  const Content = (
    <>
      <div className="flex size-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
        <Icon className="size-5" />
      </div>
      <div className="flex-1">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-base font-semibold">{value}</div>
        {hint ? <div className="text-xs text-muted-foreground mt-0.5">{hint}</div> : null}
      </div>
    </>
  );
  return href ? (
    <a
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 hover:border-brand/40 transition-colors"
    >
      {Content}
      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </a>
  ) : (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">{Content}</div>
  );
}
