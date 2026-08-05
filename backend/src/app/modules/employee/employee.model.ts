import { model, Schema } from "mongoose";

/** Mirrors the Employees tab of the HRM sheet this replaces. */
const employeeSchema = new Schema(
  {
    employeeId: { type: String, required: true, unique: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    designation: { type: String, default: "" },
    department: { type: String, default: "" },
    phone: { type: String, default: "" },
    joinDate: { type: String, required: true }, // YYYY-MM-DD
    lastWorkingDate: { type: String, default: "" },
    isActive: { type: Boolean, default: true, index: true },
    baseSalary: { type: Number, default: 0 },
    perfectBonus: { type: Number, default: 0 },
    photo: { url: String, publicId: String },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Employee = model("Employee", employeeSchema);

/** Generates the next sequential id, e.g. WS-001 → WS-002. */
export const nextEmployeeId = async (prefix = "WS"): Promise<string> => {
  const latest = await Employee.findOne({
    employeeId: new RegExp(`^${prefix}-\\d+$`),
  })
    .sort({ employeeId: -1 })
    .select("employeeId");

  const current = latest ? Number(latest.employeeId.split("-")[1]) : 0;
  return `${prefix}-${String(current + 1).padStart(3, "0")}`;
};
