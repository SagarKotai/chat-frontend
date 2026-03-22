import { baseApi } from '@/services/baseApi';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type { Message } from '@/types/entities';

interface ChatSummary {
  title: string;
  totalMessages: number;
  activeParticipants: string[];
  highlights: string[];
}

export const messageApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMessages: builder.query<
      ApiResponse<PaginatedResponse<Message>>,
      { chatId: string; page?: number; limit?: number }
    >({
      query: ({ chatId, page = 1, limit = 30 }) => ({
        url: `/messages/${chatId}?page=${page}&limit=${limit}`,
      }),
      providesTags: (_res, _err, arg) => [{ type: 'Messages', id: arg.chatId }],
    }),
    searchMessages: builder.query<ApiResponse<Message[]>, { q: string; chatId?: string; limit?: number }>({
      query: ({ q, chatId, limit = 30 }) => ({
        url: `/messages/search/all?q=${encodeURIComponent(q)}${chatId ? `&chatId=${encodeURIComponent(chatId)}` : ''}&limit=${limit}`,
      }),
      providesTags: ['Messages'],
    }),
    getSmartReplies: builder.query<ApiResponse<string[]>, { chatId: string }>({
      query: ({ chatId }) => ({ url: `/messages/${chatId}/smart-replies` }),
      providesTags: ['Messages'],
    }),
    getChatSummary: builder.query<ApiResponse<ChatSummary>, { chatId: string }>({
      query: ({ chatId }) => ({ url: `/messages/${chatId}/summary` }),
      providesTags: ['Messages'],
    }),
    sendMessage: builder.mutation<
      ApiResponse<Message>,
      {
        chatId: string;
        content?: string;
        replyTo?: string;
        file?: File;
        isEncrypted?: boolean;
        encryptedFor?: Record<string, string>;
      }
    >({
      query: ({ chatId, content, replyTo, file, isEncrypted, encryptedFor }) => {
        const formData = new FormData();
        if (content) formData.append('content', content);
        if (replyTo) formData.append('replyTo', replyTo);
        if (file) formData.append('file', file);
        if (isEncrypted) formData.append('isEncrypted', 'true');
        if (encryptedFor && Object.keys(encryptedFor).length > 0) {
          formData.append('encryptedFor', JSON.stringify(encryptedFor));
        }

        return {
          url: `/messages/${chatId}`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: (_res, _err, arg) => [
        { type: 'Messages', id: arg.chatId },
        { type: 'Chats', id: 'LIST' },
        { type: 'Notifications', id: 'LIST' },
      ],
    }),
    markChatRead: builder.mutation<ApiResponse<null>, { chatId: string }>({
      query: ({ chatId }) => ({ url: `/messages/${chatId}/read/all`, method: 'PATCH' }),
      invalidatesTags: (_res, _err, arg) => [
        { type: 'Messages', id: arg.chatId },
        { type: 'Chats', id: 'LIST' },
      ],
    }),
    editMessage: builder.mutation<ApiResponse<Message>, { id: string; content: string; chatId: string }>({
      query: ({ id, content }) => ({
        url: `/messages/${id}`,
        method: 'PATCH',
        body: { content },
      }),
      invalidatesTags: (_res, _err, arg) => [{ type: 'Messages', id: arg.chatId }],
    }),
    deleteMessage: builder.mutation<ApiResponse<Message>, { id: string; chatId: string }>({
      query: ({ id }) => ({ url: `/messages/${id}`, method: 'DELETE' }),
      invalidatesTags: (_res, _err, arg) => [{ type: 'Messages', id: arg.chatId }],
    }),
  }),
});

export const {
  useGetMessagesQuery,
  useSearchMessagesQuery,
  useGetSmartRepliesQuery,
  useGetChatSummaryQuery,
  useSendMessageMutation,
  useMarkChatReadMutation,
  useEditMessageMutation,
  useDeleteMessageMutation,
} = messageApi;
