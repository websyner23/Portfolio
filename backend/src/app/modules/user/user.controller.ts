import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { recordAudit } from "../auditLog/auditLog.utils";
import { UserService } from "./user.service";

const createUser = catchAsync(async (req, res) => {
  const result = await UserService.createUser(req.body);

  recordAudit(req, {
    user: req.user._id,
    action: "user.create",
    module: "users",
    targetId: String(result.user?._id),
    description: `Created user ${result.user?.email}`,
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "User created — credentials emailed",
    data: result,
  });
});

const getAllUsers = catchAsync(async (req, res) => {
  const { data, meta } = await UserService.getAllUsers(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Users retrieved",
    meta,
    data,
  });
});

const getUserById = catchAsync(async (req, res) => {
  const data = await UserService.getUserById(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "User retrieved",
    data,
  });
});

const updateUser = catchAsync(async (req, res) => {
  const data = await UserService.updateUser(req.params.id, req.body);

  recordAudit(req, {
    user: req.user._id,
    action: "user.update",
    module: "users",
    targetId: req.params.id,
    description: `Updated user ${data?.email}`,
    meta: { changes: Object.keys(req.body) },
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "User updated",
    data,
  });
});

const resetUserPassword = catchAsync(async (req, res) => {
  await UserService.resetUserPassword(req.params.id, req.body.newPassword);

  recordAudit(req, {
    user: req.user._id,
    action: "user.reset-password",
    module: "users",
    targetId: req.params.id,
    description: "Reset a user's password",
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Password reset — the user must change it at next login",
  });
});

const deleteUser = catchAsync(async (req, res) => {
  const user = await UserService.deleteUser(req.params.id, req.user._id);

  recordAudit(req, {
    user: req.user._id,
    action: "user.delete",
    module: "users",
    targetId: req.params.id,
    description: `Deleted user ${user.email}`,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "User deleted",
  });
});

export const UserController = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  resetUserPassword,
  deleteUser,
};
