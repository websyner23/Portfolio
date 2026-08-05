import { model, Schema } from "mongoose";
import { TRole } from "./role.interface";

const roleSchema = new Schema<TRole>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String },
    permissions: { type: [String], default: [] },
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Role = model<TRole>("Role", roleSchema);
