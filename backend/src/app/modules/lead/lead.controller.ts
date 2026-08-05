import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import { getDeviceInfo } from "../../utils/deviceInfo";
import sendResponse from "../../utils/sendResponse";
import { recordAudit } from "../auditLog/auditLog.utils";
import { LeadService } from "./lead.service";

/** Public endpoint — no auth. Called by the website's contact and hero forms. */
const createLead = catchAsync(async (req, res) => {
  const info = getDeviceInfo(req);
  const lead = await LeadService.createLead(req.body, {
    ip: info.ip,
    userAgent: info.userAgent,
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Thanks — we'll be in touch within one business day.",
    data: { _id: lead._id },
  });
});

const getAllLeads = catchAsync(async (req, res) => {
  const { data, meta } = await LeadService.getAllLeads(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Leads retrieved",
    meta,
    data,
  });
});

const getLeadStats = catchAsync(async (req, res) => {
  const data = await LeadService.getLeadStats();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Lead stats retrieved",
    data,
  });
});

const getLeadById = catchAsync(async (req, res) => {
  const data = await LeadService.getLeadById(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Lead retrieved",
    data,
  });
});

const updateLead = catchAsync(async (req, res) => {
  const data = await LeadService.updateLead(req.params.id, req.body);

  recordAudit(req, {
    user: req.user._id,
    action: "lead.update",
    module: "leads",
    targetId: req.params.id,
    description: `Updated lead from ${data.name}`,
    meta: { changes: Object.keys(req.body ?? {}) },
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Lead updated",
    data,
  });
});

const addNote = catchAsync(async (req, res) => {
  const data = await LeadService.addNote(
    req.params.id,
    req.body.body,
    req.user._id
  );

  recordAudit(req, {
    user: req.user._id,
    action: "lead.note",
    module: "leads",
    targetId: req.params.id,
    description: `Added a note to the lead from ${data.name}`,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Note added",
    data,
  });
});

const deleteLead = catchAsync(async (req, res) => {
  const lead = await LeadService.deleteLead(req.params.id);

  recordAudit(req, {
    user: req.user._id,
    action: "lead.delete",
    module: "leads",
    targetId: req.params.id,
    description: `Deleted the lead from ${lead.name}`,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Lead deleted",
  });
});

export const LeadController = {
  createLead,
  getAllLeads,
  getLeadStats,
  getLeadById,
  updateLead,
  addNote,
  deleteLead,
};
