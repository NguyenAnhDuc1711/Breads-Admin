import { Route, REPORT_PATH } from "@/Breads-Shared/APIConfig";
import { api } from "./baseApi";

export interface IReport {
  _id: string;
  content: string;
  status: number;
  createdAt: string;
}

export const reportApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getReportsByUser: builder.query<IReport[], string>({
      query: (userId) => ({
        url: Route.REPORT + REPORT_PATH.GET_BY_USER.replace(":id", userId),
      }),
      providesTags: ["Report"],
    }),
  }),
});

export const { useGetReportsByUserQuery } = reportApi;
