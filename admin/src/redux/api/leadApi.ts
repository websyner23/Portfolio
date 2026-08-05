import { TApiResponse, TQueryParams } from "../../types";
import { baseApi } from "./baseApi";

export type TLead = {
  _id: string;
  type: "contact" | "quick-quote";
  name: string;
  email: string;
  phone?: string;
  company?: string;
  service?: string;
  budget?: string;
  timeline?: string;
  referral?: string;
  startDate?: string;
  message: string;
  sourcePage?: string;
  status: "new" | "contacted" | "qualified" | "won" | "lost";
  assignedTo?: { _id: string; name: string; email: string };
  notes?: {
    _id: string;
    body: string;
    author?: { _id: string; name: string };
    createdAt: string;
  }[];
  readAt?: string;
  createdAt: string;
};

export type TLeadStats = {
  total: number;
  unread: number;
  byStatus: Record<string, number>;
};

export const leadApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLeads: builder.query<TApiResponse<TLead[]>, TQueryParams | void>({
      query: (params) => ({ url: "/leads", params: params ?? {} }),
      providesTags: ["Lead"],
    }),
    getLeadStats: builder.query<TApiResponse<TLeadStats>, void>({
      query: () => "/leads/stats",
      providesTags: ["Lead"],
    }),
    getLead: builder.query<TApiResponse<TLead>, string>({
      query: (id) => `/leads/${id}`,
      providesTags: ["Lead"],
    }),
    updateLead: builder.mutation<
      TApiResponse<TLead>,
      { id: string; body: Record<string, unknown> }
    >({
      query: ({ id, body }) => ({ url: `/leads/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Lead"],
    }),
    addLeadNote: builder.mutation<
      TApiResponse<TLead>,
      { id: string; body: string }
    >({
      query: ({ id, body }) => ({
        url: `/leads/${id}/notes`,
        method: "POST",
        body: { body },
      }),
      invalidatesTags: ["Lead"],
    }),
    deleteLead: builder.mutation<TApiResponse<null>, string>({
      query: (id) => ({ url: `/leads/${id}`, method: "DELETE" }),
      invalidatesTags: ["Lead"],
    }),
  }),
});

export const {
  useGetLeadsQuery,
  useGetLeadStatsQuery,
  useGetLeadQuery,
  useUpdateLeadMutation,
  useAddLeadNoteMutation,
  useDeleteLeadMutation,
} = leadApi;
