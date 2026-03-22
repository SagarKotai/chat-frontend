import type { Message, Chat } from '@/types/entities';

export interface TypingEvent {
  chatId: string;
  userId: string;
}

export interface MessageDeliveredEvent {
  messageId: string;
  chatId: string;
  deliveredBy: string;
}

export interface MessageReadEvent {
  chatId: string;
  readBy: string;
  messageIds?: string[];
}

export interface NotificationSocketEvent {
  chatId: string;
  message: Message;
}

export interface GroupUpdatedEvent {
  chatId: string;
  chat: Chat;
}
