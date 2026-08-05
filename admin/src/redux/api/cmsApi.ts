import { TApiResponse, TQueryParams } from "../../types";
import { baseApi } from "./baseApi";

/** Maps a CMS resource path to the RTK Query cache tag it invalidates. */
export const CMS_RESOURCES = {
  services: "Service",
  portfolio: "Portfolio",
  "portfolio-categories": "PortfolioCategory",
  testimonials: "Testimonial",
  team: "Team",
  "pricing-plans": "Pricing",
  "pricing-extras": "Pricing",
  "compare-rows": "Pricing",
  faqs: "Faq",
  "process-steps": "Process",
  stats: "Stat",
} as const;

export type TCmsResource = keyof typeof CMS_RESOURCES;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TAny = Record<string, any>;

export const cmsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /* ---- singletons ---- */
    getSiteSettings: builder.query<TApiResponse<TAny>, void>({
      query: () => "/cms/site-settings",
      providesTags: ["SiteSettings"],
    }),
    updateSiteSettings: builder.mutation<TApiResponse<TAny>, TAny>({
      query: (body) => ({ url: "/cms/site-settings", method: "PATCH", body }),
      invalidatesTags: ["SiteSettings"],
    }),
    getTheme: builder.query<TApiResponse<TAny>, void>({
      query: () => "/cms/theme",
      providesTags: ["Theme"],
    }),
    updateTheme: builder.mutation<TApiResponse<TAny>, TAny>({
      query: (body) => ({ url: "/cms/theme", method: "PATCH", body }),
      invalidatesTags: ["Theme"],
    }),

    /* ---- page sections ---- */
    getSections: builder.query<TApiResponse<TAny[]>, string | void>({
      query: (page) => ({ url: "/cms/sections", params: page ? { page } : {} }),
      providesTags: ["Section"],
    }),
    updateSection: builder.mutation<
      TApiResponse<TAny>,
      { page: string; sectionKey: string; body: TAny }
    >({
      query: ({ page, sectionKey, body }) => ({
        url: `/cms/sections/${page}/${sectionKey}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Section"],
    }),

    /* ---- generic collection CRUD (resource passed per call) ---- */
    getCmsList: builder.query<
      TApiResponse<TAny[]>,
      { resource: TCmsResource; params?: TQueryParams }
    >({
      query: ({ resource, params }) => ({ url: `/cms/${resource}`, params: params ?? {} }),
      providesTags: (result, error, arg) => [CMS_RESOURCES[arg.resource]],
    }),
    createCmsItem: builder.mutation<
      TApiResponse<TAny>,
      { resource: TCmsResource; body: TAny }
    >({
      query: ({ resource, body }) => ({
        url: `/cms/${resource}`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, arg) => [CMS_RESOURCES[arg.resource]],
    }),
    updateCmsItem: builder.mutation<
      TApiResponse<TAny>,
      { resource: TCmsResource; id: string; body: TAny }
    >({
      query: ({ resource, id, body }) => ({
        url: `/cms/${resource}/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, arg) => [CMS_RESOURCES[arg.resource]],
    }),
    deleteCmsItem: builder.mutation<
      TApiResponse<null>,
      { resource: TCmsResource; id: string }
    >({
      query: ({ resource, id }) => ({
        url: `/cms/${resource}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, arg) => [CMS_RESOURCES[arg.resource]],
    }),

    uploadMedia: builder.mutation<
      TApiResponse<{ url: string; publicId: string }>,
      FormData
    >({
      query: (body) => ({ url: "/media/upload", method: "POST", body }),
    }),
  }),
});

export const {
  useGetSiteSettingsQuery,
  useUpdateSiteSettingsMutation,
  useGetThemeQuery,
  useUpdateThemeMutation,
  useGetSectionsQuery,
  useUpdateSectionMutation,
  useGetCmsListQuery,
  useCreateCmsItemMutation,
  useUpdateCmsItemMutation,
  useDeleteCmsItemMutation,
  useUploadMediaMutation,
} = cmsApi;
