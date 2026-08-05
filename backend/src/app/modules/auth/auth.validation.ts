import { z } from "zod";

const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .email("Enter a valid email"),
    password: z.string({ required_error: "Password is required" }).min(1),
  }),
});

const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string({ required_error: "Old password is required" }),
    newPassword: z
      .string({ required_error: "New password is required" })
      .min(6, "Password must be at least 6 characters"),
  }),
});

const refreshTokenSchema = z.object({
  cookies: z.object({
    refreshToken: z.string({
      required_error: "Refresh token missing — log in again",
    }),
  }),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string({ required_error: "Email is required" }).email(),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string({ required_error: "Email is required" }).email(),
    token: z.string({ required_error: "Reset token is required" }),
    newPassword: z
      .string({ required_error: "New password is required" })
      .min(6),
  }),
});

export const AuthValidation = {
  loginSchema,
  changePasswordSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
