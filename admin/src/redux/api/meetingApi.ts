import { TApiResponse, TQueryParams } from "../../types";
import { baseApi } from "./baseApi";

export type TMeeting = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  topic?: string;
  date: string;
  time: string;
  timezone: string;
  durationMins: number;
  status: "pending" | "confirmed" | "rescheduled" | "cancelled" | "completed";
  meetingLink?: string;
  adminNotes?: string;
  createdAt: string;
};

export type TMeetingSettings = {
  slotTimes: string[];
  timezones: string[];
  disabledWeekdays: number[];
  blackoutDates: string[];
  maxPerSlot: number;
  leadTimeHours: number;
  bookingWindowDays: number;
  durationMins: number;
};

export const meetingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMeetings: builder.query<TApiResponse<TMeeting[]>, TQueryParams | void>({
      query: (params) => ({ url: "/meetings", params: params ?? {} }),
      providesTags: ["Meeting"],
    }),
    getUpcomingMeetings: builder.query<TApiResponse<TMeeting[]>, void>({
      query: () => "/meetings/upcoming",
      providesTags: ["Meeting"],
    }),
    updateMeeting: builder.mutation<
      TApiResponse<TMeeting>,
      { id: string; body: Record<string, unknown> }
    >({
      query: ({ id, body }) => ({
        url: `/meetings/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Meeting"],
    }),
    deleteMeeting: builder.mutation<TApiResponse<null>, string>({
      query: (id) => ({ url: `/meetings/${id}`, method: "DELETE" }),
      invalidatesTags: ["Meeting"],
    }),
    getMeetingSettings: builder.query<TApiResponse<TMeetingSettings>, void>({
      query: () => "/meetings/settings",
      providesTags: ["MeetingSettings"],
    }),
    updateMeetingSettings: builder.mutation<
      TApiResponse<TMeetingSettings>,
      Record<string, unknown>
    >({
      query: (body) => ({ url: "/meetings/settings", method: "PATCH", body }),
      invalidatesTags: ["MeetingSettings"],
    }),
  }),
});

export const {
  useGetMeetingsQuery,
  useGetUpcomingMeetingsQuery,
  useUpdateMeetingMutation,
  useDeleteMeetingMutation,
  useGetMeetingSettingsQuery,
  useUpdateMeetingSettingsMutation,
} = meetingApi;
