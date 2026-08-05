import { Response } from "express";
import httpStatus from "http-status";
import config from "../../../config";
import { verifyToken } from "../../utils/jwt";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { recordAudit } from "../auditLog/auditLog.utils";
import { AuthService } from "./auth.service";

const REFRESH_COOKIE = "refreshToken";

const setRefreshCookie = (res: Response, token: string) => {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: config.env === "production",
    sameSite: config.env === "production" ? "none" : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: "/",
  });
};

const login = catchAsync(async (req, res) => {
  const result = await AuthService.login(req.body);
  setRefreshCookie(res, result.refreshToken);

  recordAudit(req, {
    user: result.user._id,
    action: "auth.login",
    module: "auth",
    description: `${result.user.name} logged in`,
    statusCode: httpStatus.OK,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Logged in successfully",
    data: {
      accessToken: result.accessToken,
      needsPasswordChange: result.needsPasswordChange,
      user: result.user,
    },
  });
});

/**
 * Logout is intentionally unauthenticated: an expired access token must still
 * be able to clear the refresh cookie. The user is identified from the refresh
 * cookie purely for the audit trail.
 */
const logout = catchAsync(async (req, res) => {
  let userId: string | undefined;
  const cookie = req.cookies?.[REFRESH_COOKIE];
  if (cookie) {
    try {
      userId = verifyToken(cookie, config.jwt.refreshSecret).userId;
    } catch {
      userId = undefined;
    }
  }

  res.clearCookie(REFRESH_COOKIE, { path: "/" });

  if (userId) {
    recordAudit(req, {
      user: userId,
      action: "auth.logout",
      module: "auth",
      description: "User logged out",
      statusCode: httpStatus.OK,
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Logged out successfully",
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const result = await AuthService.refreshToken(req.cookies[REFRESH_COOKIE]);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Access token refreshed",
    data: result,
  });
});

const getMe = catchAsync(async (req, res) => {
  const data = await AuthService.getMe(req.user._id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Profile retrieved",
    data,
  });
});

const changePassword = catchAsync(async (req, res) => {
  await AuthService.changePassword(req.user._id, req.body);

  recordAudit(req, {
    user: req.user._id,
    action: "auth.change-password",
    module: "auth",
    description: `${req.user.name} changed their password`,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Password changed successfully",
  });
});

const forgotPassword = catchAsync(async (req, res) => {
  await AuthService.forgotPassword(req.body.email);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "If that email exists, a reset link has been sent",
  });
});

const resetPassword = catchAsync(async (req, res) => {
  await AuthService.resetPassword(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Password reset successfully — you can now log in",
  });
});

export const AuthController = {
  login,
  logout,
  refreshToken,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
};
