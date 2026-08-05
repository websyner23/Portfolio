import { Router } from "express";
import { AuditLogRoutes } from "../modules/auditLog/auditLog.route";
import { AuthRoutes } from "../modules/auth/auth.route";
import { AttendanceRoutes } from "../modules/attendance/attendance.route";
import { CmsRoutes } from "../modules/cms/cms.route";
import { EmployeeRoutes } from "../modules/employee/employee.route";
import { LeadRoutes } from "../modules/lead/lead.route";
import { MediaRoutes } from "../modules/media/media.route";
import { MeetingRoutes } from "../modules/meeting/meeting.route";
import { NotificationRoutes } from "../modules/notification/notification.route";
import { PublicRoutes } from "../modules/public/public.route";
import { RoleRoutes } from "../modules/role/role.route";
import { UserRoutes } from "../modules/user/user.route";

const router = Router();

type TModuleRoute = {
  path: string;
  route: Router;
};

const moduleRoutes: TModuleRoute[] = [
  { path: "/auth", route: AuthRoutes },
  { path: "/users", route: UserRoutes },
  { path: "/roles", route: RoleRoutes },
  { path: "/audit-logs", route: AuditLogRoutes },
  { path: "/cms", route: CmsRoutes },
  { path: "/media", route: MediaRoutes },
  { path: "/leads", route: LeadRoutes },
  { path: "/meetings", route: MeetingRoutes },
  { path: "/notifications", route: NotificationRoutes },
  { path: "/employees", route: EmployeeRoutes },
  { path: "/attendance", route: AttendanceRoutes },
  { path: "/public", route: PublicRoutes },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
