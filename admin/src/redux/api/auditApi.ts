import { TApiResponse, TAuditLog, TQueryParams } from "../../types";
import { baseApi } from "./baseApi";

export const auditApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAuditLogs: builder.query<TApiResponse<TAuditLog[]>, TQueryParams | void>({
      query: (params) => ({ url: "/audit-logs", params: params ?? {} }),
      providesTags: ["Audit"],
    }),
  }),
});

export const { useGetAuditLogsQuery } = auditApi;
