import { Router } from "express";
import httpStatus from "http-status";
import { z } from "zod";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import catchAsync from "../../utils/catchAsync";
import { getDeviceInfo } from "../../utils/deviceInfo";
import sendResponse from "../../utils/sendResponse";
import { recordAudit } from "../auditLog/auditLog.utils";
import { emitTo, ROOM_ADMINS } from "../../../socket";
import { Attendance, ATTENDANCE_STATUSES, Leave } from "./attendance.model";
import { AttendanceService } from "./attendance.service";
import { addDaysToISO, localDateOf } from "./attendance.utils";

const router = Router();
const VIEW = ["attendance.view", "attendance.manage"] as const;
const MANAGE = "attendance.manage";

/* ----------------------------- Self service ----------------------------- */

/** The punch panel acts on the employee linked to the logged-in user. */
const requireLinkedEmployee = (employee?: string) => {
  if (!employee) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Your account isn't linked to an employee record — ask an admin to link it"
    );
  }
  return employee;
};

router.get(
  "/me/today",
  auth("attendance.punch"),
  catchAsync(async (req, res) => {
    const employeeId = requireLinkedEmployee(req.user.employee);
    const data = await AttendanceService.getMyToday(employeeId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Today's attendance retrieved",
      data,
    });
  })
);

router.post(
  "/punch-in",
  auth("attendance.punch"),
  catchAsync(async (req, res) => {
    const employeeId = requireLinkedEmployee(req.user.employee);
    const info = getDeviceInfo(req);

    const record = await AttendanceService.punchIn(employeeId, {
      ip: info.ip,
      device: `${info.device.browser} on ${info.device.os}`,
    });

    recordAudit(req, {
      user: req.user._id,
      action: "attendance.punch-in",
      module: "attendance",
      targetId: String(record._id),
      description: `${req.user.name} punched in (${record.shiftDate})`,
    });
    emitTo(ROOM_ADMINS, "attendance:update", { shiftDate: record.shiftDate });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Punched in",
      data: record,
    });
  })
);

router.post(
  "/punch-out",
  auth("attendance.punch"),
  catchAsync(async (req, res) => {
    const employeeId = requireLinkedEmployee(req.user.employee);
    const record = await AttendanceService.punchOut(employeeId);

    recordAudit(req, {
      user: req.user._id,
      action: "attendance.punch-out",
      module: "attendance",
      targetId: String(record._id),
      description: `${req.user.name} punched out (${record.shiftDate})`,
    });
    emitTo(ROOM_ADMINS, "attendance:update", { shiftDate: record.shiftDate });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Punched out",
      data: record,
    });
  })
);

router.post(
  "/break/start",
  auth("attendance.punch"),
  catchAsync(async (req, res) => {
    const employeeId = requireLinkedEmployee(req.user.employee);
    const record = await AttendanceService.startBreak(
      employeeId,
      req.body?.reason
    );

    recordAudit(req, {
      user: req.user._id,
      action: "attendance.break-start",
      module: "attendance",
      targetId: String(record._id),
      description: `${req.user.name} started a break (${record.shiftDate})`,
    });
    emitTo(ROOM_ADMINS, "attendance:update", { shiftDate: record.shiftDate });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Break started — the clock is paused",
      data: record,
    });
  })
);

router.post(
  "/break/end",
  auth("attendance.punch"),
  catchAsync(async (req, res) => {
    const employeeId = requireLinkedEmployee(req.user.employee);
    const record = await AttendanceService.endBreak(employeeId);

    recordAudit(req, {
      user: req.user._id,
      action: "attendance.break-end",
      module: "attendance",
      targetId: String(record._id),
      description: `${req.user.name} ended a break (${record.shiftDate})`,
    });
    emitTo(ROOM_ADMINS, "attendance:update", { shiftDate: record.shiftDate });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Break ended — back on the clock",
      data: record,
    });
  })
);

/* ------------------------------- Reporting ------------------------------- */

router.get(
  "/daily",
  auth(...VIEW),
  catchAsync(async (req, res) => {
    const data = await AttendanceService.getDailySheet(
      req.query.date as string | undefined
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Daily attendance retrieved",
      data,
    });
  })
);

router.get(
  "/summary",
  auth(...VIEW, "payroll.manage"),
  catchAsync(async (req, res) => {
    const data = await AttendanceService.getMonthlySummary(
      req.query.month as string | undefined
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Monthly summary retrieved",
      data,
    });
  })
);

router.get(
  "/records",
  auth(...VIEW),
  catchAsync(async (req, res) => {
    const qb = new QueryBuilder(
      Attendance.find().populate("employee", "employeeId fullName"),
      { limit: 100, sort: "-shiftDate", ...req.query }
    )
      .filter()
      .sort()
      .paginate()
      .fields();

    const data = await qb.modelQuery;
    const meta = await qb.countTotal();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Attendance records retrieved",
      meta,
      data,
    });
  })
);

/* --------------------------- Admin corrections --------------------------- */

const sessionSchema = z.object({
  in: z.string(),
  out: z.string().optional(),
});

const createRecordSchema = z.object({
  body: z.object({
    employee: z.string({ required_error: "Employee is required" }),
    shiftDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    sessions: z.array(sessionSchema).optional(),
    status: z.enum(ATTENDANCE_STATUSES).optional(),
    note: z.string().max(500).optional().or(z.literal("")),
  }),
});

const updateRecordSchema = z.object({
  body: z.object({
    sessions: z.array(sessionSchema).optional(),
    status: z.enum(ATTENDANCE_STATUSES).optional(),
    note: z.string().max(500).optional().or(z.literal("")),
  }),
});

router.post(
  "/records",
  auth(MANAGE),
  validateRequest(createRecordSchema),
  catchAsync(async (req, res) => {
    const record = await AttendanceService.createRecord(req.body, req.user._id);

    recordAudit(req, {
      user: req.user._id,
      action: "attendance.create",
      module: "attendance",
      targetId: String(record._id),
      description: `Added an attendance record for ${record.shiftDate}`,
    });

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      message: "Attendance record added",
      data: record,
    });
  })
);

router.patch(
  "/records/:id",
  auth(MANAGE),
  validateRequest(updateRecordSchema),
  catchAsync(async (req, res) => {
    const record = await AttendanceService.updateRecord(
      req.params.id,
      req.body,
      req.user._id
    );

    recordAudit(req, {
      user: req.user._id,
      action: "attendance.correct",
      module: "attendance",
      targetId: req.params.id,
      description: `Corrected attendance for ${record.shiftDate}`,
      meta: { changes: Object.keys(req.body ?? {}) },
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Attendance record updated",
      data: record,
    });
  })
);

/** Manual trigger for the nightly finalization (also runs on a cron). */
router.post(
  "/finalize",
  auth(MANAGE),
  catchAsync(async (req, res) => {
    const rules = await AttendanceService.getRules();
    // Defaults to yesterday's shift — the same date the nightly cron closes.
    const date =
      (req.body?.date as string | undefined) ??
      addDaysToISO(localDateOf(new Date(), rules.timezone), -1);

    const result = await AttendanceService.finalizeShiftDate(date);

    recordAudit(req, {
      user: req.user._id,
      action: "attendance.finalize",
      module: "attendance",
      description: `Finalized ${date}: ${result.absentMarked} absent, ${result.autoClosed} sessions auto-closed`,
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: `Finalized ${date}`,
      data: result,
    });
  })
);

/* -------------------------------- Settings -------------------------------- */

const settingsSchema = z.object({
  body: z.object({
    shiftStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    shiftEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    overnightCutoff: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    graceMinutes: z.number().min(0).max(180).optional(),
    requiredDailyMinutes: z.number().min(0).max(1440).optional(),
    optionalWeekdays: z.array(z.number().min(0).max(6)).optional(),
    timezone: z.string().optional(),
    currency: z.string().max(10).optional(),
    defaultBaseSalary: z.number().min(0).optional(),
    defaultPerfectBonus: z.number().min(0).optional(),
  }),
});

router.get(
  "/settings",
  auth(...VIEW, "payroll.manage"),
  catchAsync(async (req, res) => {
    const data = await AttendanceService.getSettings();
    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Attendance settings retrieved",
      data,
    });
  })
);

router.patch(
  "/settings",
  auth(MANAGE),
  validateRequest(settingsSchema),
  catchAsync(async (req, res) => {
    const data = await AttendanceService.updateSettings(req.body);

    recordAudit(req, {
      user: req.user._id,
      action: "attendance.settings",
      module: "attendance",
      description: "Updated attendance rules",
      meta: { changes: Object.keys(req.body ?? {}) },
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Attendance settings updated",
      data,
    });
  })
);

/* --------------------------------- Leave --------------------------------- */

const leaveSchema = z.object({
  body: z.object({
    employee: z.string({ required_error: "Employee is required" }),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    type: z.enum(["paid", "unpaid", "sick", "other"]).optional(),
    reason: z.string().max(1000).optional().or(z.literal("")),
  }),
});

const reviewLeaveSchema = z.object({
  body: z.object({
    status: z.enum(["pending", "approved", "rejected"]),
    reviewNote: z.string().max(500).optional().or(z.literal("")),
  }),
});

router.get(
  "/leaves",
  auth(...VIEW),
  catchAsync(async (req, res) => {
    const qb = new QueryBuilder(
      Leave.find()
        .populate("employee", "employeeId fullName")
        .populate("reviewedBy", "name"),
      { limit: 50, sort: "-startDate", ...req.query }
    )
      .filter()
      .sort()
      .paginate();

    const data = await qb.modelQuery;
    const meta = await qb.countTotal();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Leave requests retrieved",
      meta,
      data,
    });
  })
);

router.post(
  "/leaves",
  auth(MANAGE),
  validateRequest(leaveSchema),
  catchAsync(async (req, res) => {
    if (req.body.endDate < req.body.startDate) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "The end date can't be before the start date"
      );
    }

    const leave = await Leave.create(req.body);

    recordAudit(req, {
      user: req.user._id,
      action: "leave.create",
      module: "attendance",
      targetId: String(leave._id),
      description: `Recorded leave ${leave.startDate} → ${leave.endDate}`,
    });

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      message: "Leave recorded",
      data: leave,
    });
  })
);

router.patch(
  "/leaves/:id",
  auth(MANAGE),
  validateRequest(reviewLeaveSchema),
  catchAsync(async (req, res) => {
    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      { ...req.body, reviewedBy: req.user._id },
      { new: true, runValidators: true }
    ).populate("employee", "employeeId fullName");
    if (!leave) throw new AppError(httpStatus.NOT_FOUND, "Leave request not found");

    recordAudit(req, {
      user: req.user._id,
      action: `leave.${req.body.status}`,
      module: "attendance",
      targetId: req.params.id,
      description: `Leave request ${req.body.status}`,
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: `Leave ${req.body.status}`,
      data: leave,
    });
  })
);

router.delete(
  "/leaves/:id",
  auth(MANAGE),
  catchAsync(async (req, res) => {
    const leave = await Leave.findByIdAndDelete(req.params.id);
    if (!leave) throw new AppError(httpStatus.NOT_FOUND, "Leave request not found");

    recordAudit(req, {
      user: req.user._id,
      action: "leave.delete",
      module: "attendance",
      targetId: req.params.id,
      description: "Deleted a leave request",
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Leave request deleted",
    });
  })
);

export const AttendanceRoutes = router;
