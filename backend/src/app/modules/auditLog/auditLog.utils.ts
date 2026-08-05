import { Request } from "express";
import { Types } from "mongoose";
import { getDeviceInfo } from "../../utils/deviceInfo";
import { TAuditLog } from "./auditLog.interface";
import { AuditLog } from "./auditLog.model";

/**
 * Fire-and-forget audit writer. Never throws — auditing must not break requests.
 */
export const recordAudit = (
  req: Request,
  entry: Omit<TAuditLog, "ip" | "userAgent" | "device" | "user"> & {
    user?: Types.ObjectId | string;
  }
) => {
  const info = getDeviceInfo(req);
  AuditLog.create({
    ...entry,
    user: entry.user ? new Types.ObjectId(String(entry.user)) : undefined,
    method: entry.method ?? req.method,
    endpoint: entry.endpoint ?? req.originalUrl,
    ...info,
  }).catch((err) => {
    console.error("[audit] failed to record:", (err as Error).message);
  });
};
