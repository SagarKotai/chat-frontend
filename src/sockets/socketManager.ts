import { io, type Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { env } from '@/lib/env';
import type { AppDispatch, RootState } from '@/app/store';
import type { Message } from '@/types/entities';
import { baseApi } from '@/services/baseApi';
import { setTypingUsers } from '@/features/message/messageUiSlice';
import { chatApi } from '@/services/chatApi';

class SocketManager {
  private socket: Socket | null = null;

  connect(token: string, dispatch: AppDispatch, getState: () => RootState): void {
    if (this.socket?.connected) return;

    this.socket = io(env.socketUrl, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      const selectedChatId = getState().chatUi.selectedChatId;
      if (selectedChatId) this.socket?.emit('chat:join', selectedChatId);
    });

    this.socket.on('message:new', (message: Message) => {
      dispatch(
        baseApi.util.invalidateTags([
          { type: 'Messages', id: message.chat },
          { type: 'Chats', id: 'LIST' },
          { type: 'Notifications', id: 'LIST' },
        ]),
      );
    });

    this.socket.on('notification:new', () => {
      dispatch(baseApi.util.invalidateTags([{ type: 'Notifications', id: 'LIST' }]));
      toast.info('New message notification');
    });

    this.socket.on('typing:start', ({ chatId, userId }: { chatId: string; userId: string }) => {
      const current = getState().messageUi.typingByChatId[chatId] ?? [];
      if (!current.includes(userId)) {
        dispatch(setTypingUsers({ chatId, userIds: [...current, userId] }));
      }
    });

    this.socket.on('typing:stop', ({ chatId, userId }: { chatId: string; userId: string }) => {
      const current = getState().messageUi.typingByChatId[chatId] ?? [];
      dispatch(setTypingUsers({ chatId, userIds: current.filter((id) => id !== userId) }));
    });

    this.socket.on('group:updated', () => {
      dispatch(chatApi.util.invalidateTags([{ type: 'Chats', id: 'LIST' }]));
    });

    this.socket.on('user:online', () => {
      dispatch(chatApi.util.invalidateTags([{ type: 'Chats', id: 'LIST' }]));
    });

    this.socket.on('user:offline', () => {
      dispatch(chatApi.util.invalidateTags([{ type: 'Chats', id: 'LIST' }]));
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  emitJoinChat(chatId: string): void {
    this.socket?.emit('chat:join', chatId);
  }

  emitLeaveChat(chatId: string): void {
    this.socket?.emit('chat:leave', chatId);
  }

  emitTypingStart(chatId: string): void {
    this.socket?.emit('typing:start', chatId);
  }

  emitTypingStop(chatId: string): void {
    this.socket?.emit('typing:stop', chatId);
  }

  emitMessageNew(chatId: string, message: Message, recipientIds: string[]): void {
    this.socket?.emit('message:new', { chatId, message, recipientIds });
  }

  emitMessageRead(chatId: string, senderId: string): void {
    this.socket?.emit('message:read', { chatId, senderId });
  }
}

export const socketManager = new SocketManager();
