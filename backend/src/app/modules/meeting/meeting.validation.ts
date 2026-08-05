import { z } from "zod";
import { MEETING_STATUSES } from "./meeting.model";

const bookMeetingSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Name is required" }).min(2).max(80),
    email: z
      .string({ required_error: "Email is required" })
      .email("Enter a valid email"),
    phone: z.string().max(40).optional().or(z.literal("")),
    company: z.string().max(120).optional().or(z.literal("")),
    topic: z.string().max(500).optional().or(z.literal("")),
    date: z
      .string({ required_error: "Pick a date" })
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    time: z
      .string({ required_error: "Pick a time" })
      .regex(/^\d{2}:\d{2}$/, "Time must be HH:MM"),
    timezone: z.string({ required_error: "Timezone is required" }).min(2),
  }),
});

const updateMeetingSchema = z.object({
  body: z.object({
    status: z.enum(MEETING_STATUSES).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    meetingLink: z.string().max(500).optional().or(z.literal("")),
    adminNotes: z.string().max(2000).optional().or(z.literal("")),
  }),
});

const updateSettingsSchema = z.object({
  body: z.object({
    slotTimes: z.array(z.string().regex(/^\d{2}:\d{2}$/)).optional(),
    timezones: z.array(z.string()).optional(),
    disabledWeekdays: z.array(z.number().min(0).max(6)).optional(),
    blackoutDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    maxPerSlot: z.number().min(1).max(20).optional(),
    leadTimeHours: z.number().min(0).max(720).optional(),
    bookingWindowDays: z.number().min(1).max(365).optional(),
    durationMins: z.number().min(5).max(480).optional(),
  }),
});

export const MeetingValidation = {
  bookMeetingSchema,
  updateMeetingSchema,
  updateSettingsSchema,
};
