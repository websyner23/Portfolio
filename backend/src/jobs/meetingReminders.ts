import { Meeting } from "../app/modules/meeting/meeting.model";
import { SiteSettings } from "../app/modules/cms/cms.model";
import { pushNotification } from "../app/modules/notification/notification.service";
import { emailLayout, sendEmail } from "../app/utils/sendEmail";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Emails attendees roughly an hour before a confirmed meeting.
 * `remindedAt` guarantees a reminder is only ever sent once.
 */
export const meetingReminders = async () => {
  try {
    const now = new Date();
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    const due = await Meeting.find({
      date: today,
      status: { $in: ["confirmed", "rescheduled"] },
      remindedAt: { $exists: false },
    });

    if (due.length === 0) return;

    const site = await SiteSettings.findOne({ key: "default" });

    for (const meeting of due) {
      const [hours, minutes] = meeting.time.split(":").map(Number);
      const startsAt = new Date(now);
      startsAt.setHours(hours, minutes, 0, 0);

      const minutesUntil = (startsAt.getTime() - now.getTime()) / 60000;
      if (minutesUntil < 0 || minutesUntil > 75) continue;

      await sendEmail({
        to: meeting.email,
        subject: `Reminder: our meeting at ${meeting.time}`,
        html: emailLayout(
          "Your meeting is coming up",
          `<p>Hi ${meeting.name.split(" ")[0]}, this is a reminder about our meeting today at
           <strong>${meeting.time}</strong> (${meeting.timezone}).</p>
           ${
             meeting.meetingLink
               ? `<p><a href="${meeting.meetingLink}" style="display:inline-block;background:#0fcda1;color:#1e2d40;font-weight:700;padding:10px 18px;border-radius:999px;text-decoration:none">Join the meeting</a></p>`
               : ""
           }
           <p style="color:#8695a3;font-size:12px">— ${site?.brandName ?? "WebSyner"}</p>`
        ),
      });

      await pushNotification({
        type: "meeting.upcoming",
        title: `Meeting with ${meeting.name} at ${meeting.time}`,
        body: meeting.topic || "Starting within the hour",
        link: `/meetings?highlight=${meeting._id}`,
        entity: { kind: "meeting", id: String(meeting._id) },
      });

      meeting.remindedAt = new Date();
      await meeting.save({ validateBeforeSave: false });
    }
  } catch (err) {
    console.error("[cron:meetingReminders]", (err as Error).message);
  }
};
