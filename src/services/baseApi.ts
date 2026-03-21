import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { env } from '@/lib/env';
import type { RootState } from '@/app/store';
import { logoutLocally, setAccessToken } from '@/features/auth/authSlice';
import type { ApiResponse } from '@/types/api';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: env.apiBaseUrl,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const refreshResult = await rawBaseQuery({ url: '/auth/refresh', method: 'POST' }, api, extraOptions);

    if (refreshResult.data) {
      const parsed = refreshResult.data as ApiResponse<{ accessToken: string }>;
      if (parsed.success && parsed.data?.accessToken) {
        api.dispatch(setAccessToken(parsed.data.accessToken));
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        api.dispatch(logoutLocally());
      }
    } else {
      api.dispatch(logoutLocally());
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Auth', 'Users', 'Chats', 'Messages', 'Notifications'],
  endpoints: () => ({}),
});
