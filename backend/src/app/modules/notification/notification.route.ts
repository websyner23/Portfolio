import { Router } from "express";
import httpStatus from "http-status";
import { Types } from "mongoose";
import QueryBuilder from "../../builder/QueryBuilder";
import auth from "../../middlewares/auth";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { Notification } from "./notification.model";

const router = Router();

router.get(
  "/",
  auth(),
  catchAsync(async (req, res) => {
    const qb = new QueryBuilder(Notification.find(), {
      limit: 20,
      ...req.query,
    })
      .filter()
      .sort()
      .paginate();

    const data = await qb.modelQuery;
    const meta = await qb.countTotal();

    const userId = new Types.ObjectId(req.user._id);
    const unreadCount = await Notification.countDocuments({
      readBy: { $ne: userId },
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Notifications retrieved",
      meta,
      data: {
        items: data.map((n) => ({
          ...n.toObject(),
          isRead: n.readBy.some((id) => String(id) === req.user._id),
        })),
        unreadCount,
      },
    });
  })
);

router.patch(
  "/:id/read",
  auth(),
  catchAsync(async (req, res) => {
    await Notification.findByIdAndUpdate(req.params.id, {
      $addToSet: { readBy: req.user._id },
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Notification marked as read",
    });
  })
);

router.patch(
  "/read-all",
  auth(),
  catchAsync(async (req, res) => {
    await Notification.updateMany(
      { readBy: { $ne: new Types.ObjectId(req.user._id) } },
      { $addToSet: { readBy: req.user._id } }
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "All notifications marked as read",
    });
  })
);

export const NotificationRoutes = router;
