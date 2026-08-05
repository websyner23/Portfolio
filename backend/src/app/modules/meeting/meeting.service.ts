import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import config from "../../../config";
import { emailLayout, sendEmail } from "../../utils/sendEmail";
import { SiteSettings } from "../cms/cms.model";
import { pushNotification } from "../notification/notification.service";
import { Meeting, MeetingSettings } from "./meeting.model";

const SINGLETON = { key: "default" };

const getSettings = async () => {
  const existing = await MeetingSettings.findOne(SINGLETON);
  return existing ?? (await MeetingSettings.create(SINGLETON));
};

const updateSettings = async (payload: Record<string, unknown>) =>
  MeetingSettings.findOneAndUpdate(
    SINGLETON,
    { $set: payload },
    { new: true, upsert: true, runValidators: true }
  );

const pad = (n: number) => String(n).padStart(2, "0");
const toISODate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/**
 * Availability for a whole month, so the website's calendar can grey out days
 * and disable individual slots in one request.
 */
const getAvailability = async (month?: string) => {
  const settings = await getSettings();

  const now = new Date();
  const [yearStr, monthStr] = (month ?? "").split("-");
  const year = Number(yearStr) || now.getFullYear();
  const monthIndex = (Number(monthStr) || now.getMonth() + 1) - 1;

  const firstOfMonth = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const from = toISODate(firstOfMonth);
  const to = toISODate(new Date(year, monthIndex, daysInMonth));

  // Cancelled bookings free their slot again.
  const booked = await Meeting.find({
    date: { $gte: from, $lte: to },
    status: { $nin: ["cancelled"] },
  }).select("date time");

  const takenCount = new Map<string, number>();
  booked.forEach((m) => {
    const key = `${m.date}|${m.time}`;
    takenCount.set(key, (takenCount.get(key) ?? 0) + 1);
  });

  const earliest = new Date(
    now.getTime() + settings.leadTimeHours * 60 * 60 * 1000
  );
  const latest = new Date(
    now.getTime() + settings.bookingWindowDays * 24 * 60 * 60 * 1000
  );

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(year, monthIndex, i + 1);
    const iso = toISODate(date);

    const isBlackout = settings.blackoutDates.includes(iso);
    const isClosedWeekday = settings.disabledWeekdays.includes(date.getDay());
    const outOfWindow = date > latest;

    const slots = settings.slotTimes.map((time) => {
      const [h, m] = time.split(":").map(Number);
      const slotAt = new Date(year, monthIndex, i + 1, h, m);
      const taken = (takenCount.get(`${iso}|${time}`) ?? 0) >= settings.maxPerSlot;

      return {
        time,
        available:
          !isBlackout &&
          !isClosedWeekday &&
          !outOfWindow &&
          !taken &&
          slotAt >= earliest,
      };
    });

    return {
      date: iso,
      weekday: date.getDay(),
      available: slots.some((s) => s.available),
      slots,
    };
  });

  return {
    month: `${year}-${pad(monthIndex + 1)}`,
    timezones: settings.timezones,
    slotTimes: settings.slotTimes,
    durationMins: settings.durationMins,
    days,
  };
};

type TBooking = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  topic?: string;
  date: string;
  time: string;
  timezone: string;
};

const bookMeeting = async (payload: TBooking) => {
  const settings = await getSettings();

  if (!settings.slotTimes.includes(payload.time)) {
    throw new AppError(httpStatus.BAD_REQUEST, "That time slot isn't offered");
  }
  if (settings.blackoutDates.includes(payload.date)) {
    throw new AppError(httpStatus.BAD_REQUEST, "That date isn't available");
  }

  // Re-check availability at write time so two visitors can't take one slot.
  const taken = await Meeting.countDocuments({
    date: payload.date,
    time: payload.time,
    status: { $nin: ["cancelled"] },
  });
  if (taken >= settings.maxPerSlot) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Sorry — that slot was just booked. Please pick another time."
    );
  }

  const meeting = await Meeting.create({
    ...payload,
    durationMins: settings.durationMins,
    status: "pending",
  });

  await pushNotification({
    type: "meeting.new",
    title: `Meeting request from ${meeting.name}`,
    body: `${meeting.date} at ${meeting.time} (${meeting.timezone})`,
    link: `/meetings?highlight=${meeting._id}`,
    entity: { kind: "meeting", id: String(meeting._id) },
  });

  const site = await SiteSettings.findOne({ key: "default" });

  void sendEmail({
    to: meeting.email,
    subject: `Meeting request received — ${site?.brandName ?? "WebSyner"}`,
    html: emailLayout(
      "We've got your booking request",
      `<p>Hi ${meeting.name.split(" ")[0]}, thanks for booking time with us.</p>
       <p><strong>${meeting.date} at ${meeting.time}</strong> (${meeting.timezone})<br/>
       Duration: ${meeting.durationMins} minutes</p>
       <p>We'll confirm shortly and send you a meeting link.</p>`
    ),
  });

  const inbox = site?.email || config.smtp.user;
  if (inbox) {
    void sendEmail({
      to: inbox,
      subject: `New meeting request: ${meeting.name} — ${meeting.date} ${meeting.time}`,
      html: emailLayout(
        "New meeting request",
        `<p><strong>${meeting.name}</strong> &lt;${meeting.email}&gt;</p>
         <p>${meeting.date} at ${meeting.time} (${meeting.timezone})</p>
         ${meeting.topic ? `<p><strong>Topic:</strong> ${meeting.topic}</p>` : ""}
         <p style="margin-top:20px"><a href="${config.adminUrl}/meetings" style="display:inline-block;background:#0fcda1;color:#1e2d40;font-weight:700;padding:10px 18px;border-radius:999px;text-decoration:none">Confirm in admin</a></p>`
      ),
    });
  }

  return meeting;
};

const getAllMeetings = async (query: Record<string, unknown>) => {
  const q = { ...query };

  // Date-range filtering for the calendar view.
  const from = q.from as string | undefined;
  const to = q.to as string | undefined;
  delete q.from;
  delete q.to;

  let base = Meeting.find();
  if (from || to) {
    const range: Record<string, string> = {};
    if (from) range.$gte = from;
    if (to) range.$lte = to;
    base = base.find({ date: range });
  }

  if (!q.sort) q.sort = "-date -time";

  const qb = new QueryBuilder(base, q)
    .search(["name", "email", "company", "topic"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const data = await qb.modelQuery;
  const meta = await qb.countTotal();
  return { data, meta };
};

/** Status changes email the visitor so they always know where things stand. */
const updateMeeting = async (id: string, payload: Record<string, unknown>) => {
  const before = await Meeting.findById(id);
  if (!before) throw new AppError(httpStatus.NOT_FOUND, "Meeting not found");

  const meeting = await Meeting.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!meeting) throw new AppError(httpStatus.NOT_FOUND, "Meeting not found");

  const statusChanged = payload.status && payload.status !== before.status;
  const site = await SiteSettings.findOne({ key: "default" });

  if (statusChanged) {
    const messages: Record<string, { subject: string; heading: string; body: string }> = {
      confirmed: {
        subject: "Your meeting is confirmed",
        heading: "You're booked in",
        body: `<p>Your meeting is confirmed for <strong>${meeting.date} at ${meeting.time}</strong> (${meeting.timezone}).</p>${
          meeting.meetingLink
            ? `<p><a href="${meeting.meetingLink}" style="display:inline-block;background:#0fcda1;color:#1e2d40;font-weight:700;padding:10px 18px;border-radius:999px;text-decoration:none">Join the meeting</a></p>`
            : ""
        }`,
      },
      rescheduled: {
        subject: "Your meeting has been rescheduled",
        heading: "New time for our meeting",
        body: `<p>We've moved your meeting to <strong>${meeting.date} at ${meeting.time}</strong> (${meeting.timezone}).</p>`,
      },
      cancelled: {
        subject: "Your meeting has been cancelled",
        heading: "Meeting cancelled",
        body: `<p>Your meeting on ${meeting.date} at ${meeting.time} has been cancelled.${
          meeting.adminNotes ? ` ${meeting.adminNotes}` : ""
        }</p><p>Feel free to book another time that suits you.</p>`,
      },
    };

    const template = messages[String(payload.status)];
    if (template) {
      void sendEmail({
        to: meeting.email,
        subject: `${template.subject} — ${site?.brandName ?? "WebSyner"}`,
        html: emailLayout(template.heading, template.body),
      });
    }
  }

  return meeting;
};

const deleteMeeting = async (id: string) => {
  const meeting = await Meeting.findByIdAndDelete(id);
  if (!meeting) throw new AppError(httpStatus.NOT_FOUND, "Meeting not found");
  return meeting;
};

const getUpcoming = async (limit = 5) => {
  const today = toISODate(new Date());
  return Meeting.find({
    date: { $gte: today },
    status: { $in: ["pending", "confirmed", "rescheduled"] },
  })
    .sort("date time")
    .limit(limit);
};

export const MeetingService = {
  getSettings,
  updateSettings,
  getAvailability,
  bookMeeting,
  getAllMeetings,
  updateMeeting,
  deleteMeeting,
  getUpcoming,
};
