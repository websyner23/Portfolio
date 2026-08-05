import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AuditLog } from "./auditLog.model";

const getAuditLogs = catchAsync(async (req, res) => {
  const query = { ...req.query };

  // Date-range filtering: ?from=2026-08-01&to=2026-08-31
  const from = query.from as string | undefined;
  const to = query.to as string | undefined;
  delete query.from;
  delete query.to;

  let baseQuery = AuditLog.find();
  if (from || to) {
    const range: Record<string, Date> = {};
    if (from) range.$gte = new Date(from);
    if (to) range.$lte = new Date(`${to}T23:59:59.999Z`);
    baseQuery = baseQuery.find({ createdAt: range });
  }

  const qb = new QueryBuilder(baseQuery.populate("user", "name email"), query)
    .search(["action", "module", "description", "endpoint"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const data = await qb.modelQuery;
  const meta = await qb.countTotal();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Audit logs retrieved",
    meta,
    data,
  });
});

export const AuditLogController = { getAuditLogs };
