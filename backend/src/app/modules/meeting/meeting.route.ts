import { Router } from "express";
import httpStatus from "http-status";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { recordAudit } from "../auditLog/auditLog.utils";
import { MeetingService } from "./meeting.service";
import { MeetingValidation } from "./meeting.validation";

const router = Router();
const MANAGE = "meetings.manage";

router.get(
  "/settings",
  auth(MANAGE),
  catchAsync(async (req, res) => {
    const data = await MeetingService.getSettings();
    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Meeting settings retrieved",
      data,
    });
  })
);

router.patch(
  "/settings",
  auth(MANAGE),
  validateRequest(MeetingValidation.updateSettingsSchema),
  catchAsync(async (req, res) => {
    const data = await MeetingService.updateSettings(req.body);

    recordAudit(req, {
      user: req.user._id,
      action: "meeting.settings",
      module: "meetings",
      description: "Updated meeting availability settings",
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Meeting settings updated",
      data,
    });
  })
);

router.get(
  "/upcoming",
  auth(MANAGE),
  catchAsync(async (req, res) => {
    const data = await MeetingService.getUpcoming(Number(req.query.limit) || 5);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Upcoming meetings retrieved",
      data,
    });
  })
);

router.get(
  "/",
  auth(MANAGE),
  catchAsync(async (req, res) => {
    const { data, meta } = await MeetingService.getAllMeetings(req.query);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Meetings retrieved",
      meta,
      data,
    });
  })
);

router.patch(
  "/:id",
  auth(MANAGE),
  validateRequest(MeetingValidation.updateMeetingSchema),
  catchAsync(async (req, res) => {
    const data = await MeetingService.updateMeeting(req.params.id, req.body);

    recordAudit(req, {
      user: req.user._id,
      action: "meeting.update",
      module: "meetings",
      targetId: req.params.id,
      description: `Meeting with ${data.name} → ${data.status}`,
      meta: { changes: Object.keys(req.body ?? {}) },
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Meeting updated — the visitor has been emailed",
      data,
    });
  })
);

router.delete(
  "/:id",
  auth(MANAGE),
  catchAsync(async (req, res) => {
    const meeting = await MeetingService.deleteMeeting(req.params.id);

    recordAudit(req, {
      user: req.user._id,
      action: "meeting.delete",
      module: "meetings",
      targetId: req.params.id,
      description: `Deleted the meeting with ${meeting.name}`,
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Meeting deleted",
    });
  })
);

export const MeetingRoutes = router;
