import { Route, REPORT_PATH } from "@/Breads-Shared/APIConfig";
import { api } from "./baseApi";

export interface IReport {
  _id: string;
  content: string;
  status: number;
  createdAt: string;
}

export interface IReportMedia {
  url: string;
  type?: string;
}

export interface IReportUserInfo {
  _id: string;
  username: string;
  avatar?: string;
  name?: string;
  email: string;
}

// getReports (queue PENDING) trả thêm media + userReport — khác IReport gốc
// (dùng cho getReportsByUser, chỉ select content/status/createdAt).
export interface IReportQueueItem extends IReport {
  media: IReportMedia[];
  userReport: IReportUserInfo;
}

export interface GetReportsArgs {
  userId: string;
  searchValue?: string;
  page: number;
  limit: number;
}

export interface GetReportsResult {
  data: IReportQueueItem[];
  totalCount: number;
}

export interface ResponseReportArgs {
  id: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  userId: string;
}

export interface RejectReportArgs {
  id: string;
  userId: string;
}

export const reportApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getReportsByUser: builder.query<IReport[], string>({
      query: (userId) => ({
        url: Route.REPORT + REPORT_PATH.GET_BY_USER.replace(":id", userId),
      }),
      providesTags: ["Report"],
    }),
    getReports: builder.query<GetReportsResult, GetReportsArgs>({
      query: ({ userId, searchValue, page, limit }) => ({
        url: Route.REPORT + REPORT_PATH.GET,
        params: {
          userId,
          page,
          limit,
          ...(searchValue ? { searchValue } : {}),
        },
      }),
      providesTags: ["Report"],
    }),
    responseReport: builder.mutation<void, ResponseReportArgs>({
      query: ({ id, from, to, subject, html, userId }) => ({
        url: Route.REPORT + REPORT_PATH.RESPONSE.replace(":id", id),
        method: "PATCH",
        body: { from, to, subject, html, userId },
      }),
      invalidatesTags: ["Report"],
    }),
    rejectReport: builder.mutation<void, RejectReportArgs>({
      query: ({ id, userId }) => ({
        url: Route.REPORT + REPORT_PATH.REJECT.replace(":id", id),
        method: "PATCH",
        body: { userId },
      }),
      invalidatesTags: ["Report"],
    }),
  }),
});

export const {
  useGetReportsByUserQuery,
  useGetReportsQuery,
  useResponseReportMutation,
  useRejectReportMutation,
} = reportApi;
