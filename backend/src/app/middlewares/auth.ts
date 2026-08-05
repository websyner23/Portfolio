import httpStatus from "http-status";
import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../../config";
import AppError from "../errors/AppError";
import { TAuthedUser } from "../interface/auth";
import { SUPER_ADMIN_ROLE } from "../modules/role/role.constant";
import { User } from "../modules/user/user.model";
import catchAsync from "../utils/catchAsync";

/**
 * auth() — any logged-in user.
 * auth("cms.manage") — user whose role has ANY of the listed permissions.
 * The super-admin role always passes.
 */
const auth = (...requiredPermissions: string[]) =>
  catchAsync(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : undefined;

    if (!token) {
      throw new AppError(httpStatus.UNAUTHORIZED, "You are not logged in");
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, config.jwt.accessSecret) as JwtPayload;
    } catch {
      throw new AppError(httpStatus.UNAUTHORIZED, "Invalid or expired token");
    }

    const user = await User.findById(decoded.userId).populate<{
      role: { _id: string; name: string; permissions: string[] };
    }>("role", "name permissions");

    if (!user) {
      throw new AppError(httpStatus.UNAUTHORIZED, "User no longer exists");
    }
    if (user.status === "blocked") {
      throw new AppError(httpStatus.FORBIDDEN, "Your account is blocked");
    }
    if (
      user.passwordChangedAt &&
      decoded.iat &&
      User.isJWTIssuedBeforePasswordChanged(user.passwordChangedAt, decoded.iat)
    ) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Password changed recently — please log in again"
      );
    }

    const roleName = user.role?.name ?? "";
    const permissions = user.role?.permissions ?? [];

    if (
      requiredPermissions.length > 0 &&
      roleName !== SUPER_ADMIN_ROLE &&
      !requiredPermissions.some((p) => permissions.includes(p))
    ) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You don't have permission for this action"
      );
    }

    const authedUser: TAuthedUser = {
      _id: String(user._id),
      name: user.name,
      email: user.email,
      role: {
        _id: String(user.role._id),
        name: roleName,
        permissions,
      },
      employee: user.employee ? String(user.employee) : undefined,
    };

    req.user = authedUser;
    next();
  });

export default auth;
