import {
  BaseQueryFn,
  createApi,
  FetchArgs,
  fetchBaseQuery,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { API_URL } from "../../config";
import { logout, setToken } from "../features/auth/authSlice";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as { auth: { token: string | null } }).auth.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const refreshResult = await rawBaseQuery(
      { url: "/auth/refresh-token", method: "POST" },
      api,
      extraOptions
    );

    const newToken = (
      refreshResult.data as { data?: { accessToken?: string } } | undefined
    )?.data?.accessToken;

    if (newToken) {
      api.dispatch(setToken(newToken));
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logout());
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Me",
    "User",
    "Role",
    "Audit",
    "SiteSettings",
    "Theme",
    "Section",
    "Service",
    "Portfolio",
    "PortfolioCategory",
    "Testimonial",
    "Team",
    "Pricing",
    "Faq",
    "Process",
    "Stat",
    "Lead",
    "Meeting",
    "MeetingSettings",
    "Notification",
    "Employee",
    "Attendance",
    "AttendanceSettings",
    "Leave",
    "Payroll",
    "DocTemplate",
    "DocGenerated",
    "Account",
    "Transaction",
    "Receivable",
    "Finance",
    "Project",
    "Message",
    "Dashboard",
  ],
  endpoints: () => ({}),
});
