import { Types } from "mongoose";

export type TAuditLog = {
  user?: Types.ObjectId;
  action: string;
  module: string;
  targetId?: string;
  description: string;
  method?: string;
  endpoint?: string;
  statusCode?: number;
  ip?: string;
  userAgent?: string;
  device?: {
    browser: string;
    os: string;
    deviceType: string;
  };
  meta?: Record<string, unknown>;
};
