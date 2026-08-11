import { TApiResponse, TQueryParams } from "../../types";
import { baseApi } from "./baseApi";

export type TEmployee = {
  _id: string;
  employeeId: string;
  fullName: string;
  email: string;
  designation?: string;
  department?: string;
  phone?: string;
  joinDate: string;
  lastWorkingDate?: string;
  isActive: boolean;
  baseSalary: number;
  perfectBonus: number;
  user?: { _id: string; email: string; status: string };
};

export type TLinkableUser = {
  _id: string;
  name: string;
  email: string;
  roleName?: string;
  canPunch: boolean;
};

export type TAttendanceStatus =
  | "present"
  | "late"
  | "incomplete"
  | "absent"
  | "leave"
  | "optional-off"
  | "not-punched";

export type TDailyRow = {
  employee: {
    _id: string;
    employeeId: string;
    fullName: string;
    designation?: string;
  };
  attendanceId: string | null;
  status: TAttendanceStatus;
  firstIn: string | null;
  lastOut: string | null;
  isPunchedIn: boolean;
  workedMinutes: number;
  workedLabel: string;
  lateMinutes: number;
  note: string;
};

export type TDailySheet = {
  shiftDate: string;
  isOptionalDay: boolean;
  shiftStart: string;
  shiftEnd: string;
  rows: TDailyRow[];
};

export type TMonthlyRow = {
  employee: {
    _id: string;
    employeeId: string;
    fullName: string;
    designation?: string;
    isActive: boolean;
  };
  scheduledDays: number;
  presentDays: number;
  lateDays: number;
  incompleteDays: number;
  leaveDays: number;
  absentDays: number;
  optionalDaysWorked: number;
  totalWorkMinutes: number;
  workTimeLabel: string;
  attendancePct: number;
  bonusEligible: boolean;
  baseSalary: number;
  bonus: number;
  netPayable: number;
};

export type TMonthlySummary = {
  month: string;
  upTo: string;
  currency: string;
  rows: TMonthlyRow[];
  totals: {
    activeEmployees: number;
    scheduledDays: number;
    presentDays: number;
    lateDays: number;
    incompleteDays: number;
    leaveDays: number;
    absentDays: number;
    totalWorkMinutes: number;
    totalWorkLabel: string;
    bonusEligible: number;
    totalPayroll: number;
  };
};

export type TMyToday = {
  shiftDate: string;
  rules: { shiftStart: string; shiftEnd: string; graceMinutes: number };
  isPunchedIn: boolean;
  openSince: string | null;
  isOnBreak: boolean;
  breakSince: string | null;
  breakMinutes: number;
  breakLabel: string;
  breakCount: number;
  workedMinutes: number;
  workedLabel: string;
};

export type TLeave = {
  _id: string;
  employee: { _id: string; employeeId: string; fullName: string };
  startDate: string;
  endDate: string;
  type: string;
  reason?: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: { _id: string; name: string };
};

export type TAttendanceSettings = {
  shiftStart: string;
  shiftEnd: string;
  overnightCutoff: string;
  graceMinutes: number;
  requiredDailyMinutes: number;
  optionalWeekdays: number[];
  timezone: string;
  currency: string;
  defaultBaseSalary: number;
  defaultPerfectBonus: number;
};

export const hrmApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /* employees */
    getEmployees: builder.query<TApiResponse<TEmployee[]>, TQueryParams | void>({
      query: (params) => ({ url: "/employees", params: params ?? {} }),
      providesTags: ["Employee"],
    }),
    createEmployee: builder.mutation<
      TApiResponse<TEmployee>,
      Record<string, unknown>
    >({
      query: (body) => ({ url: "/employees", method: "POST", body }),
      invalidatesTags: ["Employee", "Attendance"],
    }),
    updateEmployee: builder.mutation<
      TApiResponse<TEmployee>,
      { id: string; body: Record<string, unknown> }
    >({
      query: ({ id, body }) => ({
        url: `/employees/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Employee", "Attendance"],
    }),
    deactivateEmployee: builder.mutation<TApiResponse<TEmployee>, string>({
      query: (id) => ({ url: `/employees/${id}`, method: "DELETE" }),
      invalidatesTags: ["Employee", "Attendance"],
    }),

    /** Login accounts not yet tied to an employee. */
    getLinkableUsers: builder.query<TApiResponse<TLinkableUser[]>, void>({
      query: () => "/employees/linkable-users",
      providesTags: ["Employee", "User"],
    }),
    linkEmployeeUser: builder.mutation<
      TApiResponse<{ temporaryPassword?: string; canPunch: boolean }>,
      { id: string; userId?: string; createLogin?: boolean }
    >({
      query: ({ id, ...body }) => ({
        url: `/employees/${id}/link-user`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Employee", "User"],
    }),
    unlinkEmployeeUser: builder.mutation<TApiResponse<TEmployee>, string>({
      query: (id) => ({ url: `/employees/${id}/link-user`, method: "DELETE" }),
      invalidatesTags: ["Employee", "User"],
    }),

    /* punch panel */
    getMyToday: builder.query<TApiResponse<TMyToday>, void>({
      query: () => "/attendance/me/today",
      providesTags: ["Attendance"],
    }),
    punchIn: builder.mutation<TApiResponse<unknown>, void>({
      query: () => ({ url: "/attendance/punch-in", method: "POST" }),
      invalidatesTags: ["Attendance"],
    }),
    punchOut: builder.mutation<TApiResponse<unknown>, void>({
      query: () => ({ url: "/attendance/punch-out", method: "POST" }),
      invalidatesTags: ["Attendance"],
    }),
    startBreak: builder.mutation<TApiResponse<unknown>, string | void>({
      query: (reason) => ({
        url: "/attendance/break/start",
        method: "POST",
        body: reason ? { reason } : {},
      }),
      invalidatesTags: ["Attendance"],
    }),
    endBreak: builder.mutation<TApiResponse<unknown>, void>({
      query: () => ({ url: "/attendance/break/end", method: "POST" }),
      invalidatesTags: ["Attendance"],
    }),

    /* reporting */
    getDailySheet: builder.query<TApiResponse<TDailySheet>, string | void>({
      query: (date) => ({
        url: "/attendance/daily",
        params: date ? { date } : {},
      }),
      providesTags: ["Attendance"],
    }),
    getMonthlySummary: builder.query<TApiResponse<TMonthlySummary>, string | void>({
      query: (month) => ({
        url: "/attendance/summary",
        params: month ? { month } : {},
      }),
      providesTags: ["Attendance"],
    }),

    /* corrections */
    createAttendanceRecord: builder.mutation<
      TApiResponse<unknown>,
      Record<string, unknown>
    >({
      query: (body) => ({ url: "/attendance/records", method: "POST", body }),
      invalidatesTags: ["Attendance"],
    }),
    updateAttendanceRecord: builder.mutation<
      TApiResponse<unknown>,
      { id: string; body: Record<string, unknown> }
    >({
      query: ({ id, body }) => ({
        url: `/attendance/records/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Attendance"],
    }),
    finalizeDay: builder.mutation<TApiResponse<unknown>, string | void>({
      query: (date) => ({
        url: "/attendance/finalize",
        method: "POST",
        body: date ? { date } : {},
      }),
      invalidatesTags: ["Attendance"],
    }),

    /* leave */
    getLeaves: builder.query<TApiResponse<TLeave[]>, TQueryParams | void>({
      query: (params) => ({ url: "/attendance/leaves", params: params ?? {} }),
      providesTags: ["Leave"],
    }),
    createLeave: builder.mutation<TApiResponse<TLeave>, Record<string, unknown>>({
      query: (body) => ({ url: "/attendance/leaves", method: "POST", body }),
      invalidatesTags: ["Leave", "Attendance"],
    }),
    reviewLeave: builder.mutation<
      TApiResponse<TLeave>,
      { id: string; status: string; reviewNote?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/attendance/leaves/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Leave", "Attendance"],
    }),
    deleteLeave: builder.mutation<TApiResponse<null>, string>({
      query: (id) => ({ url: `/attendance/leaves/${id}`, method: "DELETE" }),
      invalidatesTags: ["Leave", "Attendance"],
    }),

    /* settings */
    getAttendanceSettings: builder.query<TApiResponse<TAttendanceSettings>, void>({
      query: () => "/attendance/settings",
      providesTags: ["AttendanceSettings"],
    }),
    updateAttendanceSettings: builder.mutation<
      TApiResponse<TAttendanceSettings>,
      Record<string, unknown>
    >({
      query: (body) => ({ url: "/attendance/settings", method: "PATCH", body }),
      invalidatesTags: ["AttendanceSettings", "Attendance"],
    }),
  }),
});

export const {
  useGetEmployeesQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeactivateEmployeeMutation,
  useGetLinkableUsersQuery,
  useLinkEmployeeUserMutation,
  useUnlinkEmployeeUserMutation,
  useGetMyTodayQuery,
  usePunchInMutation,
  usePunchOutMutation,
  useStartBreakMutation,
  useEndBreakMutation,
  useGetDailySheetQuery,
  useGetMonthlySummaryQuery,
  useCreateAttendanceRecordMutation,
  useUpdateAttendanceRecordMutation,
  useFinalizeDayMutation,
  useGetLeavesQuery,
  useCreateLeaveMutation,
  useReviewLeaveMutation,
  useDeleteLeaveMutation,
  useGetAttendanceSettingsQuery,
  useUpdateAttendanceSettingsMutation,
} = hrmApi;
