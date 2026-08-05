import cron from "node-cron";
import config from "../config";
import { finalizeAttendance } from "./finalizeAttendance";
import { meetingReminders } from "./meetingReminders";

/**
 * All schedules run in the company timezone so they fire at the intended local
 * time regardless of where the server is hosted.
 */
export const startJobs = () => {
  const options = { timezone: config.companyTz };

  // Close out yesterday's shift — after the 06:00 overnight cutoff so
  // late-night punches are already attributed to the right shift date.
  cron.schedule("10 6 * * *", () => void finalizeAttendance(), options);

  // Remind attendees about meetings starting within the next hour.
  cron.schedule("*/15 * * * *", () => void meetingReminders(), options);

  console.log(`✔ Scheduled jobs started (timezone: ${config.companyTz})`);
};
