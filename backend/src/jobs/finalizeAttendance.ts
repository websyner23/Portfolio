import { AttendanceService } from "../app/modules/attendance/attendance.service";
import {
  addDaysToISO,
  localDateOf,
} from "../app/modules/attendance/attendance.utils";
import { pushNotification } from "../app/modules/notification/notification.service";

/**
 * Closes out yesterday's shift: auto-closes any sessions left open at shift
 * end and marks active employees who never punched in as absent.
 *
 * Runs after the overnight cutoff so late-night punches have already been
 * attributed to the correct shift date.
 */
export const finalizeAttendance = async () => {
  try {
    const rules = await AttendanceService.getRules();
    const shiftDate = addDaysToISO(localDateOf(new Date(), rules.timezone), -1);

    const result = await AttendanceService.finalizeShiftDate(shiftDate);

    console.log(
      `[cron:finalizeAttendance] ${shiftDate} — ${result.absentMarked} absent, ${result.autoClosed} auto-closed`
    );

    if (result.absentMarked > 0) {
      await pushNotification({
        type: "attendance.absent",
        title: `${result.absentMarked} absent on ${shiftDate}`,
        body: "Yesterday's attendance has been finalized.",
        link: `/attendance/daily?date=${shiftDate}`,
      });
    }
  } catch (err) {
    console.error("[cron:finalizeAttendance]", (err as Error).message);
  }
};
