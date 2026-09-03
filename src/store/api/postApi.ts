import { Route, POST_PATH } from "@/Breads-Shared/APIConfig";
import type { IPost } from "@/Breads-Shared/Types";
import { api } from "./baseApi";

export interface GetPostsArgs {
  userId: string;
  filterPage: string; // "admin/posts" | "admin/posts/validation"
  user?: string; // authorId, filter.user
  postContent?: string[]; // filter.postContent
  postType?: string[]; // filter.postType
  dateFrom?: string; // filter.dateFrom (ISO date string)
  dateTo?: string; // filter.dateTo (ISO date string)
  page: number;
  limit: number;
}

// BE trả {data, totalCount} CHỈ cho 2 trang admin (post.controller.ts getPosts) — mọi
// filterPage khác (không dùng trong Admin panel) vẫn là mảng thô, không đi qua type này.
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
        // Bước 10: `userId` bỏ khỏi body — BE xét quyền trên `req.user.role`.
        body: { status },
      }),
      invalidatesTags: ["Post"],
    }),
  }),
});

export const { useGetPostsQuery, useUpdatePostStatusMutation } = postApi;
