import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../errors/AppError";
import { Employee } from "../employee/employee.model";
import { Attendance, AttendanceSettings, Leave } from "./attendance.model";
import {
  calculateLateMinutes,
  calculateWorkedMinutes,
  deriveStatus,
  formatMinutes,
  isOptionalDay,
  localDateOf,
  resolveShiftDate,
  scheduledDatesInMonth,
  shiftEndInstant,
  summariseMonth,
  type TAttendanceStatus,
  type TShiftRules,
} from "./attendance.utils";

const SINGLETON = { key: "default" };

export const getRules = async (): Promise<TShiftRules> => {
  const settings =
    (await AttendanceSettings.findOne(SINGLETON)) ??
    (await AttendanceSettings.create(SINGLETON));

  return {
    shiftStart: settings.shiftStart,
    shiftEnd: settings.shiftEnd,
    overnightCutoff: settings.overnightCutoff,
    graceMinutes: settings.graceMinutes,
    requiredDailyMinutes: settings.requiredDailyMinutes,
    optionalWeekdays: settings.optionalWeekdays,
    timezone: settings.timezone,
  };
};

const getSettings = async () =>
  (await AttendanceSettings.findOne(SINGLETON)) ??
  (await AttendanceSettings.create(SINGLETON));

const updateSettings = async (payload: Record<string, unknown>) =>
  AttendanceSettings.findOneAndUpdate(
    SINGLETON,
    { $set: payload },
    { new: true, upsert: true, runValidators: true }
  );

/** Recomputes the derived fields on a record from its sessions. */
const recalculate = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  record: any,
  rules: TShiftRules
) => {
  record.workedMinutes = calculateWorkedMinutes(record.sessions);
  record.lateMinutes = record.sessions.length
    ? calculateLateMinutes(record.sessions[0].in, record.shiftDate, rules)
    : 0;

  // Approved leave and manual overrides win over the derived status.
  if (record.status !== "leave") {
    record.status = deriveStatus(
      record.shiftDate,
      record.workedMinutes,
      record.lateMinutes,
      rules
    );
  }

  await record.save();
  return record;
};

const punchIn = async (
  employeeId: string,
  meta: { ip?: string; device?: string }
) => {
  const rules = await getRules();
  const now = new Date();
  const shiftDate = resolveShiftDate(now, rules);

  let record = await Attendance.findOne({ employee: employeeId, shiftDate });

  if (record) {
    const open = record.sessions.find((s) => !s.out);
    if (open) {
      throw new AppError(
        httpStatus.CONFLICT,
        "You're already punched in — punch out first"
      );
    }
    record.sessions.push({ in: now, autoClosed: false });
  } else {
    record = new Attendance({
      employee: employeeId,
      shiftDate,
      sessions: [{ in: now, autoClosed: false }],
      source: "self",
      ip: meta.ip,
      device: meta.device,
    });
  }

  return recalculate(record, rules);
};

const punchOut = async (employeeId: string) => {
  const rules = await getRules();
  const now = new Date();
  const shiftDate = resolveShiftDate(now, rules);

  const record = await Attendance.findOne({ employee: employeeId, shiftDate });
  const open = record?.sessions.find((s) => !s.out);

  if (!record || !open) {
    throw new AppError(httpStatus.BAD_REQUEST, "You aren't punched in");
  }

  open.out = now;
  return recalculate(record, rules);
};

/** Today's record plus whether a session is currently open. */
const getMyToday = async (employeeId: string) => {
  const rules = await getRules();
  const shiftDate = resolveShiftDate(new Date(), rules);

  const record = await Attendance.findOne({ employee: employeeId, shiftDate });
  const openSession = record?.sessions.find((s) => !s.out);

  return {
    shiftDate,
    rules,
    record,
    isPunchedIn: Boolean(openSession),
    openSince: openSession?.in ?? null,
    workedMinutes: record?.workedMinutes ?? 0,
    workedLabel: formatMinutes(record?.workedMinutes ?? 0),
  };
};

/** Everyone's status for one shift date — the daily sheet. */
const getDailySheet = async (date?: string) => {
  const rules = await getRules();
  const shiftDate = date ?? resolveShiftDate(new Date(), rules);

  const [employees, records, leaves] = await Promise.all([
    Employee.find({ isActive: true }).sort("employeeId"),
    Attendance.find({ shiftDate }),
    Leave.find({
      status: "approved",
      startDate: { $lte: shiftDate },
      endDate: { $gte: shiftDate },
    }),
  ]);

  const byEmployee = new Map(records.map((r) => [String(r.employee), r]));
  const onLeave = new Set(leaves.map((l) => String(l.employee)));

  const rows = employees.map((employee) => {
    const record = byEmployee.get(String(employee._id));
    const openSession = record?.sessions.find((s) => !s.out);

    let status: TAttendanceStatus | "not-punched" = "not-punched";
    if (record) status = record.status as TAttendanceStatus;
    else if (onLeave.has(String(employee._id))) status = "leave";
    else if (isOptionalDay(shiftDate, rules)) status = "optional-off";

    return {
      employee: {
        _id: employee._id,
        employeeId: employee.employeeId,
        fullName: employee.fullName,
        designation: employee.designation,
      },
      attendanceId: record?._id ?? null,
      status,
      firstIn: record?.sessions[0]?.in ?? null,
      lastOut: record?.sessions.filter((s) => s.out).at(-1)?.out ?? null,
      isPunchedIn: Boolean(openSession),
      workedMinutes: record?.workedMinutes ?? 0,
      workedLabel: formatMinutes(record?.workedMinutes ?? 0),
      lateMinutes: record?.lateMinutes ?? 0,
      note: record?.note ?? "",
    };
  });

  return {
    shiftDate,
    isOptionalDay: isOptionalDay(shiftDate, rules),
    shiftStart: rules.shiftStart,
    shiftEnd: rules.shiftEnd,
    rows,
  };
};

/**
 * Monthly figures per employee plus company totals — the dashboard the sheet
 * produced, reproduced from the punch records.
 */
const getMonthlySummary = async (month?: string) => {
  const rules = await getRules();
  const settings = await getSettings();

  const now = new Date();
  const targetMonth = month ?? localDateOf(now, rules.timezone).slice(0, 7);
  const monthEnd = `${targetMonth}-31`;

  /**
   * A day can only be judged once its shift has ended, so the report stops at
   * the last fully-elapsed shift. Without this an employee would show as
   * absent for today before their shift had even started. This matches the
   * date the nightly finalization job closes.
   */
  const lastCompletedShift = addDaysToISO(resolveShiftDate(now, rules), -1);
  const upTo = lastCompletedShift < monthEnd ? lastCompletedShift : monthEnd;

  const employees = await Employee.find({
    $or: [{ isActive: true }, { lastWorkingDate: { $gte: `${targetMonth}-01` } }],
  }).sort("employeeId");

  const [records, leaves] = await Promise.all([
    Attendance.find({ shiftDate: { $regex: `^${targetMonth}` } }),
    Leave.find({
      status: "approved",
      startDate: { $lte: `${targetMonth}-31` },
      endDate: { $gte: `${targetMonth}-01` },
    }),
  ]);

  const rows = employees.map((employee) => {
    const id = String(employee._id);

    const scheduled = scheduledDatesInMonth(
      targetMonth,
      rules,
      {
        joinDate: employee.joinDate,
        lastWorkingDate: employee.lastWorkingDate || undefined,
      },
      upTo
    );

    const own = records
      .filter((r) => String(r.employee) === id)
      .map((r) => ({
        shiftDate: r.shiftDate,
        status: r.status as TAttendanceStatus,
        workedMinutes: r.workedMinutes,
      }));

    // Approved leave without a punch record still counts as a leave day.
    const covered = new Set(own.map((r) => r.shiftDate));
    leaves
      .filter((l) => String(l.employee) === id)
      .forEach((leave) => {
        scheduled.forEach((date) => {
          if (date >= leave.startDate && date <= leave.endDate && !covered.has(date)) {
            own.push({ shiftDate: date, status: "leave", workedMinutes: 0 });
            covered.add(date);
          }
        });
      });

    const totals = summariseMonth(own, scheduled);
    const bonus = totals.bonusEligible ? employee.perfectBonus : 0;

    return {
      employee: {
        _id: employee._id,
        employeeId: employee.employeeId,
        fullName: employee.fullName,
        designation: employee.designation,
        isActive: employee.isActive,
      },
      ...totals,
      workTimeLabel: formatMinutes(totals.totalWorkMinutes),
      baseSalary: employee.baseSalary,
      bonus,
      netPayable: employee.baseSalary + bonus,
    };
  });

  const sum = (pick: (row: (typeof rows)[number]) => number) =>
    rows.reduce((total, row) => total + pick(row), 0);

  return {
    month: targetMonth,
    upTo,
    currency: settings.currency,
    rows,
    totals: {
      activeEmployees: rows.filter((r) => r.employee.isActive).length,
      scheduledDays: sum((r) => r.scheduledDays),
      presentDays: sum((r) => r.presentDays),
      lateDays: sum((r) => r.lateDays),
      incompleteDays: sum((r) => r.incompleteDays),
      leaveDays: sum((r) => r.leaveDays),
      absentDays: sum((r) => r.absentDays),
      totalWorkMinutes: sum((r) => r.totalWorkMinutes),
      totalWorkLabel: formatMinutes(sum((r) => r.totalWorkMinutes)),
      bonusEligible: rows.filter((r) => r.bonusEligible).length,
      totalPayroll: sum((r) => r.netPayable),
    },
  };
};

/** Admin correction of a single record. */
const updateRecord = async (
  id: string,
  payload: {
    sessions?: { in: string; out?: string }[];
    status?: TAttendanceStatus;
    note?: string;
  },
  editedBy: string
) => {
  const rules = await getRules();
  const record = await Attendance.findById(id);
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Record not found");

  if (payload.sessions) {
    // `set` keeps the Mongoose DocumentArray wrapper intact.
    record.set(
      "sessions",
      payload.sessions.map((s) => ({
        in: new Date(s.in),
        out: s.out ? new Date(s.out) : undefined,
        autoClosed: false,
      }))
    );
  }
  if (payload.note !== undefined) record.note = payload.note;

  record.source = "admin";
  record.editedBy = new Types.ObjectId(editedBy);

  await recalculate(record, rules);

  // An explicit status overrides the derived one.
  if (payload.status) {
    record.status = payload.status;
    await record.save();
  }

  return record;
};

/** Creates a record for an employee who has none for a date. */
const createRecord = async (
  payload: {
    employee: string;
    shiftDate: string;
    sessions?: { in: string; out?: string }[];
    status?: TAttendanceStatus;
    note?: string;
  },
  editedBy: string
) => {
  const rules = await getRules();

  const existing = await Attendance.findOne({
    employee: payload.employee,
    shiftDate: payload.shiftDate,
  });
  if (existing) {
    throw new AppError(
      httpStatus.CONFLICT,
      "A record already exists for that employee and date"
    );
  }

  const record = new Attendance({
    employee: payload.employee,
    shiftDate: payload.shiftDate,
    sessions: (payload.sessions ?? []).map((s) => ({
      in: new Date(s.in),
      out: s.out ? new Date(s.out) : undefined,
      autoClosed: false,
    })),
    note: payload.note ?? "",
    source: "admin",
    editedBy: new Types.ObjectId(editedBy),
    status: payload.status ?? "present",
  });

  await recalculate(record, rules);

  if (payload.status) {
    record.status = payload.status;
    await record.save();
  }

  return record;
};

/**
 * Closes out a shift date: auto-closes open sessions at shift end and creates
 * absent records for active employees who never punched in.
 */
const finalizeShiftDate = async (shiftDate: string) => {
  const rules = await getRules();

  const [employees, records, leaves] = await Promise.all([
    Employee.find({ isActive: true }),
    Attendance.find({ shiftDate }),
    Leave.find({
      status: "approved",
      startDate: { $lte: shiftDate },
      endDate: { $gte: shiftDate },
    }),
  ]);

  const onLeave = new Set(leaves.map((l) => String(l.employee)));
  const seen = new Set<string>();
  let autoClosed = 0;
  let marked = 0;

  for (const record of records) {
    seen.add(String(record.employee));

    const open = record.sessions.find((s) => !s.out);
    if (open) {
      open.out = shiftEndInstant(shiftDate, rules);
      open.autoClosed = true;
      autoClosed += 1;
    }

    await recalculate(record, rules);
    record.isFinalized = true;
    await record.save();
  }

  const optional = isOptionalDay(shiftDate, rules);

  for (const employee of employees) {
    const id = String(employee._id);
    if (seen.has(id)) continue;
    if (employee.joinDate && shiftDate < employee.joinDate) continue;
    if (employee.lastWorkingDate && shiftDate > employee.lastWorkingDate) continue;

    const status: TAttendanceStatus = onLeave.has(id)
      ? "leave"
      : optional
        ? "optional-off"
        : "absent";

    await Attendance.create({
      employee: employee._id,
      shiftDate,
      sessions: [],
      workedMinutes: 0,
      lateMinutes: 0,
      status,
      isFinalized: true,
      source: "system",
    });

    if (status === "absent") marked += 1;
  }

  return { shiftDate, autoClosed, absentMarked: marked };
};

export const AttendanceService = {
  getRules,
  getSettings,
  updateSettings,
  punchIn,
  punchOut,
  getMyToday,
  getDailySheet,
  getMonthlySummary,
  updateRecord,
  createRecord,
  finalizeShiftDate,
};
