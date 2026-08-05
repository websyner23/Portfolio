import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { User } from "../user/user.model";
import { ALL_PERMISSIONS, PERMISSION_GROUPS, SUPER_ADMIN_ROLE } from "./role.constant";
import { TRole } from "./role.interface";
import { Role } from "./role.model";

const getPermissionCatalog = () => ({
  groups: PERMISSION_GROUPS,
  all: ALL_PERMISSIONS,
});

const createRole = async (payload: TRole) => {
  const invalid = payload.permissions.filter(
    (p) => !ALL_PERMISSIONS.includes(p)
  );
  if (invalid.length) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Unknown permissions: ${invalid.join(", ")}`
    );
  }
  return Role.create({ ...payload, isSystem: false });
};

const getAllRoles = async (query: Record<string, unknown>) => {
  const qb = new QueryBuilder(Role.find(), query)
    .search(["name", "description"])
    .filter()
    .sort()
    .paginate()
    .fields();
  const data = await qb.modelQuery;
  const meta = await qb.countTotal();
  return { data, meta };
};

const getRoleById = async (id: string) => {
  const role = await Role.findById(id);
  if (!role) throw new AppError(httpStatus.NOT_FOUND, "Role not found");
  return role;
};

const updateRole = async (id: string, payload: Partial<TRole>) => {
  const role = await Role.findById(id);
  if (!role) throw new AppError(httpStatus.NOT_FOUND, "Role not found");
  if (role.name === SUPER_ADMIN_ROLE) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "The super-admin role cannot be modified"
    );
  }
  if (payload.permissions) {
    const invalid = payload.permissions.filter(
      (p) => !ALL_PERMISSIONS.includes(p)
    );
    if (invalid.length) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Unknown permissions: ${invalid.join(", ")}`
      );
    }
  }
  Object.assign(role, payload);
  await role.save();
  return role;
};

const deleteRole = async (id: string) => {
  const role = await Role.findById(id);
  if (!role) throw new AppError(httpStatus.NOT_FOUND, "Role not found");
  if (role.isSystem) {
    throw new AppError(httpStatus.FORBIDDEN, "System roles cannot be deleted");
  }
  const usersWithRole = await User.countDocuments({ role: role._id });
  if (usersWithRole > 0) {
    throw new AppError(
      httpStatus.CONFLICT,
      `${usersWithRole} user(s) still use this role`
    );
  }
  await role.deleteOne();
  return role;
};

export const RoleService = {
  getPermissionCatalog,
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
};
