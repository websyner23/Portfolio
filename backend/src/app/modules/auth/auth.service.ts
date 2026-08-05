import crypto from "crypto";
import httpStatus from "http-status";
import config from "../../../config";
import AppError from "../../errors/AppError";
import { createAccessToken, createRefreshToken, verifyToken } from "../../utils/jwt";
import { emailLayout, sendEmail } from "../../utils/sendEmail";
import { User } from "../user/user.model";

type TRoleShape = { _id: string; name: string; permissions: string[] };

const buildUserPayload = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any
) => ({
  _id: String(user._id),
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  role: {
    _id: String(user.role._id),
    name: (user.role as TRoleShape).name,
    permissions: (user.role as TRoleShape).permissions,
  },
  employee: user.employee ? String(user.employee) : undefined,
  needsPasswordChange: user.needsPasswordChange,
  lastLoginAt: user.lastLoginAt,
});

const login = async (payload: { email: string; password: string }) => {
  const user = await User.findOne({ email: payload.email.toLowerCase() })
    .select("+password")
    .populate("role", "name permissions");

  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid email or password");
  }
  if (user.status === "blocked") {
    throw new AppError(httpStatus.FORBIDDEN, "Your account is blocked");
  }

  const matched = await User.isPasswordMatched(payload.password, user.password);
  if (!matched) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid email or password");
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  return {
    accessToken: createAccessToken(String(user._id)),
    refreshToken: createRefreshToken(String(user._id)),
    needsPasswordChange: user.needsPasswordChange,
    user: buildUserPayload(user),
  };
};

const refreshToken = async (token: string) => {
  let decoded;
  try {
    decoded = verifyToken(token, config.jwt.refreshSecret);
  } catch {
    throw new AppError(httpStatus.UNAUTHORIZED, "Session expired — log in again");
  }

  const user = await User.findById(decoded.userId).populate(
    "role",
    "name permissions"
  );
  if (!user || user.status === "blocked") {
    throw new AppError(httpStatus.UNAUTHORIZED, "Session is no longer valid");
  }
  if (
    user.passwordChangedAt &&
    decoded.iat &&
    User.isJWTIssuedBeforePasswordChanged(user.passwordChangedAt, decoded.iat)
  ) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Session expired — log in again");
  }

  return {
    accessToken: createAccessToken(String(user._id)),
    user: buildUserPayload(user),
  };
};

const getMe = async (userId: string) => {
  const user = await User.findById(userId).populate("role", "name permissions");
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");
  return buildUserPayload(user);
};

const changePassword = async (
  userId: string,
  payload: { oldPassword: string; newPassword: string }
) => {
  const user = await User.findById(userId).select("+password");
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  const matched = await User.isPasswordMatched(
    payload.oldPassword,
    user.password
  );
  if (!matched) {
    throw new AppError(httpStatus.BAD_REQUEST, "Current password is incorrect");
  }

  user.password = payload.newPassword;
  user.needsPasswordChange = false;
  user.passwordChangedAt = new Date();
  await user.save();
};

const forgotPassword = async (email: string) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  // Always report success so the endpoint can't be used to enumerate accounts.
  if (!user) return;

  const resetToken = crypto.randomBytes(24).toString("hex");
  const hashed = crypto.createHash("sha256").update(resetToken).digest("hex");

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        resetPasswordToken: hashed,
        resetPasswordExpires: new Date(Date.now() + 30 * 60 * 1000),
      },
    }
  );

  const link = `${config.adminUrl}/reset-password?email=${encodeURIComponent(
    user.email
  )}&token=${resetToken}`;

  await sendEmail({
    to: user.email,
    subject: "Reset your WebSyner admin password",
    html: emailLayout(
      "Password reset requested",
      `<p>Hi ${user.name}, use the link below to set a new password. It expires in 30 minutes.</p>
       <p><a href="${link}" style="display:inline-block;background:#0fcda1;color:#1e2d40;font-weight:700;padding:10px 18px;border-radius:999px;text-decoration:none">Reset password</a></p>
       <p style="color:#8695a3;font-size:12px">If you didn't request this, you can ignore this email.</p>`
    ),
  });
};

const resetPassword = async (payload: {
  email: string;
  token: string;
  newPassword: string;
}) => {
  const hashed = crypto
    .createHash("sha256")
    .update(payload.token)
    .digest("hex");

  const user = await User.findOne({
    email: payload.email.toLowerCase(),
  }).select("+password +resetPasswordToken +resetPasswordExpires");

  if (
    !user ||
    user.resetPasswordToken !== hashed ||
    !user.resetPasswordExpires ||
    user.resetPasswordExpires < new Date()
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Reset link is invalid or has expired"
    );
  }

  user.password = payload.newPassword;
  user.needsPasswordChange = false;
  user.passwordChangedAt = new Date();
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
};

export const AuthService = {
  login,
  refreshToken,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
};
