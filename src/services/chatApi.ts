import { baseApi } from '@/services/baseApi';
import type { ApiResponse } from '@/types/api';
import type { Chat } from '@/types/entities';

export const chatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    accessOrCreateChat: builder.mutation<ApiResponse<Chat>, { userId: string }>({
      query: (body) => ({ url: '/chats', method: 'POST', body }),
      invalidatesTags: [{ type: 'Chats', id: 'LIST' }],
    }),
    getChats: builder.query<ApiResponse<Chat[]>, void>({
      query: () => ({ url: '/chats' }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((chat) => ({ type: 'Chats' as const, id: chat._id })),
              { type: 'Chats' as const, id: 'LIST' },
            ]
          : [{ type: 'Chats' as const, id: 'LIST' }],
    }),
    getChatById: builder.query<ApiResponse<Chat>, string>({
      query: (chatId) => ({ url: `/chats/${chatId}` }),
      providesTags: (_res, _err, chatId) => [{ type: 'Chats', id: chatId }],
    }),
    createGroupChat: builder.mutation<ApiResponse<Chat>, FormData>({
      query: (formData) => ({
        url: '/chats/group',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: [{ type: 'Chats', id: 'LIST' }],
    }),
    renameGroupChat: builder.mutation<ApiResponse<Chat>, { id: string; name: string }>({
      query: ({ id, name }) => ({
        url: `/chats/${id}/rename`,
        method: 'PATCH',
        body: { name },
      }),
      invalidatesTags: (_res, _err, args) => [{ type: 'Chats', id: args.id }],
    }),
    addParticipants: builder.mutation<ApiResponse<Chat>, { id: string; userIds: string[] }>({
      query: ({ id, userIds }) => ({
        url: `/chats/${id}/participants`,
        method: 'PUT',
        body: { userIds },
      }),
      invalidatesTags: (_res, _err, args) => [{ type: 'Chats', id: args.id }],
    }),
    removeParticipant: builder.mutation<ApiResponse<Chat>, { id: string; userId: string }>({
      query: ({ id, userId }) => ({
        url: `/chats/${id}/participants/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, args) => [{ type: 'Chats', id: args.id }],
    }),
    promoteAdmin: builder.mutation<ApiResponse<Chat>, { id: string; userId: string }>({
      query: ({ id, userId }) => ({
        url: `/chats/${id}/admin`,
        method: 'PATCH',
        body: { userId },
      }),
      invalidatesTags: (_res, _err, args) => [{ type: 'Chats', id: args.id }],
    }),
  }),
});

export const {
  useAccessOrCreateChatMutation,
  useGetChatsQuery,
  useGetChatByIdQuery,
  useCreateGroupChatMutation,
  useRenameGroupChatMutation,
  useAddParticipantsMutation,
  useRemoveParticipantMutation,
  usePromoteAdminMutation,
} = chatApi;
