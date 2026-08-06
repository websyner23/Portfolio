import { TApiResponse } from "../../types";
import { baseApi } from "./baseApi";

export type TDashboard = {
  today: string;
  month: string;
  leads: {
    total: number;
    unread: number;
    byStatus: Record<string, number>;
    trend: { month: string; count: number }[];
    recent: {
      _id: string;
      name: string;
      email: string;
      company?: string;
      service?: string;
      status: string;
      createdAt: string;
    }[];
  } | null;
  meetings: {
    pending: number;
    upcoming: {
      _id: string;
      name: string;
      date: string;
      time: string;
      timezone: string;
      status: string;
    }[];
  } | null;
  attendance: {
    shiftDate: string;
    isOptionalDay: boolean;
    activeEmployees: number;
    punchedInNow: number;
    counts: Record<string, number>;
  } | null;
  finance: {
    balance: number;
    monthIncome: number;
    monthExpense: number;
    monthNet: number;
    pendingIncome: number;
    pendingPayroll: number;
    trend: { month: string; income: number; expense: number }[];
  } | null;
  projects: {
    byStatus: Record<string, number>;
    active: {
      _id: string;
      name: string;
      code: string;
      deadline?: string;
      tasks: { status: string }[];
    }[];
  } | null;
  activity:
    | {
        _id: string;
        action: string;
        module: string;
        description: string;
        createdAt: string;
        user?: { name: string };
      }[]
    | null;
};

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboard: builder.query<TApiResponse<TDashboard>, void>({
      query: () => "/dashboard",
      providesTags: ["Dashboard"],
    }),
  }),
});

export const { useGetDashboardQuery } = dashboardApi;
