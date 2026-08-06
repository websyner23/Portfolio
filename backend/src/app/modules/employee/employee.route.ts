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

/**
 * Login accounts not yet tied to an employee, for the "link existing" picker.
 * Registered before /:id so it isn't captured as an employee id.
 */
router.get(
  "/linkable-users",
  auth(MANAGE),
  catchAsync(async (req, res) => {
    const users = await User.find({
      $or: [{ employee: { $exists: false } }, { employee: null }],
      status: "active",
    })
      .populate<{ role: { name: string; permissions: string[] } }>(
        "role",
        "name permissions"
      )
      .select("name email role")
      .sort("name");

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Linkable users retrieved",
      data: users.map((user) => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        roleName: user.role?.name,
        // Surfaced so the picker can warn before linking someone who
        // still wouldn't be able to punch in.
        canPunch:
          user.role?.name === "super-admin" ||
          Boolean(user.role?.permissions?.includes("attendance.punch")),
      })),
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

/**
 * Links an employee to a login so they can use the punch panel.
 *
 * The link is two-sided — `User.employee` is what the punch panel reads, and
 * `Employee.user` is what the admin displays — so both are always written
 * together. Pass either an existing `userId`, or `createLogin: true` to
 * provision a fresh account.
 */
router.post(
  "/:id/link-user",
  auth(MANAGE),
  validateRequest(
    z.object({
      body: z
        .object({
          userId: z.string().optional(),
          createLogin: z.boolean().optional(),
        })
        .refine((data) => data.userId || data.createLogin, {
          message: "Pick an existing user or choose to create a new login",
        }),
    })
  ),
  catchAsync(async (req, res) => {
    const employee = await Employee.findById(req.params.id);
    if (!employee) throw new AppError(httpStatus.NOT_FOUND, "Employee not found");

    if (employee.user) {
      throw new AppError(
        httpStatus.CONFLICT,
        "This employee already has a login — unlink it first"
      );
    }

    let user;
    let temporaryPassword: string | undefined;

    if (req.body.userId) {
      user = await User.findById(req.body.userId);
      if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

      if (user.employee && String(user.employee) !== String(employee._id)) {
        throw new AppError(
          httpStatus.CONFLICT,
          "That login is already linked to another employee"
        );
      }
    } else {
      const employeeRole = await Role.findOne({ name: "employee" });
      if (!employeeRole) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "The 'employee' role is missing — run the seeder first"
        );
      }

      const existing = await User.findOne({ email: employee.email });
      if (existing) {
        throw new AppError(
          httpStatus.CONFLICT,
          `A login already exists for ${employee.email} — link that one instead`
        );
      }

      temporaryPassword = `Ws${Math.random().toString(36).slice(-8)}`;
      user = await User.create({
        name: employee.fullName,
        email: employee.email,
        password: temporaryPassword,
        role: employeeRole._id,
        needsPasswordChange: true,
      });
    }

    user.employee = employee._id;
    await user.save({ validateBeforeSave: false });

    employee.user = user._id;
    await employee.save();

    // Linking alone isn't enough — the role still has to allow punching.
    const role = await Role.findById(user.role);
    const canPunch =
      role?.name === "super-admin" ||
      role?.permissions.includes("attendance.punch");

    recordAudit(req, {
      user: req.user._id,
      action: "employee.link-user",
      module: "employees",
      targetId: String(employee._id),
      description: `Linked ${user.email} to employee ${employee.fullName} (${employee.employeeId})`,
    });

    const linked = await Employee.findById(employee._id).populate(
      "user",
      "name email status"
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: canPunch
        ? "Login linked — they can use the punch panel now"
        : `Login linked, but the "${role?.name}" role can't punch in. Add the "attendance.punch" permission to that role.`,
      data: { employee: linked, temporaryPassword, canPunch },
    });
  })
);

router.delete(
  "/:id/link-user",
  auth(MANAGE),
  catchAsync(async (req, res) => {
    const employee = await Employee.findById(req.params.id);
    if (!employee) throw new AppError(httpStatus.NOT_FOUND, "Employee not found");
    if (!employee.user) {
      throw new AppError(httpStatus.BAD_REQUEST, "This employee has no linked login");
    }

    // Clear both sides; the user account itself is left alone.
    await User.findByIdAndUpdate(employee.user, { $unset: { employee: 1 } });
    const previous = employee.user;
    employee.user = undefined;
    await employee.save();

    recordAudit(req, {
      user: req.user._id,
      action: "employee.unlink-user",
      module: "employees",
      targetId: String(employee._id),
      description: `Unlinked the login from ${employee.fullName}`,
      meta: { userId: String(previous) },
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Login unlinked — the account itself still exists",
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
