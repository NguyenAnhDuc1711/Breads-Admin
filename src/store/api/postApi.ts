import { Route, POST_PATH } from "@/Breads-Shared/APIConfig";
import type { IPost } from "@/Breads-Shared/Types";
import { api } from "./baseApi";

export interface GetPostsArgs {
  userId: string;
  filterPage: string; // "admin/posts" | "admin/posts/validation"
  user?: string; // authorId, filter.user
  postContent?: string[]; // filter.postContent
  postType?: string[]; // filter.postType
  page: number;
  limit: number;
}

export interface UpdatePostStatusArgs {
  postId: string;
  userId: string;
  status: number;
}

export const postApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPosts: builder.query<IPost[], GetPostsArgs>({
      query: ({ userId, filterPage, user, postContent, postType, page, limit }) => ({
        url: Route.POST + POST_PATH.GET_ALL,
        params: {
          userId,
          page,
          limit,
          "filter[page]": filterPage,
          ...(user !== undefined ? { "filter[user]": user } : {}),
          ...(postContent?.length ? { "filter[postContent]": postContent } : {}),
          ...(postType?.length ? { "filter[postType]": postType } : {}),
        },
      }),
      providesTags: ["Post"],
    }),
    updatePostStatus: builder.mutation<void, UpdatePostStatusArgs>({
      query: ({ postId, userId, status }) => ({
        url: Route.POST + POST_PATH.UPDATE_POST_STATUS.replace(":id", postId),
        method: "PATCH",
        body: { userId, status },
      }),
      invalidatesTags: ["Post"],
    }),
  }),
});

export const { useGetPostsQuery, useUpdatePostStatusMutation } = postApi;
