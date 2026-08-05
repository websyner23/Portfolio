import { TApiResponse, TPermissionCatalog, TQueryParams, TRole } from "../../types";
import { baseApi } from "./baseApi";

export const roleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRoles: builder.query<TApiResponse<TRole[]>, TQueryParams | void>({
      query: (params) => ({ url: "/roles", params: params ?? {} }),
      providesTags: ["Role"],
    }),
    getPermissionCatalog: builder.query<TApiResponse<TPermissionCatalog>, void>({
      query: () => "/roles/permissions",
    }),
    createRole: builder.mutation<TApiResponse<TRole>, Partial<TRole>>({
      query: (body) => ({ url: "/roles", method: "POST", body }),
      invalidatesTags: ["Role"],
    }),
    updateRole: builder.mutation<
      TApiResponse<TRole>,
      { id: string; body: Partial<TRole> }
    >({
      query: ({ id, body }) => ({ url: `/roles/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Role", "Me"],
    }),
    deleteRole: builder.mutation<TApiResponse<null>, string>({
      query: (id) => ({ url: `/roles/${id}`, method: "DELETE" }),
      invalidatesTags: ["Role"],
    }),
  }),
});

export const {
  useGetRolesQuery,
  useGetPermissionCatalogQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} = roleApi;
