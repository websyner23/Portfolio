import { z } from "zod";

const createUserSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Name is required" }).min(2).max(60),
    email: z.string({ required_error: "Email is required" }).email(),
    password: z.string().min(6).optional(),
    role: z.string({ required_error: "Role is required" }),
    employee: z.string().optional(),
    avatar: z.string().url().optional(),
  }),
});

const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(60).optional(),
    email: z.string().email().optional(),
    role: z.string().optional(),
    employee: z.string().nullable().optional(),
    avatar: z.string().url().nullable().optional(),
    status: z.enum(["active", "blocked"]).optional(),
  }),
});

const resetUserPasswordSchema = z.object({
  body: z.object({
    newPassword: z.string({ required_error: "New password is required" }).min(6),
  }),
});

export const UserValidation = {
  createUserSchema,
  updateUserSchema,
  resetUserPasswordSchema,
};
