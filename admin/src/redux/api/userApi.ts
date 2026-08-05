import { TApiResponse, TQueryParams, TUser } from "../../types";
import { baseApi } from "./baseApi";

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<TApiResponse<TUser[]>, TQueryParams | void>({
      query: (params) => ({ url: "/users", params: params ?? {} }),
      providesTags: ["User"],
    }),
    createUser: builder.mutation<
      TApiResponse<{ user: TUser; temporaryPassword?: string }>,
      Record<string, unknown>
    >({
      query: (body) => ({ url: "/users", method: "POST", body }),
      invalidatesTags: ["User"],
    }),
    updateUser: builder.mutation<
      TApiResponse<TUser>,
      { id: string; body: Record<string, unknown> }
    >({
      query: ({ id, body }) => ({ url: `/users/${id}`, method: "PATCH", body }),
      invalidatesTags: ["User"],
    }),
    resetUserPassword: builder.mutation<
      TApiResponse<null>,
      { id: string; newPassword: string }
    >({
      query: ({ id, newPassword }) => ({
        url: `/users/${id}/reset-password`,
        method: "POST",
        body: { newPassword },
      }),
    }),
    deleteUser: builder.mutation<TApiResponse<null>, string>({
      query: (id) => ({ url: `/users/${id}`, method: "DELETE" }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useResetUserPasswordMutation,
  useDeleteUserMutation,
} = userApi;
