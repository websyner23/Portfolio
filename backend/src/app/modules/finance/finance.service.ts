import httpStatus from "http-status";
import { Types } from "mongoose";
import AppError from "../../errors/AppError";
import { AttendanceService } from "../attendance/attendance.service";
import { Employee } from "../employee/employee.model";
import {
  Account,
  PayrollRecord,
  Receivable,
  Transaction,
} from "./finance.model";

/**
 * Account balances are always derived from transactions rather than stored,
 * so a balance can never drift away from its history.
 */
const getAccountBalances = async () => {
  const accounts = await Account.find().sort("name");

  const movements = await Transaction.aggregate([
    {
      $group: {
        _id: "$account",
        income: {
          $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] },
        },
        outgoing: {
          $sum: {
            $cond: [
              { $in: ["$type", ["expense", "salary", "transfer"]] },
              "$amount",
              0,
            ],
          },
        },
      },
    },
  ]);

  // Transfers credit the destination account.
  const transfersIn = await Transaction.aggregate([
    { $match: { type: "transfer", toAccount: { $ne: null } } },
    { $group: { _id: "$toAccount", amount: { $sum: "$amount" } } },
  ]);

  const outMap = new Map(movements.map((m) => [String(m._id), m]));
  const inMap = new Map(transfersIn.map((t) => [String(t._id), t.amount]));

  return accounts.map((account) => {
    const id = String(account._id);
    const movement = outMap.get(id);
    const balance =
      account.openingBalance +
      (movement?.income ?? 0) -
      (movement?.outgoing ?? 0) +
      (inMap.get(id) ?? 0);

    return { ...account.toObject(), balance };
  });
};

const createTransaction = async (
  payload: Record<string, unknown>,
  createdBy: string
) => {
  const account = await Account.findById(payload.account);
  if (!account) throw new AppError(httpStatus.BAD_REQUEST, "Account not found");

  if (payload.type === "transfer") {
    if (!payload.toAccount) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "A transfer needs a destination account"
      );
    }
    if (String(payload.toAccount) === String(payload.account)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "A transfer needs two different accounts"
      );
    }
  }

  return Transaction.create({ ...payload, createdBy });
};

/** Records a payment against a receivable and books the matching income. */
const addReceivablePayment = async (
  receivableId: string,
  payload: { amount: number; date: string; account: string; note?: string },
  createdBy: string
) => {
  const receivable = await Receivable.findById(receivableId);
  if (!receivable) {
    throw new AppError(httpStatus.NOT_FOUND, "Receivable not found");
  }

  const alreadyPaid = receivable.payments.reduce((t, p) => t + p.amount, 0);
  const outstanding = receivable.amount - alreadyPaid;

  if (payload.amount > outstanding) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `That's more than the ${outstanding} still outstanding`
    );
  }

  const transaction = await Transaction.create({
    type: "income",
    amount: payload.amount,
    account: payload.account,
    category: "Project income",
    date: payload.date,
    description: `Payment for ${receivable.title}`,
    project: receivable.project,
    receivable: receivable._id,
    createdBy,
  });

  receivable.payments.push({
    amount: payload.amount,
    date: payload.date,
    note: payload.note ?? "",
    transaction: transaction._id,
  });

  const paid = alreadyPaid + payload.amount;
  receivable.status =
    paid >= receivable.amount ? "paid" : paid > 0 ? "partial" : "pending";

  await receivable.save();
  return receivable;
};

/**
 * Builds draft payroll for a month from the attendance summary. Re-running is
 * safe: rows already approved or paid are left untouched.
 */
const generatePayroll = async (month: string, generatedBy: string) => {
  const summary = await AttendanceService.getMonthlySummary(month);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of summary.rows) {
    const existing = await PayrollRecord.findOne({
      employee: row.employee._id,
      month,
    });

    if (existing && existing.status !== "draft") {
      skipped += 1;
      continue;
    }

    const values = {
      employee: row.employee._id,
      month,
      scheduledDays: row.scheduledDays,
      presentDays: row.presentDays,
      lateDays: row.lateDays,
      incompleteDays: row.incompleteDays,
      leaveDays: row.leaveDays,
      absentDays: row.absentDays,
      totalWorkMinutes: row.totalWorkMinutes,
      attendancePct: row.attendancePct,
      bonusEligible: row.bonusEligible,
      baseSalary: row.baseSalary,
      bonus: row.bonus,
      netPayable: row.netPayable + (existing?.adjustment ?? 0),
      adjustment: existing?.adjustment ?? 0,
      status: "draft" as const,
      generatedBy: new Types.ObjectId(generatedBy),
    };

    if (existing) {
      Object.assign(existing, values);
      await existing.save();
      updated += 1;
    } else {
      await PayrollRecord.create(values);
      created += 1;
    }
  }

  return { month, created, updated, skipped, total: summary.rows.length };
};

const getPayroll = async (month: string) => {
  const records = await PayrollRecord.find({ month })
    .populate("employee", "employeeId fullName designation")
    .sort("employee");

  const totals = records.reduce(
    (acc, r) => ({
      records: acc.records + 1,
      baseSalary: acc.baseSalary + r.baseSalary,
      bonus: acc.bonus + r.bonus,
      adjustment: acc.adjustment + r.adjustment,
      netPayable: acc.netPayable + r.netPayable,
      paid: acc.paid + (r.status === "paid" ? r.netPayable : 0),
      pending: acc.pending + (r.status !== "paid" ? r.netPayable : 0),
    }),
    {
      records: 0,
      baseSalary: 0,
      bonus: 0,
      adjustment: 0,
      netPayable: 0,
      paid: 0,
      pending: 0,
    }
  );

  return { month, records, totals };
};

/** Updates a draft row; the net payable is recomputed from the adjustment. */
const updatePayrollRecord = async (
  id: string,
  payload: { adjustment?: number; adjustmentNote?: string; status?: string }
) => {
  const record = await PayrollRecord.findById(id);
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Payroll record not found");

  if (record.status === "paid") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This payslip has been paid — reverse the payment before editing it"
    );
  }

  if (payload.adjustment !== undefined) {
    record.adjustment = payload.adjustment;
    record.netPayable = record.baseSalary + record.bonus + payload.adjustment;
  }
  if (payload.adjustmentNote !== undefined) {
    record.adjustmentNote = payload.adjustmentNote;
  }
  if (payload.status === "approved" || payload.status === "draft") {
    record.status = payload.status;
  }

  await record.save();
  return record;
};

/** Marks a payslip paid and books the matching salary expense. */
const paySalary = async (
  id: string,
  payload: { account: string; date: string },
  createdBy: string
) => {
  const record = await PayrollRecord.findById(id).populate(
    "employee",
    "fullName employeeId"
  );
  if (!record) throw new AppError(httpStatus.NOT_FOUND, "Payroll record not found");
  if (record.status === "paid") {
    throw new AppError(httpStatus.BAD_REQUEST, "This payslip is already paid");
  }

  const account = await Account.findById(payload.account);
  if (!account) throw new AppError(httpStatus.BAD_REQUEST, "Account not found");

  const employee = record.employee as unknown as {
    fullName: string;
    employeeId: string;
  };

  const transaction = await Transaction.create({
    type: "salary",
    amount: record.netPayable,
    account: payload.account,
    category: "Salary",
    date: payload.date,
    description: `Salary for ${employee.fullName} (${record.month})`,
    employee: record.employee,
    payroll: record._id,
    createdBy,
  });

  record.status = "paid";
  record.paidAt = new Date();
  record.paidFrom = new Types.ObjectId(payload.account);
  record.transaction = transaction._id;
  await record.save();

  return record;
};

/** Everything the finance dashboard needs, in one call. */
const getOverview = async (month?: string) => {
  const targetMonth = month ?? new Date().toISOString().slice(0, 7);

  const accounts = await getAccountBalances();
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const monthAgg = await Transaction.aggregate([
    { $match: { date: { $regex: `^${targetMonth}` } } },
    { $group: { _id: "$type", total: { $sum: "$amount" } } },
  ]);

  const byType = Object.fromEntries(
    monthAgg.map((row) => [row._id, row.total])
  ) as Record<string, number>;

  const monthIncome = byType.income ?? 0;
  const monthExpense = (byType.expense ?? 0) + (byType.salary ?? 0);

  // Last 6 months of income vs expense for the chart.
  const now = new Date();
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const trendAgg = await Transaction.aggregate([
    { $match: { date: { $gte: `${months[0]}-01` } } },
    {
      $group: {
        _id: { month: { $substr: ["$date", 0, 7] }, type: "$type" },
        total: { $sum: "$amount" },
      },
    },
  ]);

  const trend = months.map((m) => {
    const income =
      trendAgg.find((r) => r._id.month === m && r._id.type === "income")?.total ?? 0;
    const expense =
      (trendAgg.find((r) => r._id.month === m && r._id.type === "expense")?.total ?? 0) +
      (trendAgg.find((r) => r._id.month === m && r._id.type === "salary")?.total ?? 0);
    return { month: m, income, expense };
  });

  // Income grouped by project.
  const byProject = await Transaction.aggregate([
    { $match: { type: "income", project: { $ne: null } } },
    { $group: { _id: "$project", total: { $sum: "$amount" } } },
    { $sort: { total: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "projects",
        localField: "_id",
        foreignField: "_id",
        as: "project",
      },
    },
    {
      $project: {
        total: 1,
        name: { $ifNull: [{ $arrayElemAt: ["$project.name", 0] }, "Unassigned"] },
      },
    },
  ]);

  const receivables = await Receivable.find({
    status: { $in: ["pending", "partial"] },
  }).sort("dueDate");

  const pendingIncome = receivables.reduce((sum, r) => {
    const paid = r.payments.reduce((t, p) => t + p.amount, 0);
    return sum + (r.amount - paid);
  }, 0);

  const payrollPending = await PayrollRecord.aggregate([
    { $match: { status: { $ne: "paid" } } },
    { $group: { _id: null, total: { $sum: "$netPayable" } } },
  ]);

  const activeEmployees = await Employee.countDocuments({ isActive: true });

  return {
    month: targetMonth,
    accounts,
    totals: {
      balance: totalBalance,
      monthIncome,
      monthExpense,
      monthNet: monthIncome - monthExpense,
      pendingIncome,
      pendingPayroll: payrollPending[0]?.total ?? 0,
      activeEmployees,
    },
    trend,
    incomeByProject: byProject,
    upcomingReceivables: receivables.slice(0, 8),
  };
};

export const FinanceService = {
  getAccountBalances,
  createTransaction,
  addReceivablePayment,
  generatePayroll,
  getPayroll,
  updatePayrollRecord,
  paySalary,
  getOverview,
};
