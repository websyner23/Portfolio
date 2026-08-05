import { Router } from "express";
import auth from "../../middlewares/auth";
import { AuditLogController } from "./auditLog.controller";

const router = Router();

// Audit logs are read-only by design — there is no create/update/delete API.
router.get("/", auth("audit.view"), AuditLogController.getAuditLogs);

export const AuditLogRoutes = router;
