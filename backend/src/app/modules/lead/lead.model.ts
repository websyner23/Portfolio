import { model, Schema } from "mongoose";

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "won",
  "lost",
] as const;

/**
 * Enquiries from the public website. Fields mirror the contact form's zod
 * schema (frontend/src/components/sections/contact-form.tsx); the shorter hero
 * form submits the same shape with fewer fields.
 */
const leadSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["contact", "quick-quote"],
      default: "contact",
      index: true,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    company: { type: String, trim: true },
    service: { type: String, trim: true },
    budget: { type: String, trim: true },
    timeline: { type: String, trim: true },
    referral: { type: String, trim: true },
    startDate: { type: String, trim: true },
    message: { type: String, required: true },
    sourcePage: { type: String, default: "/" },
    status: { type: String, enum: LEAD_STATUSES, default: "new", index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    notes: [
      {
        body: { type: String, required: true },
        author: { type: Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    readAt: { type: Date },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

leadSchema.index({ createdAt: -1 });

export const Lead = model("Lead", leadSchema);
