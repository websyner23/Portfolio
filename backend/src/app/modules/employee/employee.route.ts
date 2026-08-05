import { Router } from "express";
import httpStatus from "http-status";
import { z } from "zod";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { recordAudit } from "../auditLog/auditLog.utils";
import { AttendanceSettings } from "../attendance/attendance.model";
import { Role } from "../role/role.model";
import { User } from "../user/user.model";
import { Employee, nextEmployeeId } from "./employee.model";

const router = Router();
const MANAGE = "employees.manage";

const createSchema = z.object({
  body: z.object({
    fullName: z.string({ required_error: "Name is required" }).min(2).max(80),
    email: z.string({ required_error: "Email is required" }).email(),
    employeeId: z.string().max(20).optional(),
    designation: z.string().max(80).optional().or(z.literal("")),
    department: z.string().max(80).optional().or(z.literal("")),
    phone: z.string().max(40).optional().or(z.literal("")),
    joinDate: z
      .string({ required_error: "Join date is required" })
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Join date must be YYYY-MM-DD"),
    lastWorkingDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .or(z.literal("")),
    baseSalary: z.number().min(0).optional(),
    perfectBonus: z.number().min(0).optional(),
    isActive: z.boolean().optional(),
    notes: z.string().max(2000).optional().or(z.literal("")),
    // Provisions a linked login so the employee can use the punch panel.
    createLogin: z.boolean().optional(),
  }),
});

const updateSchema = z.object({
  body: createSchema.shape.body.partial(),
});

router.get(
  "/",
  auth(MANAGE, "attendance.view", "attendance.manage", "payroll.manage"),
  catchAsync(async (req, res) => {
    const qb = new QueryBuilder(
      Employee.find().populate("user", "name email status"),
      { limit: 200, sort: "employeeId", ...req.query }
    )
      .search(["fullName", "email", "employeeId", "designation"])
      .filter()
      .sort()
      .paginate()
      .fields();

    const data = await qb.modelQuery;
    const meta = await qb.countTotal();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Employees retrieved",
      meta,
      data,
    });
  })
);

router.post(
  "/",
  auth(MANAGE),
  validateRequest(createSchema),
  catchAsync(async (req, res) => {
    const { createLogin, ...payload } = req.body;

    const settings = await AttendanceSettings.findOne({ key: "default" });

    const employee = await Employee.create({
      ...payload,
      employeeId: payload.employeeId || (await nextEmployeeId()),
      baseSalary: payload.baseSalary ?? settings?.defaultBaseSalary ?? 0,
      perfectBonus: payload.perfectBonus ?? settings?.defaultPerfectBonus ?? 0,
    });

    // Optional self-service account, restricted to the punch panel.
    if (createLogin) {
      const employeeRole = await Role.findOne({ name: "employee" });
      if (!employeeRole) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "The 'employee' role is missing — run the seeder first"
        );
      }

      const tempPassword = `Ws${Math.random().toString(36).slice(-8)}`;
      const user = await User.create({
        name: employee.fullName,
        email: employee.email,
        password: tempPassword,
        role: employeeRole._id,
        employee: employee._id,
        needsPasswordChange: true,
      });

      employee.user = user._id;
      await employee.save();
    }

    recordAudit(req, {
      user: req.user._id,
      action: "employee.create",
      module: "employees",
      targetId: String(employee._id),
      description: `Added employee ${employee.fullName} (${employee.employeeId})`,
    });

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      message: "Employee added",
      data: employee,
    });
  })
);

router.get(
  "/:id",
  auth(MANAGE, "attendance.view", "attendance.manage"),
  catchAsync(async (req, res) => {
    const employee = await Employee.findById(req.params.id).populate(
      "user",
      "name email status"
    );
    if (!employee) throw new AppError(httpStatus.NOT_FOUND, "Employee not found");

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Employee retrieved",
      data: employee,
    });
  })
);

router.patch(
  "/:id",
  auth(MANAGE),
  validateRequest(updateSchema),
  catchAsync(async (req, res) => {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!employee) throw new AppError(httpStatus.NOT_FOUND, "Employee not found");

    recordAudit(req, {
      user: req.user._id,
      action: "employee.update",
      module: "employees",
      targetId: req.params.id,
      description: `Updated employee ${employee.fullName}`,
      meta: { changes: Object.keys(req.body ?? {}) },
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Employee updated",
      data: employee,
    });
  })
);

router.delete(
  "/:id",
  auth(MANAGE),
  catchAsync(async (req, res) => {
    const employee = await Employee.findById(req.params.id);
    if (!employee) throw new AppError(httpStatus.NOT_FOUND, "Employee not found");

    // Attendance history is kept for payroll, so employees are deactivated
    // rather than deleted once they have a linked record.
    employee.isActive = false;
    if (!employee.lastWorkingDate) {
      employee.lastWorkingDate = new Date().toISOString().slice(0, 10);
    }
    await employee.save();

    if (employee.user) {
      await User.findByIdAndUpdate(employee.user, { status: "blocked" });
    }

    recordAudit(req, {
      user: req.user._id,
      action: "employee.deactivate",
      module: "employees",
      targetId: req.params.id,
      description: `Deactivated employee ${employee.fullName}`,
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Employee deactivated — attendance history is preserved",
      data: employee,
    });
  })
);

export const EmployeeRoutes = router;
