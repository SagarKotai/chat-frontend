import { io, type Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { env } from '@/lib/env';
import type { AppDispatch, RootState } from '@/app/store';
import type { Message } from '@/types/entities';
import type { MessageReadEvent } from '@/types/socket';
import { baseApi } from '@/services/baseApi';
import { setTypingUsers } from '@/features/message/messageUiSlice';
import { chatApi } from '@/services/chatApi';
import { showBrowserNotification } from '@/lib/browserNotifications';

class SocketManager {
  private socket: Socket | null = null;
  private offerHandler: ((payload: { fromUserId: string; chatId: string; sdp: RTCSessionDescriptionInit; video: boolean }) => void) | null = null;
  private answerHandler: ((payload: { fromUserId: string; chatId: string; sdp: RTCSessionDescriptionInit }) => void) | null = null;
  private iceHandler: ((payload: { fromUserId: string; chatId: string; candidate: RTCIceCandidateInit }) => void) | null = null;
  private endHandler: ((payload: { fromUserId: string; chatId: string }) => void) | null = null;

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
      const currentUserId = getState().auth.user?._id;
      dispatch(
        baseApi.util.invalidateTags([
          { type: 'Messages', id: message.chat },
          { type: 'Chats', id: 'LIST' },
          { type: 'Notifications', id: 'LIST' },
        ]),
      );

      if (message.sender._id !== currentUserId) {
        this.emitMessageDelivered(message._id);
      }
    });

    this.socket.on('notification:new', (payload?: { message?: Message }) => {
      dispatch(baseApi.util.invalidateTags([{ type: 'Notifications', id: 'LIST' }]));
      toast.info('New message notification');

      const senderName = payload?.message?.sender?.name ?? 'New message';
      const preview = payload?.message?.content || payload?.message?.fileName || 'Open chat to view';
      void showBrowserNotification(senderName, {
        body: preview,
        tag: payload?.message?.chat ?? 'chat-notification',
        data: { chatId: payload?.message?.chat },
      });
    });

    this.socket.on('message:delivered', ({ chatId }: { messageId: string; chatId: string }) => {
      dispatch(
        baseApi.util.invalidateTags([
          { type: 'Messages', id: chatId },
          { type: 'Chats', id: 'LIST' },
        ]),
      );
    });

    this.socket.on('message:read', ({ chatId }: MessageReadEvent) => {
      dispatch(
        baseApi.util.invalidateTags([
          { type: 'Messages', id: chatId },
          { type: 'Chats', id: 'LIST' },
        ]),
      );
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

    this.socket.on('sync:required', () => {
      dispatch(
        baseApi.util.invalidateTags([
          'Messages',
          { type: 'Chats', id: 'LIST' },
          { type: 'Notifications', id: 'LIST' },
        ]),
      );
    });

    this.socket.on('user:online', () => {
      dispatch(chatApi.util.invalidateTags([{ type: 'Chats', id: 'LIST' }]));
    });

    this.socket.on('user:offline', () => {
      dispatch(chatApi.util.invalidateTags([{ type: 'Chats', id: 'LIST' }]));
    });

    this.socket.on('call:offer', (payload) => {
      this.offerHandler?.(payload);
    });

    this.socket.on('call:answer', (payload) => {
      this.answerHandler?.(payload);
    });

    this.socket.on('call:ice-candidate', (payload) => {
      this.iceHandler?.(payload);
    });

    this.socket.on('call:end', (payload) => {
      this.endHandler?.(payload);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.offerHandler = null;
    this.answerHandler = null;
    this.iceHandler = null;
    this.endHandler = null;
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

  emitMessageDelivered(messageId: string): void {
    this.socket?.emit('message:delivered', { messageId });
  }

  emitMessageRead(chatId: string): void {
    this.socket?.emit('message:read', { chatId });
  }

  emitCallOffer(payload: {
    targetUserId: string;
    chatId: string;
    sdp: RTCSessionDescriptionInit;
    video: boolean;
  }): void {
    this.socket?.emit('call:offer', payload);
  }

  emitCallAnswer(payload: { targetUserId: string; chatId: string; sdp: RTCSessionDescriptionInit }): void {
    this.socket?.emit('call:answer', payload);
  }

  emitCallIceCandidate(payload: {
    targetUserId: string;
    chatId: string;
    candidate: RTCIceCandidateInit;
  }): void {
    this.socket?.emit('call:ice-candidate', payload);
  }

  emitCallEnd(payload: { targetUserId: string; chatId: string }): void {
    this.socket?.emit('call:end', payload);
  }

  onCallOffer(
    handler: (payload: {
      fromUserId: string;
      chatId: string;
      sdp: RTCSessionDescriptionInit;
      video: boolean;
    }) => void,
  ): void {
    this.offerHandler = handler;
  }

  onCallAnswer(handler: (payload: { fromUserId: string; chatId: string; sdp: RTCSessionDescriptionInit }) => void): void {
    this.answerHandler = handler;
  }

  onCallIceCandidate(
    handler: (payload: { fromUserId: string; chatId: string; candidate: RTCIceCandidateInit }) => void,
  ): void {
    this.iceHandler = handler;
  }

  onCallEnd(handler: (payload: { fromUserId: string; chatId: string }) => void): void {
    this.endHandler = handler;
  }
}

export const socketManager = new SocketManager();
