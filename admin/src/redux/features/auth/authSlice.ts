import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type TAuthUser = {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: {
    _id: string;
    name: string;
    permissions: string[];
  };
  employee?: string;
  needsPasswordChange?: boolean;
  lastLoginAt?: string;
};

type TAuthState = {
  user: TAuthUser | null;
  token: string | null;
};

const initialState: TAuthState = {
  user: null,
  token: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: TAuthUser; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
    },
  },
});

export const { setCredentials, setToken, logout } = authSlice.actions;
export default authSlice.reducer;

export const selectCurrentUser = (state: { auth: TAuthState }) =>
  state.auth.user;
export const selectCurrentToken = (state: { auth: TAuthState }) =>
  state.auth.token;
