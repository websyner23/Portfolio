import { Router } from "express";
import httpStatus from "http-status";
import auth from "../../middlewares/auth";
import AppError from "../../errors/AppError";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import {
  destroyFromCloudinary,
  upload,
  uploadToCloudinary,
} from "../../utils/upload";
import { recordAudit } from "../auditLog/auditLog.utils";

const router = Router();

router.post(
  "/upload",
  auth(),
  upload.single("file"),
  catchAsync(async (req, res) => {
    if (!req.file) {
      throw new AppError(httpStatus.BAD_REQUEST, "No file was uploaded");
    }

    const folder = (req.body?.folder as string) || "websyner";
    const result = await uploadToCloudinary(req.file.buffer, folder);

    recordAudit(req, {
      user: req.user._id,
      action: "media.upload",
      module: "media",
      targetId: result.publicId,
      description: `Uploaded ${req.file.originalname}`,
      meta: { bytes: result.bytes, format: result.format },
    });

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      message: "File uploaded",
      data: result,
    });
  })
);

router.delete(
  "/:publicId(*)",
  auth(),
  catchAsync(async (req, res) => {
    await destroyFromCloudinary(req.params.publicId);

    recordAudit(req, {
      user: req.user._id,
      action: "media.delete",
      module: "media",
      targetId: req.params.publicId,
      description: `Deleted media ${req.params.publicId}`,
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "File deleted",
    });
  })
);

export const MediaRoutes = router;
