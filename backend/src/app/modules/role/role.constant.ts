/**
 * Permission catalog — the single source of truth for RBAC.
 * The admin UI renders its role matrix from GET /roles/permissions.
 */
export const PERMISSION_GROUPS: Record<string, { key: string; label: string }[]> = {
  Dashboard: [{ key: "dashboard.view", label: "View dashboard" }],
  "Website CMS": [{ key: "cms.manage", label: "Manage website content" }],
  Leads: [
    { key: "leads.view", label: "View leads" },
    { key: "leads.manage", label: "Manage leads" },
  ],
  Meetings: [{ key: "meetings.manage", label: "Manage meetings" }],
  Employees: [{ key: "employees.manage", label: "Manage employees" }],
  Attendance: [
    { key: "attendance.punch", label: "Punch in/out (self)" },
    { key: "attendance.view", label: "View attendance" },
    { key: "attendance.manage", label: "Manage attendance" },
  ],
  Payroll: [{ key: "payroll.manage", label: "Manage payroll" }],
  Finance: [
    { key: "finance.view", label: "View finance" },
    { key: "finance.manage", label: "Manage finance" },
  ],
  Documents: [{ key: "documents.manage", label: "Manage documents" }],
  Projects: [
    { key: "projects.view", label: "View projects" },
    { key: "projects.manage", label: "Manage projects" },
  ],
  Administration: [
    { key: "roles.manage", label: "Manage roles & permissions" },
    { key: "users.manage", label: "Manage users" },
    { key: "audit.view", label: "View audit logs" },
  ],
};

export const ALL_PERMISSIONS: string[] = Object.values(PERMISSION_GROUPS)
  .flat()
  .map((p) => p.key);

export const SUPER_ADMIN_ROLE = "super-admin";
