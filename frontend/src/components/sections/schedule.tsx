"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, Globe2, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Section, Container, SectionHeading } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TIMES = ["09:00", "10:30", "13:00", "14:30", "16:00"];
const TZ = ["UTC-8 (PT)", "UTC-5 (ET)", "UTC+0 (GMT)", "UTC+5:30 (IST)", "UTC+8 (SGT)"];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function buildCalendar(year: number, monthIndex: number) {
  const first = new Date(year, monthIndex, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: ({ date: Date; isCurrent: boolean } | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, monthIndex, d), isCurrent: true });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function Schedule() {
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const initialDay = useMemo(() => {
    const d = new Date(today);
    while (d.getDay() === 0 || d.getDay() === 6 || isSameDay(d, today)) {
      d.setDate(d.getDate() + 1);
    }
    return d;
  }, [today]);

  const [view, setView] = useState({ year: initialDay.getFullYear(), month: initialDay.getMonth() });
  const [day, setDay] = useState<Date>(initialDay);
  const [time, setTime] = useState<string>(TIMES[1]);
  const [tz, setTz] = useState<string>(TZ[2]);
  const [confirmed, setConfirmed] = useState(false);

  const cells = useMemo(() => buildCalendar(view.year, view.month), [view]);

  const goPrev = () => {
    setView((v) => {
      const m = v.month === 0 ? 11 : v.month - 1;
      const y = v.month === 0 ? v.year - 1 : v.year;
      return { year: y, month: m };
    });
  };
  const goNext = () => {
    setView((v) => {
      const m = v.month === 11 ? 0 : v.month + 1;
      const y = v.month === 11 ? v.year + 1 : v.year;
      return { year: y, month: m };
    });
  };

  return (
    <Section id="schedule" className="bg-secondary/30 border-y border-border">
      <Container>
        <SectionHeading
          eyebrow="Or just book a call"
          title={<>Pick a time that works for you</>}
          description="A 30-minute, no-pressure intro call. We'll listen, ask the right questions, and let you know if there's a fit."
        />

        <div className="mx-auto max-w-5xl rounded-3xl border border-border bg-card overflow-hidden">
          <div className="grid md:grid-cols-12">
            <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-border bg-gradient-to-br from-brand/8 via-card to-navy/6 p-6 md:p-8">
              <div className="flex size-12 items-center justify-center rounded-xl bg-background border border-border">
                <Calendar className="size-5 text-brand-ink" />
              </div>
              <h3 className="mt-5 text-xl font-semibold font-display">30-min discovery call</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Mon–Fri, with multiple time-zone options. Hosted on Google Meet.
              </p>
              <ul className="mt-6 space-y-2.5 text-sm">
                {[
                  "What you're trying to achieve",
                  "Your timeline and constraints",
                  "Whether we're the right team",
                  "Next steps and pricing direction",
                ].map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-brand-ink" />
                    <span className="text-foreground/85">{b}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="size-3.5" /> 30 minutes · Google Meet
              </div>
            </div>

            <div className="md:col-span-8 p-6 md:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    Step 1 — Pick a date
                  </div>
                  <h4 className="mt-1 text-lg font-semibold font-display">
                    {MONTHS[view.month]} {view.year}
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={goPrev}
                    aria-label="Previous month"
                    className="inline-flex size-9 items-center justify-center rounded-full border border-border hover:border-brand hover:text-brand-ink transition-colors"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    onClick={goNext}
                    aria-label="Next month"
                    className="inline-flex size-9 items-center justify-center rounded-full border border-border hover:border-brand hover:text-brand-ink transition-colors"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-7 gap-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                {WEEKDAYS.map((w) => (
                  <div key={w} className="py-2 text-center">
                    {w}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {cells.map((c, i) => {
                  if (!c) return <div key={i} className="aspect-square" />;
                  const dow = c.date.getDay();
                  const weekend = dow === 0 || dow === 6;
                  const past = c.date < today;
                  const disabled = weekend || past;
                  const selected = isSameDay(c.date, day);
                  return (
                    <button
                      key={i}
                      disabled={disabled}
                      onClick={() => setDay(c.date)}
                      className={cn(
                        "aspect-square flex flex-col items-center justify-center rounded-lg border text-sm transition-colors",
                        selected
                          ? "border-brand bg-brand text-brand-foreground font-semibold"
                          : disabled
                            ? "border-transparent text-muted-foreground/40 cursor-not-allowed"
                            : "border-border bg-background hover:border-brand/40 hover:bg-secondary/40 text-foreground"
                      )}
                    >
                      <span>{c.date.getDate()}</span>
                      {!disabled && !selected && (
                        <span className="mt-0.5 size-1 rounded-full bg-brand/50" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Step 2 — Pick a time
              </div>
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-5 gap-2">
                {TIMES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTime(t)}
                    className={cn(
                      "rounded-lg border py-2.5 text-sm font-medium transition-colors",
                      time === t
                        ? "border-brand bg-brand text-brand-foreground"
                        : "border-border bg-background text-foreground/80 hover:border-foreground/30"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="mt-6 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Step 3 — Your timezone
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {TZ.map((z) => (
                  <button
                    key={z}
                    onClick={() => setTz(z)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      tz === z
                        ? "border-brand bg-brand/10 text-brand-ink"
                        : "border-border bg-background text-foreground/80 hover:border-foreground/30"
                    )}
                  >
                    <Globe2 className="size-3" />
                    {z}
                  </button>
                ))}
              </div>

              <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 border-t border-border pt-5">
                <div className="text-sm">
                  <div className="text-muted-foreground text-xs">You picked</div>
                  <div className="font-medium">
                    {day.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} · {time} · {tz}
                  </div>
                </div>
                <Button
                  onClick={() => setConfirmed(true)}
                  variant="brand"
                  size="lg"
                  className="sm:ml-auto"
                  disabled={confirmed}
                >
                  {confirmed ? "Reserved!" : "Reserve this slot"}
                </Button>
              </div>

              <AnimatePresence>
                {confirmed && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 rounded-xl border border-brand/30 bg-brand/10 px-4 py-3 text-sm text-brand-ink"
                  >
                    Slot reserved. You&apos;ll get a confirmation with a calendar invite within 5 minutes.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
