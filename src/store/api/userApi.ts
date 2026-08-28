import { Route, USER_PATH } from "@/Breads-Shared/APIConfig";
import type { IUser } from "@/Breads-Shared/Types";
import { api } from "./baseApi";

export interface UsersWithStatusResult {
  users: IUser[];
  count: number;
}

export interface GetUsersWithStatusArgs {
  userId: string;
  page: number;
  limit: number;
  searchValue?: string;
}

export interface UpdateUserStatusArgs {
  userId: string;
  status: number;
}

export const userApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCurrentUser: builder.query<IUser, void>({
      query: () => ({ url: Route.USER + USER_PATH.ME }),
      providesTags: ["User"],
    }),
    getUsersWithStatus: builder.query<
      UsersWithStatusResult,
      GetUsersWithStatusArgs
    >({
      query: ({ userId, page, limit, searchValue }) => ({
        url: Route.USER + USER_PATH.GET_USERS_WITH_STATUS,
        params: { userId, page, limit, searchValue },
      }),
      providesTags: ["User"],
    }),
    updateUserStatus: builder.mutation<IUser, UpdateUserStatusArgs>({
      query: ({ userId, status }) => ({
        url: Route.USER + USER_PATH.UPDATE.replace(":id", userId),
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useGetCurrentUserQuery,
  useGetUsersWithStatusQuery,
  useUpdateUserStatusMutation,
} = userApi;
