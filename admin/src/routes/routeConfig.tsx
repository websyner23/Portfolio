import { lazy, ReactNode } from "react";
import {
  FiActivity,
  FiCalendar,
  FiClock,
  FiInbox,
  FiGlobe,
  FiGrid,
  FiShield,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import { PERMISSIONS } from "../constants/permissions";

const DashboardPage = lazy(() => import("../pages/dashboard/DashboardPage"));
const RolesPage = lazy(() => import("../pages/roles/RolesPage"));
const UsersPage = lazy(() => import("../pages/users/UsersPage"));
const AuditLogsPage = lazy(() => import("../pages/auditLogs/AuditLogsPage"));
const ProfilePage = lazy(() => import("../pages/profile/ProfilePage"));
const LeadsPage = lazy(() => import("../pages/leads/LeadsPage"));
const MeetingsPage = lazy(() => import("../pages/meetings/MeetingsPage"));
const EmployeesPage = lazy(() => import("../pages/hrm/EmployeesPage"));
const PunchPanelPage = lazy(() => import("../pages/hrm/PunchPanelPage"));
const AttendanceDailyPage = lazy(() => import("../pages/hrm/AttendanceDailyPage"));
const AttendanceMonthlyPage = lazy(() => import("../pages/hrm/AttendanceMonthlyPage"));
const LeavesPage = lazy(() => import("../pages/hrm/LeavesPage"));
const AttendanceSettingsPage = lazy(() => import("../pages/hrm/AttendanceSettingsPage"));

const SiteSettingsPage = lazy(() => import("../pages/cms/SiteSettingsPage"));
const ThemePage = lazy(() => import("../pages/cms/ThemePage"));
const SectionsPage = lazy(() => import("../pages/cms/SectionsPage"));
const lazyCms = (name: string) =>
  lazy(() =>
    import("../pages/cms/ContentPages").then((m) => ({
      default: m[name as keyof typeof m] as React.ComponentType,
    }))
  );

const ServicesPage = lazyCms("ServicesPage");
const PortfolioPage = lazyCms("PortfolioPage");
const PortfolioCategoriesPage = lazyCms("PortfolioCategoriesPage");
const TestimonialsPage = lazyCms("TestimonialsPage");
const TeamPage = lazyCms("TeamPage");
const PricingPlansPage = lazyCms("PricingPlansPage");
const PricingExtrasPage = lazyCms("PricingExtrasPage");
const CompareRowsPage = lazyCms("CompareRowsPage");
const FaqsPage = lazyCms("FaqsPage");
const ProcessPage = lazyCms("ProcessPage");
const StatsPage = lazyCms("StatsPage");

export type TRouteItem = {
  path: string;
  label?: string;
  icon?: ReactNode;
  permission?: string | string[];
  element?: ReactNode;
  children?: TRouteItem[];
  hideInMenu?: boolean;
};

/**
 * Single source of truth: drives BOTH the react-router routes and the sidebar
 * menu (filtered by the logged-in user's permissions). New pages are added
 * here as modules are built.
 */
export const routeConfig: TRouteItem[] = [
  {
    path: "/",
    label: "Dashboard",
    icon: <FiGrid />,
    permission: PERMISSIONS.DASHBOARD_VIEW,
    element: <DashboardPage />,
  },
  {
    path: "/cms",
    label: "Website",
    icon: <FiGlobe />,
    permission: PERMISSIONS.CMS_MANAGE,
    children: [
      { path: "/cms/site", label: "Site settings", element: <SiteSettingsPage /> },
      { path: "/cms/theme", label: "Theme & colours", element: <ThemePage /> },
      { path: "/cms/sections", label: "Page content", element: <SectionsPage /> },
      { path: "/cms/services", label: "Services", element: <ServicesPage /> },
      { path: "/cms/portfolio", label: "Portfolio", element: <PortfolioPage /> },
      {
        path: "/cms/portfolio-categories",
        label: "Portfolio categories",
        element: <PortfolioCategoriesPage />,
      },
      {
        path: "/cms/testimonials",
        label: "Testimonials",
        element: <TestimonialsPage />,
      },
      { path: "/cms/team", label: "Team", element: <TeamPage /> },
      { path: "/cms/pricing", label: "Pricing plans", element: <PricingPlansPage /> },
      { path: "/cms/pricing-extras", label: "Pricing extras", element: <PricingExtrasPage /> },
      { path: "/cms/compare", label: "Plan comparison", element: <CompareRowsPage /> },
      { path: "/cms/faqs", label: "FAQs", element: <FaqsPage /> },
      { path: "/cms/process", label: "Process", element: <ProcessPage /> },
      { path: "/cms/stats", label: "Stats & values", element: <StatsPage /> },
    ],
  },
  {
    path: "/leads",
    label: "Leads",
    icon: <FiInbox />,
    permission: [PERMISSIONS.LEADS_VIEW, PERMISSIONS.LEADS_MANAGE],
    element: <LeadsPage />,
  },
  {
    path: "/meetings",
    label: "Meetings",
    icon: <FiCalendar />,
    permission: PERMISSIONS.MEETINGS_MANAGE,
    element: <MeetingsPage />,
  },
  {
    path: "/hrm",
    label: "Attendance",
    icon: <FiClock />,
    permission: [
      PERMISSIONS.EMPLOYEES_MANAGE,
      PERMISSIONS.ATTENDANCE_VIEW,
      PERMISSIONS.ATTENDANCE_MANAGE,
      PERMISSIONS.ATTENDANCE_PUNCH,
    ],
    children: [
      {
        path: "/hrm/punch",
        label: "Punch panel",
        element: <PunchPanelPage />,
        permission: PERMISSIONS.ATTENDANCE_PUNCH,
      },
      {
        path: "/hrm/daily",
        label: "Daily attendance",
        element: <AttendanceDailyPage />,
        permission: [PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.ATTENDANCE_MANAGE],
      },
      {
        path: "/hrm/monthly",
        label: "Monthly report",
        element: <AttendanceMonthlyPage />,
        permission: [PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.ATTENDANCE_MANAGE],
      },
      {
        path: "/hrm/employees",
        label: "Employees",
        element: <EmployeesPage />,
        permission: PERMISSIONS.EMPLOYEES_MANAGE,
      },
      {
        path: "/hrm/leaves",
        label: "Leave",
        element: <LeavesPage />,
        permission: [PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.ATTENDANCE_MANAGE],
      },
      {
        path: "/hrm/settings",
        label: "Attendance settings",
        element: <AttendanceSettingsPage />,
        permission: PERMISSIONS.ATTENDANCE_MANAGE,
      },
    ],
  },
  {
    path: "/users",
    label: "Users",
    icon: <FiUsers />,
    permission: PERMISSIONS.USERS_MANAGE,
    element: <UsersPage />,
  },
  {
    path: "/roles",
    label: "Roles & Permissions",
    icon: <FiShield />,
    permission: PERMISSIONS.ROLES_MANAGE,
    element: <RolesPage />,
  },
  {
    path: "/audit-logs",
    label: "Audit Log",
    icon: <FiActivity />,
    permission: PERMISSIONS.AUDIT_VIEW,
    element: <AuditLogsPage />,
  },
  {
    path: "/profile",
    label: "Profile",
    icon: <FiUser />,
    element: <ProfilePage />,
    hideInMenu: true,
  },
];

/** Flatten nested route items into router-consumable entries. */
export const flattenRoutes = (
  items: TRouteItem[],
  parentPath = ""
): { path: string; element: ReactNode; permission?: string | string[] }[] => {
  const out: {
    path: string;
    element: ReactNode;
    permission?: string | string[];
  }[] = [];

  for (const item of items) {
    const fullPath = item.path.startsWith("/")
      ? item.path
      : `${parentPath}/${item.path}`;
    if (item.element) {
      out.push({
        path: fullPath,
        element: item.element,
        permission: item.permission,
      });
    }
    if (item.children) {
      out.push(...flattenRoutes(item.children, fullPath));
    }
  }
  return out;
};
