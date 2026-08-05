import { z } from "zod";

const createRoleSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: "Role name is required" })
      .min(2)
      .max(50)
      .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes"),
    description: z.string().max(200).optional(),
    permissions: z.array(z.string()).default([]),
  }),
});

const updateRoleSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2)
      .max(50)
      .regex(/^[a-z0-9-]+$/)
      .optional(),
    description: z.string().max(200).optional(),
    permissions: z.array(z.string()).optional(),
  }),
});

export const RoleValidation = { createRoleSchema, updateRoleSchema };
