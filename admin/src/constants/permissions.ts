/** Mirror of the backend permission catalog (backend/src/app/modules/role/role.constant.ts). */
export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard.view",
  CMS_MANAGE: "cms.manage",
  LEADS_VIEW: "leads.view",
  LEADS_MANAGE: "leads.manage",
  MEETINGS_MANAGE: "meetings.manage",
  EMPLOYEES_MANAGE: "employees.manage",
  ATTENDANCE_PUNCH: "attendance.punch",
  ATTENDANCE_VIEW: "attendance.view",
  ATTENDANCE_MANAGE: "attendance.manage",
  PAYROLL_MANAGE: "payroll.manage",
  FINANCE_VIEW: "finance.view",
  FINANCE_MANAGE: "finance.manage",
  DOCUMENTS_MANAGE: "documents.manage",
  PROJECTS_VIEW: "projects.view",
  PROJECTS_MANAGE: "projects.manage",
  ROLES_MANAGE: "roles.manage",
  AUDIT_VIEW: "audit.view",
  USERS_MANAGE: "users.manage",
} as const;

export type TPermission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
