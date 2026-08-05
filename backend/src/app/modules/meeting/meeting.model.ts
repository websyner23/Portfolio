import { model, Schema } from "mongoose";

export const MEETING_STATUSES = [
  "pending",
  "confirmed",
  "rescheduled",
  "cancelled",
  "completed",
] as const;

/** A slot booked from the website's scheduler. */
const meetingSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    company: { type: String, trim: true },
    topic: { type: String, trim: true },
    // Stored as plain strings in the visitor's chosen timezone so a slot can
    // never drift when the server's clock or locale changes.
    date: { type: String, required: true, index: true }, // YYYY-MM-DD
    time: { type: String, required: true }, // e.g. "14:00"
    timezone: { type: String, required: true },
    durationMins: { type: Number, default: 30 },
    status: {
      type: String,
      enum: MEETING_STATUSES,
      default: "pending",
      index: true,
    },
    meetingLink: { type: String, default: "" },
    adminNotes: { type: String, default: "" },
    lead: { type: Schema.Types.ObjectId, ref: "Lead" },
    remindedAt: { type: Date },
  },
  { timestamps: true }
);

meetingSchema.index({ date: 1, time: 1 });

export const Meeting = model("Meeting", meetingSchema);

/** Availability configuration shown to visitors on the booking calendar. */
const meetingSettingsSchema = new Schema(
  {
    key: { type: String, default: "default", unique: true, immutable: true },
    slotTimes: {
      type: [String],
      default: ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"],
    },
    timezones: {
      type: [String],
      default: [
        "Asia/Dhaka",
        "Europe/London",
        "America/New_York",
        "America/Los_Angeles",
        "Asia/Dubai",
        "Australia/Sydney",
      ],
    },
    // 0 = Sunday … 6 = Saturday
    disabledWeekdays: { type: [Number], default: [0, 6] },
    blackoutDates: { type: [String], default: [] }, // YYYY-MM-DD
    maxPerSlot: { type: Number, default: 1 },
    leadTimeHours: { type: Number, default: 12 },
    bookingWindowDays: { type: Number, default: 60 },
    durationMins: { type: Number, default: 30 },
  },
  { timestamps: true }
);

export const MeetingSettings = model("MeetingSettings", meetingSettingsSchema);
