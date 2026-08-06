import { TApiResponse, TQueryParams } from "../../types";
import { baseApi } from "./baseApi";

export type TProjectUser = {
  _id: string;
  name: string;
  email?: string;
  avatar?: string;
};

export type TTask = {
  _id: string;
  title: string;
  status: "todo" | "in-progress" | "review" | "done";
  assignee?: TProjectUser;
  dueDate?: string;
};

export type TProject = {
  _id: string;
  name: string;
  code: string;
  client?: { name?: string; email?: string; company?: string };
  description?: string;
  status: "proposal" | "active" | "on-hold" | "review" | "completed" | "cancelled";
  priority: "low" | "medium" | "high";
  startDate?: string;
  deadline?: string;
  budgetAmount: number;
  members: TProjectUser[];
  lead?: TProjectUser;
  tasks: TTask[];
  tags: string[];
  progress: number;
  createdAt: string;
};

export type TMessage = {
  _id: string;
  project: string;
  sender: TProjectUser;
  body: string;
  attachments?: { url: string; name: string }[];
  system?: boolean;
  createdAt: string;
};

export const projectApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProjects: builder.query<
      TApiResponse<{ projects: TProject[]; unread: Record<string, number> }>,
      TQueryParams | void
    >({
      query: (params) => ({ url: "/projects", params: params ?? {} }),
      providesTags: ["Project"],
    }),
    getProject: builder.query<TApiResponse<TProject>, string>({
      query: (id) => `/projects/${id}`,
      providesTags: ["Project"],
    }),
    createProject: builder.mutation<TApiResponse<TProject>, Record<string, unknown>>({
      query: (body) => ({ url: "/projects", method: "POST", body }),
      invalidatesTags: ["Project"],
    }),
    updateProject: builder.mutation<
      TApiResponse<TProject>,
      { id: string; body: Record<string, unknown> }
    >({
      query: ({ id, body }) => ({ url: `/projects/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Project"],
    }),
    deleteProject: builder.mutation<TApiResponse<null>, string>({
      query: (id) => ({ url: `/projects/${id}`, method: "DELETE" }),
      invalidatesTags: ["Project"],
    }),

    addTask: builder.mutation<
      TApiResponse<TProject>,
      { id: string; body: Record<string, unknown> }
    >({
      query: ({ id, body }) => ({
        url: `/projects/${id}/tasks`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Project"],
    }),
    updateTask: builder.mutation<
      TApiResponse<TProject>,
      { id: string; taskId: string; body: Record<string, unknown> }
    >({
      query: ({ id, taskId, body }) => ({
        url: `/projects/${id}/tasks/${taskId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Project"],
    }),
    deleteTask: builder.mutation<
      TApiResponse<TProject>,
      { id: string; taskId: string }
    >({
      query: ({ id, taskId }) => ({
        url: `/projects/${id}/tasks/${taskId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Project"],
    }),

    getMessages: builder.query<
      TApiResponse<{
        messages: TMessage[];
        hasMore: boolean;
        nextCursor: string | null;
      }>,
      { id: string; before?: string; limit?: number }
    >({
      query: ({ id, ...params }) => ({
        url: `/projects/${id}/messages`,
        params,
      }),
      providesTags: ["Message"],
    }),
    sendMessageRest: builder.mutation<
      TApiResponse<TMessage>,
      { id: string; body: string }
    >({
      query: ({ id, body }) => ({
        url: `/projects/${id}/messages`,
        method: "POST",
        body: { body },
      }),
    }),
    markMessagesRead: builder.mutation<TApiResponse<null>, string>({
      query: (id) => ({
        url: `/projects/${id}/messages/read`,
        method: "PATCH",
      }),
      invalidatesTags: ["Project"],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useAddTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useGetMessagesQuery,
  useSendMessageRestMutation,
  useMarkMessagesReadMutation,
} = projectApi;

export const PROJECT_STATUSES = [
  { value: "proposal", label: "Proposal", color: "default" },
  { value: "active", label: "Active", color: "green" },
  { value: "review", label: "In review", color: "blue" },
  { value: "on-hold", label: "On hold", color: "gold" },
  { value: "completed", label: "Completed", color: "cyan" },
  { value: "cancelled", label: "Cancelled", color: "red" },
];

export const TASK_STATUSES = [
  { value: "todo", label: "To do", color: "default" },
  { value: "in-progress", label: "In progress", color: "blue" },
  { value: "review", label: "Review", color: "gold" },
  { value: "done", label: "Done", color: "green" },
];
