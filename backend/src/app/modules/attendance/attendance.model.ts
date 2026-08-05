import { model, Schema } from "mongoose";

export const ATTENDANCE_STATUSES = [
  "present",
  "late",
  "incomplete",
  "absent",
  "leave",
  "optional-off",
] as const;

/**
 * Company-wide shift rules. Defaults mirror the HRM sheet this replaces:
 * a 10:00 PM – 1:00 AM shift, punches before 6:00 AM counted against the
 * previous day, and optional Friday/Saturday work.
 */
const attendanceSettingsSchema = new Schema(
  {
    key: { type: String, default: "default", unique: true, immutable: true },
    shiftStart: { type: String, default: "22:00" },
    shiftEnd: { type: String, default: "01:00" },
    overnightCutoff: { type: String, default: "06:00" },
    graceMinutes: { type: Number, default: 10 },
    requiredDailyMinutes: { type: Number, default: 180 },
    // 0 = Sunday … 5 = Friday, 6 = Saturday
    optionalWeekdays: { type: [Number], default: [5, 6] },
    timezone: { type: String, default: "Asia/Dhaka" },
    currency: { type: String, default: "BDT" },
    defaultBaseSalary: { type: Number, default: 4000 },
    defaultPerfectBonus: { type: Number, default: 1000 },
  },
  { timestamps: true }
);

export const AttendanceSettings = model(
  "AttendanceSettings",
  attendanceSettingsSchema
);

/** One document per employee per shift date. */
const attendanceSchema = new Schema(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    // The shift this belongs to, not the wall-clock date of the punch.
    shiftDate: { type: String, required: true, index: true }, // YYYY-MM-DD
    sessions: [
      {
        _id: false,
        in: { type: Date, required: true },
        out: { type: Date },
        autoClosed: { type: Boolean, default: false },
      },
    ],
    workedMinutes: { type: Number, default: 0 },
    lateMinutes: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ATTENDANCE_STATUSES,
      default: "present",
      index: true,
    },
    isFinalized: { type: Boolean, default: false },
    source: { type: String, enum: ["self", "admin", "system"], default: "self" },
    editedBy: { type: Schema.Types.ObjectId, ref: "User" },
    note: { type: String, default: "" },
    ip: { type: String },
    device: { type: String },
  },
  { timestamps: true }
);

attendanceSchema.index({ employee: 1, shiftDate: 1 }, { unique: true });

export const Attendance = model("Attendance", attendanceSchema);

const leaveSchema = new Schema(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    startDate: { type: String, required: true }, // YYYY-MM-DD
    endDate: { type: String, required: true },
    type: {
      type: String,
      enum: ["paid", "unpaid", "sick", "other"],
      default: "paid",
    },
    reason: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewNote: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Leave = model("Leave", leaveSchema);
