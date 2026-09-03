import { Route, USER_PATH } from "@/Breads-Shared/APIConfig";
import type { IUser } from "@/Breads-Shared/Types";
import { api } from "./baseApi";

export interface UsersWithStatusResult {
  users: IUser[];
  count: number;
}

export interface GetUsersWithStatusArgs {
  page: number;
  limit: number;
  searchValue?: string;
  role?: number;
  status?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface AdminUpdateUserArgs {
  userId: string;
  role?: number;
  status?: number;
  reason?: string;
}

export interface LoginArgs {
  email: string;
  password: string;
}

export interface LoginResult extends IUser {
  accessToken: string;
}

export interface UserShortInfo {
  _id: string;
  username: string;
  avatar?: string;
}

export interface GetUsersPendingPostArgs {
  page: number;
  limit: number;
  searchValue?: string;
}

export const userApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCurrentUser: builder.query<IUser, void>({
      query: () => ({ url: Route.USER + USER_PATH.ME }),
      providesTags: ["User"],
    }),
    login: builder.mutation<LoginResult, LoginArgs>({
      query: (payload) => ({
        url: Route.USER + USER_PATH.LOGIN,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["User"],
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: Route.USER + USER_PATH.LOGOUT,
        method: "POST",
      }),
      invalidatesTags: ["User"],
    }),
    getUsersWithStatus: builder.query<
      UsersWithStatusResult,
      GetUsersWithStatusArgs
    >({
      query: ({
        page,
        limit,
        searchValue,
        role,
        status,
        dateFrom,
        dateTo,
      }) => ({
        url: Route.USER + USER_PATH.GET_USERS_WITH_STATUS,
        params: { page, limit, searchValue, role, status, dateFrom, dateTo },
      }),
      providesTags: ["User"],
    }),
    getUserAdminDetail: builder.query<IUser, string>({
      query: (userId) => ({
        url: Route.USER + USER_PATH.ADMIN_DETAIL.replace(":id", userId),
      }),
      providesTags: ["User"],
    }),
    adminUpdateUser: builder.mutation<IUser, AdminUpdateUserArgs>({
      query: ({ userId, role, status, reason }) => ({
        url: Route.USER + USER_PATH.ADMIN_ACTION.replace(":id", userId),
        method: "PUT",
        body: { role, status, reason },
      }),
      invalidatesTags: ["User"],
    }),
    getUsersPendingPost: builder.query<UserShortInfo[], GetUsersPendingPostArgs>({
      query: (payload) => ({
        url: Route.USER + USER_PATH.GET_USERS_PENDING_POST,
        method: "POST",
        body: payload,
      }),
    }),
  }),
});

export const {
  useGetCurrentUserQuery,
  useLoginMutation,
  useLogoutMutation,
  useGetUsersWithStatusQuery,
  useLazyGetUsersWithStatusQuery,
  useGetUserAdminDetailQuery,
  useAdminUpdateUserMutation,
  useGetUsersPendingPostQuery,
  useLazyGetUsersPendingPostQuery,
} = userApi;
