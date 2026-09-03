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

export interface IReportQueueItem extends IReport {
  media: IReportMedia[];
  userReport: IReportUserInfo;
}

export interface GetReportsArgs {
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
  subject: string;
  html: string;
}

export interface RejectReportArgs {
  id: string;
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
      query: ({ searchValue, page, limit }) => ({
        url: Route.REPORT + REPORT_PATH.GET,
        params: {
          page,
          limit,
          ...(searchValue ? { searchValue } : {}),
        },
      }),
      providesTags: ["Report"],
    }),
    responseReport: builder.mutation<void, ResponseReportArgs>({
      query: ({ id, subject, html }) => ({
        url: Route.REPORT + REPORT_PATH.RESPONSE.replace(":id", id),
        method: "PATCH",
        body: { subject, html },
      }),
      invalidatesTags: ["Report"],
    }),
    rejectReport: builder.mutation<void, RejectReportArgs>({
      query: ({ id }) => ({
        url: Route.REPORT + REPORT_PATH.REJECT.replace(":id", id),
        method: "PATCH",
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
