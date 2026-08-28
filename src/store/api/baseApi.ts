import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { API_PREFIX, Route, USER_PATH } from "@/Breads-Shared/APIConfig";
import {
  ensureFreshAccessToken,
  getAccessToken,
  setAccessToken,
} from "@/Breads-Shared/Auth/TokenManager";
import { serverUrl } from "@/config/env";

const refreshUrl =
  serverUrl + API_PREFIX + Route.USER + USER_PATH.REFRESH_TOKEN;

const rawBaseQuery = fetchBaseQuery({
  baseUrl: serverUrl + API_PREFIX,
  credentials: "include",
  prepareHeaders: (headers) => {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

// BE wraps success bodies as { metadata }; unwrap once here instead of
// repeating it in every injected endpoint's transformResponse.
const unwrap = (data: unknown) =>
  data && typeof data === "object" && "metadata" in (data as any)
    ? (data as any).metadata
    : data;

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  const error = result.error as
    | (FetchBaseQueryError & { data?: { code?: string } })
    | undefined;
  const url = typeof args === "string" ? args : args.url;
  const isRefreshCall = url.includes(USER_PATH.REFRESH_TOKEN);

  if (
    error?.status === 401 &&
    error.data?.code === "TOKEN_EXPIRED" &&
    !isRefreshCall
  ) {
    try {
      await ensureFreshAccessToken(refreshUrl);
      result = await rawBaseQuery(args, api, extraOptions);
    } catch {
      setAccessToken(null);
      window.location.href = "/login";
    }
  }

  if (result.data !== undefined) {
    result.data = unwrap(result.data);
  }

  return result;
};

// Shared instance — feature slices add endpoints via api.injectEndpoints
// instead of each calling createApi separately.
export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [],
  endpoints: () => ({}),
});
