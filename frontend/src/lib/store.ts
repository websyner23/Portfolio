import { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

type UiState = {
  mobileNavOpen: boolean;
  contactDialogOpen: boolean;
  selectedPlan: string | null;
};

const uiInitial: UiState = {
  mobileNavOpen: false,
  contactDialogOpen: false,
  selectedPlan: null,
};

const uiSlice = createSlice({
  name: "ui",
  initialState: uiInitial,
  reducers: {
    setMobileNavOpen(state, action: PayloadAction<boolean>) {
      state.mobileNavOpen = action.payload;
    },
    setContactDialogOpen(state, action: PayloadAction<boolean>) {
      state.contactDialogOpen = action.payload;
    },
    setSelectedPlan(state, action: PayloadAction<string | null>) {
      state.selectedPlan = action.payload;
    },
  },
});

type LeadDraft = {
  name: string;
  email: string;
  service: string;
  budget: string;
  message: string;
  updatedAt: number;
};

type LeadsState = { draft: LeadDraft | null; submitted: boolean };

const leadsInitial: LeadsState = { draft: null, submitted: false };

const leadsSlice = createSlice({
  name: "leads",
  initialState: leadsInitial,
  reducers: {
    saveDraft(state, action: PayloadAction<Omit<LeadDraft, "updatedAt">>) {
      state.draft = { ...action.payload, updatedAt: Date.now() };
    },
    markSubmitted(state) {
      state.submitted = true;
      state.draft = null;
    },
    resetSubmitted(state) {
      state.submitted = false;
    },
  },
});

export const { setMobileNavOpen, setContactDialogOpen, setSelectedPlan } = uiSlice.actions;
export const { saveDraft, markSubmitted, resetSubmitted } = leadsSlice.actions;

export const makeStore = () =>
  configureStore({
    reducer: {
      ui: uiSlice.reducer,
      leads: leadsSlice.reducer,
    },
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
