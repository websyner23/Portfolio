import { TApiResponse } from "../../types";
import { baseApi } from "./baseApi";

export type TNotification = {
  _id: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  entity?: { kind: string; id: string };
  isRead: boolean;
  createdAt: string;
};

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<
      TApiResponse<{ items: TNotification[]; unreadCount: number }>,
      void
    >({
      query: () => "/notifications",
      providesTags: ["Notification"],
    }),
    markNotificationRead: builder.mutation<TApiResponse<null>, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: "PATCH" }),
      invalidatesTags: ["Notification"],
    }),
    markAllNotificationsRead: builder.mutation<TApiResponse<null>, void>({
      query: () => ({ url: "/notifications/read-all", method: "PATCH" }),
      invalidatesTags: ["Notification"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationApi;
