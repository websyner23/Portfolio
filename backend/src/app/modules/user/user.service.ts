import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { emailLayout, sendEmail } from "../../utils/sendEmail";
import config from "../../../config";
import { Role } from "../role/role.model";
import { SUPER_ADMIN_ROLE } from "../role/role.constant";
import { TUser } from "./user.interface";
import { User } from "./user.model";

const generatePassword = () =>
  `Ws${Math.random().toString(36).slice(-8)}${Math.floor(Math.random() * 90 + 10)}`;

const createUser = async (payload: Partial<TUser> & { password?: string }) => {
  const role = await Role.findById(payload.role);
  if (!role) throw new AppError(httpStatus.BAD_REQUEST, "Role does not exist");

  const password = payload.password || generatePassword();

  const user = await User.create({
    ...payload,
    password,
    needsPasswordChange: true,
    status: "active",
  });

  await sendEmail({
    to: user.email,
    subject: "Your WebSyner admin account",
    html: emailLayout(
      "Your account is ready",
      `<p>Hi ${user.name}, an account has been created for you on the WebSyner admin panel.</p>
       <p><strong>Email:</strong> ${user.email}<br/>
       <strong>Temporary password:</strong> ${password}</p>
       <p>You'll be asked to change this password after your first login.</p>
       <p><a href="${config.adminUrl}" style="display:inline-block;background:#0fcda1;color:#1e2d40;font-weight:700;padding:10px 18px;border-radius:999px;text-decoration:none">Open admin panel</a></p>`
    ),
  });

  const created = await User.findById(user._id).populate("role", "name permissions");
  return { user: created, temporaryPassword: payload.password ? undefined : password };
};

const getAllUsers = async (query: Record<string, unknown>) => {
  const qb = new QueryBuilder(
    User.find().populate("role", "name permissions").populate("employee", "employeeId fullName"),
    query
  )
    .search(["name", "email"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const data = await qb.modelQuery;
  const meta = await qb.countTotal();
  return { data, meta };
};

const getUserById = async (id: string) => {
  const user = await User.findById(id)
    .populate("role", "name permissions")
    .populate("employee", "employeeId fullName");
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");
  return user;
};

const updateUser = async (id: string, payload: Partial<TUser>) => {
  const user = await User.findById(id).populate("role", "name");
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  const currentRoleName = (user.role as unknown as { name: string })?.name;
  if (currentRoleName === SUPER_ADMIN_ROLE && payload.role) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "The super admin's role cannot be changed"
    );
  }
  if (payload.role) {
    const role = await Role.findById(payload.role);
    if (!role) throw new AppError(httpStatus.BAD_REQUEST, "Role does not exist");
  }

  const updated = await User.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  }).populate("role", "name permissions");

  // An employee record takes its name and email from the login account, so
  // keep the copy in step rather than letting the two drift apart.
  if (updated?.employee && (payload.name || payload.email)) {
    const { Employee } = await import("../employee/employee.model");
    await Employee.findByIdAndUpdate(updated.employee, {
      ...(payload.name ? { fullName: payload.name } : {}),
      ...(payload.email ? { email: payload.email } : {}),
    });
  }

  return updated;
};

const resetUserPassword = async (id: string, newPassword: string) => {
  const user = await User.findById(id).select("+password");
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  user.password = newPassword;
  user.needsPasswordChange = true;
  user.passwordChangedAt = new Date();
  await user.save();
};

const deleteUser = async (id: string, actingUserId: string) => {
  if (id === actingUserId) {
    throw new AppError(httpStatus.BAD_REQUEST, "You cannot delete your own account");
  }
  const user = await User.findById(id).populate("role", "name");
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  if ((user.role as unknown as { name: string })?.name === SUPER_ADMIN_ROLE) {
    throw new AppError(httpStatus.FORBIDDEN, "The super admin cannot be deleted");
  }

  await user.deleteOne();
  return user;
};

export const UserService = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  resetUserPassword,
  deleteUser,
};
