import {
  addDaysToISO,
  calculateLateMinutes,
  calculateWorkedMinutes,
  deriveStatus,
  formatMinutes,
  instantAt,
  isOptionalDay,
  resolveShiftDate,
  scheduledDatesInMonth,
  shiftEndInstant,
  summariseMonth,
  weekdayOfISO,
  type TShiftRules,
} from "../app/modules/attendance/attendance.utils";

/** Company defaults: 10 PM–1 AM shift, 6 AM cutoff, Fri/Sat optional. */
const RULES: TShiftRules = {
  shiftStart: "22:00",
  shiftEnd: "01:00",
  overnightCutoff: "06:00",
  graceMinutes: 10,
  requiredDailyMinutes: 180,
  optionalWeekdays: [5, 6],
  timezone: "Asia/Dhaka",
};

/** Builds a UTC instant from a Dhaka wall-clock time (Dhaka is UTC+6). */
const dhaka = (iso: string, hhmm: string) => instantAt(iso, hhmm, RULES.timezone);

describe("Shift-date attribution (the 6 AM overnight cutoff)", () => {
  it("keeps an evening punch on the same day", () => {
    expect(resolveShiftDate(dhaka("2026-08-10", "22:00"), RULES)).toBe("2026-08-10");
  });

  it("attributes an after-midnight punch to the previous day", () => {
    expect(resolveShiftDate(dhaka("2026-08-11", "00:40"), RULES)).toBe("2026-08-10");
  });

  it("attributes 05:59 to the previous day (just inside the cutoff)", () => {
    expect(resolveShiftDate(dhaka("2026-08-11", "05:59"), RULES)).toBe("2026-08-10");
  });

  it("attributes 06:00 to the same day (the cutoff boundary itself)", () => {
    expect(resolveShiftDate(dhaka("2026-08-11", "06:00"), RULES)).toBe("2026-08-11");
  });

  it("attributes 06:01 to the same day", () => {
    expect(resolveShiftDate(dhaka("2026-08-11", "06:01"), RULES)).toBe("2026-08-11");
  });

  it("rolls back across a month boundary", () => {
    expect(resolveShiftDate(dhaka("2026-09-01", "01:00"), RULES)).toBe("2026-08-31");
  });

  it("rolls back across a year boundary", () => {
    expect(resolveShiftDate(dhaka("2026-01-01", "02:00"), RULES)).toBe("2025-12-31");
  });

  it("is timezone-aware, not server-local", () => {
    // 21:00 UTC on the 10th is 03:00 Dhaka on the 11th → the 10th's shift.
    const utcInstant = new Date("2026-08-10T21:00:00Z");
    expect(resolveShiftDate(utcInstant, RULES)).toBe("2026-08-10");
  });
});

describe("Late calculation with grace period", () => {
  it("counts an on-time arrival as zero", () => {
    expect(
      calculateLateMinutes(dhaka("2026-08-10", "22:00"), "2026-08-10", RULES)
    ).toBe(0);
  });

  it("does not credit arriving early", () => {
    expect(
      calculateLateMinutes(dhaka("2026-08-10", "21:30"), "2026-08-10", RULES)
    ).toBe(0);
  });

  it("treats arrival inside the grace window as on time", () => {
    expect(
      calculateLateMinutes(dhaka("2026-08-10", "22:09"), "2026-08-10", RULES)
    ).toBe(0);
  });

  it("treats the exact end of the grace window as on time", () => {
    expect(
      calculateLateMinutes(dhaka("2026-08-10", "22:10"), "2026-08-10", RULES)
    ).toBe(0);
  });

  it("counts minutes past the grace window", () => {
    expect(
      calculateLateMinutes(dhaka("2026-08-10", "22:25"), "2026-08-10", RULES)
    ).toBe(15);
  });

  it("handles a zero-grace configuration", () => {
    const strict = { ...RULES, graceMinutes: 0 };
    expect(
      calculateLateMinutes(dhaka("2026-08-10", "22:05"), "2026-08-10", strict)
    ).toBe(5);
  });
});

describe("Worked minutes", () => {
  it("sums a single completed session", () => {
    expect(
      calculateWorkedMinutes([
        { in: dhaka("2026-08-10", "22:00"), out: dhaka("2026-08-11", "01:00") },
      ])
    ).toBe(180);
  });

  it("sums multiple sessions in one shift", () => {
    expect(
      calculateWorkedMinutes([
        { in: dhaka("2026-08-10", "22:00"), out: dhaka("2026-08-10", "23:30") },
        { in: dhaka("2026-08-11", "00:00"), out: dhaka("2026-08-11", "01:00") },
      ])
    ).toBe(150);
  });

  it("ignores a session that is still open", () => {
    expect(
      calculateWorkedMinutes([
        { in: dhaka("2026-08-10", "22:00"), out: dhaka("2026-08-10", "23:00") },
        { in: dhaka("2026-08-11", "00:00") },
      ])
    ).toBe(60);
  });

  it("returns zero for no sessions", () => {
    expect(calculateWorkedMinutes([])).toBe(0);
  });
});

describe("Shift end", () => {
  it("lands on the next day when the shift crosses midnight", () => {
    const end = shiftEndInstant("2026-08-10", RULES);
    expect(end.toISOString()).toBe(dhaka("2026-08-11", "01:00").toISOString());
  });

  it("stays on the same day for a daytime shift", () => {
    const dayShift = { ...RULES, shiftStart: "09:00", shiftEnd: "17:00" };
    const end = shiftEndInstant("2026-08-10", dayShift);
    expect(end.toISOString()).toBe(dhaka("2026-08-10", "17:00").toISOString());
  });
});

describe("Optional days (Friday and Saturday)", () => {
  it("identifies weekday numbers correctly", () => {
    expect(weekdayOfISO("2026-08-07")).toBe(5); // Friday
    expect(weekdayOfISO("2026-08-08")).toBe(6); // Saturday
    expect(weekdayOfISO("2026-08-09")).toBe(0); // Sunday
  });

  it("flags Friday and Saturday as optional", () => {
    expect(isOptionalDay("2026-08-07", RULES)).toBe(true);
    expect(isOptionalDay("2026-08-08", RULES)).toBe(true);
  });

  it("treats Sunday to Thursday as working days", () => {
    ["2026-08-09", "2026-08-10", "2026-08-11", "2026-08-12", "2026-08-13"].forEach(
      (iso) => expect(isOptionalDay(iso, RULES)).toBe(false)
    );
  });
});

describe("Daily status", () => {
  it("marks a full on-time day present", () => {
    expect(deriveStatus("2026-08-10", 180, 0, RULES)).toBe("present");
  });

  it("marks a full but late day late", () => {
    expect(deriveStatus("2026-08-10", 180, 12, RULES)).toBe("late");
  });

  it("marks a short day incomplete regardless of lateness", () => {
    expect(deriveStatus("2026-08-10", 120, 0, RULES)).toBe("incomplete");
    expect(deriveStatus("2026-08-10", 120, 30, RULES)).toBe("incomplete");
  });

  it("never penalises optional-day work", () => {
    expect(deriveStatus("2026-08-07", 60, 45, RULES)).toBe("optional-off");
  });
});

describe("Scheduled days in a month", () => {
  it("excludes Fridays and Saturdays", () => {
    const dates = scheduledDatesInMonth("2026-08", RULES, {}, "2026-08-31");
    expect(dates).not.toContain("2026-08-07");
    expect(dates).not.toContain("2026-08-08");
    expect(dates).toContain("2026-08-10");
  });

  it("stops at the given upper bound", () => {
    const dates = scheduledDatesInMonth("2026-08", RULES, {}, "2026-08-10");
    expect(dates.at(-1)).toBe("2026-08-10");
    expect(dates).not.toContain("2026-08-11");
  });

  it("starts from the employee's join date", () => {
    const dates = scheduledDatesInMonth(
      "2026-08",
      RULES,
      { joinDate: "2026-08-12" },
      "2026-08-31"
    );
    expect(dates).not.toContain("2026-08-10");
    expect(dates[0]).toBe("2026-08-12");
  });

  it("stops at the employee's last working date", () => {
    const dates = scheduledDatesInMonth(
      "2026-08",
      RULES,
      { lastWorkingDate: "2026-08-13" },
      "2026-08-31"
    );
    expect(dates.at(-1)).toBe("2026-08-13");
  });

  it("handles February in a leap year", () => {
    const dates = scheduledDatesInMonth("2024-02", RULES, {}, "2024-02-29");
    expect(dates).toContain("2024-02-29");
  });
});

describe("Monthly totals and bonus eligibility", () => {
  const scheduled = ["2026-08-10", "2026-08-11", "2026-08-12"];

  it("gives the bonus for a perfect month", () => {
    const totals = summariseMonth(
      scheduled.map((shiftDate) => ({
        shiftDate,
        status: "present" as const,
        workedMinutes: 180,
      })),
      scheduled
    );

    expect(totals.presentDays).toBe(3);
    expect(totals.absentDays).toBe(0);
    expect(totals.attendancePct).toBe(100);
    expect(totals.bonusEligible).toBe(true);
  });

  it("withholds the bonus after a single late day", () => {
    const totals = summariseMonth(
      [
        { shiftDate: "2026-08-10", status: "late", workedMinutes: 180 },
        { shiftDate: "2026-08-11", status: "present", workedMinutes: 180 },
        { shiftDate: "2026-08-12", status: "present", workedMinutes: 180 },
      ],
      scheduled
    );

    expect(totals.lateDays).toBe(1);
    expect(totals.attendancePct).toBe(100);
    expect(totals.bonusEligible).toBe(false);
  });

  it("withholds the bonus when leave was taken", () => {
    const totals = summariseMonth(
      [
        { shiftDate: "2026-08-10", status: "leave", workedMinutes: 0 },
        { shiftDate: "2026-08-11", status: "present", workedMinutes: 180 },
        { shiftDate: "2026-08-12", status: "present", workedMinutes: 180 },
      ],
      scheduled
    );

    expect(totals.leaveDays).toBe(1);
    expect(totals.bonusEligible).toBe(false);
  });

  it("counts missing records as absent", () => {
    const totals = summariseMonth(
      [{ shiftDate: "2026-08-10", status: "present", workedMinutes: 180 }],
      scheduled
    );

    expect(totals.absentDays).toBe(2);
    expect(totals.attendancePct).toBe(33);
    expect(totals.bonusEligible).toBe(false);
  });

  it("withholds the bonus for a short day", () => {
    const totals = summariseMonth(
      [
        { shiftDate: "2026-08-10", status: "incomplete", workedMinutes: 90 },
        { shiftDate: "2026-08-11", status: "present", workedMinutes: 180 },
        { shiftDate: "2026-08-12", status: "present", workedMinutes: 180 },
      ],
      scheduled
    );

    expect(totals.incompleteDays).toBe(1);
    expect(totals.bonusEligible).toBe(false);
  });

  it("counts optional-day hours without affecting eligibility", () => {
    const totals = summariseMonth(
      [
        ...scheduled.map((shiftDate) => ({
          shiftDate,
          status: "present" as const,
          workedMinutes: 180,
        })),
        // Friday — not a scheduled day
        { shiftDate: "2026-08-07", status: "optional-off" as const, workedMinutes: 120 },
      ],
      scheduled
    );

    expect(totals.optionalDaysWorked).toBe(1);
    expect(totals.totalWorkMinutes).toBe(660);
    expect(totals.scheduledDays).toBe(3);
    expect(totals.bonusEligible).toBe(true);
  });

  it("handles an employee with no scheduled days", () => {
    const totals = summariseMonth([], []);
    expect(totals.attendancePct).toBe(0);
    expect(totals.bonusEligible).toBe(false);
  });
});

describe("Helpers", () => {
  it("formats minutes as h:mm like the HRM sheet", () => {
    expect(formatMinutes(180)).toBe("3:00");
    expect(formatMinutes(185)).toBe("3:05");
    expect(formatMinutes(2)).toBe("0:02");
    expect(formatMinutes(0)).toBe("0:00");
  });

  it("shifts ISO dates across month boundaries", () => {
    expect(addDaysToISO("2026-08-31", 1)).toBe("2026-09-01");
    expect(addDaysToISO("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDaysToISO("2024-03-01", -1)).toBe("2024-02-29");
  });
});
