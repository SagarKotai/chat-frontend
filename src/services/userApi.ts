import { baseApi } from '@/services/baseApi';
import type { ApiResponse } from '@/types/api';
import type { User } from '@/types/entities';

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCurrentUserProfile: builder.query<ApiResponse<User>, void>({
      query: () => ({ url: '/users/me' }),
      providesTags: ['Users'],
    }),
    getUserProfile: builder.query<ApiResponse<User>, string>({
      query: (id) => ({ url: `/users/${id}` }),
      providesTags: (_res, _err, id) => [{ type: 'Users', id }],
    }),
    searchUsers: builder.query<ApiResponse<User[]>, string>({
      query: (q) => ({ url: `/users/search?q=${encodeURIComponent(q)}` }),
      providesTags: ['Users'],
    }),
    updateProfile: builder.mutation<ApiResponse<User>, FormData>({
      query: (formData) => ({
        url: '/users/me',
        method: 'PATCH',
        body: formData,
      }),
      invalidatesTags: ['Users', 'Auth'],
    }),
  }),
});

export const {
  useGetCurrentUserProfileQuery,
  useGetUserProfileQuery,
  useSearchUsersQuery,
  useUpdateProfileMutation,
} = userApi;
