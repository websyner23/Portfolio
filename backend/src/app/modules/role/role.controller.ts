import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { RoleService } from "./role.service";

const getPermissions = catchAsync(async (req, res) => {
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Permission catalog retrieved",
    data: RoleService.getPermissionCatalog(),
  });
});

const createRole = catchAsync(async (req, res) => {
  const data = await RoleService.createRole(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Role created",
    data,
  });
});

const getAllRoles = catchAsync(async (req, res) => {
  const { data, meta } = await RoleService.getAllRoles(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Roles retrieved",
    meta,
    data,
  });
});

const getRoleById = catchAsync(async (req, res) => {
  const data = await RoleService.getRoleById(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Role retrieved",
    data,
  });
});

const updateRole = catchAsync(async (req, res) => {
  const data = await RoleService.updateRole(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Role updated",
    data,
  });
});

const deleteRole = catchAsync(async (req, res) => {
  await RoleService.deleteRole(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Role deleted",
  });
});

export const RoleController = {
  getPermissions,
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
};
