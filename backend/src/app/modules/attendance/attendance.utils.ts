import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";

/**
 * Attendance maths for an overnight shift (default 10:00 PM – 1:00 AM).
 *
 * Every calculation is done in the company timezone even though timestamps are
 * stored in UTC — computing in server-local time would shift shift-date
 * attribution and silently corrupt payroll.
 */

export type TShiftRules = {
  shiftStart: string; // "22:00"
  shiftEnd: string; // "01:00"
  overnightCutoff: string; // "06:00"
  graceMinutes: number;
  requiredDailyMinutes: number;
  optionalWeekdays: number[]; // 0=Sun … 6=Sat
  timezone: string;
};

const MINUTE = 60 * 1000;

const parseHhMm = (value: string): [number, number] => {
  const [h, m] = value.split(":").map(Number);
  return [h || 0, m || 0];
};

const pad = (n: number) => String(n).padStart(2, "0");

/** Local calendar date (YYYY-MM-DD) of an instant, in the company timezone. */
export const localDateOf = (at: Date, timezone: string): string =>
  formatInTimeZone(at, timezone, "yyyy-MM-dd");

export const addDaysToISO = (iso: string, days: number): string => {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate()
  )}`;
};

/** Weekday of a YYYY-MM-DD string: 0 = Sunday … 6 = Saturday. */
export const weekdayOfISO = (iso: string): number => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};

/** The UTC instant of a local wall-clock time on a given shift date. */
export const instantAt = (
  isoDate: string,
  hhmm: string,
  timezone: string
): Date => fromZonedTime(`${isoDate} ${hhmm}:00`, timezone);

/**
 * Which shift a punch belongs to.
 *
 * A punch whose local time is before the overnight cutoff (06:00) belongs to
 * the *previous* day's shift — so clocking out at 12:40 AM on the 5th is still
 * the 4th's shift.
 */
export const resolveShiftDate = (
  at: Date,
  rules: Pick<TShiftRules, "overnightCutoff" | "timezone">
): string => {
  const local = toZonedTime(at, rules.timezone);
  const [cutoffH, cutoffM] = parseHhMm(rules.overnightCutoff);

  const minutesIntoDay = local.getHours() * 60 + local.getMinutes();
  const cutoffMinutes = cutoffH * 60 + cutoffM;

  const localDate = localDateOf(at, rules.timezone);
  return minutesIntoDay < cutoffMinutes ? addDaysToISO(localDate, -1) : localDate;
};

/**
 * Minutes late relative to shift start plus the grace period.
 * Never negative — arriving early is not credited.
 */
export const calculateLateMinutes = (
  firstPunchIn: Date,
  shiftDate: string,
  rules: TShiftRules
): number => {
  const start = instantAt(shiftDate, rules.shiftStart, rules.timezone);
  const deadline = new Date(start.getTime() + rules.graceMinutes * MINUTE);
  const diff = Math.floor((firstPunchIn.getTime() - deadline.getTime()) / MINUTE);
  return Math.max(0, diff);
};

export type TSession = { in: Date; out?: Date | null };
export type TBreak = { start: Date; end?: Date | null };

/** Total worked minutes across sessions; open sessions contribute nothing. */
export const calculateWorkedMinutes = (sessions: TSession[]): number =>
  sessions.reduce((total, session) => {
    if (!session.out) return total;
    const span = session.out.getTime() - session.in.getTime();
    return total + Math.max(0, Math.floor(span / MINUTE));
  }, 0);

/** Total minutes spent on breaks; an open break contributes nothing yet. */
export const calculateBreakMinutes = (breaks: TBreak[]): number =>
  breaks.reduce((total, entry) => {
    if (!entry.end) return total;
    const span = entry.end.getTime() - entry.start.getTime();
    return total + Math.max(0, Math.floor(span / MINUTE));
  }, 0);

/**
 * Time actually worked: session time minus breaks, never below zero.
 * This is the figure the required-hours rule and payroll are judged against.
 */
export const calculateNetWorkedMinutes = (
  sessions: TSession[],
  breaks: TBreak[] = []
): number =>
  Math.max(0, calculateWorkedMinutes(sessions) - calculateBreakMinutes(breaks));

/**
 * The instant a shift ends. When shiftEnd is earlier than shiftStart the shift
 * runs past midnight, so the end lands on the following day.
 */
export const shiftEndInstant = (shiftDate: string, rules: TShiftRules): Date => {
  const [startH, startM] = parseHhMm(rules.shiftStart);
  const [endH, endM] = parseHhMm(rules.shiftEnd);
  const crossesMidnight = endH * 60 + endM <= startH * 60 + startM;

  return instantAt(
    crossesMidnight ? addDaysToISO(shiftDate, 1) : shiftDate,
    rules.shiftEnd,
    rules.timezone
  );
};

export const isOptionalDay = (isoDate: string, rules: TShiftRules): boolean =>
  rules.optionalWeekdays.includes(weekdayOfISO(isoDate));

export type TAttendanceStatus =
  | "present"
  | "late"
  | "incomplete"
  | "absent"
  | "leave"
  | "optional-off";

/**
 * Status for a worked day. Optional days never count as late or incomplete —
 * weekend work is a bonus, not an obligation.
 */
export const deriveStatus = (
  shiftDate: string,
  workedMinutes: number,
  lateMinutes: number,
  rules: TShiftRules
): TAttendanceStatus => {
  if (isOptionalDay(shiftDate, rules)) return "optional-off";
  if (workedMinutes < rules.requiredDailyMinutes) return "incomplete";
  if (lateMinutes > 0) return "late";
  return "present";
};

/**
 * Working days in a month for one employee: every non-optional date inside
 * their employment window, up to and including `upTo`.
 */
export const scheduledDatesInMonth = (
  month: string, // YYYY-MM
  rules: TShiftRules,
  employment: { joinDate?: string; lastWorkingDate?: string },
  upTo: string
): string[] => {
  const [year, monthNumber] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();

  const dates: string[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = `${year}-${pad(monthNumber)}-${pad(day)}`;

    if (isOptionalDay(iso, rules)) continue;
    if (iso > upTo) continue;
    if (employment.joinDate && iso < employment.joinDate) continue;
    if (employment.lastWorkingDate && iso > employment.lastWorkingDate) continue;

    dates.push(iso);
  }
  return dates;
};

export type TMonthlyTotals = {
  scheduledDays: number;
  presentDays: number;
  lateDays: number;
  incompleteDays: number;
  leaveDays: number;
  absentDays: number;
  optionalDaysWorked: number;
  totalWorkMinutes: number;
  attendancePct: number;
  bonusEligible: boolean;
};

/**
 * Rolls daily records into the monthly figures shown on the dashboard.
 *
 * The perfect-attendance bonus requires a clean month: every scheduled day
 * attended, on time, in full, with no leave. Optional-day work is counted in
 * total hours but never affects eligibility.
 */
export const summariseMonth = (
  records: { shiftDate: string; status: TAttendanceStatus; workedMinutes: number }[],
  scheduledDates: string[]
): TMonthlyTotals => {
  const scheduled = new Set(scheduledDates);

  let presentDays = 0;
  let lateDays = 0;
  let incompleteDays = 0;
  let leaveDays = 0;
  let optionalDaysWorked = 0;
  let totalWorkMinutes = 0;

  for (const record of records) {
    totalWorkMinutes += record.workedMinutes;

    if (!scheduled.has(record.shiftDate)) {
      if (record.workedMinutes > 0) optionalDaysWorked += 1;
      continue;
    }

    switch (record.status) {
      case "present":
        presentDays += 1;
        break;
      case "late":
        lateDays += 1;
        break;
      case "incomplete":
        incompleteDays += 1;
        break;
      case "leave":
        leaveDays += 1;
        break;
      default:
        break;
    }
  }

  const scheduledDays = scheduledDates.length;
  const attended = presentDays + lateDays + incompleteDays;
  const absentDays = Math.max(0, scheduledDays - attended - leaveDays);

  return {
    scheduledDays,
    presentDays,
    lateDays,
    incompleteDays,
    leaveDays,
    absentDays,
    optionalDaysWorked,
    totalWorkMinutes,
    attendancePct:
      scheduledDays === 0 ? 0 : Math.round((attended / scheduledDays) * 100),
    bonusEligible:
      scheduledDays > 0 &&
      lateDays === 0 &&
      absentDays === 0 &&
      leaveDays === 0 &&
      incompleteDays === 0,
  };
};

/** Formats minutes as the h:mm the HRM sheet uses (e.g. 185 → "3:05"). */
export const formatMinutes = (minutes: number): string =>
  `${Math.floor(minutes / 60)}:${pad(minutes % 60)}`;
