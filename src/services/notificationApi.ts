import { baseApi } from '@/services/baseApi';
import type { ApiResponse } from '@/types/api';
import type { Notification } from '@/types/entities';

interface NotificationsPayload {
  data: Notification[];
  totalCount: number;
  page: number;
  totalPages: number;
  unreadCount: number;
}

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<ApiResponse<NotificationsPayload>, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 20 }) => ({
        url: `/notifications?page=${page}&limit=${limit}`,
      }),
      providesTags: [{ type: 'Notifications', id: 'LIST' }],
    }),
    markAllNotificationsRead: builder.mutation<ApiResponse<null>, void>({
      query: () => ({ url: '/notifications/read/all', method: 'PATCH' }),
      invalidatesTags: [{ type: 'Notifications', id: 'LIST' }],
    }),
    markNotificationRead: builder.mutation<ApiResponse<Notification>, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'PATCH' }),
      invalidatesTags: [{ type: 'Notifications', id: 'LIST' }],
    }),
    deleteNotification: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/notifications/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Notifications', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useDeleteNotificationMutation,
} = notificationApi;
