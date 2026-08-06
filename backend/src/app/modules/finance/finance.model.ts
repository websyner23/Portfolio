import { model, Schema } from "mongoose";

/* ------------------------------- Accounts ------------------------------- */

const accountSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["cash", "bank", "mobile-banking", "other"],
      default: "bank",
    },
    openingBalance: { type: Number, default: 0 },
    accountNumber: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Account = model("Account", accountSchema);

/* ----------------------------- Transactions ----------------------------- */

export const TRANSACTION_TYPES = [
  "income",
  "expense",
  "salary",
  "transfer",
] as const;

/**
 * Every movement of money. Balances are always derived by summing these
 * against an account's opening balance — never stored on the account, so a
 * balance can't drift out of sync with its history.
 */
const transactionSchema = new Schema(
  {
    type: { type: String, enum: TRANSACTION_TYPES, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    account: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    // Destination account, transfers only.
    toAccount: { type: Schema.Types.ObjectId, ref: "Account" },
    category: { type: String, default: "", index: true },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD
    description: { type: String, default: "" },
    project: { type: Schema.Types.ObjectId, ref: "Project" },
    employee: { type: Schema.Types.ObjectId, ref: "Employee" },
    payroll: { type: Schema.Types.ObjectId, ref: "PayrollRecord" },
    receivable: { type: Schema.Types.ObjectId, ref: "Receivable" },
    attachment: { url: String, publicId: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

transactionSchema.index({ date: -1 });

export const Transaction = model("Transaction", transactionSchema);

/* ------------------------------ Receivables ------------------------------ */

/** Money a client still owes — the "pending project income" figure. */
const receivableSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    client: { type: String, default: "" },
    project: { type: Schema.Types.ObjectId, ref: "Project" },
    amount: { type: Number, required: true, min: 0 },
    dueDate: { type: String, default: "" }, // YYYY-MM-DD
    status: {
      type: String,
      enum: ["pending", "partial", "paid", "written-off"],
      default: "pending",
      index: true,
    },
    payments: [
      {
        _id: false,
        amount: { type: Number, required: true },
        date: { type: String, required: true },
        note: { type: String, default: "" },
        transaction: { type: Schema.Types.ObjectId, ref: "Transaction" },
      },
    ],
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

/** Amount still outstanding on this receivable. */
receivableSchema.virtual("paidAmount").get(function () {
  return this.payments.reduce((total, p) => total + p.amount, 0);
});

receivableSchema.set("toJSON", { virtuals: true });
receivableSchema.set("toObject", { virtuals: true });

export const Receivable = model("Receivable", receivableSchema);

/* ------------------------------- Payroll ------------------------------- */

/**
 * A month's pay for one employee, snapshotted from attendance so later
 * corrections to old records never silently change a payslip already issued.
 */
const payrollRecordSchema = new Schema(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    month: { type: String, required: true, index: true }, // YYYY-MM
    scheduledDays: { type: Number, default: 0 },
    presentDays: { type: Number, default: 0 },
    lateDays: { type: Number, default: 0 },
    incompleteDays: { type: Number, default: 0 },
    leaveDays: { type: Number, default: 0 },
    absentDays: { type: Number, default: 0 },
    totalWorkMinutes: { type: Number, default: 0 },
    attendancePct: { type: Number, default: 0 },
    bonusEligible: { type: Boolean, default: false },
    baseSalary: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    adjustment: { type: Number, default: 0 },
    adjustmentNote: { type: String, default: "" },
    netPayable: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["draft", "approved", "paid"],
      default: "draft",
      index: true,
    },
    paidAt: { type: Date },
    paidFrom: { type: Schema.Types.ObjectId, ref: "Account" },
    transaction: { type: Schema.Types.ObjectId, ref: "Transaction" },
    generatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

payrollRecordSchema.index({ employee: 1, month: 1 }, { unique: true });

export const PayrollRecord = model("PayrollRecord", payrollRecordSchema);
