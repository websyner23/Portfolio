import { NextFunction, Request, Response } from "express";
import { broadcastChange } from "../../socket";

/**
 * Tells connected admins that data changed, so open tables refresh themselves
 * instead of showing stale rows until someone reloads.
 *
 * Doing this centrally rather than in each handler means a new endpoint is
 * live by default — there's no per-route call to forget.
 */

/** URL segment → the RTK Query cache tags the admin should invalidate. */
const RESOURCE_MAP: { match: RegExp; tags: string[] }[] = [
  { match: /^\/cms\/site-settings/, tags: ["SiteSettings"] },
  { match: /^\/cms\/theme/, tags: ["Theme"] },
  { match: /^\/cms\/sections/, tags: ["Section"] },
  { match: /^\/cms\/services/, tags: ["Service"] },
  { match: /^\/cms\/portfolio-categories/, tags: ["PortfolioCategory"] },
  { match: /^\/cms\/portfolio/, tags: ["Portfolio"] },
  { match: /^\/cms\/testimonials/, tags: ["Testimonial"] },
  { match: /^\/cms\/team/, tags: ["Team"] },
  { match: /^\/cms\/pricing/, tags: ["Pricing"] },
  { match: /^\/cms\/compare-rows/, tags: ["Pricing"] },
  { match: /^\/cms\/faqs/, tags: ["Faq"] },
  { match: /^\/cms\/process-steps/, tags: ["Process"] },
  { match: /^\/cms\/stats/, tags: ["Stat"] },
  { match: /^\/leads/, tags: ["Lead", "Dashboard"] },
  { match: /^\/meetings\/settings/, tags: ["MeetingSettings"] },
  { match: /^\/meetings/, tags: ["Meeting", "Dashboard"] },
  { match: /^\/employees/, tags: ["Employee", "User", "Attendance"] },
  { match: /^\/attendance\/settings/, tags: ["AttendanceSettings"] },
  { match: /^\/attendance\/leaves/, tags: ["Leave", "Attendance"] },
  { match: /^\/attendance/, tags: ["Attendance", "Dashboard"] },
  { match: /^\/finance\/payroll/, tags: ["Payroll", "Finance", "Dashboard"] },
  { match: /^\/finance\/accounts/, tags: ["Account", "Finance"] },
  { match: /^\/finance\/transactions/, tags: ["Transaction", "Account", "Finance", "Dashboard"] },
  { match: /^\/finance\/receivables/, tags: ["Receivable", "Finance", "Dashboard"] },
  { match: /^\/finance/, tags: ["Finance"] },
  { match: /^\/documents\/templates/, tags: ["DocTemplate"] },
  { match: /^\/documents/, tags: ["DocGenerated"] },
  { match: /^\/projects/, tags: ["Project", "Dashboard"] },
  { match: /^\/users/, tags: ["User"] },
  { match: /^\/roles/, tags: ["Role"] },
  // Public form posts create leads and bookings the admin should see at once.
  { match: /^\/public\/leads/, tags: ["Lead", "Dashboard"] },
  { match: /^\/public\/meetings/, tags: ["Meeting", "Dashboard"] },
];

const actionFor = (method: string): "create" | "update" | "delete" => {
  if (method === "POST") return "create";
  if (method === "DELETE") return "delete";
  return "update";
};

export const realtimeBroadcast = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.method === "GET" || req.method === "OPTIONS") return next();

  res.on("finish", () => {
    // Only successful writes are worth broadcasting.
    if (res.statusCode >= 400) return;

    const path = req.originalUrl.replace(/^\/api\/v1/, "").split("?")[0];
    const entry = RESOURCE_MAP.find((r) => r.match.test(path));
    if (!entry) return;

    for (const tag of entry.tags) {
      broadcastChange(tag, actionFor(req.method));
    }
  });

  next();
};

export default realtimeBroadcast;
