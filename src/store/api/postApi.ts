import { Route, POST_PATH } from "@/Breads-Shared/APIConfig";
import type { IPost } from "@/Breads-Shared/Types";
import { api } from "./baseApi";

export interface GetPostsArgs {
  userId: string;
  filterPage: string;
  user?: string;
  postContent?: string[];
  postType?: string[];
  dateFrom?: string;
  dateTo?: string;
  page: number;
  limit: number;
}

export interface GetPostsResult {
  data: IPost[];
  totalCount: number;
}

export interface UpdatePostStatusArgs {
  postId: string;
  status: number;
}

export const postApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPosts: builder.query<GetPostsResult, GetPostsArgs>({
      query: ({
        userId,
        filterPage,
        user,
        postContent,
        postType,
        dateFrom,
        dateTo,
        page,
        limit,
      }) => ({
        url: Route.POST + POST_PATH.GET_ALL,
        params: {
          userId,
          page,
          limit,
          "filter[page]": filterPage,
          ...(user !== undefined ? { "filter[user]": user } : {}),
          ...(postContent?.length ? { "filter[postContent]": postContent } : {}),
          ...(postType?.length ? { "filter[postType]": postType } : {}),
          ...(dateFrom ? { "filter[dateFrom]": dateFrom } : {}),
          ...(dateTo ? { "filter[dateTo]": dateTo } : {}),
        },
      }),
      providesTags: ["Post"],
    }),
    updatePostStatus: builder.mutation<void, UpdatePostStatusArgs>({
      query: ({ postId, status }) => ({
        url: Route.POST + POST_PATH.UPDATE_POST_STATUS.replace(":id", postId),
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Post"],
    }),
  }),
});

export const { useGetPostsQuery, useUpdatePostStatusMutation } = postApi;
