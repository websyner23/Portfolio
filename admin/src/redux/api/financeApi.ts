import { TApiResponse, TQueryParams } from "../../types";
import { baseApi } from "./baseApi";

export type TAccount = {
  _id: string;
  name: string;
  type: "cash" | "bank" | "mobile-banking" | "other";
  openingBalance: number;
  balance: number;
  accountNumber?: string;
  isActive: boolean;
};

export type TTransaction = {
  _id: string;
  type: "income" | "expense" | "salary" | "transfer";
  amount: number;
  account: { _id: string; name: string };
  toAccount?: { _id: string; name: string };
  category?: string;
  date: string;
  description?: string;
  employee?: { _id: string; fullName: string };
  project?: { _id: string; name: string };
  payroll?: string;
};

export type TReceivable = {
  _id: string;
  title: string;
  client?: string;
  amount: number;
  dueDate?: string;
  status: "pending" | "partial" | "paid" | "written-off";
  payments: { amount: number; date: string; note?: string }[];
  paidAmount: number;
};

export type TPayrollRecord = {
  _id: string;
  employee: { _id: string; employeeId: string; fullName: string; designation?: string };
  month: string;
  scheduledDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  leaveDays: number;
  attendancePct: number;
  bonusEligible: boolean;
  baseSalary: number;
  bonus: number;
  adjustment: number;
  adjustmentNote?: string;
  netPayable: number;
  status: "draft" | "approved" | "paid";
  paidAt?: string;
};

export type TFinanceOverview = {
  month: string;
  accounts: TAccount[];
  totals: {
    balance: number;
    monthIncome: number;
    monthExpense: number;
    monthNet: number;
    pendingIncome: number;
    pendingPayroll: number;
    activeEmployees: number;
  };
  trend: { month: string; income: number; expense: number }[];
  incomeByProject: { _id: string; name: string; total: number }[];
  upcomingReceivables: TReceivable[];
};

export const financeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFinanceOverview: builder.query<TApiResponse<TFinanceOverview>, string | void>({
      query: (month) => ({
        url: "/finance/overview",
        params: month ? { month } : {},
      }),
      providesTags: ["Finance"],
    }),

    getAccounts: builder.query<TApiResponse<TAccount[]>, void>({
      query: () => "/finance/accounts",
      providesTags: ["Account"],
    }),
    createAccount: builder.mutation<TApiResponse<TAccount>, Record<string, unknown>>({
      query: (body) => ({ url: "/finance/accounts", method: "POST", body }),
      invalidatesTags: ["Account", "Finance"],
    }),
    updateAccount: builder.mutation<
      TApiResponse<TAccount>,
      { id: string; body: Record<string, unknown> }
    >({
      query: ({ id, body }) => ({
        url: `/finance/accounts/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Account", "Finance"],
    }),

    getTransactions: builder.query<TApiResponse<TTransaction[]>, TQueryParams | void>({
      query: (params) => ({ url: "/finance/transactions", params: params ?? {} }),
      providesTags: ["Transaction"],
    }),
    createTransaction: builder.mutation<
      TApiResponse<TTransaction>,
      Record<string, unknown>
    >({
      query: (body) => ({ url: "/finance/transactions", method: "POST", body }),
      invalidatesTags: ["Transaction", "Account", "Finance"],
    }),
    deleteTransaction: builder.mutation<TApiResponse<null>, string>({
      query: (id) => ({ url: `/finance/transactions/${id}`, method: "DELETE" }),
      invalidatesTags: ["Transaction", "Account", "Finance"],
    }),

    getReceivables: builder.query<TApiResponse<TReceivable[]>, TQueryParams | void>({
      query: (params) => ({ url: "/finance/receivables", params: params ?? {} }),
      providesTags: ["Receivable"],
    }),
    createReceivable: builder.mutation<
      TApiResponse<TReceivable>,
      Record<string, unknown>
    >({
      query: (body) => ({ url: "/finance/receivables", method: "POST", body }),
      invalidatesTags: ["Receivable", "Finance"],
    }),
    addReceivablePayment: builder.mutation<
      TApiResponse<TReceivable>,
      { id: string; body: Record<string, unknown> }
    >({
      query: ({ id, body }) => ({
        url: `/finance/receivables/${id}/payments`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Receivable", "Transaction", "Account", "Finance"],
    }),
    deleteReceivable: builder.mutation<TApiResponse<null>, string>({
      query: (id) => ({ url: `/finance/receivables/${id}`, method: "DELETE" }),
      invalidatesTags: ["Receivable", "Finance"],
    }),

    getPayroll: builder.query<
      TApiResponse<{
        month: string;
        records: TPayrollRecord[];
        totals: Record<string, number>;
      }>,
      string
    >({
      query: (month) => ({ url: "/finance/payroll", params: { month } }),
      providesTags: ["Payroll"],
    }),
    generatePayroll: builder.mutation<TApiResponse<Record<string, number>>, string>({
      query: (month) => ({
        url: "/finance/payroll/generate",
        method: "POST",
        body: { month },
      }),
      invalidatesTags: ["Payroll"],
    }),
    updatePayrollRecord: builder.mutation<
      TApiResponse<TPayrollRecord>,
      { id: string; body: Record<string, unknown> }
    >({
      query: ({ id, body }) => ({
        url: `/finance/payroll/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Payroll"],
    }),
    paySalary: builder.mutation<
      TApiResponse<TPayrollRecord>,
      { id: string; body: { account: string; date: string } }
    >({
      query: ({ id, body }) => ({
        url: `/finance/payroll/${id}/pay`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Payroll", "Transaction", "Account", "Finance"],
    }),
  }),
});

export const {
  useGetFinanceOverviewQuery,
  useGetAccountsQuery,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useGetTransactionsQuery,
  useCreateTransactionMutation,
  useDeleteTransactionMutation,
  useGetReceivablesQuery,
  useCreateReceivableMutation,
  useAddReceivablePaymentMutation,
  useDeleteReceivableMutation,
  useGetPayrollQuery,
  useGeneratePayrollMutation,
  useUpdatePayrollRecordMutation,
  usePaySalaryMutation,
} = financeApi;
