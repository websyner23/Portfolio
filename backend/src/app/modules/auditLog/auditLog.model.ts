import { model, Schema } from "mongoose";
import { TAuditLog } from "./auditLog.interface";

const auditLogSchema = new Schema<TAuditLog>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    module: { type: String, required: true },
    targetId: { type: String },
    description: { type: String, required: true },
    method: { type: String },
    endpoint: { type: String },
    statusCode: { type: Number },
    ip: { type: String },
    userAgent: { type: String },
    device: {
      browser: { type: String },
      os: { type: String },
      deviceType: { type: String },
    },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ module: 1, action: 1 });

export const AuditLog = model<TAuditLog>("AuditLog", auditLogSchema);
