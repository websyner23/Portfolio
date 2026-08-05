import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type TUiState = {
  themeMode: "light" | "dark";
  sidebarCollapsed: boolean;
};

const initialState: TUiState = {
  themeMode: "dark",
  sidebarCollapsed: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<"light" | "dark">) => {
      state.themeMode = action.payload;
    },
    toggleTheme: (state) => {
      state.themeMode = state.themeMode === "dark" ? "light" : "dark";
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
  },
});

export const { setThemeMode, toggleTheme, setSidebarCollapsed } =
  uiSlice.actions;
export default uiSlice.reducer;
