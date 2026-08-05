"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe2,
  Loader2,
} from "lucide-react";
import { Section, Container, SectionHeading } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  bookMeeting,
  getAvailability,
  type Availability,
} from "@/lib/client-api";
import { cn } from "@/lib/utils";

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

const pad = (n: number) => String(n).padStart(2, "0");
const toISODate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function buildCalendar(year: number, monthIndex: number) {
  const first = new Date(year, monthIndex, 1);
  const startOffset = (first.getDay() + 6) % 7; // weeks start on Monday
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const cells: ({ date: Date; iso: string } | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, monthIndex, d);
    cells.push({ date, iso: toISODate(date) });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** Best-effort guess so the timezone selector starts on the visitor's zone. */
const guessTimezone = (options: string[]) => {
  try {
    const local = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (options.includes(local)) return local;
  } catch {
    /* Intl unavailable — fall through to the first option */
  }
  return options[0] ?? "";
};

export function Schedule() {
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const [view, setView] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [timezone, setTimezone] = useState("");

  const [details, setDetails] = useState({ name: "", email: "", topic: "" });
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{
    date: string;
    time: string;
    timezone: string;
  } | null>(null);

  const monthKey = `${view.year}-${pad(view.month + 1)}`;

  // Availability is fetched per month so navigating the calendar stays cheap.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void getAvailability(monthKey).then((data) => {
      if (cancelled) return;
      setAvailability(data);
      setLoading(false);
      if (!data) return;

      setTimezone((current) => current || guessTimezone(data.timezones));
      setSelectedDate((current) => {
        if (current && data.days.some((d) => d.date === current && d.available)) {
          return current;
        }
        return data.days.find((d) => d.available)?.date ?? null;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [monthKey]);

  const cells = useMemo(
    () => buildCalendar(view.year, view.month),
    [view.year, view.month]
  );

  const dayLookup = useMemo(() => {
    const map = new Map<string, Availability["days"][number]>();
    availability?.days.forEach((d) => map.set(d.date, d));
    return map;
  }, [availability]);

  const activeDay = selectedDate ? dayLookup.get(selectedDate) : undefined;

  // Reset the chosen time whenever it stops being offered on the selected day.
  useEffect(() => {
    if (!activeDay) {
      setSelectedTime(null);
      return;
    }
    setSelectedTime((current) => {
      if (current && activeDay.slots.some((s) => s.time === current && s.available)) {
        return current;
      }
      return activeDay.slots.find((s) => s.available)?.time ?? null;
    });
  }, [activeDay]);

  const shiftMonth = (delta: number) => {
    setView((v) => {
      const next = new Date(v.year, v.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  };

  const canGoBack =
    view.year > today.getFullYear() ||
    (view.year === today.getFullYear() && view.month > today.getMonth());

  const readyToBook =
    Boolean(selectedDate) &&
    Boolean(selectedTime) &&
    Boolean(timezone) &&
    details.name.trim().length >= 2 &&
    /\S+@\S+\.\S+/.test(details.email);

  const onReserve = async () => {
    if (!readyToBook || !selectedDate || !selectedTime) return;

    setBooking(true);
    setError(null);

    const result = await bookMeeting({
      name: details.name.trim(),
      email: details.email.trim(),
      topic: details.topic.trim() || undefined,
      date: selectedDate,
      time: selectedTime,
      timezone,
    });

    setBooking(false);

    if (!result.ok) {
      setError(result.error.message);
      // The slot may have been taken while the visitor filled in the form.
      const refreshed = await getAvailability(monthKey);
      if (refreshed) setAvailability(refreshed);
      return;
    }

    setConfirmed({
      date: result.data.date,
      time: result.data.time,
      timezone: result.data.timezone,
    });
    setDetails({ name: "", email: "", topic: "" });
  };

  const prettyDate = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

  return (
    <Section id="schedule" className="bg-secondary/30 border-y border-border">
      <Container>
        <SectionHeading
          eyebrow="Or just book a call"
          title={<>Pick a time that works for you</>}
          description="A 30-minute, no-pressure intro call. We'll listen, ask the right questions, and let you know if there's a fit."
        />

        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-border bg-card">
          <div className="grid md:grid-cols-12">
            {/* Left — what the call covers */}
            <div className="border-b border-border bg-gradient-to-br from-brand/8 via-card to-navy/6 p-6 md:col-span-4 md:border-b-0 md:border-r md:p-8">
              <div className="flex size-12 items-center justify-center rounded-xl border border-border bg-background">
                <Calendar className="size-5 text-brand-ink" />
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold">
                {availability?.durationMins ?? 30}-min discovery call
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Pick any open slot. You&apos;ll get an email confirmation with
                the meeting link once we approve it.
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
                <Clock className="size-3.5" />
                {availability?.durationMins ?? 30} minutes · online
              </div>
            </div>

            {/* Right — booking flow */}
            <div className="p-6 md:col-span-8 md:p-8">
              {confirmed ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex min-h-95 flex-col items-center justify-center text-center"
                >
                  <div className="flex size-16 items-center justify-center rounded-full bg-brand/15 text-brand-ink">
                    <Check className="size-8" />
                  </div>
                  <h4 className="mt-5 font-display text-2xl font-semibold">
                    Your slot is requested
                  </h4>
                  <p className="mt-2 max-w-sm leading-relaxed text-muted-foreground">
                    <strong className="text-foreground">
                      {prettyDate(confirmed.date)} at {confirmed.time}
                    </strong>{" "}
                    ({confirmed.timezone}). We&apos;ve emailed you a copy and
                    will confirm with a meeting link shortly.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-6"
                    onClick={() => setConfirmed(null)}
                  >
                    Book another time
                  </Button>
                </motion.div>
              ) : (
                <>
                  {/* Step 1 — date */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                        Step 1 — Pick a date
                      </div>
                      <h4 className="mt-1 font-display text-lg font-semibold">
                        {MONTHS[view.month]} {view.year}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => shiftMonth(-1)}
                        disabled={!canGoBack}
                        aria-label="Previous month"
                        className="flex size-9 items-center justify-center rounded-lg border border-border transition-colors hover:border-foreground/30 disabled:opacity-40"
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => shiftMonth(1)}
                        aria-label="Next month"
                        className="flex size-9 items-center justify-center rounded-lg border border-border transition-colors hover:border-foreground/30"
                      >
                        <ChevronRight className="size-4" />
                      </button>
                    </div>
                  </div>

                  <div className="relative mt-5">
                    {loading && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-card/70 backdrop-blur-sm">
                        <Loader2 className="size-5 animate-spin text-brand-ink" />
                      </div>
                    )}

                    <div className="grid grid-cols-7 gap-1 text-center">
                      {WEEKDAYS.map((w) => (
                        <div
                          key={w}
                          className="py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
                        >
                          {w}
                        </div>
                      ))}

                      {cells.map((cell, i) => {
                        if (!cell) return <div key={`empty-${i}`} />;

                        const info = dayLookup.get(cell.iso);
                        const isAvailable = Boolean(info?.available);
                        const isSelected = selectedDate === cell.iso;

                        return (
                          <button
                            key={cell.iso}
                            type="button"
                            disabled={!isAvailable}
                            onClick={() => setSelectedDate(cell.iso)}
                            aria-pressed={isSelected}
                            className={cn(
                              "flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition-all",
                              isSelected
                                ? "bg-brand font-semibold text-brand-foreground shadow-sm shadow-brand/20"
                                : isAvailable
                                  ? "border border-border hover:border-brand/50 hover:text-brand-ink"
                                  : "cursor-not-allowed text-muted-foreground/40"
                            )}
                          >
                            <span>{cell.date.getDate()}</span>
                            {isAvailable && !isSelected && (
                              <span className="mt-0.5 size-1 rounded-full bg-brand/50" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 2 — time */}
                  <div className="mt-7">
                    <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                      Step 2 — Pick a time
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(activeDay?.slots ?? []).map((slot) => (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setSelectedTime(slot.time)}
                          aria-pressed={selectedTime === slot.time}
                          className={cn(
                            "rounded-full border px-4 py-2 text-sm transition-all",
                            selectedTime === slot.time
                              ? "border-brand bg-brand font-medium text-brand-foreground"
                              : slot.available
                                ? "border-border hover:border-brand/50 hover:text-brand-ink"
                                : "cursor-not-allowed border-border text-muted-foreground/40 line-through"
                          )}
                        >
                          {slot.time}
                        </button>
                      ))}
                      {!loading && (activeDay?.slots ?? []).length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          Pick an available date to see open times.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Step 3 — timezone */}
                  <div className="mt-6">
                    <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                      Step 3 — Your timezone
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(availability?.timezones ?? []).map((z) => (
                        <button
                          key={z}
                          type="button"
                          onClick={() => setTimezone(z)}
                          aria-pressed={timezone === z}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all",
                            timezone === z
                              ? "border-brand bg-brand/10 font-medium text-brand-ink"
                              : "border-border text-muted-foreground hover:border-foreground/30"
                          )}
                        >
                          <Globe2 className="size-3" />
                          {z.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 4 — details */}
                  <div className="mt-6">
                    <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                      Step 4 — Your details
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <Input
                        placeholder="Your name"
                        value={details.name}
                        onChange={(e) =>
                          setDetails((d) => ({ ...d, name: e.target.value }))
                        }
                      />
                      <Input
                        type="email"
                        placeholder="Email"
                        value={details.email}
                        onChange={(e) =>
                          setDetails((d) => ({ ...d, email: e.target.value }))
                        }
                      />
                    </div>
                    <Textarea
                      rows={2}
                      className="mt-3"
                      placeholder="What would you like to talk about? (optional)"
                      value={details.topic}
                      onChange={(e) =>
                        setDetails((d) => ({ ...d, topic: e.target.value }))
                      }
                    />
                  </div>

                  {/* Confirm */}
                  <div className="mt-7 flex flex-col items-stretch gap-3 border-t border-border pt-5 sm:flex-row sm:items-center">
                    <div className="text-sm">
                      <div className="text-xs text-muted-foreground">You picked</div>
                      <div className="font-medium">
                        {selectedDate && selectedTime
                          ? `${prettyDate(selectedDate)} · ${selectedTime} · ${timezone}`
                          : "Choose a date and time"}
                      </div>
                    </div>
                    <Button
                      onClick={onReserve}
                      variant="brand"
                      size="lg"
                      className="sm:ml-auto"
                      disabled={!readyToBook || booking}
                    >
                      {booking ? "Reserving…" : "Reserve this slot"}
                    </Button>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.p
                        role="alert"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                      >
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
