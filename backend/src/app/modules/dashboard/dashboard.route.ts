import { Router } from "express";
import httpStatus from "http-status";
import auth from "../../middlewares/auth";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AttendanceService } from "../attendance/attendance.service";
import { localDateOf } from "../attendance/attendance.utils";
import { AuditLog } from "../auditLog/auditLog.model";
import { Employee } from "../employee/employee.model";
import { FinanceService } from "../finance/finance.service";
import { Lead } from "../lead/lead.model";
import { Meeting } from "../meeting/meeting.model";
import { Project } from "../project/project.model";
import { SUPER_ADMIN_ROLE } from "../role/role.constant";

const router = Router();

/**
 * One aggregate call for the dashboard.
 *
 * Each section is gated by the viewer's permissions, so an HR user doesn't
 * receive finance figures they aren't allowed to see. Sections are also
 * individually fault-tolerant: one failing query returns null for that widget
 * rather than blanking the whole page.
 */
const safely = async <T>(
  enabled: boolean,
  fn: () => Promise<T>
): Promise<T | null> => {
  if (!enabled) return null;
  try {
    return await fn();
  } catch (err) {
    console.error("[dashboard] widget failed:", (err as Error).message);
    return null;
  }
};

router.get(
  "/",
  auth("dashboard.view"),
  catchAsync(async (req, res) => {
    const { permissions, name: roleName } = req.user.role;
    const isSuper = roleName === SUPER_ADMIN_ROLE;
    const can = (...required: string[]) =>
      isSuper || required.some((p) => permissions.includes(p));

    const rules = await AttendanceService.getRules();
    const today = localDateOf(new Date(), rules.timezone);
    const month = today.slice(0, 7);

    const [leads, meetings, attendance, finance, projects, activity] =
      await Promise.all([
        safely(can("leads.view", "leads.manage"), async () => {
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
          sixMonthsAgo.setDate(1);

          const [total, unread, byStatus, trend] = await Promise.all([
            Lead.countDocuments(),
            Lead.countDocuments({ readAt: { $exists: false } }),
            Lead.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
            Lead.aggregate([
              { $match: { createdAt: { $gte: sixMonthsAgo } } },
              {
                $group: {
                  _id: {
                    $dateToString: { format: "%Y-%m", date: "$createdAt" },
                  },
                  count: { $sum: 1 },
                },
              },
              { $sort: { _id: 1 } },
            ]),
          ]);

          return {
            total,
            unread,
            byStatus: Object.fromEntries(
              byStatus.map((r) => [r._id, r.count])
            ) as Record<string, number>,
            trend: trend.map((r) => ({ month: r._id, count: r.count })),
            recent: await Lead.find()
              .sort("-createdAt")
              .limit(5)
              .select("name email company service status createdAt"),
          };
        }),

        safely(can("meetings.manage"), async () => ({
          pending: await Meeting.countDocuments({ status: "pending" }),
          upcoming: await Meeting.find({
            date: { $gte: today },
            status: { $in: ["pending", "confirmed", "rescheduled"] },
          })
            .sort("date time")
            .limit(5)
            .select("name email date time timezone status"),
        })),

        safely(
          can("attendance.view", "attendance.manage", "employees.manage"),
          async () => {
            const sheet = await AttendanceService.getDailySheet();
            const counts = sheet.rows.reduce<Record<string, number>>((acc, row) => {
              acc[row.status] = (acc[row.status] ?? 0) + 1;
              return acc;
            }, {});

            return {
              shiftDate: sheet.shiftDate,
              isOptionalDay: sheet.isOptionalDay,
              activeEmployees: await Employee.countDocuments({ isActive: true }),
              punchedInNow: sheet.rows.filter((r) => r.isPunchedIn).length,
              counts,
            };
          }
        ),

        safely(can("finance.view", "finance.manage"), async () => {
          const overview = await FinanceService.getOverview(month);
          return {
            balance: overview.totals.balance,
            monthIncome: overview.totals.monthIncome,
            monthExpense: overview.totals.monthExpense,
            monthNet: overview.totals.monthNet,
            pendingIncome: overview.totals.pendingIncome,
            pendingPayroll: overview.totals.pendingPayroll,
            trend: overview.trend,
          };
        }),

        safely(can("projects.view", "projects.manage"), async () => {
          const filter = can("projects.manage")
            ? {}
            : { $or: [{ members: req.user._id }, { lead: req.user._id }] };

          const byStatus = await Project.aggregate([
            { $match: filter },
            { $group: { _id: "$status", count: { $sum: 1 } } },
          ]);

          return {
            byStatus: Object.fromEntries(
              byStatus.map((r) => [r._id, r.count])
            ) as Record<string, number>,
            active: await Project.find({ ...filter, status: "active" })
              .sort("deadline")
              .limit(5)
              .select("name code status deadline tasks client"),
          };
        }),

        safely(can("audit.view"), async () =>
          AuditLog.find()
            .sort("-createdAt")
            .limit(8)
            .populate("user", "name")
            .select("action module description createdAt user")
        ),
      ]);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Dashboard retrieved",
      data: {
        today,
        month,
        leads,
        meetings,
        attendance,
        finance,
        projects,
        activity,
      },
    });
  })
);

export const DashboardRoutes = router;
