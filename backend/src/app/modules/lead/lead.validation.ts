import { z } from "zod";
import { LEAD_STATUSES } from "./lead.model";

/** Mirrors the website's contact-form schema; the hero form sends a subset. */
const createLeadSchema = z.object({
  body: z.object({
    type: z.enum(["contact", "quick-quote"]).default("contact"),
    name: z.string({ required_error: "Name is required" }).min(2).max(80),
    email: z
      .string({ required_error: "Email is required" })
      .email("Enter a valid email"),
    phone: z.string().max(40).optional().or(z.literal("")),
    company: z.string().max(120).optional().or(z.literal("")),
    service: z.string().max(120).optional().or(z.literal("")),
    budget: z.string().max(60).optional().or(z.literal("")),
    timeline: z.string().max(60).optional().or(z.literal("")),
    referral: z.string().max(60).optional().or(z.literal("")),
    startDate: z.string().max(40).optional().or(z.literal("")),
    message: z
      .string({ required_error: "Message is required" })
      .min(10, "Tell us a little more (at least 10 characters)")
      .max(4000),
    sourcePage: z.string().max(200).optional(),
  }),
});

const updateLeadSchema = z.object({
  body: z.object({
    status: z.enum(LEAD_STATUSES).optional(),
    assignedTo: z.string().nullable().optional(),
  }),
});

const addNoteSchema = z.object({
  body: z.object({
    body: z.string({ required_error: "Note is required" }).min(1).max(2000),
  }),
});

export const LeadValidation = {
  createLeadSchema,
  updateLeadSchema,
  addNoteSchema,
};
