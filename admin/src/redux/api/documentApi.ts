import { TApiResponse, TQueryParams } from "../../types";
import { baseApi } from "./baseApi";

export type TDocumentTemplate = {
  _id: string;
  name: string;
  type: string;
  description?: string;
  contentHtml: string;
  variables: string[];
  isActive: boolean;
  updatedAt: string;
};

export type TGeneratedDocument = {
  _id: string;
  templateName: string;
  type: string;
  title: string;
  employee?: { _id: string; employeeId: string; fullName: string };
  recipientName?: string;
  reference: string;
  renderedHtml?: string;
  issuedBy?: { _id: string; name: string };
  issuedAt: string;
  createdAt: string;
};

export type TPlaceholder = { key: string; label: string; sample: string };

export const documentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTemplates: builder.query<
      TApiResponse<TDocumentTemplate[]>,
      TQueryParams | void
    >({
      query: (params) => ({ url: "/documents/templates", params: params ?? {} }),
      providesTags: ["DocTemplate"],
    }),
    createTemplate: builder.mutation<
      TApiResponse<TDocumentTemplate>,
      Record<string, unknown>
    >({
      query: (body) => ({ url: "/documents/templates", method: "POST", body }),
      invalidatesTags: ["DocTemplate"],
    }),
    updateTemplate: builder.mutation<
      TApiResponse<TDocumentTemplate>,
      { id: string; body: Record<string, unknown> }
    >({
      query: ({ id, body }) => ({
        url: `/documents/templates/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["DocTemplate"],
    }),
    deleteTemplate: builder.mutation<TApiResponse<null>, string>({
      query: (id) => ({ url: `/documents/templates/${id}`, method: "DELETE" }),
      invalidatesTags: ["DocTemplate"],
    }),

    getPlaceholders: builder.query<TApiResponse<TPlaceholder[]>, string | void>({
      query: (employee) => ({
        url: "/documents/placeholders",
        params: employee ? { employee } : {},
      }),
    }),

    previewDocument: builder.mutation<
      TApiResponse<{
        renderedHtml: string;
        values: Record<string, string>;
        variables: string[];
      }>,
      Record<string, unknown>
    >({
      query: (body) => ({ url: "/documents/preview", method: "POST", body }),
    }),
    generateDocument: builder.mutation<
      TApiResponse<TGeneratedDocument>,
      Record<string, unknown>
    >({
      query: (body) => ({ url: "/documents/generate", method: "POST", body }),
      invalidatesTags: ["DocGenerated"],
    }),

    getGeneratedDocuments: builder.query<
      TApiResponse<TGeneratedDocument[]>,
      TQueryParams | void
    >({
      query: (params) => ({ url: "/documents/generated", params: params ?? {} }),
      providesTags: ["DocGenerated"],
    }),
    getGeneratedDocument: builder.query<TApiResponse<TGeneratedDocument>, string>({
      query: (id) => `/documents/generated/${id}`,
    }),
    deleteGeneratedDocument: builder.mutation<TApiResponse<null>, string>({
      query: (id) => ({ url: `/documents/generated/${id}`, method: "DELETE" }),
      invalidatesTags: ["DocGenerated"],
    }),
  }),
});

export const {
  useGetTemplatesQuery,
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
  useDeleteTemplateMutation,
  useGetPlaceholdersQuery,
  usePreviewDocumentMutation,
  useGenerateDocumentMutation,
  useGetGeneratedDocumentsQuery,
  useGetGeneratedDocumentQuery,
  useDeleteGeneratedDocumentMutation,
} = documentApi;

export const DOCUMENT_TYPES = [
  { value: "offer", label: "Offer letter" },
  { value: "appointment", label: "Appointment letter" },
  { value: "promotion", label: "Promotion letter" },
  { value: "resignation-acceptance", label: "Resignation acceptance" },
  { value: "experience", label: "Experience certificate" },
  { value: "noc", label: "No objection certificate" },
  { value: "warning", label: "Warning letter" },
  { value: "custom", label: "Custom" },
];
