import { baseApi } from "./baseApi";
import { TAuthUser } from "../features/auth/authSlice";

type TLoginResponse = {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    needsPasswordChange: boolean;
    user: TAuthUser;
  };
};

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<TLoginResponse, { email: string; password: string }>(
      {
        query: (body) => ({ url: "/auth/login", method: "POST", body }),
      }
    ),
    logoutApi: builder.mutation<void, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
    }),
    getMe: builder.query<{ data: TAuthUser }, void>({
      query: () => "/auth/me",
      providesTags: ["Me"],
    }),
    changePassword: builder.mutation<
      { message: string },
      { oldPassword: string; newPassword: string }
    >({
      query: (body) => ({ url: "/auth/change-password", method: "POST", body }),
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutApiMutation,
  useGetMeQuery,
  useChangePasswordMutation,
} = authApi;
