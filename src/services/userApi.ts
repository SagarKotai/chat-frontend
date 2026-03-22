import { baseApi } from '@/services/baseApi';
import type { ApiResponse } from '@/types/api';
import type { User } from '@/types/entities';

interface E2EEDeviceKey {
  deviceId: string;
  publicKey: string;
  createdAt: string;
  lastUsedAt: string;
  revokedAt?: string;
}

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
    getE2EEKeys: builder.query<ApiResponse<E2EEDeviceKey[]>, void>({
      query: () => ({ url: '/users/me/e2ee-keys' }),
      providesTags: ['Users'],
    }),
    upsertE2EEKey: builder.mutation<ApiResponse<E2EEDeviceKey[]>, { deviceId: string; publicKey: string }>({
      query: (body) => ({
        url: '/users/me/e2ee-keys',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Users'],
    }),
    revokeE2EEKey: builder.mutation<ApiResponse<E2EEDeviceKey[]>, { deviceId: string }>({
      query: ({ deviceId }) => ({
        url: `/users/me/e2ee-keys/${encodeURIComponent(deviceId)}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Users'],
    }),
  }),
});

export const {
  useGetCurrentUserProfileQuery,
  useGetUserProfileQuery,
  useSearchUsersQuery,
  useUpdateProfileMutation,
  useGetE2EEKeysQuery,
  useUpsertE2EEKeyMutation,
  useRevokeE2EEKeyMutation,
} = userApi;
