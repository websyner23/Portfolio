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
import {
  Account,
  PayrollRecord,
  Receivable,
  Transaction,
  TRANSACTION_TYPES,
} from "./finance.model";
import { FinanceService } from "./finance.service";

const router = Router();
const VIEW = ["finance.view", "finance.manage"] as const;
const MANAGE = "finance.manage";
const PAYROLL = "payroll.manage";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

/* -------------------------------- Overview -------------------------------- */

router.get(
  "/overview",
  auth(...VIEW),
  catchAsync(async (req, res) => {
    const data = await FinanceService.getOverview(
      req.query.month as string | undefined
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Finance overview retrieved",
      data,
    });
  })
);

/* -------------------------------- Accounts -------------------------------- */

const accountSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Name is required" }).min(2).max(80),
    type: z.enum(["cash", "bank", "mobile-banking", "other"]).optional(),
    openingBalance: z.number().optional(),
    accountNumber: z.string().max(60).optional().or(z.literal("")),
    isActive: z.boolean().optional(),
    note: z.string().max(500).optional().or(z.literal("")),
  }),
});

router.get(
  "/accounts",
  auth(...VIEW, PAYROLL),
  catchAsync(async (req, res) => {
    const data = await FinanceService.getAccountBalances();
    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Accounts retrieved",
      data,
    });
  })
);

router.post(
  "/accounts",
  auth(MANAGE),
  validateRequest(accountSchema),
  catchAsync(async (req, res) => {
    const account = await Account.create(req.body);

    recordAudit(req, {
      user: req.user._id,
      action: "finance.account.create",
      module: "finance",
      targetId: String(account._id),
      description: `Created account "${account.name}"`,
    });

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      message: "Account created",
      data: account,
    });
  })
);

router.patch(
  "/accounts/:id",
  auth(MANAGE),
  validateRequest(
    z.object({ body: accountSchema.shape.body.partial() })
  ),
  catchAsync(async (req, res) => {
    const account = await Account.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!account) throw new AppError(httpStatus.NOT_FOUND, "Account not found");

    recordAudit(req, {
      user: req.user._id,
      action: "finance.account.update",
      module: "finance",
      targetId: req.params.id,
      description: `Updated account "${account.name}"`,
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Account updated",
      data: account,
    });
  })
);

/* ------------------------------ Transactions ------------------------------ */

const transactionSchema = z.object({
  body: z.object({
    type: z.enum(TRANSACTION_TYPES),
    amount: z.number({ required_error: "Amount is required" }).min(0),
    account: z.string({ required_error: "Account is required" }),
    toAccount: z.string().optional(),
    category: z.string().max(80).optional().or(z.literal("")),
    date: isoDate,
    description: z.string().max(1000).optional().or(z.literal("")),
    project: z.string().optional(),
    employee: z.string().optional(),
  }),
});

router.get(
  "/transactions",
  auth(...VIEW),
  catchAsync(async (req, res) => {
    const query = { ...req.query };

    const from = query.from as string | undefined;
    const to = query.to as string | undefined;
    delete query.from;
    delete query.to;

    let base = Transaction.find()
      .populate("account", "name type")
      .populate("employee", "employeeId fullName")
      .populate("project", "name");

    if (from || to) {
      const range: Record<string, string> = {};
      if (from) range.$gte = from;
      if (to) range.$lte = to;
      base = base.find({ date: range });
    }

    if (!query.sort) query.sort = "-date -createdAt";

    const qb = new QueryBuilder(base, { limit: 50, ...query })
      .search(["description", "category"])
      .filter()
      .sort()
      .paginate()
      .fields();

    const data = await qb.modelQuery;
    const meta = await qb.countTotal();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Transactions retrieved",
      meta,
      data,
    });
  })
);

router.post(
  "/transactions",
  auth(MANAGE),
  validateRequest(transactionSchema),
  catchAsync(async (req, res) => {
    const transaction = await FinanceService.createTransaction(
      req.body,
      req.user._id
    );

    recordAudit(req, {
      user: req.user._id,
      action: "finance.transaction.create",
      module: "finance",
      targetId: String(transaction._id),
      description: `${transaction.type} of ${transaction.amount} on ${transaction.date}`,
    });

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      message: "Transaction recorded",
      data: transaction,
    });
  })
);

router.delete(
  "/transactions/:id",
  auth(MANAGE),
  catchAsync(async (req, res) => {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      throw new AppError(httpStatus.NOT_FOUND, "Transaction not found");
    }
    if (transaction.payroll) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "This came from a salary payment — reverse it from the payroll page instead"
      );
    }

    await transaction.deleteOne();

    recordAudit(req, {
      user: req.user._id,
      action: "finance.transaction.delete",
      module: "finance",
      targetId: req.params.id,
      description: `Deleted a ${transaction.type} of ${transaction.amount}`,
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Transaction deleted",
    });
  })
);

/* ------------------------------ Receivables ------------------------------ */

const receivableSchema = z.object({
  body: z.object({
    title: z.string({ required_error: "Title is required" }).min(2).max(120),
    client: z.string().max(120).optional().or(z.literal("")),
    project: z.string().optional(),
    amount: z.number({ required_error: "Amount is required" }).min(0),
    dueDate: isoDate.optional().or(z.literal("")),
    note: z.string().max(1000).optional().or(z.literal("")),
  }),
});

router.get(
  "/receivables",
  auth(...VIEW),
  catchAsync(async (req, res) => {
    const qb = new QueryBuilder(
      Receivable.find().populate("project", "name"),
      { limit: 50, sort: "dueDate", ...req.query }
    )
      .search(["title", "client"])
      .filter()
      .sort()
      .paginate();

    const data = await qb.modelQuery;
    const meta = await qb.countTotal();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Receivables retrieved",
      meta,
      data,
    });
  })
);

router.post(
  "/receivables",
  auth(MANAGE),
  validateRequest(receivableSchema),
  catchAsync(async (req, res) => {
    const receivable = await Receivable.create(req.body);

    recordAudit(req, {
      user: req.user._id,
      action: "finance.receivable.create",
      module: "finance",
      targetId: String(receivable._id),
      description: `Expecting ${receivable.amount} for "${receivable.title}"`,
    });

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      message: "Receivable added",
      data: receivable,
    });
  })
);

router.post(
  "/receivables/:id/payments",
  auth(MANAGE),
  validateRequest(
    z.object({
      body: z.object({
        amount: z.number({ required_error: "Amount is required" }).min(0.01),
        date: isoDate,
        account: z.string({ required_error: "Account is required" }),
        note: z.string().max(500).optional().or(z.literal("")),
      }),
    })
  ),
  catchAsync(async (req, res) => {
    const receivable = await FinanceService.addReceivablePayment(
      req.params.id,
      req.body,
      req.user._id
    );

    recordAudit(req, {
      user: req.user._id,
      action: "finance.receivable.payment",
      module: "finance",
      targetId: req.params.id,
      description: `Received ${req.body.amount} for "${receivable.title}"`,
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Payment recorded",
      data: receivable,
    });
  })
);

router.delete(
  "/receivables/:id",
  auth(MANAGE),
  catchAsync(async (req, res) => {
    const receivable = await Receivable.findById(req.params.id);
    if (!receivable) throw new AppError(httpStatus.NOT_FOUND, "Receivable not found");

    if (receivable.payments.length > 0) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Payments have already been recorded against this — write it off instead"
      );
    }

    await receivable.deleteOne();

    recordAudit(req, {
      user: req.user._id,
      action: "finance.receivable.delete",
      module: "finance",
      targetId: req.params.id,
      description: `Deleted receivable "${receivable.title}"`,
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Receivable deleted",
    });
  })
);

/* -------------------------------- Payroll -------------------------------- */

router.get(
  "/payroll",
  auth(PAYROLL, ...VIEW),
  catchAsync(async (req, res) => {
    const month =
      (req.query.month as string | undefined) ??
      new Date().toISOString().slice(0, 7);

    const data = await FinanceService.getPayroll(month);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Payroll retrieved",
      data,
    });
  })
);

router.post(
  "/payroll/generate",
  auth(PAYROLL),
  validateRequest(
    z.object({
      body: z.object({
        month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be YYYY-MM"),
      }),
    })
  ),
  catchAsync(async (req, res) => {
    const result = await FinanceService.generatePayroll(
      req.body.month,
      req.user._id
    );

    recordAudit(req, {
      user: req.user._id,
      action: "payroll.generate",
      module: "finance",
      description: `Generated payroll for ${req.body.month}: ${result.created} created, ${result.updated} updated, ${result.skipped} left alone`,
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: `Payroll generated for ${req.body.month}`,
      data: result,
    });
  })
);

router.patch(
  "/payroll/:id",
  auth(PAYROLL),
  validateRequest(
    z.object({
      body: z.object({
        adjustment: z.number().optional(),
        adjustmentNote: z.string().max(500).optional().or(z.literal("")),
        status: z.enum(["draft", "approved"]).optional(),
      }),
    })
  ),
  catchAsync(async (req, res) => {
    const record = await FinanceService.updatePayrollRecord(
      req.params.id,
      req.body
    );

    recordAudit(req, {
      user: req.user._id,
      action: "payroll.update",
      module: "finance",
      targetId: req.params.id,
      description: `Updated payroll for ${record.month}`,
      meta: { changes: Object.keys(req.body ?? {}) },
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Payroll record updated",
      data: record,
    });
  })
);

router.post(
  "/payroll/:id/pay",
  auth(PAYROLL),
  validateRequest(
    z.object({
      body: z.object({
        account: z.string({ required_error: "Account is required" }),
        date: isoDate,
      }),
    })
  ),
  catchAsync(async (req, res) => {
    const record = await FinanceService.paySalary(
      req.params.id,
      req.body,
      req.user._id
    );

    recordAudit(req, {
      user: req.user._id,
      action: "payroll.pay",
      module: "finance",
      targetId: req.params.id,
      description: `Paid ${record.netPayable} for ${record.month}`,
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Salary paid and recorded as an expense",
      data: record,
    });
  })
);

export const FinanceRoutes = router;
